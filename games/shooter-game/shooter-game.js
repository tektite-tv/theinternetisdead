const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// --- UI ---
const ui = {
  kills: document.getElementById("kills"),
  deaths: document.getElementById("deaths"),
  health: document.getElementById("health"),
  restart: document.getElementById("restart")
};

// --- MENU SYSTEM ---
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const optionsBtn = document.getElementById("optionsBtn");
const optionsMenu = document.getElementById("optionsMenu");
const backBtn = document.getElementById("backBtn");
const bgSelect = document.getElementById("bgSelect");

let backgroundColor = "#000";
document.getElementById("ui").classList.add("hidden");

startBtn.onclick = () => {
  menu.classList.add("hidden");
  document.getElementById("ui").classList.remove("hidden");
  gameRunning = true;
  spawnEnemyWave(5);
};

optionsBtn.onclick = () => {
  optionsMenu.classList.remove("hidden");
  startBtn.style.display = "none";
  optionsBtn.style.display = "none";
};

backBtn.onclick = () => {
  optionsMenu.classList.add("hidden");
  startBtn.style.display = "inline-block";
  optionsBtn.style.display = "inline-block";
};

bgSelect.onchange = () => {
  const val = bgSelect.value;
  const colors = {
    black: "#000",
    green: "#002b00",
    blue: "#001133",
    purple: "#150021"
  };
  backgroundColor = colors[val] || "#000";
};

// --- GAME VARIABLES ---
const basePath = "/media/images/gifs/";
const enemyFiles = [
  "dancing-guy.gif", "dancingzoidberg.gif", "dragon.gif", "eyes.gif",
  "fatspiderman.gif", "firework.gif", "frog.gif", "keyboard_smash.gif", "skeleton.gif"
];

let imagesLoaded = false;
let enemyImages = {};
let playerImg, bossImg;
let gameRunning = false;
let bossActive = false;
let bossDefeated = false;

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}

Promise.all([
  loadImage(basePath + "bananarama.gif"),
  loadImage(basePath + "180px-NO_U_cycle.gif"),
  ...enemyFiles.map(f => loadImage(basePath + f))
]).then(loaded => {
  playerImg = loaded[0];
  bossImg = loaded[1];
  enemyFiles.forEach((f, i) => (enemyImages[f] = loaded[i + 2]));
  imagesLoaded = true;
  init();
});

const enemies = [];
let bullets = [];
let kills = 0;
let deaths = 0;
let health = 100;
let stamina = 100;
let gameOver = false;
let frameCount = 0;
let wave = 1;
let boss = null;

// --- PUSHBACK SYSTEM ---
let pushCharges = 3;
let pushCooldown = false;
let cooldownTimer = 0;

// controls
const keys = { w: false, a: false, s: false, d: false, space: false };
window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = true;
});
window.addEventListener("keyup", e => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = false;
});
ui.restart.onclick = resetGame;

// player and aim
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  speed: 4,
  size: 64
};
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let aimAngle = 0;

// mouse aim + shoot
canvas.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});
canvas.addEventListener("mousedown", () => {
  if (!gameOver && imagesLoaded && gameRunning) {
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    shootBullet(angle);
  }
});

// --- ENEMY + BULLET LOGIC ---
function spawnEnemyWave(count) {
  for (let i = 0; i < count; i++) spawnEnemy();
}

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = Math.random() * canvas.width; y = -50; }
  if (side === 1) { x = canvas.width + 50; y = Math.random() * canvas.height; }
  if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 50; }
  if (side === 3) { x = -50; y = Math.random() * canvas.height; }

  const size = Math.random() * 40 + 40;
  const hp = size * (0.4 + wave * 0.1);
  const speed = 0.8 + Math.random() * 0.5 + wave * 0.1;
  const file = enemyFiles[Math.floor(Math.random() * enemyFiles.length)];
  enemies.push({ x, y, size, speed, img: enemyImages[file], health: hp });
}

