import { buildLevel, TOTAL_LEVELS, getTierName, getTierColor } from './maze.js';

const STORAGE_KEY = 'maze-quest-progress';

export class MazeGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.level = 1;
    this.player = { x: 1, y: 1 };
    this.moves = 0;
    this.startTime = null;
    this.elapsed = 0;
    this.timerId = null;
    this.screen = 'menu';
    this.levelData = null;
    this.progress = this.loadProgress();
    this.touchStart = null;

    this.render();
    this.bindEvents();
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { unlocked: 1, bestTimes: {}, bestMoves: {} };
  }

  saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => this.onKey(e));
    this.container.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    this.container.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: true });
  }

  onKey(e) {
    if (this.screen !== 'play') return;
    const map = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      w: [0, -1],
      s: [0, 1],
      a: [-1, 0],
      d: [1, 0],
    };
    const dir = map[e.key];
    if (dir) {
      e.preventDefault();
      this.move(dir[0], dir[1]);
    }
  }

  onTouchStart(e) {
    if (this.screen !== 'play') return;
    const t = e.changedTouches[0];
    this.touchStart = { x: t.clientX, y: t.clientY };
  }

  onTouchEnd(e) {
    if (this.screen !== 'play' || !this.touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchStart.x;
    const dy = t.clientY - this.touchStart.y;
    const minSwipe = 30;
    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.move(dx > 0 ? 1 : -1, 0);
    } else {
      this.move(0, dy > 0 ? 1 : -1);
    }
    this.touchStart = null;
  }

  move(dx, dy) {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    const { grid } = this.levelData;
    if (grid[ny]?.[nx] === 1) {
      this.player = { x: nx, y: ny };
      this.moves++;
      this.render();
      if (nx === this.levelData.end.x && ny === this.levelData.end.y) {
        this.winLevel();
      }
    }
  }

  startLevel(level) {
    this.level = level;
    this.levelData = buildLevel(level);
    this.player = { ...this.levelData.start };
    this.moves = 0;
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

  winLevel() {
    clearInterval(this.timerId);
    const time = this.elapsed;
    const key = String(this.level);

    if (this.level >= this.progress.unlocked && this.level < TOTAL_LEVELS) {
      this.progress.unlocked = this.level + 1;
    }
    if (!this.progress.bestTimes[key] || time < this.progress.bestTimes[key]) {
      this.progress.bestTimes[key] = time;
    }
    if (!this.progress.bestMoves[key] || this.moves < this.progress.bestMoves[key]) {
      this.progress.bestMoves[key] = this.moves;
    }
    this.saveProgress();
    this.screen = 'win';
    this.render();
  }

  render() {
    if (this.screen === 'menu') this.renderMenu();
    else if (this.screen === 'levels') this.renderLevels();
    else if (this.screen === 'play') this.renderPlay();
    else if (this.screen === 'win') this.renderWin();
  }

  renderMenu() {
    const cleared = Object.keys(this.progress.bestTimes).length;
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content">
          <div class="logo">🌀</div>
          <h1>Maze Quest</h1>
          <p class="subtitle">50 Level Labirin</p>
          <div class="stats-pill">${cleared} / ${TOTAL_LEVELS} selesai</div>
          <button class="btn btn-primary" data-action="continue">
            ${cleared > 0 ? 'Lanjutkan' : 'Mulai Main'}
          </button>
          <button class="btn btn-secondary" data-action="levels">Pilih Level</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali ke Menu</button>
          <div class="how-to">
            <p>🖥️ Keyboard: WASD / Arrow keys</p>
            <p>📱 HP: Swipe atau tombol arah</p>
          </div>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderLevels() {
    const cards = Array.from({ length: TOTAL_LEVELS }, (_, i) => {
      const lv = i + 1;
      const unlocked = lv <= this.progress.unlocked;
      const done = this.progress.bestTimes[String(lv)];
      const cfg = buildLevel(lv);
      const tierColor = getTierColor(cfg.tier);
      return `
        <button class="level-card ${unlocked ? '' : 'locked'} ${done ? 'done' : ''}"
          data-action="start-level" data-level="${lv}" ${unlocked ? '' : 'disabled'}>
          <span class="level-num">${lv}</span>
          ${done ? '<span class="level-star">★</span>' : ''}
          <span class="level-tier" style="background:${tierColor}">${getTierName(cfg.tier)}</span>
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="screen levels-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <h2>Pilih Level</h2>
          <span class="progress-text">${this.progress.unlocked}/${TOTAL_LEVELS}</span>
        </header>
        <div class="level-grid">${cards}</div>
      </div>
    `;
    this.bindActions();
  }

  renderPlay() {
    const { grid, cols, rows, end, tier } = this.levelData;
    const tierColor = getTierColor(tier);
    const cellSize = calcCellSize(cols, rows);

    let cells = '';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isWall = grid[y][x] === 0;
        const isPlayer = x === this.player.x && y === this.player.y;
        const isEnd = x === end.x && y === end.y;
        let cls = isWall ? 'wall' : 'path';
        if (isPlayer) cls += ' player';
        if (isEnd) cls += ' end';
        cells += `<div class="cell ${cls}" style="width:${cellSize}px;height:${cellSize}px"></div>`;
      }
    }

    this.container.innerHTML = `
      <div class="screen play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="levels">←</button>
          <div class="level-info">
            <span class="level-badge" style="background:${tierColor}">Level ${this.level}</span>
            <span class="tier-label">${getTierName(tier)}</span>
          </div>
          <div class="stat-mini">
            <span class="timer-value">${formatTime(this.elapsed)}</span>
          </div>
        </header>
        <div class="maze-wrap">
          <div class="maze" style="grid-template-columns:repeat(${cols},${cellSize}px)">${cells}</div>
        </div>
        <div class="hud">
          <span>Gerakan: ${this.moves}</span>
          <span>🎯 Ke pintu hijau</span>
        </div>
        <div class="dpad">
          <button class="dpad-btn" data-dir="0,-1">▲</button>
          <div class="dpad-row">
            <button class="dpad-btn" data-dir="-1,0">◀</button>
            <button class="dpad-btn dpad-center">●</button>
            <button class="dpad-btn" data-dir="1,0">▶</button>
          </div>
          <button class="dpad-btn" data-dir="0,1">▼</button>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.dpad-btn[data-dir]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [dx, dy] = btn.dataset.dir.split(',').map(Number);
        this.move(dx, dy);
      });
    });
    this.bindActions();
  }

  renderWin() {
    const hasNext = this.level < TOTAL_LEVELS;
    const isLast = this.level === TOTAL_LEVELS;
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">${isLast ? '🏆' : '🎉'}</div>
          <h2>${isLast ? 'Selamat! Semua Level Selesai!' : 'Level Selesai!'}</h2>
          <p class="win-level">Level ${this.level} — ${getTierName(this.levelData.tier)}</p>
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
          ${hasNext ? `<button class="btn btn-primary" data-action="next">Level ${this.level + 1} →</button>` : ''}
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
        if (action === 'continue') this.startLevel(Math.min(this.progress.unlocked, TOTAL_LEVELS));
        else if (action === 'levels') {
          clearInterval(this.timerId);
          this.screen = 'levels';
          this.render();
        } else if (action === 'menu') {
          clearInterval(this.timerId);
          this.screen = 'menu';
          this.render();
        } else if (action === 'start-level') this.startLevel(Number(el.dataset.level));
        else if (action === 'next') this.startLevel(this.level + 1);
        else if (action === 'exit') {
          clearInterval(this.timerId);
          this.onExit?.();
        }
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

function calcCellSize(cols, rows) {
  const maxW = Math.min(window.innerWidth - 32, 520);
  const maxH = window.innerHeight * 0.45;
  const byW = Math.floor(maxW / cols);
  const byH = Math.floor(maxH / rows);
  return Math.max(6, Math.min(byW, byH, 28));
}
