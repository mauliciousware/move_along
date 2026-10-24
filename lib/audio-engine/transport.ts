import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import { getAudioContext, unlockAudio } from './cues';
const buffers = new Map<string, Promise<AudioBuffer>>();
/** All time comes from the same Web Audio context used for calibration cues. */
export class AudioTransport {
  private generation = 0;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private startCtxTime = 0;
  private context: AudioContext | null = null;
  private tones = new Set<OscillatorNode>();
  private parked: { buffer: AudioBuffer; offset: number; songMs: number } | null = null;
  constructor(readonly file: string = CONFIG.audio.file, public offsetMs = 0) {}
  get ctx() { return this.context ??= getAudioContext(); }
  async load() {
    let pending=buffers.get(this.file);
    if(!pending) {
      const controller = new AbortController();
      let timeout: ReturnType<typeof setTimeout> | undefined;
      // Bound fetch AND decode, so a stalled decoder cannot trap the flow.
      const loaded = fetch(this.file, { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error('This soundtrack is unavailable. Retry sound or use the practice beat.');
        return response.arrayBuffer();
      }).then(bytes => this.ctx.decodeAudioData(bytes));
      pending = Promise.race([loaded, new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error('Music took too long to load. Retry sound or use the practice beat.'));
          controller.abort();
        }, CONFIG.audioSession.loadTimeoutMs);
      })]).finally(() => clearTimeout(timeout));
      buffers.set(this.file,pending);
      pending.catch(()=>buffers.delete(this.file));
    }
    return pending;
  }
  async start(buffer: AudioBuffer) {
    const generation = ++this.generation;
    await this.unlock();
    if (generation !== this.generation) return;
    this.stop();
    this.connect(buffer);
    this.startCtxTime=this.ctx.currentTime+4*CONFIG.animation.countdownMs/1000;
    this.source!.start(this.startCtxTime);
    for(let i=0;i<4;i++)this.tone(this.startCtxTime-(4-i)*CONFIG.animation.countdownMs/1000,CONFIG.cues.frequencies[Math.min(i,2)],CONFIG.cues.gain,CONFIG.cues.durationMs);
  }
  private connect(buffer: AudioBuffer) {
    this.source=this.ctx.createBufferSource();this.source.buffer=buffer;
    this.filter=this.ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=CONFIG.audio.normalCutoff;
    this.gain=this.ctx.createGain();this.gain.gain.value=1;
    this.source.connect(this.filter).connect(this.gain).connect(this.ctx.destination);

  }
  getSongTimeMs() {
    if(this.parked)return this.parked.songMs;
    const latency=(this.ctx.outputLatency ?? this.ctx.baseLatency ?? 0)*1000;
    return (this.ctx.currentTime-this.startCtxTime)*1000-latency+this.offsetMs;
  }
  perfToSongMs(t: number) {
    const stamp=this.ctx.getOutputTimestamp?.();
    if(stamp && typeof stamp.performanceTime==='number' && typeof stamp.contextTime==='number' && stamp.performanceTime>0 && stamp.contextTime>0) return (stamp.contextTime-this.startCtxTime)*1000+(t-stamp.performanceTime)+this.offsetMs;
    return this.getSongTimeMs()-(performance.now()-t);
  }
  get isRunning() { return this.ctx.state === 'running'; }
  get hasParked() { return !!this.parked; }
  async unlock() { if(this.ctx.state==='running')return; if(!await unlockAudio())throw new Error('Safari needs a tap to enable sound. Tap Retry audio, with Safari in the foreground.'); }
  pause() {
    if (this.parked || !this.source?.buffer) return Promise.resolve();
    const saved = {buffer:this.source.buffer, offset:this.ctx.currentTime-this.startCtxTime, songMs:this.getSongTimeMs()};
    this.stop(); this.parked=saved;
    return Promise.resolve();
  }
  async parkForCalibration() { await this.pause(); await this.ctx.resume(); }
  async resume() {
    const generation = ++this.generation;
    await this.unlock();
    if (generation !== this.generation) return;
    if(this.ctx.state!=='running')throw new Error('Tap Resume to enable audio.');
    if(this.parked) {
      const saved=this.parked;this.parked=null;this.connect(saved.buffer);
      this.startCtxTime=this.ctx.currentTime-saved.offset;
      this.source!.start(this.ctx.currentTime+Math.max(0,-saved.offset),Math.max(0,saved.offset));
    }
  }
  miss() {
    if(!this.gain || !this.filter)return;
    const t=this.ctx.currentTime, attack=CONFIG.audio.attackMs/1000, recover=CONFIG.audio.recoverMs/1000;
    for(const [param,low,normal] of [[this.gain.gain,CONFIG.audio.missGain,1],[this.filter.frequency,CONFIG.audio.missCutoff,CONFIG.audio.normalCutoff]] as const) {
      if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(t);else {param.cancelScheduledValues(t);param.setValueAtTime(param.value,t);}param.linearRampToValueAtTime(low,t+attack);param.linearRampToValueAtTime(normal,t+attack+recover);
    }
  }
  hit() {this.tone(this.ctx.currentTime,CONFIG.audio.hitFrequency,CONFIG.audio.hitGain,CONFIG.audio.hitDurationMs);}
  private tone(t: number, hz: number, volume: number, duration: number) {
    const oscillator=this.ctx.createOscillator(), gain=this.ctx.createGain();oscillator.frequency.value=hz;
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+CONFIG.cues.rampMs/1000);gain.gain.linearRampToValueAtTime(0,t+duration/1000);
    oscillator.connect(gain).connect(this.ctx.destination);oscillator.start(t);oscillator.stop(t+duration/1000);this.tones.add(oscillator);oscillator.onended=()=>{this.tones.delete(oscillator);oscillator.disconnect();gain.disconnect();};
  }
  stop() {++this.generation;this.parked=null;for(const tone of this.tones){tone.stop();tone.disconnect();}this.tones.clear();this.source?.stop();this.source?.disconnect();this.gain?.disconnect();this.filter?.disconnect();this.source=null;this.gain=null;this.filter=null;}
}
