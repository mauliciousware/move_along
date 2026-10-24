import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { InputEvent } from '../shared/pushup-types';
export type VerticalState = 'NEUTRAL' | 'MOVING_DOWN' | 'DOWN' | 'MOVING_UP' | 'UP';
export class MovementDetector {
  state: VerticalState = 'NEUTRAL';
  private previous: { t: number; p: number } | null = null;
  private armedUp = false;
  private armedDown = true;
  reset() { this.previous = null; this.armedUp = false; this.armedDown = true; this.state = 'NEUTRAL'; }
  update(t: number, p: number, ok: boolean): InputEvent | null {
    if (!ok || !Number.isFinite(p) || !Number.isFinite(t)) { this.reset(); return null; }
    const previous = this.previous;
    if (previous && t <= previous.t) return null;
    if (previous && t - previous.t > CONFIG.camera.staleMs) this.reset();
    const last = this.previous;
    this.previous = { t, p };
    if (!last) return null;
    const v = (p - last.p) / ((t - last.t) / 1000);
    const thresholds = CONFIG.thresholds;
    let event: InputEvent | null = null;
    if (this.armedDown && last.p > thresholds.down && p <= thresholds.down) {
      this.armedDown = false;
      event = { type: 'DOWN', tPerfMs: last.t + (thresholds.down - last.p) / (p - last.p) * (t - last.t) };
    } else if (this.armedUp && last.p < thresholds.up && p >= thresholds.up) {
      this.armedUp = false;
      event = { type: 'UP', tPerfMs: last.t + (thresholds.up - last.p) / (p - last.p) * (t - last.t) };
    }
    if (p <= thresholds.upRearm) this.armedUp = true;
    if (p >= thresholds.downRearm) this.armedDown = true;
    this.state = p <= thresholds.down ? 'DOWN' : p >= thresholds.up ? 'UP' : Math.abs(v) > thresholds.velMoving ? (v > 0 ? 'MOVING_UP' : 'MOVING_DOWN') : 'NEUTRAL';
    return event;
  }
}

export class RepCounter {
  count = 0;
  private downAt: number | null = null;
  interrupt() { this.downAt = null; }
  input(event: InputEvent): number {
    if (event.type === 'DOWN') this.downAt = event.tPerfMs;
    else if (this.downAt !== null) {
      const duration = event.tPerfMs - this.downAt;
      if (duration >= CONFIG.reps.minMs && duration <= CONFIG.reps.maxMs) this.count++;
      this.downAt = null;
    }
    return this.count;
  }
}
