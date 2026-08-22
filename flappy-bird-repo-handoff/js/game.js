// Flappy — the game engine + canvas renderer.
// A calm, kid-friendly take on the classic: gentle gravity, a big forgiving
// gap, soft colors, and a friendly (never scary) round-end.
import { SkinCatalog } from './skins.js';
import { css, adjustBrightness, lightened } from './color.js';
import { SoundPlayer, Haptics } from './audio.js';
import { SettingsStore, BestScoreStore } from './storage.js';
import { I18n } from './i18n.js';

const CANVAS_FONT_EN = '"Baloo 2", system-ui, sans-serif';
const CANVAS_FONT_HE = '"Fredoka", "Baloo 2", system-ui, sans-serif';
const canvasFamily = () => (I18n.isRTL ? CANVAS_FONT_HE : CANVAS_FONT_EN);

// Difficulty tuning — all variants stay gentle; only the gap/speed change.
const DIFFICULTY = {
  calm: { gap: 300, speed: 118, gravity: 620, flap: -260, spawnGapPx: 320 },
  easy: { gap: 250, speed: 138, gravity: 720, flap: -290, spawnGapPx: 300 },
  normal: { gap: 210, speed: 158, gravity: 820, flap: -320, spawnGapPx: 280 },
};

const BIRD_RADIUS = 22;
const BIRD_X_RATIO = 0.32;
const PIPE_WIDTH = 78;
const MAX_FALL_SPEED = 720;
const MAX_DT = 1 / 30;

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Draws one beveled "candy block" pipe segment — dark body, raised face, gloss.
function drawBlockRect(ctx, x, y, w, h, color) {
  if (h <= 0) return;
  const body = adjustBrightness(color, 0.62);
  const face = color;
  const gloss = lightened(color, 0.22);
  const highlight = lightened(color, 0.62);
  const radius = Math.min(14, w * 0.18, Math.max(h * 0.18, 4));

  roundRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = css(body);
  ctx.fill();

  const inset = Math.min(6, w * 0.08);
  const fx = x + inset;
  const fy = y + inset * 0.7;
  const fw = w - inset * 2;
  const fh = Math.max(0, h - inset * 1.8);
  if (fw > 0 && fh > 0) {
    roundRect(ctx, fx, fy, fw, fh, radius * 0.8);
    ctx.fillStyle = css(face);
    ctx.fill();

    const glossH = fh * 0.32;
    if (glossH > 0) {
      roundRect(ctx, fx, fy, fw, glossH, radius * 0.7);
      ctx.fillStyle = css(gloss);
      ctx.fill();
    }

    const hlW = Math.min(fw * 0.4, 18);
    const hlH = Math.min(fh * 0.18, 8);
    if (hlW > 0 && hlH > 0) {
      roundRect(ctx, fx + fw * 0.12, fy + fh * 0.1, hlW, hlH, hlH / 2);
      ctx.fillStyle = css(highlight);
      ctx.fill();
    }
  }
}

class Pipe {
  constructor(x, gapCenter, gapSize, colorIndex) {
    this.x = x;
    this.gapCenter = gapCenter;
    this.gapSize = gapSize;
    this.colorIndex = colorIndex;
    this.scored = false;
  }
}

export class FlappyGame {
  constructor(canvas, dom) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dom = dom;

    this.settings = SettingsStore;
    this.sound = new SoundPlayer(this.settings);
    this.haptics = new Haptics(this.settings);

    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.width = 0;
    this.height = 0;

    this.state = 'ready'; // 'ready' | 'playing' | 'over'
    this.score = 0;
    this.bestScore = BestScoreStore.get();

    this.birdY = 0;
    this.birdVy = 0;
    this.birdRotation = 0;
    this.wingPhase = 0;

    this.pipes = [];
    this.distanceSinceSpawn = 0;
    this.groundOffset = 0;

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.lastTime = 0;

    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', () => setTimeout(this.resize, 200));

