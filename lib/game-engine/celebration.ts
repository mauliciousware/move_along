import { PUSHUP_CONFIG as CONFIG } from '../shared/config';

/** A bounded, transient reward for complete reps; never changes scoring. */
export class RepCelebration {
  private milestone: number;
  private startedAt = -Infinity;
  private reps = 0;
  constructor(initialReps = 0) { this.milestone = Math.floor(initialReps / CONFIG.celebration.everyReps); }
  update(reps: number, now: number) {
    const milestone = Math.floor(reps / CONFIG.celebration.everyReps);
    if (milestone > this.milestone) {
      this.milestone = milestone;
      this.reps = milestone * CONFIG.celebration.everyReps;
      this.startedAt = now;
    }
    const age = now - this.startedAt;
    return age >= 0 && age < CONFIG.celebration.durationMs ? { reps: this.reps, progress: age / CONFIG.celebration.durationMs } : null;
  }
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, reps: number, now: number, reduced: boolean) {
    const reward = this.update(reps, now);
    if (!reward) return;
    const { progress } = reward;
    const colors = [CONFIG.colors.up, CONFIG.colors.good, '#e2d5ff', '#ffe09b'];
    ctx.save();
    ctx.globalAlpha = Math.min(1, (1 - progress) * 4);
    if (!reduced) {
      for (let i = 0; i < CONFIG.celebration.particleCount; i++) {
        const angle = i * 2.39996;
        const distance = CONFIG.celebration.spread * (.45 + (i % 5) / 8) * progress;
        const x = w / 2 + Math.cos(angle) * distance;
        const y = h / 2 + Math.sin(angle) * distance + CONFIG.celebration.gravity * progress * progress;
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle + progress * 4);
        ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(-3, -3, 6, 9); ctx.restore();
      }
    }
    ctx.fillStyle = '#07070dd9'; ctx.fillRect(w / 2 - 100, h / 2 - 23, 200, 46);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 18px sans-serif'; ctx.fillStyle = '#f4f4fa';
    ctx.fillText(`${reward.reps} REPS · NICE WORK!`, w / 2, h / 2);
    ctx.restore();
  }
}
