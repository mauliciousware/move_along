import { describe, expect, it, vi, afterEach } from 'vitest';
import { CALIBRATION_STEPS, CalibrationSession, validCalibration, saveCalibration, loadCalibration } from './calibration';
import type { PoseFrame } from '../shared/pushup-types';
const pose=(t:number,y:number,ok=true):PoseFrame=>({tPerfMs:t,nose:{x:.5,y},waist:{x:.5,y},shoulderWidth:.4,confidence:ok?.9:0,ok});
function steady(session:CalibrationSession,start:number,end:number,y:number) {
  for(let t=start;t<=end;t+=50) session.update(pose(t,y),t);
}
const valid={joint:'nose' as const,centerX:.5,centerY:.4,topY:.35,bottomY:.6,scale:.4};
afterEach(()=>vi.unstubAllGlobals());
describe('hands-free calibration',()=>{
  it('collects stable medians and completes MIDDLE -> UP -> DOWN once',()=>{
    const onChange=vi.fn();const session=new CalibrationSession('pushup',0,onChange);
    steady(session,0,2600,.45);expect(session.state.step).toBe(1);
    steady(session,2650,5200,.35);expect(session.state.step).toBe(2);
    steady(session,5250,7900,.65);expect(session.state.phase).toBe('ready');
    expect(session.result).toEqual({joint:'nose',centerX:.5,centerY:.45,topY:.35,bottomY:.65,scale:.4});
    const changes=onChange.mock.calls.length;steady(session,7950,12000,.65);expect(onChange).toHaveBeenCalledTimes(changes);
  });
  it('gives the user time to settle before measuring the middle position',()=>{
    const session=new CalibrationSession('pushup',0,()=>{});
    steady(session,0,2000,.45);expect(session.state.step).toBe(0);
    steady(session,2050,2600,.45);expect(session.state.step).toBe(1);
  });
  it('stays on UP instead of jumping to DOWN while the middle position is held',()=>{
    const session=new CalibrationSession('pushup',0,()=>{});
    steady(session,0,15000,.45);
    expect(session.state.step).toBe(1);expect(session.state.phase).toBe('measuring');expect(session.result).toBeNull();
  });
  it('requires a real lift for UP and a real drop for DOWN',()=>{
    const session=new CalibrationSession('pushup',0,()=>{});
    steady(session,0,2600,.45);expect(session.state.step).toBe(1);
    steady(session,2650,5200,.44);expect(session.state.step).toBe(1);
    steady(session,5250,7800,.38);expect(session.state.step).toBe(2);
    steady(session,7850,10400,.50);expect(session.state.phase).toBe('measuring');expect(session.result).toBeNull();
    steady(session,10450,13000,.62);expect(session.state.phase).toBe('ready');
    expect(session.result?.topY).toBe(.38);expect(session.result?.bottomY).toBe(.62);
  });
  it('repeats instruction at ten seconds, offers retry at twenty, and restarts on a stable middle',()=>{
    const session=new CalibrationSession('pushup',0,()=>{});
    session.update(null,10000);expect(session.state.phase).toBe('measuring');expect(session.state.revision).toBe(1);
    session.update(null,20000);expect(session.state.phase).toBe('retry');
    steady(session,20050,23050,.4);expect(session.state.phase).toBe('measuring');expect(session.state.step).toBe(0);
  });
  it('does not accept frozen frames, gaps, jitter or low-confidence frames',()=>{
    const session=new CalibrationSession('pushup',0,()=>{});
    for(let t=0;t<3000;t+=50) session.update(pose(0,.4),t);
    expect(session.state.step).toBe(0);
    for(let t=3000;t<6000;t+=50) session.update(pose(t,t%100?.42:.38),t);
    expect(session.state.step).toBe(0);
    for(let t=6000;t<8000;t+=50) session.update(pose(t,.4,false),t);
    expect(session.state.step).toBe(0);
    steady(session,8000,8500,.4);steady(session,9000,9500,.4);expect(session.state.step).toBe(0);
  });
});
describe('sit-up two-step calibration',()=>{
  it('declares a DOWN baseline then a single UP step, with no middle step',()=>{
    expect(CALIBRATION_STEPS.situp.map(step=>step.kind)).toEqual(['baseline','up']);
    expect(CALIBRATION_STEPS.situp.map(step=>step.title)).toEqual(['DOWN','UP']);
    expect(CALIBRATION_STEPS.pushup.map(step=>step.kind)).toEqual(['baseline','up','down']);
  });
  it('completes DOWN then UP and stores a waist-centre calibration',()=>{
    const session=new CalibrationSession('situp',0,()=>{});
    steady(session,0,2600,.7);expect(session.state.step).toBe(1);
    steady(session,2650,5200,.7);expect(session.state.step).toBe(1);expect(session.state.phase).toBe('measuring');
    steady(session,5250,7900,.45);expect(session.state.phase).toBe('ready');
    expect(session.result).toEqual({joint:'waist',centerX:.5,centerY:.7,topY:.45,bottomY:.7,scale:.4});
  });
  it('never advances or becomes ready while the lying baseline is held',()=>{
    const session=new CalibrationSession('situp',0,()=>{});
    steady(session,0,15000,.7);
    expect(session.state.step).toBe(1);expect(session.state.phase).toBe('measuring');expect(session.result).toBeNull();
  });
  it('stays on UP for an insufficient rise and completes on a real rise',()=>{
    const session=new CalibrationSession('situp',0,()=>{});
    steady(session,0,2600,.7);expect(session.state.step).toBe(1);
    steady(session,2650,7800,.68);expect(session.state.step).toBe(1);expect(session.result).toBeNull();
    steady(session,7850,10400,.45);expect(session.state.phase).toBe('ready');
    expect(session.result?.topY).toBe(.45);expect(session.result?.bottomY).toBe(.7);
  });
  it('clears the old baseline after two timeouts for both exercises',()=>{
    for(const [exercise,baseline] of [['pushup',.45],['situp',.7]] as const){
      const session=new CalibrationSession(exercise,0,()=>{});
      steady(session,0,2600,baseline);expect(session.state.step).toBe(1);
      session.update(null,12600);expect(session.state.phase).toBe('measuring');
      session.update(null,22600);expect(session.state.phase).toBe('retry');
      steady(session,22650,26000,baseline);expect(session.state.step).toBe(0);
      steady(session,26050,28600,baseline);expect(session.state.step).toBe(1);
    }
  });
});
describe('session calibration storage',()=>{
  it('validates untrusted stored data and persists only valid calibration',()=>{
    const store=new Map<string,string>();vi.stubGlobal('sessionStorage',{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)});
    expect(validCalibration(valid)).toBe(true);saveCalibration(valid);expect(loadCalibration()).toEqual(valid);
    expect(validCalibration({...valid,bottomY:.36})).toBe(false);
    expect(validCalibration({...valid,scale:NaN})).toBe(false);
    expect(validCalibration({...valid,centerX:2})).toBe(false);
    expect(validCalibration({...valid,joint:'waist'})).toBe(true);
    expect(validCalibration({...valid,joint:'head'})).toBe(false);
    expect(()=>saveCalibration({...valid,bottomY:.36})).toThrow('Invalid calibration');
  });
  it('tolerates denied storage',()=>{
    vi.stubGlobal('sessionStorage',{getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}});
    expect(loadCalibration()).toBeNull();expect(()=>saveCalibration(valid)).not.toThrow();
  });
});

describe('calibration on slower phones', () => {
  it('accepts a real stable range at 8 pose frames per second', () => {
    const session = new CalibrationSession('pushup', 0, () => {});
    for (let t = 0; t <= 2500; t += 125) session.update(pose(t, .45), t);
    expect(session.state.step).toBe(1);
    for (let t = 2625; t <= 5000; t += 125) session.update(pose(t, .35), t);
    expect(session.state.step).toBe(2);
    for (let t = 5125; t <= 7500; t += 125) session.update(pose(t, .65), t);
    expect(session.state.phase).toBe('ready');
  });
  it('does not show full progress before the settling period ends', () => {
    const session = new CalibrationSession('pushup', 0, () => {});
    steady(session, 0, 1000, .45);
    expect(session.progress).toBeLessThan(1);
    expect(session.state.step).toBe(0);
  });
});
