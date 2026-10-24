export type ExerciseId = "squat" | "march" | "pushup";
export type RoutineId = "standing" | "mix" | "single";
export type Screen = "landing" | "safety" | "routines" | "preview" | "library" | "how" | "learn" | "camera" | "calibration" | "practice" | "countdown" | "gameplay" | "rest" | "results";
export interface Exercise {
  id: ExerciseId;
  name: string;
  verb: string;
  summary: string;
  joints: string;
  everyday: string;
  placement: string;
  instructions: readonly string[];
  controls: string;
}
export interface Routine {
  id: RoutineId;
  name: string;
  description: string;
  setup: string;
  exercises: readonly ExerciseId[];
}
