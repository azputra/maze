/** Classic-style snakes & ladders on 1–100 board */
export const LADDERS = [
  { from: 4, to: 25 },
  { from: 9, to: 30 },
  { from: 20, to: 39 },
  { from: 28, to: 84 },
  { from: 40, to: 59 },
  { from: 51, to: 67 },
  { from: 63, to: 81 },
  { from: 71, to: 91 },
];

export const SNAKES = [
  { from: 17, to: 7 },
  { from: 54, to: 34 },
  { from: 62, to: 19 },
  { from: 64, to: 60 },
  { from: 87, to: 24 },
  { from: 93, to: 73 },
  { from: 95, to: 75 },
  { from: 99, to: 78 },
];

export const FUN_COMMANDS = [
  { emoji: '👏', text: 'Tepuk tangan 5 kali!' },
  { emoji: '💃', text: 'Joget 10 detik!' },
  { emoji: '😂', text: 'Ketawa terbahak-bahak!' },
  { emoji: '🦁', text: 'Raung seperti singa!' },
  { emoji: '🐸', text: 'Loncat seperti katak!' },
  { emoji: '🤳', text: 'Pose foto paling lucu!' },
  { emoji: '🎤', text: 'Nyanyi lagu favoritmu!' },
  { emoji: '🙈', text: 'Tutup mata & tebak siapa di sampingmu!' },
  { emoji: '🦸', text: 'Pose superhero!' },
  { emoji: '🐒', text: 'Bergaya seperti monyet!' },
  { emoji: '⭐', text: 'Bilang "Aku hebat!" 3 kali!' },
  { emoji: '🤗', text: 'Peluk teman di sebelahmu!' },
  { emoji: '🏃', text: 'Jalan tempat 5 langkah!' },
  { emoji: '🎭', text: 'Tirukan suara hewan!' },
  { emoji: '🌟', text: 'Sebut 3 hal yang bikin kamu senang!' },
];

/** Challenge squares — spread across board (avoid snake/ladder heads) */
export const CHALLENGE_SQUARES = [
  3, 6, 8, 11, 13, 15, 16, 19, 22, 24, 26, 30, 32, 35, 37, 41, 43, 45, 47, 49,
  52, 53, 56, 58, 60, 61, 65, 68, 70, 72, 74, 76, 77, 79, 80, 83, 85, 86, 88,
  89, 90, 92, 94, 96, 97, 98,
];

export const PLAYER_SETUP = [
  { id: 0, emoji: '🔴', name: 'Merah', color: '#ef4444' },
  { id: 1, emoji: '🔵', name: 'Biru', color: '#3b82f6' },
  { id: 2, emoji: '🟢', name: 'Hijau', color: '#22c55e' },
  { id: 3, emoji: '🟡', name: 'Kuning', color: '#eab308' },
];

export function posToGrid(n) {
  const idx = n - 1;
  const rowFromBottom = Math.floor(idx / 10);
  const colInRow = idx % 10;
  const gridRow = 9 - rowFromBottom;
  const gridCol = rowFromBottom % 2 === 0 ? colInRow : 9 - colInRow;
  return { row: gridRow, col: gridCol };
}

export function getLadderAt(pos) {
  return LADDERS.find((l) => l.from === pos);
}

export function getSnakeAt(pos) {
  return SNAKES.find((s) => s.from === pos);
}

export function getChallengeAt(pos) {
  return CHALLENGE_SQUARES.includes(pos);
}

export function getRandomCommand(seed = Date.now()) {
  let s = seed;
  return FUN_COMMANDS[
    Math.abs(
      (s = (s * 1103515245 + 12345) & 0x7fffffff) % FUN_COMMANDS.length
    )
  ];
}
