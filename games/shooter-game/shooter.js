// Bananaman Shooter v0.6.2 — enemy GIF loader fix + Start button wiring
// Changes from previous version:
// - Fixed pause menu button IDs to match HTML (pauseResume, pauseRestart, pauseToMenu)
// - Wired up the main "Start Game" and "Boss Mode" buttons
// - Added enemy sprite loading from /media/images/gifs/index.json with graceful fallback

const bg = document.getElementById("bg");
const g = bg.getContext("2d");
const game = document.getElementById("game");
const ctx = game.getContext("2d");

// Canvas size
let W = innerWidth, H = innerHeight;
bg.width = game.width = W;
bg.height = game.height = H;
addEventListener("resize", () => {
  W = innerWidth; H = innerHeight;
  bg.width = game.width = W;
  bg.height = game.height = H;
});

// =========================
//  GLOBAL GAME STATE
// =========================
let state = "menu"; // "menu" | "playing" | "paused" | "dead"
let keys = {};
let mouse = { x: 0, y: 0, down: false };

let bullets = [];
let enemies = [];
let particles = [];

let kills = 0;
let wave = 1;
let damage = 0;
let elapsed = 0;

let spawnTimer = 0;
const baseSpawnInterval = 3;

let lastTime = 0;

// =========================
//  PLAYER
// =========================
const playerImg = new Image();
playerImg.src = "/media/images/gifs/bananarama.gif";
let playerLoaded = false;
playerImg.onload = () => { playerLoaded = true; };

const player = {
  x: W / 2,
  y: H / 2,
  size: 96,
  hp: 100,
  speed: 280,
  hitTimer: 0,
  invuln: 0
};

// =========================
//  ENEMY SPRITES
// =========================

// Default enemy sprite list. Will be replaced if index.json loads.
let enemyGifList = ["/media/images/gifs/bananaclone.gif"];

// Attempt to load enemy GIF list from /media/images/gifs/index.json
(function initEnemyGifList() {
  try {
    fetch("/media/images/gifs/index.json")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        let rawList = [];

        if (Array.isArray(data)) {
          rawList = data;
        } else if (data && Array.isArray(data.gifs)) {
          rawList = data.gifs;
        } else if (data && Array.isArray(data.files)) {
          rawList = data.files;
        } else if (data && typeof data === "object") {
          rawList = Object.values(data);
        }

        let list = [];
        for (const item of rawList) {
          if (typeof item === "string") {
            list.push(item);
          } else if (item && typeof item === "object") {
            if (typeof item.src === "string") list.push(item.src);
            else if (typeof item.url === "string") list.push(item.url);
            else if (typeof item.path === "string") list.push(item.path);
            else if (typeof item.name === "string") list.push(item.name);
          }
        }

        list = list
          .map(name => {
            if (typeof name !== "string") return null;
            if (name.startsWith("/")) return name;
            return "/media/images/gifs/" + name;
          })
          .filter(Boolean);

        if (list.length) {
          enemyGifList = list;
        }
      })
      .catch(() => {
        // If fetch fails or JSON is weird, keep fallback.
      });
  } catch (e) {
    // fetch might not exist in some environments; ignore.
  }
})();

function makeEnemySprite() {
  const img = new Image();
  const src = enemyGifList[Math.floor(Math.random() * enemyGifList.length)];
  img.src = src;
  return img;
}

// =========================
//  AUDIO
// =========================
const hitSound = new Audio("/media/audio/hitmarker.mp3");
const oofSound = new Audio("/media/audio/oof.mp3");
const bgMusic = new Audio("/media/audio/spaceinvaders.mp3");
const linkYell = new Audio("/media/audio/link-yell.mp3");

bgMusic.loop = true;
bgMusic.volume = 0.6;

// =========================
//  DOM ELEMENTS
// =========================
const killsEl = document.getElementById("kills");
const waveEl = document.getElementById("wave");
const damageEl = document.getElementById("damage");
const timerEl = document.getElementById("timer");
const healthFill = document.getElementById("healthfill");
const healthText = document.getElementById("healthtext");

const menu = document.getElementById("menu");
const deathOverlay = document.getElementById("deathOverlay");
const restartBtn = document.getElementById("restartBtn");

const pauseOverlay = document.getElementById("pauseOverlay");
const pauseResumeBtn = document.getElementById("pauseResume");
const pauseRestartBtn = document.getElementById("pauseRestart");
const pauseMenuBtn = document.getElementById("pauseToMenu");

const startBtn = document.getElementById("start");
const bossBtn = document.getElementById("bossMode");

// =========================
//  GRID BACKGROUND
// =========================
let gridOffsetX = 0;
let gridOffsetY = 0;
const gridSpacing = 40;
let gridStatic = true;

