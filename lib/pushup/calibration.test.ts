import { describe, expect, it, vi, afterEach } from 'vitest';
import { CALIBRATION_STEPS, CalibrationSession, validCalibration, saveCalibration, loadCalibration } from './calibration';
import type { PoseFrame } from '../shared/pushup-types';
import { pushupPose, squatPose } from '../calibration/test-poses';
import { PUSHUP_CONFIG as CONFIG } from '../shared/config';

function pose(t: number, y: number, overrides: Partial<PoseFrame> = {}): PoseFrame {
  return { ...pushupPose(t, y), ...overrides };
}
function driver(exercise: 'pushup' | 'squat' = 'pushup', hz = 20) {
  const changed = vi.fn();
  const session = new CalibrationSession(exercise, 0, changed);
  let now = 0;
  function hold(y: number, duration = 3400, overrides: Partial<PoseFrame> = {}) {
    const until = now + duration;
    while (now < until) { now += 1000 / hz; session.update(exercise === 'squat' ? {...squatPose(now,y), ...overrides} : pose(now, y, overrides), now); }
  }
  function missing(duration: number) {
    const until = now + duration;
    while (now < until) { now += 50; session.update(null, now); }
  }
  return { session, changed, hold, missing, now: () => now };
}
function verified() {
  const d = driver();
  for (const y of [.3, .65, .3, .65, .3]) d.hold(y);
  return d.session.result!;
}
afterEach(() => vi.unstubAllGlobals());

describe('learn-and-verify calibration', () => {
  it('starts at plank and requires two complete down/up sequences', () => {
    const d = driver();
    expect(CALIBRATION_STEPS.pushup.map(s => s.title)).toEqual(['UP','DOWN','UP','DOWN','UP']);
    for (const [i, y] of [.3, .65, .3, .65].entries()) {
      d.hold(y); expect(d.session.state.step).toBe(i + 1); expect(d.session.result).toBeNull();
    }
    d.hold(.3);
    expect(d.session.state.phase).toBe('ready');
    expect(d.session.result).toMatchObject({joint:'nose',topY:.3,bottomY:.65,profile:{schemaVersion:3,verifiedCycles:2,featureId:'nose-y'}});
    expect(validCalibration(d.session.result)).toBe(true);
    const count = d.changed.mock.calls.length;
    d.hold(.65); expect(d.changed).toHaveBeenCalledTimes(count);
  });
  it('verifies both squat waist endpoints twice, independent of nose height', () => {
    const d = driver('squat');
    expect(CALIBRATION_STEPS.squat.map(s => s.title)).toEqual(['UP','DOWN','UP','DOWN','UP']);
    for (const y of [.4, .7, .4, .7, .4]) d.hold(y, 3400, {nose:{x:.5,y:.2}});
    expect(d.session.state.phase).toBe('ready');
    expect(d.session.result).toMatchObject({joint:'waist',topY:.4,bottomY:.7,profile:{exercise:'squat',featureId:'waist-y'}});
  });
  it.each([6,8,15,30])('collects evidence at %i Hz without counting render frames as samples', hz => {
    const d = driver('pushup', hz);
    for (const y of [.3,.65,.3,.65,.3]) d.hold(y, 3500);
    expect(d.session.state.phase).toBe('ready');
  });
  it('never accepts an unchanged position as a movement', () => {
    const d = driver(); d.hold(.3, 10000);
    expect(d.session.state.step).toBe(1); expect(d.session.result).toBeNull(); expect(d.session.reason).toBe('range');
  });
  it('rejects head-only motion without shoulder travel', () => {
    const d = driver(); d.hold(.3);
    d.hold(.65, 3400, {rawShoulderY:.4});
    expect(d.session.state.step).toBe(1); expect(d.session.reason).toBe('body-motion');
    d.hold(.65); expect(d.session.state.step).toBe(2);
  });
  it('keeps the current step when repeated endpoints disagree', () => {
    const d = driver(); d.hold(.3); d.hold(.65); d.hold(.48, 3400, {postureJoints:pushupPose(0,.3).postureJoints});
    expect(d.session.state.step).toBe(2); expect(d.session.reason).toBe('repeat');
    d.hold(.3); expect(d.session.state.step).toBe(3);
  });
  it('announces a hold before saving, and restarts that hold after tracking loss', () => {
    const d = driver();
    d.hold(.3, 1600);
    expect(d.session.state).toMatchObject({step:0, cue:'hold'});
    expect(d.session.state.message).toContain('Stay there');
    expect(d.session.result).toBeNull();
    d.missing(100);
    expect(d.session.state.cue).toBe('move');
    expect(d.session.progress).toBe(0);
    d.hold(.3, 1000);
    expect(d.session.state.step).toBe(0);
    d.hold(.3, 1000);
    expect(d.session.state).toMatchObject({step:1, cue:'move'});
    expect(d.session.state.message).toContain('Saved. Now move down');
  });
  it('does not show completed progress before enough valid settling time', () => {
    const d = driver(); d.hold(.3, 1000);
    expect(d.session.state.step).toBe(0); expect(d.session.progress).toBeLessThan(1);
  });
  it('accepts a smaller comfortable range despite ambiguous limb geometry', () => {
    const d=driver();
    for(const y of [.3,.38,.3,.38,.3]) d.hold(y);
    expect(d.session.state.phase).toBe('ready');
    expect(d.session.result?.bottomY).toBeCloseTo(.38);
  });
  it('accepts modest natural wobble while still separating up and down', () => {
    const session=new CalibrationSession('pushup',0,()=>{});
    let t=0;
    for(const y of [.3,.65,.3,.65,.3]) for(let i=0;i<75;i++) {
      t+=50; session.update(pose(t,y+(i%3-1)*.008),t);
    }
    expect(session.state.phase).toBe('ready');
  });
  it('accepts repeatable endpoints with small measurement noise', () => {
    const session = new CalibrationSession('pushup', 0, () => {});
    let now = 0;
    for (const y of [.3,.65,.3,.65,.3]) {
      for (let i=0;i<75;i++) { now += 50; session.update(pose(now,y + (i%3 - 1)*.003),now); }
    }
    expect(session.state.phase).toBe('ready');
    expect(session.result?.profile?.noise).toBeGreaterThan(0);
  });
  it('rejects slow continuous drift as a settled position', () => {
    const session = new CalibrationSession('pushup',0,()=>{});
    for(let t=50;t<=3000;t+=50)session.update(pose(t,.2+t*.00006),t);
    expect(session.state.step).toBe(0);
  });
  it('uses raw observations instead of accepting a falsely smooth display signal', () => {
    const session = new CalibrationSession('pushup', 0, () => {});
    for (let t=50;t<4000;t+=50) session.update(pose(t,.3,{rawNose:{x:.5,y:t%100 ? .26 : .34}}),t);
    expect(session.state.step).toBe(0); expect(session.reason).toBe('unstable');
  });
  it('rejects frozen, future, non-finite and low-confidence observations', () => {
    const cases = [pose(0,.3),pose(999999,.3),pose(50,NaN),pose(50,.3,{confidence:.1}),pose(50,.3,{shoulderWidth:.001})];
    for (const frame of cases) {
      const session = new CalibrationSession('pushup',0,()=>{});
      for (let t=50;t<3000;t+=50) session.update(frame,t);
      expect(session.state.step).toBe(0); expect(session.result).toBeNull();
    }
  });
  it('does not accept a landmark without confidence even if frame.ok is true', () => {
    const d = driver(); d.hold(.3, 2000, {joints:{leftShoulder:{x:.3,y:.4,visibility:.1}}});
    expect(d.session.state.step).toBe(0);
  });
});

