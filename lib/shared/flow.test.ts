import { describe, expect, it } from "vitest";
import { ACTIVE_SCREENS, currentExercise, exerciseIds, flowReducer, INITIAL_FLOW } from "./flow";
import type { FlowState } from "./flow";
import { EXERCISES, EXERCISE_IDS, ROUTINE_IDS } from "@/data/catalog";
import { songsFor } from "./pushup-songs";

describe("routine preview navigation", () => {
  it.each(ROUTINE_IDS)("reaches results without dead ends for %s", routine => {
    let state = flowReducer(INITIAL_FLOW, { type: "selectRoutine", routine });
    const seenExercises = new Set<string>();
    for (let guard = 0; guard < 100 && state.screen !== "results"; guard++) {
      if (state.screen === "learn") seenExercises.add(currentExercise(state));
      const following = flowReducer(state, { type: "next" });
      expect(following).not.toEqual(state);
      state = following;
    }
    expect(state.screen).toBe("results");
    expect([...seenExercises]).toEqual(exerciseIds(state));
    expect(state.endedEarly).toBe(false);
  });

  it.each(ACTIVE_SCREENS)("STOP exits %s with an early-ended result", screen => {
    const state = flowReducer({ ...INITIAL_FLOW, screen }, { type: "stop" });
    expect(state.screen).toBe("results");
    expect(state.endedEarly).toBe(true);
  });

  it("returns from safety to the chosen movement setup", () => {
    let state = flowReducer(INITIAL_FLOW, { type: "selectExercise", exercise: "pushup" });
    state = flowReducer(state, { type: "requireSafety", then: "camera" });
    expect(state.screen).toBe("safety");
    state = flowReducer(state, { type: "next" });
    expect(state.screen).toBe("camera");
    expect(currentExercise(state)).toBe("pushup");
  });

  it("skips to rest before the next block, or results after the last", () => {
    const state: FlowState = { ...INITIAL_FLOW, routine: "mix", screen: "gameplay" };
    const rest = flowReducer(state, { type: "skip" });
    expect(rest.screen).toBe("rest");
    const next = flowReducer(rest, { type: "next" });
    expect(currentExercise(next)).toBe("situp");
    expect(next.screen).toBe("learn");
    expect(flowReducer({ ...state, block: 2 }, { type: "skip" }).screen).toBe("results");
  });

  it("recalibrates the current exercise and clears preview step progress", () => {
    const state: FlowState = { ...INITIAL_FLOW, routine: "mix", block: 1, calibrationStep: 2, screen: "gameplay" };
    const next = flowReducer(state, { type: "recalibrate" });
    expect(next.screen).toBe("calibration");
    expect(next.calibrationStep).toBe(0);
    expect(currentExercise(next)).toBe("situp");
  });
});

describe("two-exercise lineup", () => {
  it("ships exactly push-ups and sit-ups", () => {
    expect(EXERCISE_IDS).toEqual(["pushup", "situp"]);
    expect(EXERCISES.situp.name).toBe("Sit-ups");
  });

  it("builds rest-free flow maps for sit-ups", () => {
    const maps = songsFor("situp").map(song => song.map);
    expect(maps.length).toBeGreaterThan(0);
    expect(maps.every(map => map.mode === "flow" && map.exercise === "situp" && map.rests.length === 0)).toBe(true);
  });
});
