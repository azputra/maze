const ANIMALS = ['🐹', '🐰', '🐸', '🐱', '🐶', '🦊', '🐻', '🐼'];
const TOTAL_LEVELS = 20;
const STORAGE_KEY = 'whack-game-progress';

export class WhackGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.level = 1;
    this.score = 0;
    this.target = 0;
    this.timeLeft = 30;
    this.activeHole = -1;
    this.timer = null;
    this.gameTimer = null;
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
    const holes = lv <= 5 ? 6 : lv <= 12 ? 9 : 12;
    return {
      holes,
      cols: holes <= 6 ? 3 : holes <= 9 ? 3 : 4,
      target: 6 + lv * 2,
      time: Math.max(20, 35 - Math.floor(lv / 2)),
      showMs: Math.max(600, 1400 - lv * 40),
      gapMs: Math.max(300, 800 - lv * 25),
    };
  }

  startLevel(level) {
    this.clearTimers();
    this.level = level;
    const cfg = this.getConfig(level);
    this.cfg = cfg;
    this.target = cfg.target;
    this.score = 0;
    this.timeLeft = cfg.time;
    this.activeHole = -1;
    this.screen = 'play';
    this.render();
    this.gameTimer = setInterval(() => {
      this.timeLeft--;
      const el = this.container.querySelector('.whack-timer');
      if (el) el.textContent = `${this.timeLeft}s`;
      if (this.timeLeft <= 0) this.endLevel();
    }, 1000);
    this.scheduleNext();
  }

  scheduleNext() {
    if (this.screen !== 'play') return;
    const delay = this.cfg.gapMs + Math.random() * 400;
    this.timer = setTimeout(() => {
      if (this.screen !== 'play') return;
      let hole;
      do { hole = Math.floor(Math.random() * this.cfg.holes); } while (hole === this.activeHole);
      this.activeHole = hole;
      this.renderHoles();
      this.timer = setTimeout(() => {
        if (this.activeHole === hole) {
          this.activeHole = -1;
          this.renderHoles();
        }
        this.scheduleNext();
      }, this.cfg.showMs);
    }, delay);
  }

  whack(hole) {
    if (this.screen !== 'play' || hole !== this.activeHole) return;
    this.score++;
    this.activeHole = -1;
    const scoreEl = this.container.querySelector('.whack-score');
    if (scoreEl) scoreEl.textContent = `${this.score}/${this.target}`;
    this.renderHoles();
    if (this.score >= this.target) this.endLevel();
  }

  renderHoles() {
    const grid = this.container.querySelector('.whack-grid');
    if (!grid) return;
    grid.querySelectorAll('.whack-hole').forEach((btn, i) => {
      const isActive = i === this.activeHole;
      btn.classList.toggle('active', isActive);
      btn.querySelector('.whack-animal').textContent = isActive ? ANIMALS[i % ANIMALS.length] : '';
    });
  }

  endLevel() {
    this.clearTimers();
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
    this.render();
  }

  clearTimers() {
    clearTimeout(this.timer);
    clearInterval(this.gameTimer);
    this.timer = null;
    this.gameTimer = null;
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
          <div class="logo">🐹</div>
          <h1>Asah Reflek</h1>
          <p class="subtitle">Main sendiri · ${TOTAL_LEVELS} level</p>
          <div class="rules-box">
            <div class="rule-item"><span>👀</span> Hewan muncul dari lubang</div>
            <div class="rule-item"><span>👆</span> Ketuk cepat sebelum hilang!</div>
            <div class="rule-item"><span>🎯</span> Kumpulkan cukup sebelum waktu habis</div>
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
          <h2>Asah Reflek</h2>
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
                <span class="level-tier" style="background:#84cc16">${cfg.target} ketuk</span>
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
    const cfg = this.cfg || this.getConfig(this.level);
    this.container.innerHTML = `
      <div class="screen whack-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="levels">←</button>
          <div class="level-info">
            <span class="level-badge whack-badge">Level ${this.level}</span>
            <span class="tier-label whack-score">${this.score}/${this.target}</span>
          </div>
          <span class="stat-mini whack-timer">${this.timeLeft}s</span>
        </header>
        <div class="whack-hint">👆 Ketuk hewan yang muncul!</div>
        <div class="whack-grid" style="--whack-cols:${cfg.cols}">
          ${Array.from({ length: cfg.holes }, (_, i) => `
            <button class="whack-hole" data-hole="${i}">
              <span class="whack-hole-bg">🕳️</span>
              <span class="whack-animal"></span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    this.bindActions();
    this.container.querySelectorAll('.whack-hole').forEach((btn) => {
      btn.addEventListener('click', () => this.whack(Number(btn.dataset.hole)));
    });
    this.renderHoles();
  }

  renderWin(won) {
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">${won ? '🏆' : '⏰'}</div>
          <h2>${won ? 'Hebat!' : 'Coba Lagi!'}</h2>
          <p class="win-level">${won ? `${this.score} ketukan berhasil!` : `Kurang ${this.target - this.score} ketukan`}</p>
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
        if (a === 'levels') { this.clearTimers(); this.screen = 'levels'; this.render(); }
        else if (a === 'menu') { this.clearTimers(); this.screen = 'menu'; this.render(); }
        else if (a === 'exit') { this.clearTimers(); this.onExit?.(); }
        else if (a === 'next') this.startLevel(this.level + 1);
      });
    });
  }

  destroy() {
    this.clearTimers();
  }
}
