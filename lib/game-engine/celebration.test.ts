import { describe, expect, it } from 'vitest';
import { RepCelebration } from './celebration';
import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
describe('complete-rep celebrations', () => {
  it('fires at five completed reps, expires, and does not replay on unchanged counts', () => {
    const reward = new RepCelebration();
    expect(reward.update(4, 0)).toBeNull();
    expect(reward.update(5, 10)?.reps).toBe(5);
    expect(reward.update(5, 10 + CONFIG.celebration.durationMs)).toBeNull();
    expect(reward.update(6, 2000)).toBeNull();
    expect(reward.update(10, 3000)?.reps).toBe(10);
  });
  it('does not replay past milestones after camera remount or recalibration', () => {
    const reward = new RepCelebration(10);
    expect(reward.update(10, 0)).toBeNull();
    expect(reward.update(15, 100)?.reps).toBe(15);
  });
});
