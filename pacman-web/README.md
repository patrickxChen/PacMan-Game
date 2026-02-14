# Pac-Man Web (TypeScript)

A retro-style Pac-Man clone for the web, built with TypeScript + Vite and deployed on Vercel.

## Highlights

- Grid-based movement and collision system on a tile map.
- Ghost AI built with BFS distance mapping and difficulty-based behavior tuning.
- Difficulty presets that affect both movement speed and AI decision quality.
- Score, lives, game-over handling, and level progression with increasing difficulty.
- Render smoothing via interpolation between fixed tile steps.

## Gameplay Systems

- **Movement model:** fixed-step tile logic for deterministic gameplay.
- **Rendering model:** `requestAnimationFrame` loop with interpolated draw positions.
- **AI model:** BFS distance map from hero target tile, with randomness/scatter controls by difficulty.
- **State flow:** `menu → playing → gameover` with restart/menu transitions.

## Controls

- `Arrow Keys`: Move Pac-Man
- `Q`: Return to menu

## Difficulty Behavior

- **Easy:** slower ghosts, higher randomness/scatter, no predictive targeting.
- **Normal:** balanced chase/scatter with light prediction.
- **Hard:** faster ghosts, low randomness, stronger predictive chase.

## Tech Stack

- TypeScript
- HTML5 Canvas API
- Vite
- npm
- Vercel

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy (Vercel CLI)

```bash
npx vercel --prod --yes
```
