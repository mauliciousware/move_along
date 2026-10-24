import { PUSHUP_CONFIG as CONFIG } from "../shared/config";
import { BODY_JOINTS, type Calibration, type PoseFrame } from "../shared/pushup-types";
import { projectPoint as projectShared } from '@/lib/pose-engine/framing';

export type Point = { x: number; y: number; visibility?: number };
export function readPose(points: readonly Point[], tPerfMs: number): PoseFrame {
  const [nose, left, right] = points;
  if (!nose || !left || !right) return { tPerfMs, nose: { x: 0, y: 0 }, waist: { x: 0, y: 0 }, shoulderWidth: 0, confidence: 0, ok: false };
  const confidence = Math.min(nose.visibility ?? 0, ((left.visibility ?? 0) + (right.visibility ?? 0)) / 2);
  const shoulderWidth = Math.hypot(left.x - right.x, left.y - right.y);
  return {
    tPerfMs, nose: { x: nose.x, y: nose.y }, waist: { x: nose.x, y: nose.y }, shoulderWidth, confidence,
    ok: Number.isFinite(confidence) && confidence >= CONFIG.tracking.minConfidence &&
      nose.x >= 0 && nose.x <= 1 && nose.y >= 0 && nose.y <= 1 &&
      Number.isFinite(shoulderWidth) && shoulderWidth >= CONFIG.pose.minShoulderWidth,
    points: points.slice(1),
    joints: Object.fromEntries(BODY_JOINTS.map((name, index) => {
      const point = points[index];
      return [name, point ? { x: point.x, y: point.y, visibility: point.visibility ?? 0 } : undefined];
    })),
  };
}
export function normalizePose(frame: PoseFrame, cal: Calibration) {
  const height = cal.bottomY - cal.topY;
  const point = cal.joint === 'waist' ? frame.waist : frame.nose;
  return {
    p: height > 0 ? Math.max(0, Math.min(1, (cal.bottomY - point.y) / height)) : 0,
  };
}

/** Same mirrored cover crop as the portrait camera preview. */
export { projectPoint as projectCameraPoint } from '@/lib/pose-engine/framing';
export function projectPoint(x: number, y: number, videoW: number, videoH: number, w: number, h: number) {
  return projectShared(x, y, videoW, videoH, w, h, true, 'cover');
}
