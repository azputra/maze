const EMOJI_SETS = [
  ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑'],
  ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊'],
  ['⭐', '🌙', '☀️', '🌈', '💫', '🎈'],
  ['🚗', '🚌', '🏎️', '🚲', '✈️', '🚀'],
  ['⚽', '🏀', '🎾', '🏐', '⚾', '🎱'],
];

const TOTAL_LEVELS = 20;
const STORAGE_KEY = 'count-game-progress';

export class CountGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.level = 1;
    this.items = [];
    this.target = '';
    this.correct = 0;
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
    const gridSize = Math.min(4 + Math.floor(lv / 3), 7);
    const count = Math.min(2 + Math.floor(lv / 2), 12);
    return { gridSize, count, total: gridSize * gridSize };
  }

  startLevel(level) {
    this.level = level;
    const cfg = this.getConfig(level);
    const set = EMOJI_SETS[(level - 1) % EMOJI_SETS.length];
    const targetEmoji = set[Math.floor(Math.random() * set.length)];
    const others = set.filter((e) => e !== targetEmoji);
    const items = [];
    let correct = 0;
    for (let i = 0; i < cfg.total; i++) {
      const isTarget = correct < cfg.count && (cfg.total - i <= cfg.count - correct || Math.random() < cfg.count / cfg.total);
      if (isTarget && correct < cfg.count) {
        items.push(targetEmoji);
        correct++;
      } else {
        items.push(others[Math.floor(Math.random() * others.length)]);
      }
    }
    while (items.filter((e) => e === targetEmoji).length < cfg.count) {
      const idx = Math.floor(Math.random() * items.length);
      if (items[idx] !== targetEmoji) {
        items[idx] = targetEmoji;
        correct++;
      }
    }
    this.items = shuffle(items);
    this.target = targetEmoji;
    this.correct = items.filter((e) => e === targetEmoji).length;
    this.screen = 'play';
    this.render();
  }

  pickAnswer(n) {
    if (n === this.correct) {
      const stars = 3;
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
          <div class="logo">🔢</div>
          <h1>Hitung Benda</h1>
          <p class="subtitle">Main sendiri · ${TOTAL_LEVELS} level</p>
          <div class="rules-box">
            <div class="rule-item"><span>👀</span> Lihat gambar di layar</div>
            <div class="rule-item"><span>🔢</span> Hitung berapa banyak emoji target</div>
            <div class="rule-item"><span>👆</span> Ketuk angka yang benar!</div>
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
          <h2>Hitung Benda</h2>
          <span class="progress-text">${this.progress.unlocked}/${TOTAL_LEVELS}</span>
        </header>
        <div class="level-grid level-grid-2col">
          ${Array.from({ length: TOTAL_LEVELS }, (_, i) => {
            const lv = i + 1;
            const locked = lv > this.progress.unlocked;
            const stars = this.progress.stars[lv] || 0;
            return `
              <button class="level-card ${locked ? 'locked' : ''} ${stars ? 'done' : ''}" data-level="${lv}" ${locked ? 'disabled' : ''}>
                ${stars ? `<span class="level-star">${'★'.repeat(stars)}</span>` : ''}
                <span class="level-num">${lv}</span>
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
    const cfg = this.getConfig(this.level);
    const options = this.makeOptions(this.correct);
    this.container.innerHTML = `
      <div class="screen count-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="levels">←</button>
          <div class="level-info">
            <span class="level-badge count-badge">Level ${this.level}</span>
            <span class="tier-label">Berapa banyak?</span>
          </div>
        </header>
        <div class="count-question">
          <span class="count-target-emoji">${this.target}</span>
          <span class="count-question-text">Ada berapa?</span>
        </div>
        <div class="count-grid" style="--cols:${cfg.gridSize}">
          ${this.items.map((e) => `<div class="count-cell">${e}</div>`).join('')}
        </div>
        <div class="count-options">
          ${options.map((n) => `<button class="count-opt-btn" data-ans="${n}">${n}</button>`).join('')}
        </div>
      </div>
    `;
    this.bindActions();
    this.container.querySelectorAll('[data-ans]').forEach((btn) => {
      btn.addEventListener('click', () => this.pickAnswer(Number(btn.dataset.ans)));
    });
  }

  makeOptions(correct) {
    const opts = new Set([correct]);
    while (opts.size < 4) {
      const delta = Math.floor(Math.random() * 5) - 2;
      const v = Math.max(1, correct + delta);
      opts.add(v);
    }
    return shuffle([...opts]);
  }

  renderWin(won) {
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">${won ? '🌟' : '🤔'}</div>
          <h2>${won ? 'Benar!' : 'Salah!'}</h2>
          <p class="win-level">${won ? `Jawaban: ${this.correct}` : `Jawaban yang benar: ${this.correct}`}</p>
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
        if (a === 'levels') { this.screen = 'levels'; this.render(); }
        else if (a === 'menu') { this.screen = 'menu'; this.render(); }
        else if (a === 'exit') this.onExit?.();
        else if (a === 'next') this.startLevel(this.level + 1);
      });
    });
  }

  destroy() {}
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
