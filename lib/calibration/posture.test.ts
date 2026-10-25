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
  it.each(['pushup','squat'] as const)('completes %s calibration without optional posture landmarks', exercise => {
    const session = new CalibrationSession(exercise,0,()=>{});
    let t=0;
    const heights=exercise==='squat'?[.4,.7,.4,.7,.4]:[.3,.65,.3,.65,.3];
    for(const y of heights) for(let i=0;i<70;i++) {
      t+=50;
      const frame=exercise==='squat'?squatPose(t,y):pushupPose(t,y);
      session.update({...frame,postureJoints:undefined,aspectRatio:undefined},t);
    }
    expect(session.state.phase).toBe('ready');
    expect(session.result?.profile?.verifiedCycles).toBe(2);
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
  it('keeps measuring when optional joints disappear during a steady hold', () => {
    const session=new CalibrationSession('pushup',0,()=>{});
    for(let t=50;t<=1800;t+=50)session.update(pushupPose(t,.3),t);
    expect(session.state.cue).toBe('hold');
    const before=session.progress;
    session.update({...pushupPose(1850,.3),postureJoints:undefined},1850);
    expect(session.progress).toBeGreaterThan(before);
    expect(session.state.cue).toBe('hold');
    expect(session.state.step).toBe(0);
  });
});
