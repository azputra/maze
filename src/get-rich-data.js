import { PLAYER_SETUP } from './snakes-ladders-data.js';

export { PLAYER_SETUP };

export const START_MONEY = 15000;
export const PASS_GO_BONUS = 2000;
export const WIN_MONEY = 80000;
export const JAIL_POS = 10;

export const TILES = [
  { type: 'start', name: 'MULAI', emoji: '🏁', desc: 'Lewat +Rp2.000' },
  { type: 'property', name: 'Taman Kota', emoji: '🌳', price: 1000, rent: 200, color: '#22c55e' },
  { type: 'chance', name: 'Keberuntungan', emoji: '🎴' },
  { type: 'property', name: 'Warung Makan', emoji: '🍜', price: 1500, rent: 300, color: '#f97316' },
  { type: 'tax', name: 'Pajak', emoji: '💸', amount: 500 },
  { type: 'property', name: 'Toko Mainan', emoji: '🧸', price: 2000, rent: 400, color: '#3b82f6' },
  { type: 'property', name: 'Sekolah', emoji: '🏫', price: 2200, rent: 440, color: '#3b82f6' },
  { type: 'chance', name: 'Keberuntungan', emoji: '🎴' },
  { type: 'property', name: 'Pantai', emoji: '🏖️', price: 2500, rent: 500, color: '#06b6d4' },
  { type: 'jail', name: 'Penjara', emoji: '🔒', desc: 'Hanya lewat' },
  { type: 'property', name: 'Mall', emoji: '🛍️', price: 3000, rent: 600, color: '#a855f7' },
  { type: 'property', name: 'Bioskop', emoji: '🎬', price: 3200, rent: 640, color: '#a855f7' },
  { type: 'tax', name: 'Pajak', emoji: '💸', amount: 800 },
  { type: 'property', name: 'Stadion', emoji: '🏟️', price: 3500, rent: 700, color: '#ef4444' },
  { type: 'property', name: 'Hotel', emoji: '🏨', price: 4000, rent: 800, color: '#eab308' },
  { type: 'chance', name: 'Keberuntungan', emoji: '🎴' },
  { type: 'property', name: 'Rumah Sakit', emoji: '🏥', price: 4200, rent: 840, color: '#eab308' },
  { type: 'go_jail', name: 'Ke Penjara!', emoji: '👮', desc: 'Pergi ke penjara' },
  { type: 'property', name: 'Bandara', emoji: '✈️', price: 4500, rent: 900, color: '#6366f1' },
  { type: 'property', name: 'Taman Hiburan', emoji: '🎡', price: 5000, rent: 1000, color: '#6366f1' },
  { type: 'chance', name: 'Keberuntungan', emoji: '🎴' },
  { type: 'property', name: 'Istana', emoji: '🏰', price: 6000, rent: 1200, color: '#ec4899' },
  { type: 'property', name: 'Menara Emas', emoji: '🗼', price: 8000, rent: 2000, color: '#f59e0b' },
];

export const CHANCE_CARDS = [
  { emoji: '🎁', text: 'Hadiah ulang tahun!', money: 1500 },
  { emoji: '💰', text: 'Dapat THR!', money: 2000 },
  { emoji: '🏆', text: 'Menang lomba!', money: 2500 },
  { emoji: '🎉', text: 'Bonus kerja bagus!', money: 1000 },
  { emoji: '🍀', text: 'Keberuntungan!', money: 3000 },
  { emoji: '💸', text: 'Bayar tagihan listrik', money: -800 },
  { emoji: '🛠️', text: 'Perbaikan rumah', money: -1200 },
  { emoji: '🏥', text: 'Biaya dokter', money: -600 },
  { emoji: '📚', text: 'Beli buku sekolah', money: -500 },
  { emoji: '🚗', text: 'Servis mobil', money: -1000 },
  { emoji: '➡️', text: 'Maju 3 langkah!', move: 3 },
  { emoji: '⬅️', text: 'Mundur 2 langkah', move: -2 },
  { emoji: '🏁', text: 'Langsung ke MULAI!', goStart: true },
  { emoji: '👮', text: 'Nakal! Ke penjara!', goJail: true },
];

const DICE_EMOJI = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
export { DICE_EMOJI };

/** Board ring positions on 8×6 grid */
export function getTileGridPositions() {
  const cols = 8;
  const rows = 6;
  const pos = [];
  for (let c = 0; c < cols; c++) pos.push({ r: 0, c });
  for (let r = 1; r < rows - 1; r++) pos.push({ r, c: cols - 1 });
  for (let c = cols - 1; c >= 0; c--) pos.push({ r: rows - 1, c });
  for (let r = rows - 2; r >= 1; r--) pos.push({ r, c: 0 });
  return pos;
}

export function formatMoney(n) {
  if (n >= 1000) return `Rp${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}rb`;
  return `Rp${n}`;
}

export function drawChanceCard(seed = Date.now()) {
  let s = seed;
  s = (s * 1103515245 + 12345) & 0x7fffffff;
  return CHANCE_CARDS[s % CHANCE_CARDS.length];
}
