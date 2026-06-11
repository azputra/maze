import { PLAYER_SETUP } from './snakes-ladders-data.js';

export { PLAYER_SETUP };

export const START_MONEY = 15000;
export const PASS_GO_BONUS = 2000;
export const WIN_MONEY = 80000;
export const JAIL_POS = 10;
export const MAX_UPGRADE = 2;
export const UPGRADE_COST_RATIO = 0.6;

export const PROPERTY_GROUPS = {
  green: { color: '#22c55e', name: 'Taman' },
  orange: { color: '#f97316', name: 'Kuliner' },
  blue: { color: '#3b82f6', name: 'Belanja' },
  cyan: { color: '#06b6d4', name: 'Wisata' },
  purple: { color: '#a855f7', name: 'Hiburan' },
  red: { color: '#ef4444', name: 'Olahraga' },
  yellow: { color: '#eab308', name: 'Layanan' },
  indigo: { color: '#6366f1', name: 'Transport' },
  pink: { color: '#ec4899', name: 'Mewah' },
  gold: { color: '#f59e0b', name: 'Premium' },
};

export const TILES = [
  { type: 'start', name: 'MULAI', emoji: '🏁', desc: 'Lewat +Rp2.000' },
  { type: 'property', name: 'Taman Kota', emoji: '🌳', price: 1000, rent: 200, color: '#22c55e', group: 'green' },
  { type: 'chance', name: 'Keberuntungan', emoji: '🎴' },
  { type: 'property', name: 'Warung Makan', emoji: '🍜', price: 1500, rent: 300, color: '#f97316', group: 'orange' },
  { type: 'tax', name: 'Pajak', emoji: '💸', amount: 500 },
  { type: 'property', name: 'Toko Mainan', emoji: '🧸', price: 2000, rent: 400, color: '#3b82f6', group: 'blue' },
  { type: 'property', name: 'Sekolah', emoji: '🏫', price: 2200, rent: 440, color: '#3b82f6', group: 'blue' },
  { type: 'chance', name: 'Keberuntungan', emoji: '🎴' },
  { type: 'property', name: 'Pantai', emoji: '🏖️', price: 2500, rent: 500, color: '#06b6d4', group: 'cyan' },
  { type: 'jail', name: 'Penjara', emoji: '🔒', desc: 'Hanya lewat' },
  { type: 'property', name: 'Mall', emoji: '🛍️', price: 3000, rent: 600, color: '#a855f7', group: 'purple' },
  { type: 'property', name: 'Bioskop', emoji: '🎬', price: 3200, rent: 640, color: '#a855f7', group: 'purple' },
  { type: 'tax', name: 'Pajak', emoji: '💸', amount: 800 },
  { type: 'property', name: 'Stadion', emoji: '🏟️', price: 3500, rent: 700, color: '#ef4444', group: 'red' },
  { type: 'property', name: 'Hotel', emoji: '🏨', price: 4000, rent: 800, color: '#eab308', group: 'yellow' },
  { type: 'chance', name: 'Keberuntungan', emoji: '🎴' },
  { type: 'property', name: 'Rumah Sakit', emoji: '🏥', price: 4200, rent: 840, color: '#eab308', group: 'yellow' },
  { type: 'go_jail', name: 'Ke Penjara!', emoji: '👮', desc: 'Pergi ke penjara' },
  { type: 'property', name: 'Bandara', emoji: '✈️', price: 4500, rent: 900, color: '#6366f1', group: 'indigo' },
  { type: 'free_parking', name: 'Parkir Gratis', emoji: '🅿️', desc: 'Ambil jackpot!' },
  { type: 'property', name: 'Taman Hiburan', emoji: '🎡', price: 5000, rent: 1000, color: '#6366f1', group: 'indigo' },
  { type: 'chance', name: 'Keberuntungan', emoji: '🎴' },
  { type: 'property', name: 'Istana', emoji: '🏰', price: 6000, rent: 1200, color: '#ec4899', group: 'pink' },
  { type: 'property', name: 'Menara Emas', emoji: '🗼', price: 8000, rent: 2000, color: '#f59e0b', group: 'gold' },
];

export const CHANCE_CARDS = [
  { emoji: '🎁', text: 'Hadiah ulang tahun!', money: 2000 },
  { emoji: '💰', text: 'Jackpot kecil!', money: 3500 },
  { emoji: '🏆', text: 'Menang lomba!', money: 2500 },
  { emoji: '🎉', text: 'Bonus THR!', money: 3000 },
  { emoji: '🍀', text: 'Hoki besar!', money: 4000 },
  { emoji: '🎲', text: 'Dadu bonus — lempar lagi!', rollAgain: true },
  { emoji: '💸', text: 'Bayar tagihan listrik', money: -800 },
  { emoji: '🛠️', text: 'Perbaikan rumah', money: -1200 },
  { emoji: '🏥', text: 'Biaya dokter', money: -600 },
  { emoji: '🚗', text: 'Servis mobil', money: -1000 },
  { emoji: '➡️', text: 'Maju 3 langkah!', move: 3 },
  { emoji: '⬅️', text: 'Mundur 2 langkah', move: -2 },
  { emoji: '🏁', text: 'Langsung ke MULAI!', goStart: true },
  { emoji: '👮', text: 'Nakal! Ke penjara!', goJail: true },
  { emoji: '🏠', text: 'Gratis 1 upgrade!', freeUpgrade: true },
];

const DICE_EMOJI = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
export { DICE_EMOJI };

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

export function getGroupTiles(group) {
  return TILES.map((t, i) => (t.group === group ? i : -1)).filter((i) => i >= 0);
}

export function ownsFullGroup(ownership, upgrades, playerId, group) {
  const tiles = getGroupTiles(group);
  return tiles.every((idx) => ownership[idx] === playerId);
}

export function getRent(tileIdx, ownership, upgrades, ownerId) {
  const tile = TILES[tileIdx];
  if (!tile.rent) return 0;
  let rent = tile.rent;
  const level = upgrades[tileIdx] || 0;
  rent *= 1 + level * 0.75;
  if (tile.group && ownsFullGroup(ownership, upgrades, ownerId, tile.group)) {
    rent *= 2;
  }
  return Math.floor(rent);
}

export function getUpgradeCost(tileIdx) {
  const tile = TILES[tileIdx];
  return Math.floor(tile.price * UPGRADE_COST_RATIO);
}
