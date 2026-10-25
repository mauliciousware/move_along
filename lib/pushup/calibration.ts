import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { Calibration, PoseFrame } from '../shared/pushup-types';
import type { ExerciseId } from '../shared/types';
import { assessPosture, type PostureReference, type PostureReading } from '../calibration/posture';
import { EvidenceWindow, median, readSample, type Endpoint } from '../calibration/evidence';

export interface CalibrationStep {
  title: 'UP' | 'DOWN';
  instruction: string;
  kind: 'up' | 'down';
  stage: 'learn' | 'verify';
}
export const CALIBRATION_STEPS: Record<ExerciseId, readonly CalibrationStep[]> = {
  pushup: [
    { title: 'UP', instruction: 'Move up into your plank position.', kind: 'up', stage: 'learn' },
    { title: 'DOWN', instruction: 'Saved. Now move down comfortably.', kind: 'down', stage: 'learn' },
    { title: 'UP', instruction: 'Saved. Now move up.', kind: 'up', stage: 'learn' },
    { title: 'DOWN', instruction: 'Saved. Move down once more.', kind: 'down', stage: 'verify' },
    { title: 'UP', instruction: 'Saved. Move up one last time.', kind: 'up', stage: 'verify' },
  ],
  squat: [
    { title: 'UP', instruction: 'Stand up comfortably.', kind: 'up', stage: 'learn' },
    { title: 'DOWN', instruction: 'Saved. Now squat down comfortably, then pause.', kind: 'down', stage: 'learn' },
    { title: 'UP', instruction: 'Saved. Now stand up.', kind: 'up', stage: 'learn' },
    { title: 'DOWN', instruction: 'Saved. Squat down once more.', kind: 'down', stage: 'verify' },
    { title: 'UP', instruction: 'Saved. Stand up one last time.', kind: 'up', stage: 'verify' },
  ],
};
export type CalibrationState = { step: number; phase: 'measuring' | 'retry' | 'ready'; message: string; revision: number; cue: 'move' | 'hold' };
export type CalibrationReason = 'observing' | 'missing' | 'stale' | 'unstable' | 'range' | 'repeat' | 'setup' | 'timeout' | 'body-motion' | 'verified';
const cfg = CONFIG.calibrationV2;

export function validCalibration(value: unknown): value is Calibration {
  if (!value || typeof value !== 'object') return false;
  const c = value as Calibration;
  if (c.joint !== 'nose' && c.joint !== 'waist') return false;
  const coordinates = [c.centerY, c.topY, c.bottomY, c.centerX];
  if (!coordinates.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1) ||
    !Number.isFinite(c.scale) || c.scale < cfg.minScale || c.scale > Math.SQRT2 ||
    c.topY > c.centerY || c.centerY > c.bottomY ||
    c.bottomY - c.topY < Math.max(cfg.minRange, cfg.rangeScale * c.scale)) return false;
  const p = c.profile;
  // Legacy objects remain usable by existing in-memory callers, but are never restored from storage.
  if (p === undefined) return true;
  return !!p && typeof p === 'object' && p.schemaVersion === 3 &&
    p.exercise === (c.joint === 'nose' ? 'pushup' : 'squat') && p.featureId === (c.joint === 'nose' ? 'nose-y' : 'waist-y') &&
    p.modelVersion === 'mediapipe-lite-1.1.1' && p.verifiedCycles === 2 &&
    Number.isFinite(p.noise) && p.noise >= 0 && p.noise * cfg.noiseMultiplier <= c.bottomY - c.topY &&
    Number.isInteger(p.samples) && p.samples >= cfg.minSamples * CALIBRATION_STEPS[p.exercise].length &&
    Number.isFinite(p.createdAt) && p.createdAt > 0;
}
export function loadCalibration(): Calibration | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(CONFIG.sessionKeys.calibration) ?? 'null');
    return validCalibration(value) && value.profile?.schemaVersion === 3 ? value : null;
  } catch { return null; }
}
export function saveCalibration(value: Calibration) {
  if (!validCalibration(value)) throw new Error('Invalid calibration');
  try { sessionStorage.setItem(CONFIG.sessionKeys.calibration, JSON.stringify(value)); } catch { /* Memory still works without storage. */ }
}

