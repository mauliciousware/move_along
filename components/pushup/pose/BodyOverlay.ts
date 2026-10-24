import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import type { BodyOverlayMode, PoseFrame } from '@/lib/shared/pushup-types';
import { BodyOverlayState } from '@/lib/pushup/body-overlay';
import { projectPoint } from '@/lib/pushup/signals';

const LINKS = [[1, 2], [1, 3], [3, 5], [2, 4], [4, 6]] as const;
const LABELS = ['FACE', 'SHOULDER', 'SHOULDER', 'ELBOW', 'ELBOW', 'WRIST', 'WRIST'];
const cfg = CONFIG.bodyOverlay;
export class BodyOverlay {
  constructor(private readonly fontFamily = "monospace") {}
  private state = new BodyOverlayState();
  private labelStart: number | null = null;
  reset() { this.state.reset(); }
  draw(ctx: CanvasRenderingContext2D, frame: PoseFrame, video: HTMLVideoElement, w: number, h: number, now: number, mode: BodyOverlayMode, setup: boolean, reduced: boolean, hitAge: number) {
    if (mode === 'off') { this.reset(); return; }
    this.state.update(frame);
    if (this.labelStart === null && this.state.visible.some(Boolean)) this.labelStart = now;
    const project = (x: number, y: number) => projectPoint(x, y, video.videoWidth, video.videoHeight, w, h);
    const point = (index: number) => project(this.state.xy[index * 2], this.state.xy[index * 2 + 1]);
    const inFrame = (p: {x:number;y:number}) => p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h;
    const labelAlpha = setup ? Math.min(1, Math.max(0, (cfg.labelsMs - (now - (this.labelStart ?? now))) / cfg.labelFadeMs)) : 0;
    ctx.save(); ctx.strokeStyle = CONFIG.colors.good; ctx.fillStyle = CONFIG.colors.good; ctx.lineWidth = cfg.lineWidth;
    if (mode === 'on') {
      ctx.globalAlpha = cfg.lineOpacity;
      for (const [a, b] of LINKS) {
        if (!this.state.visible[a] || !this.state.visible[b]) continue;
        const from = point(a), to = point(b); if (!inFrame(from) || !inFrame(to)) continue;
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
      }
    }
    for (let index = 0; index < this.state.visible.length; index++) {
      if (!this.state.visible[index]) continue;
      const p = point(index); if (!inFrame(p)) continue;
      if (mode === 'on' && !reduced) {
        const start = index * cfg.trailLength * 2;
        for (let age = 1; age < this.state.counts[index]; age++) {
          const previous = project(this.state.trails[start + age * 2], this.state.trails[start + age * 2 + 1]);
          ctx.globalAlpha = cfg.trailOpacity * (1 - age / cfg.trailLength);
          ctx.beginPath(); ctx.arc(previous.x, previous.y, cfg.jointRadius, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = cfg.jointOpacity;
      ctx.beginPath(); ctx.arc(p.x, p.y, cfg.jointRadius, 0, Math.PI * 2); ctx.stroke();
      if (!reduced && mode === 'on' && hitAge >= 0 && hitAge < cfg.pulseMs) {
        const progress = hitAge / cfg.pulseMs;
        ctx.globalAlpha = cfg.pulseOpacity * (1 - progress);
        ctx.beginPath(); ctx.arc(p.x, p.y, cfg.jointRadius + cfg.pulseRadius * progress, 0, Math.PI * 2); ctx.stroke();
      }
      if (labelAlpha > 0 && mode === 'on') {
        this.label(ctx, LABELS[index], p.x, p.y, w, h, labelAlpha);
      }
    }
    if (labelAlpha > 0 && mode === 'on') {
      for (const [a, b] of [[1,3],[2,4]]) {
        if (!this.state.visible[a] || !this.state.visible[b]) continue;
        const from = point(a), to = point(b);
        if (inFrame(from) && inFrame(to)) this.label(ctx, 'ARM', (from.x+to.x)/2, (from.y+to.y)/2, w, h, labelAlpha);
      }
    }
    ctx.restore();
  }
  private label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number, alpha: number) {
    ctx.font = `${cfg.labelSize}px ${this.fontFamily}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const width = ctx.measureText(text).width + cfg.labelPadding * 2;
    const left = Math.max(cfg.labelPadding, Math.min(w-width-cfg.labelPadding, x+cfg.labelOffset));
    const top = Math.max(cfg.labelSize, Math.min(h-cfg.labelSize, y-cfg.labelOffset));
    ctx.globalAlpha = alpha; ctx.fillStyle = CONFIG.colors.bg;
    ctx.fillRect(left, top-cfg.labelSize/2-cfg.labelPadding, width, cfg.labelSize+cfg.labelPadding*2);
    ctx.fillStyle = CONFIG.colors.good; ctx.fillText(text, left+cfg.labelPadding, top);
  }
}
