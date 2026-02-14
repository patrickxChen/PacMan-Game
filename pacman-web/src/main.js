import './style.css';

const tileSize = 32;
const rowCount = 21;
const columnCount = 19;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;

const mapRows = [
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

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="game-shell">
    <canvas id="game" width="${boardWidth}" height="${boardHeight}"></canvas>
    <div id="overlay" class="overlay"></div>
  </div>
`;

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');

const directionVectors = {
  U: { x: 0, y: -1 },
  D: { x: 0, y: 1 },
  L: { x: -1, y: 0 },
  R: { x: 1, y: 0 }
};

const difficultyPresets = {
  easy: { label: 'Easy', pacmanSpeed: 95, ghostSpeed: 75, lives: 4 },
  normal: { label: 'Normal', pacmanSpeed: 110, ghostSpeed: 95, lives: 3 },
  hard: { label: 'Hard', pacmanSpeed: 130, ghostSpeed: 115, lives: 2 }
};

const state = {
  screen: 'menu',
  difficulty: difficultyPresets.normal,
  score: 0,
  lives: 3,
  introUntil: 0,
  lastTime: 0,
  hero: null,
  ghosts: [],
  walls: [],
  pellets: [],
  ghostHouseY: 9 * tileSize
};

function createEntity(x, y, speed, color = '#fff') {
  return {
    x,
    y,
    startX: x,
    startY: y,
    size: tileSize,
    speed,
    dir: 'L',
    intendedDir: 'L',
    color
  };
}

function resetBoard() {
  state.walls = [];
  state.pellets = [];
  state.ghosts = [];

  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < columnCount; c++) {
      const ch = mapRows[r][c];
      const x = c * tileSize;
      const y = r * tileSize;

      if (ch === 'X') {
        state.walls.push({ x, y, w: tileSize, h: tileSize });
      } else if (ch === ' ') {
        state.pellets.push({ x: x + tileSize / 2, y: y + tileSize / 2, r: 3 });
      } else if (ch === 'P') {
        state.hero = createEntity(x, y, state.difficulty.pacmanSpeed, '#ffd83d');
        state.hero.dir = 'R';
        state.hero.intendedDir = 'R';
      } else if ('bopr'.includes(ch)) {
        const colorMap = { b: '#39f0ff', o: '#ffae4a', p: '#ff74da', r: '#ff6363' };
        const ghost = createEntity(x, y, state.difficulty.ghostSpeed, colorMap[ch]);
        ghost.dir = randomDir();
        ghost.intendedDir = ghost.dir;
        state.ghosts.push(ghost);
      }
    }
  }
}

function startGame(difficultyKey) {
  state.difficulty = difficultyPresets[difficultyKey];
  state.score = 0;
  state.lives = state.difficulty.lives;
  state.screen = 'playing';
  resetBoard();
  state.introUntil = performance.now() + 1200;
  showOverlay('');
}

function backToMenu() {
  state.screen = 'menu';
  showMenu();
}

function randomDir() {
  const dirs = ['U', 'D', 'L', 'R'];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

function collidesWall(x, y, size) {
  return state.walls.some((wall) => {
    return (
      x < wall.x + wall.w &&
      x + size > wall.x &&
      y < wall.y + wall.h &&
      y + size > wall.y
    );
  });
}

function canStep(entity, dir, step = 2) {
  const vec = directionVectors[dir];
  const testX = entity.x + vec.x * step;
  const testY = entity.y + vec.y * step;
  return !collidesWall(testX, testY, entity.size);
}

function moveByDirection(entity, dt) {
  const vec = directionVectors[entity.dir];
  const step = entity.speed * dt;
  const nextX = entity.x + vec.x * step;
  const nextY = entity.y + vec.y * step;
  if (!collidesWall(nextX, nextY, entity.size)) {
    entity.x = nextX;
    entity.y = nextY;
    return true;
  }
  return false;
}

function trySwitchDirection(entity, dir) {
  if (canStep(entity, dir, 3)) {
    entity.dir = dir;
    return true;
  }
  return false;
}

function availableDirections(entity) {
  return ['U', 'D', 'L', 'R'].filter((dir) => canStep(entity, dir, 3));
}

function moveEntity(entity, dt) {
  if (entity.intendedDir) {
    trySwitchDirection(entity, entity.intendedDir);
  }

  const moved = moveByDirection(entity, dt);
  if (!moved && entity.intendedDir && entity.intendedDir !== entity.dir) {
    if (trySwitchDirection(entity, entity.intendedDir)) {
      moveByDirection(entity, dt);
    }
  }
}

function updateGhost(ghost, dt) {
  if (Math.abs(ghost.y - state.ghostHouseY) < 2 && ghost.dir !== 'U' && ghost.dir !== 'D') {
    trySwitchDirection(ghost, 'U');
  }

  const moved = moveByDirection(ghost, dt);
  if (!moved) {
    const opposite = { U: 'D', D: 'U', L: 'R', R: 'L' }[ghost.dir];
    const options = availableDirections(ghost).filter((dir) => dir !== opposite);
    const fallback = options.length ? options : availableDirections(ghost);
    if (fallback.length) {
      ghost.dir = fallback[Math.floor(Math.random() * fallback.length)];
      moveByDirection(ghost, dt);
    }
    return;
  }

  if (Math.random() < 0.012) {
    const opposite = { U: 'D', D: 'U', L: 'R', R: 'L' }[ghost.dir];
    const options = availableDirections(ghost).filter((dir) => dir !== opposite);
    if (options.length) {
      ghost.dir = options[Math.floor(Math.random() * options.length)];
    }
  }
}

function intersects(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

function update(dt, now) {
  if (state.screen !== 'playing') return;
  if (now < state.introUntil) return;

  moveEntity(state.hero, dt);

  state.ghosts.forEach((ghost) => updateGhost(ghost, dt));

  state.pellets = state.pellets.filter((pellet) => {
    const px = state.hero.x + tileSize / 2;
    const py = state.hero.y + tileSize / 2;
    const eaten = Math.hypot(px - pellet.x, py - pellet.y) < 12;
    if (eaten) state.score += 10;
    return !eaten;
  });

  const hitGhost = state.ghosts.some((ghost) => intersects(state.hero, ghost));
  if (hitGhost) {
    state.lives -= 1;
    if (state.lives <= 0) {
      state.screen = 'gameover';
      showOverlay(`<div class="panel"><h2>GAME OVER</h2><p>Score: ${state.score}</p><button id="menuBtn">Back to Menu</button></div>`);
      document.querySelector('#menuBtn')?.addEventListener('click', backToMenu);
      return;
    }

    state.hero.x = state.hero.startX;
    state.hero.y = state.hero.startY;
    state.ghosts.forEach((ghost) => {
      ghost.x = ghost.startX;
      ghost.y = ghost.startY;
      ghost.dir = randomDir();
    });
    state.introUntil = now + 900;
  }

  if (state.pellets.length === 0) {
    resetBoard();
    state.introUntil = now + 900;
  }
}

function drawBackground(now) {
  const grad = ctx.createLinearGradient(0, 0, 0, boardHeight);
  grad.addColorStop(0, '#090b22');
  grad.addColorStop(1, '#1e0b44');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, boardWidth, boardHeight);

  ctx.strokeStyle = 'rgba(0,255,255,0.1)';
  for (let y = 0; y < boardHeight; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(boardWidth, y);
    ctx.stroke();
  }

  const scanY = Math.floor((now / 8) % boardHeight);
  ctx.fillStyle = 'rgba(102,255,255,0.15)';
  ctx.fillRect(0, scanY, boardWidth, 3);
}

function drawWalls() {
  state.walls.forEach((wall) => {
    ctx.fillStyle = '#16398f';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = 'rgba(114,240,255,0.65)';
    ctx.strokeRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);
  });
}

function drawPellets(now) {
  const pulse = 2 + Math.sin(now / 120) * 0.7;
  state.pellets.forEach((p) => {
    ctx.fillStyle = 'rgba(255,240,170,0.35)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe6a0';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawGhost(ghost) {
  const x = ghost.x;
  const y = ghost.y;
  const s = ghost.size;

  ctx.fillStyle = ghost.color;
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

function drawHero(now) {
  const mouth = (Math.sin(now / 90) + 1) * 0.22 + 0.08;
  const centerX = state.hero.x + tileSize / 2;
  const centerY = state.hero.y + tileSize / 2;

  const angleMap = {
    R: 0,
    L: Math.PI,
    U: -Math.PI / 2,
    D: Math.PI / 2
  };
  const base = angleMap[state.hero.dir] ?? 0;

  ctx.fillStyle = '#ffd63d';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, tileSize / 2.2, base + mouth, base + (Math.PI * 2 - mouth));
  ctx.closePath();
  ctx.fill();
}

function drawHUD(now) {
  ctx.fillStyle = 'rgba(6,10,28,0.82)';
  ctx.fillRect(10, 8, boardWidth - 20, 30);
  ctx.strokeStyle = 'rgba(122,247,255,0.6)';
  ctx.strokeRect(10, 8, boardWidth - 20, 30);

  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#ffe766';
  ctx.fillText(`SCORE ${state.score}`, 22, 29);
  ctx.fillStyle = '#9df0ff';
  ctx.fillText('Q MENU', boardWidth / 2 - 32, 29);

  for (let i = 0; i < state.lives; i++) {
    ctx.fillStyle = '#ffd63d';
    ctx.beginPath();
    ctx.arc(boardWidth - 26 - i * 18, 22, 6, 0.2, Math.PI * 2 - 0.2);
    ctx.lineTo(boardWidth - 26 - i * 18, 22);
    ctx.fill();
  }

  if (state.screen === 'playing' && performance.now() < state.introUntil) {
    const alpha = 0.8 + Math.sin(now / 140) * 0.2;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(boardWidth / 2 - 120, boardHeight / 2 - 34, 240, 60);
    ctx.strokeStyle = 'rgba(255,230,90,0.8)';
    ctx.strokeRect(boardWidth / 2 - 120, boardHeight / 2 - 34, 240, 60);
    ctx.fillStyle = '#ffe04d';
    ctx.font = 'bold 34px monospace';
    ctx.fillText('READY!', boardWidth / 2 - 70, boardHeight / 2 + 10);
  }
}

function render(now) {
  if (state.screen === 'menu') return;
  drawBackground(now);
  drawWalls();
  drawPellets(now);
  state.ghosts.forEach(drawGhost);
  drawHero(now);
  drawHUD(now);
}

function loop(now) {
  const dt = Math.min((now - state.lastTime) / 1000, 0.035);
  state.lastTime = now;
  update(dt, now);
  render(now);
  requestAnimationFrame(loop);
}

function showOverlay(html) {
  overlay.innerHTML = html;
}

function showMenu() {
  showOverlay(`
    <div class="panel">
      <h1>PAC-MAN</h1>
      <p>INSERT COIN • SELECT DIFFICULTY</p>
      <div class="btn-row">
        <button data-difficulty="easy">Easy</button>
        <button data-difficulty="normal">Normal</button>
        <button data-difficulty="hard">Hard</button>
      </div>
      <p class="sub">Arrow Keys to Move • Q to Menu</p>
    </div>
  `);

  overlay.querySelectorAll('button[data-difficulty]').forEach((button) => {
    button.addEventListener('click', () => {
      startGame(button.dataset.difficulty);
    });
  });
}

window.addEventListener('keydown', (event) => {
  const keyMap = {
    ArrowUp: 'U',
    ArrowDown: 'D',
    ArrowLeft: 'L',
    ArrowRight: 'R'
  };

  if (event.key.toLowerCase() === 'q') {
    backToMenu();
    return;
  }

  if (state.screen !== 'playing' || !state.hero) return;
  const nextDir = keyMap[event.key];
  if (nextDir) {
    state.hero.intendedDir = nextDir;
  }
});

showMenu();
requestAnimationFrame(loop);
