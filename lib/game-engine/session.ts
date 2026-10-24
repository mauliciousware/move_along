import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { BeatMap, Grade, InputType, Note } from '../shared/pushup-types';
import { award, gradeDelta, newStats } from './scoring';
import { HoldMeter } from './hold';
import { validateMap } from './validator';
export interface PlayedNote { delta?: number; note: Note; status: 'pending'|'skipped'|Grade; meter: HoldMeter | null; judgedAt: number; referenceSum: number; referenceMs: number; }
export interface Judgment { serial: number; id: string; grade: Grade; delta: number; time: number; type: Note['type']; }
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
  getRest(ms: number) { return this.map.rests.find(r=>ms>=r.startMs && ms<r.endMs); }
  private complete(n: PlayedNote, grade: Grade, ms: number, delta=0) {
    n.status=grade;n.judgedAt=ms;n.delta=grade==='miss'?undefined:delta;award(this.stats,grade,!!n.meter);
    this.judgment={serial:++this.revision,id:n.note.id,grade,delta,time:ms,type:n.note.type};
  }
  input(type: InputType, judgedMs: number, tracking: boolean) {
    if(!tracking || this.getRest(judgedMs))return;
    const n=this.notes.find(n=>n.status==='pending');
    if(n && n.note.type===type && judgedMs < n.note.time-CONFIG.windows.ok && judgedMs >= n.note.time-CONFIG.lookaheadMs) this.earlyArrivalId=n.note.id;
    if(n && n.note.type===type && Math.abs(judgedMs-n.note.time)<=CONFIG.windows.ok) this.complete(n,gradeDelta(judgedMs-n.note.time)!,judgedMs+this.latency,judgedMs-n.note.time);
  }
  tick(ms: number, tracking: boolean, p: number, signalStable: boolean) {
    const last=this.lastMs ?? ms; this.lastMs=ms;
    this.stats.workoutTimeMs=Math.max(0,Math.min(ms,this.map.durationMs));
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
          else this.complete(n,n.meter.grade(),ms);
        }
      } else if(ms-this.latency>n.note.time+CONFIG.windows.ok) {
        if(tracking)this.complete(n,'miss',ms);
        else {n.status='skipped';this.stats.skipped++;this.revision++;}
      }
    }
  }
}
