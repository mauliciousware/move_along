import { describe, expect, it } from 'vitest';
import { BodyOverlayState, visibleJoint } from './body-overlay';
import { readPose, projectPoint } from './signals';
import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
const points = () => Array.from({length:7},(_,i)=>({x:.2+i*.08,y:.4,visibility:1}));
describe('body overlay confidence and buffers',()=>{
  it('names the worker landmark subset correctly',()=>{
    const input=points(), frame=readPose(input,100);
    expect(frame.joints?.leftElbow).toEqual(input[3]);
    expect(frame.joints?.rightWrist).toEqual(input[6]);
  });
  it('rejects hidden, invalid, missing and out-of-frame joints',()=>{
    expect(visibleJoint(undefined)).toBe(false);
    for(const p of [{x:NaN,y:.5,visibility:1},{x:1.1,y:.5,visibility:1},{x:.5,y:.5,visibility:.1}])expect(visibleJoint(p)).toBe(false);
  });
  it('smooths motion but never trails across a tracking gap',()=>{
    const state=new BodyOverlayState(), input=points();
    state.update(readPose(input,100));
    input[3].x=.8; state.update(readPose(input,133));
    expect(state.xy[6]).toBeGreaterThan(.44); expect(state.xy[6]).toBeLessThan(.8);
    state.update(readPose(input,133+CONFIG.camera.staleMs+1));
    expect(state.xy[6]).toBeCloseTo(.8); expect(state.counts[3]).toBe(1);
  });
  it('hides an occluded elbow immediately and does not reuse its old trail on recovery',()=>{
    const state=new BodyOverlayState(), input=points();
    state.update(readPose(input,100));input[3].visibility=0;state.update(readPose(input,133));
    expect(state.visible[3]).toBe(0);expect(state.counts[3]).toBe(0);
    input[3].visibility=1;input[3].x=.8;state.update(readPose(input,166));
    expect(state.xy[6]).toBeCloseTo(.8);expect(state.counts[3]).toBe(1);
  });
  it('does not accumulate duplicate frames or exceed the trail cap',()=>{
    const state=new BodyOverlayState();
    for(let i=0;i<20;i++)state.update(readPose(points(),100+i*33));
    const count=state.counts[0];state.update(readPose(points(),727));
    expect(state.counts[0]).toBe(count);expect(count).toBe(CONFIG.bodyOverlay.trailLength);
  });
  it('projects overlays using the mirrored cover crop',()=>{
    expect(projectPoint(.5,.5,640,480,390,844)).toEqual({x:195,y:422});
    expect(projectPoint(.6,.5,640,480,390,844).x).toBeLessThan(195);
  });
});
