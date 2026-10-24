import { describe, expect, it, vi, afterEach } from 'vitest';
import { CalibrationSession, validCalibration, saveCalibration, loadCalibration } from './calibration';
import type { PoseFrame } from '../shared/pushup-types';
const pose=(t:number,y:number,ok=true):PoseFrame=>({tPerfMs:t,nose:{x:.5,y},shoulderWidth:.4,confidence:ok?.9:0,ok});
function steady(session:CalibrationSession,start:number,end:number,y:number) {
  for(let t=start;t<=end;t+=50) session.update(pose(t,y),t);
}
const valid={neutralHeadX:.5,neutralHeadY:.4,topHeadY:.35,bottomHeadY:.6,shoulderWidth:.4};
afterEach(()=>vi.unstubAllGlobals());
describe('hands-free calibration',()=>{
  it('collects stable medians and completes PLANK -> UP -> DOWN once',()=>{
    const onChange=vi.fn();const session=new CalibrationSession(0,onChange);
    steady(session,0,1500,.4);expect(session.state.step).toBe(1);
    steady(session,1550,3050,.35);expect(session.state.step).toBe(2);
    steady(session,3100,4600,.6);expect(session.state.phase).toBe('ready');
    expect(session.result).toEqual(valid);
    const changes=onChange.mock.calls.length;steady(session,4650,9000,.6);expect(onChange).toHaveBeenCalledTimes(changes);
  });
  it('allows UP to equal an already extended starting plank, but never accepts the same position for DOWN',()=>{
    const session=new CalibrationSession(0,()=>{});
    steady(session,0,3050,.4);expect(session.state.step).toBe(2);
    steady(session,3100,5000,.4);expect(session.result).toBeNull();expect(session.state.step).toBe(2);
    steady(session,5050,6550,.6);expect(session.result?.topHeadY).toBe(.4);
  });
  it('rejects insufficient vertical range and repeats UP/DOWN',()=>{
    const session=new CalibrationSession(0,()=>{});
    steady(session,0,3050,.4);steady(session,3100,4600,.46);
    expect(session.state.step).toBe(1);expect(session.state.message).toContain('Adjust its placement');expect(session.result).toBeNull();
  });
  it('repeats instruction at ten seconds, offers retry at twenty, and restarts on stable plank',()=>{
    const session=new CalibrationSession(0,()=>{});
    session.update(null,10000);expect(session.state.phase).toBe('measuring');expect(session.state.revision).toBe(1);
    session.update(null,20000);expect(session.state.phase).toBe('retry');
    steady(session,20050,23050,.4);expect(session.state.phase).toBe('measuring');expect(session.state.step).toBe(0);
  });
  it('does not accept frozen frames, gaps, jitter or low-confidence frames',()=>{
    const session=new CalibrationSession(0,()=>{});
    for(let t=0;t<3000;t+=50) session.update(pose(0,.4),t);
    expect(session.state.step).toBe(0);
    for(let t=3000;t<6000;t+=50) session.update(pose(t,t%100?.42:.38),t);
    expect(session.state.step).toBe(0);
    for(let t=6000;t<8000;t+=50) session.update(pose(t,.4,false),t);
    expect(session.state.step).toBe(0);
    steady(session,8000,8500,.4);steady(session,9000,9500,.4);expect(session.state.step).toBe(0);
  });
});
describe('session calibration storage',()=>{
  it('validates untrusted stored data and persists only valid calibration',()=>{
    const store=new Map<string,string>();vi.stubGlobal('sessionStorage',{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)});
    expect(validCalibration(valid)).toBe(true);saveCalibration(valid);expect(loadCalibration()).toEqual(valid);
    expect(validCalibration({...valid,bottomHeadY:.36})).toBe(false);
    expect(validCalibration({...valid,shoulderWidth:NaN})).toBe(false);
    expect(validCalibration({...valid,neutralHeadX:2})).toBe(false);
    expect(()=>saveCalibration({...valid,bottomHeadY:.36})).toThrow('Invalid calibration');
  });
  it('tolerates denied storage',()=>{
    vi.stubGlobal('sessionStorage',{getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}});
    expect(loadCalibration()).toBeNull();expect(()=>saveCalibration(valid)).not.toThrow();
  });
});
