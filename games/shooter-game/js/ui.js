import { resetGame, startTimer } from "./utils.js";
import { spawnEnemyWave, spawnBoss, spawnInsaneBossMode } from "./enemies.js";
import { state } from "./state.js";

export function setupUI() {
  const menu = document.getElementById("menu");
  const startBtn = document.getElementById("startBtn");
  const optionsBtn = document.getElementById("optionsBtn");
  const optionsMenu = document.getElementById("optionsMenu");
  const backBtn = document.getElementById("backBtn");
  const bgSelect = document.getElementById("bgSelect");
  const uploadBtn = document.getElementById("uploadBgBtn");
  const bgUpload = document.getElementById("bgUpload");

  // dynamically add Boss & Insane buttons
  const bossBtn = document.createElement("button");
  bossBtn.textContent = "Boss Mode";
  bossBtn.className = "menu-button";
  menu.appendChild(bossBtn);

  const insaneBtn = document.createElement("button");
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

  uploadBtn.onclick = () => bgUpload.click();
  bgUpload.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const customBgURL = URL.createObjectURL(file);
    document.body.style.backgroundImage = `url(${customBgURL})`;
    document.body.style.backgroundSize = "cover";
  };

  function showOptions() {
    optionsMenu.classList.remove("hidden");
    startBtn.style.display = bossBtn.style.display = insaneBtn.style.display = optionsBtn.style.display = "none";
  }

  function hideOptions() {
    optionsMenu.classList.add("hidden");
    startBtn.style.display = bossBtn.style.display = insaneBtn.style.display = optionsBtn.style.display = "inline-block";
  }

  console.log("✅ Menu initialized");
}

export function startGame(mode) {
  const menu = document.getElementById("menu");
  const ui = document.getElementById("ui");
  menu.classList.add("hidden");
  ui.classList.remove("hidden");
  resetGame();
  state.running = true;
  state.won = false;

  if (mode === "normal") spawnEnemyWave(5);
  if (mode === "boss") spawnBoss();
  if (mode === "insane") spawnInsaneBossMode();

  startTimer();
}
