import { setupUI, startGame } from "./ui.js";
import { initGameLoop } from "./game.js";
import { state } from "./state.js";

window.addEventListener("DOMContentLoaded", () => {
  console.log("💾 Initializing Bananarama Apocalypse...");
  state.running = false; state.paused = false; state.won = false; state.over = false;
  setupUI();
  window.startGame = startGame; // optional global expose
  initGameLoop();
  console.log("✅ Game initialized successfully");
});

window.onerror = (msg, src, line, col) => {
  console.error("💀 JS Error:", msg, "in", src, "at", line + ":" + col);
};
