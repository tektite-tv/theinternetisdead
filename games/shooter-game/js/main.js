window.onerror = (msg, src, line, col, err) => {
  console.error("💀 JS Error:", msg, "in", src, "at", line + ":" + col);
  alert("Error detected — check console (F12)");
};
console.log("Main.js loaded.");

import { setupUI } from "./ui.js";
import { initGameLoop } from "./game.js";

window.addEventListener("DOMContentLoaded", () => {
  setupUI();
  initGameLoop();
  console.log("Bananarama Apocalypse v11 — modular edition booted.");
});
