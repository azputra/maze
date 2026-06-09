const THEMES = [
  { name: 'Buah', emojis: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🥝', '🍌', '🍉', '🫐', '🍒', '🥭'] },
  { name: 'Hewan', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸'] },
  { name: 'Kendaraan', emojis: ['🚗', '🚕', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🏍️'] },
  { name: 'Alam', emojis: ['🌸', '🌺', '🌻', '🌷', '🌹', '🍀', '🌴', '🌵', '🍁', '🌈', '⭐', '🌙'] },
  { name: 'Makanan', emojis: ['🍕', '🍔', '🌭', '🍟', '🌮', '🍩', '🍪', '🎂', '🍦', '🧁', '🍿', '🥤'] },
  { name: 'Olahraga', emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🎳', '⛳', '🏊'] },
  { name: 'Musik', emojis: ['🎸', '🎹', '🥁', '🎺', '🎻', '🪕', '🎤', '🎧', '🎵', '🎶', '🪗', '🪘'] },
  { name: 'Laut', emojis: ['🐠', '🐟', '🐡', '🦈', '🐙', '🦑', '🦀', '🦞', '🐚', '🐬', '🐳', '🦭'] },
  { name: 'Angkasa', emojis: ['🚀', '🛸', '🌍', '🌙', '⭐', '🪐', '☀️', '🌟', '💫', '🛰️', '👽', '☄️'] },
  { name: 'Serba-serbi', emojis: ['❤️', '💎', '🎈', '🎁', '🏠', '📱', '💡', '🔑', '⏰', '🎀', '🧸', '🎪'] },
];

export const FLIP_LEVELS = THEMES.map((theme, i) => ({
  level: i + 1,
  name: theme.name,
  pairs: 4 + Math.min(i, 4),
  emojis: theme.emojis.slice(0, 4 + Math.min(i, 4)),
}));

export const TOTAL_FLIP_LEVELS = FLIP_LEVELS.length;

const STORAGE_KEY = 'flip-match-progress';

export class FlipMatchGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.level = 0;
    this.cards = [];
    this.flipped = [];
    this.matched = new Set();
    this.moves = 0;
    this.lock = false;
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
    return { unlocked: 0, bestMoves: {}, bestTimes: {} };
  }

  saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  startLevel(level) {
    this.level = level;
    const cfg = FLIP_LEVELS[level];
    const pairs = cfg.emojis.flatMap((emoji, i) => [
      { id: `${i}-a`, pairId: i, emoji },
      { id: `${i}-b`, pairId: i, emoji },
    ]);
    this.cards = shuffle(pairs);
    this.flipped = [];
    this.matched = new Set();
    this.moves = 0;
    this.lock = false;
    this.elapsed = 0;
    this.startTime = Date.now();
    this.screen = 'play';
    clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.elapsed = Date.now() - this.startTime;
      const el = this.container.querySelector('.timer-value');
      if (el) el.textContent = formatTime(this.elapsed);
    }, 100);
    this.render();
  }

  onCardClick(cardId) {
    if (this.lock) return;
    const card = this.cards.find((c) => c.id === cardId);
    if (!card || this.matched.has(card.pairId) || this.flipped.includes(cardId)) return;

    this.flipped.push(cardId);
    this.render();

    if (this.flipped.length === 2) {
      this.moves++;
      const [a, b] = this.flipped.map((id) => this.cards.find((c) => c.id === id));
      if (a.pairId === b.pairId) {
        this.matched.add(a.pairId);
        this.flipped = [];
        this.render();
        if (this.matched.size === FLIP_LEVELS[this.level].pairs) {
          this.winLevel();
        }
      } else {
        this.lock = true;
        setTimeout(() => {
          this.flipped = [];
          this.lock = false;
          this.render();
        }, 800);
      }
    }
  }

  winLevel() {
    clearInterval(this.timerId);
    const key = String(this.level);
    if (this.level >= this.progress.unlocked && this.level < TOTAL_FLIP_LEVELS - 1) {
      this.progress.unlocked = this.level + 1;
    }
    if (!this.progress.bestMoves[key] || this.moves < this.progress.bestMoves[key]) {
      this.progress.bestMoves[key] = this.moves;
    }
    if (!this.progress.bestTimes[key] || this.elapsed < this.progress.bestTimes[key]) {
      this.progress.bestTimes[key] = this.elapsed;
    }
    this.saveProgress();
    setTimeout(() => {
      this.screen = 'win';
      this.render();
    }, 500);
  }

  render() {
    if (this.screen === 'menu') this.renderMenu();
    else if (this.screen === 'levels') this.renderLevels();
    else if (this.screen === 'play') this.renderPlay();
    else if (this.screen === 'win') this.renderWin();
  }

  renderMenu() {
    const done = Object.keys(this.progress.bestMoves).length;
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content">
          <div class="logo">🃏</div>
          <h1>Flip Match</h1>
          <p class="subtitle">Balik kartu & cocokkan gambar!</p>
          <div class="stats-pill">${done} / ${TOTAL_FLIP_LEVELS} selesai</div>
          <button class="btn btn-primary" data-action="continue">
            ${done > 0 ? 'Lanjutkan' : 'Mulai Main'}
          </button>
          <button class="btn btn-secondary" data-action="levels">Pilih Level</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali ke Menu</button>
          <div class="how-to">
            <p>👆 Ketuk kartu untuk membalik</p>
            <p>🎯 Cocokkan 2 gambar yang sama</p>
          </div>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderLevels() {
    const cards = FLIP_LEVELS.map((lv, i) => {
      const unlocked = i <= this.progress.unlocked;
      const done = this.progress.bestMoves[String(i)] != null;
      return `
        <button class="level-card ${unlocked ? '' : 'locked'} ${done ? 'done' : ''}"
          data-action="start" data-level="${i}" ${unlocked ? '' : 'disabled'}>
          <span class="level-num">${i + 1}</span>
          ${done ? '<span class="level-star">★</span>' : ''}
          <span class="level-tier flip-tier">${lv.name}</span>
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="screen levels-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <h2>Pilih Level</h2>
          <span class="progress-text">${Math.min(this.progress.unlocked + 1, TOTAL_FLIP_LEVELS)}/${TOTAL_FLIP_LEVELS}</span>
        </header>
        <div class="level-grid">${cards}</div>
      </div>
    `;
    this.bindActions();
  }

  renderPlay() {
    const cfg = FLIP_LEVELS[this.level];
    const cols = cfg.pairs <= 4 ? 4 : cfg.pairs <= 6 ? 4 : 4;
    const totalCards = cfg.pairs * 2;

    const cardHtml = this.cards
      .map((card) => {
        const isFlipped = this.flipped.includes(card.id) || this.matched.has(card.pairId);
        const isMatched = this.matched.has(card.pairId);
        return `
          <button
            class="flip-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}"
            data-card="${card.id}"
            ${isMatched ? 'disabled' : ''}
          >
            <div class="flip-inner">
              <div class="flip-front">❓</div>
              <div class="flip-back">${card.emoji}</div>
            </div>
          </button>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="screen flip-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="levels">←</button>
          <div class="level-info">
            <span class="level-badge flip-badge">Level ${this.level + 1}</span>
            <span class="tier-label">${cfg.name} · ${cfg.pairs} pasang</span>
          </div>
          <div class="stat-mini">
            <span class="timer-value">${formatTime(this.elapsed)}</span>
          </div>
        </header>
        <div class="flip-hud">
          <span>Gerakan: <strong>${this.moves}</strong></span>
          <span>Cocok: <strong>${this.matched.size}/${cfg.pairs}</strong></span>
        </div>
        <div class="flip-grid" style="grid-template-columns:repeat(${cols},1fr)">
          ${cardHtml}
        </div>
      </div>
    `;

    this.container.querySelectorAll('.flip-card:not(.matched)').forEach((btn) => {
      btn.addEventListener('click', () => this.onCardClick(btn.dataset.card));
    });
    this.bindActions();
  }

  renderWin() {
    const hasNext = this.level < TOTAL_FLIP_LEVELS - 1;
    const cfg = FLIP_LEVELS[this.level];
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">🏆</div>
          <h2>Sempurna! Semua Cocok!</h2>
          <p class="win-level">${cfg.name} — ${cfg.pairs} pasang</p>
          <div class="win-stats">
            <div class="win-stat">
              <span class="win-stat-label">Waktu</span>
              <span class="win-stat-value">${formatTime(this.elapsed)}</span>
            </div>
            <div class="win-stat">
              <span class="win-stat-label">Gerakan</span>
              <span class="win-stat-value">${this.moves}</span>
            </div>
          </div>
          ${hasNext ? `<button class="btn btn-primary" data-action="next">Level ${this.level + 2} →</button>` : ''}
          <button class="btn btn-secondary" data-action="levels">Pilih Level</button>
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
        if (action === 'continue') this.startLevel(Math.min(this.progress.unlocked, TOTAL_FLIP_LEVELS - 1));
        else if (action === 'levels') {
          clearInterval(this.timerId);
          this.screen = 'levels';
          this.render();
        } else if (action === 'menu') {
          clearInterval(this.timerId);
          this.screen = 'menu';
          this.render();
        } else if (action === 'exit') {
          clearInterval(this.timerId);
          this.onExit?.();
        } else if (action === 'start') this.startLevel(Number(el.dataset.level));
        else if (action === 'next') this.startLevel(this.level + 1);
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
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`;
}
