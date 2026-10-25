import { describe, expect, it } from 'vitest';
import { SetupGuard } from './setup-guard';
import type { Calibration, PoseFrame } from '../shared/pushup-types';
const calibration: Calibration = {joint:'nose',topY:.3,bottomY:.65,centerY:.475,centerX:.5,scale:.4,
  profile:{schemaVersion:2,exercise:'pushup',featureId:'nose-y',modelVersion:'mediapipe-lite-1.1.1',verifiedCycles:2,noise:0,samples:100,createdAt:1}};
const frame=(t:number,x=.5,y=.3):PoseFrame=>({tPerfMs:t,nose:{x,y},waist:{x,y},shoulderWidth:.4,confidence:.9,ok:true});
describe('setup guard',()=>{
  it('allows vertical exercise travel and never recalibrates from it',()=>{
    const guard=new SetupGuard();
    for(let t=0;t<3000;t+=100)expect(guard.update(frame(t,.5,t%200?.3:.65),calibration)).toBe('valid');
  });
  it('withholds uncertain samples, then rejects a persistent lateral relocation',()=>{
    const guard=new SetupGuard(); expect(guard.update(frame(0,.95),calibration)).toBe('uncertain');
    for(let t=100;t<1500;t+=100)expect(guard.update(frame(t,.95),calibration)).toBe('uncertain');
    expect(guard.update(frame(1500,.95),calibration)).toBe('changed');
  });
  it('recovers from a brief shift and does not count missing or repeated frames as confirmation',()=>{
    const guard=new SetupGuard(); guard.update(frame(0,.95),calibration);
    expect(guard.update(frame(100),calibration)).toBe('valid');
    for(let i=0;i<50;i++)expect(guard.update(frame(200,.95),calibration)).toBe('uncertain');
    expect(guard.update(frame(5000,.95),calibration)).toBe('uncertain');
  });
});
