import type { Exercise, ExerciseId, Routine, RoutineId } from "@/lib/shared/types";
export const EXERCISES: Record<ExerciseId, Exercise> = {
  squat: {
    id: "squat", name: "Squats", verb: "Lower. Rise. Repeat.",
    summary: "Your everyday movement, with a new rhythm.",
    joints: "Your hips and knees bend as you lower, then extend as you stand.",
    everyday: "A familiar movement from sitting down and standing up.",
    placement: "Prop your phone upright and step back until your head and feet fit in the frame.",
    instructions: ["Start in a comfortable standing position.", "Lower through a comfortable range.", "Return to standing at your own pace."],
    controls: "Lower for DOWN, stand for UP. Orange means a brief hold.",
  },
  march: {
    id: "march", name: "Knee raises", verb: "Left. Right. Find your rhythm.",
    summary: "Alternating steps turn into alternating targets.",
    joints: "One hip and knee bend as you lift a leg, then return to your starting position.",
    everyday: "An alternating movement you also use when taking a step.",
    placement: "Keep your full body in view, including both knees and feet.",
    instructions: ["Begin in a comfortable standing position.", "Lift one knee within a comfortable range.", "Return your foot before switching sides."],
    controls: "Lift your left or right knee for its target. Return to your starting position between lifts.",
  },
  pushup: {
    id: "pushup", name: "Push-ups", verb: "Meet the original.",
    summary: "The floor is your stage. Your body is the controller.",
    joints: "Your elbows bend and extend as your upper body lowers and rises.",
    everyday: "A pushing movement, used here as the game controller.",
    placement: "Place your phone on the floor facing you, with your head and shoulders visible.",
    instructions: ["Choose a comfortable starting position.", "Lower within a comfortable range.", "Push back to your starting position. Rest whenever you need."],
    controls: "Lower for DOWN, rise for UP. An orange top target means a brief hold.",
  },
};
export const EXERCISE_IDS: readonly ExerciseId[] = ["squat", "march", "pushup"];
export const ROUTINES: Record<RoutineId, Routine> = {
  standing: { id: "standing", name: "Standing reset", description: "A little space. Two movements. A fresh rhythm.", setup: "Standing only", exercises: ["squat", "march"] },
  mix: { id: "mix", name: "Full-body mix", description: "Start on your feet. Finish with our original push-up game.", setup: "Standing + floor", exercises: ["squat", "march", "pushup"] },
  single: { id: "single", name: "Pick your move", description: "Get to know one movement, one beat at a time.", setup: "Your choice", exercises: ["squat"] },
};
export const ROUTINE_IDS: readonly RoutineId[] = ["standing", "mix", "single"];
