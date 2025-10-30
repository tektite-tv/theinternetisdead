// shooter-game.js
// start button fixed, red bullets working

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const playerImage = new Image();
  playerImage.src = "/media/images/gifs/bananarama.gif";

  let player = { x: canvas.width / 2, y: canvas.height / 2, w: 64, h: 64, speed: 4 };
  let keys = {};
  let bullets = [];
  let mouse = { x: 0, y: 0 };
  let gameRunning = false;

  // === Input Handling ===
  window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener("click", e => {
    if (gameRunning) shoot();
  });

  // === Shooting ===
  function shoot() {
    const angle = Math.atan2(mouse.y - (player.y + player.h / 2), mouse.x - (player.x + player.w / 2));
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

    // Boundaries
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
  }

  // === Update & Draw ===
  function updateBullets() {
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      b.x += b.dx;
      b.y += b.dy;
    }
    bullets = bullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);
  }

  function drawBullets() {
    ctx.fillStyle = "red";
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPlayer() {
    ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
  }

  function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawBullets();
  }

  function gameLoop() {
    if (!gameRunning) return;
    movePlayer();
    updateBullets();
    draw();
    requestAnimationFrame(gameLoop);
  }

  // === Start Game Button ===
  const startButton = document.getElementById("startButton");
  const menu = document.getElementById("menu");

  startButton.addEventListener("click", () => {
    console.log("Game started");
    menu.classList.add("hidden");
    gameRunning = true;
    gameLoop();
  });

  playerImage.onload = () => console.log("Banana ready:", playerImage.src);
});
