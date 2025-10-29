const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const ui = {
  kills: document.getElementById("kills"),
  deaths: document.getElementById("deaths"),
  health: document.getElementById("health"),
  restart: document.getElementById("restart")
};

// correct GIF directory
const basePath = "/media/images/gifs/";
const enemyFiles = [
  "dancing-guy.gif", "dancingzoidberg.gif", "dragon.gif", "eyes.gif",
  "fatspiderman.gif", "firework.gif", "frog.gif", "keyboard_smash.gif", "skeleton.gif"
];

// image loader
function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}

let imagesLoaded = false;
let enemyImages = {};
let playerImg;

Promise.all([
  loadImage(basePath + "bananarama.gif"),
  ...enemyFiles.map(f => loadImage(basePath + f))
]).then(loaded => {
  playerImg = loaded[0];
  enemyFiles.forEach((f, i) => (enemyImages[f] = loaded[i + 1]));
  imagesLoaded = true;
  init();
});

const enemies = [];
let bullets = [];
let kills = 0;
let deaths = 0;
let health = 100;
let gameOver = false;
let frameCount = 0;

// controls
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener("keydown", e => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", e => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });
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
  if (!gameOver && imagesLoaded) {
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    shootBullet(angle);
  }
});

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = Math.random() * canvas.width; y = -50; }
  if (side === 1) { x = canvas.width + 50; y = Math.random() * canvas.height; }
  if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 50; }
  if (side === 3) { x = -50; y = Math.random() * canvas.height; }

  const size = Math.random() * 40 + 40;
  const hp = size * 0.5;
  const file = enemyFiles[Math.floor(Math.random() * enemyFiles.length)];
  enemies.push({
    x, y, size, speed: 0.8 + Math.random() * 1.2,
    img: enemyImages[file],
    health: hp
  });
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

function update() {
  if (gameOver || !imagesLoaded) return;
  frameCount++;

  // player movement
  let dx = 0, dy = 0;
  if (keys.w) dy -= player.speed;
  if (keys.s) dy += player.speed;
  if (keys.a) dx -= player.speed;
  if (keys.d) dx += player.speed;
  player.x = Math.max(0, Math.min(canvas.width, player.x + dx));
  player.y = Math.max(0, Math.min(canvas.height, player.y + dy));

  // update aim
  aimAngle = Math.atan2(mouseY - player.y, mouseX - player.x);

  // update bullets
  bullets.forEach(b => {
    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;
    b.life--;
  });
  bullets = bullets.filter(b => b.life > 0 && b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);

  // enemies
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

  if (frameCount % 60 === 0 && enemies.length < 15) spawnEnemy();

  ui.kills.textContent = kills;
  ui.deaths.textContent = deaths;
  ui.health.textContent = Math.max(0, Math.floor(health));
}

function drawArrow(x, y, angle) {
  const orbitRadius = player.size * 0.8; // how far from player center
  const arrowLength = 25;
  const arrowWidth = 16;

  // compute orbit position
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
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!imagesLoaded) {
    ctx.fillStyle = "#00ff99";
    ctx.font = "30px monospace";
    ctx.fillText("Loading GIFs...", canvas.width / 2 - 100, canvas.height / 2);
    return;
  }

  // player (upright)
  ctx.drawImage(playerImg, player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);

  // draw arrow indicating aim direction
  drawArrow(player.x, player.y - player.size / 2 - 10, aimAngle);

  // bullets with glow
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

  // enemies
  enemies.forEach(e => {
    if (e.img) ctx.drawImage(e.img, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
  });

  if (gameOver) {
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
  gameOver = false;
}

function init() {
  loop();
}
