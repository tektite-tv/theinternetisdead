// ui.js
// handles all menu and UI visibility

const menu = document.getElementById("menu");
const optionsMenu = document.getElementById("optionsMenu");
const startButton = document.getElementById("startButton");
const bossButton = document.getElementById("bossModeButton");
const insaneButton = document.getElementById("insaneModeButton");
const optionsButton = document.getElementById("optionsButton");
const backButton = document.getElementById("backButton");

// hook up menu buttons
optionsButton.addEventListener("click", () => {
  menu.classList.add("hidden");
  optionsMenu.classList.remove("hidden");
});

backButton.addEventListener("click", () => {
  optionsMenu.classList.add("hidden");
  menu.classList.remove("hidden");
});

// placeholder mode buttons for later
bossButton.addEventListener("click", () => {
  console.log("Boss Mode selected (not yet implemented).");
});

insaneButton.addEventListener("click", () => {
  console.log("Insane Mode selected (not yet implemented).");
});
