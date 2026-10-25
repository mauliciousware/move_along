import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { PoseFrame } from '../shared/pushup-types';
import type { ExerciseId } from '../shared/types';

export interface Sample { t: number; x: number; y: number; scale: number; shoulderY: number }
export interface Endpoint { x: number; y: number; scale: number; shoulderY: number; noise: number; samples: number }
export function median(values: readonly number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
export function readSample(frame: PoseFrame, exercise: ExerciseId): Sample | null {
  const point = exercise === 'squat' ? frame.rawWaist ?? frame.waist : frame.rawNose ?? frame.nose;
  const shoulders = [frame.joints?.leftShoulder, frame.joints?.rightShoulder];
  if (exercise === 'pushup' && shoulders.some(p => !p || !Number.isFinite(p.visibility) || p.visibility < CONFIG.tracking.minConfidence)) return null;
  const shoulderY = frame.rawShoulderY ?? (shoulders.every(Boolean) ? (shoulders[0]!.y + shoulders[1]!.y) / 2 : point.y);
  const sample = { t: frame.tPerfMs, x: point.x, y: point.y, scale: frame.shoulderWidth, shoulderY };
  if (!Object.values(sample).every(Number.isFinite) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1 ||
    frame.shoulderWidth < CONFIG.calibrationV2.minScale || frame.shoulderWidth > Math.SQRT2 ||
    !Number.isFinite(frame.confidence) || frame.confidence < CONFIG.tracking.minConfidence) return null;
  return sample;
}

/** Bounded raw-observation window. Display interpolation is never evidence. */
export class EvidenceWindow {
  private samples: Sample[] = [];
  clear() { this.samples = []; }
  get count() { return this.samples.length; }
  get span() { return this.samples.length > 1 ? this.samples.at(-1)!.t - this.samples[0].t : 0; }
  add(sample: Sample) {
    this.samples.push(sample);
    while (this.samples.length > 1 && this.samples[1].t <= sample.t - CONFIG.calibrationV2.stableMs) this.samples.shift();
    if (this.samples.length > CONFIG.calibration.sampleCapacity) this.samples.shift();
  }
  estimate(): { endpoint: Endpoint; stable: boolean } | null {
    if (!this.samples.length) return null;
    const xs = this.samples.map(s => s.x), ys = this.samples.map(s => s.y);
    const x = median(xs), y = median(ys), scale = median(this.samples.map(s => s.scale));
    const noise = Math.max(median(xs.map(v => Math.abs(v - x))), median(ys.map(v => Math.abs(v - y)))) * 1.4826;
    const cfg = CONFIG.calibrationV2;
    const tolerance = Math.max(cfg.minStability, Math.min(cfg.maxStability, scale * cfg.stabilityScale));
    const deviations = this.samples.map(s => Math.max(Math.abs(s.x - x), Math.abs(s.y - y))).sort((a, b) => a - b);
    const tail = deviations[Math.floor((deviations.length - 1) * .9)];
    const third = Math.max(1, Math.floor(ys.length / 3));
    const drift = Math.abs(median(ys.slice(0, third)) - median(ys.slice(-third)));
    return { endpoint: { x, y, scale, shoulderY: median(this.samples.map(s => s.shoulderY)), noise, samples: this.samples.length },
      stable: noise <= tolerance && tail <= tolerance * 2 && drift <= tolerance * 2 };
  }
}
