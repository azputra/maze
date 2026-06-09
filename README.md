# Maze Quest 🌀

Game labirin 50 level — responsive untuk HP dan desktop.

## Fitur

- 50 level dengan tingkat kesulitan meningkat (5 tier)
- Kontrol keyboard (WASD / arrow keys) dan touch (swipe + D-pad)
- Progress tersimpan di browser (localStorage)
- Best time & best moves per level
- Responsive mobile-first

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
