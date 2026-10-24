import type { ExerciseId } from '@/lib/shared/types';
import type { InputEvent } from '@/lib/shared/pushup-types';
import { MovementSession } from '@/lib/pushup/movement-session';
import type { MovementSignal } from '@/lib/pushup/engine';

/** Turns the normalized tracked-centre signal into DOWN/UP movement events. */
export class ExerciseMovement {
  readonly vertical: MovementSession;
  constructor(readonly exercise: ExerciseId, emit: (event: InputEvent) => void) { this.vertical = new MovementSession(emit); }
  get count() { return this.vertical.reps.count; }
  get state() { return this.vertical.detector.state; }
  interrupt() { this.vertical.interrupt(); }
  update(t: number, signal: MovementSignal) { this.vertical.update(t, signal.p, signal.ok); }
  input(event: InputEvent) {
    if (event.type === 'UP' || event.type === 'DOWN') this.vertical.input(event);
  }
}
