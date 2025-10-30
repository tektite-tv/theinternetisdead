// enemies.js
// old-school global pattern so the browser stops whining

const enemies = [];

function Enemy(x, y, speed) {
  this.x = x;
  this.y = y;
  this.radius = 20;
  this.speed = speed;
  this.color = "#00ff99";

  this.update = function (player) {
    const angle = Math.atan2(
      player.y + player.h / 2 - this.y,
      player.x + player.w / 2 - this.x
    );
    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;
  };

  this.draw = function (ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  };
}

function spawnEnemy(canvas) {
  const edge = Math.floor(Math.random() * 4);
  let x, y;

  if (edge === 0) {
    x = Math.random() * canvas.width;
    y = -20;
  } else if (edge === 1) {
    x = Math.random() * canvas.width;
    y = canvas.height + 20;
  } else if (edge === 2) {
    x = -20;
    y = Math.random() * canvas.height;
  } else {
    x = canvas.width + 20;
    y = Math.random() * canvas.height;
  }

  const speed = 1.5 + Math.random() * 1.5;
  enemies.push(new Enemy(x, y, speed));
}

function updateEnemies(player, bullets, canvas) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.update(player);

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

    if (
      e.x < -50 ||
      e.x > canvas.width + 50 ||
      e.y < -50 ||
      e.y > canvas.height + 50
    ) {
      enemies.splice(i, 1);
    }
  }
}

function drawEnemies(ctx) {
  enemies.forEach(e => e.draw(ctx));
}

function startEnemySpawning(canvas, player, bullets) {
  setInterval(() => {
    if (window.gameRunning) spawnEnemy(canvas);
  }, 2000);
}

console.log("Enemies module ready");
