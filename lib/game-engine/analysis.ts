import type { PlayedNote } from './session';
import { judged, type Stats } from './scoring';

/** Derived in-memory game measurements, never a posture or health assessment. */
export function analyzeSession(notes: PlayedNote[], stats: Stats, observed: number, valid: number, keyboard: boolean, flow = false) {
  const hits = notes.filter(n => n.note.type !== 'HOLD' && n.status !== 'pending' && n.status !== 'skipped' && n.status !== 'miss' && Number.isFinite(n.delta));
  const averageErrorMs = hits.length ? Math.round(hits.reduce((sum, n) => sum + Math.abs(n.delta!), 0) / hits.length) : null;
  return {
    judged: flow ? notes.filter(n => n.status !== 'pending').length : judged(stats),
    weightedPoints: 100 * stats.perfect + 75 * stats.good + 40 * stats.ok,
    pending: notes.filter(n => n.status === 'pending').length,
    skipped: stats.skipped,
    averageErrorMs: flow ? null : averageErrorMs,
    timedHits: flow ? 0 : hits.length,
    holds: notes.filter(n => !!n.meter && n.status !== 'pending').length,
    totalHolds: notes.filter(n => !!n.meter).length,
    coverage: !keyboard && observed > 0 ? Math.round(100 * valid / observed) : null,
    validFrames: valid,
    observedFrames: observed,
    keyboard,
    flow,
  };
}
export type SessionAnalysis = ReturnType<typeof analyzeSession>;
