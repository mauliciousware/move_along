import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { GameSession } from './session';
import type { InputType } from '../shared/pushup-types';

export const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Position is feedback; only a timestamped crossing can award a target. */
export function movementFill(type: InputType, p: number) {
  if (!Number.isFinite(p)) return 0;
  return type === 'UP' || type === 'LEFT' || type === 'RIGHT'
    ? clamp(p / CONFIG.thresholds.up)
    : clamp((1 - p) / (1 - CONFIG.thresholds.down));
}

/** The renderer and input judge share the same chronological cue order. */
export function targetCue(game: GameSession, songMs: number) {
  const rest = game.getRest(songMs);
  const current = rest ? undefined : game.notes.find(note => note.status === 'pending');
  const next = current ? game.notes.find(note => note.status === 'pending' && note.note.time > current.note.time) : undefined;
  const remainingMs = current ? current.note.time - (songMs - game.latency) : 0;
  return {
    current, next, rest, remainingMs,
    approaching: !!current && remainingMs <= CONFIG.lookaheadMs,
    timing: current ? clamp(1 - remainingMs / CONFIG.lookaheadMs) : 0,
  };
}

/** One self-paced instruction: no clock, no preview, no early/late state. */
export interface FlowTargetView { kind: 'DOWN' | 'UP' | 'HOLD' | 'DONE'; label: string; fill: number; seconds: number; sub: string }
export function flowTarget(game: GameSession, p: number, tracked: boolean): FlowTargetView {
  const current = game.current;
  if (!current) return { kind: 'DONE', label: 'DONE', fill: 1, seconds: 0, sub: 'SESSION COMPLETE' };
  if (current.meter) {
    const seconds = Math.max(0, Math.ceil((current.meter.duration - current.meter.valueMs) / 1000));
    return {
      kind: 'HOLD', label: 'PLANK', fill: current.meter.ratio, seconds,
      sub: tracked ? 'HOLD STEADY AT THE TOP' : 'HOLD STILL — TRACKING',
    };
  }
  if (current.note.type === 'DOWN' || current.note.type === 'UP') {
    return {
      kind: current.note.type, label: current.note.type === 'DOWN' ? 'GO DOWN' : 'GO UP',
      fill: tracked ? movementFill(current.note.type, p) : 0, seconds: 0,
      sub: tracked ? 'MOVE TO CLOSE THE RING' : 'FIND YOUR POSITION',
    };
  }
  return { kind: 'DONE', label: 'READY', fill: 0, seconds: 0, sub: '' };
}

/** Readable instructions are independent of fill: a full ring never implies a hit. */
export function movementGuidance(game: GameSession, songMs: number, p: number, tracked: boolean, playing: boolean) {
  const cue = targetCue(game, songMs);
  const type = cue.current?.note.type;
  const directional = type === 'UP' || type === 'DOWN' || type === 'LEFT' || type === 'RIGHT';
  const active = playing && tracked && cue.approaching && directional && !cue.rest;
  const fill = active ? movementFill(type, p) : 0;
  const early = active && game.earlyArrivalId === cue.current?.note.id;
  const prompt = !tracked ? 'FIND YOUR POSITION' : early ? 'REACHED EARLY' :
    !active || cue.remainingMs > CONFIG.guidance.moveLeadMs ? 'GET READY' : `${type} NOW`;
  const status = early ? 'FOLLOW THE NEXT CUE' : fill >= 1 ? 'POSITION REACHED' : 'REACH ON THE BEAT';
  return { ...cue, active, fill, prompt, status, early };
}
