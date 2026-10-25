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
  const map=flowMap({...song.map,exercise,songId:`${exercise}-${song.id}`});
  const reps=map.meta.counts.reps, holds=map.meta.counts.holds;
  const description=exercise==='squat'
   ?`${reps} squats · ${holds} holds · your pace · no rests`
   :`${reps} push-ups · ${holds} plank holds · your pace · no rests`;
  return {...song,map,description};
 });
}