function shootBullet(angle) {
  bullets.push({
    x: player.x,
    y: player.y,
    angle,
    speed: 12,
    life: 60
  });
  aimAngle = angle;
}

// --- BOSS LOGIC ---
function spawnBoss() {
  bossActive = true;
  boss = {
    x: canvas.width / 2,
    y: canvas.height / 3,
    size: 180,
    speed: 1.2,
    img: bossImg,
    health: 1000,
    isBoss: true,
    orbiters: []
  };

  for (let i = 0; i < 4; i++) {
    boss.orbiters.push({
      angle: (Math.PI / 2) * i,
      radius: 150,
      size: 90,
      speed: 0.1,
      img: bossImg,
      health: 150
    });
  }
}

// --- PUSHBACK ---
function pushBackEnemies() {
  if (pushCooldown || pushCharges <= 0) return;

  pushCharges--;
  stamina = Math.max(0, stamina - 30);

  enemies.forEach(e => {
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 400) {
      const push = 20 - dist / 20;
      e.x += (dx / dist) * push * 8;
      e.y += (dy / dist) * push * 8;
    }
  });

  // visual flash
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (pushCharges === 0) {
    pushCooldown = true;
    cooldownTimer = 300; // frames (~5 seconds)
  }
}

// --- UPDATE ---
function update() {
  if (!gameRunning || gameOver || bossDefeated || !imagesLoaded) return;
  frameCount++;

  // player movement
  let dx = 0, dy = 0;
  if (keys.w) dy -= player.speed;
  if (keys.s) dy += player.speed;
  if (keys.a) dx -= player.speed;
  if (keys.d) dx += player.speed;
  player.x = Math.max(0, Math.min(canvas.width, player.x + dx));
  player.y = Math.max(0, Math.min(canvas.height, player.y + dy));

  // pushback ability
  if (keys.space) {
    pushBackEnemies();
    keys.space = false;
  }

  // stamina regen
  if (!pushCooldown && stamina < 100) stamina += 0.1;
  if (pushCooldown) {
    cooldownTimer--;
    if (cooldownTimer <= 0) {
      pushCooldown = false;
      pushCharges = 3;
    }
  }

  aimAngle = Math.atan2(mouseY - player.y, mouseX - player.x);

  // bullets
  bullets.forEach(b => {
    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;
    b.life--;
  });
  bullets = bullets.filter(b => b.life > 0);

  if (enemies.length === 0 && kills < 50) spawnEnemyWave(5 + wave * 2);
  if (kills >= wave * 10 && kills < 50) {
    wave++;
    spawnEnemyWave(5 + wave * 3);
  }
  if (!bossActive && kills >= 50) spawnBoss();

  enemies.forEach((e, i) => {
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;

    const dist = Math.hypot(player.x - e.x, player.y - e.y);
    if (dist < e.size / 2 + player.size / 2) {
      health -= 0.5;
      if (health <= 0) endGame();
    }

    bullets.forEach((b, bi) => {
      const hitDist = Math.hypot(b.x - e.x, b.y - e.y);
      if (hitDist < e.size / 2) {
        e.health -= 20;
        bullets.splice(bi, 1);
        if (e.health <= 0) {
          kills++;
          enemies.splice(i, 1);
        }
      }
    });
  });

  if (bossActive && boss) {
    boss.x += Math.sin(frameCount / 60) * 2;
    boss.y += Math.cos(frameCount / 80) * 1.5;

    boss.orbiters.forEach(o => {
      o.angle += o.speed;
      o.x = boss.x + Math.cos(o.angle) * o.radius;
      o.y = boss.y + Math.sin(o.angle) * o.radius;
      bullets.forEach((b, bi) => {
        const hit = Math.hypot(b.x - o.x, b.y - o.y);
        if (hit < o.size / 2) {
          o.health -= 20;
          bullets.splice(bi, 1);
        }
      });
    });

    boss.orbiters = boss.orbiters.filter(o => o.health > 0);

    bullets.forEach((b, bi) => {
      const hitDist = Math.hypot(b.x - boss.x, b.y - boss.y);
      if (hitDist < boss.size / 2) {
        boss.health -= 10;
        bullets.splice(bi, 1);
        if (boss.health <= 0) {
          bossDefeated = true;
          bossActive = false;
        }
      }
    });
  }

  ui.kills.textContent = kills;
  ui.deaths.textContent = deaths;
  ui.health.textContent = Math.max(0, Math.floor(health));
}

