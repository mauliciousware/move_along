import { PUSHUP_CONFIG as CONFIG } from '@/lib/shared/config';
import type { Calibration, PoseFrame } from '@/lib/shared/pushup-types';
import { normalizePose } from '@/lib/pushup/signals';

export function drawPositionGauge(ctx: CanvasRenderingContext2D, frame: PoseFrame, cal: Calibration | undefined, w: number, h: number, fontFamily = "monospace") {
  // Before Phase 3 calibration, show image position explicitly, without fake zones.
  const p = cal ? normalizePose(frame, cal).p : 1 - frame.nose.y;
  const x = w * CONFIG.overlay.gaugeX, y = h * CONFIG.overlay.gaugeY;
  const width = w * CONFIG.overlay.gaugeWidth, height = h * CONFIG.overlay.gaugeHeight;
  ctx.save(); ctx.fillStyle = '#ffffff22'; ctx.fillRect(x, y, width, height);
  if (cal) {
    ctx.fillStyle = CONFIG.colors.up + '66'; ctx.fillRect(x, y, width, height * (1 - CONFIG.thresholds.up));
    ctx.fillStyle = CONFIG.colors.down + '66'; ctx.fillRect(x, y + height * (1 - CONFIG.thresholds.down), width, height * CONFIG.thresholds.down);
  }
  ctx.fillStyle = CONFIG.colors.text; ctx.fillRect(x - width / 2, y + (1 - p) * height, width * 2, width / 2);
  ctx.font = `${CONFIG.overlay.fontSize}px ${fontFamily}`; ctx.textAlign = 'left';
  ctx.fillText(cal ? 'POSITION' : 'IMAGE POSITION', x, y + height + width * 4);
  ctx.restore();
}
