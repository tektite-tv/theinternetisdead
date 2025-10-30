import { resetGame, startTimer } from "./utils.js";
import { spawnEnemyWave, spawnBoss, spawnInsaneBossMode } from "./enemies.js";

export let backgroundColor = "#000";
export let customBg = null;
export let customBgURL = null;

export function setupUI() {
  const menu = document.getElementById("menu");
  const startBtn = document.getElementById("startBtn");
  const optionsBtn = document.getElementById("optionsBtn");
  const optionsMenu = document.getElementById("optionsMenu");
  const backBtn = document.getElementById("backBtn");
  const bgSelect = document.getElementById("bgSelect");
  const uploadBtn = document.getElementById("uploadBgBtn");
  const bgUpload = document.getElementById("bgUpload");

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
  optionsBtn.onclick = () => showOptions();
  backBtn.onclick = () => hideOptions();

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

  function showOptions() {
    optionsMenu.classList.remove("hidden");
    startBtn.style.display = bossBtn.style.display = insaneBtn.style.display = optionsBtn.style.display = "none";
  }

  function hideOptions() {
    optionsMenu.classList.add("hidden");
    startBtn.style.display = bossBtn.style.display = insaneBtn.style.display = optionsBtn.style.display = "inline-block";
  }
}

export function startGame(mode) {
  const menu = document.getElementById("menu");
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
