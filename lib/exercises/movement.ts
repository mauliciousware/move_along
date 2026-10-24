import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import type { ExerciseId } from '@/lib/shared/types';
import type { InputEvent } from '@/lib/shared/pushup-types';
import type { MovementSignal } from './standing';
import { MovementSession } from '@/lib/pushup/movement-session';
/** Both feet must return before another marching lift can score. */
export class ExerciseMovement {
 readonly vertical:MovementSession;private armed=true;private previous:{time:number;left:number;right:number}|null=null;
 private steps=0;leftCount=0;rightCount=0;
 constructor(readonly exercise:ExerciseId,private emit:(event:InputEvent)=>void){this.vertical=new MovementSession(emit);}
 get count(){return this.exercise==='march'?this.steps:this.vertical.reps.count;}
 get state(){return this.exercise==='march'?(this.armed?'READY':'RETURN BOTH FEET'):this.vertical.detector.state;}
 interrupt(){this.vertical.interrupt();this.armed=false;this.previous=null;}
 update(t:number,signal:MovementSignal){
  if(this.exercise!=='march'){this.vertical.update(t,signal.p,signal.ok);return;}
  if(!signal.ok||![t,signal.left,signal.right].every(Number.isFinite)){this.interrupt();return;}
  if(this.previous&&t<=this.previous.time)return;
  if(this.previous&&t-this.previous.time>CONFIG.camera.staleMs){this.interrupt();}
  const previous=this.previous;this.previous={time:t,left:signal.left,right:signal.right};
  if(signal.left<CONFIG.standing.resetThreshold&&signal.right<CONFIG.standing.resetThreshold){this.armed=true;return;}
  if(!this.armed||!previous)return;
  for(const side of ['left','right'] as const){const other=side==='left'?'right':'left';if(previous[side]<CONFIG.standing.liftThreshold&&signal[side]>=CONFIG.standing.liftThreshold&&signal[other]<CONFIG.standing.resetThreshold){
    this.armed=false;this.input({type:side==='left'?'LEFT':'RIGHT',tPerfMs:previous.time+(CONFIG.standing.liftThreshold-previous[side])/(signal[side]-previous[side])*(t-previous.time)});break;
  }}
 }
 input(event:InputEvent){
  if(this.exercise==='march'){if(event.type!=='LEFT'&&event.type!=='RIGHT')return;this.steps++;if(event.type==='LEFT')this.leftCount++;else this.rightCount++;this.emit(event);}
  else if(event.type==='UP'||event.type==='DOWN')this.vertical.input(event);
 }
}
