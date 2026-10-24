import { describe, expect, it } from 'vitest';
import devMap from '../../data/beatmaps/dev-test.json';
import type { BeatMap } from '../shared/pushup-types';
import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import { GameSession } from './session';
import { movementFill, movementGuidance, targetCue } from './targets';

const game = () => new GameSession(structuredClone(devMap) as BeatMap);

describe('fixed target gameplay', () => {
  it('fills at calibrated thresholds, clamps overshoot, and rejects invalid positions', () => {
    expect(movementFill('UP', CONFIG.thresholds.up)).toBe(1);
    expect(movementFill('DOWN', CONFIG.thresholds.down)).toBe(1);
    expect(movementFill('UP', 0)).toBe(0);
    expect(movementFill('DOWN', 1)).toBe(0);
    expect(movementFill('UP', 3)).toBe(1);
    expect(movementFill('DOWN', -1)).toBe(1);
    expect(movementFill('UP', NaN)).toBe(0);
  });
  it('previews the opposite cue and switches immediately after a hit', () => {
    const session = game();
    const before = targetCue(session, 4000);
    expect(before.current?.note.type).toBe('DOWN');
    expect(before.next?.note.type).toBe('UP');
    session.input('DOWN', 4000, true);
    expect(targetCue(session, 4120).current?.note.type).toBe('UP');
    session.input('DOWN', 4000, true);
    expect(session.stats.perfect).toBe(1);
  });
  it('does not activate distant targets or invent movement during rest', () => {
    const session = game();
    expect(targetCue(session, 0).approaching).toBe(false);
    expect(targetCue(session, 4000).approaching).toBe(true);
    const rest = session.map.rests[0];
    expect(rest).toBeDefined();
    expect(targetCue(session, rest.startMs).current).toBeUndefined();
    expect(targetCue(session, rest.startMs).rest).toBe(rest);
  });
  it('uses the same latency correction as input judgment for the timing bar', () => {
    const session = game();
    session.latency = 230;
    const cue = targetCue(session, 4230);
    expect(cue.remainingMs).toBe(0);
    expect(cue.timing).toBe(1);
  });
  it('blocks a future opposite target while the current target is still pending', () => {
    const session = game();
    session.input('UP', 6000, true);
    expect(session.stats.score).toBe(0);
    session.tick(6120, true, 1, true);
    expect(session.stats.miss).toBe(1);
    expect(targetCue(session, 6120).current?.note.type).toBe('UP');
    session.input('UP', 6000, true);
    expect(session.stats.perfect).toBe(1);
  });
  it('advances past skipped cues without breaking the combo', () => {
    const session = game();
    session.input('DOWN', 4000, true);
    session.tick(6621, false, 1, false);
    expect(session.stats.combo).toBe(1);
    expect(session.stats.skipped).toBe(1);
    expect(targetCue(session, 6621).current?.note.type).toBe('DOWN');
  });
});


describe('movement guidance', () => {
  it('separates preparation from the move cue and position from scoring', () => {
    const session = game();
    expect(movementGuidance(session, 2500, 1, true, true).prompt).toBe('GET READY');
    const move = movementGuidance(session, 3800, 0, true, true);
    expect(move.prompt).toBe('DOWN NOW');
    expect(move.fill).toBe(1);
    expect(move.status).toBe('POSITION REACHED');
    expect(session.judgment).toBeNull();
    expect(session.stats.score).toBe(0);
  });
  it('acknowledges an early crossing without awarding it or asking for another pump', () => {
    const session = game();
    session.input('DOWN', 2800, true);
    const cue = movementGuidance(session, 3800, 0, true, true);
    expect(cue.prompt).toBe('REACHED EARLY');
    expect(cue.status).toBe('FOLLOW THE NEXT CUE');
    expect(session.stats.score).toBe(0);
    session.tick(4700, true, 0, true);
    expect(session.stats.miss).toBe(1);
    expect(movementGuidance(session, 4700, 0, true, true).early).toBe(false);
    expect(targetCue(session, 4700).current?.note.type).toBe('UP');
  });
  it('ignores wrong-direction and untracked early input', () => {
    const session = game();
    session.input('UP', 2800, true);
    session.input('DOWN', 2800, false);
    expect(session.earlyArrivalId).toBeNull();
  });
  it('suppresses active movement on pause, tracking loss, rests and holds', () => {
    const session = game();
    expect(movementGuidance(session, 3800, 0, true, false).active).toBe(false);
    expect(movementGuidance(session, 3800, 0, false, true).active).toBe(false);
    expect(movementGuidance(session, session.map.rests[0].startMs, 0, true, true).active).toBe(false);
    const hold = session.notes.find(n => n.note.type === 'HOLD')!;
    for (const n of session.notes) if (n.note.time < hold.note.time) n.status = 'skipped';
    expect(movementGuidance(session, hold.note.time, 1, true, true).active).toBe(false);
  });
});
