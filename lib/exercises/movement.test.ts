import { expect, it } from 'vitest';
import { ExerciseMovement } from './movement';
import type { InputEvent } from '../shared/pushup-types';
it('counts ten alternating lifts each side, never repeats a held lift, and requires neutral after loss',()=>{
 const events:InputEvent[]=[];const m=new ExerciseMovement('march',e=>events.push(e));let t=0;
 const frame=(left=0,right=0,ok=true)=>m.update(t+=50,{p:1,left,right,ok});
 for(let i=0;i<10;i++){frame();frame(1);for(let held=0;held<5;held++)frame(1);frame();frame(0,1);frame(0,1);}
 expect(m.count).toBe(20);expect(m.leftCount).toBe(10);expect(m.rightCount).toBe(10);
 frame(0,0,false);frame(1);frame(1);expect(m.count).toBe(20);
 frame();frame(1);expect(m.count).toBe(21);expect(events[0].type).toBe('LEFT');
});
it('ignores duplicate and non-finite marching samples',()=>{
 const m=new ExerciseMovement('march',()=>{});
 m.update(0,{p:1,left:0,right:0,ok:true});m.update(0,{p:1,left:1,right:0,ok:true});
 m.update(50,{p:1,left:NaN,right:0,ok:true});m.update(100,{p:1,left:1,right:0,ok:true});
 expect(m.count).toBe(0);
});
