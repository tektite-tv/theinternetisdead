import { state } from "./state.js";
import { enemies, bosses } from "./enemies.js";

let timerInterval = null;

export function drawBar(ctx, label, x, y, value, max, color) {
  const w = 220, h = 15;
  ctx.fillStyle = "black";
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, value / max)) * w, h);
  ctx.strokeStyle = "#00ff99";
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = "#00ff99";
  ctx.font = "12px monospace";
  ctx.fillText(label, x, y - 6);
}

export function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {/* hook for later */}, 1000);
}
export function stopTimer() { if (timerInterval) clearInterval(timerInterval); }

export function resetGame() {
  enemies.length = 0;
  bosses.length = 0;
  state.kills = 0;
  state.health = 100;
  state.over = false;
  state.won = false;
  state.paused = false;
  stopTimer();
}

export function youWin() {
  state.won = true;
  state.running = false;
  stopTimer();
  showWinButton();
}

function showWinButton(){
  let btn = document.getElementById("winReturnBtn");
  if(!btn){
    btn = document.createElement("button");
    btn.id = "winReturnBtn";
    btn.textContent = "Return to Main Menu";
    btn.className = "menu-button";
    btn.style.position = "absolute";
    btn.style.top = "60%";
    btn.style.left = "50%";
    btn.style.transform = "translate(-50%,-50%)";
    btn.style.padding = "20px 40px";
    document.body.appendChild(btn);
    btn.onclick = () => {
      btn.remove();
      document.getElementById("ui").classList.add("hidden");
      document.getElementById("menu").classList.remove("hidden");
      resetGame();
    };
  }
}
