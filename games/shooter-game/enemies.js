// enemies.js
// basic enemy spawning, movement, and death by bullet

const enemies = [];

class Enemy {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.speed = speed;
    this.color = "#00ff99";
    this.health = 1;
  }

  update(player) {
    const angle = Math.atan2(player.y + player.h / 2 - this.y, player.x + player.w / 2 - this.x);
    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// === Spawn Function ===
function spawnEnemy(canvas) {
  const edge = Math.floor(Math.random() * 4);
  let x, y;

  if (edge === 0) { // top
    x = Math.random() * canvas.width;
    y = -20;
  } else if (edge === 1) { // bottom
    x = Math.random() * canvas.width;
    y = canvas.height + 20;
  } else if (edge === 2) { // left
    x = -20;
    y = Math.random() * canvas.height;
  } else { // right
    x = canvas.width + 20;
    y = Math.random() * canvas.height;
  }

  const speed = 1.5 + Math.random() * 1.5;
  enemies.push(new Enemy(x, y, speed));
}

// === Update & Draw ===
function updateEnemies(player, bullets, canvas) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.update(player);

    // bullet collision
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < e.radius + b.radius) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }

    // remove if off-screen weirdly (just in case)
    if (e.x < -50 || e.x > canvas.width + 50 || e.y < -50 || e.y > canvas.height + 50) {
      enemies.splice(i, 1);
    }
  }
}

function drawEnemies(ctx) {
  enemies.forEach(e => e.draw(ctx));
}

// === Auto-Spawn Timer ===
setInterval(() => {
  if (typeof canvas !== "undefined" && gameRunning) {
    spawnEnemy(canvas);
  }
}, 2000); // every 2 seconds
