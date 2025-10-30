// shooter-game.js
// banana moves, shoots red bullets, arrow orbits, enemies spawn and die to bullets

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const playerImage = new Image();
  playerImage.src = "/media/images/gifs/bananarama.gif";

  let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    w: 96,
    h: 96,
    speed: 4
  };

  let keys = {};
  let bullets = [];
  let mouse = { x: 0, y: 0 };
  window.gameRunning = false;

  // === Input Handling ===
  window.addEventListener("keydown", e => (keys[e.key.toLowerCase()] = true));
  window.addEventListener("keyup", e => (keys[e.key.toLowerCase()] = false));

  canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener("click", () => {
    if (gameRunning) shoot();
  });

  // === Shooting ===
  function shoot() {
    const angle = Math.atan2(
      mouse.y - (player.y + player.h / 2),
      mouse.x - (player.x + player.w / 2)
    );
    const speed = 8;
    bullets.push({
      x: player.x + player.w / 2,
      y: player.y + player.h / 2,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      radius: 5
    });
  }

  // === Movement ===
  function movePlayer() {
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
  }

  // === Bullets ===
  function updateBullets() {
    bullets.forEach(b => {
      b.x += b.dx;
      b.y += b.dy;
    });
    bullets = bullets.filter(
      b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height
    );
  }

  function drawBullets() {
    ctx.fillStyle = "red";
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // === Player ===
  function drawPlayer() {
    ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
  }

  // === Arrow ===
  function drawArrow() {
    const centerX = player.x + player.w / 2;
    const centerY = player.y + player.h / 2;
    const angle = Math.atan2(mouse.y - centerY, mouse.x - centerX);
    const orbitRadius = 40;
    const arrowX = centerX + Math.cos(angle) * orbitRadius;
    const arrowY = centerY + Math.sin(angle) * orbitRadius;

    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-10, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // === Draw Everything ===
  function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawBullets();
    drawEnemies(ctx);
    drawArrow();
  }

  // === Game Loop ===
  function gameLoop() {
    if (!gameRunning) return;
    movePlayer();
    updateBullets();
    updateEnemies(player, bullets, canvas);
    draw();
    requestAnimationFrame(gameLoop);
  }

  // === Start Game ===
  const startButton = document.getElementById("startButton");
  const menu = document.getElementById("menu");

  startButton.addEventListener("click", () => {
    console.log("Game started");
    menu.classList.add("hidden");
    gameRunning = true;
    window.gameRunning = true;
    startEnemySpawning(canvas, player, bullets); // <-- starts enemy spawns
    gameLoop();
  });

  playerImage.onload = () =>
    console.log("Banana ready:", playerImage.src);
});
