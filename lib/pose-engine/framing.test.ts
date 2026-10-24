import { describe, expect, it } from "vitest";
import { CONFIG } from "@/lib/shared/config";
import type { RawPoseFrame } from "@/lib/shared/types";
import { assessFraming, projectPoint, updateProjection, visible } from "./framing";
import { JOINT_NAMES, readLandmarks } from "./landmarks";

export function fullPose(tPerfMs = 0): RawPoseFrame {
  return { tPerfMs, joints: Object.fromEntries(JOINT_NAMES.map((name, i) => [name, { x: i % 2 ? 0.4 : 0.6, y: 0.1 + i * 0.05, visibility: 0.95 }])) };
}

describe("exercise-aware camera framing", () => {
  it.each(["squat", "march", "pushup"] as const)("accepts a fully visible %s pose", exercise => {
    expect(assessFraming(fullPose(), exercise).usable).toBe(true);
  });
  it("requires feet for standing modes, but not for a floor push-up", () => {
    const frame = fullPose();
    delete frame.joints.leftFoot;
    expect(assessFraming(frame, "squat").issue).toBe("feet");
    expect(assessFraming(frame, "march").usable).toBe(false);
    expect(assessFraming(frame, "pushup").usable).toBe(true);
  });
  it("never accepts guessed, low-confidence or non-finite required joints", () => {
    const frame = fullPose();
    frame.joints.leftKnee!.visibility = CONFIG.tracking.minConfidence - 0.01;
    expect(assessFraming(frame, "squat").issue).toBe("legs");
    frame.joints.leftKnee!.visibility = 1;
    frame.joints.leftKnee!.x = NaN;
    expect(assessFraming(frame, "squat").usable).toBe(false);
    expect(visible({ x: 0.5, y: 1.1, visibility: 1 })).toBe(false);
  });
  it("distinguishes no person, missing head, and insufficient frame margin", () => {
    expect(assessFraming({ tPerfMs: 0, joints: {} }, "squat").issue).toBe("person");
    const frame = fullPose();
    delete frame.joints.nose;
    expect(assessFraming(frame, "squat").issue).toBe("head");
    frame.joints.nose = { x: 0.5, y: CONFIG.tracking.edgeMargin / 2, visibility: 1 };
    expect(assessFraming(frame, "squat").issue).toBe("edges");
  });
  it("does not demand a wrist when it is not required by that exercise", () => {
    const frame = fullPose();
    delete frame.joints.leftWrist;
    expect(assessFraming(frame, "squat").usable).toBe(true);
  });
  it("returns no usable frame for invalid timestamps", () => {
    expect(assessFraming(fullPose(NaN), "pushup").usable).toBe(false);
  });
});

describe("uncropped mirrored camera coordinates", () => {
  it("letterboxes a landscape camera into portrait without cropping landmarks", () => {
    expect(projectPoint(0, 0, 640, 480, 300, 400, false)).toEqual({ x: 0, y: 87.5 });
    expect(projectPoint(1, 1, 640, 480, 300, 400, false)).toEqual({ x: 300, y: 312.5 });
  });
  it("mirrors only the front camera horizontal coordinate", () => {
    expect(projectPoint(0.2, 0.7, 480, 640, 300, 400, true)).toEqual({ x: 240, y: 280 });
    expect(projectPoint(0.2, 0.7, 480, 640, 300, 400, false)).toEqual({ x: 60, y: 280 });
  });
  it("handles video metadata not being ready", () => {
    expect(projectPoint(0.5, 0.5, 0, 0, 300, 400, true)).toEqual({ x: 0, y: 0 });
  });
});

describe("portrait cover crop for the phone game", () => {
  it("fills a portrait stage with a landscape camera instead of letterboxing", () => {
    const transform = { offsetX: 0, offsetY: 0, displayWidth: 0, displayHeight: 0, mirrored: false };
    updateProjection(transform, 640, 480, 300, 400, false, "cover");
    expect(transform.displayWidth).toBeCloseTo(533.333, 2);
    expect(transform.displayHeight).toBe(400);
    expect(transform.offsetX).toBeCloseTo(-116.667, 2);
    expect(transform.offsetY).toBe(0);
    expect(projectPoint(0.5, 0.5, 640, 480, 300, 400, false, "cover")).toEqual({ x: 150, y: 200 });
  });
  it("keeps a portrait camera at full height in a portrait stage", () => {
    const transform = { offsetX: 0, offsetY: 0, displayWidth: 0, displayHeight: 0, mirrored: true };
    updateProjection(transform, 480, 640, 300, 400, true, "cover");
    expect(transform.displayWidth).toBe(300);
    expect(transform.displayHeight).toBe(400);
    expect(transform.offsetX).toBe(0);
    expect(transform.offsetY).toBe(0);
  });
});

it("extracts only configured numeric landmarks and respects presence confidence", () => {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.4, y: 0.6, visibility: 0.9, presence: 0.3 }));
  const frame = readLandmarks(landmarks, 123);
  expect(Object.keys(frame.joints)).toHaveLength(JOINT_NAMES.length);
  expect(frame.joints.nose).toEqual({ x: 0.4, y: 0.6, visibility: 0.3 });
  expect(frame.tPerfMs).toBe(123);
  expect(assessFraming(frame, "squat").usable).toBe(false);
});
