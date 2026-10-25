/** Synthetic landmark fixtures only; these do not validate real-camera accuracy. */
import type { PoseFrame } from '../shared/pushup-types';
import type { RawPoseFrame } from '../shared/types';
const point = (x: number, y: number) => ({ x, y, visibility: .95 });
export function pushupPose(t: number, y: number): PoseFrame {
  const bent = y > .4;
  const joints = {
    leftShoulder: point(.3, y + .1), rightShoulder: point(.7, y + .1),
    leftElbow: point(bent ? .15 : .3, y + .2), rightElbow: point(bent ? .85 : .7, y + .2),
    leftWrist: point(.3, y + .3), rightWrist: point(.7, y + .3),
    leftHip: point(.4, y + .05), rightHip: point(.6, y + .05),
  };
  return { tPerfMs: t, nose: {x:.5,y}, waist: {x:.5,y}, shoulderWidth:.4, confidence:.95, ok:true, aspectRatio:1, postureJoints:joints, joints };
}
export function squatPose(t: number, hipY = .4): PoseFrame {
  const lowered = hipY > .5;
  const joints: RawPoseFrame['joints'] = {
    nose: point(.5,hipY-.3), leftShoulder: point(.4,hipY-.2), rightShoulder: point(.6,hipY-.2),
    leftHip: point(.4,hipY), rightHip: point(.6,hipY),
    leftKnee: point(lowered ? .25 : .4, lowered ? .75 : .65), rightKnee: point(lowered ? .75 : .6, lowered ? .75 : .65),
    leftAnkle: point(.4,.9), rightAnkle: point(.6,.9),
  };
  return {tPerfMs:t, nose:joints.nose!, waist:{x:.5,y:hipY}, shoulderWidth:.2, confidence:.95,ok:true,aspectRatio:1,postureJoints:joints,joints};
}
