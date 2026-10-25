import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { ExerciseId, PosePoint } from '../shared/types';
import type { PoseFrame } from '../shared/pushup-types';

export type PostureLabel = 'standing' | 'top plank' | 'lowered' | 'middle' | 'upright' | 'unclear';
export interface PostureReading { label: PostureLabel; eligible: boolean; message: string; angle?: number; torso?: number }
export interface PostureReference { angle: number; hipY: number; torso: number }
const cfg = CONFIG.posture;
type Point = { x: number; y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
function angle(a: Point, b: Point, c: Point) {
  const ab = distance(a, b), cb = distance(c, b);
  if (Math.min(ab, cb) < cfg.minSegment) return null;
  const dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
  return Math.acos(Math.max(-1, Math.min(1, dot / (ab * cb)))) * 180 / Math.PI;
}

/** View-dependent geometry estimates, not a form grade or a trained posture model.
 * These estimates are diagnostics only: missing/ambiguous geometry does not block
 * calibration. Actual movement separation and stable samples still gate capture.
 */
export function assessPosture(frame: PoseFrame, exercise: ExerciseId, target: 'up' | 'down', top?: PostureReference, bottom?: PostureReference): PostureReading {
  const unclear = (message: string): PostureReading => ({ label: 'unclear', eligible: false, message });
  const ratio = frame.aspectRatio;
  if (!ratio || !Number.isFinite(ratio) || ratio <= 0 || !frame.postureJoints) return unclear('Adjust the phone so your full movement is visible.');
  const point = (p: PosePoint | undefined): Point | null => p && Number.isFinite(p.x) && Number.isFinite(p.y) &&
    Number.isFinite(p.visibility) && p.visibility >= cfg.minConfidence && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1
    ? { x: p.x * ratio, y: p.y } : null;
  const sides: { angle: number; hipAngle: number; torso: number; vertical: number; hipY: number }[] = [];
  for (const side of ['left', 'right'] as const) {
    const j = frame.postureJoints;
    const shoulder = point(j[`${side}Shoulder`]), hip = point(j[`${side}Hip`]);
    if (!shoulder || !hip) continue;
    const torso = distance(shoulder, hip);
    if (torso < cfg.minSegment) continue;
    if (exercise === 'squat') {
      const knee = point(j[`${side}Knee`]), ankle = point(j[`${side}Ankle`]);
      if (!knee || !ankle || ankle.y <= knee.y) continue;
      const kneeAngle = angle(hip, knee, ankle), hipAngle = angle(shoulder, hip, knee);
      if (kneeAngle === null || hipAngle === null) continue;
      sides.push({ angle: kneeAngle, hipAngle, torso, vertical: (hip.y - shoulder.y) / torso, hipY: hip.y });
    } else {
      const elbow = point(j[`${side}Elbow`]), wrist = point(j[`${side}Wrist`]);
      if (!elbow || !wrist) continue;
      const elbowAngle = angle(shoulder, elbow, wrist);
      if (elbowAngle === null || wrist.y <= shoulder.y) continue;
      sides.push({ angle: elbowAngle, hipAngle: 0, torso, vertical: (hip.y - shoulder.y) / torso, hipY: hip.y });
    }
  }
  if (!sides.length) return unclear(exercise === 'squat'
    ? 'Show your shoulders, hips, knees and ankles. Turn slightly sideways to the phone.'
    : 'Show your shoulders, elbows, wrists and hips. Angle the phone slightly to your side.');
  if (sides.length === 2 && Math.abs(sides[0].angle - sides[1].angle) > cfg.maxSideDifference) return unclear('The joint angles are unclear. Turn slightly sideways and keep both sides in view.');
  const average = (key: keyof typeof sides[number]) => sides.reduce((sum, s) => sum + s[key], 0) / sides.length;
  const bend = average('angle'), torso = average('torso'), vertical = average('vertical');
  const reading = (label: PostureLabel, eligible: boolean, message: string): PostureReading => ({ label, eligible, message, angle: bend, torso });
  if (exercise === 'squat') {
    if (vertical < cfg.squatTorso) return reading('unclear', false, 'Stand up to start squats. Keep your shoulders, hips, knees and ankles visible.');
    const standing = sides.every(s => s.angle >= cfg.standingKnee && s.hipAngle >= cfg.standingHip && s.vertical >= cfg.uprightTorso);
    if (target === 'up') return standing
      ? reading('standing', true, 'Standing position found.')
      : reading('middle', false, 'Stand up comfortably before we save this top position.');
    if (standing) return reading('standing', false, 'You are still standing. Squat down comfortably, then pause.');
    const lowered = top && sides.every(s => s.angle <= Math.min(cfg.squatKnee, top.angle - cfg.kneeTravel)) &&
      average('hipY') - top.hipY >= cfg.hipDescent * top.torso;
    const repeated = !bottom || Math.abs(bend - bottom.angle) <= cfg.endpointAngleTolerance;
    return lowered && repeated
      ? reading('lowered', true, 'Squat position found.')
      : reading('middle', false, bottom ? 'You are between positions. Return to your earlier comfortable squat, then pause.' : 'You are between positions. Squat within your comfortable range, then pause. Adjust the view if this stays unclear.');
  }
  if (vertical > cfg.plankTorsoMax) return reading('upright', false, 'Get into a push-up plank on the floor. Standing or sitting cannot start this calibration.');
  const extended = sides.every(s => s.angle >= cfg.straightElbow);
  if (target === 'up') return extended
    ? reading('top plank', true, 'Top plank position found.')
    : reading('middle', false, 'Push up to your comfortable top plank position, then pause.');
  if (extended) return reading('top plank', false, 'You are still at the top. Lower your body comfortably, then pause.');
  const lowered = top && sides.every(s => s.angle <= Math.min(cfg.bentElbow, top.angle - cfg.elbowTravel));
  const repeated = !bottom || Math.abs(bend - bottom.angle) <= cfg.endpointAngleTolerance;
  return lowered && repeated
    ? reading('lowered', true, 'Lowered push-up position found.')
    : reading('middle', false, bottom ? 'Return to the same comfortable lower position, then pause.' : 'You are between positions. Lower comfortably, then pause. Adjust the view if this stays unclear.');
}
