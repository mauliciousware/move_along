import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { BeatMap, Note } from '../shared/pushup-types';

/**
 * A flow script is an ordered list, never a beat timeline. `time` only keeps a
 * stable order; the session advances when the player completes each target.
 */
export function flowNotes(): Note[] {
  const notes: Note[] = [];
  let serial = 0;
  for (const holdMs of CONFIG.flow.holdsMs) {
    for (let rep = 0; rep < CONFIG.flow.repsPerSet; rep++) {
      notes.push({ id: `flow-${++serial}`, time: serial, type: 'DOWN', duration: 0 });
      notes.push({ id: `flow-${++serial}`, time: serial, type: 'UP', duration: 0 });
    }
    notes.push({ id: `flow-${++serial}`, time: serial, type: 'HOLD', duration: holdMs, position: 'TOP' });
  }
  return notes;
}

/** Replace a song's beat script with the self-paced push-up flow. */
export function flowMap(base: BeatMap): BeatMap {
  const notes = flowNotes();
  return {
    ...base,
    mode: 'flow',
    rests: [],
    notes,
    sections: [{ label: 'build', startMs: 0, endMs: base.durationMs, intensity: 2 }],
    meta: {
      intensityCurve: [],
      counts: {
        reps: notes.filter(note => note.type === 'UP').length,
        holds: notes.filter(note => note.type === 'HOLD').length,
      },
      generatedBy: 'move-along-flow',
    },
  };
}

/** Flow maps have no clock, so only their order and hold shape can be invalid. */
export function validateFlowMap(map: BeatMap): string[] {
  const errors: string[] = [];
  const fail = (id: string, why: string) => errors.push(`${id}: ${why}`);
  const finite = (value: number) => Number.isFinite(value);
  if (map.version !== 1 || map.difficulty !== 'intermediate' || !finite(map.bpm) || map.bpm <= 0 || !finite(map.durationMs) || map.durationMs <= 0) fail('map', 'invalid header');
  if (map.rests.length) fail('map', 'flow sessions have no rests');
  if (!map.notes.length) fail('map', 'flow session has no targets');

  const ids = new Set<string>();
  let next: 'DOWN' | 'UP' = 'DOWN';
  let previous: Note['type'] | null = null;
  for (const note of map.notes) {
    if (!note.id || ids.has(note.id)) fail(note.id || 'note', 'duplicate/missing id');
    ids.add(note.id);
    if (note.type === 'HOLD') {
      if (previous !== 'UP') fail(note.id, 'HOLD must follow a completed UP');
      if (note.position !== 'TOP') fail(note.id, 'only a TOP plank hold is supported');
      if (!(CONFIG.flow.holdsMs as readonly number[]).includes(note.duration) || note.duration > CONFIG.flow.maxHoldMs) fail(note.id, 'unsupported plank HOLD length');
      next = 'DOWN';
    } else if (note.type === 'DOWN' || note.type === 'UP') {
      if (note.duration !== 0) fail(note.id, 'movement target has duration');
      if (note.type !== next) fail(note.id, 'targets must alternate starting DOWN');
      next = note.type === 'DOWN' ? 'UP' : 'DOWN';
    } else {
      fail(note.id, 'unsupported flow movement');
    }
    previous = note.type;
  }
  return errors;
}
