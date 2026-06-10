const FINISH_DISTANCE = 800;
const LANE_W = 0.42;

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
    const canvas = this.container.querySelector('.race-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    const scrollOff = ((this.cars[0].dist + this.cars[1].dist) * 0.15) % 40;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (let y = -40 + scrollOff; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, y);
      ctx.lineTo(w * 0.5, y + 20);
      ctx.stroke();
    }

    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, w * 0.04, h);
    ctx.fillRect(w * 0.46, 0, w * 0.08, h);
    ctx.fillRect(w * 0.96, 0, w * 0.04, h);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('P1', w * 0.25, 18);
    ctx.fillText('P2', w * 0.75, 18);

    this.obstacles.forEach((o) => {
      ctx.font = `${Math.floor(w * 0.08)}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(o.emoji, o.x * w, o.y * h);
    });

    this.cars.forEach((car) => {
      ctx.font = `${Math.floor(w * 0.1)}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(car.emoji, car.x * w, car.y * h);

      const barW = w * 0.35;
      const barX = (car.id === 0 ? 0.08 : 0.58) * w;
      const progress = car.dist / FINISH_DISTANCE;
      ctx.fillStyle = '#334155';
      ctx.fillRect(barX, h - 12, barW, 6);
      ctx.fillStyle = car.color;
      ctx.fillRect(barX, h - 12, barW * progress, 6);
    });

    const hud = this.container.querySelector('.race-hud-dist');
    if (hud) {
      hud.innerHTML = this.cars
        .map((c) => `<span style="color:${c.color}">${c.emoji} ${Math.floor(c.dist)}m</span>`)
        .join(' · ');
    }
  }

  bindTouchControls() {
    const setKey = (key, val) => {
      this.keys[key] = val;
    };

    this.container.querySelectorAll('[data-steer]').forEach((btn) => {
      const [player, dir] = btn.dataset.steer.split('-');
      const key = player === '1' ? (dir === 'l' ? 'p1L' : 'p1R') : dir === 'l' ? 'p2L' : 'p2R';

      const start = (e) => {
        e.preventDefault();
        setKey(key, true);
        btn.classList.add('pressed');
      };
      const end = (e) => {
        e.preventDefault();
        setKey(key, false);
        btn.classList.remove('pressed');
      };

      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('touchcancel', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
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
        <div class="menu-content">
          <div class="logo">🏎️</div>
          <h1>Balapan Mobil</h1>
          <p class="subtitle">2 pemain · HP & tablet</p>
          <button class="btn btn-primary" data-action="start">Mulai Balapan!</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali ke Menu</button>
          <div class="how-to">
            <p>🏎️ P1 (Merah): tombol kiri layar atau A/D</p>
            <p>🚙 P2 (Biru): tombol kanan layar atau ←/→</p>
            <p>🏁 Hindari rintangan · pertama 800m menang!</p>
          </div>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderPlay() {
    this.container.innerHTML = `
      <div class="screen race-play-screen">
        <header class="top-bar race-top">
          <button class="btn-icon" data-action="menu">←</button>
          <div class="level-info">
            <span class="level-badge race-badge">Balapan 2P</span>
            <span class="tier-label race-hud-dist">0m · 0m</span>
          </div>
        </header>
        <div class="race-canvas-wrap">
          <canvas class="race-canvas"></canvas>
        </div>
        <div class="race-controls">
          <div class="race-control-side race-p1">
            <span class="race-player-label">🏎️ P1</span>
            <div class="race-btns">
              <button class="race-steer-btn" data-steer="1-l">◀</button>
              <button class="race-steer-btn" data-steer="1-r">▶</button>
            </div>
          </div>
          <div class="race-finish-label">🏁 800m</div>
          <div class="race-control-side race-p2">
            <span class="race-player-label">🚙 P2</span>
            <div class="race-btns">
              <button class="race-steer-btn" data-steer="2-l">◀</button>
              <button class="race-steer-btn" data-steer="2-r">▶</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const canvas = this.container.querySelector('.race-canvas');
    const wrap = this.container.querySelector('.race-canvas-wrap');
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      this.draw();
    };
    resize();
    this._resize = resize;
    window.addEventListener('resize', resize);
    this.bindTouchControls();
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
