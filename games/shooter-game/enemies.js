// enemies.js — stable, visible enemies for shooter-game

let enemies = [];
let spawnCounter = 0;

// --- Spawn enemies that move toward the player ---
function spawnEnemy(canvas) {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  // Spawn them *just* inside the visible area
  if (side === 0) { // top
    x = Math.random() * canvas.width;
    y = 0;
  } else if (side === 1) { // bottom
    x = Math.random() * canvas.width;
    y = canvas.height;
  } else if (side === 2) { // left
    x = 0;
    y = Math.random() * canvas.height;
  } else { // right
    x = canvas.width;
    y = Math.random() * canvas.height;
  }

  enemies.push({
    x,
    y,
    radius: 18,
    speed: 1 + Math.random() * 1.5,
    color: "#00ff99"
  });
}

// --- Update enemies every frame ---
function updateEnemies(player, bullets, canvas) {
  // spawn one every ~120 frames (~2 seconds)
  spawnCounter++;
  if (spawnCounter > 120) {
    spawnEnemy(canvas);
    spawnCounter = 0;
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    // move toward player
    const angle = Math.atan2(
      player.y + player.h / 2 - e.y,
      player.x + player.w / 2 - e.x
    );
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;

    // check for bullet collision
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dx = e.x - b.x;
      const dy = e.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < e.radius + b.r) {
        // pop enemy and bullet
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }

    // if they wander too far off (shouldn't happen)
    if (
      e.x < -100 ||
      e.x > canvas.width + 100 ||
      e.y < -100 ||
      e.y > canvas.height + 100
    ) {
      enemies.splice(i, 1);
    }
  }
}

// --- Draw enemies ---
function drawEnemies(ctx) {
  enemies.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fillStyle = e.color;
    ctx.fill();
  });
}

// --- Start automatic spawning ---
function startEnemySpawning(canvas) {
  // in case it's called multiple times
  if (window.enemySpawner) clearInterval(window.enemySpawner);
  window.enemySpawner = setInterval(() => {
    if (window.gameRunning) spawnEnemy(canvas);
  }, 2000);
}

console.log("Enemies module loaded successfully");
