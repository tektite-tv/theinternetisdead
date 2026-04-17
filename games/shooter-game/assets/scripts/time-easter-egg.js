// time-easter-egg.js
// Speed-0 staring contest timeout.
// If the player stays on the frozen speed-0 Level 1 screen for 2 minutes,
// melt the whole viewport off the page, reset speed to 1, and kick back to Start Menu.

(() => {
  const REQUIRED_MS = 120000;
  const MELT_MS = 3600;
  const CHECK_MS = 250;

  let frozenStartedAt = 0;
  let melting = false;
  let overlay = null;
  let canvas = null;
  let ctx = null;
  let sourceCanvas = null;
  let sourceCtx = null;
  let columns = [];
  let startTime = 0;

  function api(){
    return window.TektiteLevel1SpeedZero || null;
  }

  function isFrozenScene(){
    const a = api();
    return !!(a && typeof a.isFrozen === "function" && a.isFrozen());
  }

  function resetTimer(){
    frozenStartedAt = 0;
  }

  function makeOverlay(){
    overlay = document.createElement("div");
    overlay.id = "speedZeroMeltOverlay";
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "pointer-events:none",
      "overflow:hidden",
      "background:transparent",
      "mix-blend-mode:normal"
    ].join(";");

    canvas = document.createElement("canvas");
    canvas.id = "speedZeroMeltCanvas";
    canvas.style.cssText = [
      "position:absolute",
      "inset:0",
      "width:100%",
      "height:100%",
      "display:block",
      "image-rendering:auto"
    ].join(";");

    overlay.appendChild(canvas);
    document.body.appendChild(overlay);
    ctx = canvas.getContext("2d");
    sourceCanvas = document.createElement("canvas");
    sourceCtx = sourceCanvas.getContext("2d");
    resizeCanvases();
  }

  function resizeCanvases(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.max(1, Math.floor(window.innerWidth * dpr));
    const h = Math.max(1, Math.floor(window.innerHeight * dpr));

    canvas.width = w;
    canvas.height = h;
    sourceCanvas.width = w;
    sourceCanvas.height = h;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    sourceCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function captureScene(){
    const mainCanvas = document.getElementById("game");
    if (!mainCanvas) return;

    sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    try{
      sourceCtx.drawImage(mainCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height);
    }catch(e){}

    // Pull a few DOM/HUD elements into the melt as crude text silhouettes.
    // Not a perfect screenshot, but enough to make the page look like it is sliding into the drain.
    sourceCtx.save();
    sourceCtx.scale(sourceCanvas.width / Math.max(1, window.innerWidth), sourceCanvas.height / Math.max(1, window.innerHeight));
    sourceCtx.font = "16px monospace";
    sourceCtx.textAlign = "left";
    sourceCtx.textBaseline = "top";
    sourceCtx.fillStyle = "rgba(0,255,102,0.88)";
    sourceCtx.shadowColor = "rgba(0,255,102,0.45)";
    sourceCtx.shadowBlur = 8;

    const hudIds = ["stageHud", "accuracyScore", "timerHud", "livesSlot", "powerupSlot", "heartsHud"];
    for (const id of hudIds){
      const el = document.getElementById(id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const text = (el.innerText || el.textContent || "").trim();
      if (!text || rect.width <= 0 || rect.height <= 0) continue;
      sourceCtx.fillText(text.replace(/\s+/g, " "), rect.left, rect.top);
    }

    sourceCtx.restore();
  }

  function initColumns(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const colW = Math.max(3, Math.floor(6 * dpr));
    const count = Math.ceil(sourceCanvas.width / colW);
    columns = Array.from({ length: count }, (_, i) => ({
      x: i * colW,
      w: colW + 1,
      delay: Math.random() * 0.38,
      speed: 0.52 + Math.random() * 1.8,
      wobble: Math.random() * Math.PI * 2,
      tear: Math.random() * 0.26
    }));
  }

  function startMelt(){
    if (melting) return;
    melting = true;
    makeOverlay();
    captureScene();
    initColumns();
    startTime = performance.now();
    requestAnimationFrame(animateMelt);
  }

  function animateMelt(now){
    if (!melting || !ctx || !sourceCanvas) return;

    const elapsed = now - startTime;
    const p = Math.max(0, Math.min(1, elapsed / MELT_MS));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Darkening background, because the page has made a choice.
    ctx.fillStyle = `rgba(0,0,0,${0.08 + p * 0.78})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const h = sourceCanvas.height;
    const wave = Math.sin(p * Math.PI);
    for (const c of columns){
      const local = Math.max(0, Math.min(1, (p - c.delay) / Math.max(0.12, 1 - c.delay)));
      const fall = Math.pow(local, 1.45) * h * (0.45 + c.speed * 1.2);
      const wobbleX = Math.sin(now * 0.008 + c.wobble) * wave * 18 * c.tear;
      const stretch = 1 + local * (2.4 + c.speed);

      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.pow(local, 2.2) * 0.92);
      ctx.filter = `hue-rotate(${Math.round(local * 240)}deg) saturate(${1 + local * 2.2}) blur(${local * 2.2}px)`;
      ctx.drawImage(
        sourceCanvas,
        c.x, 0, c.w, h,
        c.x + wobbleX, fall, c.w, h * stretch
      );
      ctx.restore();

      // Slime trail, naturally. Humans made CSS gradients, so here we are.
      if (local > 0.05){
        ctx.fillStyle = `rgba(0,255,102,${0.08 * (1 - local)})`;
        ctx.fillRect(c.x + wobbleX, 0, c.w, Math.min(h, fall + 40));
      }
    }

    // Scanline crumble.
    ctx.save();
    ctx.globalAlpha = 0.12 + p * 0.18;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let y = 0; y < canvas.height; y += 14){
      const dx = Math.sin(y * 0.05 + now * 0.012) * 18 * p;
      ctx.fillRect(dx, y, canvas.width, 1);
    }
    ctx.restore();

    if (p < 1){
      requestAnimationFrame(animateMelt);
      return;
    }

    finishMelt();
  }

  function finishMelt(){
    const a = api();
    if (a && typeof a.resetToSpeedOneAndMenu === "function"){
      a.resetToSpeedOneAndMenu();
    }

    setTimeout(() => {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
      canvas = null;
      ctx = null;
      sourceCanvas = null;
      sourceCtx = null;
      columns = [];
      melting = false;
      resetTimer();
    }, 220);
  }

  function tick(){
    if (melting) return;

    if (!isFrozenScene()){
      resetTimer();
      return;
    }

    if (!frozenStartedAt){
      frozenStartedAt = performance.now();
      return;
    }

    if (performance.now() - frozenStartedAt >= REQUIRED_MS){
      startMelt();
    }
  }

  window.addEventListener("resize", () => {
    if (melting && canvas) resizeCanvases();
  });

  setInterval(tick, CHECK_MS);
})();
