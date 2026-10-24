import shakira from '@/data/beatmaps/pushup-shakira.json';
import dev from '@/data/beatmaps/pushup-dev.json';
import type { BeatMap } from './pushup-types';
export const PUSHUP_SONGS = [
 { id:'shakira',title:"Hips Don’t Lie",artist:'Shakira feat. Wyclef Jean',file:'/audio/pushup-shakira.mp3',offsetMs:0,map:shakira as BeatMap,description:'2:58 · 16 planned push-ups · holds + rest breaks',localOnly:true },
 { id:'dev',title:'Pixel practice beat',artist:'Move Along · original click track',file:'/audio/dev-click.wav',offsetMs:0,map:dev as BeatMap,description:'1:30 · 8 planned push-ups · holds + rest breaks',localOnly:false },
] as const;
export type PushupSong = typeof PUSHUP_SONGS[number];
