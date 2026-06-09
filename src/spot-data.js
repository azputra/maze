/** Scene-based spot-the-difference levels for kids */
export const SPOT_LEVELS = [
  {
    title: 'Taman Bermain',
    bg: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 60%, #90EE90 60%)',
    items: [
      { id: 'sun', emoji: '☀️', x: 12, y: 8, size: 2.2 },
      { id: 'cloud1', emoji: '☁️', x: 35, y: 12, size: 1.6 },
      { id: 'tree1', emoji: '🌳', x: 8, y: 55, size: 2.4 },
      { id: 'tree2', emoji: '🌲', x: 75, y: 52, size: 2 },
      { id: 'slide', emoji: '🛝', x: 42, y: 58, size: 2 },
      { id: 'ball', emoji: '⚽', x: 58, y: 78, size: 1.4 },
      { id: 'flower', emoji: '🌸', x: 22, y: 82, size: 1.2 },
      { id: 'butterfly', emoji: '🦋', x: 65, y: 35, size: 1.3 },
    ],
    diffs: [
      { ref: 'sun', change: { emoji: '🌙' } },
      { ref: 'ball', change: { emoji: '🏀' } },
      { ref: 'butterfly', change: { emoji: '🐝' } },
    ],
  },
  {
    title: 'Pantai',
    bg: 'linear-gradient(180deg, #4FC3F7 0%, #29B6F6 45%, #FFD54F 45%, #FFCA28 100%)',
    items: [
      { id: 'sun2', emoji: '☀️', x: 80, y: 6, size: 2 },
      { id: 'palm', emoji: '🌴', x: 15, y: 48, size: 2.5 },
      { id: 'umbrella', emoji: '⛱️', x: 50, y: 55, size: 2 },
      { id: 'crab', emoji: '🦀', x: 30, y: 78, size: 1.4 },
      { id: 'shell', emoji: '🐚', x: 68, y: 80, size: 1.3 },
      { id: 'wave', emoji: '🌊', x: 5, y: 42, size: 1.8 },
      { id: 'fish', emoji: '🐠', x: 55, y: 30, size: 1.4 },
      { id: 'star', emoji: '⭐', x: 85, y: 70, size: 1.2 },
    ],
    diffs: [
      { ref: 'crab', change: { emoji: '🦞' } },
      { ref: 'fish', change: { emoji: '🐙' } },
      { ref: 'umbrella', change: { emoji: '🏖️' } },
    ],
  },
  {
    title: 'Kebun Binatang',
    bg: 'linear-gradient(180deg, #81D4FA 0%, #A5D6A7 50%, #66BB6A 100%)',
    items: [
      { id: 'lion', emoji: '🦁', x: 20, y: 55, size: 2.2 },
      { id: 'elephant', emoji: '🐘', x: 55, y: 52, size: 2.4 },
      { id: 'monkey', emoji: '🐒', x: 78, y: 30, size: 1.8 },
      { id: 'giraffe', emoji: '🦒', x: 8, y: 35, size: 2.6 },
      { id: 'bird', emoji: '🦜', x: 42, y: 18, size: 1.5 },
      { id: 'fence', emoji: '🪵', x: 35, y: 82, size: 1.6 },
      { id: 'grass', emoji: '🌿', x: 70, y: 78, size: 1.3 },
      { id: 'zoo', emoji: '🏠', x: 48, y: 68, size: 1.6 },
    ],
    diffs: [
      { ref: 'lion', change: { emoji: '🐯' } },
      { ref: 'monkey', change: { emoji: '🐵' } },
      { ref: 'bird', change: { emoji: '🦅' } },
    ],
  },
  {
    title: 'Dapur',
    bg: 'linear-gradient(180deg, #FFCCBC 0%, #FFAB91 100%)',
    items: [
      { id: 'fridge', emoji: '🧊', x: 10, y: 40, size: 2.2 },
      { id: 'pot', emoji: '🍲', x: 40, y: 55, size: 2 },
      { id: 'apple', emoji: '🍎', x: 65, y: 45, size: 1.4 },
      { id: 'banana', emoji: '🍌', x: 78, y: 50, size: 1.4 },
      { id: 'bread', emoji: '🍞', x: 30, y: 72, size: 1.5 },
      { id: 'milk', emoji: '🥛', x: 55, y: 75, size: 1.3 },
      { id: 'clock', emoji: '🕐', x: 48, y: 15, size: 1.5 },
      { id: 'cup', emoji: '☕', x: 85, y: 72, size: 1.3 },
    ],
    diffs: [
      { ref: 'apple', change: { emoji: '🍊' } },
      { ref: 'bread', change: { emoji: '🥐' } },
      { ref: 'clock', change: { emoji: '🕒' } },
    ],
  },
  {
    title: 'Ruang Belajar',
    bg: 'linear-gradient(180deg, #E1BEE7 0%, #CE93D8 100%)',
    items: [
      { id: 'book', emoji: '📚', x: 15, y: 50, size: 2 },
      { id: 'pencil', emoji: '✏️', x: 35, y: 65, size: 1.4 },
      { id: 'globe', emoji: '🌍', x: 55, y: 45, size: 1.8 },
      { id: 'lamp', emoji: '💡', x: 75, y: 25, size: 1.5 },
      { id: 'backpack', emoji: '🎒', x: 8, y: 72, size: 1.8 },
      { id: 'abc', emoji: '🔤', x: 42, y: 20, size: 1.5 },
      { id: 'ruler', emoji: '📏', x: 68, y: 70, size: 1.3 },
      { id: 'star2', emoji: '⭐', x: 82, y: 55, size: 1.2 },
    ],
    diffs: [
      { ref: 'globe', change: { emoji: '🌙' } },
      { ref: 'pencil', change: { emoji: '🖊️' } },
      { ref: 'backpack', change: { emoji: '👜' } },
    ],
  },
  {
    title: 'Peternakan',
    bg: 'linear-gradient(180deg, #BBDEFB 0%, #C8E6C9 60%, #A5D6A7 100%)',
    items: [
      { id: 'cow', emoji: '🐄', x: 20, y: 55, size: 2.2 },
      { id: 'chicken', emoji: '🐔', x: 50, y: 65, size: 1.6 },
      { id: 'pig', emoji: '🐷', x: 72, y: 58, size: 1.8 },
      { id: 'barn', emoji: '🏚️', x: 40, y: 35, size: 2.2 },
      { id: 'tractor', emoji: '🚜', x: 8, y: 72, size: 1.8 },
      { id: 'hay', emoji: '🌾', x: 65, y: 78, size: 1.4 },
      { id: 'sheep', emoji: '🐑', x: 82, y: 42, size: 1.6 },
      { id: 'egg', emoji: '🥚', x: 58, y: 82, size: 1.1 },
    ],
    diffs: [
      { ref: 'cow', change: { emoji: '🐮' } },
      { ref: 'chicken', change: { emoji: '🐣' } },
      { ref: 'tractor', change: { emoji: '🚗' } },
    ],
  },
  {
    title: 'Luar Angkasa',
    bg: 'linear-gradient(180deg, #1A237E 0%, #311B92 100%)',
    items: [
      { id: 'rocket', emoji: '🚀', x: 40, y: 40, size: 2.5 },
      { id: 'planet', emoji: '🪐', x: 12, y: 25, size: 2 },
      { id: 'moon', emoji: '🌙', x: 75, y: 15, size: 1.8 },
      { id: 'star3', emoji: '⭐', x: 55, y: 12, size: 1.2 },
      { id: 'star4', emoji: '✨', x: 20, y: 55, size: 1.2 },
      { id: 'alien', emoji: '👽', x: 70, y: 60, size: 1.8 },
      { id: 'ufo', emoji: '🛸', x: 15, y: 75, size: 1.8 },
      { id: 'comet', emoji: '☄️', x: 82, y: 78, size: 1.4 },
    ],
    diffs: [
      { ref: 'planet', change: { emoji: '🌍' } },
      { ref: 'alien', change: { emoji: '🤖' } },
      { ref: 'ufo', change: { emoji: '🛰️' } },
    ],
  },
  {
    title: 'Halloween',
    bg: 'linear-gradient(180deg, #4A148C 0%, #311B92 50%, #1B5E20 100%)',
    items: [
      { id: 'pumpkin', emoji: '🎃', x: 25, y: 60, size: 2.2 },
      { id: 'ghost', emoji: '👻', x: 55, y: 45, size: 2 },
      { id: 'bat', emoji: '🦇', x: 15, y: 20, size: 1.5 },
      { id: 'witch', emoji: '🧙', x: 72, y: 50, size: 2 },
      { id: 'spider', emoji: '🕷️', x: 42, y: 18, size: 1.3 },
      { id: 'candy', emoji: '🍬', x: 8, y: 78, size: 1.3 },
      { id: 'skull', emoji: '💀', x: 65, y: 78, size: 1.4 },
      { id: 'moon5', emoji: '🌕', x: 82, y: 12, size: 1.8 },
    ],
    diffs: [
      { ref: 'ghost', change: { emoji: '💀' } },
      { ref: 'bat', change: { emoji: '🦉' } },
      { ref: 'candy', change: { emoji: '🍭' } },
    ],
  },
  {
    title: 'Olahraga',
    bg: 'linear-gradient(180deg, #81C784 0%, #4CAF50 100%)',
    items: [
      { id: 'soccer', emoji: '⚽', x: 30, y: 55, size: 1.8 },
      { id: 'basket', emoji: '🏀', x: 55, y: 60, size: 1.8 },
      { id: 'tennis', emoji: '🎾', x: 75, y: 50, size: 1.5 },
      { id: 'medal', emoji: '🏅', x: 15, y: 30, size: 1.6 },
      { id: 'trophy', emoji: '🏆', x: 45, y: 25, size: 1.8 },
      { id: 'whistle', emoji: '📣', x: 68, y: 78, size: 1.4 },
      { id: 'shoe', emoji: '👟', x: 8, y: 72, size: 1.5 },
      { id: 'flag', emoji: '🚩', x: 85, y: 35, size: 1.4 },
    ],
    diffs: [
      { ref: 'soccer', change: { emoji: '🏐' } },
      { ref: 'trophy', change: { emoji: '🥇' } },
      { ref: 'shoe', change: { emoji: '👞' } },
    ],
  },
  {
    title: 'Musim Dingin',
    bg: 'linear-gradient(180deg, #B3E5FC 0%, #E1F5FE 50%, #FFFFFF 100%)',
    items: [
      { id: 'snowman', emoji: '⛄', x: 35, y: 50, size: 2.4 },
      { id: 'snowflake', emoji: '❄️', x: 15, y: 20, size: 1.4 },
      { id: 'tree3', emoji: '🎄', x: 65, y: 45, size: 2.2 },
      { id: 'skate', emoji: '⛸️', x: 8, y: 72, size: 1.5 },
      { id: 'gift', emoji: '🎁', x: 55, y: 75, size: 1.6 },
      { id: 'hotchoco', emoji: '☕', x: 78, y: 68, size: 1.3 },
      { id: 'santa', emoji: '🎅', x: 82, y: 25, size: 2 },
      { id: 'bell', emoji: '🔔', x: 42, y: 18, size: 1.3 },
    ],
    diffs: [
      { ref: 'snowman', change: { emoji: '🐧' } },
      { ref: 'gift', change: { emoji: '🎀' } },
      { ref: 'santa', change: { emoji: '🤶' } },
    ],
  },
];

export const TOTAL_SPOT_LEVELS = SPOT_LEVELS.length;

export function buildSceneItems(level, isModified) {
  const data = SPOT_LEVELS[level];
  const diffMap = new Map(data.diffs.map((d) => [d.ref, d.change]));

  return data.items.map((item) => {
    if (isModified && diffMap.has(item.id)) {
      return { ...item, ...diffMap.get(item.id), isDiff: true };
    }
    return { ...item, isDiff: isModified && diffMap.has(item.id) };
  });
}

export function getDiffIds(level) {
  return SPOT_LEVELS[level].diffs.map((d) => d.ref);
}
