import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { BeatMap, InputEvent, TrackingStatus } from '../shared/pushup-types';
import { AudioTransport } from '../audio-engine/transport';
import { GameSession } from './session';
import type { Stats } from './scoring';
export type Phase = 'idle'|'loading'|'countdown'|'playing'|'paused'|'lost'|'reentry'|'ended'|'error';
export class GameRuntime {
  readonly game: GameSession;
  readonly audio: AudioTransport;
  bodySamples=0; bodyVisibleSamples=0; observedFrames=0; validFrames=0;
  observeTracking(valid:boolean){this.observedFrames++;if(valid)this.validFrames++;}
  bodyOverlay: import('../shared/pushup-types').BodyOverlayMode='on';
  readonly title: string;
  readonly artist: string;
  private listeners=new Set<()=>void>();
  private queue: InputEvent[]=[];
  private generation=0;
  private lastRevision=-1;
  private lastJudgment=0;
  private lastPerf=0;
  private resumeAt=0;
  private resuming=false;
  private state={phase:'idle' as Phase,count:'3',error:'',revision:0};
  tracking: TrackingStatus='TRACKING';
  p=1; velocity=0; signalAt=-Infinity; keyboard=false; space=false;
  songMs=0; intensity=0; fps=0; offset=0; sfx=true;
  private frames=0;private frameStart=0;
  constructor(map: BeatMap, song?: {file:string;offsetMs:number;title:string;artist?:string}) {this.game=new GameSession(map);this.audio=new AudioTransport(song?.file,song?.offsetMs);this.title=song?.title??'DEV RHYTHM';this.artist=song?.artist??'MOVE ALONG';}
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
  getSnapshot=()=>this.state;
  private publish(update: Partial<typeof this.state>={}) {this.state={...this.state,...update,revision:this.state.revision+1};for(const f of this.listeners)f();}
  async start() {
    if(!['idle','error'].includes(this.state.phase))return;
    if(this.state.phase==='error' && this.audio.hasParked){this.reenter();return;}
    const activation=this.audio.unlock();
    const generation=++this.generation;this.publish({phase:'loading',error:''});
    try {const [buffer]=await Promise.all([this.audio.load(),activation]);if(generation!==this.generation)return;await this.audio.start(buffer);if(generation!==this.generation){this.audio.stop();return;}this.publish({phase:'countdown'});}
    catch(error) {if(generation===this.generation)this.publish({phase:'error',error:error instanceof Error?error.message:'Unable to start audio.'});}
  }
  setKeyboard(value: boolean) {this.keyboard=value;}
  setSignal(p: number, velocity: number, at: number) {this.p=p;this.velocity=velocity;this.signalAt=at;}
  setSpace(value: boolean) {this.space=value;}
  setLatency(value: number) {this.game.latency=value;}
  setBodyOverlay(value: import('../shared/pushup-types').BodyOverlayMode) { this.bodyOverlay=value; }
  observeBody(visible: boolean) { this.bodySamples++; if(visible)this.bodyVisibleSamples++; }
  setSfx(value: boolean) {this.sfx=value;}
  nudgeOffset(direction: number) {this.audio.offsetMs+=direction*CONFIG.game.offsetStepMs;console.info('MOVE ALONG offsetMs',this.audio.offsetMs);}
  input(event: InputEvent) {if(this.state.phase==='playing' && this.queue.length<CONFIG.game.maxQueue)this.queue.push(event);}
  setReps(count: number) {if(this.game.stats.pushups!==count){this.game.stats.pushups=count;this.publish();}}
  setTracking(status: TrackingStatus) {
    this.tracking=status;
    if(status==='LOST_LONG' && !this.game.getRest(this.songMs) && ['playing','countdown'].includes(this.state.phase))this.pause(true);
    // Recovery requires the player's explicit ready action.
    if(status!=='TRACKING' && this.state.phase==='reentry')this.publish({phase:'lost'});
  }
  pause(lost=false) {
    if(this.state.phase==='loading'){++this.generation;this.audio.stop();this.publish({phase:'idle'});return;}
    if(!['playing','countdown','reentry'].includes(this.state.phase))return;
    ++this.generation;this.queue.length=0;void this.audio.pause();this.publish({phase:lost?'lost':'paused'});
  }
  async prepareCalibration() {
    this.pause();const generation=this.generation;
    await this.audio.parkForCalibration();
    return generation===this.generation;
  }
  reenter() {
    if(this.state.phase==='idle'){void this.start();return;}
    if(this.tracking!=='TRACKING' && !this.keyboard){this.publish({phase:'lost'});return;}
    const generation=++this.generation;
    this.resuming=true; this.publish({phase:'reentry',count:'3'});
    void this.audio.unlock().then(()=>{
      if(generation!==this.generation)return;
      this.resuming=false; this.resumeAt=performance.now()+3*CONFIG.animation.countdownMs;
    }).catch(error=>{if(generation===this.generation){this.resuming=false;this.publish({phase:'error',error:error instanceof Error?error.message:'Tap Retry audio to continue.'});}});
  }

