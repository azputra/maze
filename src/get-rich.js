import {
  PLAYER_SETUP,
  TILES,
  START_MONEY,
  PASS_GO_BONUS,
  WIN_MONEY,
  JAIL_POS,
  MAX_UPGRADE,
  DICE_EMOJI,
  getTileGridPositions,
  formatMoney,
  drawChanceCard,
  getRent,
  getUpgradeCost,
  ownsFullGroup,
} from './get-rich-data.js';

export class GetRichGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.playerCount = 2;
    this.players = [];
    this.ownership = {};
    this.upgrades = {};
    this.freeParkingPool = 0;
    this.currentPlayer = 0;
    this.doublesStreak = 0;
    this.rollAgain = false;
    this.dice1 = 1;
    this.dice2 = 1;
    this.dice = 2;
    this.rolling = false;
    this.moving = false;
    this.message = '';
    this.toast = '';
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
    this.upgrades = {};
    this.freeParkingPool = 0;
    this.currentPlayer = 0;
    this.doublesStreak = 0;
    this.rollAgain = false;
    this.winner = null;
    this.overlay = null;
    this.toast = '';
    this.message = `${this.players[0].emoji} ${this.players[0].name} mulai!`;
    this.screen = 'play';
    this.render();
  }

  activePlayers() {
    return this.players.filter((p) => !p.bankrupt);
  }

  showToast(text, type = 'info') {
    this.toast = text;
    this.toastType = type;
    this.render();
    setTimeout(() => {
      if (this.toast === text) {
        this.toast = '';
        this.render();
      }
    }, 2200);
  }

  beep(freq = 520, dur = 0.12) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {}
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
        this.showToast('🎲 Dadu kembar — bebas!', 'good');
        this.beep(660);
        await sleep(500);
        await this.movePlayer(this.dice);
      } else {
        player.jailTurns++;
        if (player.jailTurns >= 3) {
          player.inJail = false;
          player.jailTurns = 0;
          player.money -= 500;
          this.freeParkingPool += 500;
          this.message = `${player.emoji} bayar denda Rp500`;
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
    const isDouble = this.dice1 === this.dice2;
    this.rolling = false;
    this.render();
    await sleep(400);

    if (isDouble) {
      this.doublesStreak++;
      this.showToast(`🎲 DADU KEMBAR ${this.dice}!`, 'good');
      this.beep(720);
    } else {
      this.doublesStreak = 0;
    }

    const willRollAgain = isDouble && this.doublesStreak < 3;
    await this.movePlayer(this.dice, { willRollAgain });

    if (!this.winner && !player.bankrupt && willRollAgain) {
      this.rollAgain = true;
      this.message = `${player.emoji} dadu kembar — lempar lagi! 🎲`;
      this.render();
      return;
    }
    if (this.doublesStreak >= 3) {
      this.showToast('3x kembar — giliran selesai!', 'warn');
      this.doublesStreak = 0;
    }
    this.rollAgain = false;
  }

  async movePlayer(steps, opts = {}) {
    this.moving = true;
    const player = this.players[this.currentPlayer];
    for (let i = 0; i < steps; i++) {
      player.pos = (player.pos + 1) % TILES.length;
      if (player.pos === 0) {
        player.money += PASS_GO_BONUS;
        this.message = `${player.emoji} lewat MULAI +${formatMoney(PASS_GO_BONUS)}!`;
        this.beep(580);
      }
      this.render();
      await sleep(160);
    }

    this.moving = false;
    await this.landOnTile(player, opts);
  }

  async landOnTile(player, opts = {}) {
    const tile = TILES[player.pos];
    this.message = `${player.emoji} di ${tile.emoji} ${tile.name}`;

    if (tile.type === 'property') {
      const owner = this.ownership[player.pos];
      if (owner === undefined) {
        this.showBuyDialog(player, tile);
        return;
      }
      if (owner === player.id) {
        const level = this.upgrades[player.pos] || 0;
        if (level < MAX_UPGRADE && player.money >= getUpgradeCost(player.pos)) {
          this.showUpgradeDialog(player, tile);
          return;
        }
      } else if (!this.players[owner].bankrupt) {
        const rent = getRent(player.pos, this.ownership, this.upgrades, owner);
        player.money -= rent;
        this.players[owner].money += rent;
        const mono = tile.group && ownsFullGroup(this.ownership, this.upgrades, owner, tile.group);
        this.message = `${player.emoji} bayar sewa ${formatMoney(rent)}${mono ? ' (MONOPOLI x2!)' : ''}`;
        this.showToast(`💸 -${formatMoney(rent)}`, 'bad');
        this.beep(280, 0.2);
        this.checkBankrupt(player);
        this.checkWin();
        this.render();
        await sleep(900);
        if (!this.winner && !player.bankrupt && !opts.willRollAgain) this.finishTurn();
        return;
      }
    } else if (tile.type === 'tax') {
      player.money -= tile.amount;
      this.freeParkingPool += tile.amount;
      this.message = `${player.emoji} bayar pajak ${formatMoney(tile.amount)}`;
      this.showToast(`💸 Pajak ${formatMoney(tile.amount)}`, 'bad');
      this.checkBankrupt(player);
      this.render();
      await sleep(700);
    } else if (tile.type === 'free_parking') {
      if (this.freeParkingPool > 0) {
        player.money += this.freeParkingPool;
        this.showToast(`🅿️ Jackpot ${formatMoney(this.freeParkingPool)}!`, 'good');
        this.beep(800, 0.25);
        this.message = `${player.emoji} ambil jackpot ${formatMoney(this.freeParkingPool)}!`;
        this.freeParkingPool = 0;
      } else {
        this.message = `${player.emoji} parkir gratis — jackpot kosong`;
      }
      this.render();
      await sleep(800);
    } else if (tile.type === 'chance') {
      await this.drawCard(player);
      return;
    } else if (tile.type === 'go_jail') {
      player.pos = JAIL_POS;
      player.inJail = true;
      player.jailTurns = 0;
      this.showToast('👮 Masuk penjara!', 'warn');
      this.message = `${player.emoji} masuk penjara! 🔒`;
      this.render();
      await sleep(900);
    }

    this.checkWin();
    if (!this.winner && !player.bankrupt && !opts.willRollAgain) this.finishTurn();
    this.render();
  }

  finishTurn() {
    if (this.rollAgain || this.overlay) return;
    this.nextTurn();
  }

  showBuyDialog(player, tile) {
    this.overlay = { type: 'buy', tile, player };
    this.beep(640);
    this.render();
  }

  showUpgradeDialog(player, tile) {
    const level = this.upgrades[player.pos] || 0;
    this.overlay = {
      type: 'upgrade',
      tile,
      player,
      level,
      cost: getUpgradeCost(player.pos),
    };
    this.render();
  }

  buyProperty() {
    const { player, tile } = this.overlay;
    if (player.money >= tile.price) {
      player.money -= tile.price;
      this.ownership[player.pos] = player.id;
      this.showToast(`🏠 Beli ${tile.name}!`, 'good');
      this.beep(700);
      this.message = `${player.emoji} beli ${tile.name}! 🎉`;
    } else {
      this.message = `${player.emoji} uang tidak cukup`;
    }
    this.overlay = null;
    this.checkWin();
    if (!this.winner) this.finishTurn();
    this.render();
  }

  doUpgrade() {
    const { player, tile } = this.overlay;
    const cost = getUpgradeCost(player.pos);
    const level = this.upgrades[player.pos] || 0;
    if (level < MAX_UPGRADE && player.money >= cost) {
      player.money -= cost;
      this.upgrades[player.pos] = level + 1;
      this.showToast(`🏗️ Upgrade level ${level + 1}!`, 'good');
      this.beep(750);
      this.message = `${player.emoji} upgrade ${tile.name}! ⬆️`;
    }
    this.overlay = null;
    if (!this.winner) this.finishTurn();
    this.render();
  }

  skipUpgrade() {
    this.overlay = null;
    if (!this.winner) this.finishTurn();
    this.render();
  }

  skipBuy() {
    this.overlay = null;
    this.message = `${this.players[this.currentPlayer].emoji} lewati properti`;
    this.checkWin();
    if (!this.winner) this.finishTurn();
    this.render();
  }

  async drawCard(player) {
    const card = drawChanceCard(Date.now() + player.id * 777 + this.currentPlayer * 13);
    this.overlay = { type: 'chance', card, player };
    this.beep(500);
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
    if (!this.winner && !player.bankrupt && !this.rollAgain) this.finishTurn();
  }

  applyCard(player, card) {
    if (card.money) {
      player.money += card.money;
      this.showToast(`${card.money > 0 ? '+' : ''}${formatMoney(Math.abs(card.money))}`, card.money > 0 ? 'good' : 'bad');
      if (card.money < 0) {
        this.freeParkingPool += Math.abs(card.money);
        this.checkBankrupt(player);
      }
    } else if (card.rollAgain) {
      this.rollAgain = true;
      this.message = `${player.emoji} lempar dadu lagi!`;
    } else if (card.freeUpgrade) {
      const owned = Object.keys(this.ownership).filter((k) => this.ownership[k] === player.id);
      if (owned.length) {
        const idx = Number(owned[Math.floor(Math.random() * owned.length)]);
        const lv = this.upgrades[idx] || 0;
        if (lv < MAX_UPGRADE) {
          this.upgrades[idx] = lv + 1;
          this.showToast('🏗️ Gratis upgrade!', 'good');
        }
      }
    } else if (card.move) {
      const steps = Math.abs(card.move);
      const dir = card.move > 0 ? 1 : -1;
      for (let i = 0; i < steps; i++) {
        player.pos = (player.pos + dir + TILES.length) % TILES.length;
      }
    } else if (card.goStart) {
      player.pos = 0;
      player.money += PASS_GO_BONUS;
    } else if (card.goJail) {
      player.pos = JAIL_POS;
      player.inJail = true;
      player.jailTurns = 0;
    }
    this.message = `${card.emoji} ${card.text}`;
  }

  checkBankrupt(player) {
    if (player.money < 0) {
      player.bankrupt = true;
      player.money = 0;
      Object.keys(this.ownership).forEach((k) => {
        if (this.ownership[k] === player.id) {
          delete this.ownership[k];
          delete this.upgrades[k];
        }
      });
      this.showToast(`💔 ${player.name} bangkrut!`, 'bad');
      const alive = this.activePlayers();
      if (alive.length === 1) this.winner = alive[0];
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
    if (this.winner || this.rollAgain) return;
    let next = (this.currentPlayer + 1) % this.playerCount;
    let guard = 0;
    while (this.players[next].bankrupt && guard < this.playerCount) {
      next = (next + 1) % this.playerCount;
      guard++;
    }
    this.currentPlayer = next;
    this.doublesStreak = 0;
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
            <div class="rule-item"><span>🎲</span> Dadu kembar = lempar lagi!</div>
            <div class="rule-item"><span>🏠</span> Monopoli warna sama = sewa x2</div>
            <div class="rule-item"><span>🏗️</span> Upgrade properti = sewa naik</div>
            <div class="rule-item"><span>🅿️</span> Parkir Gratis = ambil jackpot pajak!</div>
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
            ${[2, 3, 4].map((n) => `
              <button class="snl-pick-btn ${this.playerCount === n ? 'active' : ''}" data-players="${n}">
                <span class="snl-pick-num">${n}</span><span>Pemain</span>
              </button>
            `).join('')}
          </div>
          <p class="snl-pick-preview">Mulai ${formatMoney(START_MONEY)} · target ${formatMoney(WIN_MONEY)}</p>
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
    const showRoll = canRoll || this.rolling || this.rollAgain;

    const cells = TILES.map((tile, i) => {
      const gp = this.gridPos[i];
      const owner = this.ownership[i];
      const ownerP = owner !== undefined ? this.players[owner] : null;
      const lv = this.upgrades[i] || 0;
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
          ${lv ? `<span class="gr-level">L${lv}</span>` : ''}
          ${ownerP ? `<span class="gr-owner" style="background:${ownerP.color}">${ownerP.emoji}</span>` : ''}
          <div class="gr-tokens">${tokens}</div>
        </div>
      `;
    }).join('');

    const playerBar = this.players.map((p, i) => `
      <div class="gr-player-chip ${i === this.currentPlayer ? 'active' : ''} ${p.bankrupt ? 'out' : ''}" style="--pc:${p.color}">
        <span>${p.emoji}</span>
        <span class="gr-chip-name">${p.name}</span>
        <span class="gr-chip-money">${formatMoney(p.money)}</span>
        ${p.inJail ? '<span class="gr-jail-tag">🔒</span>' : ''}
      </div>
    `).join('');

    let overlayHtml = '';
    if (this.overlay?.type === 'buy') {
      const { tile, player } = this.overlay;
      overlayHtml = `
        <div class="gr-overlay">
          <div class="gr-overlay-card buy">
            <div class="gr-overlay-emoji">${tile.emoji}</div>
            <h3>Beli Properti?</h3>
            <p><strong>${tile.name}</strong></p>
            <p>Harga: ${formatMoney(tile.price)} · Sewa: ${formatMoney(tile.rent)}</p>
            ${tile.group ? '<p class="gr-mono-hint">Kumpulkan warna sama = MONOPOLI!</p>' : ''}
            <p class="gr-balance">Saldo: ${formatMoney(player.money)}</p>
            <button class="btn btn-primary" data-action="buy" ${player.money < tile.price ? 'disabled' : ''}>Beli! 🏠</button>
            <button class="btn btn-secondary" data-action="skip">Lewati</button>
          </div>
        </div>
      `;
    } else if (this.overlay?.type === 'upgrade') {
      const { tile, player, level, cost } = this.overlay;
      overlayHtml = `
        <div class="gr-overlay">
          <div class="gr-overlay-card upgrade">
            <div class="gr-overlay-emoji">🏗️</div>
            <h3>Upgrade ${tile.name}?</h3>
            <p>Level ${level} → ${level + 1}</p>
            <p>Biaya: ${formatMoney(cost)}</p>
            <p class="gr-balance">Saldo: ${formatMoney(player.money)}</p>
            <button class="btn btn-primary" data-action="upgrade" ${player.money < cost ? 'disabled' : ''}>Upgrade! ⬆️</button>
            <button class="btn btn-secondary" data-action="skip-upgrade">Nanti</button>
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

    const winHtml = this.winner ? `
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
    ` : '';

    const toastHtml = this.toast
      ? `<div class="gr-toast gr-toast-${this.toastType || 'info'}">${this.toast}</div>`
      : '';

    this.container.innerHTML = `
      <div class="screen gr-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <div class="level-info">
            <span class="level-badge gr-badge">Kaya Raya</span>
            <span class="tier-label">🅿️ ${formatMoney(this.freeParkingPool)}</span>
          </div>
        </header>
        <div class="gr-players-bar">${playerBar}</div>
        <div class="gr-message">${this.message}</div>
        ${toastHtml}
        <div class="gr-board-scroll">
          <div class="gr-board">
            <div class="gr-center">
              <span class="gr-center-logo">💰</span>
              <span class="gr-center-title">KAYA RAYA</span>
              <span class="gr-center-pool">🅿️ ${formatMoney(this.freeParkingPool)}</span>
            </div>
            ${cells}
          </div>
        </div>
        <div class="gr-dice-bar">
          <div class="gr-dice-zone ${showRoll ? 'active' : ''}" style="--pc:${cur?.color}">
            <div class="gr-dice-player">${cur?.emoji} ${cur?.name}${this.rollAgain ? ' 🎲 lagi!' : ''}</div>
            ${showRoll ? `
              <button class="gr-roll-btn" data-action="roll" ${canRoll && !this.rolling ? '' : 'disabled'}>
                <div class="snl-dice-pair">
                  <span class="snl-dice-face snl-dice-face-1">${DICE_EMOJI[this.dice1]}</span>
                  <span class="snl-dice-face snl-dice-face-2">${DICE_EMOJI[this.dice2]}</span>
                  <span class="snl-dice-sum">= ${this.dice}</span>
                </div>
                <span>${this.rolling ? 'Mengocok...' : this.rollAgain ? 'Lempar Lagi!' : 'Lempar Dadu!'}</span>
              </button>
            ` : `<div class="gr-wait">⏳ Tunggu giliran...</div>`}
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
        if (a === 'setup') { this.screen = 'setup'; this.winner = null; this.overlay = null; this.rollAgain = false; this.render(); }
        else if (a === 'menu') { this.screen = 'menu'; this.winner = null; this.overlay = null; this.rollAgain = false; this.render(); }
        else if (a === 'exit') this.onExit?.();
        else if (a === 'start') this.setupGame(this.playerCount);
        else if (a === 'roll') this.rollDice();
        else if (a === 'buy') this.buyProperty();
        else if (a === 'skip') this.skipBuy();
        else if (a === 'upgrade') this.doUpgrade();
        else if (a === 'skip-upgrade') this.skipUpgrade();
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
