// /js/scanlines.js
/**
 * scanlines.js
 * Adds a diagonal scanline overlay UNDER the <main> content.
 */

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
  canvas.style.opacity = "0.15";
  canvas.style.mixBlendMode = "overlay";

  // Insert canvas as the first child under <main>
  main.prepend(canvas);

  // Make sure <main> can layer properly
  main.style.position = "relative";

  const ctx = canvas.getContext("2d");
  let w, h;

  function resize() {
    const rect = main.getBoundingClientRect();
    w = canvas.width = rect.width;
    h = canvas.height = rect.height;
  }

  window.addEventListener("resize", resize);
  resize();

  let offset = 0;

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(0, 255, 100, 0.25)";
    ctx.lineWidth = 1;

    const spacing = 6;
    const angle = Math.PI / 4;

    ctx.save();
    ctx.translate(-w, 0);
    ctx.rotate(-angle);

    for (let y = -h * 2; y < h * 2; y += spacing) {
      const lineY = y + (offset % spacing);
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(w * 3, lineY);
      ctx.stroke();
    }

    ctx.restore();

    offset += 0.6;
    requestAnimationFrame(draw);
  }

  draw();
}
