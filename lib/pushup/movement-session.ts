import { MovementDetector, RepCounter } from './movement';
import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { InputEvent } from '../shared/pushup-types';
export class MovementSession {
  readonly detector = new MovementDetector();
  readonly reps = new RepCounter();
  down = 0; up = 0;
  private lastFrame: number | null = null;
  constructor(private readonly emit: (event: InputEvent) => void) {}
  interrupt() { this.detector.reset(); this.reps.interrupt(); this.lastFrame = null; }
  update(t: number, p: number, ok: boolean) {
    if (!ok) { this.interrupt(); return; }
    if (this.lastFrame !== null && t - this.lastFrame > CONFIG.camera.staleMs) this.interrupt();
    this.lastFrame = t;
    const event = this.detector.update(t, p, ok);
    if (event) this.input(event);
  }
  /** Keyboard and camera events converge here, before future game judgment. */
  input(event: InputEvent) {
    if (event.type === 'DOWN') this.down++; else this.up++;
    this.reps.input(event); this.emit(event);
  }
}
