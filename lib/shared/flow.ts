import { ROUTINES } from "@/data/catalog";
import { CONFIG } from "./config";
import type { ExerciseId, RoutineId, Screen } from "./types";
export interface FlowState {
  screen: Screen;
  routine: RoutineId;
  singleExercise: ExerciseId;
  block: number;
  calibrationStep: number;
  countdown: number;
  endedEarly: boolean;
  afterSafety: "routines" | "camera";
}
export const INITIAL_FLOW: FlowState = {
  screen: "landing", routine: "mix", singleExercise: "pushup", block: 0,
  calibrationStep: 0, countdown: CONFIG.preview.countdownSteps, endedEarly: false, afterSafety: "routines",
};
export type FlowAction =
  | { type: "navigate"; screen: Screen }
  | { type: "selectRoutine"; routine: RoutineId }
  | { type: "selectExercise"; exercise: ExerciseId }
  | { type: "next" }
  | { type: "requireSafety"; then: "routines" | "camera" }
  | { type: "stop" }
  | { type: "recalibrate" }
  | { type: "skip" };
export function exerciseIds(state: FlowState): readonly ExerciseId[] {
  return state.routine === "single" ? [state.singleExercise] : ROUTINES[state.routine].exercises;
}
export function currentExercise(state: FlowState): ExerciseId {
  return exerciseIds(state)[state.block] ?? state.singleExercise;
}
export const ACTIVE_SCREENS: readonly Screen[] = ["learn", "camera", "calibration", "practice", "countdown", "gameplay", "rest"];
function endBlock(state: FlowState): FlowState {
  return { ...state, screen: state.block + 1 < exerciseIds(state).length ? "rest" : "results" };
}
export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  if (action.type === "requireSafety") return { ...state, screen: "safety", afterSafety: action.then };
  if (action.type === "navigate") return { ...state, screen: action.screen };
  if (action.type === "selectRoutine") return { ...INITIAL_FLOW, screen: "preview", routine: action.routine, singleExercise: state.singleExercise };
  if (action.type === "selectExercise") return { ...INITIAL_FLOW, screen: "learn", routine: "single", singleExercise: action.exercise };
  if (action.type === "stop") return { ...state, screen: "results", endedEarly: true };
  if (action.type === "recalibrate") return { ...state, screen: "calibration", calibrationStep: 0 };
  if (action.type === "skip") return endBlock(state);
  switch (state.screen) {
    case "safety": return { ...state, screen: state.afterSafety };
    case "preview": return { ...state, screen: "learn", block: 0, endedEarly: false };
    case "learn": return { ...state, screen: "camera" };
    case "camera": return { ...state, screen: "calibration", calibrationStep: 0 };
    case "calibration": return state.calibrationStep + 1 < CONFIG.preview.calibrationSteps
      ? { ...state, calibrationStep: state.calibrationStep + 1 }
      : { ...state, screen: "practice" };
    case "practice": return { ...state, screen: "countdown", countdown: CONFIG.preview.countdownSteps };
    case "countdown": return state.countdown > 1 ? { ...state, countdown: state.countdown - 1 } : { ...state, screen: "gameplay" };
    case "gameplay": return endBlock(state);
    case "rest": return { ...state, screen: "learn", block: state.block + 1, calibrationStep: 0 };
    case "results": return { ...INITIAL_FLOW, screen: "routines" };
    default: return state;
  }
}
