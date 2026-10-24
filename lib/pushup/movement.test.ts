import { describe, expect, it } from 'vitest';
import { MovementDetector, RepCounter } from './movement';
import { MovementSession } from './movement-session';
import type { InputEvent } from '../shared/pushup-types';

describe('vertical movement detector', () => {
  it('emits exactly ten DOWN and UP events over ten noisy sine push-ups', () => {
    let seed = 12345;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return (seed + 1) / 4294967297; };
    const gaussian = () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
    const events: InputEvent[] = [];
    const session = new MovementSession(event => events.push(event));
    for (let frame=0; frame<=900; frame++) {
      const time = frame * 1000/30;
      const p = .5 + .45 * Math.cos(2*Math.PI*time/3000) + gaussian() * .02;
      session.update(time, p, true);
    }
    expect(events.filter(e=>e.type==='DOWN')).toHaveLength(10);
    expect(events.filter(e=>e.type==='UP')).toHaveLength(10);
    expect(session.reps.count).toBe(10);
    expect(events.map(e=>e.type)).toEqual(Array.from({length:20}, (_,i)=>i%2?'UP':'DOWN'));
  });
  it('does not emit for a jittery starting plank, including jitter around the UP threshold', () => {
    for (const baseline of [.7, .95]) {
      const detector = new MovementDetector();
      for(let frame=0;frame<600;frame++) expect(detector.update(frame*34, baseline + .02*Math.sin(frame), true)).toBeNull();
    }
  });
  it('linearly interpolates threshold crossings within the frame', () => {
    const detector = new MovementDetector(); detector.update(0, .8, true);
    expect(detector.update(40,.2,true)?.tPerfMs).toBeCloseTo(100/3);
    expect(detector.update(80,.8,true)?.tPerfMs).toBeCloseTo(220/3);
  });
  it('does not bridge missing frames or count a rep across lost tracking', () => {
    const events:InputEvent[]=[];const session=new MovementSession(e=>events.push(e));
    session.update(0,.9,true); session.update(100,.2,true);
    session.update(200,.1,false); session.update(300,.9,true);
    expect(events.map(e=>e.type)).toEqual(['DOWN']);
    expect(session.reps.count).toBe(0);
    session.update(2000,.1,true);
    expect(events).toHaveLength(1);
  });
  it('hysteresis prevents repeated fires while resting at a threshold', () => {
    const detector=new MovementDetector();detector.update(0,.9,true);
    expect(detector.update(100,.29,true)?.type).toBe('DOWN');
    for(let i=1;i<50;i++) expect(detector.update(100+i*34,.30+(i%2?.01:-.01),true)).toBeNull();
  });
});

describe('rep counter', () => {
  it.each([[499,0],[500,1],[8000,1],[8001,0]])('enforces DOWN -> UP duration %i ms', (duration, expected) => {
    const reps=new RepCounter();reps.input({type:'DOWN',tPerfMs:0});reps.input({type:'UP',tPerfMs:duration});
    expect(reps.count).toBe(expected);
    reps.input({type:'UP',tPerfMs:duration+10});expect(reps.count).toBe(expected);
  });
  it('requires a DOWN; pause interrupts the pending rep', () => {
    const reps=new RepCounter();reps.input({type:'UP',tPerfMs:1000});expect(reps.count).toBe(0);
    reps.input({type:'DOWN',tPerfMs:2000});reps.interrupt();reps.input({type:'UP',tPerfMs:3000});expect(reps.count).toBe(0);
  });
  it('accepts keyboard events through the same rep pipeline', () => {
    const emitted:InputEvent[]=[];const session=new MovementSession(e=>emitted.push(e));
    session.input({type:'DOWN',tPerfMs:100});session.input({type:'UP',tPerfMs:1100});
    expect(session.reps.count).toBe(1);expect(session.down).toBe(1);expect(session.up).toBe(1);expect(emitted).toHaveLength(2);
  });
});
