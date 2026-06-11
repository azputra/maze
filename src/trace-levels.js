/** Normalized path points 0–1 for tracing levels */
export const TRACE_LEVELS = [
  {
    level: 1,
    name: 'Garis Lurus',
    emoji: '➖',
    points: [
      [0.12, 0.5],
      [0.88, 0.5],
    ],
  },
  {
    level: 2,
    name: 'Zigzag',
    emoji: '⚡',
    points: [
      [0.1, 0.25],
      [0.35, 0.75],
      [0.55, 0.25],
      [0.75, 0.75],
      [0.9, 0.25],
    ],
  },
  {
    level: 3,
    name: 'Lengkung',
    emoji: '🌙',
    points: Array.from({ length: 20 }, (_, i) => {
      const t = i / 19;
      return [0.1 + t * 0.8, 0.5 + Math.sin(t * Math.PI) * 0.3];
    }),
  },
  {
    level: 4,
    name: 'Angka 1',
    emoji: '1️⃣',
    points: [
      [0.5, 0.15],
      [0.5, 0.85],
    ],
  },
  {
    level: 5,
    name: 'Angka 2',
    emoji: '2️⃣',
    points: [
      [0.2, 0.25],
      [0.8, 0.25],
      [0.8, 0.5],
      [0.2, 0.5],
      [0.2, 0.85],
      [0.8, 0.85],
    ],
  },
  {
    level: 6,
    name: 'Hati',
    emoji: '❤️',
    points: Array.from({ length: 24 }, (_, i) => {
      const t = (i / 23) * Math.PI * 2;
      const x = 16 * Math.sin(t) ** 3;
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      return [0.5 + x / 40, 0.45 - y / 40];
    }),
  },
  {
    level: 7,
    name: 'Bintang',
    emoji: '⭐',
    points: (() => {
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const r = i % 2 === 0 ? 0.35 : 0.15;
        const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
        pts.push([0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]);
      }
      pts.push(pts[0]);
      return pts;
    })(),
  },
  {
    level: 8,
    name: 'Spiral',
    emoji: '🌀',
    points: Array.from({ length: 30 }, (_, i) => {
      const t = i / 29;
      const a = t * Math.PI * 4;
      const r = 0.08 + t * 0.32;
      return [0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r];
    }),
  },
  {
    level: 9,
    name: 'Huruf A',
    emoji: '🅰️',
    points: [
      [0.5, 0.15],
      [0.2, 0.85],
      [0.35, 0.55],
      [0.65, 0.55],
      [0.8, 0.85],
      [0.5, 0.15],
    ],
  },
  {
    level: 10,
    name: 'Huruf S',
    emoji: '💫',
    points: [
      [0.75, 0.2],
      [0.3, 0.2],
      [0.25, 0.4],
      [0.7, 0.5],
      [0.75, 0.7],
      [0.3, 0.8],
    ],
  },
];

export const TOTAL_TRACE_LEVELS = TRACE_LEVELS.length;
