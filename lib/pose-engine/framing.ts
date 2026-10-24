import { CONFIG } from "@/lib/shared/config";
import type { ExerciseId, FramingIssue, PoseJoint, PosePoint, RawPoseFrame } from "@/lib/shared/types";

export function visible(point: PosePoint | undefined): point is PosePoint {
  return !!point && Number.isFinite(point.x) && Number.isFinite(point.y) &&
    Number.isFinite(point.visibility) && point.visibility >= CONFIG.tracking.minConfidence &&
    point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
}
export function requiredJoints(exercise: ExerciseId): readonly PoseJoint[] {
  return exercise === "pushup" ? CONFIG.pose.pushupJoints : CONFIG.pose.standingJoints;
}
export function assessFraming(frame: RawPoseFrame, exercise: ExerciseId): { usable: boolean; issue: FramingIssue; confidence: number } {
  const { joints } = frame;
  const required = requiredJoints(exercise);
  const confidence = Math.min(...required.map(name => visible(joints[name]) ? joints[name]!.visibility : 0));
  const result = (issue: FramingIssue) => ({ usable: issue === "none", issue, confidence });
  if (!Object.values(joints).some(visible) || !Number.isFinite(frame.tPerfMs)) return result("person");
  if (!visible(joints.nose)) return result("head");
  if (!visible(joints.leftShoulder) || !visible(joints.rightShoulder)) return result("upper");
  if (exercise !== "pushup") {
    if (![joints.leftAnkle, joints.rightAnkle, joints.leftFoot, joints.rightFoot].every(visible)) return result("feet");
    if (![joints.leftHip, joints.rightHip, joints.leftKnee, joints.rightKnee].every(visible)) return result("legs");
  } else if (!visible(joints.leftElbow) || !visible(joints.rightElbow)) return result("upper");
  const margin = CONFIG.tracking.edgeMargin;
  if (required.some(name => {
    const p = joints[name]!;
    return p.x < margin || p.x > 1 - margin || p.y < margin || p.y > 1 - margin;
  })) return result("edges");
  return result("none");
}

/** A reusable centered contain or cover transform, shared by video overlays and tests. */
export type CameraFit = 'contain' | 'cover';
export interface ContainProjection { offsetX: number; offsetY: number; displayWidth: number; displayHeight: number; mirrored: boolean }
export function updateProjection(target: ContainProjection, videoW: number, videoH: number, width: number, height: number, mirrored: boolean, fit: CameraFit = 'contain') {
  const scale = videoW > 0 && videoH > 0 ? (fit === 'cover' ? Math.max : Math.min)(width / videoW, height / videoH) : 0;
  target.displayWidth = videoW * scale;
  target.displayHeight = videoH * scale;
  target.offsetX = scale ? (width - target.displayWidth) / 2 : 0;
  target.offsetY = scale ? (height - target.displayHeight) / 2 : 0;
  target.mirrored = mirrored;
}
export function projectInto(target: { x: number; y: number }, x: number, y: number, transform: ContainProjection) {
  target.x = transform.offsetX + (transform.mirrored ? 1 - x : x) * transform.displayWidth;
  target.y = transform.offsetY + y * transform.displayHeight;
}
export function projectPoint(x: number, y: number, videoW: number, videoH: number, width: number, height: number, mirrored: boolean, fit: CameraFit = 'contain') {
  const transform: ContainProjection = { offsetX: 0, offsetY: 0, displayWidth: 0, displayHeight: 0, mirrored };
  const result = { x: 0, y: 0 };
  updateProjection(transform, videoW, videoH, width, height, mirrored, fit);
  projectInto(result, x, y, transform);
  return result;
}

export const FRAMING_COPY: Record<FramingIssue, { title: string; detail: string }> = {
  person: { title: "Step into the frame", detail: "Face the camera in a well-lit space." },
  head: { title: "Bring your head into view", detail: "Adjust your distance or the phone angle." },
  upper: { title: "Show your shoulders and arms", detail: "Keep both sides of your upper body visible." },
  legs: { title: "Show your hips and knees", detail: "Step back so your lower body is in the frame." },
  feet: { title: "Bring both feet into view", detail: "Step back or adjust the phone angle." },
  edges: { title: "Give yourself a little more room", detail: "Keep your movement away from the edge of the frame." },
  none: { title: "Your framing looks ready", detail: "Hold your position while tracking settles." },
};