function drawGrid(dt) {
  g.clearRect(0, 0, W, H);

  if (!gridStatic && typeof dt === "number") {
    gridOffsetX += dt * 20;
    gridOffsetY += dt * 10;
  }

  const startX = -((gridOffsetX % gridSpacing) + gridSpacing);
  const startY = -((gridOffsetY % gridSpacing) + gridSpacing);

  for (let x = startX; x < W + gridSpacing; x += gridSpacing) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, H);
    g.stroke();
  }
  for (let y = startY; y < H + gridSpacing; y += gridSpacing) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
}

// Initial grid render
drawGrid();

// =========================
//  INPUT HANDLERS
// =========================
addEventListener("mousemove", e => {
  const rect = game.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

addEventListener("mousedown", () => {
  mouse.down = true;
});

addEventListener("mouseup", () => {
  mouse.down = false;
});

addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (e.key === "Escape") {
    if (state === "playing") {
      pauseGame();
    } else if (state === "paused") {
      resumeGame();
    }
  }
});

addEventListener("keyup", e => {
  const k = e.key.toLowerCase();
  keys[k] = false;
});

// =========================
//  UI HELPERS
// =========================
function updateUI() {
  if (killsEl) killsEl.textContent = kills;
  if (waveEl) waveEl.textContent = wave;
  if (damageEl) damageEl.textContent = damage;
  if (timerEl) timerEl.textContent = elapsed.toFixed(1) + "s";
}

function updateHealth() {
  const hp = Math.max(0, Math.round(player.hp));
  if (healthFill) healthFill.style.width = hp + "%";
  if (healthText) healthText.textContent = hp + "%";
}

// =========================
//  BULLETS
// =========================
let shootCooldown = 0;

function shoot() {
  if (state !== "playing") return;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const speed = 600;
  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1.2
  });
}

// =========================
//  ENEMIES
// =========================
function makeEnemy() {
  const img = makeEnemySprite();
  const size = 40 + Math.random() * 100;

  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) {
    x = Math.random() * W; y = -60;
  } else if (side === 1) {
    x = W + 60; y = Math.random() * H;
  } else if (side === 2) {
    x = Math.random() * W; y = H + 60;
  } else {
    x = -60; y = Math.random() * H;
  }

  const speed = 80 + Math.random() * 60;
  const hp = 2 + Math.random() * 3;

  return {
    x, y,
    img,
    size,
    speed,
    hp,
    fade: 1,
    hitTimer: 0
  };
}

function spawnWave() {
  const count = 5 + wave * 2;
  for (let i = 0; i < count; i++) {
    enemies.push(makeEnemy());
  }
}

function updateEnemies(dt) {
  for (const e of enemies) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.x += (dx / dist) * e.speed * dt;
    e.y += (dy / dist) * e.speed * dt;

    if (e.hitTimer > 0) {
      e.hitTimer -= dt;
    }
  }
}

function drawEnemies() {
  for (const e of enemies) {
    ctx.save();
    ctx.globalAlpha = e.fade;

    const sx = e.x - e.size / 2;
    const sy = e.y - e.size / 2;

    if (e.img && e.img.complete) {
      ctx.drawImage(e.img, sx, sy, e.size, e.size);
    } else {
      ctx.fillStyle = "lime";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// =========================
//  PARTICLES
// =========================
function spawnParticles(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 300,
      vy: (Math.random() - 0.5) * 300,
      life: 0.6 + Math.random() * 0.4,
      color
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / 0.8);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// =========================
//  COLLISIONS
// =========================
function checkCollisions() {
  // bullets vs enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      if (dx * dx + dy * dy < (e.size / 2 + 4) ** 2) {
        bullets.splice(j, 1);
        e.hp--;
        damage += 10;

        const marker = hitSound.cloneNode();
        marker.volume = 0.5;
        marker.playbackRate = 0.9 + Math.random() * 0.2;
        marker.play().catch(() => {});

        e.hitTimer = 0.2;
        if (e.hp <= 0) {
          enemies.splice(i, 1);
          kills++;
          spawnParticles(e.x, e.y, "lime");

          if (enemies.length === 0) {
            wave++;
            spawnWave();
          }
          break;
        }
      }
    }
  }

  // enemies vs player
  for (const e of enemies) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    if (dx * dx + dy * dy < (player.size / 2 + e.size / 2) ** 2) {
      if (player.invuln <= 0) {
        player.hp -= 10;
        player.invuln = 1.0;
        player.hitTimer = 0.3;
        damage += 5;

        const pain = oofSound.cloneNode();
        pain.volume = 0.7;
        pain.playbackRate = 0.95 + Math.random() * 0.1;
        pain.play().catch(() => {});

        updateHealth();
        if (player.hp <= 0) {
          die();
        }
      }
    }
  }
}