// --- DRAW ---
function drawBar(label, x, y, value, max, color) {
  const width = 200;
  const height = 15;
  ctx.fillStyle = "black";
  ctx.fillRect(x - 2, y - 2, width + 4, height + 4);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, (value / max) * width, height);
  ctx.strokeStyle = "#00ff99";
  ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
  ctx.fillStyle = "#00ff99";
  ctx.font = "12px monospace";
  ctx.fillText(label, x, y - 4);
}

function drawBossHealthBar() {
  if (!bossActive || !boss) return;
  const barWidth = canvas.width * 0.6;
  const barHeight = 20;
  const x = (canvas.width - barWidth) / 2;
  const y = 30;
  const pct = Math.max(0, boss.health / 1000);

  ctx.fillStyle = "black";
  ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
  ctx.fillStyle = "red";
  ctx.fillRect(x, y, barWidth * pct, barHeight);
  ctx.strokeStyle = "#00ff99";
  ctx.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
}

function drawArrow(x, y, angle) {
  const orbitRadius = player.size * 0.8;
  const arrowLength = 25;
  const arrowWidth = 16;
  const ax = x + Math.cos(angle) * orbitRadius;
  const ay = y + Math.sin(angle) * orbitRadius;

  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(arrowLength, 0);
  ctx.lineTo(0, arrowWidth / 2);
  ctx.lineTo(0, -arrowWidth / 2);
  ctx.closePath();
  ctx.fillStyle = "#ff66cc";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#ff66cc";
  ctx.fill();
  ctx.restore();
}

function draw() {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!imagesLoaded) {
    ctx.fillStyle = "#00ff99";
    ctx.font = "30px monospace";
    ctx.fillText("Loading GIFs...", canvas.width / 2 - 100, canvas.height / 2);
    return;
  }

  if (!gameRunning) return;

  ctx.drawImage(playerImg, player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
  drawArrow(player.x, player.y, aimAngle);

  drawBar("HEALTH", 20, 20, health, 100, "#ff3333");
  drawBar("STAMINA", 20, 45, stamina, 100, pushCooldown ? "#333333" : "#00ccff");

  bullets.forEach(b => {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff66cc";
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  enemies.forEach(e => {
    if (e.img) ctx.drawImage(e.img, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
  });

  if (bossActive && boss) {
    ctx.drawImage(boss.img, boss.x - boss.size / 2, boss.y - boss.size / 2, boss.size, boss.size);
    boss.orbiters.forEach(o => {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.angle * 10);
      ctx.drawImage(o.img, -o.size / 2, -o.size / 2, o.size, o.size);
      ctx.restore();
    });
    drawBossHealthBar();
  }

  if (bossDefeated) {
    ctx.fillStyle = "#00ff99";
    ctx.font = "80px Impact";
    ctx.fillText("YOU WIN", canvas.width / 2 - 200, canvas.height / 2);
  } else if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "80px Impact";
    ctx.fillText("YOU DIED", canvas.width / 2 - 180, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function endGame() {
  if (!gameOver) {
    gameOver = true;
    deaths++;
    ui.deaths.textContent = deaths;
  }
}

function resetGame() {
  enemies.length = 0;
  bullets = [];
  kills = 0;
  health = 100;
  stamina = 100;
  gameOver = false;
  bossActive = false;
  bossDefeated = false;
  pushCharges = 3;
  pushCooldown = false;
  wave = 1;
  boss = null;
}

function init() {
  loop();
}
