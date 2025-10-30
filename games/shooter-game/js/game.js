import { preloadImages, enemies, bosses, imagesLoaded, playerImg, bossImg } from "./enemies.js";
import { player, setupPlayer, keys } from "./player.js";
import { drawBar } from "./utils.js";
import { state } from "./state.js";

export function initGameLoop() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const fitCanvas = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  };
  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  setupPlayer(canvas);

  // --- Load images first ---
  preloadImages()
    .then(() => {
      console.log("🌀 All images loaded. Starting render loop...");
      requestAnimationFrame(loop);
    })
    .catch(err => {
      console.error("❌ Error preloading images:", err);
    });

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function update() {
    if (!imagesLoaded || !state.running || state.over || state.won) return;

    player.x += (keys.d - keys.a) * player.speed;
    player.y += (keys.s - keys.w) * player.speed;
  }

  function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!imagesLoaded) {
      ctx.fillStyle = "#00ff99";
      ctx.font = "24px monospace";
      ctx.fillText("Loading game assets...", canvas.width / 2 - 100, canvas.height / 2);
      return;
    }

    // Draw player if loaded
    if (playerImg) {
      ctx.drawImage(playerImg, player.x - 32, player.y - 32, 64, 64);
    } else {
      ctx.fillStyle = "#00ff99";
      ctx.fillText("Waiting playerImg", 20, 40);
    }

    drawBar(ctx, "HEALTH", 20, 50, 100, 100, "#ff3333");

    if (state.won) {
      ctx.fillStyle = "#00ff99";
      ctx.font = "90px Impact";
      ctx.textAlign = "center";
      ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2);
    }
  }
}

