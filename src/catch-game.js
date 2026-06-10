import { gameBanner, scoreBar, mpControls, bindSteer, setupCanvas } from './ui-helpers.js';

const GAME_TIME = 60;
const GOOD = ['⭐', '🍎', '🍊', '🎈', '🌟', '💎'];
const BAD = ['💣', '🌵', '🪨'];

export class CatchGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.raf = null;
    this.lastTime = 0;
    this.items = [];
    this.spawnTimer = 0;
    this.timeLeft = GAME_TIME;
    this.keys = { p1L: false, p1R: false, p2L: false, p2R: false };
    this.boundKeyDown = (e) => this.onKey(e, true);
    this.boundKeyUp = (e) => this.onKey(e, false);
    this.render();
  }

  onKey(e, down) {
    if (this.screen !== 'play') return;
    const map = { KeyA: 'p1L', KeyD: 'p1R', ArrowLeft: 'p2L', ArrowRight: 'p2R' };
    const k = map[e.code];
    if (k) {
      e.preventDefault();
      this.keys[k] = down;
    }
  }

  startGame() {
    this.cleanup();
    this.players = [
      { id: 0, x: 0.25, score: 0, emoji: '🔴', color: '#ef4444', name: 'Merah' },
      { id: 1, x: 0.75, score: 0, emoji: '🔵', color: '#3b82f6', name: 'Biru' },
    ];
    this.items = [];
    this.timeLeft = GAME_TIME;
    this.spawnTimer = 0;
    this.lastTime = 0;
    this.winner = null;
    this.screen = 'play';
    this.render();
    this.startLoop();
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  startLoop() {
    cancelAnimationFrame(this.raf);
    const loop = (t) => {
      if (this.screen !== 'play' || this.winner) return;
      if (!this.lastTime) this.lastTime = t;
      const dt = Math.min((t - this.lastTime) / 1000, 0.05);
      this.lastTime = t;
      this.update(dt);
      this.draw();
      if (this.timeLeft > 0) this.raf = requestAnimationFrame(loop);
      else this.endGame();
    };
    this.raf = requestAnimationFrame(loop);
  }

  update(dt) {
    this.timeLeft -= dt;
    const speed = 2.4 * dt;

    if (this.keys.p1L) this.players[0].x -= speed;
    if (this.keys.p1R) this.players[0].x += speed;
    if (this.keys.p2L) this.players[1].x -= speed;
    if (this.keys.p2R) this.players[1].x += speed;

    this.players[0].x = clamp(this.players[0].x, 0.12, 0.38);
    this.players[1].x = clamp(this.players[1].x, 0.62, 0.88);

    this.spawnTimer += dt;
    if (this.spawnTimer > 0.6) {
      this.spawnTimer = 0;
      const lane = Math.random() < 0.5 ? 0 : 1;
      const isGood = Math.random() < 0.78;
      const pool = isGood ? GOOD : BAD;
      this.items.push({
        lane,
        x: lane === 0 ? 0.25 : 0.75,
        y: -0.05,
        emoji: pool[Math.floor(Math.random() * pool.length)],
        good: isGood,
        caught: false,
      });
    }

    this.items.forEach((item) => {
      if (item.caught) return;
      item.y += 0.6 * dt;
      const p = this.players[item.lane];
      if (item.y > 0.72 && item.y < 0.92 && Math.abs(item.x - p.x) < 0.15) {
        item.caught = true;
        p.score += item.good ? 1 : -1;
        if (p.score < 0) p.score = 0;
      }
    });
    this.items = this.items.filter((i) => i.y < 1.1 && !i.caught);
    this.updateHud();
  }

  updateHud() {
    const bar = this.container.querySelector('.score-bar');
    if (bar) {
      bar.innerHTML = this.players
        .map(
          (p) => `
        <div class="score-item" style="--pc:${p.color}">
          <span class="score-emoji">${p.emoji}</span>
          <span class="score-name">${p.name}</span>
          <span class="score-val">${p.score}</span>
        </div>`
        )
        .join('');
    }
    const timer = this.container.querySelector('.catch-timer-big');
    if (timer) timer.textContent = Math.ceil(Math.max(0, this.timeLeft));
  }

  endGame() {
    cancelAnimationFrame(this.raf);
    const [a, b] = this.players;
    this.winner = a.score >= b.score ? (a.score === b.score ? null : a) : b;
    this.screen = 'win';
    this.render();
  }

  draw() {
    if (!this.ctx) return;
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(239,68,68,0.12)';
    ctx.fillRect(0, 0, w * 0.5, h);
    ctx.fillStyle = 'rgba(59,130,246,0.12)';
    ctx.fillRect(w * 0.5, 0, w * 0.5, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 0);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fca5a5';
    ctx.fillText('ZONA MERAH', w * 0.25, 28);
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('ZONA BIRU', w * 0.75, 28);

    ctx.font = '11px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('⭐ +1  ·  💣 -1', w * 0.5, 28);

    const sz = Math.min(w * 0.11, 48);
    this.items.forEach((item) => {
      if (item.caught) return;
      ctx.font = `${sz}px serif`;
      ctx.fillText(item.emoji, item.x * w, item.y * h);
    });

    this.players.forEach((p) => {
      ctx.font = `${Math.min(w * 0.14, 56)}px serif`;
      ctx.fillText('🧺', p.x * w, h * 0.88);
    });
  }

  render() {
    if (this.screen === 'menu') this.renderMenu();
    else if (this.screen === 'play') this.renderPlay();
    else if (this.screen === 'win') this.renderWin();
  }

  renderMenu() {
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content menu-wide">
          <div class="logo">🧺</div>
          <h1>Tangkap Benda</h1>
          <p class="subtitle">2 pemain · 60 detik adu skor!</p>
          <div class="rules-box">
            <div class="rule-item good-rule"><span>⭐🍎🎈</span> Tangkap = <strong>+1</strong></div>
            <div class="rule-item bad-rule"><span>💣🪨</span> Hindari = <strong>-1</strong></div>
            <div class="rule-item"><span>🔴</span> P1 kiri layar · <span>🔵</span> P2 kanan layar</div>
          </div>
          <button class="btn btn-primary" data-action="start">Mulai! 🎮</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderPlay() {
    this.container.innerHTML = `
      <div class="screen catch-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <div class="level-info">
            <span class="level-badge catch-badge">Tangkap Benda</span>
          </div>
          <div class="catch-timer-wrap">
            <span class="catch-timer-big">60</span>
            <span class="catch-timer-label">detik</span>
          </div>
        </header>
        ${scoreBar(this.players.map((p) => ({ ...p, value: p.score })))}
        ${gameBanner('👆', 'Geser keranjang ◀ ▶ tangkap benda bagus!', 'banner-catch')}
        <div class="catch-canvas-wrap"><canvas class="catch-canvas"></canvas></div>
        ${mpControls('🔴 Merah', '🔵 Biru', '⏱️')}
      </div>
    `;

    const canvas = this.container.querySelector('.catch-canvas');
    const wrap = this.container.querySelector('.catch-canvas-wrap');
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
    bindSteer(this.container, this.keys, (p, d) =>
      p === '1' ? (d === 'l' ? 'p1L' : 'p1R') : d === 'l' ? 'p2L' : 'p2R'
    );
    this.bindActions();
    this.draw();
  }

  renderWin() {
    const [a, b] = this.players;
    const tie = !this.winner;
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">${tie ? '🤝' : '🏆'}</div>
          <h2>${tie ? 'Seri!' : `${this.winner.emoji} ${this.winner.name} Menang!`}</h2>
          <div class="final-scores">
            <div class="final-score" style="--pc:#ef4444">🔴 ${a.score}</div>
            <div class="final-vs">vs</div>
            <div class="final-score" style="--pc:#3b82f6">🔵 ${b.score}</div>
          </div>
          <button class="btn btn-primary" data-action="start">Main Lagi</button>
          <button class="btn btn-ghost" data-action="menu">Menu</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  bindActions() {
    this.container.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', () => {
        if (el.dataset.action === 'start') this.startGame();
        else if (el.dataset.action === 'menu') {
          this.cleanup();
          this.screen = 'menu';
          this.render();
        } else if (el.dataset.action === 'exit') {
          this.cleanup();
          this.onExit?.();
        }
      });
    });
  }

  cleanup() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    if (this._resize) window.removeEventListener('resize', this._resize);
  }

  destroy() {
    this.cleanup();
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
