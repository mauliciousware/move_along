import { describe, expect, it, vi } from 'vitest';
const fixture=vi.hoisted(()=>{
 const param=()=>({value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),cancelAndHoldAtTime:vi.fn()});
 const node=()=>({connect:vi.fn(function(this:unknown){return this;}),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),gain:param(),frequency:param(),buffer:null,type:'',onended:null});
 const ctx={currentTime:10,outputLatency:.02,baseLatency:.01,state:'running',decodeAudioData:vi.fn(async()=>({})),destination:{},resume:vi.fn(async()=>{}),suspend:vi.fn(async()=>{}),createBufferSource:vi.fn(node),createGain:vi.fn(node),createBiquadFilter:vi.fn(node),createOscillator:vi.fn(node),getOutputTimestamp:vi.fn(()=>({contextTime:11,performanceTime:1000}))};
 return {ctx};
});
vi.mock('./cues',()=>({getAudioContext:()=>fixture.ctx}));
import { AudioTransport } from './transport';
describe('audio clock',()=>{
 it('loads and caches each selected track independently with its own offset',async()=>{
  const fetcher=vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)}));vi.stubGlobal('fetch',fetcher);
  try {
   const first=new AudioTransport('/audio/test-first.mp3',25),second=new AudioTransport('/audio/test-second.mp3',-10);
   await first.load();await first.load();await second.load();
   expect(fetcher.mock.calls).toEqual([['/audio/test-first.mp3'],['/audio/test-second.mp3']]);
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
  await audio.resume();expect(fixture.ctx.resume).toHaveBeenCalled();audio.stop();
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
});
