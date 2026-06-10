# Maze Quest 🌀

Game labirin 50 level — responsive untuk HP dan desktop.

## Fitur

- **Maze Quest** — 50 level labirin
- **Cari Beda** — temukan perbedaan 2 gambar (10 level)
- **Flip Match** — cocokkan kartu berpasangan (10 level)
- **Catur Anak** — papan catur dengan bidak emoji, gerakan sederhana (usia 4–10)
- **Tebak Bola** — 50 level tebak posisi bola setelah gelas diacak
- Responsive mobile-first, progress tersimpan di browser

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Tier Level

| Level | Tier | Ukuran Labirin |
|-------|------|----------------|
| 1–10  | Pemula | Kecil |
| 11–20 | Pelajar | Sedang |
| 21–30 | Penjelajah | Besar |
| 31–40 | Ahli | Sangat Besar |
| 41–50 | Legenda | Ekstrem |

## Tech

- Vite + Vanilla JS
- CSS Grid untuk maze rendering
- Recursive backtracker maze generation
