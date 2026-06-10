import {
  PLAYER_SETUP,
  LADDERS,
  SNAKES,
  CHALLENGE_SQUARES,
  getLadderAt,
  getSnakeAt,
  getChallengeAt,
  getRandomCommand,
} from './snakes-ladders-data.js';

export class SnakesLaddersGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.playerCount = 2;
    this.players = [];
    this.currentPlayer = 0;
    this.dice = 1;
    this.rolling = false;
    this.moving = false;
    this.message = '';
    this.overlay = null;
    this.winner = null;
    this.render();
  }

  setupGame(count) {
    this.playerCount = count;
    this.players = PLAYER_SETUP.slice(0, count).map((p) => ({
      ...p,
      pos: 1,
    }));
    this.currentPlayer = 0;
    this.winner = null;
    this.message = `${this.players[0].emoji} ${this.players[0].name} mulai duluan!`;
    this.screen = 'play';
    this.render();
  }

  async rollDice() {
    if (this.rolling || this.moving || this.overlay || this.winner) return;
    this.rolling = true;
    this.message = '🎲 Mengocok dadu...';
    this.render();

    for (let i = 0; i < 12; i++) {
      this.dice = 1 + Math.floor(Math.random() * 6);
      this.updateDiceDisplay();
      await sleep(80 + i * 8);
    }

    this.dice = 1 + Math.floor(Math.random() * 6);
    this.rolling = false;
    this.render();
    await sleep(300);
    await this.movePlayer(this.dice);
  }

  updateDiceDisplay() {
    const el = this.container.querySelector('.snl-dice-face');
    if (el) {
      el.textContent = DICE_EMOJI[this.dice];
      el.classList.add('dice-roll');
      setTimeout(() => el.classList.remove('dice-roll'), 100);
    }
  }

  async movePlayer(steps) {
    this.moving = true;
    const player = this.players[this.currentPlayer];
    const target = player.pos + steps;

    if (target > 100) {
      this.message = `${player.emoji} Butuh angka pas! Tetap di ${player.pos}`;
      this.moving = false;
      this.nextTurn();
      return;
    }

    this.message = `${player.emoji} Maju ${steps} langkah...`;
    this.render();

    for (let p = player.pos + 1; p <= target; p++) {
      player.pos = p;
      this.highlightCell(p);
      this.render();
      await sleep(180);
    }

    const ladder = getLadderAt(player.pos);
    if (ladder) {
      await this.animateSpecial('ladder', ladder.from, ladder.to, player);
    } else {
      const snake = getSnakeAt(player.pos);
      if (snake) {
        await this.animateSpecial('snake', snake.from, snake.to, player);
      }
    }

    if (player.pos === 100) {
      this.winner = player;
      this.message = `🏆 ${player.emoji} ${player.name} MENANG!`;
      this.moving = false;
      this.render();
      return;
    }

    if (getChallengeAt(player.pos)) {
      await this.showChallenge(player);
    }

    this.moving = false;
    this.nextTurn();
  }

  async animateSpecial(type, from, to, player) {
    const isLadder = type === 'ladder';
    this.overlay = {
      type,
      from,
      to,
      emoji: isLadder ? '🪜' : '🐍',
      title: isLadder ? 'Naik Tangga!' : 'Kena Ular!',
      text: isLadder
        ? `Yay! Loncat dari ${from} ke ${to}!`
        : `Waaah! Turun dari ${from} ke ${to}!`,
    };
    this.message = this.overlay.text;
    this.render();

    await sleep(isLadder ? 1200 : 1500);

    player.pos = to;
    const board = this.container.querySelector('.snl-board');
    board?.classList.add(isLadder ? 'board-shake-up' : 'board-shake-down');
    this.render();
    await sleep(400);
    board?.classList.remove('board-shake-up', 'board-shake-down');

    this.overlay = null;
    this.render();
    await sleep(300);
  }

  showChallenge() {
    return new Promise((resolve) => {
      const cmd = getRandomCommand(Date.now());
      this.overlay = {
        type: 'challenge',
        emoji: cmd.emoji,
        title: 'Tantangan Seru!',
        text: cmd.text,
      };
      this.message = `${cmd.emoji} ${cmd.text}`;
      this.render();
      this._challengeDone = () => {
        this.overlay = null;
        this.render();
        resolve();
      };
    });
  }

  nextTurn() {
    if (this.winner) return;
    this.currentPlayer = (this.currentPlayer + 1) % this.playerCount;
    const p = this.players[this.currentPlayer];
    this.message = `Giliran ${p.emoji} ${p.name}`;
    this.render();
  }

  highlightCell(n) {
    this.container.querySelectorAll('.snl-cell').forEach((el) => {
      el.classList.toggle('step-flash', Number(el.dataset.num) === n);
    });
  }

  render() {
    if (this.screen === 'menu') this.renderMenu();
    else if (this.screen === 'setup') this.renderSetup();
    else if (this.screen === 'play') this.renderPlay();
  }

  renderMenu() {
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content">
          <div class="logo">🐍</div>
          <h1>Ular Tangga</h1>
          <p class="subtitle">1–100 kotak · seru bareng teman!</p>
          <button class="btn btn-primary" data-action="setup">Mulai Main</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali ke Menu</button>
          <div class="how-to">
            <p>🎲 Lempar dadu & maju ke kotak 100</p>
            <p>🪜 Naik tangga · 🐍 hindari ular</p>
            <p>⭐ Kotak bintang = tantangan seru!</p>
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
          <p class="subtitle">Pilih jumlah pemain</p>
          <div class="snl-player-pick">
            ${[2, 3, 4]
              .map(
                (n) => `
              <button class="snl-pick-btn ${this.playerCount === n ? 'active' : ''}" data-players="${n}">
                <span class="snl-pick-num">${n}</span>
                <span>Pemain</span>
              </button>
            `
              )
              .join('')}
          </div>
          <div class="snl-pick-preview">
            ${PLAYER_SETUP.slice(0, this.playerCount)
              .map((p) => `<span style="color:${p.color}">${p.emoji} ${p.name}</span>`)
              .join(' · ')}
          </div>
          <button class="btn btn-primary" data-action="start">Main! 🎲</button>
          <button class="btn btn-ghost" data-action="menu">← Kembali</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderPlay() {
    const cur = this.players[this.currentPlayer];
    const canRoll = !this.rolling && !this.moving && !this.overlay && !this.winner;

    const cells = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const num = gridToNum(r, c);
        const light = (r + c) % 2 === 0;
        const ladder = LADDERS.find((l) => l.from === num);
        const snake = SNAKES.find((s) => s.from === num);
        const challenge = CHALLENGE_SQUARES.includes(num);
        const tokens = this.players
          .map((p, i) => (p.pos === num ? { ...p, index: i } : null))
          .filter(Boolean);

        cells.push(`
          <div class="snl-cell ${light ? 'light' : 'dark'} ${num === 100 ? 'finish' : ''} ${num === 1 ? 'start' : ''}"
            data-num="${num}" style="grid-row:${r + 1};grid-column:${c + 1}">
            <span class="snl-num">${num}</span>
            ${ladder ? '<span class="snl-icon snl-ladder-icon">🪜</span>' : ''}
            ${snake ? '<span class="snl-icon snl-snake-icon">🐍</span>' : ''}
            ${challenge ? '<span class="snl-icon snl-star-icon">⭐</span>' : ''}
            <div class="snl-tokens">
              ${tokens.map((t) => `<span class="snl-token" style="--pc:${t.color}">${t.emoji}</span>`).join('')}
            </div>
          </div>
        `);
      }
    }

    const overlayHtml = this.overlay
      ? `
      <div class="snl-overlay ${this.overlay.type}">
        <div class="snl-overlay-card ${this.overlay.type}">
          <div class="snl-overlay-emoji ${this.overlay.type === 'snake' ? 'anim-snake' : this.overlay.type === 'ladder' ? 'anim-ladder' : 'anim-challenge'}">
            ${this.overlay.emoji}
          </div>
          <h3>${this.overlay.title}</h3>
          <p>${this.overlay.text}</p>
          ${this.overlay.type === 'challenge' ? '<button class="btn btn-primary snl-done-btn" data-action="challenge-done">Selesai! ✓</button>' : ''}
        </div>
      </div>
    `
      : '';

    const winHtml = this.winner
      ? `
      <div class="snl-overlay win">
        <div class="snl-overlay-card win">
          <div class="snl-overlay-emoji anim-win">🏆</div>
          <h3>Selamat!</h3>
          <p>${this.winner.emoji} ${this.winner.name} menang!</p>
          <button class="btn btn-primary" data-action="setup">Main Lagi</button>
          <button class="btn btn-secondary" data-action="menu">Menu</button>
        </div>
      </div>
    `
      : '';

    this.container.innerHTML = `
      <div class="screen snl-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <div class="level-info">
            <span class="level-badge snl-badge">Ular Tangga</span>
            <span class="tier-label">${this.playerCount} pemain · kotak 100</span>
          </div>
        </header>
        <div class="snl-players-bar">
          ${this.players
            .map(
              (p, i) => `
            <div class="snl-player-chip ${i === this.currentPlayer && !this.winner ? 'active' : ''}" style="--pc:${p.color}">
              <span>${p.emoji}</span>
              <span class="snl-chip-name">${p.name}</span>
              <span class="snl-chip-pos">${p.pos}</span>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="snl-message">${this.message}</div>
        <div class="snl-board-scroll">
          <div class="snl-board">${cells.join('')}</div>
        </div>
        <div class="snl-controls">
          <button class="snl-dice-btn ${canRoll ? '' : 'disabled'}" data-action="roll" ${canRoll ? '' : 'disabled'}>
            <span class="snl-dice-face">${DICE_EMOJI[this.dice]}</span>
            <span class="snl-dice-label">${canRoll ? 'Lempar Dadu!' : 'Tunggu...'}</span>
          </button>
          ${cur && !this.winner ? `<span class="snl-turn">Giliran: ${cur.emoji} ${cur.name}</span>` : ''}
        </div>
        ${overlayHtml}
        ${winHtml}
      </div>
    `;
    this.bindActions();
  }

  bindActions() {
    this.container.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', () => {
        const action = el.dataset.action;
        if (action === 'setup') {
          this.screen = 'setup';
          this.winner = null;
          this.overlay = null;
          this.render();
        } else if (action === 'menu') {
          this.screen = 'menu';
          this.winner = null;
          this.overlay = null;
          this.render();
        } else if (action === 'exit') this.onExit?.();
        else if (action === 'start') this.setupGame(this.playerCount);
        else if (action === 'roll') this.rollDice();
        else if (action === 'challenge-done' && this._challengeDone) this._challengeDone();
      });
    });

    this.container.querySelectorAll('[data-players]').forEach((el) => {
      el.addEventListener('click', () => {
        this.playerCount = Number(el.dataset.players);
        this.renderSetup();
      });
    });
  }

  destroy() {}
}

const DICE_EMOJI = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function gridToNum(row, col) {
  const rowFromBottom = 9 - row;
  const colInRow = rowFromBottom % 2 === 0 ? col : 9 - col;
  return rowFromBottom * 10 + colInRow + 1;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
