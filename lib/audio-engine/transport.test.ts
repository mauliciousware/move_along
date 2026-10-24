import { describe, expect, it, vi } from 'vitest';
const fixture=vi.hoisted(()=>{
 const param=()=>({value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),cancelAndHoldAtTime:vi.fn()});
 const node=()=>({connect:vi.fn(function(this:unknown){return this;}),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),gain:param(),frequency:param(),buffer:null,type:'',onended:null});
 const ctx={currentTime:10,outputLatency:.02,baseLatency:.01,state:'running',decodeAudioData:vi.fn(async()=>({})),destination:{},resume:vi.fn(async()=>{}),suspend:vi.fn(async()=>{}),createBufferSource:vi.fn(node),createGain:vi.fn(node),createBiquadFilter:vi.fn(node),createOscillator:vi.fn(node),getOutputTimestamp:vi.fn(()=>({contextTime:11,performanceTime:1000}))};
 return {ctx};
});
vi.mock('./cues',()=>({getAudioContext:()=>fixture.ctx}));
import { AudioTransport } from './transport';
import { PUSHUP_CONFIG } from '../shared/config';
describe('audio clock',()=>{
 it('loads and caches each selected track independently with its own offset',async()=>{
  const fetcher=vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)}));vi.stubGlobal('fetch',fetcher);
  try {
   const first=new AudioTransport('/audio/test-first.mp3',25),second=new AudioTransport('/audio/test-second.mp3',-10);
   await first.load();await first.load();await second.load();
   expect(fetcher.mock.calls).toEqual([['/audio/test-first.mp3',expect.objectContaining({signal:expect.any(AbortSignal)})],['/audio/test-second.mp3',expect.objectContaining({signal:expect.any(AbortSignal)})]]);
   expect(first.offsetMs).toBe(25);expect(second.offsetMs).toBe(-10);
  } finally {vi.unstubAllGlobals();}
 });
 it('schedules song after countdown and uses output timestamp without double-subtracting latency',async()=>{
  const audio=new AudioTransport();fixture.ctx.currentTime=10;await audio.start({} as AudioBuffer);
  expect(fixture.ctx.createBufferSource.mock.results.at(-1)?.value.start).toHaveBeenCalledWith(12.8);
  fixture.ctx.currentTime=13.8;expect(audio.getSongTimeMs()).toBeCloseTo(980);
  expect(audio.perfToSongMs(2900)).toBeCloseTo(100);
  audio.offsetMs=10;expect(audio.getSongTimeMs()).toBeCloseTo(990);
  await audio.pause();fixture.ctx.currentTime+=20;expect(audio.getSongTimeMs()).toBeCloseTo(990);
  await audio.resume();expect(audio.getSongTimeMs()).toBeCloseTo(990);audio.stop();
 });
 it('parks the source for calibration and resumes at the identical audio position',async()=>{
  const audio=new AudioTransport();fixture.ctx.currentTime=10;await audio.start({} as AudioBuffer);fixture.ctx.currentTime=20;
  const before=audio.getSongTimeMs();await audio.parkForCalibration();fixture.ctx.currentTime=35;
  expect(audio.getSongTimeMs()).toBe(before);await audio.resume();expect(audio.getSongTimeMs()).toBeCloseTo(before);
  expect(fixture.ctx.createBufferSource.mock.results.at(-1)?.value.start).toHaveBeenCalledWith(35,7.199999999999999);audio.stop();
 });
 it('uses elapsed performance time fallback when output timestamps are unavailable',async()=>{
  const audio=new AudioTransport();fixture.ctx.currentTime=10;await audio.start({} as AudioBuffer);fixture.ctx.currentTime=14;
  fixture.ctx.getOutputTimestamp.mockReturnValueOnce({contextTime:0,performanceTime:0});
  vi.spyOn(performance,'now').mockReturnValueOnce(2000);expect(audio.perfToSongMs(1900)).toBeCloseTo(1080);vi.restoreAllMocks();audio.stop();
 });
 it('STOP cancels delayed start and resume before either can recreate a source',async()=>{
  const audio=new AudioTransport();
  let resolve!:()=>void;
  vi.spyOn(audio,'unlock').mockImplementation(()=>new Promise<void>(done=>{resolve=done;}));
  const before=fixture.ctx.createBufferSource.mock.calls.length;
  const pending=audio.start({} as AudioBuffer);audio.stop();resolve();await pending;
  expect(fixture.ctx.createBufferSource.mock.calls.length).toBe(before);
  const resume=audio.resume();audio.stop();resolve();await resume;
  expect(fixture.ctx.createBufferSource.mock.calls.length).toBe(before);
 });

 it('times out a stalled decoder and permits a fresh retry of the same track',async()=>{
  vi.useFakeTimers();
  const fetcher=vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)}));
  vi.stubGlobal('fetch',fetcher);
  fixture.ctx.decodeAudioData.mockImplementationOnce(()=>new Promise(()=>{}));
  try {
   const audio=new AudioTransport('/audio/stalled-decoder.mp3');
   const failure=expect(audio.load()).rejects.toThrow('Music took too long');
   await vi.advanceTimersByTimeAsync(PUSHUP_CONFIG.audioSession.loadTimeoutMs);
   await failure;
   await audio.load();
   expect(fetcher).toHaveBeenCalledTimes(2);
  } finally {vi.useRealTimers();vi.unstubAllGlobals();}
 });

});
