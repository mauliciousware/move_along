import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { Calibration, PoseFrame } from '../shared/pushup-types';
export const CALIBRATION_STEPS = [
  { title: 'MIDDLE', instruction: 'Start halfway down in a comfortable push-up. Hold still.' },
  { title: 'UP', instruction: 'Push up to your comfortable top position and hold.' },
  { title: 'DOWN', instruction: 'Lower to your comfortable bottom position and hold.' },
] as const;
export type CalibrationState = { step: number; phase: 'measuring' | 'retry' | 'ready'; message: string; revision: number };

export function validCalibration(value: unknown): value is Calibration {
  if (!value || typeof value !== 'object') return false;
  const c = value as Calibration;
  const coordinates = [c.neutralHeadY, c.topHeadY, c.bottomHeadY, c.neutralHeadX];
  return coordinates.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1) &&
    Number.isFinite(c.shoulderWidth) && c.shoulderWidth >= CONFIG.pose.minShoulderWidth && c.shoulderWidth <= Math.SQRT2 &&
    c.topHeadY <= c.neutralHeadY && c.bottomHeadY - c.topHeadY >= CONFIG.calibration.minVerticalRange * c.shoulderWidth;
}
export function loadCalibration(): Calibration | null {
  try { const value: unknown = JSON.parse(sessionStorage.getItem(CONFIG.sessionKeys.calibration) ?? 'null'); return validCalibration(value) ? value : null; } catch { return null; }
}
export function saveCalibration(value: Calibration) {
  if (!validCalibration(value)) throw new Error('Invalid calibration');
  try { sessionStorage.setItem(CONFIG.sessionKeys.calibration, JSON.stringify(value)); } catch { /* Memory still works when storage is unavailable. */ }
}
function median(values: number[]) { values.sort((a,b) => a-b); const mid = Math.floor(values.length / 2); return values.length % 2 ? values[mid] : (values[mid-1] + values[mid]) / 2; }

/** Pure hands-free state machine. Only step/timeout/validation events notify UI. */
export class CalibrationSession {
  state: CalibrationState = { step: 0, phase: 'measuring', message: CALIBRATION_STEPS[0].instruction, revision: 0 };
  result: Calibration | null = null;
  progress = 0;
  private samples: {t:number;x:number;y:number;sw:number}[] = [];
  private enteredAt: number;
  private timeoutAt: number;
  private timeoutCount = 0;
  private retryAt: number | null = null;
  private lastFrame = -Infinity;
  private neutral: { x:number;y:number;sw:number } | null = null;
  private top = 0;
  constructor(now: number, private readonly onChange: (state: CalibrationState) => void) { this.enteredAt = this.timeoutAt = now; }
  private change(update: Partial<CalibrationState>) {
    this.state = {...this.state, ...update, revision: this.state.revision + 1}; this.onChange(this.state);
  }
  private enter(step: number, now: number, message: string = CALIBRATION_STEPS[step].instruction) {
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
      this.change({ phase: this.timeoutCount >= cfg.maxTimeouts ? 'retry' : 'measuring', message: this.timeoutCount >= cfg.maxTimeouts ? 'Try again, or hold your middle push-up position for 3 seconds.' : CALIBRATION_STEPS[this.state.step].instruction });
    }
    if (!frame?.ok || now - frame.tPerfMs > CONFIG.camera.staleMs) { this.samples.length = 0; this.progress = 0; this.retryAt = null; return; }
    if (frame.tPerfMs <= this.lastFrame) return;
    if (frame.tPerfMs - this.lastFrame > CONFIG.camera.staleMs) { this.samples.length = 0; this.retryAt = null; }
    this.lastFrame = frame.tPerfMs;
    this.samples.push({ t: frame.tPerfMs, x: frame.nose.x, y: frame.nose.y, sw: frame.shoulderWidth });
    while (this.samples.length > 1 && this.samples[1].t <= frame.tPerfMs - cfg.stableMs) this.samples.shift();
    if (this.samples.length > cfg.sampleCapacity) this.samples.shift();
    const n = this.samples.length;
    const meanX = this.samples.reduce((s,p) => s+p.x, 0)/n, meanY = this.samples.reduce((s,p) => s+p.y, 0)/n;
    const stdX = Math.sqrt(this.samples.reduce((s,p) => s+(p.x-meanX)**2, 0)/n);
    const stdY = Math.sqrt(this.samples.reduce((s,p) => s+(p.y-meanY)**2, 0)/n);
    const quiet = stdX < cfg.stableStd && stdY < cfg.stableStd;
    const span = frame.tPerfMs - this.samples[0].t;
    if (!quiet) { this.progress = 0; this.retryAt = null; return; }
    if (this.state.phase === 'retry') {
      const inMiddle = !this.neutral || Math.abs(meanY - this.neutral.y) <= cfg.retryTolerance * this.neutral.sw;
      if (!inMiddle) { this.retryAt = null; return; }
      this.retryAt ??= frame.tPerfMs;
      this.progress = Math.min(1, (frame.tPerfMs - this.retryAt) / cfg.retryPlankMs);
      if (this.progress >= 1) this.restart(now);
      return;
    }
    let appropriate = true;
    // The first step is the middle of the comfortable range, so UP and DOWN each need real movement.
    if (this.state.step === 1 && this.neutral) appropriate = meanY <= this.neutral.y - cfg.minUpLift * this.neutral.sw;
    if (this.state.step === 2 && this.neutral) appropriate = meanY >= this.neutral.y + cfg.minDownDrop * this.neutral.sw;
    this.progress = appropriate ? Math.min(1, span / cfg.stableMs) : 0;
    if (!appropriate || span < cfg.stableMs || n < cfg.minSamples || now - this.enteredAt < cfg.stepSettleMs) return;
    const y = median(this.samples.map(p => p.y));
    if (this.state.step === 0) {
      this.neutral = { x: median(this.samples.map(p=>p.x)), y, sw: median(this.samples.map(p=>p.sw)) };
      this.enter(1, now);
    } else if (this.state.step === 1 && this.neutral) {
      this.top = Math.min(this.neutral.y, y); this.enter(2, now);
    } else if (this.neutral) {
      const result: Calibration = { neutralHeadX: this.neutral.x, neutralHeadY: this.neutral.y, shoulderWidth: this.neutral.sw, topHeadY: this.top, bottomHeadY: y };
      if (!validCalibration(result)) { this.enter(1, now, 'The camera could not distinguish that range. Adjust its placement and try again, or stop.'); return; }
      this.result = result; this.progress = 1; this.change({phase: 'ready', message: 'Tracking ready · Try your movement'});
    }
  }
}
