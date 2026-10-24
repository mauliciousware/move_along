import { CONFIG } from '../shared/config';
/** A rolling one-second cap avoids halving 30 Hz video when callbacks jitter. */
export class FrameGate {
  private readonly times = new Float64Array(CONFIG.camera.maxHz).fill(-Infinity);
  private cursor = 0;
  private nextDue = -Infinity;
  accept(now: number): boolean {
    if (now < this.nextDue || now <= this.times[this.cursor] + 1000) return false;
    this.times[this.cursor] = now;
    this.cursor = (this.cursor + 1) % this.times.length;
    this.nextDue = Math.max(now, this.nextDue + 1000 / CONFIG.camera.maxHz);
    return true;
  }
}
