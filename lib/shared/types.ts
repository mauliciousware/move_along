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

export type PoseJoint = keyof typeof import("./config").CONFIG.pose.jointIndices;
export interface PosePoint { x: number; y: number; visibility: number }
export interface RawPoseFrame { tPerfMs: number; joints: Partial<Record<PoseJoint, PosePoint>> }
export type FramingIssue = "person" | "head" | "upper" | "legs" | "feet" | "edges" | "none";
export interface PoseFrame extends RawPoseFrame {
  usable: boolean;
  issue: FramingIssue;
  confidence: number;
  setupId: string;
}
export type TrackingStatus = "LOST" | "TRACKING" | "LOST_LONG";
export type OverlayMode = "on" | "minimal" | "off";
export type CameraFacing = "user" | "environment";
