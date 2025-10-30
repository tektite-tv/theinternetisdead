import { setupUI, startGame } from "./ui.js";
import { initGameLoop } from "./game.js";

window.addEventListener("DOMContentLoaded", () => {
  setupUI();
  initGameLoop();
  console.log("Bananarama Apocalypse ready.");
});

export { startGame };
