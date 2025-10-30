// shooter-game.js — guaranteed to draw the banana fullscreen

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const playerImage = new Image();
  playerImage.src = "/media/images/gifs/bananarama.gif";

  const player = {
    x: 0,
    y: 0,
    w: 96,
    h: 96,
    speed: 4
  };

  const keys = {};
  const bullets = [];
  const mouse = { x: 0, y: 0 };
  let gameRunning = false;

  // --- Resize canvas to window ---
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // keep banana centered
    player.x = canvas.width / 2 - player.w / 2;
    player.y = canvas.height / 2 - player.h / 2;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // --- Controls ---
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

  // --- Shooting ---
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
      r: 5
    });
  }

  // --- Movement ---
  function movePlayer() {
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
  }

  // --- Bullets ---
  function updateBullets() {
    bullets.forEach(b => {
      b.x += b.dx;
      b.y += b.dy;
    });
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height)
        bullets.splice(i, 1);
    }
  }

  function drawBullets() {
    ctx.fillStyle = "red";
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // --- Draw player ---
  function drawPlayer() {
    ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
  }

  // --- Arrow ---
  function drawArrow() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const angle = Math.atan2(mouse.y - cy, mouse.x - cx);
    const orbit = 40;
    const ax = cx + Math.cos(angle) * orbit;
    const ay = cy + Math.sin(angle) * orbit;

    ctx.save();
    ctx.translate(ax, ay);
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

  // --- Draw everything ---
  function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawBullets();
    drawArrow();
  }

  // --- Main loop ---
  function loop() {
    if (!gameRunning) return;
    movePlayer();
    updateBullets();
    draw();
    requestAnimationFrame(loop);
  }

  // --- Menu logic ---
  const startButton = document.getElementById("startButton");
  const menu = document.getElementById("menu");

  startButton.addEventListener("click", () => {
    menu.classList.add("hidden");
    gameRunning = true;
    loop();
  });

  playerImage.onload = () => {
    console.log("Banana loaded:", playerImage.src);
    // only draw after image loads to avoid black screen
    draw();
  };
});
