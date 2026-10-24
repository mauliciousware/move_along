import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { BeatMap, Grade, InputType, Note, NoteType, RestWindow } from '../shared/pushup-types';
import { award, gradeDelta, newStats } from './scoring';
import { HoldMeter } from './hold';
import { validateMap } from './validator';
export interface PlayedNote { delta?: number; note: Note; status: 'pending'|'skipped'|Grade; meter: HoldMeter | null; judgedAt: number; referenceSum: number; referenceMs: number; }
export interface Judgment { serial: number; id: string; grade: Grade; delta: number; time: number; type: Note['type']; }
export interface FlowSummary {
  set: number; sets: number; reps: number; repsInSet: number; repsPerSet: number;
  totalReps: number; holdsDone: number; holdsTotal: number; progress: number;
  complete: boolean; target: NoteType | null;
}
export class GameSession {
  readonly stats = newStats();
  readonly notes: PlayedNote[];
  judgment: Judgment | null = null;
  earlyArrivalId: string | null = null;
  revision = 0;
  private lastMs: number | null = null;
  latency: number = CONFIG.inputLatencyMs;
  constructor(readonly map: BeatMap) {
    const errors=validateMap(map); if(errors.length) throw new Error(errors.join('\n'));
    this.notes=map.notes.map(note=>({note,status:'pending',meter:note.type==='HOLD'?new HoldMeter(note.duration):null,judgedAt:0,referenceSum:0,referenceMs:0}));
  }
  /** Flow sessions wait for the player; rhythm sessions run on the song clock. */
  get flow() { return this.map.mode === 'flow'; }
  get current() { return this.notes.find(note => note.status === 'pending'); }
  get complete() { return this.flow && this.notes.every(note => note.status !== 'pending'); }
  get progress() { return this.notes.length ? this.notes.filter(note => note.status !== 'pending').length / this.notes.length : 0; }
  get flowSummary(): FlowSummary {
    const holdsTotal = this.notes.filter(note => !!note.meter).length;
    const holdsDone = this.notes.filter(note => !!note.meter && note.status !== 'pending').length;
    const repsPerSet = CONFIG.flow.repsPerSet;
    const complete = this.complete;
    const set = holdsTotal ? Math.min(holdsTotal, holdsDone + (complete ? 0 : 1)) : 0;
    return {
      set: Math.max(1, set), sets: holdsTotal, reps: this.stats.reps,
      repsInSet: Math.max(0, Math.min(repsPerSet, this.stats.reps - holdsDone * repsPerSet)),
      repsPerSet, totalReps: holdsTotal * repsPerSet, holdsDone, holdsTotal,
      progress: this.progress, complete, target: this.current?.note.type ?? null,
    };
  }
  getRest(ms: number): RestWindow | undefined { return this.flow ? undefined : this.map.rests.find(r=>ms>=r.startMs && ms<r.endMs); }
  private finishNote(n: PlayedNote, grade: Grade, ms: number, delta=0) {
    n.status=grade;n.judgedAt=ms;n.delta=grade==='miss'?undefined:delta;award(this.stats,grade,!!n.meter);
    this.judgment={serial:++this.revision,id:n.note.id,grade,delta,time:ms,type:n.note.type};
  }
  input(type: InputType, judgedMs: number, tracking: boolean) {
    if (this.flow) {
      if (!tracking) return;
      const n = this.current;
      if (!n || n.meter || n.note.type !== type) return;
      this.finishNote(n, 'perfect', judgedMs);
      if (type === 'UP') this.stats.reps++;
      return;
    }
    if(!tracking || this.getRest(judgedMs))return;
    const n=this.notes.find(n=>n.status==='pending');
    if(n && n.note.type===type && judgedMs < n.note.time-CONFIG.windows.ok && judgedMs >= n.note.time-CONFIG.lookaheadMs) this.earlyArrivalId=n.note.id;
    if(n && n.note.type===type && Math.abs(judgedMs-n.note.time)<=CONFIG.windows.ok) this.finishNote(n,gradeDelta(judgedMs-n.note.time)!,judgedMs+this.latency,judgedMs-n.note.time);
  }
  tick(ms: number, tracking: boolean, p: number, signalStable: boolean) {
    const last=this.lastMs ?? ms; this.lastMs=ms;
    this.stats.workoutTimeMs=Math.max(0,this.flow?ms:Math.min(ms,this.map.durationMs));
    if (this.flow) {
      const n=this.current;
      if (n?.meter) {
        const dt=Math.max(0,Math.min(ms-last,CONFIG.game.maxFrameMs));
        const inZone=Number.isFinite(p) && p>=CONFIG.flow.holdZone;
        if (tracking && signalStable && inZone && dt>0) {
          const wholeSeconds=Math.floor(n.meter.valueMs/1000);
          const credit=Math.min(n.meter.duration-n.meter.valueMs,dt);
          n.meter.valueMs+=credit;
          this.stats.plankTimeMs+=credit;
          // Publish the HUD clock once per second, never per frame.
          if(Math.floor(n.meter.valueMs/1000)!==wholeSeconds)this.revision++;
        }
        // A hold only advances while it is observed; it never drains or fails.
        if (n.meter.valueMs>=n.meter.duration) this.finishNote(n,'perfect',ms);
      }
      return;
    }
    for(const n of this.notes) {
      if(n.status!=='pending')continue;
      if(n.meter) {
        const start=n.note.time-CONFIG.hold.entryMs, end=n.note.time+n.note.duration;
        const dt=Math.max(0,Math.min(ms,end)-Math.max(last,start));
        if(dt) {
          const referenceDt=Math.max(0,Math.min(ms,n.note.time)-Math.max(last,start));
          if(tracking && Number.isFinite(p) && referenceDt && ms-last<=CONFIG.game.maxFrameMs) {n.referenceSum+=p*referenceDt;n.referenceMs+=referenceDt;}
          const reference=n.referenceMs ? n.referenceSum/n.referenceMs : p;
          const zone=n.note.position==='BOTTOM' ? reference<=CONFIG.thresholds.upRearm : reference>=CONFIG.thresholds.downRearm;
          const stable=signalStable && n.referenceMs>0 && zone && Math.abs(p-reference)<=CONFIG.thresholds.holdStable;
          // A long render gap must not award unobserved stability.
          n.meter.update(dt,stable && ms-last<=CONFIG.game.maxFrameMs,tracking);
          if(stable && tracking && ms-last<=CONFIG.game.maxFrameMs && ms>=n.note.time) this.stats.plankTimeMs+=Math.max(0,Math.min(ms,end)-Math.max(last,n.note.time));
        }
        if(ms>=end) {
          if(!tracking || n.meter.interrupted) {n.status='skipped';this.stats.skipped++;this.revision++;}
          else this.finishNote(n,n.meter.grade(),ms);
        }
      } else if(ms-this.latency>n.note.time+CONFIG.windows.ok) {
        if(tracking)this.finishNote(n,'miss',ms);
        else {n.status='skipped';this.stats.skipped++;this.revision++;}
      }
    }
  }
}
