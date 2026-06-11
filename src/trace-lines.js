import { TRACE_LEVELS, TOTAL_TRACE_LEVELS } from './trace-levels.js';
import { setupCanvas } from './ui-helpers.js';

const STORAGE_KEY = 'trace-lines-progress';
const TOLERANCE = 0.045;

export class TraceLinesGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.level = 1;
    this.drawing = false;
    this.strokes = [];
    this.currentStroke = [];
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

  startLevel(level) {
    this.level = level;
    this.strokes = [];
    this.currentStroke = [];
    this.screen = 'play';
    this.render();
    requestAnimationFrame(() => this.setupCanvas());
  }

  setupCanvas() {
    const canvas = this.container.querySelector('.trace-canvas');
    const wrap = this.container.querySelector('.trace-canvas-wrap');
    if (!canvas || !wrap) return;

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

    const toNorm = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
      const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
      return { x: x / rect.width, y: y / rect.height };
    };

    const start = (e) => {
      e.preventDefault();
      this.drawing = true;
      this.currentStroke = [toNorm(e)];
      this.draw();
    };
    const move = (e) => {
      if (!this.drawing) return;
      e.preventDefault();
      this.currentStroke.push(toNorm(e));
      this.draw();
    };
    const end = (e) => {
      if (!this.drawing) return;
      e.preventDefault();
      this.drawing = false;
      if (this.currentStroke.length > 2) this.strokes.push([...this.currentStroke]);
      this.currentStroke = [];
      this.draw();
      this.updateProgress();
    };

    canvas.onmousedown = start;
    canvas.onmousemove = move;
    canvas.onmouseup = end;
    canvas.onmouseleave = end;
    canvas.ontouchstart = start;
    canvas.ontouchmove = move;
    canvas.ontouchend = end;
    canvas.ontouchcancel = end;
  }

  getPathPoints() {
    return TRACE_LEVELS[this.level - 1].points;
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  calcCoverage() {
    const path = this.getPathPoints();
    const allPts = this.strokes.flat();
    if (allPts.length < 5) return 0;

    let covered = 0;
    const samples = 40;
    for (let i = 0; i < path.length - 1; i++) {
      for (let s = 0; s < samples; s++) {
        const t = s / samples;
        const px = path[i][0] + (path[i + 1][0] - path[i][0]) * t;
        const py = path[i][1] + (path[i + 1][1] - path[i][1]) * t;
        const near = allPts.some(
          (p) => this.distToSegment(px, py, p.x, p.y, p.x, p.y) < TOLERANCE ||
            allPts.some((q, j) => j > 0 && this.distToSegment(px, py, allPts[j - 1].x, allPts[j - 1].y, p.x, p.y) < TOLERANCE)
        );
        const nearLine = allPts.some((p, j) => {
          if (j === 0) return Math.hypot(px - p.x, py - p.y) < TOLERANCE;
          return this.distToSegment(px, py, allPts[j - 1].x, allPts[j - 1].y, p.x, p.y) < TOLERANCE;
        });
        if (near || nearLine) covered++;
      }
    }
    const total = (path.length - 1) * samples;
    return total > 0 ? covered / total : 0;
  }

  updateProgress() {
    const pct = this.calcCoverage();
    const el = this.container.querySelector('.trace-pct');
    if (el) el.textContent = `${Math.floor(pct * 100)}%`;

    if (pct >= 0.72) {
      const stars = pct >= 0.9 ? 3 : pct >= 0.8 ? 2 : 1;
      this.progress.stars[this.level] = Math.max(this.progress.stars[this.level] || 0, stars);
      if (this.level >= this.progress.unlocked) this.progress.unlocked = this.level + 1;
      this.saveProgress();
    }
  }

  draw() {
    if (!this.ctx) return;
    const { ctx, w, h } = this;
    const path = this.getPathPoints();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    path.forEach(([x, y], i) => {
      const px = x * w;
      const py = y * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const drawStroke = (stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      stroke.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x * w, p.y * h);
        else ctx.lineTo(p.x * w, p.y * h);
      });
      ctx.stroke();
    };
    this.strokes.forEach(drawStroke);
    if (this.currentStroke.length) drawStroke(this.currentStroke);

    const pct = this.calcCoverage();
    const bar = this.container.querySelector('.trace-pct');
    if (bar) bar.textContent = `${Math.floor(pct * 100)}%`;
  }

  clearDrawing() {
    this.strokes = [];
    this.currentStroke = [];
    this.draw();
  }

  finishLevel() {
    const pct = this.calcCoverage();
    if (pct >= 0.72) {
      this.screen = 'win';
    } else {
      this.screen = 'lose';
    }
    this.cleanup();
    this.render();
  }

  cleanup() {
    if (this._resize) window.removeEventListener('resize', this._resize);
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
          <div class="logo">✏️</div>
          <h1>Ngegarisin</h1>
          <p class="subtitle">Main sendiri · ikuti garis putus-putus</p>
          <div class="rules-box">
            <div class="rule-item"><span>👆</span> Tarik jari mengikuti garis putus-putus</div>
            <div class="rule-item"><span>✏️</span> Garis hijau = hasil gambar kamu</div>
            <div class="rule-item"><span>⭐</span> Capai <strong>72%</strong> untuk lulus!</div>
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
          <h2>Ngegarisin</h2>
          <span class="progress-text">${this.progress.unlocked}/${TOTAL_TRACE_LEVELS}</span>
        </header>
        <div class="level-grid level-grid-2col">
          ${TRACE_LEVELS.map((lv) => {
            const locked = lv.level > this.progress.unlocked;
            const stars = this.progress.stars[lv.level] || 0;
            return `
              <button class="level-card ${locked ? 'locked' : ''} ${stars ? 'done' : ''}" data-level="${lv.level}" ${locked ? 'disabled' : ''}>
                ${stars ? `<span class="level-star">${'★'.repeat(stars)}</span>` : ''}
                <span class="level-num">${lv.emoji}</span>
                <span class="level-tier" style="background:#22c55e">${lv.name}</span>
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
    const cfg = TRACE_LEVELS[this.level - 1];
    this.container.innerHTML = `
      <div class="screen trace-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="levels">←</button>
          <div class="level-info">
            <span class="level-badge trace-badge">Level ${this.level}</span>
            <span class="tier-label">${cfg.emoji} ${cfg.name}</span>
          </div>
          <span class="stat-mini trace-pct">0%</span>
        </header>
        <div class="trace-hint">✏️ Ikuti garis putus-putus dengan jari!</div>
        <div class="trace-canvas-wrap"><canvas class="trace-canvas"></canvas></div>
        <div class="trace-actions">
          <button class="btn btn-secondary" data-action="clear">Hapus</button>
          <button class="btn btn-primary" data-action="done">Selesai ✓</button>
        </div>
      </div>
    `;
    this.bindActions();
    requestAnimationFrame(() => this.setupCanvas());
  }

  renderWin(won) {
    const pct = Math.floor(this.calcCoverage() * 100);
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">${won ? '✏️' : '📝'}</div>
          <h2>${won ? 'Bagus!' : 'Coba Lagi!'}</h2>
          <p class="win-level">${won ? `Akurasi ${pct}%` : `Baru ${pct}% — butuh 72%`}</p>
          ${won && this.level < TOTAL_TRACE_LEVELS ? `<button class="btn btn-primary" data-action="next">Level ${this.level + 1} →</button>` : ''}
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
        if (a === 'levels') { this.cleanup(); this.screen = 'levels'; this.render(); }
        else if (a === 'menu') { this.cleanup(); this.screen = 'menu'; this.render(); }
        else if (a === 'exit') { this.cleanup(); this.onExit?.(); }
        else if (a === 'next') this.startLevel(this.level + 1);
        else if (a === 'clear') this.clearDrawing();
        else if (a === 'done') this.finishLevel();
      });
    });
  }

  destroy() {
    this.cleanup();
  }
}
