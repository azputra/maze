import {
  PLAYER_SETUP,
  TILES,
  START_MONEY,
  PASS_GO_BONUS,
  WIN_MONEY,
  JAIL_POS,
  DICE_EMOJI,
  getTileGridPositions,
  formatMoney,
  drawChanceCard,
} from './get-rich-data.js';

export class GetRichGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.playerCount = 2;
    this.players = [];
    this.ownership = {};
    this.currentPlayer = 0;
    this.dice1 = 1;
    this.dice2 = 1;
    this.dice = 2;
    this.rolling = false;
    this.moving = false;
    this.message = '';
    this.overlay = null;
    this.winner = null;
    this.gridPos = getTileGridPositions();
    this.render();
  }

  setupGame(count) {
    this.playerCount = count;
    this.players = PLAYER_SETUP.slice(0, count).map((p) => ({
      ...p,
      pos: 0,
      money: START_MONEY,
      inJail: false,
      jailTurns: 0,
      bankrupt: false,
    }));
    this.ownership = {};
    this.currentPlayer = 0;
    this.winner = null;
    this.overlay = null;
    this.message = `${this.players[0].emoji} ${this.players[0].name} mulai!`;
    this.screen = 'play';
    this.render();
  }

  activePlayers() {
    return this.players.filter((p) => !p.bankrupt);
  }

  async rollDice() {
    if (this.rolling || this.moving || this.overlay || this.winner) return;
    const player = this.players[this.currentPlayer];
    if (player.bankrupt) {
      this.nextTurn();
      return;
    }

    if (player.inJail) {
      this.rolling = true;
      this.message = `${player.emoji} di penjara — lempar dadu...`;
      this.render();
      await sleep(400);
      this.dice1 = 1 + Math.floor(Math.random() * 6);
      this.dice2 = 1 + Math.floor(Math.random() * 6);
      this.dice = this.dice1 + this.dice2;
      this.rolling = false;
      this.render();
      await sleep(500);
      if (this.dice1 === this.dice2) {
        player.inJail = false;
        player.jailTurns = 0;
        this.message = `${player.emoji} dadu kembar! Bebas dari penjara!`;
        this.render();
        await sleep(600);
        await this.movePlayer(this.dice);
      } else {
        player.jailTurns++;
        if (player.jailTurns >= 3) {
          player.inJail = false;
          player.jailTurns = 0;
          this.message = `${player.emoji} bayar denda — keluar penjara`;
          player.money -= 500;
          this.checkBankrupt(player);
          await sleep(500);
          if (!player.bankrupt) await this.movePlayer(this.dice);
        } else {
          this.message = `${player.emoji} masih di penjara (${player.jailTurns}/3)`;
          this.render();
          await sleep(800);
          this.nextTurn();
        }
      }
      return;
    }

    this.rolling = true;
    this.message = `${player.emoji} melempar dadu...`;
    this.render();

    for (let i = 0; i < 12; i++) {
      this.dice1 = 1 + Math.floor(Math.random() * 6);
      this.dice2 = 1 + Math.floor(Math.random() * 6);
      this.dice = this.dice1 + this.dice2;
      this.render();
      await sleep(60 + i * 8);
    }

    this.dice1 = 1 + Math.floor(Math.random() * 6);
    this.dice2 = 1 + Math.floor(Math.random() * 6);
    this.dice = this.dice1 + this.dice2;
    this.rolling = false;
    this.render();
    await sleep(400);
    await this.movePlayer(this.dice);
  }

  async movePlayer(steps) {
    this.moving = true;
    const player = this.players[this.currentPlayer];
    for (let i = 0; i < steps; i++) {
      player.pos = (player.pos + 1) % TILES.length;
      if (player.pos === 0) {
        player.money += PASS_GO_BONUS;
        this.message = `${player.emoji} lewat MULAI +${formatMoney(PASS_GO_BONUS)}!`;
      }
      this.render();
      await sleep(180);
    }

    this.moving = false;
    await this.landOnTile(player);
  }

  async landOnTile(player) {
    const tile = TILES[player.pos];
    this.message = `${player.emoji} di ${tile.emoji} ${tile.name}`;

    if (tile.type === 'property') {
      const owner = this.ownership[player.pos];
      if (owner === undefined) {
        this.showBuyDialog(player, tile);
        return;
      }
      if (owner !== player.id && !this.players[owner].bankrupt) {
        const rent = tile.rent;
        player.money -= rent;
        this.players[owner].money += rent;
        this.message = `${player.emoji} bayar sewa ${formatMoney(rent)} ke ${this.players[owner].emoji}`;
        this.checkBankrupt(player);
        this.checkWin();
        this.render();
        await sleep(900);
        if (!this.winner && !player.bankrupt) this.nextTurn();
        return;
      }
    } else if (tile.type === 'tax') {
      player.money -= tile.amount;
      this.message = `${player.emoji} bayar pajak ${formatMoney(tile.amount)}`;
      this.checkBankrupt(player);
      this.render();
      await sleep(800);
    } else if (tile.type === 'chance') {
      await this.drawCard(player);
      return;
    } else if (tile.type === 'go_jail') {
      player.pos = JAIL_POS;
      player.inJail = true;
      player.jailTurns = 0;
      this.message = `${player.emoji} masuk penjara! 🔒`;
      this.render();
      await sleep(900);
    }

    this.checkWin();
    if (!this.winner && !player.bankrupt) this.nextTurn();
    this.render();
  }

  showBuyDialog(player, tile) {
    this.overlay = {
      type: 'buy',
      tile,
      player,
      text: `Beli ${tile.emoji} ${tile.name}?`,
      price: tile.price,
      rent: tile.rent,
    };
    this.render();
  }

  buyProperty() {
    const { player, tile } = this.overlay;
    if (player.money >= tile.price) {
      player.money -= tile.price;
      this.ownership[player.pos] = player.id;
      this.message = `${player.emoji} beli ${tile.name}! 🎉`;
    } else {
      this.message = `${player.emoji} uang tidak cukup`;
    }
    this.overlay = null;
    this.checkWin();
    if (!this.winner) this.nextTurn();
    this.render();
  }

  skipBuy() {
    this.overlay = null;
    this.message = `${this.players[this.currentPlayer].emoji} lewati ${TILES[this.players[this.currentPlayer].pos].name}`;
    this.checkWin();
    if (!this.winner) this.nextTurn();
    this.render();
  }

  async drawCard(player) {
    const card = drawChanceCard(Date.now() + player.id * 777);
    this.overlay = { type: 'chance', card, player };
    this.render();
    await new Promise((resolve) => {
      this._cardDone = () => {
        this.applyCard(player, card);
        this.overlay = null;
        this.render();
        resolve();
      };
    });
    this.checkWin();
    if (!this.winner && !player.bankrupt) this.nextTurn();
  }

  applyCard(player, card) {
    if (card.money) {
      player.money += card.money;
      this.message = `${player.emoji} ${card.text} (${card.money > 0 ? '+' : ''}${formatMoney(Math.abs(card.money))})`;
      if (card.money < 0) this.checkBankrupt(player);
    } else if (card.move) {
      const steps = Math.abs(card.move);
      const dir = card.move > 0 ? 1 : -1;
      for (let i = 0; i < steps; i++) {
        player.pos = (player.pos + dir + TILES.length) % TILES.length;
      }
      this.message = `${player.emoji} ${card.text}`;
    } else if (card.goStart) {
      player.pos = 0;
      player.money += PASS_GO_BONUS;
      this.message = `${player.emoji} ke MULAI!`;
    } else if (card.goJail) {
      player.pos = JAIL_POS;
      player.inJail = true;
      player.jailTurns = 0;
      this.message = `${player.emoji} ke penjara!`;
    } else {
      this.message = card.text;
    }
  }

  checkBankrupt(player) {
    if (player.money < 0) {
      player.bankrupt = true;
      player.money = 0;
      Object.keys(this.ownership).forEach((k) => {
        if (this.ownership[k] === player.id) delete this.ownership[k];
      });
      this.message = `💔 ${player.emoji} ${player.name} bangkrut!`;
      const alive = this.activePlayers();
      if (alive.length === 1) {
        this.winner = alive[0];
      }
    }
  }

  checkWin() {
    const alive = this.activePlayers();
    if (alive.length === 1) {
      this.winner = alive[0];
      return;
    }
    const rich = alive.find((p) => p.money >= WIN_MONEY);
    if (rich) this.winner = rich;
  }

  nextTurn() {
    if (this.winner) return;
    let next = (this.currentPlayer + 1) % this.playerCount;
    let guard = 0;
    while (this.players[next].bankrupt && guard < this.playerCount) {
      next = (next + 1) % this.playerCount;
      guard++;
    }
    this.currentPlayer = next;
    const p = this.players[this.currentPlayer];
    this.message = `Giliran ${p.emoji} ${p.name} — lempar dadu!`;
    this.render();
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
        <div class="menu-content menu-wide">
          <div class="logo">💰</div>
          <h1>Kaya Raya</h1>
          <p class="subtitle">Monopoli ala Get Rich · 2–4 pemain</p>
          <div class="rules-box">
            <div class="rule-item"><span>🎲</span> Lempar 2 dadu, jalan di papan</div>
            <div class="rule-item"><span>🏠</span> Beli properti, kumpulkan sewa</div>
            <div class="rule-item"><span>🎴</span> Kartu keberuntungan — untung & rugi!</div>
            <div class="rule-item"><span>🏆</span> Menang: ${formatMoney(WIN_MONEY)} atau lawan bangkrut</div>
          </div>
          <button class="btn btn-primary" data-action="setup">Mulai Main</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali</button>
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
          <div class="snl-player-pick">
            ${[2, 3, 4]
              .map(
                (n) => `
              <button class="snl-pick-btn ${this.playerCount === n ? 'active' : ''}" data-players="${n}">
                <span class="snl-pick-num">${n}</span><span>Pemain</span>
              </button>
            `
              )
              .join('')}
          </div>
          <p class="snl-pick-preview">Masing-masing mulai ${formatMoney(START_MONEY)}</p>
          <button class="btn btn-primary" data-action="start">Main! 💰</button>
          <button class="btn btn-ghost" data-action="menu">← Kembali</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  renderPlay() {
    const canRoll = !this.rolling && !this.moving && !this.overlay && !this.winner;
    const cur = this.players[this.currentPlayer];

    const cells = TILES.map((tile, i) => {
      const gp = this.gridPos[i];
      const owner = this.ownership[i];
      const ownerP = owner !== undefined ? this.players[owner] : null;
      const tokens = this.players
        .filter((p) => !p.bankrupt && p.pos === i)
        .map((p) => `<span class="gr-token" style="--pc:${p.color}">${p.emoji}</span>`)
        .join('');

      return `
        <div class="gr-cell gr-${tile.type} ${cur?.pos === i ? 'gr-current' : ''}"
          style="grid-row:${gp.r + 1};grid-column:${gp.c + 1};${tile.color ? `--tc:${tile.color}` : ''}"
          data-tile="${i}">
          <span class="gr-cell-emoji">${tile.emoji}</span>
          <span class="gr-cell-name">${tile.name}</span>
          ${tile.price ? `<span class="gr-cell-price">${formatMoney(tile.price)}</span>` : ''}
          ${ownerP ? `<span class="gr-owner" style="background:${ownerP.color}">${ownerP.emoji}</span>` : ''}
          <div class="gr-tokens">${tokens}</div>
        </div>
      `;
    }).join('');

    const playerBar = this.players
      .map(
        (p, i) => `
      <div class="gr-player-chip ${i === this.currentPlayer ? 'active' : ''} ${p.bankrupt ? 'out' : ''}"
        style="--pc:${p.color}">
        <span>${p.emoji}</span>
        <span class="gr-chip-name">${p.name}</span>
        <span class="gr-chip-money">${formatMoney(p.money)}</span>
        ${p.inJail ? '<span class="gr-jail-tag">🔒</span>' : ''}
      </div>
    `
      )
      .join('');

    let overlayHtml = '';
    if (this.overlay?.type === 'buy') {
      const { tile } = this.overlay;
      overlayHtml = `
        <div class="gr-overlay">
          <div class="gr-overlay-card buy">
            <div class="gr-overlay-emoji">${tile.emoji}</div>
            <h3>Beli Properti?</h3>
            <p><strong>${tile.name}</strong></p>
            <p>Harga: ${formatMoney(tile.price)} · Sewa: ${formatMoney(tile.rent)}</p>
            <p class="gr-balance">Saldo: ${formatMoney(this.overlay.player.money)}</p>
            <button class="btn btn-primary" data-action="buy" ${this.overlay.player.money < tile.price ? 'disabled' : ''}>Beli! 🏠</button>
            <button class="btn btn-secondary" data-action="skip">Lewati</button>
          </div>
        </div>
      `;
    } else if (this.overlay?.type === 'chance') {
      overlayHtml = `
        <div class="gr-overlay">
          <div class="gr-overlay-card chance">
            <div class="gr-overlay-emoji">${this.overlay.card.emoji}</div>
            <h3>Kartu Keberuntungan</h3>
            <p>${this.overlay.card.text}</p>
            <button class="btn btn-primary" data-action="card-done">Oke! ✓</button>
          </div>
        </div>
      `;
    }

    const winHtml = this.winner
      ? `
      <div class="gr-overlay">
        <div class="gr-overlay-card win">
          <div class="gr-overlay-emoji">🏆</div>
          <h3>Kaya Raya!</h3>
          <p>${this.winner.emoji} ${this.winner.name} menang!</p>
          <p>Harta: ${formatMoney(this.winner.money)}</p>
          <button class="btn btn-primary" data-action="setup">Main Lagi</button>
          <button class="btn btn-secondary" data-action="menu">Menu</button>
        </div>
      </div>
    `
      : '';

    this.container.innerHTML = `
      <div class="screen gr-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <div class="level-info">
            <span class="level-badge gr-badge">Kaya Raya</span>
            <span class="tier-label">${TILES.length} kotak · target ${formatMoney(WIN_MONEY)}</span>
          </div>
        </header>
        <div class="gr-players-bar">${playerBar}</div>
        <div class="gr-message">${this.message}</div>
        <div class="gr-board-scroll">
          <div class="gr-board">
            <div class="gr-center">
              <span class="gr-center-logo">💰</span>
              <span class="gr-center-title">KAYA RAYA</span>
            </div>
            ${cells}
          </div>
        </div>
        <div class="gr-dice-bar">
          <div class="gr-dice-zone ${canRoll || this.rolling ? 'active' : ''}" style="--pc:${cur?.color}">
            <div class="gr-dice-player">${cur?.emoji} ${cur?.name}</div>
            ${
              canRoll || this.rolling
                ? `
              <button class="gr-roll-btn" data-action="roll" ${canRoll && !this.rolling ? '' : 'disabled'}>
                <div class="snl-dice-pair">
                  <span class="snl-dice-face snl-dice-face-1">${DICE_EMOJI[this.dice1]}</span>
                  <span class="snl-dice-face snl-dice-face-2">${DICE_EMOJI[this.dice2]}</span>
                  <span class="snl-dice-sum">= ${this.dice}</span>
                </div>
                <span>${this.rolling ? 'Mengocok...' : cur?.inJail ? 'Lempar (bebas?)' : 'Lempar Dadu!'}</span>
              </button>
            `
                : `<div class="gr-wait">⏳ Tunggu giliran...</div>`
            }
          </div>
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
        const a = el.dataset.action;
        if (a === 'setup') {
          this.screen = 'setup';
          this.winner = null;
          this.overlay = null;
          this.render();
        } else if (a === 'menu') {
          this.screen = 'menu';
          this.winner = null;
          this.overlay = null;
          this.render();
        } else if (a === 'exit') this.onExit?.();
        else if (a === 'start') this.setupGame(this.playerCount);
        else if (a === 'roll') this.rollDice();
        else if (a === 'buy') this.buyProperty();
        else if (a === 'skip') this.skipBuy();
        else if (a === 'card-done' && this._cardDone) this._cardDone();
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
