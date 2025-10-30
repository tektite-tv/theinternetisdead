import { setupUI } from "./ui.js";
import { initGameLoop } from "./game.js";

window.addEventListener("DOMContentLoaded", () => {
  setupUI();
  initGameLoop();
  console.log("Bananarama Apocalypse v11 — modular edition booted.");
});
