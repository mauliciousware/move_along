import shakira from '@/data/beatmaps/pushup-shakira.json';
import dev from '@/data/beatmaps/pushup-dev.json';
import type { ExerciseId } from './types';
import type { BeatMap } from './pushup-types';
import { flowMap } from '../game-engine/flow';
export const PUSHUP_SONGS = [
 { id:'shakira',title:"Hips Don’t Lie",artist:'Shakira feat. Wyclef Jean',file:'/audio/pushup-shakira.mp3',offsetMs:0,map:shakira as BeatMap,description:'2:58 · 16 planned push-ups · holds + rest breaks',localOnly:true },
 { id:'dev',title:'Pixel practice beat',artist:'Move Along · original click track',file:'/audio/dev-click.wav',offsetMs:0,map:dev as BeatMap,description:'1:30 · 8 planned push-ups · holds + rest breaks',localOnly:false },
] as const;
export interface PushupSong {id:string;title:string;artist:string;file:string;offsetMs:number;map:BeatMap;description:string;localOnly:boolean}
export function songsFor(exercise:ExerciseId):PushupSong[]{
 return PUSHUP_SONGS.map(song=>{
  if(exercise==='pushup'){
   const map=flowMap({...song.map,exercise,songId:`pushup-${song.id}`});
   return {...song,map,description:`${map.meta.counts.reps} push-ups · ${map.meta.counts.holds} plank holds · your pace · no rests`};
  }
  const map:BeatMap={...song.map,exercise,songId:`${exercise}-${song.id}`,notes:song.map.notes.filter(n=>exercise!=='march'||n.type!=='HOLD').map(n=>({...n,type:exercise==='march'?(n.type==='DOWN'?'LEFT':'RIGHT'):n.type}))};
  const count=map.notes.filter(n=>exercise==='march'?n.type==='LEFT'||n.type==='RIGHT':n.type==='UP').length;
  return {...song,map,description:`${Math.floor(map.durationMs/60000)}:${String(Math.floor(map.durationMs/1000)%60).padStart(2,'0')} · ${count} planned ${exercise==='march'?'steps':exercise==='squat'?'squats':'push-ups'} · rest breaks`};
 });
}
