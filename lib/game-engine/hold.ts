import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { Grade } from '../shared/pushup-types';
export class HoldMeter {
  valueMs = 0;
  stableMs = 0;
  interrupted = false;
  constructor(readonly duration: number) {}
  update(elapsedMs: number, stable: boolean, tracking: boolean) {
    if (!tracking) { this.interrupted = true; return; }
    if (stable) this.stableMs += elapsedMs;
    this.valueMs = Math.max(0, Math.min(this.duration, this.valueMs + elapsedMs*(stable ? 1 : -CONFIG.hold.drainFactor)));
  }
  get ratio() { return this.valueMs/this.duration; }
  grade(): Grade { const r=this.ratio; return r>=CONFIG.hold.perfectRatio?'perfect':r>=CONFIG.hold.successRatio?'good':r>=CONFIG.hold.okRatio?'ok':'miss'; }
}