// =========================
//  PLAYER UPDATE / DRAW
// =========================
function updatePlayer(dt) {
  if (state !== "playing") return;

  let vx = 0;
  let vy = 0;
  if (keys["w"] || keys["arrowup"]) vy -= 1;
  if (keys["s"] || keys["arrowdown"]) vy += 1;
  if (keys["a"] || keys["arrowleft"]) vx -= 1;
  if (keys["d"] || keys["arrowright"]) vx += 1;

  const len = Math.hypot(vx, vy) || 1;
  vx /= len;
  vy /= len;

  player.x += vx * player.speed * dt;
  player.y += vy * player.speed * dt;

  player.x = Math.max(player.size / 2, Math.min(W - player.size / 2, player.x));
  player.y = Math.max(player.size / 2, Math.min(H - player.size / 2, player.y));

  if (player.invuln > 0) player.invuln -= dt;
  if (player.hitTimer > 0) player.hitTimer -= dt;
}

function drawPlayer() {
  ctx.save();
  if (player.invuln > 0) {
    const t = performance.now() * 0.02;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t);
  }

  const sx = player.x - player.size / 2;
  const sy = player.y - player.size / 2;

  if (playerLoaded) {
    ctx.drawImage(playerImg, sx, sy, player.size, player.size);
  } else {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// =========================
//  MAIN LOOP
// =========================
function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;

  if (state === "playing") {
    elapsed += dt;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnWave();
      spawnTimer = baseSpawnInterval;
    }

    shootCooldown -= dt;
    if (mouse.down && shootCooldown <= 0) {
      shoot();
      shootCooldown = 0.15;
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateParticles(dt);
    checkCollisions();
    updateUI();
  }

  drawGrid(dt);
  ctx.clearRect(0, 0, W, H);
  drawParticles();
  drawEnemies();
  drawPlayer();

  // bullets on top
  ctx.fillStyle = "cyan";
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// =========================
//  GAME STATE TRANSITIONS
// =========================
function resetGameCore() {
  kills = 0;
  wave = 1;
  damage = 0;
  elapsed = 0;
  spawnTimer = 0;

  bullets.length = 0;
  enemies.length = 0;
  particles.length = 0;

  player.x = W / 2;
  player.y = H / 2;
  player.hp = 100;
  player.invuln = 0;
  player.hitTimer = 0;

  updateHealth();
  updateUI();
}

function startGame(isBossMode) {
  state = "playing";
  if (menu) menu.style.display = "none";
  if (deathOverlay) deathOverlay.classList.remove("visible");
  if (pauseOverlay) pauseOverlay.classList.remove("visible");

  resetGameCore();

  if (isBossMode) {
    wave = 6;
  }

  enemies.length = 0;
  spawnWave();

  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {});

  gridStatic = !isBossMode;
}

function die() {
  state = "dead";
  bgMusic.pause();
  bgMusic.currentTime = 0;

  const deathSound = linkYell.cloneNode();
  deathSound.volume = 0.8;
  deathSound.play().catch(() => {});

  if (deathOverlay) deathOverlay.classList.add("visible");
}

function pauseGame() {
  if (state !== "playing") return;
  state = "paused";
  bgMusic.pause();
  if (pauseOverlay) pauseOverlay.classList.add("visible");
}

function resumeGame() {
  if (state !== "paused") return;
  state = "playing";
  bgMusic.play().catch(() => {});
  if (pauseOverlay) pauseOverlay.classList.remove("visible");
}

// =========================
//  BUTTON WIRING
// =========================
if (startBtn) {
  startBtn.onclick = () => startGame(false);
}

if (bossBtn) {
  bossBtn.onclick = () => startGame(true);
}

if (restartBtn) {
  // "Return to Menu" from death screen
  restartBtn.onclick = () => {
    if (deathOverlay) deathOverlay.classList.remove("visible");
    state = "menu";
    if (menu) menu.style.display = "flex";
    bgMusic.pause();
    bgMusic.currentTime = 0;
    gridStatic = true;
    drawGrid();
  };
}

if (pauseResumeBtn) {
  pauseResumeBtn.onclick = () => {
    resumeGame();
  };
}

if (pauseRestartBtn) {
  pauseRestartBtn.onclick = () => {
    if (pauseOverlay) pauseOverlay.classList.remove("visible");
    startGame(false);
  };
}

if (pauseMenuBtn) {
  pauseMenuBtn.onclick = () => {
    state = "menu";
    if (pauseOverlay) pauseOverlay.classList.remove("visible");
    if (menu) menu.style.display = "flex";
    bgMusic.pause();
    bgMusic.currentTime = 0;
    gridStatic = true;
    drawGrid();
  };
}

// Start with menu visible and static grid
gridStatic = true;
drawGrid();
