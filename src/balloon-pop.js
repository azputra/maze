const COLORS = [
  { id: 'red', emoji: '🔴', name: 'Merah', bg: '#ef4444' },
  { id: 'blue', emoji: '🔵', name: 'Biru', bg: '#3b82f6' },
  { id: 'green', emoji: '🟢', name: 'Hijau', bg: '#22c55e' },
  { id: 'yellow', emoji: '🟡', name: 'Kuning', bg: '#eab308' },
  { id: 'purple', emoji: '🟣', name: 'Ungu', bg: '#a855f7' },
];

const TOTAL_LEVELS = 20;
const STORAGE_KEY = 'balloon-pop-progress';

export class BalloonPopGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.level = 1;
    this.score = 0;
    this.target = 0;
    this.timeLeft = 30;
    this.balloons = [];
    this.spawnTimer = 0;
    this.raf = null;
    this.lastTime = 0;
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
    const target = 5 + lv * 2;
    return {
      target,
      time: Math.max(20, 35 - lv),
      spawnRate: Math.max(0.4, 1.2 - lv * 0.04),
      speed: 0.15 + lv * 0.01,
      colorCount: Math.min(3 + Math.floor(lv / 4), COLORS.length),
    };
  }

  startLevel(level) {
    this.level = level;
    const cfg = this.getConfig(level);
    this.target = cfg.target;
    this.score = 0;
    this.timeLeft = cfg.time;
    this.cfg = cfg;
    this.balloons = [];
    this.spawnTimer = 0;
    this.lastTime = 0;
    this.targetColor = COLORS[Math.floor(Math.random() * cfg.colorCount)];
    this.screen = 'play';
    this.render();
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
      this.renderPlay();
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
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.cfg.spawnRate) {
      this.spawnTimer = 0;
      const pool = COLORS.slice(0, this.cfg.colorCount);
      const c = pool[Math.floor(Math.random() * pool.length)];
      this.balloons.push({
        id: `${Date.now()}-${Math.random()}`,
        color: c,
        x: 0.1 + Math.random() * 0.8,
        y: 1.1,
        popped: false,
      });
    }
    this.balloons.forEach((b) => {
      if (!b.popped) b.y -= this.cfg.speed * dt;
    });
    this.balloons = this.balloons.filter((b) => b.y > -0.2 && !b.popped);
  }

  popBalloon(id) {
    const b = this.balloons.find((x) => x.id === id);
    if (!b || b.popped) return;
    b.popped = true;
    if (b.color.id === this.targetColor.id) {
      this.score++;
      if (this.score >= this.target) this.endLevel();
    }
    this.renderPlay();
  }

  endLevel() {
    cancelAnimationFrame(this.raf);
    const won = this.score >= this.target;
    if (won) {
      const stars = this.timeLeft > this.cfg.time * 0.5 ? 3 : this.timeLeft > this.cfg.time * 0.25 ? 2 : 1;
      this.progress.stars[this.level] = Math.max(this.progress.stars[this.level] || 0, stars);
      if (this.level >= this.progress.unlocked) this.progress.unlocked = this.level + 1;
      this.saveProgress();
      this.screen = 'win';
    } else {
      this.screen = 'lose';
    }
    this.render();
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
          <div class="logo">🎈</div>
          <h1>Pop Balon</h1>
          <p class="subtitle">Main sendiri · ${TOTAL_LEVELS} level</p>
          <div class="rules-box">
            <div class="rule-item"><span>🎯</span> Lihat warna target di atas</div>
            <div class="rule-item"><span>👆</span> Ketuk balon warna yang sama</div>
            <div class="rule-item"><span>⏱️</span> Kumpulkan cukup sebelum waktu habis!</div>
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
          <h2>Pop Balon</h2>
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
                <span class="level-tier" style="background:#f472b6">${cfg.target} balon</span>
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
    if (!this.container.querySelector('.balloon-play-screen')) {
      this.container.innerHTML = `
        <div class="screen balloon-play-screen">
          <header class="top-bar">
            <button class="btn-icon" data-action="levels">←</button>
            <div class="level-info">
              <span class="level-badge balloon-badge">Level ${this.level}</span>
              <span class="tier-label">${this.score}/${this.target} balon</span>
            </div>
            <span class="stat-mini balloon-timer">${Math.ceil(this.timeLeft)}s</span>
          </header>
          <div class="balloon-target">
            <span class="balloon-target-label">Pop warna:</span>
            <span class="balloon-target-color" style="background:${this.targetColor.bg}">${this.targetColor.emoji} ${this.targetColor.name}</span>
          </div>
          <div class="balloon-field"></div>
        </div>
      `;
      this.bindActions();
    }
    const field = this.container.querySelector('.balloon-field');
    const timer = this.container.querySelector('.balloon-timer');
    const tier = this.container.querySelector('.tier-label');
    if (timer) timer.textContent = `${Math.ceil(this.timeLeft)}s`;
    if (tier) tier.textContent = `${this.score}/${this.target} balon`;
    if (!field) return;
    field.innerHTML = this.balloons
      .map(
        (b) => `
      <button class="balloon-item ${b.popped ? 'popped' : ''}" data-id="${b.id}"
        style="left:${b.x * 100}%;top:${b.y * 100}%;--bc:${b.color.bg}">
        🎈
      </button>
    `
      )
      .join('');
    field.querySelectorAll('.balloon-item:not(.popped)').forEach((btn) => {
      btn.onclick = () => this.popBalloon(btn.dataset.id);
    });
  }

  renderWin(won) {
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">${won ? '🎉' : '😅'}</div>
          <h2>${won ? 'Level Selesai!' : 'Coba Lagi!'}</h2>
          <p class="win-level">${won ? `Skor ${this.score}/${this.target}` : `Kurang ${this.target - this.score} balon`}</p>
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
        if (a === 'levels') { cancelAnimationFrame(this.raf); this.screen = 'levels'; this.render(); }
        else if (a === 'menu') { cancelAnimationFrame(this.raf); this.screen = 'menu'; this.render(); }
        else if (a === 'exit') { cancelAnimationFrame(this.raf); this.onExit?.(); }
        else if (a === 'next') this.startLevel(this.level + 1);
      });
    });
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }
}
