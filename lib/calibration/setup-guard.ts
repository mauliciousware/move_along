import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { Calibration, PoseFrame } from '../shared/pushup-types';

/** Conservative lateral/scale heuristic, not proof that the phone moved. */
export class SetupGuard {
  private badSince: number | null = null;
  private lastFrame = -Infinity;
  reset() { this.badSince = null; this.lastFrame = -Infinity; }
  update(frame: PoseFrame, calibration: Calibration): 'valid' | 'uncertain' | 'changed' {
    if (!calibration.profile || !frame.ok) { this.reset(); return frame.ok ? 'valid' : 'uncertain'; }
    const point = calibration.joint === 'nose' ? frame.nose : frame.waist;
    const cfg = CONFIG.calibrationV2;
    const minScale = Math.min(calibration.scaleTop ?? calibration.scale, calibration.scaleBottom ?? calibration.scale);
    const maxScale = Math.max(calibration.scaleTop ?? calibration.scale, calibration.scaleBottom ?? calibration.scale);
    const shifted = !Number.isFinite(point.x) || !Number.isFinite(frame.shoulderWidth) ||
      Math.abs(point.x - calibration.centerX) > Math.max(cfg.minSetupShift, cfg.setupShiftScale * calibration.scale) ||
      frame.shoulderWidth > maxScale * cfg.maxScaleRatio || frame.shoulderWidth < minScale / cfg.maxScaleRatio;
    if (frame.tPerfMs - this.lastFrame > CONFIG.camera.staleMs) this.badSince = null;
    if (frame.tPerfMs <= this.lastFrame) return shifted ? 'uncertain' : 'valid';
    this.lastFrame = frame.tPerfMs;
    if (!shifted) { this.badSince = null; return 'valid'; }
    this.badSince ??= frame.tPerfMs;
    return frame.tPerfMs - this.badSince >= cfg.setupChangeMs ? 'changed' : 'uncertain';
  }
}