    const flap = (e) => {
      e.preventDefault();
      this.onTap();
    };
    canvas.addEventListener('pointerdown', flap, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.onTap();
      }
    });

    this.resize();
    this.resetBird();
    this.updateHud();
    requestAnimationFrame((t) => { this.lastTime = t; requestAnimationFrame(this.loop); });
  }

  get difficultyKey() {
    return this.settings.difficulty;
  }

  get tuning() {
    return DIFFICULTY[this.difficultyKey] || DIFFICULTY.easy;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.width = w;
    this.height = h;
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  resetBird() {
    this.birdY = this.height / 2;
    this.birdVy = 0;
    this.birdRotation = 0;
  }

  onTap() {
    this.sound.unlock();
    if (this.state === 'over') return; // overlay handles "Play Again"
    if (this.state === 'ready') {
      this.state = 'playing';
    }
    this.birdVy = this.tuning.flap;
    this.sound.play('flap');
    this.haptics.flap();
  }

  startNewGame() {
    this.state = 'ready';
    this.score = 0;
    this.pipes = [];
    this.distanceSinceSpawn = 0;
    this.resetBird();
    this.updateHud();
  }

  changeDifficulty(key) {
    if (!DIFFICULTY[key]) return;
    this.settings.difficulty = key;
    this.startNewGame();
  }

  resetBestScore() {
    this.bestScore = 0;
    BestScoreStore.reset();
    this.updateHud();
  }

  updateHud() {
    this.dom.hudScore.textContent = String(this.score);
    this.dom.hudBest.textContent = String(this.bestScore);
  }

  spawnPipe() {
    const t = this.tuning;
    const margin = 90;
    const usable = Math.max(this.height - margin * 2, 160);
    const gapCenter = margin + Math.random() * usable;
    const colorIndex = Math.floor(Math.random() * SkinCatalog.blockPalette.colors.length);
    this.pipes.push(new Pipe(this.width + PIPE_WIDTH, gapCenter, t.gap, colorIndex));
  }

  loop(now) {
    const dt = Math.min(MAX_DT, (now - this.lastTime) / 1000 || 0);
    this.lastTime = now;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    const t = this.tuning;
    this.groundOffset = (this.groundOffset + t.speed * dt) % 40;
    this.wingPhase += dt * (this.state === 'playing' ? 12 : 4);

    if (this.state === 'ready') {
      // Gentle idle bob while waiting for the first tap.
      this.birdY = this.height / 2 + Math.sin(this.wingPhase * 0.6) * 10;
      return;
    }
    if (this.state === 'over') return;

    this.birdVy = Math.min(MAX_FALL_SPEED, this.birdVy + t.gravity * dt);
    this.birdY += this.birdVy * dt;
    this.birdRotation = Math.max(-0.5, Math.min(1.1, this.birdVy / 400));

    const birdX = this.width * BIRD_X_RATIO;

    for (const pipe of this.pipes) {
      pipe.x -= t.speed * dt;
    }
    this.pipes = this.pipes.filter((p) => p.x + PIPE_WIDTH > -10);

    this.distanceSinceSpawn += t.speed * dt;
    if (this.distanceSinceSpawn >= t.spawnGapPx) {
      this.distanceSinceSpawn = 0;
      this.spawnPipe();
    }

    // Scoring — passing a pipe's center counts one point.
    for (const pipe of this.pipes) {
      if (!pipe.scored && pipe.x + PIPE_WIDTH / 2 < birdX) {
        pipe.scored = true;
        this.score += 1;
        this.updateHud();
        this.dom.pulseScore();
        this.sound.play('score');
        this.haptics.score();
      }
    }

    // Collisions — ground/ceiling and pipes. Kept soft: no shake, no red flash.
    const topLimit = -BIRD_RADIUS * 0.4;
    const bottomLimit = this.height - BIRD_RADIUS * 0.6;
    let hit = false;
    if (this.birdY - BIRD_RADIUS < topLimit) {
      this.birdY = topLimit + BIRD_RADIUS;
      hit = true;
    }
    if (this.birdY + BIRD_RADIUS > bottomLimit) {
      this.birdY = bottomLimit - BIRD_RADIUS;
      hit = true;
    }
    for (const pipe of this.pipes) {
      if (birdX + BIRD_RADIUS * 0.7 > pipe.x && birdX - BIRD_RADIUS * 0.7 < pipe.x + PIPE_WIDTH) {
        const topPipeBottom = pipe.gapCenter - pipe.gapSize / 2;
        const bottomPipeTop = pipe.gapCenter + pipe.gapSize / 2;
        if (this.birdY - BIRD_RADIUS * 0.75 < topPipeBottom || this.birdY + BIRD_RADIUS * 0.75 > bottomPipeTop) {
          hit = true;
        }
      }
    }

    if (hit) this.gameOver();
  }

  gameOver() {
    if (this.state === 'over') return;
    this.state = 'over';
    this.sound.play('bump');
    this.haptics.bump();
    const isNewBest = this.score > this.bestScore;
    if (isNewBest) {
      this.bestScore = this.score;
      BestScoreStore.set(this.bestScore);
      this.dom.pulseBest();
    }
    this.updateHud();
    this.dom.onGameOver({ score: this.score, bestScore: this.bestScore, isNewBest });
  }

  // ---- Rendering ----

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Twilight gradient background, matching the shared palette.
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgb(92, 120, 219)');
    grad.addColorStop(1, 'rgb(56, 66, 153)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.renderClouds();
    this.renderPipes();
    this.renderGround();
    this.renderBird();

    if (this.state === 'ready') this.renderTapHint();
  }

  renderClouds() {
    const ctx = this.ctx;
    const w = this.width;
    const time = this.groundOffset / 40;
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 0.28 + 0.1) * w - time * 20) % (w + 160) - 80;
      const cy = this.height * (0.12 + i * 0.09);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 46, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 30, cy + 6, 34, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 30, cy + 8, 30, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderPipes() {
    const palette = SkinCatalog.blockPalette.colors;
    for (const pipe of this.pipes) {
      const color = palette[pipe.colorIndex % palette.length];
      const topHeight = Math.max(0, pipe.gapCenter - pipe.gapSize / 2);
      const bottomY = pipe.gapCenter + pipe.gapSize / 2;
      const bottomHeight = Math.max(0, this.height - bottomY);
      drawBlockRect(this.ctx, pipe.x, 0, PIPE_WIDTH, topHeight, color);
      drawBlockRect(this.ctx, pipe.x, bottomY, PIPE_WIDTH, bottomHeight, color);
    }
  }

  renderGround() {
    const ctx = this.ctx;
    const h = this.height;
    const groundH = 6;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(0, h - groundH, this.width, groundH);
  }

  renderBird() {
    const ctx = this.ctx;
    const x = this.width * BIRD_X_RATIO;
    const y = this.birdY;
    const accent = SkinCatalog.blockPalette.colors[6 % SkinCatalog.blockPalette.colors.length];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.birdRotation * 0.5);

    // Body — beveled candy-block circle.
    const body = adjustBrightness(accent, 0.62);
    const face = accent;
    const gloss = lightened(accent, 0.22);
    const highlight = lightened(accent, 0.62);

    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = css(body);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 1, BIRD_RADIUS - 3, 0, Math.PI * 2);
    ctx.fillStyle = css(face);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, -BIRD_RADIUS * 0.35, BIRD_RADIUS * 0.7, BIRD_RADIUS * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = css(gloss);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-BIRD_RADIUS * 0.35, -BIRD_RADIUS * 0.45, BIRD_RADIUS * 0.22, BIRD_RADIUS * 0.14, 0, 0, Math.PI * 2);
    ctx.fillStyle = css(highlight);
    ctx.fill();

    // Wing (gentle flap animation).
    const wingLift = Math.sin(this.wingPhase) * 6;
    ctx.beginPath();
    ctx.ellipse(-4, 4 + wingLift, BIRD_RADIUS * 0.55, BIRD_RADIUS * 0.32, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = css(lightened(body, 0.1));
    ctx.fill();

    // Beak.
    ctx.beginPath();
    ctx.moveTo(BIRD_RADIUS - 4, -3);
    ctx.lineTo(BIRD_RADIUS + 10, 1);
    ctx.lineTo(BIRD_RADIUS - 4, 6);
    ctx.closePath();
    ctx.fillStyle = 'rgb(255, 204, 61)';
    ctx.fill();

    // Eye.
    ctx.beginPath();
    ctx.arc(BIRD_RADIUS * 0.28, -BIRD_RADIUS * 0.22, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#20264f';
    ctx.fill();

    ctx.restore();
  }

  renderTapHint() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.85 + Math.sin(this.wingPhase) * 0.1;
    ctx.font = `700 22px ${canvasFamily()}`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(I18n.t('tapToFly'), this.width / 2, this.height * 0.32);
    ctx.restore();
  }
}
