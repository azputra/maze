export const TOTAL_BALL_LEVELS = 50;

export function getBallLevelConfig(level) {
  const lv = Math.max(1, Math.min(TOTAL_BALL_LEVELS, level));
  const tier = Math.ceil(lv / 10);
  const cups = 3 + Math.floor((lv - 1) / 8);
  const swaps = 3 + lv + tier * 2;
  const speed = Math.max(280, 650 - lv * 6 - tier * 20);
  const peekMs = Math.max(800, 2200 - lv * 20);
  const themes = ['⚽', '🏀', '🎾', '🏐', '⚾', '🥎', '🎱', '🏉', '🥏', '🎳'];
  return {
    level: lv,
    tier,
    cups: Math.min(cups, 8),
    swaps,
    speed,
    peekMs,
    ball: themes[(lv - 1) % themes.length],
    tierName: ['Pemula', 'Pelajar', 'Penjelajah', 'Ahli', 'Legenda'][tier - 1],
  };
}

export function getTierColor(tier) {
  return ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444'][tier - 1] || '#ef4444';
}
