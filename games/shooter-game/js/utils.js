export function drawBar(ctx, label, x, y, value, max, color) {
  const w = 220, h = 15;
  ctx.fillStyle = "black";
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, (value / max) * w, h);
  ctx.strokeStyle = "#00ff99";
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = "#00ff99";
  ctx.font = "12px monospace";
  ctx.fillText(label, x, y - 6);
}

export function startTimer() { console.log("Timer started."); }
export function resetGame() { console.log("Game reset."); window.gameOver = false; }
export function pushBackEnemies() {}
export function endGame() { window.gameOver = true; }
export function youWin() { window.gameWon = true; }
