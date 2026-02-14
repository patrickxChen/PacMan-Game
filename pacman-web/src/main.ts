import './style.css';

type Dir = 'U' | 'D' | 'L' | 'R';
type Screen = 'menu' | 'playing' | 'gameover';

type Difficulty = {
  key: 'easy' | 'normal' | 'hard';
  label: string;
  pacmanStepMs: number;
  ghostStepMs: number;
  lives: number;
  ghostRandomTurnChance: number;
  ghostScatterChance: number;
  ghostPredictTiles: number;
};

type Entity = {
  row: number;
  col: number;
  prevRow: number;
  prevCol: number;
  startRow: number;
  startCol: number;
  dir: Dir;
  nextDir: Dir;
  stepMs: number;
  accumulator: number;
  color?: string;
};

const tileSize = 32;
const rows = 21;
const cols = 19;
const width = cols * tileSize;
const height = rows * tileSize;

const levelMap: string[] = [
  'XXXXXXXXXXXXXXXXXXX',
  'X        X        X',
  'X XX XXX X XXX XX X',
  'X                 X',
  'X XX X XXXXX X XX X',
  'X    X       X    X',
  'XXXX XXXX XXXX XXXX',
  'OOOX X       X XOOO',
  'XXXX X XXrXX X XXXX',
  'O       bpo       O',
  'XXXX X XXXXX X XXXX',
  'OOOX X       X XOOO',
  'XXXX X XXXXX X XXXX',
  'X        X        X',
  'X XX XXX X XXX XX X',
  'X  X     P     X  X',
  'XX X X XXXXX X X XX',
  'X    X   X   X    X',
  'X XXXXXX X XXXXXX X',
  'X                 X',
  'XXXXXXXXXXXXXXXXXXX'
];

const directions: Record<Dir, { dr: number; dc: number }> = {
  U: { dr: -1, dc: 0 },
  D: { dr: 1, dc: 0 },
  L: { dr: 0, dc: -1 },
  R: { dr: 0, dc: 1 }
};

const opposite: Record<Dir, Dir> = { U: 'D', D: 'U', L: 'R', R: 'L' };

const presets: Record<Difficulty['key'], Difficulty> = {
  easy: {
    key: 'easy',
    label: 'Easy',
    pacmanStepMs: 130,
    ghostStepMs: 175,
    lives: 4,
    ghostRandomTurnChance: 0.45,
    ghostScatterChance: 0.40,
    ghostPredictTiles: 0
  },
  normal: {
    key: 'normal',
    label: 'Normal',
    pacmanStepMs: 115,
    ghostStepMs: 150,
    lives: 3,
    ghostRandomTurnChance: 0.22,
    ghostScatterChance: 0.12,
    ghostPredictTiles: 1
  },
  hard: {
    key: 'hard',
    label: 'Hard',
    pacmanStepMs: 95,
    ghostStepMs: 125,
    lives: 2,
    ghostRandomTurnChance: 0.08,
    ghostScatterChance: 0.03,
    ghostPredictTiles: 2
  }
};

const app = document.querySelector('#app') as HTMLDivElement;
app.innerHTML = `
  <div class="game-shell">
    <canvas id="game" width="${width}" height="${height}"></canvas>
    <div id="overlay" class="overlay"></div>
  </div>
`;

const canvas = document.querySelector('#game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const overlay = document.querySelector('#overlay') as HTMLDivElement;

const state = {
  screen: 'menu' as Screen,
  difficulty: presets.normal,
  level: 1,
  score: 0,
  lives: presets.normal.lives,
  introUntil: 0,
  hero: null as Entity | null,
  ghosts: [] as Entity[],
  walls: new Set<string>(),
  pellets: new Set<string>(),
  distanceMap: [] as number[][],
  lastHeroTileKey: '',
  lastFrame: 0
};

function key(row: number, col: number): string {
  return `${row},${col}`;
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

function isWalkable(row: number, col: number): boolean {
  return inBounds(row, col) && !state.walls.has(key(row, col));
}

function canMove(entity: Entity, dir: Dir): boolean {
  const d = directions[dir];
  return isWalkable(entity.row + d.dr, entity.col + d.dc);
}

function getTargetTile(): { row: number; col: number } {
  if (!state.hero) return { row: 0, col: 0 };

  let targetRow = state.hero.row;
  let targetCol = state.hero.col;
  const predict = state.difficulty.ghostPredictTiles;
  const d = directions[state.hero.dir];

  for (let i = 0; i < predict; i++) {
    const nr = targetRow + d.dr;
    const nc = targetCol + d.dc;
    if (!isWalkable(nr, nc)) break;
    targetRow = nr;
    targetCol = nc;
  }

  return { row: targetRow, col: targetCol };
}

function makeEntity(row: number, col: number, stepMs: number, dir: Dir, color?: string): Entity {
  return {
    row,
    col,
    prevRow: row,
    prevCol: col,
    startRow: row,
    startCol: col,
    dir,
    nextDir: dir,
    stepMs,
    accumulator: 0,
    color
  };
}

function parseBoard(): void {
  state.walls.clear();
  state.pellets.clear();
  state.ghosts = [];
  state.hero = null;
  state.distanceMap = Array.from({ length: rows }, () => Array(cols).fill(Number.POSITIVE_INFINITY));
  state.lastHeroTileKey = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = levelMap[r][c];
      if (ch === 'X') {
        state.walls.add(key(r, c));
      } else if (ch === ' ') {
        state.pellets.add(key(r, c));
      } else if (ch === 'P') {
        state.hero = makeEntity(r, c, state.difficulty.pacmanStepMs, 'R');
      } else if ('bopr'.includes(ch)) {
        const colorMap: Record<string, string> = {
          b: '#46f4ff',
          o: '#ffb24d',
          p: '#ff7ce4',
          r: '#ff6767'
        };
        const g = makeEntity(r, c, state.difficulty.ghostStepMs, (['U', 'D', 'L', 'R'][Math.floor(Math.random() * 4)] as Dir), colorMap[ch]);
        state.ghosts.push(g);
      }
    }
  }
}

