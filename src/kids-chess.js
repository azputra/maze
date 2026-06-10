const PIECES = {
  wK: { emoji: '👑', name: 'Raja', color: 'w' },
  wQ: { emoji: '👸', name: 'Ratu', color: 'w' },
  wR: { emoji: '🏰', name: 'Benteng', color: 'w' },
  wB: { emoji: '⛪', name: 'Gajah', color: 'w' },
  wN: { emoji: '🐴', name: 'Kuda', color: 'w' },
  wP: { emoji: '🐣', name: 'Pion', color: 'w' },
  bK: { emoji: '🤴', name: 'Raja', color: 'b' },
  bQ: { emoji: '🦸', name: 'Ratu', color: 'b' },
  bR: { emoji: '🏯', name: 'Benteng', color: 'b' },
  bB: { emoji: '🗼', name: 'Gajah', color: 'b' },
  bN: { emoji: '🦄', name: 'Kuda', color: 'b' },
  bP: { emoji: '🐥', name: 'Pion', color: 'b' },
};

const START_FEN_ROWS = [
  ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
  ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
  ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
];

export class KidsChessGame {
  constructor(container, onExit) {
    this.container = container;
    this.onExit = onExit;
    this.screen = 'menu';
    this.board = cloneBoard(START_FEN_ROWS);
    this.selected = null;
    this.turn = 'w';
    this.message = '';
    this.render();
  }

  resetBoard() {
    this.board = cloneBoard(START_FEN_ROWS);
    this.selected = null;
    this.turn = 'w';
    this.message = '';
    this.render();
  }

  cellAt(row, col) {
    return this.board[row]?.[col] ?? null;
  }

  isEmpty(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8 && !this.board[row][col];
  }

  pieceColor(piece) {
    return piece ? PIECES[piece]?.color : null;
  }

