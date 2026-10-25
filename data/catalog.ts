import type { Exercise, ExerciseId, Routine, RoutineId } from "@/lib/shared/types";
export const EXERCISES: Record<ExerciseId, Exercise> = {
  pushup: {
    id: "pushup", name: "Push-ups", verb: "Meet the original.",
    summary: "The floor is your stage. Your body is the controller.",
    joints: "Your elbows bend and extend as your upper body lowers and rises.",
    everyday: "A pushing movement, used here as the game controller.",
    placement: "Place your phone near the floor, facing you. Keep your head and both shoulders visible.",
    instructions: ["Choose a comfortable starting position.", "Lower within a comfortable range.", "Push back to your starting position. Rest whenever you need."],
    controls: "Lower for DOWN, rise for UP. An orange top target means a brief hold.",
  },
  squat: {
    id: "squat", name: "Squats", verb: "Down. Up. Repeat.",
    summary: "Stand, squat, and meet the rhythm.",
    joints: "Your hips lower as your knees bend, then rise as you stand.",
    everyday: "A standing movement you can pace to the music.",
    placement: "Prop your phone upright facing you. Keep your head, shoulders and both hips visible as you squat.",
    instructions: ["Start standing comfortably.", "Squat down within a comfortable range.", "Stand back up at your own pace."],
    controls: "Squat down for DOWN, stand up for UP. A top hold means stay standing.",
  },
};
export const EXERCISE_IDS: readonly ExerciseId[] = ["pushup", "squat"];
export const ROUTINES: Record<RoutineId, Routine> = {
  mix: { id: "mix", name: "Two-movement mix", description: "Push-ups, then squats. Your pace.", setup: "Floor", exercises: ["pushup", "squat"] },
  single: { id: "single", name: "Pick your move", description: "Get to know one movement, one beat at a time.", setup: "Your choice", exercises: ["pushup"] },
};
export const ROUTINE_IDS: readonly RoutineId[] = ["mix", "single"];
