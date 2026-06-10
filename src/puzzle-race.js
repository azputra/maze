import { gameBanner } from './ui-helpers.js';

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

  renderBoard(player, board) {
    const tiles = PUZZLES[this.puzzleIdx].tiles;
    const empty = board.indexOf(8);
    const movable = new Set(this.getNeighbors(empty));

    return board
      .map((idx, i) => {
        const isEmpty = idx === 8;
        const canMove = !isEmpty && movable.has(i);
        return `
          <button class="puzzle-tile ${isEmpty ? 'empty' : ''} ${canMove ? 'can-move' : ''}"
            data-player="${player}" data-idx="${i}" ${isEmpty ? 'disabled' : ''}>
            ${isEmpty ? '' : tiles[idx]}
            ${canMove ? '<span class="tile-hint">↔</span>' : ''}
          </button>
        `;
      })
      .join('');
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
        <div class="menu-content menu-wide">
          <div class="logo">🧩</div>
          <h1>Puzzle Balapan</h1>
          <p class="subtitle">2 pemain · siapa selesai dulu menang!</p>
          <p class="pick-label">Pilih gambar:</p>
          <div class="puzzle-pick">
            ${PUZZLES.map(
              (p, i) => `
              <button class="puzzle-pick-btn ${this.puzzleIdx === i ? 'active' : ''}" data-puzzle="${i}">
                <span class="pick-emojis">${p.tiles.slice(0, 4).join('')}</span>
                <span class="pick-name">${p.name}</span>
              </button>
            `
            ).join('')}
          </div>
          <div class="rules-box">
            <div class="rule-item">👆 Ketuk ubin <strong>hijau</strong> (ada tanda ↔)</div>
            <div class="rule-item">🔴 P1 atas/kiri · 🔵 P2 bawah/kanan</div>
          </div>
          <button class="btn btn-primary" data-action="start">Mulai Balapan!</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali</button>
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

  renderPlay() {
    const p = PUZZLES[this.puzzleIdx];
    this.container.innerHTML = `
      <div class="screen puzzle-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="menu">←</button>
          <div class="level-info">
            <span class="level-badge puzzle-badge">Puzzle ${p.name}</span>
            <span class="tier-label">Susun gambar utuh!</span>
          </div>
        </header>
        ${gameBanner('🏁', 'Siapa duluan susun puzzle = MENANG!', 'banner-puzzle')}
        <div class="puzzle-split">
          <div class="puzzle-side puzzle-p1">
            <div class="puzzle-side-head">
              <span class="puzzle-player-tag p1-tag">🔴 P1 · Merah</span>
              <span class="puzzle-moves">${this.moves[0]} gerak</span>
            </div>
            <div class="puzzle-grid">${this.renderBoard(0, this.boards[0])}</div>
          </div>
          <div class="puzzle-divider"><span>VS</span></div>
          <div class="puzzle-side puzzle-p2">
            <div class="puzzle-side-head">
              <span class="puzzle-player-tag p2-tag">🔵 P2 · Biru</span>
              <span class="puzzle-moves">${this.moves[1]} gerak</span>
            </div>
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
          <p class="win-level">${this.moves[this.winner]} gerakan · ${elapsed} detik</p>
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
        else if (el.dataset.action === 'menu') {
          this.screen = 'menu';
          this.render();
        } else if (el.dataset.action === 'exit') this.onExit?.();
      });
    });
  }

  destroy() {}
}
