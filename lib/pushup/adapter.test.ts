import { describe, expect, it, vi } from 'vitest';
import type { PoseFrame } from '@/lib/shared/types';
vi.mock('@/lib/pose-engine/engine',()=>({PoseEngine:class {
 setupId='front-1';frame:PoseFrame|null=null;overlay='on';metrics={};state={phase:'running',tracking:'TRACKING',usable:true};
 listeners=new Set<()=>void>();frames=new Set<(f:PoseFrame)=>void>();
 getSnapshot=()=>this.state;
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>this.listeners.delete(fn);};
 onFrame=(fn:(f:PoseFrame)=>void)=>{this.frames.add(fn);return()=>this.frames.delete(fn);};
 start=vi.fn();attach=vi.fn();detach=vi.fn();noteDraw=vi.fn();noteRender=vi.fn();
 stop(){this.frame=null;this.state={...this.state,phase:'idle'};for(const fn of this.listeners)fn();}
 emit(frame:PoseFrame){this.frame=frame;for(const fn of this.frames)fn(frame);}
 change(setup:string){this.setupId=setup;for(const fn of this.listeners)fn();}
}}));
import { PoseEngine } from './engine';
const cal={joint:'nose' as const,centerY:.4,topY:.3,bottomY:.6,centerX:.5,scale:.3};
describe('push-up adapter',()=>{
 it('maps head/shoulders and immediately rejects unusable frames without React frame notifications',()=>{
  const engine=new PoseEngine(),status=vi.fn(),frame=vi.fn();engine.subscribe(status);engine.onFrame(frame);
  const camera=engine.camera as unknown as {emit:(f:PoseFrame)=>void};
  const data:PoseFrame={tPerfMs:100,joints:{nose:{x:.5,y:.4,visibility:.9},leftShoulder:{x:.3,y:.5,visibility:.9},rightShoulder:{x:.7,y:.5,visibility:.9}},usable:true,confidence:.9,issue:'none',setupId:'front-1'};
  camera.emit(data);expect(engine.frame?.shoulderWidth).toBeCloseTo(.4);expect(engine.frame?.ok).toBe(true);expect(status).not.toHaveBeenCalled();
  camera.emit({...data,usable:false});expect(engine.frame?.ok).toBe(false);expect(frame).toHaveBeenCalledTimes(2);
 });
 it('invalidates calibration on camera setup change and clears frames on stop',()=>{
  const engine=new PoseEngine();engine.setCalibration(cal);expect(engine.getSnapshot().calibrated).toBe(true);
  (engine.camera as unknown as {change:(s:string)=>void}).change('front-2');expect(engine.calibration).toBeNull();expect(engine.getSnapshot().calibrated).toBe(false);
  engine.stop();expect(engine.frame).toBeNull();
 });
});
describe('sit-up adapter',()=>{
 const hips={leftHip:{x:.4,y:.7,visibility:.9},rightHip:{x:.6,y:.7,visibility:.9}};
 const base=(t:number):PoseFrame=>({tPerfMs:t,joints:{nose:{x:.5,y:.2,visibility:.9},leftShoulder:{x:.3,y:.5,visibility:.9},rightShoulder:{x:.7,y:.5,visibility:.9},...hips},usable:true,confidence:.9,issue:'none',setupId:'front-1'});
 it('tracks the waist midpoint and rejects frames without both hips',()=>{
  const engine=new PoseEngine('situp');const camera=engine.camera as unknown as {emit:(f:PoseFrame)=>void};
  camera.emit(base(100));
  expect(engine.centerJoint).toBe('waist');
  expect(engine.frame?.waist).toEqual({x:.5,y:.7});
  expect(engine.frame?.ok).toBe(true);
  camera.emit({...base(200),joints:{...base(200).joints,leftHip:undefined,rightHip:undefined}});
  expect(engine.frame?.ok).toBe(false);
  expect(engine.frame?.waist).toEqual({x:.5,y:.2});
 });
 it('normalizes the sit-up signal from the waist',()=>{
  const engine=new PoseEngine('situp');const camera=engine.camera as unknown as {emit:(f:PoseFrame)=>void};
  camera.emit(base(100));
  engine.setCalibration({joint:'waist',centerX:.5,centerY:.7,topY:.45,bottomY:.7,scale:.4});
  expect(engine.centerJoint).toBe('waist');
  expect(engine.signal().p).toBeCloseTo(0);
 });
 it('keeps the nose as the push-up centre',()=>{
  const engine=new PoseEngine('pushup');const camera=engine.camera as unknown as {emit:(f:PoseFrame)=>void};
  camera.emit({tPerfMs:100,joints:{nose:{x:.5,y:.3,visibility:.9},leftShoulder:{x:.3,y:.5,visibility:.9},rightShoulder:{x:.7,y:.5,visibility:.9}},usable:true,confidence:.9,issue:'none',setupId:'front-1'});
  engine.setCalibration({joint:'nose',centerX:.5,centerY:.5,topY:.3,bottomY:.7,scale:.4});
  expect(engine.centerJoint).toBe('nose');
  expect(engine.signal().p).toBeCloseTo(1);
 });
});
