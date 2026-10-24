import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import type { PoseFrame } from '@/lib/shared/pushup-types';

/** Canvas-only overlay. Keeps a fixed trail; no React state or frame arrays. */
export class HeadMarker {
  private trail = new Float32Array(CONFIG.canvas.trailLength * 2);
  private count = 0;
  private cursor = 0;
  private lastTime = -1;
  reset() { this.count = this.cursor = 0; this.lastTime = -1; }
  draw(ctx: CanvasRenderingContext2D, frame: PoseFrame, video: HTMLVideoElement, w: number, h: number, reduced: boolean, dev: boolean, holdRatio?: number) {
    if (frame.tPerfMs !== this.lastTime) {
      this.trail[this.cursor * 2] = frame.nose.x;
      this.trail[this.cursor * 2 + 1] = frame.nose.y;
      this.cursor = (this.cursor + 1) % CONFIG.canvas.trailLength;
      this.count = Math.min(this.count + 1, CONFIG.canvas.trailLength);
      this.lastTime = frame.tPerfMs;
    }
    const scale = Math.max(w / video.videoWidth, h / video.videoHeight);
    const imageW = video.videoWidth * scale, imageH = video.videoHeight * scale;
    const offsetX = (imageW - w) / 2, offsetY = (imageH - h) / 2;
    const x = w - (frame.nose.x * imageW - offsetX), y = frame.nose.y * imageH - offsetY;
    const radius = w * CONFIG.canvas.headRadius;
    ctx.save();
    ctx.fillStyle = CONFIG.colors.good;
    if (!reduced) {
      for (let age = this.count - 1; age > 0; age--) {
        const index = (this.cursor - 1 - age + CONFIG.canvas.trailLength) % CONFIG.canvas.trailLength;
        ctx.globalAlpha = CONFIG.overlay.trailOpacity * (1 - age / this.count);
        ctx.beginPath(); ctx.arc(w - (this.trail[index * 2] * imageW - offsetX), this.trail[index * 2 + 1] * imageH - offsetY, radius * (1 - age / (this.count + 1)), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1; ctx.shadowColor = CONFIG.colors.good; ctx.shadowBlur = CONFIG.overlay.glow;
    ctx.lineWidth = CONFIG.tileVisual.borderWidth;
    ctx.beginPath(); ctx.arc(x, y, radius * 2, 0, Math.PI * 2); ctx.strokeStyle = CONFIG.colors.good; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - radius * 3, y); ctx.lineTo(x - radius * 1.5, y); ctx.moveTo(x + radius * 1.5, y); ctx.lineTo(x + radius * 3, y); ctx.moveTo(x, y - radius * 3); ctx.lineTo(x, y - radius * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, CONFIG.overlay.dotRadius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = CONFIG.colors.text; ctx.stroke();
    if (dev && frame.points) {
      ctx.fillStyle = CONFIG.colors.good;
      for (const point of frame.points) {
        ctx.beginPath(); ctx.arc(w - (point.x * imageW - offsetX), point.y * imageH - offsetY, CONFIG.overlay.dotRadius, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (holdRatio !== undefined) {
      ctx.strokeStyle=CONFIG.colors.hold;ctx.lineWidth=CONFIG.tileVisual.borderWidth;
      ctx.beginPath();ctx.arc(x,y,radius+CONFIG.game.ringGap,-Math.PI/2,-Math.PI/2+holdRatio*Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
}