/** Pure calibration protocol. Only transitions notify React; frames stay transient. */
export class CalibrationSession {
  state: CalibrationState;
  result: Calibration | null = null;
  progress = 0;
  guidance = 'Get into your comfortable starting position, then hold briefly.';
  reason: CalibrationReason = 'observing';
  posture: PostureReading | null = null;
  private postureEndpoints: (PostureReference | undefined)[] = [];
  private postureEvidence: { t: number; angle: number; torso: number }[] = [];
  readonly diagnostics = { acceptedFrames: 0, rejectedFrames: 0, windowResets: 0, validStepMs: 0, lastFrameAgeMs: 0, noise: 0 };
  private readonly steps: readonly CalibrationStep[];
  private readonly window = new EvidenceWindow();
  private endpoints: Endpoint[] = [];
  private lastFrame = -Infinity;
  private lastSeen = -Infinity;
  private missingSince: number | null = null;
  private captureSince: number | null = null;
  constructor(readonly exercise: ExerciseId, _now: number, private readonly onChange: (state: CalibrationState) => void) {
    this.steps = CALIBRATION_STEPS[exercise];
    this.state = { step: 0, phase: 'measuring', message: this.steps[0].instruction, revision: 0, cue: 'move' };
  }
  private change(update: Partial<CalibrationState>) {
    this.state = { ...this.state, ...update, revision: this.state.revision + 1 };
    this.onChange(this.state);
  }
  private pauseCapture() {
    this.progress = 0;
    if (this.captureSince === null) return;
    this.captureSince = null;
    this.change({ cue: 'move', message: 'Pause in this position. We need a steady measurement.' });
  }
  private resetWindow() {
    this.pauseCapture();
    if (this.window.count) this.diagnostics.windowResets++;
    this.window.clear(); this.postureEvidence = []; this.progress = 0;
  }
  private enter(step: number) {
    this.captureSince = null; this.posture = null;
    this.resetWindow(); this.diagnostics.validStepMs = 0;
    this.reason = 'observing'; this.guidance = 'Move to the requested position, then hold briefly.';
    this.change({ step, phase: 'measuring', cue: 'move', message: this.steps[step].instruction });
  }
  restart(now: number) {
    if (!Number.isFinite(now)) return;
    this.result = null; this.endpoints = []; this.postureEndpoints = []; this.lastFrame = this.lastSeen = -Infinity; this.missingSince = null;
    this.enter(0);
  }
  private retry(reason: CalibrationReason, message: string) {
    this.result = null; this.endpoints = []; this.postureEndpoints = []; this.captureSince = null; this.resetWindow(); this.reason = reason; this.guidance = message;
    this.change({ step: 0, phase: 'retry', message });
  }
  private reject(reason: CalibrationReason, message: string, now: number) {
    this.posture = null; this.resetWindow(); this.reason = reason; this.guidance = message;
    this.missingSince ??= now;
    if (now - this.missingSince >= cfg.lossResetMs) this.retry(reason, 'Tracking was interrupted. Get back into view, then tap Try again.');
  }
  update(frame: PoseFrame | null, now: number) {
    if (this.state.phase !== 'measuring' || !Number.isFinite(now)) return;
    this.diagnostics.lastFrameAgeMs = frame ? now - frame.tPerfMs : Infinity;
    const sample = frame?.ok ? readSample(frame, this.exercise) : null;
    if (!sample || sample.t > now || now - sample.t > CONFIG.camera.staleMs) {
      if (frame && frame.tPerfMs !== this.lastSeen) { this.diagnostics.rejectedFrames++; this.lastSeen = frame.tPerfMs; }
      this.reject(sample ? 'stale' : 'missing', sample ? 'Tracking is delayed. Keep your position while it catches up.' : 'Keep the required body points in view.', now);
      return;
    }
    if (sample.t <= this.lastFrame) return;
    this.lastSeen = sample.t;
    const dt = sample.t - this.lastFrame;
    if (this.missingSince !== null && now - this.missingSince >= cfg.lossResetMs) {
      this.retry('missing', 'Tracking was interrupted. Get back into view, then tap Try again.'); return;
    }
    if (dt > CONFIG.camera.staleMs || this.missingSince !== null) this.resetWindow();
    else this.diagnostics.validStepMs += dt;
    this.missingSince = null; this.lastFrame = sample.t; this.diagnostics.acceptedFrames++;
    if (this.diagnostics.validStepMs >= cfg.validTimeoutMs) {
      this.retry('timeout', this.reason === 'range' || this.reason === 'body-motion'
        ? 'We could not distinguish your movement. Adjust the phone angle, then try again. Do not force a larger movement.'
        : 'This position did not settle. Rest or adjust the phone, then try again.'); return;
    }
    const target = this.steps[this.state.step].kind;
    const posture = assessPosture(frame!, this.exercise, target, this.postureEndpoints[0], this.postureEndpoints[1]);
    this.posture = posture;
    // Posture geometry is advisory for the demo. Perspective and hidden limbs
    // must not veto otherwise usable head/shoulder or hip movement samples.
    if (posture.angle !== undefined && posture.torso !== undefined && Number.isFinite(posture.angle) && Number.isFinite(posture.torso)) {
      this.postureEvidence.push({t:sample.t,angle:posture.angle,torso:posture.torso});
    }
    while (this.postureEvidence.length > 1 && this.postureEvidence[0].t < sample.t - cfg.stableMs) this.postureEvidence.shift();
    if (this.postureEvidence.length > CONFIG.calibration.sampleCapacity) this.postureEvidence.shift();
    this.window.add(sample);
    const estimate = this.window.estimate();
    if (!estimate) return;
    const { endpoint, stable } = estimate;
    this.diagnostics.noise = endpoint.noise;
    if (!stable) { this.reason = 'unstable'; this.guidance = 'Pause briefly at this position so we can measure it.'; this.pauseCapture(); return; }
    const baseline = this.endpoints[0];
    if (baseline && (Math.abs(endpoint.x - baseline.x) > Math.max(cfg.minSetupShift, cfg.setupShiftScale * baseline.scale) ||
      endpoint.scale / baseline.scale > cfg.maxScaleRatio || baseline.scale / endpoint.scale > cfg.maxScaleRatio)) {
      // Wait for a full stable window before discarding completed checkpoints.
      this.reason = 'setup'; this.guidance = 'Your position or camera distance changed. Hold still to recheck.';
      this.pauseCapture();
      if (this.window.span >= cfg.stableMs && this.window.count >= cfg.minSamples) this.retry('setup', 'Your position or camera distance changed. Place the phone again and tap Try again.');
      return;
    }
    const step = this.steps[this.state.step];
    const previous = this.endpoints.at(-1);
    if (previous) {
      const travel = (endpoint.y - previous.y) * (step.kind === 'down' ? 1 : -1);
      const required = Math.max(cfg.minRange, cfg.rangeScale * baseline.scale, cfg.noiseMultiplier * Math.max(previous.noise, endpoint.noise));
      if (travel < required) {
        this.reason = 'range'; this.guidance = step.kind === 'up' ? 'Move to your comfortable top position, then pause.' : 'Move to your comfortable lower position, then pause.';
        this.pauseCapture(); return;
      }
      if (this.exercise === 'pushup' && (endpoint.shoulderY - previous.shoulderY) * (step.kind === 'down' ? 1 : -1) < Math.max(cfg.minShoulderTravel, baseline.scale * cfg.shoulderTravelScale)) {
        this.reason = 'body-motion'; this.guidance = 'Keep your shoulders visible as your body moves; head movement alone is not enough.';
        this.pauseCapture(); return;
      }
      const referenceIndex = this.steps.findIndex((s, i) => i < this.state.step && s.kind === step.kind);
      if (referenceIndex >= 0) {
        const reference = this.endpoints[referenceIndex];
        const learnedRange = Math.abs(this.endpoints[1].y - baseline.y);
        const tolerance = Math.max(learnedRange * cfg.repeatTolerance, cfg.repeatNoiseMultiplier * Math.max(reference.noise, endpoint.noise));
        if (Math.abs(endpoint.y - reference.y) > tolerance) {
          this.reason = 'repeat'; this.guidance = 'Return to the same comfortable position as before, or restart setup.';
          this.pauseCapture(); return;
        }
      }
    }
    this.reason = 'observing';
    // Give the movement instruction time to land, then announce a distinct hold.
    // Only fresh, eligible observations advance this hold; interruptions reset it.
    if (this.diagnostics.validStepMs < cfg.cueLeadMs) {
      this.guidance = 'Get into position. We will tell you when to hold.';
      return;
    }
    if (this.captureSince === null) {
      this.captureSince = sample.t;
      this.change({ cue: 'hold', message: 'Stay there. Hold still while we measure.' });
    }
    this.guidance = 'Measuring your position… Keep holding.';
    this.progress = Math.min(1, (sample.t - this.captureSince) / cfg.captureHoldMs, this.window.span / cfg.stableMs, this.window.count / cfg.minSamples, this.diagnostics.validStepMs / cfg.settleMs);
    if (this.progress < 1) return;
    this.endpoints.push(endpoint);
    this.postureEndpoints.push(this.postureEvidence.length ? { angle: median(this.postureEvidence.map(p => p.angle)), hipY: endpoint.y, torso: median(this.postureEvidence.map(p => p.torso)) } : undefined);
    if (this.state.step < this.steps.length - 1) this.enter(this.state.step + 1);
    else this.finish();
  }
  private finish() {
    const values = (kind: 'up' | 'down') => this.endpoints.filter((_, i) => this.steps[i].kind === kind);
    const topY = median(values('up').map(p => p.y)), bottomY = median(values('down').map(p => p.y));
    const result: Calibration = {
      joint: this.exercise === 'pushup' ? 'nose' : 'waist',
      centerX: median(this.endpoints.map(p => p.x)), centerY: (topY + bottomY) / 2,
      topY, bottomY, scale: median(this.endpoints.map(p => p.scale)),
      scaleTop: median(values('up').map(p => p.scale)), scaleBottom: median(values('down').map(p => p.scale)),
      profile: { schemaVersion: 3, exercise: this.exercise, featureId: this.exercise === 'pushup' ? 'nose-y' : 'waist-y',
        modelVersion: 'mediapipe-lite-1.1.1', verifiedCycles: 2, noise: Math.max(...this.endpoints.map(p => p.noise)),
        samples: this.endpoints.reduce((sum, p) => sum + p.samples, 0), createdAt: Date.now() },
    };
    if (!validCalibration(result)) { this.retry('range', 'The movement range was not clear enough. Adjust the phone angle and try again.'); return; }
    this.result = result; this.progress = 1; this.reason = 'verified'; this.guidance = 'Two movement sequences verified.';
    this.change({ phase: 'ready', message: 'Saved. Calibration complete. Get ready to play.' });
  }
}
