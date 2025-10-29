/* ===========================================================
   Bananarama Apocalypse v3 — Fixed Menu Version
   =========================================================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
function fitCanvas() { canvas.width = innerWidth; canvas.height = innerHeight; }
fitCanvas();
addEventListener("resize", fitCanvas);

// --- UI ---
const ui = {
  kills: document.getElementById("kills"),
  deaths: document.getElementById("deaths"),
  health: document.getElementById("health"),
  restart: document.getElementById("restart")
};

// --- MENU SYSTEM ---
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const bossBtn = document.getElementById("bossBtn");
const optionsBtn = document.getElementById("optionsBtn");
const optionsMenu = document.getElementById("optionsMenu");
const backBtn = document.getElementById("backBtn");
const bgSelect = document.getElementById("bgSelect");

let backgroundColor = "#000";
document.getElementById("ui").classList.add("hidden");

startBtn.onclick = () => {
  menu.classList.add("hidden");
  document.getElementById("ui").classList.remove("hidden");
  resetGame();
  gameRunning = true;
  spawnEnemyWave(5);
  startTimer();
};

bossBtn.onclick = () => {
  menu.classList.add("hidden");
  document.getElementById("ui").classList.remove("hidden");
  resetGame();
  gameRunning = true;
  spawnBoss();
  const angle = Math.random() * Math.PI * 2;
  const safeDist = 400;
  player.x = boss.x + Math.cos(angle) * safeDist;
  player.y = boss.y + Math.sin(angle) * safeDist;
  player.x = Math.max(100, Math.min(canvas.width - 100, player.x));
  player.y = Math.max(100, Math.min(canvas.height - 100, player.y));
  startTimer();
};

optionsBtn.onclick = () => {
  optionsMenu.classList.remove("hidden");
  startBtn.style.display = "none";
  bossBtn.style.display = "none";
  optionsBtn.style.display = "none";
};

backBtn.onclick = () => {
  optionsMenu.classList.add("hidden");
  startBtn.style.display = "inline-block";
  bossBtn.style.display = "inline-block";
  optionsBtn.style.display = "inline-block";
};

bgSelect.onchange = () => {
  const colors = { black: "#000", green: "#002b00", blue: "#001133", purple: "#150021" };
  backgroundColor = colors[bgSelect.value] || "#000";
};

// --- STUBS FOR DEMO PURPOSES ---
function resetGame() { console.log("Game reset"); }
function spawnEnemyWave(n) { console.log("Spawned", n, "enemies"); }
function spawnBoss() { boss = { x: canvas.width/2, y: canvas.height/2 }; console.log("Boss spawned"); }
function startTimer() { console.log("Timer started"); }

let boss = null;
let player = { x: 0, y: 0 };
let gameRunning = false;
