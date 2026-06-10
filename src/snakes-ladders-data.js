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

/** Challenge squares — spread across the board */
export const CHALLENGE_SQUARES = [
  6, 12, 18, 22, 27, 33, 38, 44, 48, 55, 61, 66, 72, 76, 82, 88, 94, 97,
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
