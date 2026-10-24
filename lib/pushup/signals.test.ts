import { describe, expect, it } from 'vitest';
import { normalizePose } from './signals';
import { validCalibration } from './calibration';
import type { Calibration, PoseFrame } from '../shared/pushup-types';

const frame: PoseFrame = {
  tPerfMs: 0,
  nose: { x: 0.62, y: 0.5 },
  waist: { x: 0.5, y: 0.4 },
  shoulderWidth: 0.4,
  confidence: 0.9,
  ok: true,
};

describe('tracked centre selection', () => {
  it('uses the nose for a push-up calibration', () => {
    const cal: Calibration = { joint: 'nose', centerX: 0.6, centerY: 0.5, topY: 0.3, bottomY: 0.7, scale: 0.4 };
    expect(normalizePose(frame, cal).p).toBeCloseTo(0.5);
  });

  it('uses the waist for a sit-up calibration', () => {
    const cal: Calibration = { joint: 'waist', centerX: 0.5, centerY: 0.6, topY: 0.4, bottomY: 0.6, scale: 0.4 };
    expect(normalizePose(frame, cal).p).toBeCloseTo(1);
  });
});

describe('stored calibration contract', () => {
  it('rejects a stored calibration without a tracked joint', () => {
    const legacy = { centerX: 0.5, centerY: 0.5, topY: 0.3, bottomY: 0.7, scale: 0.4 };
    expect(validCalibration(legacy)).toBe(false);
  });

  it('rejects an unknown tracked joint', () => {
    const unknown = { joint: 'ear', centerX: 0.5, centerY: 0.5, topY: 0.3, bottomY: 0.7, scale: 0.4 };
    expect(validCalibration(unknown)).toBe(false);
  });
});
