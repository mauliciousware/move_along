export type BodyOverlayMode = 'on' | 'minimal' | 'off';
export const BODY_JOINTS = ['face', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'] as const;
export type BodyJoint = typeof BODY_JOINTS[number];
export interface BodyPoint { x: number; y: number; visibility: number }
export type InputType = "UP" | "DOWN";
export type NoteType = InputType | "HOLD";
export interface InputEvent { type: InputType; tPerfMs: number }
export type TrackedJoint = 'nose' | 'waist';
export interface PoseFrame {
  tPerfMs: number;
  nose: { x: number; y: number };
  /** Midpoint of the left and right hips; equals the nose when hips are hidden. */
  waist: { x: number; y: number };
  shoulderWidth: number;
  confidence: number;
  ok: boolean;
  joints?: Partial<Record<BodyJoint, BodyPoint>>;
  /** Debug dots only: shoulders, elbows, wrists; never camera pixels. */
  points?: readonly { x: number; y: number }[];
}
export type TrackingStatus = "TRACKING" | "LOST" | "LOST_LONG";
export interface Calibration {
  joint: TrackedJoint;
  centerX: number; centerY: number;
  topY: number; bottomY: number;
  scale: number;
  scaleTop?: number; scaleBottom?: number;
}
export interface Note {
  id: string; time: number; type: NoteType; duration: number;
  position?: "TOP" | "BOTTOM";
}
export interface Section {
  label: "intro" | "build" | "drop" | "breakdown" | "outro";
  startMs: number; endMs: number; intensity: 0 | 1 | 2 | 3 | 4;
}
export interface RestWindow { startMs: number; endMs: number }
export interface BeatMap {
  exercise?: import("./types").ExerciseId;
  /** Rhythm maps keep beat timing; flow maps wait for the player. */
  mode?: "rhythm" | "flow";
  version: 1; songId: string; difficulty: "intermediate";
  bpm: number; firstBeatMs: number; durationMs: number;
  sections: Section[]; rests: RestWindow[]; notes: Note[];
  meta: { intensityCurve: number[]; counts: Record<string, number>; generatedBy: string };
}
export interface Song {
  id: string; title: string; artist: string; license: string;
  credit: string; file: string; offsetMs: number; beatmap: string;
  available: boolean;
}
export type Screen = "landing" | "safety" | "songs" | "camera" | "calibration" | "countdown" | "gameplay" | "results";
export type Grade = "perfect" | "good" | "ok" | "miss";
