import { preloadImages, enemies, bosses, imagesLoaded, playerImg, bossImg } from "./enemies.js";
import { player, setupPlayer, keys, ready } from "./player.js";
import { drawBar, youWin } from "./utils.js";
import { state } from "./state.js";

export function initGameLoop() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const fitCanvas = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  setupPlayer(canvas);

  preloadImages().then(() => {
    console.log("🌀 All images loaded. Starting render loop...");
    requestAnimationFrame(loop);
  });

  window.addEventListener("togglePause", () => state.paused = !state.paused);

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function update() {
    if (!imagesLoaded || !state.running || state.over || state.won || state.paused) return;

    player.x += ((keys.d?1:0) - (keys.a?1:0)) * player.speed;
    player.y += ((keys.s?1:0) - (keys.w?1:0)) * player.speed;
    player.x = Math.max(0, Math.min(canvas.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height, player.y));

    enemies.forEach(e => {
      const a = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(a) * e.speed;
      e.y += Math.sin(a) * e.speed;
    });

    bosses.forEach(b => {
      b.patternTimer += 0.02;
      if (b.enraged) {
        b.x = b.x + Math.sin(b.patternTimer*3) * 1.5;
        b.y = b.y + Math.cos(b.patternTimer*2) * 1.2;
      }
      b.orbiters.forEach(o => {
        o.angle += 0.03;
        o.x = b.x + Math.cos(o.angle) * o.radius;
        o.y = b.y + Math.sin(o.angle) * o.radius;
      });
    });

    if (state.running && enemies.length === 0 && bosses.length === 0) youWin();
  }

  function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!imagesLoaded) {
      ctx.fillStyle = "#00ff99";
      ctx.font = "24px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Loading game assets...", canvas.width/2, canvas.height/2);
      return;
    }

    if (playerImg) {
      ctx.drawImage(playerImg, player.x - player.size/2, player.y - player.size/2, player.size, player.size);
    } else if (ready) {
      ctx.fillStyle = "#00ff99";
      ctx.beginPath(); ctx.arc(player.x, player.y, 20, 0, Math.PI*2); ctx.fill();
      ctx.fillText("Waiting playerImg", 20, 40);
    }

    enemies.forEach(e => {
      if (e.img) ctx.drawImage(e.img, e.x - e.size/2, e.y - e.size/2, e.size, e.size);
      else { ctx.fillStyle="#ff66cc"; ctx.fillRect(e.x-10, e.y-10, 20, 20); }
    });

    bosses.forEach(b => {
      if (bossImg) ctx.drawImage(bossImg, b.x - b.size/2, b.y - b.size/2, b.size, b.size);
      b.orbiters?.forEach(o => {
        if (bossImg) ctx.drawImage(bossImg, o.x - o.size/2, o.y - o.size/2, o.size, o.size);
      });
    });

    drawBar(ctx, "HEALTH", 20, 50, state.health, 100, "#ff3333");

    if (state.won) {
      ctx.fillStyle = "#00ff99";
      ctx.font = "90px Impact";
      ctx.textAlign = "center";
      ctx.fillText("YOU WIN!", canvas.width/2, canvas.height/2);
    }
  }
}
