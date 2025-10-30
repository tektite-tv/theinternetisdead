// shooter-game.js
// simple version — moves your bananarama.gif with WASD when you click Start

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerImage = new Image();
playerImage.src = "./media/images/gifs/bananarama.gif";

let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  w: 64,
  h: 64,
  speed: 4
};

let keys = {};
let gameRunning = false;

// movement
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  // keep inside screen
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
}

// drawing
function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
}

function gameLoop() {
  if (!gameRunning) return;
  movePlayer();
  draw();
  requestAnimationFrame(gameLoop);
}

// start button logic
const startButton = document.getElementById("startButton");
const menu = document.getElementById("menu");

startButton.addEventListener("click", () => {
  console.log("Game started");
  menu.classList.add("hidden");
  gameRunning = true;
  gameLoop();
});

playerImage.onload = () => console.log("Player image loaded.");
