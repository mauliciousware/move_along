import { PUSHUP_CONFIG as CONFIG } from '../shared/config';
import type { GameRuntime } from './runtime';
import type { InputType } from '../shared/pushup-types';
import { tier } from './scoring';
import { clamp, movementGuidance, targetCue } from './targets';

const TAU = Math.PI * 2;
const cfg = CONFIG.targets;
const colorFor = (type: string) => (type === 'UP'||type === 'LEFT') ? CONFIG.colors.up : (type === 'DOWN'||type === 'RIGHT') ? CONFIG.colors.down : CONFIG.colors.hold;

/** A single canvas owns fixed targets, beat cues and a bounded particle pool. */
export class GameRenderer {
  constructor(private readonly displayFont = "monospace") {}
  private particles = Array.from({ length: Math.max(...CONFIG.particles.tierCaps) }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '' }));
  private lastJudgment = 0;
  private lastNow = 0;

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, run: GameRuntime, now: number, reduced: boolean, dev: boolean) {
    const { game, songMs } = run;
    const cue = targetCue(game, songMs);
    const judgment = game.judgment;
    const age = judgment ? songMs - judgment.time : Infinity;
    const radius = Math.min(w * cfg.radiusWidth, h * cfg.radiusHeight, cfg.maxRadius);
    const cx = w / 2;
    const march=game.map.exercise==='march';
    const dt = Math.min(CONFIG.game.maxFrameMs, Math.max(0, now - this.lastNow));
    this.lastNow = now;
    const level = tier(game.stats.combo);
    const positionY = (type: string) => h * (march && (type==='LEFT'||type==='RIGHT') ? .42 : type === 'UP' ? cfg.upY : type === 'DOWN' ? cfg.downY : cfg.centerY);
    const playing = run.getSnapshot().phase === 'playing';
    const tracked = run.keyboard || run.tracking === 'TRACKING' && now - run.signalAt <= CONFIG.camera.staleMs;
    const guide = movementGuidance(game, songMs, run.p, tracked, playing);
    const recent = judgment && age >= 0 && age < CONFIG.guidance.confirmationMs;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // A broad, steady color field identifies the direction without flashing.
    if (guide.active && !guide.early) {
      const up = cue.current?.note.type === 'UP';
      const top = up ? 0 : h / 2;
      const color = colorFor(up ? 'UP' : 'DOWN');
      const wash = ctx.createLinearGradient(0, top, 0, top + h / 2);
      wash.addColorStop(0, up ? color : color + '00');
      wash.addColorStop(1, up ? color + '00' : color);
      ctx.save(); ctx.globalAlpha = CONFIG.guidance.halfOpacity; ctx.fillStyle = wash;
      ctx.fillRect(0, top, w, h / 2); ctx.restore();
    }
    for (const type of (march?['LEFT','RIGHT']:['UP','DOWN']) as InputType[]) {
      const cx=march?w*(type==='LEFT'?.25:.75):w/2;
      const active = guide.active && cue.current?.note.type === type;
      const completed = recent && judgment.type === type && judgment.grade !== 'miss';
      const y = positionY(type), color = colorFor(type);
      ctx.save();
      ctx.globalAlpha = active || completed ? 1 : CONFIG.guidance.idleOpacity;
      this.ring(ctx, cx, y, radius, color, completed ? 1 : active ? guide.fill : 0, active || !!completed);
      ctx.fillStyle = color; ctx.font = `${radius * cfg.labelScale}px ${this.displayFont}`;
      this.text(ctx, completed ? `✓ ${type} HIT` : recent && judgment.type === type && judgment.grade === 'miss' ? 'MISSED' : type==='LEFT'?'LEFT KNEE':type==='RIGHT'?'RIGHT KNEE':type === 'UP' ? 'UP' : 'DOWN', cx, y - radius * .15, radius * 1.7);
      this.chevron(ctx, cx, y - radius * .6, radius * CONFIG.guidance.arrowScale, type);
      ctx.font = `${radius * CONFIG.guidance.statusScale}px ${this.displayFont}`;
      ctx.fillStyle = CONFIG.colors.text;
      this.text(ctx, completed ? judgment.grade.toUpperCase() : active ? guide.early ? 'EARLY' : guide.fill >= 1 ? 'REACHED' : 'MOVEMENT' : 'WAIT', cx, y + radius * .3, radius * 1.7);
      ctx.font = `${cfg.captionSize}px ${this.displayFont}`;
      ctx.fillStyle = active ? color : CONFIG.colors.muted;
      this.text(ctx, completed ? 'COMPLETE' : recent && judgment.type === type && judgment.grade === 'miss' ? 'FOLLOW THE NEXT CUE' : active ? guide.status : '', cx, y + radius + cfg.outerGap, w * .9);
      ctx.restore();
      if (active) {
        const barWidth = radius * CONFIG.guidance.timingWidth;
        const cx=w/2;
        const barY = h * (march?.72:cfg.centerY);
        ctx.fillStyle = color; ctx.font = `${radius * cfg.labelScale}px ${this.displayFont}`;
        this.text(ctx, guide.prompt, cx, barY - CONFIG.guidance.subtitleOffset, w * .9);
        ctx.fillStyle = CONFIG.colors.text + '30';
        ctx.fillRect(cx-barWidth/2, barY, barWidth, CONFIG.guidance.timingHeight);
        ctx.fillStyle = color; ctx.fillRect(cx-barWidth/2, barY, barWidth*cue.timing, CONFIG.guidance.timingHeight);
        ctx.fillStyle = CONFIG.colors.text;
        ctx.fillRect(cx+barWidth/2, barY-CONFIG.guidance.timingHeight, CONFIG.tileVisual.borderWidth, CONFIG.guidance.timingHeight*3);
        ctx.beginPath();ctx.arc(cx-barWidth/2+barWidth*cue.timing,barY+CONFIG.guidance.timingHeight/2,CONFIG.guidance.markerRadius,0,TAU);ctx.fill();
      }
    }

    const hold = cue.current?.note.type === 'HOLD' && songMs >= cue.current.note.time - CONFIG.hold.entryMs ? cue.current : undefined;
    const centerY = march?h*.72:positionY('HOLD');
    if (hold || cue.rest) {
      const rest = cue.rest;
      const seconds = Math.max(0, Math.ceil(((rest?.endMs ?? ((hold?.note.time ?? 0) + (hold?.note.duration ?? 0))) - songMs) / 1000));
      const color = rest ? CONFIG.colors.good : CONFIG.colors.hold;
      const fill = rest ? clamp((songMs - rest.startMs) / (rest.endMs - rest.startMs)) : hold?.meter?.ratio ?? 0;
      this.ring(ctx, cx, centerY, radius * cfg.centerScale, color, fill, true);
      ctx.fillStyle = color; ctx.font = `${radius * cfg.valueScale}px ${this.displayFont}`;
      this.text(ctx, rest ? seconds <= CONFIG.game.restReadyMs / 1000 ? 'GET READY' : 'BREATHE' : hold?.note.position === 'BOTTOM' ? 'LOW HOLD' : 'PLANK', cx, centerY - radius * .18, radius * cfg.centerScale * 1.7);
      ctx.fillStyle = CONFIG.colors.text; ctx.font = `${radius * cfg.labelScale}px ${this.displayFont}`;
      this.text(ctx, rest ? `${seconds}s` : `${Math.round(fill * 100)}%`, cx, centerY + radius * .2, radius * cfg.centerScale * 1.7);
      ctx.font = `${cfg.captionSize}px ${this.displayFont}`;
      this.text(ctx, rest ? 'REST · NO SCORING' : `HOLD STEADY · ${seconds}s`, cx, centerY + radius * .85, w * .9);
    } else {
      ctx.fillStyle = CONFIG.colors.text;
      ctx.font = `${cfg.captionSize}px ${this.displayFont}`;
      const current = cue.current?.note;
      const next = cue.next?.note;
      const name = (type: string) => type === 'UP' ? '↑ UP' : type === 'DOWN' ? '↓ DOWN' : type==='LEFT'?'LEFT KNEE':type==='RIGHT'?'RIGHT KNEE':'HOLD';
      if (current?.type === 'HOLD') {
        ctx.fillStyle = CONFIG.colors.hold;
        this.text(ctx, `GET READY · ${current.position === 'BOTTOM' ? 'LOW HOLD' : 'PLANK HOLD'}`, cx, centerY, w * .9);
      } else if (current && !cue.approaching) {
        this.text(ctx, `GET READY · ${name(current.type)}`, cx, centerY, w * .9);
      } else if (next) this.text(ctx, `NEXT: ${name(next.type)}`, cx, centerY + CONFIG.guidance.subtitleOffset, w * .9);
    }

    if (judgment && judgment.serial !== this.lastJudgment) {
      this.lastJudgment = judgment.serial;
      if (!reduced && judgment.grade !== 'miss') {
        let remaining = CONFIG.particles.perHit;
        for (let i = 0; i < CONFIG.particles.tierCaps[level] && remaining; i++) {
          const particle = this.particles[i]; if (particle.life > 0) continue;
          const angle = remaining / CONFIG.particles.perHit * TAU;
          Object.assign(particle, { x: cx + Math.cos(angle) * radius, y: positionY(judgment.type) + Math.sin(angle) * radius, vx: Math.cos(angle) * CONFIG.game.particleSpeed, vy: Math.sin(angle) * CONFIG.game.particleSpeed, life: CONFIG.animation.hitMs, color: colorFor(judgment.type) });
          remaining--;
        }
      }
    }
    if (judgment && recent && !hold && !cue.rest) {
      if (!reduced && judgment.grade !== 'miss' && age < CONFIG.animation.hitMs) {
        const burst = age / CONFIG.animation.hitMs;
        ctx.save(); ctx.globalAlpha = 1 - burst; ctx.strokeStyle = colorFor(judgment.type); ctx.lineWidth = cfg.ringWidth * (1 - burst);
        ctx.beginPath(); ctx.arc(cx, positionY(judgment.type), radius * (1 + burst * cfg.burstScale), 0, TAU); ctx.stroke(); ctx.restore();
      }
    }
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (reduced || i >= CONFIG.particles.tierCaps[level]) { particle.life = 0; continue; }
      if (particle.life <= 0) continue;
      if (playing) { particle.life -= dt; particle.x += particle.vx * dt / 1000; particle.y += particle.vy * dt / 1000; }
      ctx.globalAlpha = clamp(particle.life / CONFIG.animation.hitMs); ctx.fillStyle = particle.color;
      ctx.beginPath(); ctx.arc(particle.x, particle.y, CONFIG.game.particleRadius, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (dev) { ctx.fillStyle = CONFIG.colors.good; ctx.font = `${cfg.captionSize}px ${this.displayFont}`; this.text(ctx, `NEXT ${cue.current?.note.type ?? '—'} · ${Math.round(cue.remainingMs)}ms`, cx, h * cfg.railEnd, w * .9); }
    ctx.restore();
  }

  private text(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
    const font = ctx.font;
    const width = ctx.measureText(text).width;
    if (width > maxWidth) {
      const size = Number.parseFloat(font);
      ctx.font = `${size * maxWidth / width}px ${this.displayFont}`;
    }
    ctx.fillText(text, x, y);
    ctx.font = font;
  }

  private ring(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, fill: number, active: boolean) {
    ctx.save();
    const surface = ctx.createRadialGradient(x, y, 0, x, y, radius);
    surface.addColorStop(0, '#08141ed9'); surface.addColorStop(1, '#081019ee');
    ctx.fillStyle = surface; ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
    ctx.strokeStyle = color + '40'; ctx.lineWidth = 1; ctx.stroke();
    ctx.lineCap = 'round'; ctx.lineWidth = cfg.ringWidth;
    ctx.strokeStyle = color + '25'; ctx.beginPath(); ctx.arc(x, y, radius - cfg.ringWidth, 0, TAU); ctx.stroke();
    if (fill > 0) {
      ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = active ? cfg.glow : 0;
      ctx.beginPath(); ctx.arc(x, y, radius - cfg.ringWidth, -Math.PI / 2, -Math.PI / 2 + fill * TAU); ctx.stroke(); ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  private chevron(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, type: InputType) {
    ctx.save();
    if(type==='LEFT'||type==='RIGHT'){ctx.translate(x,y);ctx.rotate(type==='LEFT'?-Math.PI/2:Math.PI/2);x=0;y=0;}
    const direction = type === 'UP'||type==='LEFT'||type==='RIGHT' ? -1 : 1;
    ctx.strokeStyle = colorFor(type); ctx.lineWidth = CONFIG.tileVisual.borderWidth * 2;
    ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - size, y - direction * size / 2); ctx.lineTo(x, y + direction * size / 2); ctx.lineTo(x + size, y - direction * size / 2); ctx.stroke(); ctx.restore();
  }
}
