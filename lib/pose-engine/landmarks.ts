import { CONFIG } from "@/lib/shared/config";
import type { PoseJoint, PosePoint, RawPoseFrame } from "@/lib/shared/types";
export const JOINT_NAMES = Object.keys(CONFIG.pose.jointIndices) as PoseJoint[];
interface Landmark { x: number; y: number; visibility?: number; presence?: number }
/** Only compact numeric coordinates cross the worker boundary. */
export function readLandmarks(points: readonly Landmark[], tPerfMs: number): RawPoseFrame {
  const joints: Partial<Record<PoseJoint, PosePoint>> = {};
  for (const name of JOINT_NAMES) {
    const point = points[CONFIG.pose.jointIndices[name]];
    if (point) joints[name] = { x: point.x, y: point.y, visibility: Math.min(point.visibility ?? 0, point.presence ?? 1) };
  }
  return { tPerfMs, joints };
}
