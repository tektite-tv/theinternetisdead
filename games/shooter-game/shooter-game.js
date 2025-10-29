/* ===========================================================
   Bananarama Apocalypse v3 — "Boss Mode & Time Itself"
   ===========================================================
   ✦ Boss Mode button spawns the final boss immediately
   ✦ Timer bottom-right counts up from 0.0 seconds
   ✦ ESC pauses all motion and freezes damage ticks
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
const bossBtn = document.createElement("button");
bossBtn.textContent = "Boss Mode";
bossBtn.className = "menu-button";
menu.appendChild(bossBtn);

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

  // spawn player at least 400px away from boss, in a random direction
  const angle = Math.random() * Math.PI * 2;
  const safeDist = 400;
  player.x = boss.x + Math.cos(angle) * safeDist;
  player.y = boss.y + Math.sin(angle) * safeDist;

  // clamp to screen edges
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

// --- GAME VARIABLES ---
const basePath = "/media/images/gifs/";
const enemyFiles = [
  "dancing-guy.gif", "dancingzoidberg.gif", "dragon.gif", "eyes.gif",
  "fatspiderman.gif", "firework.gif", "frog.gif", "keyboard_smash.gif", "skeleton.gif"
];
let imagesLoaded = false, enemyImages = {}, playerImg, bossImg;
let gameRunning = false, paused = false, gameOver = false;
let bossActive = false, bossDefeated = false, boss = null;

let enemies = [], bullets = [], lightnings = [];
let kills = 0, deaths = 0, health = 100, stamina = 100;
let frameCount = 0, wave = 1;
let pushCharges = 3, pushCooldown = false, cooldownTimer = 0, pushFxTimer = 0;

// --- TIMER ---
let gameTimer = 0;
let timerInterval = null;

function startTimer() {
  gameTimer = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!paused && gameRunning && !gameOver) gameTimer += 0.016;
  }, 16);
}
function stopTimer() { clearInterval(timerInterval); }

// --- CONTROLS ---
const keys = { w:false, a:false, s:false, d:false, space:false };
addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = true;
  if (e.code === "Space") { keys.space = true; e.preventDefault(); }
  if (e.code === "Escape") paused = !paused;
});
addEventListener("keyup", e => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = false;
  if (e.code === "Space") { keys.space = false; e.preventDefault(); }
});
ui.restart.onclick = resetGame;

// --- PLAYER + AIM ---
const player = { x: canvas.width / 2, y: canvas.height / 2, speed: 4, size: 64 };
let mouseX = player.x, mouseY = player.y, aimAngle = 0;

canvas.addEventListener("mousemove", e => { mouseX = e.clientX; mouseY = e.clientY; });
canvas.addEventListener("mousedown", () => {
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "80px Impact";
    ctx.textAlign = "center";
    ctx.fillText("YOU DIED", canvas.width / 2, canvas.height / 2);

    // Restart button under YOU DIED
    const btnW = 240, btnH = 60;
    const btnX = canvas.width / 2 - btnW / 2;
    const btnY = canvas.height / 2 + 50;

    ctx.fillStyle = "#111";
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = "#00ff99";
    ctx.lineWidth = 3;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = "#00ff99";
    ctx.font = "26px monospace";
    ctx.fillText("Restart to Main Menu", canvas.width / 2, btnY + 40);

    // Click handler for restart
    canvas.onclick = function (e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (mx > btnX && mx < btnX + btnW && my > btnY && my < btnY + btnH) {
        resetGame();
        menu.classList.remove("hidden");
        document.getElementById("ui").classList.add("hidden");
        gameRunning = false;
        canvas.onclick = null;
      }
    };
  }
});

// --- REST OF GAME LOGIC OMITTED FOR BREVITY (same as previous) ---
