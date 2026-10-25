import { describe, expect, it } from 'vitest';
import { assessPosture } from './posture';
import { pushupPose, squatPose } from './test-poses';
import { CalibrationSession } from '../pushup/calibration';

const top = {angle:180,hipY:.4,torso:.2};
describe('posture-aware calibration', () => {
  it('recognizes standing and never accepts it as the squat bottom', () => {
    expect(assessPosture(squatPose(0), 'squat', 'up').eligible).toBe(true);
    expect(assessPosture(squatPose(0), 'squat', 'down', top)).toMatchObject({label:'standing',eligible:false});
    expect(assessPosture(squatPose(0,.7), 'squat', 'down', top)).toMatchObject({label:'lowered',eligible:true});
  });
  it('cannot begin at a squat or save a middle position as standing', () => {
    const session = new CalibrationSession('squat',0,()=>{});
    for(let t=50;t<=4000;t+=50)session.update(squatPose(t,.7),t);
    expect(session.state.step).toBe(0);
    expect(session.reason).toBe('posture');
    expect(session.progress).toBe(0);
    expect(session.state.message).toContain('Stand');
    for(let t=4050;t<=7500;t+=50)session.update(squatPose(t),t);
    expect(session.state.step).toBe(1);
  });
  it('blocks upright people and bent-arm middle positions from the push-up top', () => {
    const standing = pushupPose(0,.3);
    standing.postureJoints!.leftHip={x:.3,y:.7,visibility:.95};
    standing.postureJoints!.rightHip={x:.7,y:.7,visibility:.95};
    expect(assessPosture(standing,'pushup','up')).toMatchObject({eligible:false,label:'upright'});
    expect(assessPosture(pushupPose(0,.65),'pushup','up')).toMatchObject({eligible:false,label:'middle'});
    expect(assessPosture(pushupPose(0,.3),'pushup','up')).toMatchObject({eligible:true,label:'top plank'});
  });
  it('requires corroborating limb bending, not just a lower tracked point', () => {
    const standing = squatPose(0); standing.waist.y=.7;
    expect(assessPosture(standing,'squat','down',top).eligible).toBe(false);
    expect(assessPosture(pushupPose(0,.3),'pushup','down',top).eligible).toBe(false);
  });
  it('rejects missing, low-confidence and collapsed joints without assuming a posture', () => {
    for (const exercise of ['squat','pushup'] as const) {
      const frame = exercise==='squat'?squatPose(0):pushupPose(0,.3);
      expect(assessPosture({...frame,postureJoints:undefined},exercise,'up').eligible).toBe(false);
      expect(assessPosture({...frame,aspectRatio:NaN},exercise,'up').eligible).toBe(false);
      for(const p of Object.values(frame.postureJoints!)) if(p) p.visibility=.1;
      expect(assessPosture(frame,exercise,'up')).toMatchObject({eligible:false,label:'unclear'});
    }
  });
  it('preserves the same posture across source aspect ratios and horizontal mirroring', () => {
    const frame=squatPose(0,.7);
    const original=assessPosture(frame,'squat','down',top);
    const joints=Object.fromEntries(Object.entries(frame.postureJoints!).map(([key,p])=>[key,p?{...p,x:1-p.x/2}:p]));
    const changed=assessPosture({...frame,postureJoints:joints,aspectRatio:2},'squat','down',top);
    expect(changed.angle).toBeCloseTo(original.angle!);
    expect(changed.eligible).toBe(original.eligible);
  });
  it('restarts a measurement hold if the posture becomes wrong', () => {
    const session=new CalibrationSession('pushup',0,()=>{});
    for(let t=50;t<=1800;t+=50)session.update(pushupPose(t,.3),t);
    expect(session.state.cue).toBe('hold');
    session.update(pushupPose(1850,.65),1850);
    expect(session.progress).toBe(0); expect(session.state.cue).toBe('move');
    expect(session.state.step).toBe(0);
  });
});
