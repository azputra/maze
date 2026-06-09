import './style.css';
import { Game } from './game.js';

const app = document.getElementById('app');
const game = new Game(app);

window.addEventListener('resize', () => {
  if (game.screen === 'play') game.render();
});
