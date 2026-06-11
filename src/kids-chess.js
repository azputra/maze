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
    this.gameOver = null;
    this.inCheck = null;
    this.render();
  }

  resetBoard() {
    this.board = cloneBoard(START_FEN_ROWS);
    this.selected = null;
    this.turn = 'w';
    this.message = '';
    this.gameOver = null;
    this.inCheck = null;
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

  findKing(color, board = this.board) {
    const king = color === 'w' ? 'wK' : 'bK';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === king) return [r, c];
      }
    }
    return null;
  }

  getRawMoves(row, col, piece, board = this.board) {
    const moves = [];
    const type = piece.slice(1);
    const color = this.pieceColor(piece);

    const addTarget = (r, c, slide = false) => {
      if (r < 0 || r > 7 || c < 0 || c > 7) return slide ? 'stop' : null;
      const target = board[r][c];
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
      if (this.isEmptyOn(row + forward, col, board)) {
        moves.push([row + forward, col]);
        if (row === startRow && this.isEmptyOn(row + forward * 2, col, board)) {
          moves.push([row + forward * 2, col]);
        }
      }
      for (const dc of [-1, 1]) {
        const r = row + forward;
        const c = col + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const target = board[r][c];
          if (target && this.pieceColor(target) !== color) moves.push([r, c]);
        }
      }
      return moves;
    }

    if (type === 'N') {
      for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
        addTarget(row + dr, col + dc);
      }
      return moves;
    }

    if (type === 'K') {
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        addTarget(row + dr, col + dc);
      }
      return moves;
    }

    const lineDirs =
      type === 'Q'
        ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]
        : type === 'R'
          ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
          : [[-1, -1], [-1, 1], [1, -1], [1, 1]];

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

  isEmptyOn(row, col, board) {
    return row >= 0 && row < 8 && col >= 0 && col < 8 && !board[row][col];
  }

  applyMove(board, fromR, fromC, toR, toC) {
    const next = board.map((row) => [...row]);
    next[toR][toC] = next[fromR][fromC];
    next[fromR][fromC] = null;
    return next;
  }

  isSquareAttacked(row, col, byColor, board = this.board) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || this.pieceColor(piece) !== byColor) continue;
        const moves = this.getRawMoves(r, c, piece, board);
        if (moves.some(([mr, mc]) => mr === row && mc === col)) return true;
      }
    }
    return false;
  }

  isInCheck(color, board = this.board) {
    const king = this.findKing(color, board);
    if (!king) return true;
    const opp = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(king[0], king[1], opp, board);
  }

  getLegalMoves(row, col, board = this.board) {
    const piece = board[row][col];
    if (!piece) return [];
    const color = this.pieceColor(piece);
    return this.getRawMoves(row, col, piece, board).filter(([toR, toC]) => {
      const next = this.applyMove(board, row, col, toR, toC);
      return !this.isInCheck(color, next);
    });
  }

  hasAnyLegalMove(color, board = this.board) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && this.pieceColor(piece) === color) {
          if (this.getLegalMoves(r, c, board).length > 0) return true;
        }
      }
    }
    return false;
  }

  onSquareClick(row, col) {
    if (this.gameOver) return;

    const piece = this.board[row][col];
    if (this.selected) {
      const [sr, sc] = this.selected;
      const moves = this.getLegalMoves(sr, sc);
      const isMove = moves.some(([r, c]) => r === row && c === col);
      if (isMove) {
        const moving = this.board[sr][sc];
        const captured = this.board[row][col];
        this.board[row][col] = moving;
        this.board[sr][sc] = null;
        this.selected = null;
        const nextTurn = this.turn === 'w' ? 'b' : 'w';

        if (captured === 'wK' || captured === 'bK') {
          this.gameOver = { winner: this.turn, reason: 'king' };
          this.message = `👑 SKAK MAT! ${PIECES[moving].name} menang!`;
          this.render();
          return;
        }

        let msg = captured
          ? `${PIECES[moving].name} makan ${PIECES[captured].name}!`
          : `${PIECES[moving].name} pindah ✓`;

        if (captured === 'wQ' || captured === 'bQ') {
          msg = `💥 RATU DIMANGSA! ${PIECES[moving].emoji} makan ${PIECES[captured].emoji} ${PIECES[captured].name}!`;
        }

        this.turn = nextTurn;

        if (!this.findKing(this.turn)) {
          this.gameOver = { winner: this.turn === 'w' ? 'b' : 'w', reason: 'king' };
          this.message = '🏆 Raja lawan tertangkap — MENANG!';
          this.render();
          return;
        }

        const opponentInCheck = this.isInCheck(this.turn);
        this.inCheck = opponentInCheck ? this.turn : null;

        if (opponentInCheck && !this.hasAnyLegalMove(this.turn)) {
          this.gameOver = { winner: this.turn === 'w' ? 'b' : 'w', reason: 'checkmate' };
          this.message = `♟️ SKAK MAT! ${this.turn === 'w' ? '⚪ Putih' : '⚫ Hitam'} menang!`;
        } else if (opponentInCheck) {
          this.message = `⚠️ SKAK! ${msg}`;
        } else if (!this.hasAnyLegalMove(this.turn)) {
          this.gameOver = { winner: 'draw', reason: 'stalemate' };
          this.message = '🤝 Seri — tidak ada gerakan legal!';
        } else {
          this.message = msg;
        }

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
      this.message = this.inCheck === this.turn ? '⚠️ Kamu dalam SKAK — lindungi Raja!' : '';
      this.render();
      return;
    }

    if (piece && this.pieceColor(piece) === this.turn) {
      const legal = this.getLegalMoves(row, col);
      if (legal.length === 0) {
        this.message = `${PIECES[piece].name} tidak bisa bergerak (SKAK?)`;
        this.render();
        return;
      }
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
        <div class="menu-content menu-wide">
          <div class="logo">♟️</div>
          <h1>Catur Anak</h1>
          <p class="subtitle">Usia 4–10 tahun · aturan skak!</p>
          <div class="rules-box">
            <div class="rule-item"><span>👆</span> Ketuk bidak, lalu kotak tujuan</div>
            <div class="rule-item"><span>⚠️</span> <strong>Skak</strong> = Raja terancam — harus dilindungi!</div>
            <div class="rule-item"><span>♟️</span> <strong>Skak mat</strong> = Raja tertangkap, game selesai</div>
            <div class="rule-item"><span>👸</span> Ratu dimakan = peringatan khusus!</div>
          </div>
          <button class="btn btn-primary" data-action="play">Mulai Bermain</button>
          <button class="btn btn-ghost" data-action="exit">← Kembali ke Menu</button>
        </div>
      </div>
    `;
    this.bindMenu();
  }

  renderPlay() {
    let highlightMoves = [];
    if (this.selected && !this.gameOver) {
      highlightMoves = this.getLegalMoves(this.selected[0], this.selected[1]);
    }

    const kingPos = this.inCheck ? this.findKing(this.inCheck) : null;

    const rows = this.board
      .map((row, r) => {
        const cells = row
          .map((piece, c) => {
            const light = (r + c) % 2 === 0;
            const selected = this.selected && this.selected[0] === r && this.selected[1] === c;
            const hint = highlightMoves.some(([hr, hc]) => hr === r && hc === c);
            const kingCheck = kingPos && kingPos[0] === r && kingPos[1] === c;
            const info = piece ? PIECES[piece] : null;
            return `
              <button
                class="chess-cell ${light ? 'light' : 'dark'} ${selected ? 'selected' : ''} ${hint ? 'hint' : ''} ${kingCheck ? 'in-check' : ''}"
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
    const checkBanner = this.inCheck && !this.gameOver
      ? `<div class="chess-check-banner">⚠️ SKAK! Lindungi Raja ${this.inCheck === 'w' ? 'Putih' : 'Hitam'}!</div>`
      : '';

    const overlay = this.gameOver
      ? `
      <div class="chess-overlay">
        <div class="chess-overlay-card">
          <div class="chess-overlay-icon">${this.gameOver.winner === 'draw' ? '🤝' : '🏆'}</div>
          <h3>${this.gameOver.winner === 'draw' ? 'Seri!' : 'Selamat!'}</h3>
          <p>${this.message}</p>
          <button class="btn btn-primary" data-action="reset">Main Lagi</button>
          <button class="btn btn-ghost" data-action="back">Menu</button>
        </div>
      </div>
    `
      : '';

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
        ${checkBanner}
        <div class="chess-message">${this.message || 'Ketuk bidak untuk mulai'}</div>
        <div class="chess-board-wrap">
          <div class="chess-board">${rows}</div>
        </div>
        <div class="chess-legend">
          <span>👑 Raja</span><span>👸 Ratu</span><span>⚠️ Skak</span><span>♟️ Skak mat</span>
        </div>
        ${overlay}
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
