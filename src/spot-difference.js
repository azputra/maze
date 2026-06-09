import {
  SPOT_LEVELS,
  TOTAL_SPOT_LEVELS,
  buildSceneItems,
  getDiffIds,
} from './spot-data.js';

const STORAGE_KEY = 'spot-diff-progress';

export class SpotDifferenceGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.level = 0;
    this.found = new Set();
    this.hints = 3;
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
    return { unlocked: 0, completed: {} };
  }

  saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  startLevel(level) {
    this.level = level;
    this.found = new Set();
    this.hints = 3;
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

  onTap(itemId, side) {
    const diffIds = getDiffIds(this.level);
    if (!diffIds.includes(itemId) || this.found.has(itemId)) return;

    this.found.add(itemId);
    this.render();

    if (this.found.size === diffIds.length) {
      clearInterval(this.timerId);
      const key = String(this.level);
      if (this.level >= this.progress.unlocked && this.level < TOTAL_SPOT_LEVELS - 1) {
        this.progress.unlocked = this.level + 1;
      }
      this.progress.completed[key] = { time: this.elapsed, date: Date.now() };
      this.saveProgress();
      setTimeout(() => {
        this.screen = 'win';
        this.render();
      }, 600);
    }
  }

  useHint() {
    if (this.hints <= 0) return;
    const diffIds = getDiffIds(this.level);
    const remaining = diffIds.filter((id) => !this.found.has(id));
    if (remaining.length === 0) return;
    this.hints--;
    const target = remaining[0];
    this.container.querySelectorAll(`[data-item="${target}"]`).forEach((el) => {
      el.classList.add('hint-pulse');
      setTimeout(() => el.classList.remove('hint-pulse'), 2000);
    });
    const hintCount = this.container.querySelector('.hint-count');
    if (hintCount) hintCount.textContent = this.hints;
  }

  renderScene(level, isModified, side) {
    const data = SPOT_LEVELS[level];
    const items = buildSceneItems(level, isModified);
    const diffIds = getDiffIds(level);

    const itemHtml = items
      .map((item) => {
        const isTarget = diffIds.includes(item.id);
        const found = this.found.has(item.id);
        const size = item.size || 1.5;
        return `
          <button
            class="scene-item ${found ? 'found' : ''} ${isTarget ? 'is-target' : ''}"
            data-item="${item.id}"
            data-side="${side}"
            style="left:${item.x}%;top:${item.y}%;font-size:${size}rem"
            ${found ? 'disabled' : ''}
          >${item.emoji}${found ? '<span class="found-mark">✓</span>' : ''}</button>
        `;
      })
      .join('');

    return `
      <div class="spot-scene" style="background:${data.bg}">
        ${itemHtml}
      </div>
    `;
  }

  render() {
    if (this.screen === 'menu') this.renderMenu();
    else if (this.screen === 'levels') this.renderLevels();
    else if (this.screen === 'play') this.renderPlay();
    else if (this.screen === 'win') this.renderWin();
  }

  renderMenu() {
    const done = Object.keys(this.progress.completed).length;
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content">
          <div class="logo">🔍</div>
          <h1>Cari Beda</h1>
          <p class="subtitle">Temukan perbedaan antara 2 gambar!</p>
          <div class="stats-pill">${done} / ${TOTAL_SPOT_LEVELS} selesai</div>
          <button class="btn btn-primary" data-action="continue">
            ${done > 0 ? 'Lanjutkan' : 'Mulai Main'}
          </button>
          <button class="btn btn-secondary" data-action="levels">Pilih Level</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali ke Menu</button>
          <div class="how-to">
            <p>👆 Ketuk perbedaan di gambar</p>
            <p>💡 Pakai petunjuk jika bingung</p>
          </div>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderLevels() {
    const cards = SPOT_LEVELS.map((lv, i) => {
      const unlocked = i <= this.progress.unlocked;
      const done = this.progress.completed[String(i)];
      return `
        <button class="level-card ${unlocked ? '' : 'locked'} ${done ? 'done' : ''}"
          data-action="start" data-level="${i}" ${unlocked ? '' : 'disabled'}>
          <span class="level-num">${i + 1}</span>
          ${done ? '<span class="level-star">★</span>' : ''}
          <span class="level-tier spot-tier">${lv.title}</span>
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="screen levels-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <h2>Pilih Level</h2>
          <span class="progress-text">${Math.min(this.progress.unlocked + 1, TOTAL_SPOT_LEVELS)}/${TOTAL_SPOT_LEVELS}</span>
        </header>
        <div class="level-grid">${cards}</div>
      </div>
    `;
    this.bindActions();
  }

  renderPlay() {
    const data = SPOT_LEVELS[this.level];
    const total = getDiffIds(this.level).length;

    this.container.innerHTML = `
      <div class="screen spot-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="levels">←</button>
          <div class="level-info">
            <span class="level-badge spot-badge">Level ${this.level + 1}</span>
            <span class="tier-label">${data.title}</span>
          </div>
          <div class="stat-mini">
            <span class="timer-value">${formatTime(this.elapsed)}</span>
          </div>
        </header>
        <div class="spot-hud">
          <span>Ditemukan: <strong>${this.found.size}/${total}</strong></span>
          <button class="hint-btn" data-action="hint">💡 <span class="hint-count">${this.hints}</span></button>
        </div>
        <div class="spot-images">
          <div class="spot-panel">
            <span class="spot-label">Gambar A</span>
            ${this.renderScene(this.level, false, 'a')}
          </div>
          <div class="spot-panel">
            <span class="spot-label">Gambar B</span>
            ${this.renderScene(this.level, true, 'b')}
          </div>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.scene-item.is-target:not(.found)').forEach((btn) => {
      btn.addEventListener('click', () => this.onTap(btn.dataset.item, btn.dataset.side));
    });
    this.bindActions();
  }

  renderWin() {
    const hasNext = this.level < TOTAL_SPOT_LEVELS - 1;
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">🎉</div>
          <h2>Hebat! Semua Perbedaan Ditemukan!</h2>
          <p class="win-level">${SPOT_LEVELS[this.level].title}</p>
          <div class="win-stats">
            <div class="win-stat">
              <span class="win-stat-label">Waktu</span>
              <span class="win-stat-value">${formatTime(this.elapsed)}</span>
            </div>
            <div class="win-stat">
              <span class="win-stat-label">Perbedaan</span>
              <span class="win-stat-value">${getDiffIds(this.level).length}</span>
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
        if (action === 'continue') this.startLevel(Math.min(this.progress.unlocked, TOTAL_SPOT_LEVELS - 1));
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
        else if (action === 'hint') this.useHint();
      });
    });
  }

  destroy() {
    clearInterval(this.timerId);
  }
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`;
}
