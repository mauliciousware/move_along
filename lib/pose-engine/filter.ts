import { CONFIG } from "../shared/config";

function alpha(cutoff: number, dt: number) {
  return 1 / (1 + 1 / (2 * Math.PI * cutoff * dt));
}

/** One Euro filter, timestamps in ms, values in image-normalized coordinates. */
export class OneEuroFilter {
  private time: number | null = null;
  private raw = 0;
  private value = 0;
  private derivative = 0;
  reset() { this.time = null; this.derivative = 0; }
  update(value: number, time: number): number {
    if (this.time === null) {
      this.time = time; this.raw = this.value = value;
      return value;
    }
    if (time <= this.time) return this.value;
    const dt = (time - this.time) / 1000;
    const velocity = (value - this.raw) / dt;
    this.derivative += alpha(CONFIG.smoothing.dCutoff, dt) * (velocity - this.derivative);
    const cutoff = CONFIG.smoothing.minCutoff + CONFIG.smoothing.beta * Math.abs(this.derivative);
    this.value += alpha(cutoff, dt) * (value - this.value);
    this.raw = value; this.time = time;
    return this.value;
  }
}
