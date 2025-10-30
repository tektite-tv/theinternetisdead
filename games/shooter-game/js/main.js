import { setupUI, startGame } from "./ui.js";
import { initGameLoop } from "./game.js";
import { state } from "./state.js";

window.addEventListener("DOMContentLoaded", () => {
  console.log("💾 Initializing Bananarama Apocalypse...");

  // Initialize shared state
  state.running = false;
  state.paused = false;
  state.won = false;
  state.over = false;

  // Initialize menu buttons and attach logic
  setupUI();

  // Expose the same startGame globally (fixes dead click issue)
  window.startGame = startGame;

  // Start the canvas loop
  initGameLoop();

  console.log("✅ Game initialized successfully");
});

// Global JS error catcher for debugging
window.onerror = (msg, src, line, col, err) => {
  console.error("💀 JS Error:", msg, "in", src, "at", line + ":" + col);
  alert("Error detected — check console (F12)");
};
