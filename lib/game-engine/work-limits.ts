import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { BeatMap } from '../shared/pushup-types';
/** Additional Move Along work limits; holds are work, never a recovery reset. */
export function validateWorkLimits(map:BeatMap):string[]{
 const errors:string[]=[];
 let start:number|null=null,previousVertical=-Infinity,previousEnd=0;
 for(const note of map.notes){
   const recovery=map.rests.find(r=>r.startMs>=previousEnd&&r.endMs<=note.time);
   if(recovery){if(recovery.endMs-recovery.startMs<CONFIG.workout.restMs)errors.push('Recovery must last at least 15 seconds');start=null;}
   start??=note.time;
   if(note.time+note.duration-start>CONFIG.workout.maxWorkMs)errors.push(`${note.id}: work including holds exceeds 30 seconds`);
   if(note.type==='HOLD'&&(note.position!=='TOP'||note.duration!==CONFIG.workout.holdMs))errors.push(`${note.id}: only three-second TOP holds are supported`);
   if(note.type==='DOWN'||note.type==='UP'||note.type==='LEFT'||note.type==='RIGHT'){
     if(note.time-previousVertical<CONFIG.workout.minGapMs)errors.push(`${note.id}: phase cues must be at least two seconds apart`);
     previousVertical=note.time;
   }
   previousEnd=note.time+note.duration;
 }
 return errors;
}
