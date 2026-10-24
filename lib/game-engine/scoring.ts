import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { Grade } from '../shared/pushup-types';
export interface Stats {
  score: number; combo: number; maxCombo: number;
  perfect: number; good: number; ok: number; miss: number; skipped: number;
  reps: number; plankTimeMs: number; workoutTimeMs: number; endedEarly: boolean;
}
export function newStats(): Stats { return { score:0, combo:0, maxCombo:0, perfect:0, good:0, ok:0, miss:0, skipped:0, reps:0, plankTimeMs:0, workoutTimeMs:0, endedEarly:false }; }
export function multiplier(combo: number) { return CONFIG.comboMultipliers.find(([minimum]) => combo >= minimum)?.[1] ?? 1; }
export function gradeDelta(delta: number): Grade | null {
  const d = Math.abs(delta);
  return d <= CONFIG.windows.perfect ? 'perfect' : d <= CONFIG.windows.good ? 'good' : d <= CONFIG.windows.ok ? 'ok' : null;
}
export function award(stats: Stats, grade: Grade, hold = false) {
  stats[grade]++;
  stats.score += Math.round(CONFIG.points[grade] * multiplier(stats.combo) * (hold ? CONFIG.holdPointsFactor : 1));
  stats.combo = grade === 'miss' ? 0 : stats.combo + 1;
  stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
}
export function judged(s: Stats) { return s.perfect + s.good + s.ok + s.miss; }
export function accuracy(s: Stats) { const n = judged(s); return n ? (100*s.perfect + 75*s.good + 40*s.ok)/(100*n) : 0; }
export function rank(s: Stats) { const a=accuracy(s); return judged(s)<CONFIG.rank.minJudged ? '—' : a>=CONFIG.rank.S?'S':a>=CONFIG.rank.A?'A':a>=CONFIG.rank.B?'B':'C'; }
export function calories(s: Stats) { return Math.round(s.reps*CONFIG.kcal.perPushup+s.plankTimeMs/1000*CONFIG.kcal.perPlankSecond); }
export function tier(combo: number) { let level=0;for(const threshold of CONFIG.game.tierCombos)if(combo>=threshold)level++;return level; }

/** Truncate the displayed percentage so it never rounds across a rank boundary. */
export function accuracyLabel(s: Stats) {
  const precision=10**CONFIG.stats.accuracyDecimals;
  return judged(s) ? `${(Math.floor(accuracy(s)*100*precision)/precision).toFixed(CONFIG.stats.accuracyDecimals)}%` : '—';
}
