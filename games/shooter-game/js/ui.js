import { resetGame, startTimer } from "./utils.js";
import { spawnEnemyWave, spawnBoss, spawnInsaneBossMode } from "./enemies.js";

let menu, startBtn, bossBtn, insaneBtn, optionsBtn, optionsMenu, backBtn, bgSelect, uploadBtn, bgUpload;
let backgroundColor = "#000", customBg = null, customBgURL = null;

export function setupUI() {
  menu = document.getElementById("menu");
  startBtn = document.getElementById("startBtn");
  optionsBtn = document.getElementById("optionsBtn");
  optionsMenu = document.getElementById("optionsMenu");
  backBtn = document.getElementById("backBtn");
  bgSelect = document.getElementById("bgSelect");
  uploadBtn = document.getElementById("uploadBgBtn");
  bgUpload = document.getElementById("bgUpload");

  createModeButtons();
  setupBackgroundControls();
}

function createModeButtons() {
  bossBtn = document.createElement("button");
  bossBtn.textContent = "Boss Mode";
  bossBtn.className = "menu-button";
  menu.appendChild(bossBtn);

  insaneBtn = document.createElement("button");
  insaneBtn.textContent = "INSANE BOSS MODE";
  insaneBtn.className = "menu-button";
  insaneBtn.style.background = "#ff3333";
  insaneBtn.style.color = "white";
  menu.appendChild(insaneBtn);

  startBtn.onclick = () => startGame("normal");
  bossBtn.onclick = () => startGame("boss");
  insaneBtn.onclick = () => startGame("insane");
  optionsBtn.onclick = showOptions;
  backBtn.onclick = hideOptions;
}

function setupBackgroundControls() {
  bgSelect.onchange = () => {
    const colors = { black: "#000", green: "#002b00", blue: "#001133", purple: "#150021" };
    backgroundColor = colors[bgSelect.value] || "#000";
    customBg = null;
  };
  uploadBtn.onclick = () => bgUpload.click();
  bgUpload.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (customBgURL) URL.revokeObjectURL(customBgURL);
    customBgURL = URL.createObjectURL(file);
    const img = new Image();
    img.src = customBgURL;
    img.onload = () => { customBg = img; backgroundColor = null; };
  };
}

export function startGame(mode) {
  menu.classList.add("hidden");
  document.getElementById("ui").classList.remove("hidden");
  resetGame();
  window.gameRunning = true;
  window.gameWon = false;

  if (mode === "normal") spawnEnemyWave(5);
  if (mode === "boss") spawnBoss();
  if (mode === "insane") spawnInsaneBossMode();
  startTimer();
}

function showOptions() {
  optionsMenu.classList.remove("hidden");
  startBtn.style.display = bossBtn.style.display = insaneBtn.style.display = optionsBtn.style.display = "none";
}
function hideOptions() {
  optionsMenu.classList.add("hidden");
  startBtn.style.display = bossBtn.style.display = insaneBtn.style.display = optionsBtn.style.display = "inline-block";
}
