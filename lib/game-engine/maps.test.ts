import { describe,it,expect } from 'vitest';
import { PUSHUP_SONGS, songsFor } from '../shared/pushup-songs';
import { GameSession } from './session';
import { validateMap } from './validator';
import { validateWorkLimits } from './work-limits';
import { accuracy } from './scoring';
import type { ExerciseId } from '../shared/types';

describe('playable Move Along exercise maps',()=>{
 const exercises: ExerciseId[] = ['pushup','squat'];
 for(const song of exercises.flatMap(exercise=>songsFor(exercise))){
  it(`${song.title} passes grammar and safe-work limits`,()=>{expect(validateMap(song.map)).toEqual([]);if(song.map.mode!=='flow')expect(validateWorkLimits(song.map)).toEqual([]);});
  if(song.map.mode==='flow')continue;
  it(`${song.title} completes end to end with perfect input and holds`,()=>{
   const game=new GameSession(song.map);let cursor=0;
   for(let t=0;t<=song.map.durationMs;t+=10){
    while(cursor<game.notes.length&&game.notes[cursor].note.time+game.latency<=t){const note=game.notes[cursor++].note;if(note.type==='UP'||note.type==='DOWN')game.input(note.type,note.time,true);}
    game.tick(t,true,1,true);
   }
   expect(game.stats.perfect).toBe(song.map.notes.length);expect(game.stats.miss).toBe(0);expect(accuracy(game.stats)).toBe(1);
   expect(game.stats.workoutTimeMs).toBe(song.map.durationMs);
  });
 }
 it('rejects faster cues and bottom holds',()=>{
  const map=structuredClone(PUSHUP_SONGS[0].map);map.notes[1].time=map.notes[0].time+1900;map.notes.find(n=>n.type==='HOLD')!.position='BOTTOM';
  expect(validateWorkLimits(map).join(' ')).toContain('two seconds');expect(validateWorkLimits(map).join(' ')).toContain('TOP');
 });
 it('does not reset accumulated work at holds or an unscored gap',()=>{
  const map=structuredClone(PUSHUP_SONGS[0].map);map.rests=[];expect(validateWorkLimits(map).join(' ')).toContain('exceeds 30');
 });
 it('rejects abbreviated recovery',()=>{
  const map=structuredClone(PUSHUP_SONGS[0].map);map.rests[0].endMs=map.rests[0].startMs+8000;expect(validateWorkLimits(map).join(' ')).toContain('15 seconds');
 });
});
