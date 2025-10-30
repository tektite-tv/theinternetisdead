import { setupUI, startGame } from "./ui.js";
import { initGameLoop } from "./game.js";
import { state } from "./state.js";

window.addEventListener("DOMContentLoaded", () => {
  console.log("💾 Initializing Bananarama Apocalypse...");

  // set initial state
  state.running = false;
  state.paused = false;
  state.won = false;
  state.over = false;

  // initialize UI and hook buttons globally
  setupUI();

  // expose startGame globally so inline buttons can reach it
  window.startGame = startGame;

  // start the game loop
  initGameLoop();

  console.log("✅ Game initialized successfully");
});

// helpful global error trap
window.onerror = (msg, src, line, col, err) => {
  console.error("💀 JS Error:", msg, "in", src, "at", line + ":" + col);
  alert("Error detected — check console (F12)");
};
