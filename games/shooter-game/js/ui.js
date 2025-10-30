import { resetGame, startTimer } from "./utils.js";
import { spawnEnemyWave, spawnBoss, spawnInsaneBossMode } from "./enemies.js";
import { state } from "./state.js";

export function setupUI() {
  const menu = document.getElementById("menu");
  const startBtn = document.getElementById("startBtn");
  const bossBtn = document.getElementById("bossBtn");
  const insaneBtn = document.getElementById("insaneBtn");
  const optionsBtn = document.getElementById("optionsBtn");
  const optionsMenu = document.getElementById("optionsMenu");
  const backBtn = document.getElementById("backBtn");
  const bgSelect = document.getElementById("bgSelect");
  const uploadBtn = document.getElementById("uploadBgBtn");
  const bgUpload = document.getElementById("bgUpload");

  startBtn.onclick = () => startGame("normal");
  bossBtn.onclick = () => startGame("boss");
  insaneBtn.onclick = () => startGame("insane");
  optionsBtn.onclick = showOptions;
  backBtn.onclick = hideOptions;

  bgSelect.onchange = () => {
    const colors = { black:"#000", green:"#002b00", blue:"#001133", purple:"#150021" };
    document.body.style.background = colors[bgSelect.value] || "#000";
    document.body.style.backgroundImage = "";
  };

  uploadBtn.onclick = () => bgUpload.click();
  bgUpload.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const customBgURL = URL.createObjectURL(file);
    document.body.style.backgroundImage = `url(${customBgURL})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
  };

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
  state.over = false;
  state.paused = false;

  if (mode === "normal") spawnEnemyWave(8);
  if (mode === "boss") spawnBoss();
  if (mode === "insane") spawnInsaneBossMode();

  startTimer();
  console.log(`🚀 Game started in ${mode.toUpperCase()} mode`);
}
