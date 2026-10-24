import { describe, expect, it } from 'vitest';
import { sessionFeedback } from './feedback';
import { newStats } from './scoring';
import { GameSession, type PlayedNote } from './session';
import devMap from '../../data/beatmaps/dev-test.json';
import type { BeatMap } from '../shared/pushup-types';
const note=(type:'UP'|'DOWN'|'HOLD',status:PlayedNote['status'],delta?:number):PlayedNote=>({note:{id:'x',type,time:4000,duration:0},status,delta,meter:null,judgedAt:4000,referenceMs:0,referenceSum:0});
describe('session coaching is grounded in observed game data',()=>{
  it('does not infer early or late movement from misses or skips',()=>{
    const result=sessionFeedback([note('DOWN','miss'),note('UP','skipped')],newStats());
    expect(result.next).toContain('Not enough');expect(result.highlight).not.toContain('strongest');
  });
  it('reports early scored hits only with enough evidence',()=>{
    const rows=[...Array.from({length:3},()=>note('DOWN','good',-200)),...Array.from({length:3},()=>note('UP','perfect',0))];
    const result=sessionFeedback(rows,newStats());
    expect(result.highlight).toContain('UP timing');expect(result.next).toContain('scored DOWN hits were early');
  });
  it('reports late timing without asking for faster exercise',()=>{
    const result=sessionFeedback(Array.from({length:6},()=>note('UP','ok',400)),newStats());
    expect(result.next).toContain('preview');expect(result.next).toContain('late');
  });
  it('gates camera observations and never gives them in keyboard mode',()=>{
    expect(sessionFeedback([],newStats(),false,100,0).tracking).toBeUndefined();
    expect(sessionFeedback([],newStats(),true,5,0).tracking).toContain('Not enough');
    expect(sessionFeedback([],newStats(),true,100,30).next).toContain('camera framing');
  });
  it('does not praise failed holds',()=>{
    expect(sessionFeedback([note('HOLD','miss')],newStats()).highlight).not.toContain('steady');
    expect(sessionFeedback([note('HOLD','good')],newStats()).highlight).toContain('steady');
  });
  it('records actual judgment offsets and resets between sessions',()=>{
    const session=new GameSession(structuredClone(devMap) as BeatMap);
    session.input('DOWN',3800,true);expect(session.notes[0].delta).toBe(-200);
    const fresh=new GameSession(structuredClone(devMap) as BeatMap);expect(fresh.notes[0].delta).toBeUndefined();
    expect(sessionFeedback(fresh.notes,fresh.stats).next).toContain('Not enough');
  });
});
