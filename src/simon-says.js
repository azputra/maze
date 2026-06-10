import { PLAYER_SETUP } from './snakes-ladders-data.js';

const COLORS = [
  { id: 'red', emoji: '🔴', color: '#ef4444', sound: 261 },
  { id: 'blue', emoji: '🔵', color: '#3b82f6', sound: 329 },
  { id: 'green', emoji: '🟢', color: '#22c55e', sound: 392 },
  { id: 'yellow', emoji: '🟡', color: '#eab308', sound: 523 },
];

export class SimonSaysGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.playerCount = 2;
    this.players = [];
    this.currentPlayer = 0;
    this.sequence = [];
    this.inputIdx = 0;
    this.phase = 'idle';
    this.round = 1;
    this.winner = null;
    this.message = '';
    this.render();
  }

  setupGame(count) {
    this.playerCount = count;
    this.players = PLAYER_SETUP.slice(0, count).map((p) => ({ ...p, score: 0, out: false }));
    this.currentPlayer = 0;
    this.sequence = [];
    this.round = 1;
    this.winner = null;
    this.screen = 'play';
    this.startRound();
  }

  async startRound() {
    const alive = this.players.filter((p) => !p.out);
    if (alive.length <= 1 && this.round > 1) {
      this.winner = alive[0] || this.players.reduce((a, b) => (a.score >= b.score ? a : b));
      this.screen = 'win';
      this.render();
      return;
    }

    this.sequence.push(Math.floor(Math.random() * 4));
    this.phase = 'show';
    this.message = `Ronde ${this.round} — perhatikan!`;
    this.render();
    await sleep(600);

    for (let i = 0; i < this.sequence.length; i++) {
      await this.flashButton(this.sequence[i]);
      await sleep(280);
    }

    this.currentPlayer = this.players.findIndex((p) => !p.out);
    this.inputIdx = 0;
    this.phase = 'input';
    this.message = `Giliran ${this.players[this.currentPlayer].emoji} ${this.players[this.currentPlayer].name}`;
    this.render();
  }

  async flashButton(idx) {
    const btn = this.container.querySelector(`[data-color="${idx}"]`);
    if (btn) {
      btn.classList.add('simon-flash');
      this.beep(COLORS[idx].sound);
      await sleep(450);
      btn.classList.remove('simon-flash');
    }
  }

  beep(freq) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  async onTap(colorIdx) {
    if (this.phase !== 'input' || this.winner) return;
    const expected = this.sequence[this.inputIdx];
    const btn = this.container.querySelector(`[data-color="${colorIdx}"]`);
    btn?.classList.add('simon-tap');
    setTimeout(() => btn?.classList.remove('simon-tap'), 200);
    this.beep(COLORS[colorIdx].sound);

    if (colorIdx !== expected) {
      this.players[this.currentPlayer].out = true;
      this.phase = 'wrong';
      this.message = `❌ ${this.players[this.currentPlayer].name} salah!`;
      this.render();
      await sleep(1200);
      this.nextPlayerOrRound();
      return;
    }

    this.inputIdx++;
    if (this.inputIdx >= this.sequence.length) {
      this.players[this.currentPlayer].score++;
      this.phase = 'correct';
      this.message = `✅ Benar! +1 poin`;
      this.render();
      await sleep(900);
      this.nextPlayerOrRound();
    }
  }

  async nextPlayerOrRound() {
    let next = -1;
    for (let i = 1; i <= this.playerCount; i++) {
      const idx = (this.currentPlayer + i) % this.playerCount;
      if (!this.players[idx].out) {
        next = idx;
        break;
      }
    }

    if (next >= 0 && next !== this.currentPlayer) {
      this.currentPlayer = next;
      this.inputIdx = 0;
      this.phase = 'input';
      this.message = `Giliran ${this.players[this.currentPlayer].emoji} ${this.players[this.currentPlayer].name}`;
      this.render();
      return;
    }

    this.round++;
    const alive = this.players.filter((p) => !p.out);
    if (alive.length === 0) {
      this.winner = this.players.reduce((a, b) => (a.score >= b.score ? a : b));
      this.screen = 'win';
      this.render();
      return;
    }
    if (alive.length === 1 && this.round > 2) {
      this.winner = alive[0];
      this.screen = 'win';
      this.render();
      return;
    }
    await this.startRound();
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
        <div class="menu-content">
          <div class="logo">🎵</div>
          <h1>Simon Says</h1>
          <p class="subtitle">2–4 pemain · ikut pola warna!</p>
          <button class="btn btn-primary" data-action="setup">Mulai Main</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali</button>
          <div class="how-to">
            <p>👀 Perhatikan urutan warna</p>
            <p>👆 Ulangi pola dengan ketuk</p>
            <p>Salah = gugur · poin terbanyak menang!</p>
          </div>
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
          <button class="btn btn-primary" data-action="start">Main! 🎵</button>
          <button class="btn btn-ghost" data-action="menu">← Kembali</button>
        </div>
      </div>
    `;
    this.bindActions();
    this.container.querySelectorAll('[data-players]').forEach((el) => {
      el.addEventListener('click', () => { this.playerCount = Number(el.dataset.players); this.renderSetup(); });
    });
  }

  renderPlay() {
    const canTap = this.phase === 'input';
    const zones = this.players.map((p, i) => `
      <div class="simon-player-chip ${i === this.currentPlayer && canTap ? 'active' : ''} ${p.out ? 'out' : ''}"
        style="--pc:${p.color}">
        <span>${p.emoji}</span>
        <span>${p.name}</span>
        <span class="simon-score">${p.score}</span>
        ${p.out ? '<span class="simon-out">✗</span>' : ''}
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="screen simon-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <div class="level-info">
            <span class="level-badge simon-badge">Simon Says</span>
            <span class="tier-label">Ronde ${this.round} · ${this.sequence.length} langkah</span>
          </div>
        </header>
        <div class="simon-message">${this.message}</div>
        <div class="simon-players">${zones}</div>
        <div class="simon-pad ${canTap ? 'active' : 'locked'}">
          ${COLORS.map((c, i) => `
            <button class="simon-btn" data-color="${i}" style="--sc:${c.color}" ${canTap ? '' : 'disabled'}>
              <span class="simon-emoji">${c.emoji}</span>
            </button>
          `).join('')}
        </div>
        <div class="simon-hint">${canTap ? '👆 Ketuk urutan yang sama!' : this.phase === 'show' ? '👀 Lihat...' : '⏳ Tunggu...'}</div>
      </div>
    `;

    if (canTap) {
      this.container.querySelectorAll('.simon-btn').forEach((btn) => {
        btn.addEventListener('click', () => this.onTap(Number(btn.dataset.color)));
      });
    }
    this.bindActions();
  }

  renderWin() {
    const sorted = [...this.players].sort((a, b) => b.score - a.score);
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">🏆</div>
          <h2>${this.winner.emoji} ${this.winner.name} Juara!</h2>
          <div class="simon-final-scores">
            ${sorted.map((p) => `<span style="color:${p.color}">${p.emoji} ${p.score} poin</span>`).join(' · ')}
          </div>
          <button class="btn btn-primary" data-action="setup">Main Lagi</button>
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
        if (a === 'setup') { this.screen = 'setup'; this.winner = null; this.render(); }
        else if (a === 'menu') { this.screen = 'menu'; this.winner = null; this.render(); }
        else if (a === 'exit') this.onExit?.();
        else if (a === 'start') this.setupGame(this.playerCount);
      });
    });
  }

  destroy() {}
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
