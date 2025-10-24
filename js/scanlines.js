// /js/scanlines.js
export function initScanlines() {
  const main = document.querySelector("main");
  if (!main) {
    console.warn("⚠️ <main> not found, scanlines not initialized.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.id = "scanlines";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "0";
  canvas.style.opacity = "1"; // fully visible
  canvas.style.mixBlendMode = "normal"; // solid overlay

  main.prepend(canvas);
  main.style.position = "relative";

  const ctx = canvas.getContext("2d");
  let w, h;

  function resize() {
    const rect = main.getBoundingClientRect();
    w = canvas.width = rect.width;
    h = canvas.height = rect.height;
  }

  setTimeout(resize, 1000);
  window.addEventListener("resize", resize);

  let offset = 0;

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#ff0000"; // 🔥 bright red
    ctx.lineWidth = 1;

    const spacing = 12; // was 5 — more space between lines
    const angle = Math.PI / 4;

    ctx.save();
    ctx.rotate(-angle);

    for (let y = -h * 2; y < h * 2; y += spacing) {
      const lineY = y + (offset % spacing);
      ctx.beginPath();
      ctx.moveTo(-w * 2, lineY);
      ctx.lineTo(w * 4, lineY);
      ctx.stroke();
    }

    ctx.restore();

    offset += 0.2; // slower movement (was 0.6)
    requestAnimationFrame(draw);
  }

  resize();
  draw();
}
