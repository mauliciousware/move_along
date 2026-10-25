import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { Calibration, PoseFrame } from '../shared/pushup-types';
import type { ExerciseId } from '../shared/types';

export type CalibrationStepKind = 'baseline' | 'up' | 'down';
export interface CalibrationStep {
  title: string;
  instruction: string;
  kind: CalibrationStepKind;
}

export const CALIBRATION_STEPS: Record<ExerciseId, readonly CalibrationStep[]> = {
  pushup: [
    { title: 'MIDDLE', instruction: 'Start halfway down in a comfortable push-up. Hold still.', kind: 'baseline' },
    { title: 'UP', instruction: 'Push up to your comfortable top position and hold.', kind: 'up' },
    { title: 'DOWN', instruction: 'Lower to your comfortable bottom position and hold.', kind: 'down' },
  ],
  situp: [
    { title: 'DOWN', instruction: 'Lie back in a comfortable sit-up position. Hold still.', kind: 'baseline' },
    { title: 'UP', instruction: 'Sit up to your comfortable top position and hold.', kind: 'up' },
  ],
};
export type CalibrationState = { step: number; phase: 'measuring' | 'retry' | 'ready'; message: string; revision: number };

export function validCalibration(value: unknown): value is Calibration {
  if (!value || typeof value !== 'object') return false;
  const c = value as Calibration;
  if (c.joint !== 'nose' && c.joint !== 'waist') return false;
  const coordinates = [c.centerY, c.topY, c.bottomY, c.centerX];
  return coordinates.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1) &&
    Number.isFinite(c.scale) && c.scale >= CONFIG.pose.minShoulderWidth && c.scale <= Math.SQRT2 &&
    c.topY <= c.centerY && c.centerY <= c.bottomY &&
    c.bottomY - c.topY >= CONFIG.calibration.minVerticalRange * c.scale;
}
export function loadCalibration(): Calibration | null {
  try { const value: unknown = JSON.parse(sessionStorage.getItem(CONFIG.sessionKeys.calibration) ?? 'null'); return validCalibration(value) ? value : null; } catch { return null; }
}
export function saveCalibration(value: Calibration) {
  if (!validCalibration(value)) throw new Error('Invalid calibration');
  try { sessionStorage.setItem(CONFIG.sessionKeys.calibration, JSON.stringify(value)); } catch { /* Memory still works when storage is unavailable. */ }
}
function median(values: number[]) { values.sort((a,b) => a-b); const mid = Math.floor(values.length / 2); return values.length % 2 ? values[mid] : (values[mid-1] + values[mid]) / 2; }

const RETRY_MESSAGE: Record<ExerciseId, string> = {
  pushup: 'Try again, or hold your middle push-up position for 3 seconds.',
  situp: 'Try again, or hold your lying position for 3 seconds.',
};
const RANGE_MESSAGE: Record<ExerciseId, string> = {
  pushup: 'The camera could not distinguish that range. Adjust its placement and try again, or stop.',
  situp: 'We could not see enough waist travel. Move the phone so your waist stays in view, then try the sit-up again.',
};

