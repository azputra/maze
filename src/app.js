export class App {
  constructor(container) {
    this.container = container;
    this.currentGame = null;
    this.showHub();
  }

  showHub() {
    if (this.currentGame?.destroy) this.currentGame.destroy();
    this.currentGame = null;

    const games = [
      { id: 'maze', icon: '🌀', title: 'Maze Quest', desc: '50 level labirin', cls: 'maze' },
      { id: 'spot', icon: '🔍', title: 'Cari Beda', desc: 'Temukan perbedaan', cls: 'spot' },
      { id: 'flip', icon: '🃏', title: 'Flip Match', desc: 'Cocokkan gambar', cls: 'flip' },
      { id: 'chess', icon: '♟️', title: 'Catur Anak', desc: 'Usia 4–10 tahun', cls: 'chess' },
      { id: 'ball', icon: '⚽', title: 'Tebak Bola', desc: '50 level', cls: 'ball' },
      { id: 'balloon', icon: '🎈', title: 'Pop Balon', desc: 'Pop warna target', cls: 'balloon' },
      { id: 'count', icon: '🔢', title: 'Hitung Benda', desc: 'Hitung emoji', cls: 'count' },
      { id: 'star', icon: '⭐', title: 'Tangkap Bintang', desc: 'Tangkap bintang', cls: 'star' },
      { id: 'whack', icon: '🐹', title: 'Asah Reflek', desc: 'Ketuk hewan cepat', cls: 'whack' },
      { id: 'order', icon: '📊', title: 'Urut Angka', desc: '1, 2, 3...', cls: 'order' },
      { id: 'snl', icon: '🐍', title: 'Ular Tangga', desc: 'Kotak 1–100', cls: 'snl', mp: '2-4' },
      { id: 'race', icon: '🏎️', title: 'Balapan Mobil', desc: 'Balapan 800m', cls: 'race', mp: '2' },
      { id: 'catch', icon: '🧺', title: 'Tangkap Benda', desc: 'Adu skor 60 detik', cls: 'catch', mp: '2' },
      { id: 'puzzle', icon: '🧩', title: 'Puzzle Balapan', desc: 'Siapa selesai dulu', cls: 'puzzle', mp: '2' },
      { id: 'simon', icon: '🎵', title: 'Simon Says', desc: 'Ikut pola warna', cls: 'simon', mp: '2-4' },
    ];

    this.container.innerHTML = `
      <div class="screen hub-screen">
        <div class="menu-bg"></div>
        <div class="hub-content">
          <div class="hub-logo">🎮</div>
          <h1>Game Anak</h1>
          <p class="subtitle">Ketuk game untuk main · ${games.length} permainan</p>
          <div class="game-cards">
            ${games
              .map(
                (g) => `
              <button class="game-card game-card-${g.cls}" data-game="${g.id}">
                <div class="game-card-row">
                  <span class="game-card-icon">${g.icon}</span>
                  <div class="game-card-text">
                    <span class="game-card-title">${g.title}</span>
                    <span class="game-card-desc">${g.desc}</span>
                  </div>
                  ${g.mp ? `<span class="mp-badge">${g.mp}P</span>` : ''}
                </div>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;

    this.container.querySelectorAll('[data-game]').forEach((btn) => {
      btn.addEventListener('click', () => this.launchGame(btn.dataset.game));
    });
  }

  async launchGame(name) {
    this.container.innerHTML = '<div class="screen loading-screen"><div class="loading-spinner">🎮</div></div>';

    if (name === 'maze') {
      const { MazeGame } = await import('./maze-game.js');
      this.currentGame = new MazeGame(this.container, () => this.showHub());
    } else if (name === 'spot') {
      const { SpotDifferenceGame } = await import('./spot-difference.js');
      this.currentGame = new SpotDifferenceGame(this.container, () => this.showHub());
    } else if (name === 'flip') {
      const { FlipMatchGame } = await import('./flip-match.js');
      this.currentGame = new FlipMatchGame(this.container, () => this.showHub());
    } else if (name === 'chess') {
      const { KidsChessGame } = await import('./kids-chess.js');
      this.currentGame = new KidsChessGame(this.container, () => this.showHub());
    } else if (name === 'ball') {
      const { BallGuessGame } = await import('./ball-guess.js');
      this.currentGame = new BallGuessGame(this.container, () => this.showHub());
    } else if (name === 'balloon') {
      const { BalloonPopGame } = await import('./balloon-pop.js');
      this.currentGame = new BalloonPopGame(this.container, () => this.showHub());
    } else if (name === 'count') {
      const { CountGame } = await import('./count-game.js');
      this.currentGame = new CountGame(this.container, () => this.showHub());
    } else if (name === 'star') {
      const { StarCatchGame } = await import('./star-catch.js');
      this.currentGame = new StarCatchGame(this.container, () => this.showHub());
    } else if (name === 'whack') {
      const { WhackGame } = await import('./whack-game.js');
      this.currentGame = new WhackGame(this.container, () => this.showHub());
    } else if (name === 'order') {
      const { NumberOrderGame } = await import('./number-order.js');
      this.currentGame = new NumberOrderGame(this.container, () => this.showHub());
    } else if (name === 'snl') {
      const { SnakesLaddersGame } = await import('./snakes-ladders.js');
      this.currentGame = new SnakesLaddersGame(this.container, () => this.showHub());
    } else if (name === 'race') {
      const { CarRaceGame } = await import('./car-race.js');
      this.currentGame = new CarRaceGame(this.container, () => this.showHub());
    } else if (name === 'catch') {
      const { CatchGame } = await import('./catch-game.js');
      this.currentGame = new CatchGame(this.container, () => this.showHub());
    } else if (name === 'puzzle') {
      const { PuzzleRaceGame } = await import('./puzzle-race.js');
      this.currentGame = new PuzzleRaceGame(this.container, () => this.showHub());
    } else if (name === 'simon') {
      const { SimonSaysGame } = await import('./simon-says.js');
      this.currentGame = new SimonSaysGame(this.container, () => this.showHub());
    }
  }
}
