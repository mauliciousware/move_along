import type { Exercise, ExerciseId, Routine, RoutineId } from "@/lib/shared/types";
export const EXERCISES: Record<ExerciseId, Exercise> = {
  pushup: {
    id: "pushup", name: "Push-ups", verb: "Meet the original.",
    summary: "The floor is your stage. Your body is the controller.",
    joints: "Your elbows bend and extend as your upper body lowers and rises.",
    everyday: "A pushing movement, used here as the game controller.",
    placement: "Place your phone on the floor facing you, with your head and shoulders visible.",
    instructions: ["Choose a comfortable starting position.", "Lower within a comfortable range.", "Push back to your starting position. Rest whenever you need."],
    controls: "Lower for DOWN, rise for UP. An orange top target means a brief hold.",
  },
  situp: {
    id: "situp", name: "Sit-ups", verb: "Down. Up. Repeat.",
    summary: "Lie back, sit up, and meet the rhythm.",
    joints: "Your waist and torso move as you lower and rise.",
    everyday: "A floor movement you can pace to the music.",
    placement: "Prop your phone upright beside you so your waist, shoulders and head stay in view from lying to sitting.",
    instructions: ["Lie back in a comfortable sit-up position.", "Sit up within a comfortable range.", "Lower back down at your own pace."],
    controls: "Lie down for DOWN, sit up for UP. A top hold means pause upright.",
  },
};
export const EXERCISE_IDS: readonly ExerciseId[] = ["pushup", "situp"];
export const ROUTINES: Record<RoutineId, Routine> = {
  mix: { id: "mix", name: "Two-movement mix", description: "Push-ups, then sit-ups. Your pace.", setup: "Floor", exercises: ["pushup", "situp"] },
  single: { id: "single", name: "Pick your move", description: "Get to know one movement, one beat at a time.", setup: "Your choice", exercises: ["pushup"] },
};
export const ROUTINE_IDS: readonly RoutineId[] = ["mix", "single"];
