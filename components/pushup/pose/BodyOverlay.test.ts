import { describe, expect, it, vi } from 'vitest';
import { BodyOverlay } from './BodyOverlay';
import { readPose } from '@/lib/pushup/signals';
const frame=readPose(Array.from({length:7},(_,i)=>({x:.25+i*.06,y:.4+i*.03,visibility:1})),100);
const video={videoWidth:640,videoHeight:480} as HTMLVideoElement;
function context() {
  return { save:vi.fn(),restore:vi.fn(),beginPath:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),stroke:vi.fn(),arc:vi.fn(),fill:vi.fn(),fillRect:vi.fn(),fillText:vi.fn(),measureText:()=>({width:50}) };
}
describe('body overlay presentation',()=>{
  it('Off draws no body decorations',()=>{
    const ctx=context();new BodyOverlay().draw(ctx as unknown as CanvasRenderingContext2D,frame,video,640,480,100,'off',true,false,0);
    expect(ctx.arc).not.toHaveBeenCalled();expect(ctx.fillText).not.toHaveBeenCalled();
  });
  it('Minimal draws markers without lines, labels, trails or hit pulses',()=>{
    const ctx=context();new BodyOverlay().draw(ctx as unknown as CanvasRenderingContext2D,frame,video,640,480,100,'minimal',true,false,0);
    expect(ctx.arc).toHaveBeenCalledTimes(7);expect(ctx.lineTo).not.toHaveBeenCalled();expect(ctx.fillText).not.toHaveBeenCalled();
  });
  it('reduced motion removes pulses and trails but retains setup labels',()=>{
    const ctx=context();new BodyOverlay().draw(ctx as unknown as CanvasRenderingContext2D,frame,video,640,480,100,'on',true,true,0);
    expect(ctx.arc).toHaveBeenCalledTimes(7);expect(ctx.fill).not.toHaveBeenCalled();
    expect(ctx.fillText.mock.calls.map(call=>call[0])).toContain('ELBOW');
    expect(ctx.fillText.mock.calls.map(call=>call[0])).toContain('ARM');
  });
  it('gameplay hides setup labels',()=>{
    const ctx=context();new BodyOverlay().draw(ctx as unknown as CanvasRenderingContext2D,frame,video,640,480,100,'on',false,false,Infinity);
    expect(ctx.fillText).not.toHaveBeenCalled();expect(ctx.lineTo).toHaveBeenCalledTimes(5);
  });
});
