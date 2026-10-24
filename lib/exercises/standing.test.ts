import { expect, it } from 'vitest';
import { StandingCalibrationSession, standingFeatures, standingSignal } from './standing';
import type { PoseFrame } from '../shared/types';
function pose(time:number,kind:'neutral'|'squat'|'left'|'right'='neutral'):PoseFrame {
 const point=(x:number,y:number)=>({x,y,visibility:1});
 return {tPerfMs:time,usable:true,issue:'none',confidence:1,setupId:'test',joints:{
  nose:point(.5,.1),leftHip:point(.4,kind==='squat'?.65:.45),rightHip:point(.6,kind==='squat'?.65:.45),
  leftKnee:point(kind==='squat'?.2:.4,kind==='left'?.4:.7),rightKnee:point(kind==='squat'?.8:.6,kind==='right'?.4:.7),
  leftAnkle:point(.4,kind==='left'?.65:.95),rightAnkle:point(.6,kind==='right'?.65:.95),
 }};
}
it.each(['squat','march'] as const)('automatically calibrates two repeated %s cycles',exercise=>{
 const session=new StandingCalibrationSession(exercise,()=>{});let t=0;
 const sequence=exercise==='squat'?['neutral','squat','neutral','squat','neutral'] as const:['neutral','left','neutral','right','neutral','left','neutral','right','neutral'] as const;
 for(const kind of sequence){for(let i=0;i<30;i++){t+=50;session.update(pose(t,kind),t);}}
 expect(session.result?.exercise).toBe(exercise);
 const signal=standingSignal(standingFeatures(pose(t,'neutral')),session.result);
 expect(signal.ok).toBe(true);expect(signal.p).toBeCloseTo(1);
 if(exercise==='squat')expect(standingSignal(standingFeatures(pose(t,'squat')),session.result).p).toBeCloseTo(0);
 else expect(standingSignal(standingFeatures(pose(t,'left')),session.result).left).toBeCloseTo(1);
});
it('head motion cannot supply squat calibration, and stale frames cannot advance it',()=>{
 const session=new StandingCalibrationSession('squat',()=>{});
 for(let t=0;t<1500;t+=50)session.update(pose(t),t);
 expect(session.step).toBe(1);
 for(let t=1500;t<5000;t+=50){const frame=pose(t);frame.joints.nose!.y=.5;session.update(frame,t);}
 expect(session.step).toBe(1);expect(session.result).toBeNull();
 for(let t=5000;t<7000;t+=50)session.update(pose(t-1000,'squat'),t);
 expect(session.step).toBe(1);
});