function resetEntityPositions(): void {
  if (!state.hero) return;
  state.hero.row = state.hero.startRow;
  state.hero.col = state.hero.startCol;
  state.hero.prevRow = state.hero.startRow;
  state.hero.prevCol = state.hero.startCol;
  state.hero.dir = 'R';
  state.hero.nextDir = 'R';
  state.hero.accumulator = 0;

  state.ghosts.forEach((g) => {
    g.row = g.startRow;
    g.col = g.startCol;
    g.prevRow = g.startRow;
    g.prevCol = g.startCol;
    g.dir = (['U', 'D', 'L', 'R'][Math.floor(Math.random() * 4)] as Dir);
    g.nextDir = g.dir;
    g.accumulator = 0;
  });
}

function startGame(diffKey: Difficulty['key']): void {
  state.difficulty = presets[diffKey];
  state.level = 1;
  state.score = 0;
  state.lives = state.difficulty.lives;
  state.screen = 'playing';
  parseBoard();
  state.introUntil = performance.now() + 1200;
  showOverlay('');
}

function backToMenu(): void {
  state.screen = 'menu';
  showMenu();
}

function updateDistanceMapFromHero(): void {
  if (!state.hero) return;

  const target = getTargetTile();
  const heroKey = key(target.row, target.col);
  if (heroKey === state.lastHeroTileKey) return;

  state.lastHeroTileKey = heroKey;
  state.distanceMap = Array.from({ length: rows }, () => Array(cols).fill(Number.POSITIVE_INFINITY));

  const queue: Array<{ row: number; col: number }> = [{ row: target.row, col: target.col }];
  state.distanceMap[target.row][target.col] = 0;

  while (queue.length) {
    const current = queue.shift()!;
    const baseDist = state.distanceMap[current.row][current.col];

    for (const dir of ['U', 'D', 'L', 'R'] as Dir[]) {
      const d = directions[dir];
      const nr = current.row + d.dr;
      const nc = current.col + d.dc;
      if (!isWalkable(nr, nc)) continue;

      if (state.distanceMap[nr][nc] > baseDist + 1) {
        state.distanceMap[nr][nc] = baseDist + 1;
        queue.push({ row: nr, col: nc });
      }
    }
  }
}

function chooseGhostDirection(ghost: Entity): Dir {
  if (!state.hero) return ghost.dir;

  const candidates = (['U', 'D', 'L', 'R'] as Dir[]).filter((dir) => canMove(ghost, dir));
  if (!candidates.length) return opposite[ghost.dir];

  const filtered = candidates.filter((dir) => dir !== opposite[ghost.dir]);
  const options = filtered.length ? filtered : candidates;

  if (Math.random() < state.difficulty.ghostRandomTurnChance) {
    return options[Math.floor(Math.random() * options.length)];
  }

  const useScatter = Math.random() < state.difficulty.ghostScatterChance;

  let bestDir = options[0];
  let bestDist = useScatter ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (const dir of options) {
    const d = directions[dir];
    const nr = ghost.row + d.dr;
    const nc = ghost.col + d.dc;
    const dist = state.distanceMap[nr]?.[nc] ?? Number.POSITIVE_INFINITY;
    if (useScatter) {
      if (dist > bestDist) {
        bestDist = dist;
        bestDir = dir;
      }
    } else {
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = dir;
      }
    }
  }

  return bestDir;
}