/** Pure hands-free state machine. Only step/timeout/validation events notify UI. */
export class CalibrationSession {
  state: CalibrationState;
  result: Calibration | null = null;
  progress = 0;
  guidance = 'Hold steady while we measure.';
  private readonly steps: readonly CalibrationStep[];
  private samples: {t:number;x:number;y:number;sw:number}[] = [];
  private enteredAt: number;
  private timeoutAt: number;
  private timeoutCount = 0;
  private retryAt: number | null = null;
  private lastFrame = -Infinity;
  private neutral: { x:number;y:number;sw:number } | null = null;
  private top = 0;
  constructor(readonly exercise: ExerciseId, now: number, private readonly onChange: (state: CalibrationState) => void) {
    this.steps = CALIBRATION_STEPS[exercise];
    this.enteredAt = this.timeoutAt = now;
    this.state = { step: 0, phase: 'measuring', message: this.steps[0].instruction, revision: 0 };
  }
  private change(update: Partial<CalibrationState>) {
    this.state = {...this.state, ...update, revision: this.state.revision + 1}; this.onChange(this.state);
  }
  private enter(step: number, now: number, message: string = this.steps[step].instruction) {
    this.guidance = 'Get into position, then hold steady.';
    this.samples.length = 0; this.progress = 0; this.enteredAt = this.timeoutAt = now; this.timeoutCount = 0; this.retryAt = null;
    this.change({ step, phase: 'measuring', message });
  }
  restart(now: number) { this.neutral = null; this.top = 0; this.result = null; this.lastFrame = -Infinity; this.enter(0, now); }
  update(frame: PoseFrame | null, now: number) {
    if (this.state.phase === 'ready') return;
    const cfg = CONFIG.calibration;
    if (this.state.phase === 'measuring' && now - this.timeoutAt >= cfg.timeoutMs) {
      this.timeoutAt = now; this.timeoutCount++;
      this.samples.length = 0; this.progress = 0;
      if (this.timeoutCount >= cfg.maxTimeouts) { this.neutral = null; this.top = 0; }
      this.change({ phase: this.timeoutCount >= cfg.maxTimeouts ? 'retry' : 'measuring', message: this.timeoutCount >= cfg.maxTimeouts ? RETRY_MESSAGE[this.exercise] : this.steps[this.state.step].instruction });
    }
    if (!frame?.ok || now - frame.tPerfMs > CONFIG.camera.staleMs) { this.guidance = 'Keep the required body points in view.'; this.samples.length = 0; this.progress = 0; this.retryAt = null; return; }
    if (frame.tPerfMs <= this.lastFrame) return;
    if (frame.tPerfMs - this.lastFrame > CONFIG.camera.staleMs) { this.samples.length = 0; this.retryAt = null; }
    this.lastFrame = frame.tPerfMs;
    const point = this.exercise === 'situp' ? frame.waist : frame.nose;
    this.samples.push({ t: frame.tPerfMs, x: point.x, y: point.y, sw: frame.shoulderWidth });
    while (this.samples.length > 1 && this.samples[1].t <= frame.tPerfMs - cfg.stableMs) this.samples.shift();
    if (this.samples.length > cfg.sampleCapacity) this.samples.shift();
    const n = this.samples.length;
    const meanX = this.samples.reduce((s,p) => s+p.x, 0)/n, meanY = this.samples.reduce((s,p) => s+p.y, 0)/n;
    const stdX = Math.sqrt(this.samples.reduce((s,p) => s+(p.x-meanX)**2, 0)/n);
    const stdY = Math.sqrt(this.samples.reduce((s,p) => s+(p.y-meanY)**2, 0)/n);
    const quiet = stdX < cfg.stableStd && stdY < cfg.stableStd;
    const span = frame.tPerfMs - this.samples[0].t;
    if (!quiet) { this.guidance = 'Hold this position a little steadier.'; this.progress = 0; this.retryAt = null; return; }
    if (this.state.phase === 'retry') {
      const atBaseline = !this.neutral || Math.abs(meanY - this.neutral.y) <= cfg.retryTolerance * this.neutral.sw;
      if (!atBaseline) { this.retryAt = null; return; }
      this.retryAt ??= frame.tPerfMs;
      this.progress = Math.min(1, (frame.tPerfMs - this.retryAt) / cfg.retryPlankMs);
      if (this.progress >= 1) this.restart(now);
      return;
    }
    const kind = this.steps[this.state.step].kind;
    let appropriate = true;
    // The baseline is the middle for push-ups and the lying position for sit-ups.
    if (kind === 'up' && this.neutral) appropriate = meanY <= this.neutral.y - cfg.minUpLift * this.neutral.sw;
    if (kind === 'down' && this.neutral) appropriate = meanY >= this.neutral.y + cfg.minDownDrop * this.neutral.sw;
    this.progress = appropriate ? Math.min(1, span / cfg.stableMs, n / cfg.minSamples, (now - this.enteredAt) / cfg.stepSettleMs) : 0;
    this.guidance = !appropriate ? (kind === 'up' ? 'Move up from your starting position, then hold.' : 'Move down past your starting position, then hold.') : this.progress < 1 ? 'Position found. Hold steady…' : 'Position captured.';
    if (!appropriate || span < cfg.stableMs || n < cfg.minSamples || now - this.enteredAt < cfg.stepSettleMs) return;
    const y = median(this.samples.map(p => p.y));
    if (kind === 'baseline') {
      this.neutral = { x: median(this.samples.map(p=>p.x)), y, sw: median(this.samples.map(p=>p.sw)) };
      this.enter(this.state.step + 1, now);
    } else if (kind === 'up') {
      if (!this.neutral) return;
      this.top = Math.min(this.neutral.y, y);
      if (this.state.step + 1 < this.steps.length) this.enter(this.state.step + 1, now);
      else this.finish(now);
    } else {
      this.finish(now, y);
    }
  }
  private finish(now: number, bottom = this.neutral?.y ?? 0) {
    if (!this.neutral) return;
    const result: Calibration = {
      joint: this.exercise === 'pushup' ? 'nose' : 'waist',
      centerX: this.neutral.x, centerY: this.neutral.y, scale: this.neutral.sw,
      topY: this.top, bottomY: this.exercise === 'situp' ? this.neutral.y : bottom,
    };
    if (!validCalibration(result)) { this.enter(1, now, RANGE_MESSAGE[this.exercise]); return; }
    this.result = result; this.progress = 1; this.change({phase: 'ready', message: 'Tracking ready · Try your movement'});
  }
}
