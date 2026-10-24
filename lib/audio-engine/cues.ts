import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
let context: AudioContext | null = null;
/** Shared with the forthcoming song clock: never create a second audio context. */
export function getAudioContext() { if(!context || context.state==='closed')context=new AudioContext(); return context; }
/** Call directly from a tap, before fetch/decode, to activate Safari's audio output. */
export async function unlockAudio(): Promise<boolean> {
  try {
    const ctx=getAudioContext();
    const resumed=ctx.resume();
    const tone=ctx.createOscillator(), gain=ctx.createGain();
    gain.gain.value=0; tone.connect(gain).connect(ctx.destination);
    tone.start(); tone.stop(ctx.currentTime+CONFIG.audioSession.unlockToneMs/1000);
    tone.onended=()=>{tone.disconnect();gain.disconnect();};
    let timer:ReturnType<typeof setTimeout>|undefined;
    try { await Promise.race([resumed,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Audio activation timed out')),CONFIG.audioSession.unlockTimeoutMs);})]); }
    finally {clearTimeout(timer);}
    return ctx.state==='running';
  } catch {return false;}
}

export function calibrationCue(step: number) {
  if (!context || context.state !== 'running') return;
  const oscillator = context.createOscillator(), gain = context.createGain();
  const now = context.currentTime, duration = CONFIG.cues.durationMs / 1000;
  oscillator.frequency.value = CONFIG.cues.frequencies[Math.min(step, CONFIG.cues.frequencies.length-1)];
  gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(CONFIG.cues.gain, now + CONFIG.cues.rampMs / 1000); gain.gain.linearRampToValueAtTime(0, now + duration);
  oscillator.connect(gain).connect(context.destination); oscillator.start(now); oscillator.stop(now+duration);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
export function speakLocally(text: string) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const voice = speechSynthesis.getVoices().find(voice => voice.localService && voice.lang.startsWith('en'));
  // Never use a network-backed voice; spoken cues are optional.
  if (!voice) return;
  const utterance = new SpeechSynthesisUtterance(text); utterance.voice = voice;
  speechSynthesis.speak(utterance);
}
export function stopSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
