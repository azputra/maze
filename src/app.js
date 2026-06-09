export class App {
  constructor(container) {
    this.container = container;
    this.currentGame = null;
    this.showHub();
  }

  showHub() {
    if (this.currentGame?.destroy) this.currentGame.destroy();
    this.currentGame = null;

    this.container.innerHTML = `
      <div class="screen hub-screen">
        <div class="menu-bg"></div>
        <div class="hub-content">
          <div class="hub-logo">🎮</div>
          <h1>Game Anak</h1>
          <p class="subtitle">Pilih permainan favoritmu!</p>
          <div class="game-cards">
            <button class="game-card game-card-maze" data-game="maze">
              <span class="game-card-icon">🌀</span>
              <span class="game-card-title">Maze Quest</span>
              <span class="game-card-desc">50 level labirin</span>
            </button>
            <button class="game-card game-card-spot" data-game="spot">
              <span class="game-card-icon">🔍</span>
              <span class="game-card-title">Cari Beda</span>
              <span class="game-card-desc">Temukan perbedaan gambar</span>
            </button>
            <button class="game-card game-card-flip" data-game="flip">
              <span class="game-card-icon">🃏</span>
              <span class="game-card-title">Flip Match</span>
              <span class="game-card-desc">Cocokkan gambar berpasangan</span>
            </button>
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
    }
  }
}
