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
    this.dice1 = 1;
    this.dice2 = 1;
    this.dice = 2;
    this.rolling = false;
    this.moving = false;
    this.message = '';
    this.overlay = null;
    this.winner = null;
    this.hopCell = null;
    this.flashCell = null;
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
    this.hopCell = null;
    this.message = `${this.players[0].emoji} ${this.players[0].name} mulai duluan!`;
    this.screen = 'play';
    this.render();
  }

  async rollDice() {
    if (this.rolling || this.moving || this.overlay || this.winner) return;
    this.rolling = true;
    const cur = this.players[this.currentPlayer];
    this.message = `${cur.emoji} mengocok dadu...`;
    this.render();

    for (let i = 0; i < 14; i++) {
      this.dice1 = 1 + Math.floor(Math.random() * 6);
      this.dice2 = 1 + Math.floor(Math.random() * 6);
      this.dice = this.dice1 + this.dice2;
      this.updateDiceDisplay();
      await sleep(70 + i * 10);
    }

    this.dice1 = 1 + Math.floor(Math.random() * 6);
    this.dice2 = 1 + Math.floor(Math.random() * 6);
    this.dice = this.dice1 + this.dice2;
    this.rolling = false;
    this.render();
    await sleep(350);
    await this.movePlayer(this.dice);
  }

  updateDiceDisplay() {
    const d1 = this.container.querySelector('.snl-dice-face-1');
    const d2 = this.container.querySelector('.snl-dice-face-2');
    const sum = this.container.querySelector('.snl-dice-sum');
    [d1, d2].forEach((el, i) => {
      if (!el) return;
      el.textContent = DICE_EMOJI[i === 0 ? this.dice1 : this.dice2];
      el.classList.remove('dice-roll');
      void el.offsetWidth;
      el.classList.add('dice-roll');
    });
    if (sum) sum.textContent = `= ${this.dice}`;
  }

  async walkCells(player, from, to, stepMs) {
    const dir = to > from ? 1 : -1;
    for (let p = from + dir; dir > 0 ? p <= to : p >= to; p += dir) {
      player.pos = p;
      this.hopCell = p;
      this.flashCell = p;
      this.render();
      this.scrollToCell(p);
      await sleep(stepMs);
    }
    this.hopCell = null;
    this.flashCell = null;
  }

  async movePlayer(steps) {
    this.moving = true;
    const player = this.players[this.currentPlayer];
    const target = player.pos + steps;

    if (target > 100) {
      this.message = `${player.emoji} Butuh angka pas! Tetap di ${player.pos}`;
      this.flashCell = player.pos;
      this.render();
      await sleep(600);
      this.flashCell = null;
      this.moving = false;
      this.nextTurn();
      return;
    }

    this.message = `${player.emoji} Maju ${steps} langkah...`;
    this.render();

    for (let p = player.pos + 1; p <= target; p++) {
      player.pos = p;
      this.hopCell = p;
      this.flashCell = p;
      this.render();
      this.scrollToCell(p);
      await sleep(220);
    }
    this.hopCell = null;
    this.flashCell = null;

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
      this.flashCell = 100;
      this.render();
      this.scrollToCell(100);
      this.moving = false;
      return;
    }

    if (getChallengeAt(player.pos)) {
      this.flashCell = player.pos;
      this.render();
      await sleep(400);
      await this.showChallenge(player);
      this.flashCell = null;
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
        ? `Yay! Naik dari ${from} ke ${to}!`
        : `Waaah! Turun dari ${from} ke ${to}!`,
    };
    this.message = this.overlay.text;
    this.flashCell = from;
    this.render();
    this.scrollToCell(from);

    await sleep(isLadder ? 900 : 1100);

    this.overlay = null;
    this.render();

    await this.walkCells(player, from, to, isLadder ? 90 : 75);

    const board = this.container.querySelector('.snl-board');
    board?.classList.add(isLadder ? 'board-shake-up' : 'board-shake-down');
    this.render();
    await sleep(500);
    board?.classList.remove('board-shake-up', 'board-shake-down');
    await sleep(200);
  }

  showChallenge() {
    return new Promise((resolve) => {
      const cmd = getRandomCommand(Date.now() + this.currentPlayer * 999);
      this.overlay = {
        type: 'challenge',
        emoji: cmd.emoji,
        title: 'Tantangan Seru! ⭐',
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
    this.message = `Giliran ${p.emoji} ${p.name} — lempar dadu!`;
    this.render();
  }

  scrollToCell(n) {
    requestAnimationFrame(() => {
      const cell = this.container.querySelector(`[data-num="${n}"]`);
      cell?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });
  }

  renderControls(canRoll) {
    return `
      <div class="snl-turn-bar snl-pcount-${this.playerCount}" data-active="${this.currentPlayer}">
        ${this.players
          .map((p, i) => {
            const isActive = i === this.currentPlayer && !this.winner;
            const showDice = isActive && (canRoll || this.rolling);
            const label = this.rolling && isActive
              ? 'Mengocok...'
              : !canRoll && isActive
                ? 'Tunggu...'
                : 'Lempar Dadu!';

            return `
              <div class="snl-turn-zone ${isActive ? 'active' : ''}" style="--pc:${p.color}">
                <div class="snl-zone-header">
                  <span class="snl-zone-emoji">${p.emoji}</span>
                  <span class="snl-zone-name">${p.name}</span>
                  <span class="snl-zone-pos">${p.pos}</span>
                </div>
                ${
                  showDice
                    ? `
                  <button class="snl-dice-btn ${canRoll && !this.rolling ? '' : 'disabled'}"
                    data-action="roll" ${canRoll && !this.rolling ? '' : 'disabled'}>
                    <div class="snl-dice-pair">
                      <span class="snl-dice-face snl-dice-face-1 ${this.rolling ? 'dice-rolling' : ''}">${DICE_EMOJI[this.dice1]}</span>
                      <span class="snl-dice-face snl-dice-face-2 ${this.rolling ? 'dice-rolling' : ''}">${DICE_EMOJI[this.dice2]}</span>
                      <span class="snl-dice-sum">= ${this.dice}</span>
                    </div>
                    <span class="snl-dice-label">${label}</span>
                  </button>
                `
                    : `
                  <div class="snl-zone-wait">
                    ${isActive ? '⏳' : '💤'}
                    <span>${isActive ? 'Giliranmu!' : 'Tunggu giliran'}</span>
                  </div>
                `
                }
              </div>
            `;
          })
          .join('')}
      </div>
    `;
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
            <p>🎲🎲 Lempar 2 dadu (2–12 langkah)</p>
            <p>🪜 Naik tangga · 🐍 hindari ular</p>
            <p>⭐ Banyak kotak bintang = tantangan seru!</p>
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
        const isFlash = this.flashCell === num;
        const isHop = this.hopCell === num;

        cells.push(`
          <div class="snl-cell ${light ? 'light' : 'dark'} ${num === 100 ? 'finish' : ''} ${num === 1 ? 'start' : ''} ${challenge ? 'challenge' : ''} ${isFlash ? 'step-flash' : ''}"
            data-num="${num}" style="grid-row:${r + 1};grid-column:${c + 1}">
            <span class="snl-num">${num}</span>
            ${ladder ? '<span class="snl-icon snl-ladder-icon">🪜</span>' : ''}
            ${snake ? '<span class="snl-icon snl-snake-icon">🐍</span>' : ''}
            ${challenge ? '<span class="snl-icon snl-star-icon">⭐</span>' : ''}
            <div class="snl-tokens">
              ${tokens
                .map(
                  (t, ti) =>
                    `<span class="snl-token ${isHop ? 'token-hop' : ''} ${this.currentPlayer === t.index && isHop ? 'token-active-hop' : ''}"
                      style="--pc:${t.color};--delay:${ti * 0.05}s">${t.emoji}</span>`
                )
                .join('')}
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
            <span class="tier-label">${this.playerCount} pemain · ⭐ ${CHALLENGE_SQUARES.length} tantangan</span>
          </div>
        </header>
        <div class="snl-message">${this.message}</div>
        <div class="snl-board-scroll">
          <div class="snl-board">${cells.join('')}</div>
        </div>
        ${this.renderControls(canRoll)}
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
