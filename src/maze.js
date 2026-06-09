/**
 * Recursive backtracker maze generator.
 * Grid cells: 0 = wall, 1 = path
 */
export function generateMaze(cols, rows, seed = 1) {
  const rng = mulberry32(seed);
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  function carve(x, y) {
    grid[y][x] = 1;
    const dirs = shuffle(
      [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ],
      rng
    );

    for (const [dx, dy] of dirs) {
      const nx = x + dx * 2;
      const ny = y + dy * 2;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && grid[ny][nx] === 0) {
        grid[y + dy][x + dx] = 1;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);
  grid[1][1] = 1;
  grid[rows - 2][cols - 2] = 1;
  return grid;
}

export function getLevelConfig(level) {
  const clamped = Math.max(1, Math.min(50, level));
  const tier = Math.ceil(clamped / 10);
  const baseSize = 7 + tier * 2 + Math.floor((clamped % 10) / 3);
  const cols = baseSize * 2 + 1;
  const rows = baseSize * 2 + 1;
  const seed = clamped * 7919 + 42;
  return { level: clamped, cols, rows, seed, tier };
}

export function buildLevel(level) {
  const config = getLevelConfig(level);
  const grid = generateMaze(config.cols, config.rows, config.seed);
  return {
    ...config,
    grid,
    start: { x: 1, y: 1 },
    end: { x: config.cols - 2, y: config.rows - 2 },
  };
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const TOTAL_LEVELS = 50;

export function getTierName(tier) {
  const names = ['Pemula', 'Pelajar', 'Penjelajah', 'Ahli', 'Legenda'];
  return names[tier - 1] || 'Legenda';
}

export function getTierColor(tier) {
  const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444'];
  return colors[tier - 1] || '#ef4444';
}
