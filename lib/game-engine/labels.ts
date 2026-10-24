import type { ExerciseId } from '../shared/types';

/** Display names stay exercise-aware while the stat field stays generic. */
export function repLabel(exercise: ExerciseId) {
  return exercise === 'situp' ? 'SIT-UPS' : 'PUSH-UPS';
}
export function holdLabel(exercise: ExerciseId) {
  return exercise === 'situp' ? 'HOLD' : 'PLANK';
}
