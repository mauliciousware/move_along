import { expect, it } from 'vitest';
import { ExerciseMovement } from './movement';
import type { InputEvent } from '../shared/pushup-types';

it('counts a full down-up cycle from the normalized signal', () => {
  const events: InputEvent[] = [];
  const movement = new ExerciseMovement('squat', event => events.push(event));
  movement.update(0, { p: 1, left: 0, right: 0, ok: true });
  movement.update(100, { p: 0.2, left: 0, right: 0, ok: true });
  for (let t = 200; t <= 600; t += 100) movement.update(t, { p: 0.2, left: 0, right: 0, ok: true });
  movement.update(700, { p: 0.9, left: 0, right: 0, ok: true });
  expect(movement.count).toBe(1);
  expect(events.map(event => event.type)).toEqual(['DOWN', 'UP']);
});

it('requires tracking to recover before counting again', () => {
  const movement = new ExerciseMovement('pushup', () => {});
  movement.update(0, { p: 1, left: 0, right: 0, ok: true });
  movement.update(200, { p: 0.2, left: 0, right: 0, ok: false });
  movement.update(400, { p: 0.2, left: 0, right: 0, ok: true });
  expect(movement.count).toBe(0);
});
