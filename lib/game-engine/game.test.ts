import { describe, expect, it } from 'vitest';
import devMap from '../../data/beatmaps/dev-test.json';
import type { BeatMap } from '../shared/pushup-types';
import { GameSession } from './session';
import { HoldMeter } from './hold';
import { accuracy, accuracyLabel, award, gradeDelta, multiplier, newStats, rank } from './scoring';
import { validateMap } from './validator';
const map=()=>structuredClone(devMap) as BeatMap;
describe('judgment and scheduler',()=>{
  it.each([[0,'perfect'],[149,'perfect'],[151,'good'],[299,'good'],[301,'ok'],[499,'ok'],[501,null]] as const)('grades %i ms as %s',(delta,grade)=>{expect(gradeDelta(delta)).toBe(grade);expect(gradeDelta(-delta)).toBe(grade);});
  it('ignores early/wrong input and scores a tile only once',()=>{
    const game=new GameSession(map());game.input('DOWN',3499,true);game.input('UP',4000,true);expect(game.stats.score).toBe(0);
    game.input('DOWN',4000,true);game.input('DOWN',4000,true);expect(game.stats.perfect).toBe(1);expect(game.stats.combo).toBe(1);
  });
  it('expires only after the late window plus latency; skips during tracking loss',()=>{
    const game=new GameSession(map());game.tick(4620,true,1,false);expect(game.stats.miss).toBe(0);game.tick(4621,true,1,false);expect(game.stats.miss).toBe(1);
    game.tick(6621,false,1,false);expect(game.stats.skipped).toBe(1);expect(game.stats.miss).toBe(1);
  });
  it('preserves combo on SKIPPED and excludes skipped/unreached from accuracy',()=>{
    const game=new GameSession(map());game.input('DOWN',4000,true);game.tick(6621,false,1,false);expect(game.stats.combo).toBe(1);expect(accuracy(game.stats)).toBe(1);
  });
  it('completes the entire 90-second map with perfect timestamped input, including a pause',()=>{
    const game=new GameSession(map());let next=0;
    for(let ms=0;ms<=90000;ms+=10){
      while(next<game.notes.length && game.notes[next].note.time+120<=ms){const note=game.notes[next++].note;if(note.type==='UP'||note.type==='DOWN')game.input(note.type,note.time,true);}
      game.tick(ms,true,1,true);
      if(ms===27500)for(let paused=0;paused<300;paused++)game.tick(ms,true,1,true);
    }
    expect(game.stats.perfect).toBe(37);expect(game.stats.miss).toBe(0);expect(game.stats.maxCombo).toBe(37);expect(rank(game.stats)).toBe('S');expect(accuracy(game.stats)).toBe(1);expect(game.stats.workoutTimeMs).toBe(90000);expect(game.stats.plankTimeMs).toBe(11000);
  });
  it('uses the pre-hold reference and allows small positional jitter, but drains for drift',()=>{
    const game=new GameSession(map());
    for(let t=15700;t<=20000;t+=10)game.tick(t,true,.65+Math.sin(t)*.01,true);
    expect(game.notes.find(n=>n.note.type==='HOLD')?.status).toBe('perfect');
    const drift=new GameSession(map());
    for(let t=15700;t<=20000;t+=10)drift.tick(t,true,t<=16000?.9:.6,true);
    expect(drift.notes.find(n=>n.note.type==='HOLD')?.status).toBe('miss');
  });
  it('skips a hold interrupted by tracking and awards no stable time over a render stall',()=>{
    const game=new GameSession(map());for(let t=15700;t<=20000;t+=10)game.tick(t,t!==17000,1,true);expect(game.notes.find(n=>n.note.type==='HOLD')?.status).toBe('skipped');
    const stalled=new GameSession(map());stalled.tick(15700,true,1,true);stalled.tick(20000,true,1,true);expect(stalled.stats.plankTimeMs).toBe(0);
  });
});
describe('score math',()=>{
  it.each([[9,1],[10,1.2],[19,1.2],[20,1.5],[29,1.5],[30,2],[49,2],[50,3]])('combo %i multiplier %f',(c,m)=>expect(multiplier(c)).toBe(m));
  it('does not round accuracy across a rank boundary',()=>{const s=newStats();s.perfect=34;s.miss=3;expect(accuracyLabel(s)).toBe('91.8%');expect(rank(s)).toBe('A');});
  it('uses combo before increment, doubles hold points, and resets on miss',()=>{const s=newStats();s.combo=9;award(s,'perfect');expect(s.score).toBe(100);award(s,'perfect',true);expect(s.score).toBe(340);award(s,'miss');expect(s.combo).toBe(0);expect(s.maxCombo).toBe(11);});
  it('matches weighted accuracy and rank boundaries',()=>{const s=newStats();s.perfect=92;s.miss=8;expect(rank(s)).toBe('S');s.perfect=80;s.miss=20;expect(rank(s)).toBe('A');s.perfect=65;s.miss=35;expect(rank(s)).toBe('B');s.perfect=64;s.miss=36;expect(rank(s)).toBe('C');const small=newStats();small.perfect=19;expect(rank(small)).toBe('—');small.good=1;expect(accuracy(small)).toBe(.9875);});
});
describe('hold meter',()=>{
  it('fills, caps and drains at 1.5x without resetting',()=>{const h=new HoldMeter(3000);h.update(2000,true,true);h.update(500,false,true);expect(h.valueMs).toBe(1250);h.update(5000,true,true);expect(h.ratio).toBe(1);h.update(5000,false,true);expect(h.valueMs).toBe(0);});
  it.each([[.95,'perfect'],[.85,'good'],[.70,'ok'],[.69,'miss']] as const)('grades ratio %f',(ratio,grade)=>{const h=new HoldMeter(3000);h.update(3000*ratio,true,true);expect(h.grade()).toBe(grade);});
});
describe('map validator',()=>{
  it('accepts the deterministic fixture',()=>expect(validateMap(map())).toEqual([]));
  it.each(['LEFT','RIGHT','LH','RH'])('rejects %s',(type)=>{const m=map();m.notes[0].type=type as 'HOLD';expect(validateMap(m).join()).toContain('unsupported');});
  it('rejects broken alternation, first UP and sub-floor gaps',()=>{const m=map();m.notes[1].type='DOWN';m.notes[1].time=4500;expect(validateMap(m).join()).toContain('alternate');expect(validateMap(m).join()).toContain('hard floor');m.notes[0].type='UP';expect(validateMap(m).join()).toContain('alternate');});
  it('rejects overlap with a hold, rests and excessive hold duration',()=>{const m=map();m.notes[5].time=16000;expect(validateMap(m).join()).toContain('overlaps HOLD');m.notes[6].duration=9000;expect(validateMap(m).join()).toContain('duration');m.notes[8].time=42000;expect(validateMap(m).join()).toContain('REST');});
  it('rejects 11 consecutive fast reps',()=>{const m=map();m.rests=[];m.notes=Array.from({length:22},(_,i)=>({id:`fast-${i}`,time:4000+i*1000,type:i%2?'UP':'DOWN',duration:0}));expect(validateMap(m).join()).toContain('ten fast reps');});
  it('rejects over forty seconds of uninterrupted work',()=>{const m=map();m.rests=[];m.notes=Array.from({length:24},(_,i)=>({id:`slow-${i}`,time:4000+i*2000,type:i%2?'UP':'DOWN',duration:0}));expect(validateMap(m).join()).toContain('40 seconds');});
  it('rejects wrong-position/bottom-long holds and malformed metadata',()=>{const m=map();m.notes[6].position='BOTTOM';expect(validateMap(m).join()).toContain('wrong position');expect(validateMap(m).join()).toContain('duration');m.durationMs=NaN;expect(validateMap(m).join()).toContain('header');});
});
