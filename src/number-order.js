const TOTAL_LEVELS = 15;
const STORAGE_KEY = 'number-order-progress';

export class NumberOrderGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.level = 1;
    this.numbers = [];
    this.nextNum = 1;
    this.startTime = null;
    this.elapsed = 0;
    this.timerId = null;
    this.progress = this.loadProgress();
    this.render();
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { unlocked: 1, stars: {}, bestTimes: {} };
  }

  saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  getConfig(lv) {
    const count = Math.min(4 + lv, 16);
    const cols = count <= 6 ? 3 : count <= 9 ? 3 : count <= 12 ? 4 : 4;
    return { count, cols };
  }

  startLevel(level) {
    clearInterval(this.timerId);
    this.level = level;
    const cfg = this.getConfig(level);
    this.cfg = cfg;
    this.numbers = shuffle(Array.from({ length: cfg.count }, (_, i) => i + 1));
    this.nextNum = 1;
    this.startTime = Date.now();
    this.elapsed = 0;
    this.screen = 'play';
    this.render();
    this.timerId = setInterval(() => {
      this.elapsed = Date.now() - this.startTime;
      const el = this.container.querySelector('.order-timer');
      if (el) el.textContent = formatTime(this.elapsed);
    }, 100);
  }

  tap(num) {
    if (num !== this.nextNum) return;
    this.nextNum++;
    if (this.nextNum > this.cfg.count) {
      clearInterval(this.timerId);
      const prev = this.progress.bestTimes[this.level];
      if (!prev || this.elapsed < prev) this.progress.bestTimes[this.level] = this.elapsed;
      const stars = this.elapsed < this.cfg.count * 1500 ? 3 : this.elapsed < this.cfg.count * 2500 ? 2 : 1;
      this.progress.stars[this.level] = Math.max(this.progress.stars[this.level] || 0, stars);
      if (this.level >= this.progress.unlocked) this.progress.unlocked = this.level + 1;
      this.saveProgress();
      this.screen = 'win';
      this.render();
      return;
    }
    this.renderPlay();
  }

  render() {
    if (this.screen === 'menu') this.renderMenu();
    else if (this.screen === 'levels') this.renderLevels();
    else if (this.screen === 'play') this.renderPlay();
    else if (this.screen === 'win') this.renderWin();
  }

  renderMenu() {
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content menu-wide">
          <div class="logo">📊</div>
          <h1>Urut Angka</h1>
          <p class="subtitle">Main sendiri · ${TOTAL_LEVELS} level</p>
          <div class="rules-box">
            <div class="rule-item"><span>1️⃣</span> Ketuk angka dari <strong>terkecil</strong> ke <strong>terbesar</strong></div>
            <div class="rule-item"><span>👆</span> Mulai dari 1, lalu 2, 3, dst.</div>
            <div class="rule-item"><span>⏱️</span> Selesaikan secepat mungkin!</div>
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
          <h2>Urut Angka</h2>
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
                <span class="level-tier" style="background:#8b5cf6">1–${cfg.count}</span>
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
    const done = new Set(Array.from({ length: this.nextNum - 1 }, (_, i) => i + 1));
    this.container.innerHTML = `
      <div class="screen order-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="levels">←</button>
          <div class="level-info">
            <span class="level-badge order-badge">Level ${this.level}</span>
            <span class="tier-label">Ketuk angka: <strong>${this.nextNum}</strong></span>
          </div>
          <span class="stat-mini order-timer">${formatTime(this.elapsed)}</span>
        </header>
        <div class="order-grid" style="--order-cols:${this.cfg.cols}">
          ${this.numbers
            .map(
              (n) => `
            <button class="order-tile ${done.has(n) ? 'done' : ''} ${n === this.nextNum ? 'next' : ''}"
              data-num="${n}" ${done.has(n) ? 'disabled' : ''}>
              ${n}
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    `;
    this.bindActions();
    this.container.querySelectorAll('.order-tile:not(.done)').forEach((btn) => {
      btn.addEventListener('click', () => this.tap(Number(btn.dataset.num)));
    });
  }

  renderWin() {
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">🎉</div>
          <h2>Level Selesai!</h2>
          <p class="win-level">Waktu: ${formatTime(this.elapsed)}</p>
          ${this.level < TOTAL_LEVELS ? `<button class="btn btn-primary" data-action="next">Level ${this.level + 1} →</button>` : ''}
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
        if (a === 'levels') { clearInterval(this.timerId); this.screen = 'levels'; this.render(); }
        else if (a === 'menu') { clearInterval(this.timerId); this.screen = 'menu'; this.render(); }
        else if (a === 'exit') { clearInterval(this.timerId); this.onExit?.(); }
        else if (a === 'next') this.startLevel(this.level + 1);
      });
    });
  }

  destroy() {
    clearInterval(this.timerId);
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
}
