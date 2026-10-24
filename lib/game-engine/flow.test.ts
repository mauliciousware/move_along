import { describe, expect, it } from 'vitest';
import { songsFor } from '../shared/pushup-songs';
import { flowNotes } from './flow';
import { GameSession } from './session';
import { validateMap } from './validator';

const flow = () => new GameSession(songsFor('pushup')[0].map);

describe('flow push-up script', () => {
  it('builds three sets of eight reps with 10/10/8 second holds and no rests', () => {
    const notes = flowNotes();
    expect(notes.filter(note => note.type === 'UP')).toHaveLength(24);
    expect(notes.filter(note => note.type === 'DOWN')).toHaveLength(24);
    expect(notes.filter(note => note.type === 'HOLD').map(note => note.duration)).toEqual([10000, 10000, 8000]);
    expect(notes.filter(note => note.type === 'HOLD').every(note => note.position === 'TOP')).toBe(true);
  });

  it('marks the push-up songs as rest-free flow maps and validates them', () => {
    const maps = songsFor('pushup').map(song => song.map);
    expect(maps.every(map => map.mode === 'flow' && map.rests.length === 0)).toBe(true);
    expect(validateMap(maps[0])).toEqual([]);
  });

  it('rejects scripts that do not alternate or do not hold at the top', () => {
    const base = songsFor('pushup')[0].map;
    const firstUp = structuredClone(base);
    firstUp.notes[0].type = 'UP';
    expect(validateMap(firstUp).join(' ')).toContain('DOWN');

    const earlyHold = structuredClone(base);
    earlyHold.notes[1] = { ...earlyHold.notes[1], type: 'HOLD', duration: 10000, position: 'TOP' };
    expect(validateMap(earlyHold).join(' ')).toContain('HOLD');

    const longHold = structuredClone(base);
    longHold.notes.find(note => note.type === 'HOLD')!.duration = 30000;
    expect(validateMap(longHold).join(' ')).toContain('HOLD');
  });
});

describe('flow push-up session', () => {
  it('waits for each direction and ignores wrong or untracked input', () => {
    const game = flow();
    expect(game.current?.note.type).toBe('DOWN');
    game.input('UP', 1000, true);
    game.input('DOWN', 1000, false);
    expect(game.stats.pushups).toBe(0);
    expect(game.current?.note.type).toBe('DOWN');
    game.input('DOWN', 1000, true);
    expect(game.current?.note.type).toBe('UP');
    game.input('UP', 2000, true);
    expect(game.stats.pushups).toBe(1);
    expect(game.current?.note.type).toBe('DOWN');
    expect(game.stats.miss).toBe(0);
  });

  it('never expires a target, however long the player takes', () => {
    const game = flow();
    game.tick(60000, true, 1, true);
    expect(game.stats.miss).toBe(0);
    expect(game.current?.note.type).toBe('DOWN');
  });

  it('counts a hold only while tracking is present and steady', () => {
    const game = flow();
    for (let index = 0; index < 16; index++) game.input(index % 2 ? 'UP' : 'DOWN', index, true);
    expect(game.current?.note.type).toBe('HOLD');

    game.tick(0, true, 1, true);
    game.tick(3000, false, 1, true);
    expect(game.current?.meter?.valueMs).toBe(0);
    game.tick(6000, true, 1, false);
    expect(game.current?.meter?.valueMs).toBe(0);

    let time = 6000;
    let guard = 0;
    while (game.current?.meter && guard++ < 2000) {
      time += 50;
      game.tick(time, true, 1, true);
    }
    expect(game.current?.note.type).toBe('DOWN');
    expect(game.stats.plankTimeMs).toBeGreaterThanOrEqual(10000);
  });

  it('runs all 24 reps and three holds to completion with no misses', () => {
    const game = flow();
    let time = 0;
    let guard = 0;
    while (!game.complete && guard++ < 20000) {
      const target = game.current!;
      time += 50;
      if (target.meter) game.tick(time, true, 1, true);
      else game.input(target.note.type as 'DOWN' | 'UP', time, true);
      game.tick(time, true, 1, true);
    }
    expect(game.complete).toBe(true);
    expect(game.stats.pushups).toBe(24);
    expect(game.stats.plankTimeMs).toBe(28000);
    expect(game.stats.miss).toBe(0);
    expect(game.stats.perfect).toBe(51);
    expect(game.flowSummary).toMatchObject({ set: 3, sets: 3, reps: 24, totalReps: 24, holdsDone: 3, holdsTotal: 3, complete: true });
  });
});
