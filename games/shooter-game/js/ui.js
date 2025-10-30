import { resetGame, startTimer } from "./utils.js";
import { spawnEnemyWave, spawnBoss, spawnInsaneBossMode } from "./enemies.js";
import { state } from "./state.js";

/* -------------------------------------------------------
   UI SETUP — called once on DOMContentLoaded
------------------------------------------------------- */
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

  // --- Button Clicks ---
  startBtn.onclick = () => startGame("normal");
  bossBtn.onclick = () => startGame("boss");
  insaneBtn.onclick = () => startGame("insane");
  optionsBtn.onclick = showOptions;
  backBtn.onclick = hideOptions;

  // --- Background selector ---
  bgSelect.onchange = () => {
    const colors = {
      black: "#000",
      green: "#002b00",
      blue: "#001133",
      purple: "#150021"
    };
    document.body.style.background = colors[bgSelect.value] || "#000";
    document.body.style.backgroundImage = "";
  };

  // --- Custom background upload ---
  uploadBtn.onclick = () => bgUpload.click();
  bgUpload.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const customBgURL = URL.createObjectURL(file);
    document.body.style.backgroundImage = `url(${customBgURL})`;
    document.body.style.backgroundSize = "cover";
  };

  // --- Options menu visibility ---
  function showOptions() {
    optionsMenu.classList.remove("hidden");
    startBtn.style.display =
      bossBtn.style.display =
      insaneBtn.style.display =
      optionsBtn.style.display =
        "none";
  }

  function hideOptions() {
    optionsMenu.classList.add("hidden");
    startBtn.style.display =
      bossBtn.style.display =
      insaneBtn.style.display =
      optionsBtn.style.display =
        "inline-block";
  }

  console.log("✅ Menu initialized");
}

/* -------------------------------------------------------
   START GAME — shared across all modules
------------------------------------------------------- */
export function startGame(mode) {
  const menu = document.getElementById("menu");
  const ui = document.getElementById("ui");

  // Hide menu, show UI
  menu.classList.add("hidden");
  ui.classList.remove("hidden");

  // Reset game state
  resetGame();
  state.running = true;
  state.won = false;
  state.over = false;
  state.paused = false;

  // Spawn enemies or bosses
  if (mode === "normal") spawnEnemyWave(5);
  if (mode === "boss") spawnBoss();
  if (mode === "insane") spawnInsaneBossMode();

  // Start timer
  startTimer();

  console.log(`🚀 Game started in ${mode.toUpperCase()} mode`);
}