  /** Gerakan sederhana untuk anak — tidak full rules catur */
  getKidMoves(row, col, piece) {
    const moves = [];
    const type = piece.slice(1);
    const color = this.pieceColor(piece);
    const dirs = {
      K: [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]],
      Q: [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]],
      R: [[-1, 0], [1, 0], [0, -1], [0, 1]],
      B: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
      N: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
      P: color === 'w' ? [[-1, 0], [-2, 0]] : [[1, 0], [2, 0]],
    };

    const addTarget = (r, c, slide = false, dir = null) => {
      if (r < 0 || r > 7 || c < 0 || c > 7) return slide ? 'stop' : null;
      const target = this.board[r][c];
      if (!target) {
        moves.push([r, c]);
        return slide ? 'continue' : null;
      }
      if (this.pieceColor(target) !== color) moves.push([r, c]);
      return 'stop';
    };

    if (type === 'P') {
      const forward = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      if (this.isEmpty(row + forward, col)) {
        moves.push([row + forward, col]);
        if (row === startRow && this.isEmpty(row + forward * 2, col)) {
          moves.push([row + forward * 2, col]);
        }
      }
      for (const dc of [-1, 1]) {
        const r = row + forward;
        const c = col + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const target = this.board[r][c];
          if (target && this.pieceColor(target) !== color) moves.push([r, c]);
        }
      }
      return moves;
    }

    if (type === 'N') {
      for (const [dr, dc] of dirs.N) addTarget(row + dr, col + dc);
      return moves;
    }

    if (type === 'K') {
      for (const [dr, dc] of dirs.K) addTarget(row + dr, col + dc);
      return moves;
    }

    const lineDirs = type === 'Q' ? dirs.Q : type === 'R' ? dirs.R : dirs.B;
    for (const [dr, dc] of lineDirs) {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const status = addTarget(r, c, true);
        if (status === 'stop') break;
        r += dr;
        c += dc;
      }
    }
    return moves;
  }

  onSquareClick(row, col) {
    const piece = this.board[row][col];
    if (this.selected) {
      const [sr, sc] = this.selected;
      const moves = this.getKidMoves(sr, sc, this.board[sr][sc]);
      const isMove = moves.some(([r, c]) => r === row && c === col);
      if (isMove) {
        const moving = this.board[sr][sc];
        const captured = this.board[row][col];
        this.board[row][col] = moving;
        this.board[sr][sc] = null;
        this.selected = null;
        this.turn = this.turn === 'w' ? 'b' : 'w';
        this.message = captured
          ? `${PIECES[moving].name} makan ${PIECES[captured].name}!`
          : `${PIECES[moving].name} pindah ✓`;
        this.render();
        return;
      }
      if (piece && this.pieceColor(piece) === this.turn) {
        this.selected = [row, col];
        this.message = `Pilih kotak untuk ${PIECES[piece].name}`;
        this.render();
        return;
      }
      this.selected = null;
      this.message = '';
      this.render();
      return;
    }

    if (piece && this.pieceColor(piece) === this.turn) {
      this.selected = [row, col];
      this.message = `Gerakkan ${PIECES[piece].emoji} ${PIECES[piece].name}`;
      this.render();
    }
  }

  render() {
    if (this.screen === 'menu') this.renderMenu();
    else this.renderPlay();
  }

  renderMenu() {
    this.container.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg"></div>
        <div class="menu-content">
          <div class="logo">♟️</div>
          <h1>Catur Anak</h1>
          <p class="subtitle">Usia 4–10 tahun · gerakkan bidaknya!</p>
          <button class="btn btn-primary" data-action="play">Mulai Bermain</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali ke Menu</button>
          <div class="how-to">
            <p>👆 Ketuk bidak, lalu ketuk kotak tujuan</p>
            <p>🐣 Pion maju · 🐴 kuda loncat · 👑 raja 1 langkah</p>
            <p>🎨 Putih dulu, lalu hitam — giliran bergantian</p>
          </div>
        </div>
      </div>
    `;
    this.bindMenu();
  }

  renderPlay() {
    let highlightMoves = [];
    if (this.selected) {
      highlightMoves = this.getKidMoves(
        this.selected[0],
        this.selected[1],
        this.board[this.selected[0]][this.selected[1]]
      );
    }

    const rows = this.board
      .map((row, r) => {
        const cells = row
          .map((piece, c) => {
            const light = (r + c) % 2 === 0;
            const selected =
              this.selected && this.selected[0] === r && this.selected[1] === c;
            const hint = highlightMoves.some(([hr, hc]) => hr === r && hc === c);
            const info = piece ? PIECES[piece] : null;
            return `
              <button
                class="chess-cell ${light ? 'light' : 'dark'} ${selected ? 'selected' : ''} ${hint ? 'hint' : ''}"
                data-row="${r}" data-col="${c}"
                aria-label="${info ? info.name : 'kosong'}"
              >
                ${info ? `<span class="chess-piece">${info.emoji}</span>` : ''}
                ${hint && !piece ? '<span class="chess-dot"></span>' : ''}
              </button>
            `;
          })
          .join('');
        return `<div class="chess-row">${cells}</div>`;
      })
      .join('');

    const turnLabel = this.turn === 'w' ? '⚪ Putih' : '⚫ Hitam';

    this.container.innerHTML = `
      <div class="screen chess-play-screen">
        <header class="top-bar">
          <button class="btn-icon" data-action="back">←</button>
          <div class="level-info">
            <span class="level-badge chess-badge">Catur Anak</span>
            <span class="tier-label">Giliran: ${turnLabel}</span>
          </div>
          <button class="btn-icon chess-reset" data-action="reset" title="Reset">↺</button>
        </header>
        <div class="chess-message">${this.message || 'Ketuk bidak untuk mulai'}</div>
        <div class="chess-board-wrap">
          <div class="chess-board">${rows}</div>
        </div>
        <div class="chess-legend">
          <span>👑 Raja</span><span>🐴 Kuda</span><span>🐣 Pion</span><span>🏰 Benteng</span>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.chess-cell').forEach((btn) => {
      btn.addEventListener('click', () =>
        this.onSquareClick(Number(btn.dataset.row), Number(btn.dataset.col))
      );
    });
    this.container.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', () => {
        if (el.dataset.action === 'back') {
          this.screen = 'menu';
          this.resetBoard();
        } else if (el.dataset.action === 'reset') this.resetBoard();
        else if (el.dataset.action === 'play') {
          this.screen = 'play';
          this.resetBoard();
        } else if (el.dataset.action === 'exit') this.onExit?.();
      });
    });
  }

  bindMenu() {
    this.container.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', () => {
        if (el.dataset.action === 'play') {
          this.screen = 'play';
          this.resetBoard();
        } else if (el.dataset.action === 'exit') this.onExit?.();
      });
    });
  }

  destroy() {}
}

function cloneBoard(rows) {
  return rows.map((r) => [...r]);
}
