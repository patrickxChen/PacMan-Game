# Pac-Man Web (TypeScript)

This project is a web-based Pac-Man clone built with Vite + TypeScript and deployed on Vercel.

## Implemented Features

- Developed collision detection and grid-based movement algorithms.
- Implemented ghost AI using pathfinding logic (BFS) with heuristic direction choices at intersections.
- Built score tracking, win/loss conditions, and level progression system.
- Built interactive browser GUI with keyboard event handling and an animation loop (`requestAnimationFrame`).
- Optimized update/render loop for consistent frame pacing using fixed-step tile movement and frame time clamping.

## Controls

- Arrow keys: Move Pac-Man
- `Q`: Return to menu

## Local Run

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```
