import './style.css';
import { App } from './app.js';
import { registerSW } from 'virtual:pwa-register';

const app = new App(document.getElementById('app'));

registerSW({ immediate: true });

window.addEventListener('resize', () => {
  if (app.currentGame?.render) app.currentGame.render();
});
