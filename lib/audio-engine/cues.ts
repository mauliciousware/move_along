import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
let context: AudioContext | null = null;
/** Shared with the forthcoming song clock: never create a second audio context. */
export function getAudioContext() { return context ??= new AudioContext(); }
export async function unlockAudio() { try { await getAudioContext().resume(); } catch { /* Visual instructions remain usable. */ } }
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
