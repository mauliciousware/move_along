import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { PlayedNote } from './session';
import type { ExerciseId } from '../shared/types';
import type { Stats } from './scoring';
export interface SessionFeedback { highlight: string; next: string; tracking?: string }
export function sessionFeedback(notes: readonly PlayedNote[], stats: Stats, camera = false, bodySamples = 0, bodyVisibleSamples = 0, exercise: ExerciseId = 'pushup', flow = false): SessionFeedback {
  const cfg = CONFIG.feedback;
  let tracking: string | undefined;
  let elbowsHidden = false;
  if (camera && exercise === 'pushup') {
    if (bodySamples < cfg.minBodySamples) tracking = 'Not enough body-tracking data for a camera-setup observation.';
    else if (bodyVisibleSamples / bodySamples < cfg.minBodyCoverage) {
      elbowsHidden = true;
      tracking = 'Camera visibility only; this does not assess exercise technique.';
    }
  }

  if (flow) {
    const holds = notes.filter(n => !!n.meter && n.status !== 'pending').length;
    const holdSeconds = Math.round(stats.plankTimeMs / 1000);
    const highlight = stats.pushups > 0
      ? `You completed ${stats.pushups} push-ups and ${holds} plank ${holds === 1 ? 'hold' : 'holds'} for ${holdSeconds} seconds.`
      : 'You made time for a session. Go at your own pace.';
    let next = stats.endedEarly
      ? 'You stopped early. Rest, then come back when you are ready.'
      : 'Next time, keep closing the ring at the same steady pace.';
    if (elbowsHidden) next = 'Your elbows were not consistently visible to the tracker. Adjust the camera framing if you want the full arm overlay.';
    return { highlight, next, tracking };
  }

  const hits = notes.filter(n => n.status === 'perfect' || n.status === 'good' || n.status === 'ok');
  const vertical = hits.filter(n => n.note.type !== 'HOLD');
  let highlight = stats.pushups > 0 ? `You completed ${stats.pushups} ${stats.pushups===1?'rep':'reps'} this session.` : 'You made time for a session. Go at your own pace.';
  let next = 'Watch the timing bar. Reach the active target as the bar fills.';
  const holds = hits.filter(n => n.note.type === 'HOLD' && (n.status === 'perfect' || n.status === 'good'));
  if (holds.length) highlight = `You kept the hold meter steady through ${holds.length} ${holds.length === 1 ? 'hold' : 'holds'}.`;
  const up = vertical.filter(n=>n.note.type==='UP'), down = vertical.filter(n=>n.note.type==='DOWN');
  const quality = (rows: PlayedNote[]) => rows.reduce((sum,n)=>sum+CONFIG.points[n.status as 'perfect'|'good'|'ok'],0)/(rows.length*CONFIG.points.perfect);
  if (up.length >= cfg.minDirectionHits && down.length >= cfg.minDirectionHits && Math.abs(quality(up)-quality(down)) >= cfg.qualityDifference) {
    highlight = `Your ${quality(up)>quality(down)?'UP':'DOWN'} timing was your strongest across scored hits.`;
  } else if (!holds.length && stats.maxCombo >= CONFIG.game.tierCombos[0]) highlight = `You linked ${stats.maxCombo} beats in your longest combo.`;
  if (vertical.length < cfg.minHits) {
    next = 'Not enough scored movement beats for a timing pattern yet. Follow the timing bar at your own pace.';
  } else {
    for (const [name, rows] of [['DOWN', down], ['UP', up]] as const) {
      if (rows.length < cfg.minDirectionHits) continue;
      const early = rows.filter(n => n.delta !== undefined && n.delta < -CONFIG.windows.perfect).length;
      const late = rows.filter(n => n.delta !== undefined && n.delta > CONFIG.windows.perfect).length;
      if (early / rows.length >= cfg.biasRatio) { next = `Most of your scored ${name} hits were early. Wait for the timing bar to fill before reaching the target.`; break; }
      if (late / rows.length >= cfg.biasRatio) { next = `Most of your scored ${name} hits were late. Use the next-target preview to prepare for the beat.`; break; }
    }
  }
  if (elbowsHidden) next = 'Your elbows were not consistently visible to the tracker. Adjust the camera framing if you want the full arm overlay.';
  return { highlight, next, tracking };
}
