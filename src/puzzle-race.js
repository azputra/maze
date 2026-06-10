const PUZZLES = [
  { name: 'Hewan', tiles: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'] },
  { name: 'Buah', tiles: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🥝', '🍌'] },
  { name: 'Kendaraan', tiles: ['🚗', '🚕', '🚌', '🏎️', '🚓', '🚑', '🚒', '🛵'] },
];

export class PuzzleRaceGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.puzzleIdx = 0;
    this.boards = [[], []];
    this.moves = [0, 0];
    this.winner = null;
    this.startTime = null;
    this.render();
  }

  createSolved() {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8];
  }

  shuffleBoard() {
    const board = this.createSolved();
    let empty = 8;
    for (let i = 0; i < 50; i++) {
      const neighbors = this.getNeighbors(empty);
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      [board[empty], board[next]] = [board[next], board[empty]];
      empty = next;
    }
    return board;
  }

  getNeighbors(empty) {
    const r = Math.floor(empty / 3);
    const c = empty % 3;
    const n = [];
    if (r > 0) n.push(empty - 3);
    if (r < 2) n.push(empty + 3);
    if (c > 0) n.push(empty - 1);
    if (c < 2) n.push(empty + 1);
    return n;
  }

  isSolved(board) {
    return board.every((v, i) => v === i);
  }

  startGame() {
    const board = this.shuffleBoard();
    this.boards = [board.slice(), board.slice()];
    this.moves = [0, 0];
    this.winner = null;
    this.startTime = Date.now();
    this.screen = 'play';
    this.render();
  }

  tryMove(player, index) {
    if (this.winner) return;
    const board = this.boards[player];
    const empty = board.indexOf(8);
    if (!this.getNeighbors(empty).includes(index)) return;
    [board[empty], board[index]] = [board[index], board[empty]];
    this.moves[player]++;
    if (this.isSolved(board)) {
      this.winner = player;
      this.screen = 'win';
    }
    this.render();
  }

  render() {
    if (this.screen === 'menu') this.renderMenu();
    else if (this.screen === 'play') this.renderPlay();
    else if (this.screen === 'win') this.renderWin();
  }

  renderMenu() {
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content">
          <div class="logo">🧩</div>
          <h1>Puzzle Balapan</h1>
          <p class="subtitle">2 pemain · siapa selesai dulu!</p>
          <div class="puzzle-pick">
            ${PUZZLES.map((p, i) => `
              <button class="puzzle-pick-btn ${this.puzzleIdx === i ? 'active' : ''}" data-puzzle="${i}">
                ${p.tiles.slice(0, 4).join('')}<br><small>${p.name}</small>
              </button>
            `).join('')}
          </div>
          <button class="btn btn-primary" data-action="start">Mulai Balapan!</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali</button>
          <div class="how-to">
            <p>Ketuk ubin di samping kotak kosong</p>
            <p>P1 kiri · P2 kanan — puzzle sama!</p>
          </div>
        </div>
      </div>
    `;
    this.bindActions();
    this.container.querySelectorAll('[data-puzzle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.puzzleIdx = Number(btn.dataset.puzzle);
        this.renderMenu();
      });
    });
  }

  renderBoard(player, board) {
    const tiles = PUZZLES[this.puzzleIdx].tiles;
    return board
      .map((idx, i) => {
        const isEmpty = idx === 8;
        return `
          <button class="puzzle-tile ${isEmpty ? 'empty' : ''}" data-player="${player}" data-idx="${i}"
            ${isEmpty ? 'disabled' : ''}>
            ${isEmpty ? '' : tiles[idx]}
          </button>
        `;
      })
      .join('');
  }

  renderPlay() {
    const p = PUZZLES[this.puzzleIdx];
    this.container.innerHTML = `
      <div class="screen puzzle-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <div class="level-info">
            <span class="level-badge puzzle-badge">Puzzle ${p.name}</span>
            <span class="tier-label">Siapa duluan?</span>
          </div>
        </header>
        <div class="puzzle-split">
          <div class="puzzle-side puzzle-p1">
            <div class="puzzle-side-label" style="color:#ef4444">🔴 P1 · ${this.moves[0]} gerak</div>
            <div class="puzzle-grid">${this.renderBoard(0, this.boards[0])}</div>
          </div>
          <div class="puzzle-side puzzle-p2">
            <div class="puzzle-side-label" style="color:#3b82f6">🔵 P2 · ${this.moves[1]} gerak</div>
            <div class="puzzle-grid">${this.renderBoard(1, this.boards[1])}</div>
          </div>
        </div>
      </div>
    `;
    this.container.querySelectorAll('.puzzle-tile:not(.empty)').forEach((btn) => {
      btn.addEventListener('click', () => this.tryMove(Number(btn.dataset.player), Number(btn.dataset.idx)));
    });
    this.bindActions();
  }

  renderWin() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const name = this.winner === 0 ? '🔴 Merah' : '🔵 Biru';
    this.container.innerHTML = `
      <div class="screen win-screen">
        <div class="win-content">
          <div class="win-icon">🏆</div>
          <h2>${name} Menang!</h2>
          <p class="win-level">${this.moves[this.winner]} gerakan · ${elapsed}s</p>
          <button class="btn btn-primary" data-action="start">Balapan Lagi</button>
          <button class="btn btn-ghost" data-action="menu">Menu</button>
        </div>
      </div>
    `;
    this.bindActions();
  }

  bindActions() {
    this.container.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', () => {
        if (el.dataset.action === 'start') this.startGame();
        else if (el.dataset.action === 'menu') { this.screen = 'menu'; this.render(); }
        else if (el.dataset.action === 'exit') this.onExit?.();
      });
    });
  }

  destroy() {}
}
