// shooter-game.js
// basic twin-stick shooter foundation with player GIF

// === Canvas Setup ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// === Player Setup ===
const playerImage = new Image();
playerImage.src = "/media/images/gifs/bananarama.gif";

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: 64,
  height: 64,
  speed: 4,
  dx: 0,
  dy: 0
};

// === Input Handling ===
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// === Movement Logic ===
function movePlayer() {
  player.dx = 0;
  player.dy = 0;

  if (keys["w"]) player.dy = -player.speed;
  if (keys["s"]) player.dy = player.speed;
  if (keys["a"]) player.dx = -player.speed;
  if (keys["d"]) player.dx = player.speed;

  player.x += player.dx;
  player.y += player.dy;

  // Keep player inside bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// === Drawing Logic ===
function drawPlayer() {
  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

function clearCanvas() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// === Game Loop ===
let gameRunning = false;

function update() {
  if (!gameRunning) return;
  clearCanvas();
  movePlayer();
  drawPlayer();
  requestAnimationFrame(update);
}

// === Menu Logic ===
const menu = document.getElementById("menu");
const startButton = document.getElementById("startButton");

startButton.onclick = () => {
  menu.classList.add("hidden");
  gameRunning = true;
  update();
};

// === Safety Check ===
playerImage.onload = () => console.log("Player GIF loaded:", playerImage.src);
