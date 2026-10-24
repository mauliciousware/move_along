import { CONFIG, PUSHUP_CONFIG as GAME } from '@/lib/shared/config';
import type { PoseFrame, PosePoint } from '@/lib/shared/types';
export interface StandingFeatures { knee: number; hip: number; left: number; right: number }
export interface StandingCalibration { exercise:'squat'|'march'; neutral:StandingFeatures; lower?:StandingFeatures; leftPeak?:number; rightPeak?:number; setupId:string }
export interface MovementSignal { p:number; left:number; right:number; ok:boolean }
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function angle(a:PosePoint,b:PosePoint,c:PosePoint){const u=[a.x-b.x,a.y-b.y],v=[c.x-b.x,c.y-b.y];const d=Math.hypot(...u)*Math.hypot(...v);return d>0?Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/d)))/Math.PI:NaN;}
export function standingFeatures(frame:PoseFrame|null):StandingFeatures|null {
 if(!frame?.usable)return null;
 const j=frame.joints, names=['leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'] as const;
 if(names.some(name=>!j[name]||j[name]!.visibility<CONFIG.tracking.minConfidence))return null;
 const lh=j.leftHip!,rh=j.rightHip!,lk=j.leftKnee!,rk=j.rightKnee!,la=j.leftAnkle!,ra=j.rightAnkle!;
 const leftLength=Math.hypot(lh.x-lk.x,lh.y-lk.y)+Math.hypot(lk.x-la.x,lk.y-la.y);
 const rightLength=Math.hypot(rh.x-rk.x,rh.y-rk.y)+Math.hypot(rk.x-ra.x,rk.y-ra.y);
 const length=(leftLength+rightLength)/2;
 if(leftLength<=0||rightLength<=0)return null;
 const f={knee:(angle(lh,lk,la)+angle(rh,rk,ra))/2,hip:((la.y+ra.y)-(lh.y+rh.y))/2/length,left:(lh.y-lk.y)/leftLength,right:(rh.y-rk.y)/rightLength};
 return Object.values(f).every(Number.isFinite)?f:null;
}
export function standingSignal(f:StandingFeatures|null,cal:StandingCalibration|null):MovementSignal {
 if(!f||!cal)return {p:1,left:0,right:0,ok:false};
 if(cal.exercise==='squat'&&cal.lower){
   const knee=(f.knee-cal.lower.knee)/(cal.neutral.knee-cal.lower.knee),hip=(f.hip-cal.lower.hip)/(cal.neutral.hip-cal.lower.hip);
   return {p:clamp((knee+hip)/2),left:0,right:0,ok:Number.isFinite(knee)&&Number.isFinite(hip)&&Math.abs(clamp(knee)-clamp(hip))<=GAME.standing.coherence};
 }
 const left=(f.left-cal.neutral.left)/(cal.leftPeak!-cal.neutral.left),right=(f.right-cal.neutral.right)/(cal.rightPeak!-cal.neutral.right);
 return {p:1,left:clamp(left),right:clamp(right),ok:Number.isFinite(left)&&Number.isFinite(right)};
}
export const STANDING_STEPS={squat:['Stand comfortably and hold still.','Lower into a comfortable squat and hold briefly.','Return to standing and hold still.','Repeat your comfortable squat and hold briefly.','Return to standing and hold still.'],march:['Stand comfortably with both feet down.','Lift your left knee comfortably and hold briefly.','Return both feet to the floor.','Lift your right knee comfortably and hold briefly.','Return both feet to the floor.','Lift your left knee once more.','Return both feet to the floor.','Lift your right knee once more.','Return both feet to the floor.']} as const;
export class StandingCalibrationSession {
 step=0; progress=0; result:StandingCalibration|null=null; message:string;
 private samples:{time:number;value:StandingFeatures}[]=[];private last=-Infinity;private entered=0;
 private neutral:StandingFeatures|null=null;private lower?:StandingFeatures;private leftPeak?:number;private rightPeak?:number;
 constructor(readonly exercise:'squat'|'march',private changed:()=>void){this.message=STANDING_STEPS[exercise][0];}
 update(frame:PoseFrame|null,now:number){
  if(this.result)return;
  const features=standingFeatures(frame),cfg=GAME.standing;
  if(!frame||!features||(now<frame.tPerfMs||now-frame.tPerfMs>CONFIG.camera.staleMs)){this.samples=[];this.progress=0;return;}
  if(frame.tPerfMs<=this.last)return;
  if(frame.tPerfMs-this.last>CONFIG.camera.staleMs)this.samples=[];
  this.last=frame.tPerfMs;this.entered ||= now;
  if(now-this.entered>cfg.timeoutMs){this.message='Take your time. '+STANDING_STEPS[this.exercise][this.step];this.entered=now;this.changed();}
  this.samples.push({time:frame.tPerfMs,value:features});
  while(this.samples.length>1&&this.samples[1].time<=frame.tPerfMs-cfg.stableMs)this.samples.shift();
  if(this.samples.length>cfg.maxSamples)this.samples.shift();
  const keys=['knee','hip','left','right'] as const;
  const median=(k:typeof keys[number])=>{const values=this.samples.map(s=>s.value[k]).sort((a,b)=>a-b);return values[Math.floor(values.length/2)];};
  const value=Object.fromEntries(keys.map(k=>[k,median(k)])) as unknown as StandingFeatures;
  const stable=keys.every(k=>Math.sqrt(this.samples.reduce((sum,s)=>sum+(s.value[k]-value[k])**2,0)/this.samples.length)<cfg.stableStd);
  let appropriate=true;
  if(this.neutral){
    if(this.exercise==='squat')appropriate=this.step%2===1?this.neutral.knee-value.knee>=cfg.minKneeRange&&this.neutral.hip-value.hip>=cfg.minHipRange:Math.abs(value.knee-this.neutral.knee)<cfg.returnTolerance&&Math.abs(value.hip-this.neutral.hip)<cfg.returnTolerance;
    else if(this.step===1||this.step===5)appropriate=value.left-this.neutral.left>=cfg.minLift&&Math.abs(value.right-this.neutral.right)<cfg.returnTolerance;
    else if(this.step===3||this.step===7)appropriate=value.right-this.neutral.right>=cfg.minLift&&Math.abs(value.left-this.neutral.left)<cfg.returnTolerance;
    else appropriate=Math.abs(value.left-this.neutral.left)<cfg.returnTolerance&&Math.abs(value.right-this.neutral.right)<cfg.returnTolerance;
  }
  if(this.exercise==='squat'&&this.step===3&&this.lower)appropriate&&=Math.abs(value.knee-this.lower.knee)<cfg.repeatTolerance&&Math.abs(value.hip-this.lower.hip)<cfg.repeatTolerance;
  if(this.exercise==='march'&&this.step===5&&this.leftPeak!==undefined)appropriate&&=Math.abs(value.left-this.leftPeak)<cfg.repeatTolerance;
  if(this.exercise==='march'&&this.step===7&&this.rightPeak!==undefined)appropriate&&=Math.abs(value.right-this.rightPeak)<cfg.repeatTolerance;
  this.progress=stable&&appropriate?Math.min(1,(frame.tPerfMs-this.samples[0].time)/cfg.stableMs):0;
  if(this.progress<1||this.samples.length<cfg.minSamples)return;
  if(this.step===0)this.neutral=value;
  else if(this.exercise==='squat'&&this.step===1)this.lower=value;
  else if(this.exercise==='march'&&this.step===1)this.leftPeak=value.left;
  else if(this.exercise==='march'&&this.step===3)this.rightPeak=value.right;
  if(this.step===STANDING_STEPS[this.exercise].length-1){this.result={exercise:this.exercise,neutral:this.neutral!,lower:this.lower,leftPeak:this.leftPeak,rightPeak:this.rightPeak,setupId:frame.setupId};this.message='Tracking ready. Now try the targets.';}
  else {this.step++;this.message=STANDING_STEPS[this.exercise][this.step];this.samples=[];this.progress=0;this.entered=now;}
  this.changed();
 }
}
