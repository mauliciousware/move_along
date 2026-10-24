import { validateWorkLimits } from './work-limits';
import { validateFlowMap } from './flow';
import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { BeatMap, NoteType } from '../shared/pushup-types';
/** Reject unsafe or malformed maps before the runtime can accept them. */
export function validateMap(map: BeatMap): string[] {
  if (map.mode === 'flow') return validateFlowMap(map);
  const errors: string[] = [];
  const fail = (id: string, why: string) => errors.push(`${id}: ${why}`);
  const finite = (n: number) => Number.isFinite(n);
  if (map.version!==1 || map.difficulty!=='intermediate' || !finite(map.bpm) || map.bpm<=0 || !finite(map.durationMs) || map.durationMs<=0 || !finite(map.firstBeatMs)) fail('map','invalid header');
  const ids = new Set<string>();
  let vertical: 'DOWN'|'UP' = 'UP', previousVertical = -Infinity, previousTime = -Infinity;
  let workStart: number | null = null, fastReps=0, slowSteps=0;
  const beatMs=60000/map.bpm;
  const candidates=[1,2,3,4].map(n=>n*beatMs).filter(n=>n>=CONFIG.cadence.minGapVerticalMs*CONFIG.cadence.hardFloorRatio);
  const fastStep=candidates.sort((a,b)=>Math.abs(a-CONFIG.cadence.minGapVerticalMs)-Math.abs(b-CONFIG.cadence.minGapVerticalMs))[0] ?? CONFIG.cadence.minGapVerticalMs;
  for (let i=0;i<map.rests.length;i++) {
    const r=map.rests[i];
    if (![r.startMs,r.endMs].every(finite) || r.startMs<0 || r.endMs>map.durationMs || r.endMs-r.startMs<CONFIG.map.minRestMs || r.endMs-r.startMs>CONFIG.map.maxRestMs) fail(`rest-${i}`,'invalid rest duration');
    if(i && r.startMs<map.rests[i-1].endMs) fail(`rest-${i}`,'overlapping or unsorted rests');
  }
  for (const n of map.notes) {
    if(!n.id || ids.has(n.id)) fail(n.id,'duplicate/missing id'); ids.add(n.id);
    if(![n.time,n.duration].every(finite) || n.time<CONFIG.map.firstNoteMs || n.duration<0 || n.time+n.duration>map.durationMs-CONFIG.map.endPaddingMs) fail(n.id,'invalid time or padding');
    if(n.time<previousTime) fail(n.id,'not sorted');
    if(!(['DOWN','UP','HOLD'] as NoteType[]).includes(n.type)) fail(n.id,'unsupported movement');
    if(map.rests.some(r=>n.time<r.endMs && n.time+n.duration>=r.startMs)) fail(n.id,'note overlaps REST');
    if(map.rests.some(r=>r.startMs>=previousTime && r.endMs<=n.time)) { workStart=null; fastReps=0; slowSteps=0; }
    workStart ??= n.time;
    if(n.time-workStart>CONFIG.cadence.maxWorkStretchMs) fail(n.id,'work stretch exceeds 40 seconds');
    if(n.type==='HOLD') {
      if(!['TOP','BOTTOM'].includes(n.position ?? '') || n.duration<CONFIG.hold.minMs || n.duration>CONFIG.hold.maxMs || (n.position==='BOTTOM' && n.duration>CONFIG.hold.minMs)) fail(n.id,'invalid HOLD position/duration');
      if((n.position==='TOP' && vertical!=='UP') || (n.position==='BOTTOM' && vertical!=='DOWN')) fail(n.id,'HOLD in wrong position');
      for(const other of map.notes) if(other!==n && other.time>=n.time-CONFIG.hold.entryMs && other.time<=n.time+n.duration+CONFIG.cadence.postHoldRecoveryMs) fail(other.id,`overlaps HOLD ${n.id}`);
      workStart=null; fastReps=0; slowSteps=0;
    } else if(n.type==='DOWN' || n.type==='UP') {
      if(n.duration!==0) fail(n.id,'vertical note has duration');
      if(n.type===vertical) fail(n.id,'vertical notes must alternate starting DOWN');
      const gap=n.time-previousVertical;
      if(gap<CONFIG.cadence.minGapVerticalMs*CONFIG.cadence.hardFloorRatio) fail(n.id,'vertical gap below hard floor');
      if(gap>=2*fastStep) slowSteps++; else slowSteps=0;
      if(slowSteps>=4) fastReps=0;
      if(n.type==='UP' && gap<=fastStep/CONFIG.cadence.hardFloorRatio) fastReps++;
      if(fastReps>CONFIG.cadence.maxFastReps) fail(n.id,'more than ten fast reps without recovery');
      vertical=n.type; previousVertical=n.time;
    }
    previousTime=n.time;
  }
  if(map.exercise||map.songId.startsWith('pushup-'))errors.push(...validateWorkLimits(map));
  return errors;
}