function stepEntity(entity: Entity): void {
  if (canMove(entity, entity.nextDir)) {
    entity.dir = entity.nextDir;
  }
  if (!canMove(entity, entity.dir)) {
    entity.prevRow = entity.row;
    entity.prevCol = entity.col;
    return;
  }

  entity.prevRow = entity.row;
  entity.prevCol = entity.col;
  const d = directions[entity.dir];
  entity.row += d.dr;
  entity.col += d.dc;
}

function stepGhost(ghost: Entity): void {
  ghost.dir = chooseGhostDirection(ghost);
  ghost.nextDir = ghost.dir;
  if (!canMove(ghost, ghost.dir)) {
    ghost.prevRow = ghost.row;
    ghost.prevCol = ghost.col;
    return;
  }

  ghost.prevRow = ghost.row;
  ghost.prevCol = ghost.col;
  const d = directions[ghost.dir];
  ghost.row += d.dr;
  ghost.col += d.dc;
}

function entityRenderPosition(entity: Entity): { x: number; y: number } {
  const t = Math.max(0, Math.min(1, entity.accumulator / entity.stepMs));
  const drawRow = entity.prevRow + (entity.row - entity.prevRow) * t;
  const drawCol = entity.prevCol + (entity.col - entity.prevCol) * t;
  return {
    x: drawCol * tileSize,
    y: drawRow * tileSize
  };
}

function updateEntity(entity: Entity, dtMs: number, stepFn: (e: Entity) => void): void {
  entity.accumulator += dtMs;
  while (entity.accumulator >= entity.stepMs) {
    stepFn(entity);
    entity.accumulator -= entity.stepMs;
  }
}

function checkPellet(): void {
  if (!state.hero) return;
  const k = key(state.hero.row, state.hero.col);
  if (state.pellets.has(k)) {
    state.pellets.delete(k);
    state.score += 10;
  }
}

function heroHitGhost(): boolean {
  if (!state.hero) return false;
  return state.ghosts.some((g) => g.row === state.hero!.row && g.col === state.hero!.col);
}

function levelUp(now: number): void {
  state.level += 1;
  state.difficulty = {
    ...state.difficulty,
    pacmanStepMs: Math.max(75, state.difficulty.pacmanStepMs - 4),
    ghostStepMs: Math.max(85, state.difficulty.ghostStepMs - 8)
  };
  parseBoard();
  if (state.hero) state.hero.stepMs = state.difficulty.pacmanStepMs;
  state.ghosts.forEach((g) => {
    g.stepMs = state.difficulty.ghostStepMs;
  });
  state.introUntil = now + 1000;
}

function onLifeLost(now: number): void {
  state.lives -= 1;
  if (state.lives <= 0) {
    state.screen = 'gameover';
    showOverlay(`
      <div class="panel">
        <h2>GAME OVER</h2>
        <p>Score: ${state.score}</p>
        <p>Level: ${state.level}</p>
        <button id="menuBtn">Back to Menu</button>
      </div>
    `);
    document.querySelector('#menuBtn')?.addEventListener('click', backToMenu);
    return;
  }

  resetEntityPositions();
  state.introUntil = now + 900;
}

function update(dtMs: number, now: number): void {
  if (state.screen !== 'playing' || !state.hero) return;
  if (now < state.introUntil) return;

  updateEntity(state.hero, dtMs, stepEntity);
  updateDistanceMapFromHero();
  checkPellet();

  for (const ghost of state.ghosts) {
    updateEntity(ghost, dtMs, stepGhost);
  }

  if (heroHitGhost()) {
    onLifeLost(now);
    return;
  }

  if (state.pellets.size === 0) {
    levelUp(now);
  }
}

