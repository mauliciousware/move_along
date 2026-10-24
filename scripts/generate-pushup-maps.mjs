import fs from 'node:fs';
// Preserve the supplied song's analyzed tempo/phase, with Move Along's gentler work/rest profile.
import { PUSHUP_CONFIG as CONFIG } from '../lib/shared/config.ts';
const profile = {...CONFIG.workout,firstMs:CONFIG.map.firstNoteMs,endMs:CONFIG.map.endPaddingMs};
function generate(songId,bpm,firstBeatMs,durationMs) {
 const beat=60000/bpm, step=Math.ceil(profile.minGapMs/beat)*beat;
 const snap=t=>firstBeatMs+Math.ceil((t-firstBeatMs)/beat)*beat;
 const notes=[],rests=[];let start=snap(profile.firstMs),serial=0;
 while(start+profile.pairs*2*step+profile.holdMs+profile.endMs<durationMs) {
   for(let i=0;i<profile.pairs*2;i++)notes.push({id:`${songId}-${++serial}`,time:Math.round(start+i*step),type:i%2?'UP':'DOWN',duration:0});
   const hold=Math.round(start+profile.pairs*2*step),end=hold+profile.holdMs;
   notes.push({id:`${songId}-${++serial}`,time:hold,type:'HOLD',duration:profile.holdMs,position:'TOP'});
   if(end+profile.restMs<durationMs-profile.endMs)rests.push({startMs:end+1,endMs:end+1+profile.restMs});
   start=snap(end+1+profile.restMs+CONFIG.workout.readyMs);
 }
 return {version:1,songId,difficulty:'intermediate',bpm,firstBeatMs,durationMs,sections:[{label:'build',startMs:0,endMs:durationMs,intensity:2}],rests,notes,meta:{intensityCurve:[.3,.5,.7,.5],counts:{DOWN:notes.filter(n=>n.type==='DOWN').length,UP:notes.filter(n=>n.type==='UP').length,HOLD:notes.filter(n=>n.type==='HOLD').length},generatedBy:'Move Along spaced beat-grid adaptation v1'}};
}
fs.mkdirSync('data/beatmaps',{recursive:true});
for(const [name,args] of [['pushup-shakira',['pushup-shakira',100.27013,85.006,178000]],['pushup-dev',['pushup-dev',120,0,90000]]])fs.writeFileSync(`data/beatmaps/${name}.json`,JSON.stringify(generate(...args),null,2)+'\n');