describe('calibration recovery', () => {
  it('preserves learned endpoints through a short loss but starts a fresh active window', () => {
    const d = driver(); d.hold(.3); d.hold(.65, 400); d.missing(600);
    expect(d.session.state.step).toBe(1); expect(d.session.progress).toBe(0);
    d.hold(.65, 500); expect(d.session.state.step).toBe(1);
    d.hold(.65, 2900); expect(d.session.state.step).toBe(2);
  });
  it('does not spend the movement timeout while tracking is missing', () => {
    const d = driver(); d.hold(.3); const before=d.session.diagnostics.validStepMs;
    d.missing(3000); expect(d.session.diagnostics.validStepMs).toBe(before);
    expect(d.session.state.phase).toBe('measuring');
  });
  it('requires explicit restart after a prolonged loss', () => {
    const d=driver(); d.hold(.3); d.missing(5200);
    expect(d.session.state.phase).toBe('retry'); expect(d.session.result).toBeNull();
    d.hold(.65); expect(d.session.state.phase).toBe('retry');
    d.session.restart(d.now()); d.hold(.3); expect(d.session.state.step).toBe(1);
  });
  it('offers a meaningful retry when valid movement attempts time out', () => {
    const d=driver(); d.hold(.3, CONFIG.calibrationV2.validTimeoutMs + 4000);
    expect(d.session.state.phase).toBe('retry'); expect(d.session.state.message).toContain('Adjust the phone');
  });
  it('invalidates endpoints after a large stable lateral or scale change', () => {
    for (const overrides of [{nose:{x:.9,y:.65}},{shoulderWidth:.8}]) {
      const d=driver(); d.hold(.3); d.hold(.65,2100,overrides);
      expect(d.session.state.phase).toBe('retry'); expect(d.session.reason).toBe('setup');
    }
  });
});

describe('versioned derived calibration storage', () => {
  it('round-trips verified profiles and rejects incompatible or unverified metadata', () => {
    const store=new Map<string,string>();
    vi.stubGlobal('sessionStorage',{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)});
    const valid=verified(); saveCalibration(valid); expect(loadCalibration()).toEqual(valid);
    for (const change of [{schemaVersion:4},{schemaVersion:2},{verifiedCycles:1},{exercise:'squat'},{featureId:'waist-y'},{noise:1},{samples:0},{modelVersion:'unknown'}]) {
      expect(validCalibration({...valid,profile:{...valid.profile,...change}})).toBe(false);
    }
    expect(validCalibration({...valid,scale:.001})).toBe(false);
    expect(validCalibration({...valid,topY:NaN})).toBe(false);
    saveCalibration({...valid,profile:undefined}); expect(loadCalibration()).toBeNull();
    expect(()=>saveCalibration({...valid,bottomY:valid.topY})).toThrow();
  });
  it('works in memory when storage is denied', () => {
    vi.stubGlobal('sessionStorage',{getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}});
    expect(loadCalibration()).toBeNull(); expect(()=>saveCalibration(verified())).not.toThrow();
  });
});
