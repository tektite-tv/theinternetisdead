// shooter-game.js

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// make sure this path is correct RELATIVE to shooter-game.html
// if your html is in /games/shooter-game/, this should be:
const playerImage = new Image();
playerImage.src = "./media/gifs/bananarama.gif"; // not /media/images/gifs/

// fallback color until gif loads
let player = { x: canvas.width / 2, y: canvas.height / 2, w: 64, h: 64, speed: 4 };
let keys = {};
let gameRunning = false;

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (playerImage.complete && playerImage.naturalWidth !== 0) {
    ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = "#ff66cc";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }
}

function gameLoop() {
  if (!gameRunning) return;
  movePlayer();
  draw();
  requestAnimationFrame(gameLoop);
}

const menu = document.getElementById("menu");
const startButton = document.getElementById("startButton");

startButton.addEventListener("click", () => {
  console.log("Game started");
  menu.classList.add("hidden");
  gameRunning = true;
  gameLoop();
});

playerImage.onload = () => console.log("GIF loaded:", playerImage.src);
playerImage.onerror = () => console.error("GIF failed to load:", playerImage.src);
