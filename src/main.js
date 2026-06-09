import './style.css';
import { App } from './app.js';

const app = new App(document.getElementById('app'));

window.addEventListener('resize', () => {
  if (app.currentGame?.render) app.currentGame.render();
});