  async resume() {
    const generation=this.generation;this.resuming=true;
    try {await this.audio.resume();if(generation!==this.generation)return;this.publish({phase:this.audio.getSongTimeMs()<0?'countdown':'playing'});}
    catch {if(generation===this.generation)this.publish({phase:'error',error:'Audio could not resume. End this workout and try again.'});}
    finally {this.resuming=false;}
  }
  tick(now: number) {
    this.frames++;
    if(now-this.frameStart>=CONFIG.camera.metricsWindowMs){this.fps=this.frames*1000/(now-this.frameStart);this.frames=0;this.frameStart=now;}
    const dt=Math.max(0,Math.min(CONFIG.game.maxFrameMs,now-this.lastPerf));this.lastPerf=now;
    this.intensity=Math.max(0,this.intensity-dt/1000*CONFIG.audio.intensityDecay);
    if(this.state.phase==='reentry') {
      if(this.resuming)return;
      const left=this.resumeAt-now;
      const count=String(Math.max(1,Math.ceil(left/CONFIG.animation.countdownMs)));
      if(count!==this.state.count)this.publish({count});
      if(left<=0){void this.resume();}return;
    }
    if(!['playing','countdown'].includes(this.state.phase))return;
    if(!this.audio.isRunning){this.pause();return;}
    this.songMs=this.audio.getSongTimeMs();
    if(this.songMs<0) {
      const index=Math.max(0,Math.min(3,Math.floor((this.songMs+4*CONFIG.animation.countdownMs)/CONFIG.animation.countdownMs)));
      const count=['3','2','1','MOVE!'][index];if(count!==this.state.count)this.publish({count});return;
    }
    if(this.state.phase==='countdown')this.publish({phase:'playing'});
    if(!this.keyboard && this.tracking==='LOST_LONG' && !this.game.getRest(this.songMs)){this.pause(true);return;}
    const tracking=this.keyboard || this.tracking==='TRACKING' && now-this.signalAt<=CONFIG.camera.staleMs;
    for(const event of this.queue)this.game.input(event.type,this.audio.perfToSongMs(event.tPerfMs)-this.game.latency,tracking);
    this.queue.length=0;
    const fresh=this.keyboard || now-this.signalAt<=CONFIG.camera.staleMs;
    const stable=fresh && tracking && (!this.keyboard || this.space);
    this.game.tick(this.songMs,tracking,this.p,stable);
    const judgment=this.game.judgment;
    if(judgment && judgment.serial!==this.lastJudgment){this.lastJudgment=judgment.serial;if(judgment.grade==='miss')this.audio.miss();else{this.intensity=Math.min(1,this.intensity+CONFIG.audio.intensityBump);if(this.sfx)this.audio.hit();}}
    if(this.game.revision!==this.lastRevision){this.lastRevision=this.game.revision;this.publish();}
    if(this.songMs>=this.game.map.durationMs)this.end(false);
  }
  end(early: boolean): Stats {++this.generation;this.audio.stop();this.queue.length=0;this.game.stats.endedEarly=early;this.publish({phase:'ended'});return {...this.game.stats};}
  dispose() {++this.generation;this.audio.stop();this.queue.length=0;}
}