function drawBackground(now: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#090b22');
  gradient.addColorStop(1, '#1f0d48');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(0,255,255,0.09)';
  for (let y = 0; y < height; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const scanY = Math.floor((now / 8) % height);
  ctx.fillStyle = 'rgba(90,255,255,0.14)';
  ctx.fillRect(0, scanY, width, 3);
}

function drawWalls(): void {
  state.walls.forEach((k) => {
    const [rStr, cStr] = k.split(',');
    const r = Number(rStr);
    const c = Number(cStr);
    const x = c * tileSize;
    const y = r * tileSize;
    ctx.fillStyle = '#16398f';
    ctx.fillRect(x, y, tileSize, tileSize);
    ctx.strokeStyle = 'rgba(114,240,255,0.62)';
    ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
  });
}

function drawPellets(now: number): void {
  const pulse = 2 + Math.sin(now / 120) * 0.7;
  state.pellets.forEach((k) => {
    const [rStr, cStr] = k.split(',');
    const r = Number(rStr);
    const c = Number(cStr);
    const x = c * tileSize + tileSize / 2;
    const y = r * tileSize + tileSize / 2;
    ctx.fillStyle = 'rgba(255,240,170,0.35)';
    ctx.beginPath();
    ctx.arc(x, y, pulse + 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe6a0';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawGhost(ghost: Entity): void {
  const pos = entityRenderPosition(ghost);
  const x = pos.x;
  const y = pos.y;
  const s = tileSize;

  ctx.fillStyle = ghost.color ?? '#fff';
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s / 2.3, s / 2.2, Math.PI, 0);
  ctx.lineTo(x + s * 0.95, y + s * 0.95);
  ctx.lineTo(x + s * 0.75, y + s * 0.83);
  ctx.lineTo(x + s * 0.55, y + s * 0.95);
  ctx.lineTo(x + s * 0.35, y + s * 0.83);
  ctx.lineTo(x + s * 0.15, y + s * 0.95);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + s * 0.38, y + s * 0.45, 4, 0, Math.PI * 2);
  ctx.arc(x + s * 0.62, y + s * 0.45, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawHero(now: number): void {
  if (!state.hero) return;
  const pos = entityRenderPosition(state.hero);
  const x = pos.x + tileSize / 2;
  const y = pos.y + tileSize / 2;
  const mouth = (Math.sin(now / 90) + 1) * 0.2 + 0.08;
  const angleMap: Record<Dir, number> = { R: 0, L: Math.PI, U: -Math.PI / 2, D: Math.PI / 2 };
  const base = angleMap[state.hero.dir];

  ctx.fillStyle = '#ffd63d';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, tileSize / 2.2, base + mouth, base + (Math.PI * 2 - mouth));
  ctx.closePath();
  ctx.fill();
}

function drawHUD(now: number): void {
  ctx.fillStyle = 'rgba(6,10,28,0.82)';
  ctx.fillRect(10, 8, width - 20, 30);
  ctx.strokeStyle = 'rgba(122,247,255,0.6)';
  ctx.strokeRect(10, 8, width - 20, 30);

  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#ffe766';
  ctx.fillText(`SCORE ${state.score}`, 22, 29);
  ctx.fillStyle = '#9df0ff';
  ctx.fillText(`LEVEL ${state.level}`, width / 2 - 42, 29);
  ctx.fillStyle = '#ffc87c';
  ctx.fillText('Q MENU', width - 92, 29);

  for (let i = 0; i < state.lives; i++) {
    ctx.fillStyle = '#ffd63d';
    ctx.beginPath();
    ctx.arc(width - 26 - i * 18, 50, 6, 0.2, Math.PI * 2 - 0.2);
    ctx.lineTo(width - 26 - i * 18, 50);
    ctx.fill();
  }

  if (state.screen === 'playing' && performance.now() < state.introUntil) {
    const alpha = 0.75 + Math.sin(now / 130) * 0.18;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(width / 2 - 130, height / 2 - 34, 260, 60);
    ctx.strokeStyle = 'rgba(255,230,90,0.8)';
    ctx.strokeRect(width / 2 - 130, height / 2 - 34, 260, 60);
    ctx.fillStyle = '#ffe04d';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('READY!', width / 2 - 70, height / 2 + 8);
  }
}

function render(now: number): void {
  if (state.screen === 'menu') return;
  drawBackground(now);
  drawWalls();
  drawPellets(now);
  state.ghosts.forEach((g) => drawGhost(g));
  drawHero(now);
  drawHUD(now);
}

function frame(now: number): void {
  if (!state.lastFrame) state.lastFrame = now;
  const dtMs = Math.min(40, now - state.lastFrame);
  state.lastFrame = now;
  update(dtMs, now);
  render(now);
  requestAnimationFrame(frame);
}

function showOverlay(html: string): void {
  overlay.innerHTML = html;
}

function showMenu(): void {
  showOverlay(`
    <div class="panel">
      <h1>PAC-MAN</h1>
      <p>INSERT COIN • SELECT DIFFICULTY</p>
      <div class="btn-row">
        <button data-difficulty="easy">Easy</button>
        <button data-difficulty="normal">Normal</button>
        <button data-difficulty="hard">Hard</button>
      </div>
      <p class="sub">Grid Movement • BFS Ghost AI • Q to Menu</p>
    </div>
  `);

  overlay.querySelectorAll<HTMLButtonElement>('button[data-difficulty]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.difficulty as Difficulty['key'];
      startGame(key);
    });
  });
}

window.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key.toLowerCase() === 'q') {
    backToMenu();
    return;
  }

  if (state.screen !== 'playing' || !state.hero) return;
  const map: Record<string, Dir> = {
    ArrowUp: 'U',
    ArrowDown: 'D',
    ArrowLeft: 'L',
    ArrowRight: 'R'
  };
  const dir = map[event.key];
  if (dir) {
    state.hero.nextDir = dir;
  }
});

showMenu();
requestAnimationFrame(frame);
