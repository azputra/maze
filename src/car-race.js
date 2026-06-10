import { gameBanner, scoreBar, mpControls, bindSteer, setupCanvas } from './ui-helpers.js';

const FINISH_DISTANCE = 800;

export class CarRaceGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.raf = null;
    this.lastTime = 0;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.winner = null;
    this.keys = { p1L: false, p1R: false, p2L: false, p2R: false };
    this.boundKeyDown = (e) => this.onKey(e, true);
    this.boundKeyUp = (e) => this.onKey(e, false);
    this.render();
  }

  onKey(e, down) {
    if (this.screen !== 'play') return;
    const map = {
      KeyA: 'p1L',
      KeyD: 'p1R',
      ArrowLeft: 'p2L',
      ArrowRight: 'p2R',
    };
    const k = map[e.code];
    if (k) {
      e.preventDefault();
      this.keys[k] = down;
    }
  }

  startRace() {
    this.cleanup();
    this.cars = [
      { id: 0, x: 0.25, y: 0.82, dist: 0, speed: 0, emoji: '🏎️', color: '#ef4444', name: 'Merah', finished: false },
      { id: 1, x: 0.75, y: 0.82, dist: 0, speed: 0, emoji: '🚙', color: '#3b82f6', name: 'Biru', finished: false },
    ];
    this.obstacles = [];
    this.spawnTimer = 0;
    this.winner = null;
    this.lastTime = 0;
    this.screen = 'play';
    this.render();
    this.startLoop();
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
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
      if (!this.winner) this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  update(dt) {
    const steer = 1.8 * dt;
    const accel = 120 * dt;
    const friction = 0.92;

    if (this.keys.p1L) this.cars[0].x -= steer;
    if (this.keys.p1R) this.cars[0].x += steer;
    if (this.keys.p2L) this.cars[1].x -= steer;
    if (this.keys.p2R) this.cars[1].x += steer;

    this.cars.forEach((car, i) => {
      if (car.finished) return;
      car.x = clamp(car.x, 0.08 + i * 0.5, 0.42 + i * 0.5);
      car.speed = Math.min(car.speed + accel, 220);
      car.dist += car.speed * dt;

      if (car.dist >= FINISH_DISTANCE) {
        car.finished = true;
        car.dist = FINISH_DISTANCE;
        if (!this.winner) {
          this.winner = car;
          setTimeout(() => this.showWin(), 400);
        }
      }
    });

    this.spawnTimer += dt;
    if (this.spawnTimer > 0.9) {
      this.spawnTimer = 0;
      const lane = Math.random() < 0.5 ? 0 : 1;
      this.obstacles.push({
        lane,
        x: lane === 0 ? 0.25 : 0.75,
        y: -0.05,
        emoji: ['🪨', '🛢️', '🚧', '🌲'][Math.floor(Math.random() * 4)],
      });
    }

    const scroll = this.cars[0].dist * 0.001 + this.cars[1].dist * 0.001;
    this.obstacles.forEach((o) => {
      o.y += (0.35 + scroll * 0.02) * dt * 2.2;
    });
    this.obstacles = this.obstacles.filter((o) => o.y < 1.15);

    this.obstacles.forEach((o) => {
      this.cars.forEach((car) => {
        if (car.finished) return;
        if (o.lane !== car.id) return;
        const dx = Math.abs(car.x - o.x);
        const dy = Math.abs(car.y - o.y);
        if (dx < 0.12 && dy < 0.1) {
          car.speed *= 0.4;
          o.y = 1.2;
        }
      });
    });
  }

  showWin() {
    cancelAnimationFrame(this.raf);
    this.screen = 'win';
    this.render();
  }

  draw() {
    if (!this.ctx) return;
    const { ctx, w, h } = this;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(239,68,68,0.1)';
    ctx.fillRect(0, 0, w * 0.5, h);
    ctx.fillStyle = 'rgba(59,130,246,0.1)';
    ctx.fillRect(w * 0.5, 0, w * 0.5, h);

    const scrollOff = ((this.cars[0].dist + this.cars[1].dist) * 0.15) % 40;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 0);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let y = -40 + scrollOff; y < h; y += 40) {
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, y);
      ctx.lineTo(w * 0.5, y + 20);
      ctx.stroke();
    }

    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fca5a5';
    ctx.fillText('JALUR MERAH', w * 0.25, 22);
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('JALUR BIRU', w * 0.75, 22);

    const itemSz = Math.min(w * 0.09, 44);
    this.obstacles.forEach((o) => {
      ctx.font = `${itemSz}px serif`;
      ctx.fillText(o.emoji, o.x * w, o.y * h);
    });

    this.cars.forEach((car) => {
      ctx.font = `${Math.min(w * 0.12, 52)}px serif`;
      ctx.fillText(car.emoji, car.x * w, h * 0.82);
    });

    const bar = this.container.querySelector('.score-bar');
    if (bar) {
      bar.innerHTML = this.cars
        .map(
          (c) => `
        <div class="score-item" style="--pc:${c.color}">
          <span class="score-emoji">${c.emoji}</span>
          <span class="score-name">${c.name}</span>
          <span class="score-val">${Math.floor(c.dist)}m</span>
        </div>`
        )
        .join('');
    }
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
          <div class="logo">🏎️</div>
          <h1>Balapan Mobil</h1>
          <p class="subtitle">2 pemain · HP & tablet</p>
          <div class="rules-box">
            <div class="rule-item"><span>🏎️</span> P1 Merah — tombol <strong>kiri</strong> layar</div>
            <div class="rule-item"><span>🚙</span> P2 Biru — tombol <strong>kanan</strong> layar</div>
            <div class="rule-item"><span>🏁</span> Hindari rintangan · pertama <strong>800m</strong> menang!</div>
          </div>
          <button class="btn btn-primary" data-action="start">Mulai Balapan!</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali ke Menu</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderPlay() {
    this.container.innerHTML = `
      <div class="screen race-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <div class="level-info">
            <span class="level-badge race-badge">Balapan 2P</span>
            <span class="tier-label">Target 🏁 800m</span>
          </div>
        </header>
        ${scoreBar(
          this.cars.map((c) => ({
            emoji: c.emoji,
            name: c.name,
            color: c.color,
            value: `${Math.floor(c.dist)}`,
            unit: 'm',
          }))
        )}
        ${gameBanner('🏎️', 'Geser mobil ◀ ▶ hindari rintangan!', 'banner-race')}
        <div class="race-canvas-wrap">
          <canvas class="race-canvas"></canvas>
        </div>
        ${mpControls('🏎️ Merah', '🚙 Biru', '🏁 800m')}
      </div>
    `;

    const canvas = this.container.querySelector('.race-canvas');
    const wrap = this.container.querySelector('.race-canvas-wrap');
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
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">${this.winner?.emoji || '🏆'}</div>
          <h2>${this.winner?.name} Menang!</h2>
          <p class="win-level">Selamat juara balapan!</p>
          <button class="btn btn-primary" data-action="start">Balapan Lagi</button>
          <button class="btn btn-ghost" data-action="menu">Menu Utama</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  bindActions() {
    this.container.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', () => {
        const action = el.dataset.action;
        if (action === 'start') this.startRace();
        else if (action === 'menu') {
          this.cleanup();
          this.screen = 'menu';
          this.render();
        } else if (action === 'exit') {
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
