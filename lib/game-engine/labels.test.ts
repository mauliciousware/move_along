import { expect, it } from 'vitest';
import { holdLabel, repLabel } from './labels';

it('labels reps and top holds for each exercise', () => {
  expect(repLabel('pushup')).toBe('PUSH-UPS');
  expect(repLabel('squat')).toBe('SQUATS');
  expect(holdLabel('pushup')).toBe('PLANK');
  expect(holdLabel('squat')).toBe('HOLD');
});
