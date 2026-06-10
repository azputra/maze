import { getBallLevelConfig, getTierColor, TOTAL_BALL_LEVELS } from './ball-levels.js';

const STORAGE_KEY = 'ball-guess-progress';

export class BallGuessGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.level = 1;
    this.phase = 'peek';
    this.cupData = [];
    this.slots = [];
    this.ballCupId = 0;
    this.config = null;
    this.progress = this.loadProgress();
    this.animating = false;
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

  getBallSlot() {
    return this.slots.findIndex((cupId) => this.cupData[cupId].hasBall);
  }

  startLevel(level) {
    this.level = level;
    this.config = getBallLevelConfig(level);
    this.phase = 'peek';
    this.ballCupId = Math.floor(Math.random() * this.config.cups);
    this.cupData = Array.from({ length: this.config.cups }, (_, i) => ({
      id: i,
      hasBall: i === this.ballCupId,
      lifted: false,
    }));
    this.slots = Array.from({ length: this.config.cups }, (_, i) => i);
    this.screen = 'play';
    this.render();
    if (this.phase === 'peek') {
      setTimeout(() => this.startShuffle(), this.config.peekMs);
    }
  }

  async startShuffle() {
    if (this.animating) return;
    this.phase = 'shuffle';
    this.cupData.forEach((c) => {
      c.lifted = false;
    });
    this.render();
    await sleep(500);
    this.animating = true;

    for (let i = 0; i < this.config.swaps; i++) {
      let a = Math.floor(Math.random() * this.config.cups);
      let b = Math.floor(Math.random() * this.config.cups);
      while (b === a) b = Math.floor(Math.random() * this.config.cups);
      await this.animateSwap(a, b);
    }

    this.animating = false;
    this.phase = 'guess';
    this.render();
  }

  async animateSwap(slotA, slotB) {
    const cupA = this.container.querySelector(`[data-slot="${slotA}"]`);
    const cupB = this.container.querySelector(`[data-slot="${slotB}"]`);
    if (!cupA || !cupB) {
      [this.slots[slotA], this.slots[slotB]] = [this.slots[slotB], this.slots[slotA]];
      this.render();
      await sleep(this.config.speed);
      return;
    }

    const rectA = cupA.getBoundingClientRect();
    const rectB = cupB.getBoundingClientRect();
    const dx = rectB.left - rectA.left;
    const dy = rectB.top - rectA.top;

    cupA.style.transition = `transform ${this.config.speed}ms ease-in-out`;
    cupB.style.transition = `transform ${this.config.speed}ms ease-in-out`;
    cupA.style.transform = `translate(${dx}px, ${dy}px)`;
    cupB.style.transform = `translate(${-dx}px, ${-dy}px)`;
    cupA.classList.add('swapping');
    cupB.classList.add('swapping');

    await sleep(this.config.speed);

    [this.slots[slotA], this.slots[slotB]] = [this.slots[slotB], this.slots[slotA]];
    cupA.style.transition = '';
    cupB.style.transition = '';
    cupA.style.transform = '';
    cupB.style.transform = '';
    this.render();
    await sleep(60);
  }

  onGuess(slotIndex) {
    if (this.phase !== 'guess' || this.animating) return;
    this.phase = 'reveal';
    this.cupData.forEach((c) => {
      c.lifted = true;
    });
    this.render();

    const correct = slotIndex === this.getBallSlot();
    setTimeout(() => {
      if (correct) {
        const key = String(this.level);
        if (this.level >= this.progress.unlocked && this.level < TOTAL_BALL_LEVELS) {
          this.progress.unlocked = this.level + 1;
        }
        if (!this.progress.stars[key]) this.progress.stars[key] = true;
        this.saveProgress();
        this.screen = 'win';
      } else {
        this.screen = 'lose';
      }
      this.render();
    }, 900);
  }

  render() {
    if (this.screen === 'menu') this.renderMenu();
    else if (this.screen === 'levels') this.renderLevels();
    else if (this.screen === 'play') this.renderPlay();
    else if (this.screen === 'win') this.renderWin();
    else if (this.screen === 'lose') this.renderLose();
  }

  renderMenu() {
    const done = Object.keys(this.progress.stars).length;
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content">
          <div class="logo">⚽</div>
          <h1>Tebak Bola</h1>
          <p class="subtitle">50 level — ingat posisi bolanya!</p>
          <div class="stats-pill">${done} / ${TOTAL_BALL_LEVELS} selesai</div>
          <button class="btn btn-primary" data-action="continue">Mulai Main</button>
          <button class="btn btn-secondary" data-action="levels">Pilih Level</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali ke Menu</button>
          <div class="how-to">
            <p>👀 Perhatikan bola di bawah gelas</p>
            <p>🔀 Gelas bergerak — tebak posisinya!</p>
          </div>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderLevels() {
    const cards = Array.from({ length: TOTAL_BALL_LEVELS }, (_, i) => {
      const lv = i + 1;
      const unlocked = lv <= this.progress.unlocked;
      const done = this.progress.stars[String(lv)];
      const cfg = getBallLevelConfig(lv);
      return `
        <button class="level-card ${unlocked ? '' : 'locked'} ${done ? 'done' : ''}"
          data-action="start" data-level="${lv}" ${unlocked ? '' : 'disabled'}>
          <span class="level-num">${lv}</span>
          ${done ? '<span class="level-star">★</span>' : ''}
          <span class="level-tier ball-tier">${cfg.tierName}</span>
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="screen levels-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <h2>Pilih Level</h2>
          <span class="progress-text">${this.progress.unlocked}/${TOTAL_BALL_LEVELS}</span>
        </header>
        <div class="level-grid level-grid-2col">${cards}</div>
      </div>
    `;
    this.bindActions();
  }

  renderPlay() {
    const cfg = this.config;
    const tierColor = getTierColor(cfg.tier);
    const showBall = this.phase === 'peek' || this.phase === 'reveal';
    const canGuess = this.phase === 'guess';

    const cupsHtml = this.slots
      .map((cupId, slotIndex) => {
        const cup = this.cupData[cupId];
        const ballVisible = showBall && cup.hasBall;
        return `
          <button class="ball-cup ${cup.lifted ? 'lifted' : ''} ${canGuess ? 'guessable' : ''}"
            data-slot="${slotIndex}" data-cup="${cupId}" ${canGuess ? '' : 'disabled'}
            style="grid-row:${Math.floor(slotIndex / 2) + 1};grid-column:${(slotIndex % 2) + 1}">
            <div class="ball-cup-inner">
              <span class="ball-cup-lid">${cup.lifted ? '' : '🥤'}</span>
              <span class="ball-under ${ballVisible ? 'visible' : ''} ${this.phase === 'shuffle' ? 'ball-hidden' : ''}">${cfg.ball}</span>
            </div>
            <span class="ball-cup-num">${slotIndex + 1}</span>
          </button>
        `;
      })
      .join('');

    const rows = Math.ceil(cfg.cups / 2);
    const hint =
      this.phase === 'peek'
        ? '👀 Perhatikan posisi bola...'
        : this.phase === 'shuffle'
          ? '🔀 Gelas & bola sedang bergerak...'
          : this.phase === 'guess'
            ? '👆 Tebak di gelas nomor berapa?'
            : '...';

    this.container.innerHTML = `
      <div class="screen ball-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="levels">←</button>
          <div class="level-info">
            <span class="level-badge ball-badge" style="background:${tierColor}">Level ${cfg.level}</span>
            <span class="tier-label">${cfg.tierName} · ${cfg.cups} gelas</span>
          </div>
        </header>
        <div class="ball-hud">
          <span>${hint}</span>
          <span>${cfg.swaps}× acak</span>
        </div>
        <div class="ball-stage">
          <div class="ball-cups ball-cups-2col" style="--rows:${rows}">${cupsHtml}</div>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.ball-cup.guessable').forEach((btn) => {
      btn.addEventListener('click', () => this.onGuess(Number(btn.dataset.slot)));
    });
    this.bindActions();
  }

  renderWin() {
    const hasNext = this.level < TOTAL_BALL_LEVELS;
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">🎉</div>
          <h2>Benar! Bola ketemu!</h2>
          <p class="win-level">Level ${this.level}</p>
          ${hasNext ? `<button class="btn btn-primary" data-action="next">Level ${this.level + 1} →</button>` : ''}
          <button class="btn btn-secondary" data-action="levels">Pilih Level</button>
          <button class="btn btn-ghost" data-action="menu">Menu Utama</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderLose() {
    const ballSlot = this.getBallSlot();
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">😅</div>
          <h2>Belum tepat!</h2>
          <p class="win-level">Bola ada di gelas ${ballSlot + 1}</p>
          <button class="btn btn-primary" data-action="retry">Coba Lagi</button>
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
        if (action === 'continue') this.startLevel(Math.min(this.progress.unlocked, TOTAL_BALL_LEVELS));
        else if (action === 'levels') {
          this.screen = 'levels';
          this.render();
        } else if (action === 'menu') {
          this.screen = 'menu';
          this.render();
        } else if (action === 'exit') this.onExit?.();
        else if (action === 'start') this.startLevel(Number(el.dataset.level));
        else if (action === 'next') this.startLevel(this.level + 1);
        else if (action === 'retry') this.startLevel(this.level);
      });
    });
  }

  destroy() {}
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
