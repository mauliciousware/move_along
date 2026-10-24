import { describe, expect, it, vi } from 'vitest';
import map from '../../data/beatmaps/dev-test.json';
import type { BeatMap } from '../shared/pushup-types';
vi.mock('../audio-engine/transport',()=>({AudioTransport:class {
 isRunning=true;unlock=vi.fn(async()=>{});time=-2800;offsetMs=0;load=vi.fn(async()=>({}));start=vi.fn(async()=>{});pause=vi.fn(async()=>{});resume=vi.fn(async()=>{});stop=vi.fn();miss=vi.fn();hit=vi.fn();getSongTimeMs(){return this.time;}perfToSongMs(t:number){return t;}
}}));
import { GameRuntime } from './runtime';
function advance(runtime:GameRuntime,song:number,perf=song){Object.assign(runtime.audio,{time:song});runtime.tick(perf);}
describe('runtime controls',()=>{
 it('runs countdown, gates input, pauses without advancing, then resumes at the same song time',async()=>{
  const r=new GameRuntime(map as BeatMap);r.setKeyboard(true);await r.start();advance(r,-2100,100);expect(r.getSnapshot().count).toBe('2');advance(r,0,2800);expect(r.getSnapshot().phase).toBe('playing');
  r.input({type:'DOWN',tPerfMs:4120});advance(r,4120);expect(r.game.stats.perfect).toBe(1);
  r.pause();r.input({type:'UP',tPerfMs:6120});advance(r,6120);expect(r.songMs).toBe(4120);expect(r.game.stats.perfect).toBe(1);
  await r.resume();advance(r,4120);expect(r.songMs).toBe(4120);expect(r.game.stats.perfect).toBe(1);
 });
 it('skips on tracking loss, auto-pauses long loss, and waits for reentry',async()=>{
  const r=new GameRuntime(map as BeatMap);await r.start();advance(r,0);r.setTracking('LOST');advance(r,4700);expect(r.game.stats.skipped).toBe(1);expect(r.game.stats.miss).toBe(0);
  r.setTracking('LOST_LONG');expect(r.getSnapshot().phase).toBe('lost');r.setTracking('TRACKING');expect(r.getSnapshot().phase).toBe('lost');r.reenter();expect(r.getSnapshot().phase).toBe('reentry');r.setTracking('LOST');expect(r.getSnapshot().phase).toBe('lost');
 });
 it('ends early without judging future notes and ignores pending loading completion after stop',async()=>{
  const r=new GameRuntime(map as BeatMap);const pending=r.start();r.end(true);await pending;expect(r.getSnapshot().phase).toBe('ended');expect(r.game.stats.endedEarly).toBe(true);expect(r.game.stats.miss).toBe(0);
 });
});
