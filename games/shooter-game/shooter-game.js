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

// Base path for GIFs
const basePath = "/media/images/gifs/";
const enemyFiles = [
  "dancing-guy.gif", "dancingzoidberg.gif", "dragon.gif", "eyes.gif",
  "fatspiderman.gif", "firework.gif", "frog.gif", "keyboard_smash.gif", "skeleton.gif"
];

// Load all images properly
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

const keys = { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false };

window.addEventListener("keydown", e => {
  if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", e => {
  if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
});
ui.restart.onclick = resetGame;

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  speed: 4,
  size: 64,
  angle: 0,
  shootCooldown: 0
};

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
    speed: 10
  });
}

function update() {
  if (gameOver || !imagesLoaded) return;

  frameCount++;

  // Player movement
  let dx = 0, dy = 0;
  if (keys.w) dy -= player.speed;
  if (keys.s) dy += player.speed;
  if (keys.a) dx -= player.speed;
  if (keys.d) dx += player.speed;

  player.x += dx;
  player.y += dy;
  player.x = Math.max(0, Math.min(canvas.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height, player.y));

  // Shooting
  player.shootCooldown--;
  const aimX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const aimY = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if ((aimX !== 0 || aimY !== 0) && player.shootCooldown <= 0) {
    player.angle = Math.atan2(aimY, aimX);
    shootBullet(player.angle);
    player.shootCooldown = 10;
  }

  // Update bullets
  bullets.forEach(b => {
    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;
  });
  bullets = bullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);

  // Update enemies
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

  // Spawn new enemies
  if (frameCount % 60 === 0 && enemies.length < 15) spawnEnemy();

  // Update UI
  ui.kills.textContent = kills;
  ui.deaths.textContent = deaths;
  ui.health.textContent = Math.max(0, Math.floor(health));
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

  // Player
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.drawImage(playerImg, -player.size / 2, -player.size / 2, player.size, player.size);
  ctx.restore();

  // Bullets
  ctx.fillStyle = "#ff66cc";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Enemies
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
