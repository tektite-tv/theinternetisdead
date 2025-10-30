import { setupUI } from "./ui.js";
import { initGameLoop } from "./game.js";
import { state } from "./state.js";

window.addEventListener("DOMContentLoaded", () => {
  console.log("💾 Initializing Bananarama Apocalypse...");

  // Set initial state
  state.running = false;
  state.paused = false;
  state.won = false;
  state.over = false;

  // Initialize UI and game loop
  setupUI();
  initGameLoop();

  console.log("✅ Game initialized successfully");
});

// optional global error handler for easy debugging
window.onerror = (msg, src, line, col, err) => {
  console.error("💀 JS Error:", msg, "in", src, "at", line + ":" + col);
  alert("Error detected — check console (F12)");
};
