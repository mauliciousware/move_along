import { PoseEngine as LocalPoseEngine } from '@/lib/pose-engine/engine';
import { saveCalibration } from './calibration';
import type { BodyOverlayMode, Calibration, PoseFrame } from '@/lib/shared/pushup-types';
import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';

/** Adapt the shared full-body tracker to the original push-up signal contract. */
export class PoseEngine {
  readonly camera = new LocalPoseEngine('pushup');
  calibration: Calibration | null = null;
  private calibratedSetup = '';
  private listeners = new Set<() => void>();
  private frames = new Set<(frame: PoseFrame) => void>();
  private current: PoseFrame | null = null;
  private state = { ...this.camera.getSnapshot(), calibrated: false };
  constructor() {
    this.camera.subscribe(() => {
      if (this.camera.setupId !== this.calibratedSetup || this.camera.getSnapshot().phase === 'suspended') this.calibration = null;
      this.state = { ...this.camera.getSnapshot(), calibrated: !!this.calibration };
      for (const fn of this.listeners) fn();
    });
    this.camera.onFrame(frame => {
      const { nose, leftShoulder, rightShoulder, ...joints } = frame.joints;
      const shoulderWidth = leftShoulder && rightShoulder ? Math.hypot(leftShoulder.x-rightShoulder.x, leftShoulder.y-rightShoulder.y) : 0;
      this.current = { tPerfMs: frame.tPerfMs, nose: nose ?? {x:0,y:0}, shoulderWidth, confidence: frame.confidence,
        ok: frame.usable && shoulderWidth >= CONFIG.pose.minShoulderWidth,
        joints: {...joints, face:nose, leftShoulder, rightShoulder} };
      for (const fn of this.frames) fn(this.current);
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
  setCalibration(value: Calibration) { saveCalibration(value); this.calibration=value; this.calibratedSetup=this.camera.setupId; this.publish(); }
  clearCalibration() { this.calibration=null; this.publish(); }
  private publish() { if(this.state.calibrated===!!this.calibration)return; this.state={...this.state,calibrated:!!this.calibration}; for(const fn of this.listeners)fn(); }
}
