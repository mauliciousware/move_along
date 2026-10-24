import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import { BODY_JOINTS, type BodyPoint, type PoseFrame } from '../shared/pushup-types';

export function visibleJoint(point: BodyPoint | undefined): point is BodyPoint {
  return !!point && Number.isFinite(point.x) && Number.isFinite(point.y) &&
    point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1 &&
    Number.isFinite(point.visibility) && point.visibility >= CONFIG.bodyOverlay.minConfidence;
}

/** Fixed numeric buffers only. Never stores camera pixels or infers hidden joints. */
export class BodyOverlayState {
  readonly xy = new Float32Array(BODY_JOINTS.length * 2);
  readonly visible = new Uint8Array(BODY_JOINTS.length);
  readonly trails = new Float32Array(BODY_JOINTS.length * CONFIG.bodyOverlay.trailLength * 2);
  readonly counts = new Uint8Array(BODY_JOINTS.length);
  private lastMs = -Infinity;
  reset() { this.visible.fill(0); this.counts.fill(0); this.lastMs = -Infinity; }
  update(frame: PoseFrame) {
    if (!frame.ok) { this.reset(); return; }
    if (frame.tPerfMs === this.lastMs) return;
    const dt = frame.tPerfMs - this.lastMs;
    if (dt <= 0 || dt > CONFIG.camera.staleMs) this.reset();
    const alpha = 1 - Math.exp(-Math.max(0, dt) / CONFIG.bodyOverlay.smoothMs);
    BODY_JOINTS.forEach((name, index) => {
      const point = frame.joints?.[name], offset = index * 2;
      if (!visibleJoint(point)) { this.visible[index] = 0; this.counts[index] = 0; return; }
      const blend = this.visible[index] ? alpha : 1;
      this.xy[offset] += (point.x - this.xy[offset]) * blend;
      this.xy[offset + 1] += (point.y - this.xy[offset + 1]) * blend;
      this.visible[index] = 1;
      const start = index * CONFIG.bodyOverlay.trailLength * 2;
      this.trails.copyWithin(start + 2, start, start + (CONFIG.bodyOverlay.trailLength - 1) * 2);
      this.trails[start] = this.xy[offset]; this.trails[start + 1] = this.xy[offset + 1];
      this.counts[index] = Math.min(CONFIG.bodyOverlay.trailLength, this.counts[index] + 1);
    });
    this.lastMs = frame.tPerfMs;
  }
}
