import { PoseEngine as LocalPoseEngine } from '@/lib/pose-engine/engine';
import type { ExerciseId } from '@/lib/shared/types';
import { normalizePose } from './signals';
import { SetupGuard } from '@/lib/calibration/setup-guard';
import { saveCalibration } from './calibration';
import type { BodyOverlayMode, Calibration, PoseFrame, TrackedJoint } from '@/lib/shared/pushup-types';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';

export interface MovementSignal { p:number; left:number; right:number; ok:boolean }

/** Adapt the shared full-body tracker to the exercise's tracked-centre signal contract. */
export class PoseEngine {
  readonly camera:LocalPoseEngine;
  readonly centerJoint: TrackedJoint;
  calibration: Calibration | null = null;
  private calibratedSetup = '';
  private readonly setupGuard = new SetupGuard();
  private listeners = new Set<() => void>();
  private frames = new Set<(frame: PoseFrame) => void>();
  private current: PoseFrame | null = null;
  private state: ReturnType<LocalPoseEngine['getSnapshot']> & {calibrated:boolean};
  constructor(readonly exercise:ExerciseId = "pushup") {
    this.centerJoint = exercise === 'pushup' ? 'nose' : 'waist';
    this.camera=new LocalPoseEngine(exercise);
    this.state={...this.camera.getSnapshot(),calibrated:false};
    this.camera.subscribe(() => {
      if (this.camera.setupId !== this.calibratedSetup || this.camera.getSnapshot().phase === 'suspended') this.calibration = null;
      this.state = { ...this.camera.getSnapshot(), calibrated: !!this.calibration };
      for (const fn of this.listeners) fn();
    });
    this.camera.onFrame(frame => {
      const { nose, leftShoulder, rightShoulder, leftHip, rightHip, leftElbow, rightElbow, leftWrist, rightWrist } = frame.joints;
      const shoulderWidth = leftShoulder && rightShoulder ? Math.hypot(leftShoulder.x-rightShoulder.x, leftShoulder.y-rightShoulder.y) : 0;
      const hipsVisible = !!leftHip && !!rightHip &&
        leftHip.visibility >= CONFIG.tracking.minConfidence && rightHip.visibility >= CONFIG.tracking.minConfidence;
      const waist = hipsVisible
        ? { x:(leftHip!.x+rightHip!.x)/2, y:(leftHip!.y+rightHip!.y)/2 }
        : { x:nose?.x ?? 0, y:nose?.y ?? 0 };
      const raw = frame.rawJoints;
      const rawNose = raw?.nose;
      const rawWaist = raw?.leftHip && raw.rightHip ? { x: (raw.leftHip.x + raw.rightHip.x) / 2, y: (raw.leftHip.y + raw.rightHip.y) / 2 } : undefined;
      const rawShoulderY = raw?.leftShoulder && raw.rightShoulder ? (raw.leftShoulder.y + raw.rightShoulder.y) / 2 : undefined;
      const current: PoseFrame = { postureJoints: raw ?? frame.joints, aspectRatio: frame.aspectRatio, tPerfMs: frame.tPerfMs, nose: nose ?? {x:0,y:0}, waist, shoulderWidth, confidence: frame.confidence, rawNose, rawWaist, rawShoulderY,
        ok: frame.usable && shoulderWidth >= CONFIG.pose.minShoulderWidth && (this.centerJoint === 'nose' || hipsVisible),
        joints: { face:nose, leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist } };
      this.current = current;
      for (const fn of this.frames) fn(current);
    });
  }
  get frame() { return this.camera.frame ? this.current : null; }
  get metrics() { return this.camera.metrics; }
  get bodyOverlay() { return this.camera.overlay; }
  setBodyOverlay(value: BodyOverlayMode) { this.camera.setOverlay(value); }
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  onFrame(fn: (frame: PoseFrame) => void) { this.frames.add(fn); return () => { this.frames.delete(fn); }; }
  noteDraw() { this.camera.noteDraw(); }
  noteRender() { this.camera.noteRender(); }
  start() { this.clearCalibration(); return this.camera.start(); }
  attach(video: HTMLVideoElement) { return this.camera.attach(video); }
  detach() { this.camera.detach(); }
  stop() { this.camera.stop(); this.current = null; this.clearCalibration(); }
  setCalibration(value: Calibration) { if (value.joint !== this.centerJoint) throw new Error('Calibration does not match this exercise'); this.setupGuard.reset(); saveCalibration(value); this.calibration=value; this.calibratedSetup=this.camera.setupId; this.publish(); }
  signal(frame=this.frame):MovementSignal {
    if (!frame || !this.calibration) return {p:1,left:0,right:0,ok:false};
    const setup = this.setupGuard.update(frame, this.calibration);
    if (setup === 'changed') { this.clearCalibration(); return {p:1,left:0,right:0,ok:false}; }
    return {p:normalizePose(frame,this.calibration).p,left:0,right:0,ok:frame.ok && setup === 'valid'};
  }
  clearCalibration() { this.setupGuard.reset(); this.calibration=null; this.publish(); }
  private publish() { if(this.state.calibrated===!!this.calibration)return; this.state={...this.state,calibrated:!!this.calibration}; for(const fn of this.listeners)fn(); }
}
