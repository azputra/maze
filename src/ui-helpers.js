/** Shared UI snippets for clearer mobile/tablet layouts */

export function mpBadge(count) {
  return `<span class="mp-badge">${count}P</span>`;
}

export function gameBanner(icon, text, variant = '') {
  return `<div class="game-banner ${variant}"><span class="game-banner-icon">${icon}</span><span class="game-banner-text">${text}</span></div>`;
}

export function scoreBar(players) {
  return `
    <div class="score-bar">
      ${players
        .map(
          (p) => `
        <div class="score-item" style="--pc:${p.color}">
          <span class="score-emoji">${p.emoji}</span>
          <span class="score-name">${p.name}</span>
          <span class="score-val">${p.value ?? p.score ?? 0}${p.unit || ''}</span>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

export function mpControls(p1Label = 'P1', p2Label = 'P2', center = '') {
  return `
    <div class="mp-controls">
      <div class="mp-zone mp-p1">
        <div class="mp-zone-head">
          <span class="mp-zone-dot"></span>
          <span class="mp-zone-label">${p1Label}</span>
        </div>
        <div class="mp-btns">
          <button class="mp-btn" data-steer="1-l" aria-label="P1 kiri">◀</button>
          <button class="mp-btn" data-steer="1-r" aria-label="P1 kanan">▶</button>
        </div>
      </div>
      <div class="mp-center">${center}</div>
      <div class="mp-zone mp-p2">
        <div class="mp-zone-head">
          <span class="mp-zone-dot"></span>
          <span class="mp-zone-label">${p2Label}</span>
        </div>
        <div class="mp-btns">
          <button class="mp-btn" data-steer="2-l" aria-label="P2 kiri">◀</button>
          <button class="mp-btn" data-steer="2-r" aria-label="P2 kanan">▶</button>
        </div>
      </div>
    </div>
  `;
}

export function bindSteer(container, keys, keyMap) {
  container.querySelectorAll('[data-steer]').forEach((btn) => {
    const [player, dir] = btn.dataset.steer.split('-');
    const key = keyMap(player, dir);
    const on = (e) => {
      e.preventDefault();
      keys[key] = true;
      btn.classList.add('pressed');
    };
    const off = (e) => {
      e.preventDefault();
      keys[key] = false;
      btn.classList.remove('pressed');
    };
    btn.addEventListener('touchstart', on, { passive: false });
    btn.addEventListener('touchend', off, { passive: false });
    btn.addEventListener('touchcancel', off, { passive: false });
    btn.addEventListener('mousedown', on);
    btn.addEventListener('mouseup', off);
    btn.addEventListener('mouseleave', off);
  });
}

export function setupCanvas(wrap, canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = wrap.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height, dpr };
}
