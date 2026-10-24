import { expect, it } from 'vitest';
import { GameSession } from './session';
import { analyzeSession } from './analysis';
import { songsFor } from '../shared/pushup-songs';
it('partial results exclude unplayed cues and distinguish frame coverage from posture',()=>{
 const game=new GameSession(songsFor('pushup')[0].map);
 game.input('DOWN',game.notes[0].note.time+200,true);
 const result=analyzeSession(game.notes,game.stats,20,15,false);
 expect(result).toMatchObject({judged:1,weightedPoints:75,averageErrorMs:200,coverage:75,pending:game.notes.length-1});
 expect(analyzeSession(game.notes,game.stats,20,15,true).coverage).toBeNull();
 expect(analyzeSession([],game.stats,0,0,false).averageErrorMs).toBeNull();
});
