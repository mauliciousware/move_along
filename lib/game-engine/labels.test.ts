import { expect, it } from 'vitest';
import { holdLabel, repLabel } from './labels';

it('labels reps and top holds for each exercise', () => {
  expect(repLabel('pushup')).toBe('PUSH-UPS');
  expect(repLabel('situp')).toBe('SIT-UPS');
  expect(holdLabel('pushup')).toBe('PLANK');
  expect(holdLabel('situp')).toBe('HOLD');
});
