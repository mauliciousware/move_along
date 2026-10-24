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
