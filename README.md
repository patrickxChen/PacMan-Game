# PacMan-Game

This repository contains two versions of the project:

## 1) Java Desktop Version
- Folder: `pacman-java`
- Stack: Java + Swing
- Run locally:

```bash
javac pacman-java/*.java
java -cp pacman-java App
```

## 2) Web Version (Deployed)
- Folder: `pacman-web`
- Stack: TypeScript, HTML5 Canvas, Vite
- Live URL: https://pacman-web-one.vercel.app

### Web Features
- Grid-based movement + collision detection
- BFS-based ghost pathfinding with difficulty-based behavior tuning
- Score/lives/game-over handling + level progression
- Keyboard controls + animation loop + movement interpolation

## Development
From `pacman-web`:

```bash
npm install
npm run dev
npm run build
```

## Deploy
From `pacman-web`:

```bash
npx vercel --prod --yes
```
