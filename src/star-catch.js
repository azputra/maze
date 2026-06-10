import { gameBanner, setupCanvas } from './ui-helpers.js';

const GAME_TIME = 45;
const TOTAL_LEVELS = 15;
const STORAGE_KEY = 'star-catch-progress';
const GOOD = ['⭐', '🌟', '💎', '🍎', '🎈'];
const BAD = ['💣', '🪨', '🌵'];

export class StarCatchGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.level = 1;
    this.score = 0;
    this.target = 0;
    this.timeLeft = GAME_TIME;
    this.items = [];
    this.spawnTimer = 0;
    this.playerX = 0.5;
    this.raf = null;
    this.lastTime = 0;
    this.keys = { left: false, right: false };
    this.boundKeyDown = (e) => this.onKey(e, true);
    this.boundKeyUp = (e) => this.onKey(e, false);
    this.progress = this.loadProgress();
    this.render();
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { unlocked: 1, stars: {} };
  }

  saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  getConfig(lv) {
    return {
      target: 8 + lv * 2,
      time: Math.max(25, 50 - lv * 2),
      spawnRate: Math.max(0.5, 1.0 - lv * 0.03),
      speed: 0.35 + lv * 0.02,
      badChance: Math.min(0.35, 0.15 + lv * 0.02),
    };
  }

  onKey(e, down) {
    if (this.screen !== 'play') return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); this.keys.left = down; }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); this.keys.right = down; }
  }

  startLevel(level) {
    this.cleanup();
    this.level = level;
    const cfg = this.getConfig(level);
    this.cfg = cfg;
    this.target = cfg.target;
    this.score = 0;
    this.timeLeft = cfg.time;
    this.items = [];
    this.spawnTimer = 0;
    this.playerX = 0.5;
    this.lastTime = 0;
    this.screen = 'play';
    this.render();
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    this.startLoop();
  }

  startLoop() {
    cancelAnimationFrame(this.raf);
    const loop = (t) => {
      if (this.screen !== 'play') return;
      if (!this.lastTime) this.lastTime = t;
      const dt = Math.min((t - this.lastTime) / 1000, 0.05);
      this.lastTime = t;
      this.update(dt);
      this.draw();
      if (this.timeLeft > 0 && this.score < this.target) {
        this.raf = requestAnimationFrame(loop);
      } else {
        this.endLevel();
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  update(dt) {
    this.timeLeft -= dt;
    const speed = 1.6 * dt;
    if (this.keys.left) this.playerX -= speed;
    if (this.keys.right) this.playerX += speed;
    this.playerX = clamp(this.playerX, 0.12, 0.88);

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.cfg.spawnRate) {
      this.spawnTimer = 0;
      const bad = Math.random() < this.cfg.badChance;
      this.items.push({
        x: 0.1 + Math.random() * 0.8,
        y: -0.05,
        emoji: bad ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)],
        bad,
        caught: false,
      });
    }

    this.items.forEach((item) => {
      if (!item.caught) item.y += this.cfg.speed * dt;
    });

    this.items.forEach((item) => {
      if (item.caught || item.y < 0.75) return;
      if (Math.abs(item.x - this.playerX) < 0.12) {
        item.caught = true;
        if (item.bad) this.score = Math.max(0, this.score - 1);
        else {
          this.score++;
          if (this.score >= this.target) this.endLevel();
        }
      }
    });
    this.items = this.items.filter((i) => i.y < 1.1 && !i.caught);
  }

  draw() {
    if (!this.ctx) return;
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0c1445';
    ctx.fillRect(0, 0, w, h);

    ctx.font = '11px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('⭐ +1  ·  💣 -1', w * 0.5, 24);

    const sz = Math.min(w * 0.1, 44);
    this.items.forEach((item) => {
      ctx.font = `${sz}px serif`;
      ctx.fillText(item.emoji, item.x * w, item.y * h);
    });

    ctx.font = `${Math.min(w * 0.14, 56)}px serif`;
    ctx.fillText('🧺', this.playerX * w, h * 0.9);

    const timer = this.container.querySelector('.star-timer');
    const scoreEl = this.container.querySelector('.star-score');
    if (timer) timer.textContent = `${Math.ceil(this.timeLeft)}s`;
    if (scoreEl) scoreEl.textContent = `${this.score}/${this.target}`;
  }

  endLevel() {
    cancelAnimationFrame(this.raf);
    const won = this.score >= this.target;
    if (won) {
      const stars = this.timeLeft > this.cfg.time * 0.4 ? 3 : 2;
      this.progress.stars[this.level] = Math.max(this.progress.stars[this.level] || 0, stars);
      if (this.level >= this.progress.unlocked) this.progress.unlocked = this.level + 1;
      this.saveProgress();
      this.screen = 'win';
    } else {
      this.screen = 'lose';
    }
    this.cleanup();
    this.render();
  }

  cleanup() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    if (this._resize) window.removeEventListener('resize', this._resize);
  }

  render() {
    if (this.screen === 'menu') this.renderMenu();
    else if (this.screen === 'levels') this.renderLevels();
    else if (this.screen === 'play') this.renderPlay();
    else if (this.screen === 'win') this.renderWin(true);
    else if (this.screen === 'lose') this.renderWin(false);
  }

  renderMenu() {
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content menu-wide">
          <div class="logo">⭐</div>
          <h1>Tangkap Bintang</h1>
          <p class="subtitle">Main sendiri · ${TOTAL_LEVELS} level</p>
          <div class="rules-box">
            <div class="rule-item good-rule"><span>⭐🌟💎</span> Tangkap = <strong>+1</strong></div>
            <div class="rule-item bad-rule"><span>💣🪨</span> Hindari = <strong>-1</strong></div>
            <div class="rule-item"><span>◀▶</span> Geser keranjang kiri/kanan</div>
          </div>
          <button class="btn btn-primary" data-action="levels">Pilih Level</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderLevels() {
    this.container.innerHTML = `
      <div class="screen levels-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <h2>Tangkap Bintang</h2>
          <span class="progress-text">${this.progress.unlocked}/${TOTAL_LEVELS}</span>
        </header>
        <div class="level-grid level-grid-2col">
          ${Array.from({ length: TOTAL_LEVELS }, (_, i) => {
            const lv = i + 1;
            const locked = lv > this.progress.unlocked;
            const stars = this.progress.stars[lv] || 0;
            const cfg = this.getConfig(lv);
            return `
              <button class="level-card ${locked ? 'locked' : ''} ${stars ? 'done' : ''}" data-level="${lv}" ${locked ? 'disabled' : ''}>
                ${stars ? `<span class="level-star">${'★'.repeat(stars)}</span>` : ''}
                <span class="level-num">${lv}</span>
                <span class="level-tier" style="background:#fbbf24">${cfg.target} bintang</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
    this.bindActions();
    this.container.querySelectorAll('[data-level]').forEach((btn) => {
      btn.addEventListener('click', () => this.startLevel(Number(btn.dataset.level)));
    });
  }

  renderPlay() {
    this.container.innerHTML = `
      <div class="screen star-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="levels">←</button>
          <div class="level-info">
            <span class="level-badge star-badge">Level ${this.level}</span>
            <span class="tier-label star-score">${this.score}/${this.target}</span>
          </div>
          <span class="stat-mini star-timer">${Math.ceil(this.timeLeft)}s</span>
        </header>
        ${gameBanner('👆', 'Geser keranjang ◀ ▶ tangkap bintang!', 'banner-star')}
        <div class="star-canvas-wrap"><canvas class="star-canvas"></canvas></div>
        <div class="star-controls">
          <button class="star-steer" data-dir="left">◀</button>
          <span class="star-ctrl-hint">Geser keranjang</span>
          <button class="star-steer" data-dir="right">▶</button>
        </div>
      </div>
    `;

    const canvas = this.container.querySelector('.star-canvas');
    const wrap = this.container.querySelector('.star-canvas-wrap');
    const resize = () => {
      const setup = setupCanvas(wrap, canvas);
      this.ctx = setup.ctx;
      this.w = setup.w;
      this.h = setup.h;
      this.draw();
    };
    resize();
    this._resize = resize;
    window.addEventListener('resize', resize);

    const bindSteer = (btn, key) => {
      const on = (e) => { e.preventDefault(); this.keys[key] = true; btn.classList.add('pressed'); };
      const off = (e) => { e.preventDefault(); this.keys[key] = false; btn.classList.remove('pressed'); };
      btn.addEventListener('touchstart', on, { passive: false });
      btn.addEventListener('touchend', off, { passive: false });
      btn.addEventListener('touchcancel', off, { passive: false });
      btn.addEventListener('mousedown', on);
      btn.addEventListener('mouseup', off);
      btn.addEventListener('mouseleave', off);
    };
    bindSteer(this.container.querySelector('[data-dir="left"]'), 'left');
    bindSteer(this.container.querySelector('[data-dir="right"]'), 'right');

    this.bindActions();
    this.draw();
  }

  renderWin(won) {
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">${won ? '⭐' : '😅'}</div>
          <h2>${won ? 'Level Selesai!' : 'Coba Lagi!'}</h2>
          <p class="win-level">${won ? `Skor ${this.score}/${this.target}` : `Kurang ${this.target - this.score} bintang`}</p>
          ${won && this.level < TOTAL_LEVELS ? `<button class="btn btn-primary" data-action="next">Level ${this.level + 1} →</button>` : ''}
          <button class="btn btn-secondary" data-action="levels">Pilih Level</button>
          <button class="btn btn-ghost" data-action="menu">Menu</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  bindActions() {
    this.container.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', () => {
        const a = el.dataset.action;
        if (a === 'levels') { this.cleanup(); this.screen = 'levels'; this.render(); }
        else if (a === 'menu') { this.cleanup(); this.screen = 'menu'; this.render(); }
        else if (a === 'exit') { this.cleanup(); this.onExit?.(); }
        else if (a === 'next') this.startLevel(this.level + 1);
      });
    });
  }

  destroy() {
    this.cleanup();
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
