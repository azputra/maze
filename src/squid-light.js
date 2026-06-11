import { PLAYER_SETUP } from './snakes-ladders-data.js';
import { setupCanvas } from './ui-helpers.js';

const FINISH = 1;
const GREEN_MIN = 2500;
const GREEN_MAX = 5500;
const RED_MIN = 2000;
const RED_MAX = 4000;

export class SquidLightGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.playerCount = 2;
    this.players = [];
    this.phase = 'idle';
    this.winner = null;
    this.message = '';
    this.keys = {};
    this.raf = null;
    this.lastTime = 0;
    this.phaseTimer = 0;
    this.redSnapshot = {};
    this.caughtFlash = null;
    this.render();
  }

  setupGame(count) {
    this.cleanup();
    this.playerCount = count;
    this.players = PLAYER_SETUP.slice(0, count).map((p) => ({
      ...p,
      progress: 0,
      out: false,
      caught: false,
    }));
    this.winner = null;
    this.phase = 'countdown';
    this.message = 'Bersiap...';
    this.screen = 'play';
    this.render();
    setTimeout(() => this.startRound(), 1500);
  }

  startRound() {
    if (this.winner) return;
    this.phase = 'green';
    this.phaseTimer = GREEN_MIN + Math.random() * (GREEN_MAX - GREEN_MIN);
    this.message = '🟢 LAMPU HIJAU — MAJU!';
    this.playGreenSound();
    this.render();
    this.startLoop();
  }

  startLoop() {
    cancelAnimationFrame(this.raf);
    this.lastTime = 0;
    const loop = (t) => {
      if (this.screen !== 'play' || this.winner) return;
      if (!this.lastTime) this.lastTime = t;
      const dt = t - this.lastTime;
      this.lastTime = t;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  update(dt) {
    if (this.phase === 'countdown') return;

    this.phaseTimer -= dt;

    if (this.phase === 'green' && this.phaseTimer <= 0) {
      this.startRed();
      return;
    }

    if (this.phase === 'red') {
      this.players.forEach((p) => {
        if (p.out) return;
        if (this.keys[p.id] && this.phaseTimer > 0) {
          p.caught = true;
        }
      });
      if (this.phaseTimer <= 0) {
        this.endRed();
      }
      return;
    }

    if (this.phase === 'green') {
      const speed = 0.00035 * dt;
      this.players.forEach((p) => {
        if (p.out || !this.keys[p.id]) return;
        p.progress = Math.min(FINISH, p.progress + speed);
        if (p.progress >= FINISH) {
          this.winner = p;
          this.phase = 'idle';
          this.message = `🏆 ${p.emoji} ${p.name} MENANG!`;
          this.cleanup();
          this.render();
        }
      });
    }
  }

  startRed() {
    this.phase = 'red';
    this.phaseTimer = RED_MIN + Math.random() * (RED_MAX - RED_MIN);
    this.message = '🔴 LAMPU MERAH — BERHENTI!';
    this.redSnapshot = {};
    this.players.forEach((p) => {
      if (!p.out) this.redSnapshot[p.id] = p.progress;
    });
    this.speakMugunghwa();
    this.render();
  }

  endRed() {
    const caught = this.players.filter((p) => !p.out && p.caught);
    caught.forEach((p) => {
      p.progress = 0;
      p.caught = false;
      this.caughtFlash = p.id;
    });

    if (caught.length) {
      this.message = `👮 ${caught.map((p) => p.emoji).join(' ')} ketahuan bergerak! Kembali ke awal!`;
    } else {
      this.message = '✅ Aman! Lanjut ronde berikutnya...';
    }
    this.render();

    setTimeout(() => {
      this.caughtFlash = null;
      if (!this.winner) this.startRound();
    }, caught.length ? 2000 : 800);
  }

  speakMugunghwa() {
    try {
      const u = new SpeechSynthesisUtterance('무궁화 꽃이 피었습니다');
      u.lang = 'ko-KR';
      u.rate = 0.82;
      u.pitch = 1.05;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch {}
    this.playRedBeep();
  }

  playRedBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  playGreenSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 440;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  draw() {
    if (!this.ctx) return;
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    const bg = this.phase === 'green' ? '#14532d' : this.phase === 'red' ? '#7f1d1d' : '#1e293b';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('🏁 FINISH', w * 0.5, 36);

    const laneW = w / this.playerCount;
    this.players.forEach((p, i) => {
      const cx = laneW * i + laneW * 0.5;
      const trackTop = h * 0.12;
      const trackBot = h * 0.78;
      const py = trackBot - p.progress * (trackBot - trackTop);

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, trackTop);
      ctx.lineTo(cx, trackBot);
      ctx.stroke();

      if (p.out) return;

      ctx.font = `${Math.min(laneW * 0.5, 40)}px serif`;
      const shake = p.caught && this.phase === 'red' ? Math.sin(Date.now() / 50) * 4 : 0;
      ctx.fillText(p.emoji, cx + shake, py);

      if (this.caughtFlash === p.id) {
        ctx.font = '20px serif';
        ctx.fillText('💥', cx, py - 30);
      }
    });

    const dollY = h * 0.1;
    ctx.font = `${Math.min(w * 0.15, 56)}px serif`;
    ctx.fillText(this.phase === 'green' ? '👧' : '👁️', w * 0.5, dollY);

    const light = this.container.querySelector('.squid-light-indicator');
    if (light) {
      light.className = `squid-light-indicator phase-${this.phase}`;
      light.textContent =
        this.phase === 'green' ? '🟢 HIJAU — MAJU!' :
        this.phase === 'red' ? '🔴 MERAH — STOP!' :
        this.phase === 'countdown' ? '⏳ Siap...' : '';
    }
    const msg = this.container.querySelector('.squid-message');
    if (msg) msg.textContent = this.message;
  }

  bindControls() {
    this.container.querySelectorAll('[data-forward]').forEach((btn) => {
      const id = Number(btn.dataset.forward);
      const on = (e) => {
        e.preventDefault();
        if (this.phase !== 'green' || this.winner) return;
        this.keys[id] = true;
        btn.classList.add('pressed');
      };
      const off = (e) => {
        e.preventDefault();
        this.keys[id] = false;
        btn.classList.remove('pressed');
      };
      btn.addEventListener('touchstart', on, { passive: false });
      btn.addEventListener('touchend', off, { passive: false });
      btn.addEventListener('touchcancel', off, { passive: false });
      btn.addEventListener('mousedown', on);
      btn.addEventListener('mouseup', off);
      btn.addEventListener('mouseleave', off);
    });
  }

  cleanup() {
    cancelAnimationFrame(this.raf);
    this.keys = {};
  }

  render() {
    if (this.screen === 'menu') this.renderMenu();
    else if (this.screen === 'setup') this.renderSetup();
    else if (this.screen === 'play') this.renderPlay();
    else if (this.screen === 'win') this.renderWin();
  }

  renderMenu() {
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content menu-wide">
          <div class="logo">🌸</div>
          <h1>Mugunghwa</h1>
          <p class="subtitle">무궁화 꽃이 피었습니다 · 2–4 pemain</p>
          <div class="rules-box">
            <div class="rule-item"><span>🟢</span> Lampu <strong>hijau</strong> — tahan tombol MAJU ▲</div>
            <div class="rule-item"><span>🔴</span> Lampu <strong>merah</strong> — berhenti! (ada suara Korea)</div>
            <div class="rule-item"><span>👮</span> Bergerak saat merah = kembali ke awal!</div>
            <div class="rule-item"><span>🏁</span> Siapa sampai garis finish dulu menang</div>
          </div>
          <button class="btn btn-primary" data-action="setup">Mulai Main</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderSetup() {
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content">
          <div class="logo">👥</div>
          <h1>Berapa Pemain?</h1>
          <div class="snl-player-pick">
            ${[2, 3, 4].map((n) => `
              <button class="snl-pick-btn ${this.playerCount === n ? 'active' : ''}" data-players="${n}">
                <span class="snl-pick-num">${n}</span><span>Pemain</span>
              </button>
            `).join('')}
          </div>
          <button class="btn btn-primary" data-action="start">Main! 🌸</button>
          <button class="btn btn-ghost" data-action="menu">← Kembali</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderPlay() {
    const winOverlay = this.winner
      ? `
      <div class="squid-overlay">
        <div class="squid-overlay-card">
          <div class="squid-overlay-icon">🏆</div>
          <h3>Selamat!</h3>
          <p>${this.winner.emoji} ${this.winner.name} juara!</p>
          <button class="btn btn-primary" data-action="setup">Main Lagi</button>
          <button class="btn btn-secondary" data-action="menu">Menu</button>
        </div>
      </div>
    `
      : '';

    this.container.innerHTML = `
      <div class="screen squid-play-screen phase-${this.phase}">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <div class="level-info">
            <span class="level-badge squid-badge">Mugunghwa</span>
            <span class="tier-label">${this.playerCount} pemain</span>
          </div>
        </header>
        <div class="squid-light-indicator phase-${this.phase}">⏳</div>
        <div class="squid-message">${this.message}</div>
        <div class="squid-canvas-wrap"><canvas class="squid-canvas"></canvas></div>
        <div class="squid-controls" style="--squid-cols:${this.playerCount}">
          ${this.players.map((p) => `
            <div class="squid-zone ${p.out ? 'out' : ''}" style="--pc:${p.color}">
              <span class="squid-zone-label">${p.emoji} ${p.name}</span>
              <button class="squid-forward-btn" data-forward="${p.id}" ${p.out || this.winner ? 'disabled' : ''}>▲<br><small>MAJU</small></button>
              <span class="squid-progress">${Math.floor(p.progress * 100)}%</span>
            </div>
          `).join('')}
        </div>
        ${winOverlay}
      </div>
    `;

    const canvas = this.container.querySelector('.squid-canvas');
    const wrap = this.container.querySelector('.squid-canvas-wrap');
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
    this.bindControls();
    this.bindActions();
    this.draw();
  }

  renderWin() {
    this.renderPlay();
  }

  bindActions() {
    this.container.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', () => {
        const a = el.dataset.action;
        if (a === 'setup') { this.cleanup(); this.screen = 'setup'; this.winner = null; this.render(); }
        else if (a === 'menu') { this.cleanup(); this.screen = 'menu'; this.winner = null; this.render(); }
        else if (a === 'exit') { this.cleanup(); this.onExit?.(); }
        else if (a === 'start') this.setupGame(this.playerCount);
      });
    });
    this.container.querySelectorAll('[data-players]').forEach((el) => {
      el.addEventListener('click', () => {
        this.playerCount = Number(el.dataset.players);
        this.renderSetup();
      });
    });
  }

  destroy() {
    this.cleanup();
    if (this._resize) window.removeEventListener('resize', this._resize);
    speechSynthesis.cancel();
  }
}
