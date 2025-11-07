const isMobile = matchMedia('(max-width: 768px)').matches;

// Lazy load html2canvas only for desktop
let html2canvasReady = false;
if (!isMobile) {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  s.onload = () => html2canvasReady = true;
  document.head.appendChild(s);
}

// Elements
const root = document.documentElement;
const angleInput = document.getElementById('angle');
const angleInputM = document.getElementById('angle_m');
const angleVal = document.getElementById('angleVal');
const layersEl = document.getElementById('layerRoot');
const controlsDesktop = document.getElementById('controlsDesktop');
const controlsMobile = document.getElementById('controlsMobile');
const drawerToggle = document.getElementById('drawerToggle');

// Press H to toggle all controls
let controlsVisible = true;
document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'h') {
    controlsVisible = !controlsVisible;
    const display = controlsVisible ? '' : 'none';
    controlsDesktop.style.display = display;
    controlsMobile.style.display = display;
    drawerToggle.style.display = display;
  }
});

// Drawer behavior (mobile)
if (isMobile) {
  drawerToggle.addEventListener('click', () => {
    const open = controlsMobile.classList.toggle('open');
    drawerToggle.setAttribute('aria-expanded', String(open));
    drawerToggle.textContent = open ? 'Hide Controls' : 'Controls';
  });
}

function setAngle(deg) {
  root.style.setProperty('--angle', deg + 'deg');
  angleVal.textContent = `${Number(deg).toFixed(1)}°`;
}

function syncSliders(fromMobile) {
  const v = fromMobile ? parseFloat(angleInputM.value) : parseFloat(angleInput.value);
  angleInput.value = v;
  angleInputM.value = v;
  state.manualAngle = v;
  if (!state.spinLoop && !state.spinOnce.active) setAngle(state.manualAngle);
}
angleInput.addEventListener('input', () => syncSliders(false));
angleInputM.addEventListener('input', () => syncSliders(true));
setAngle(angleInput.value);

// Canvas
const canvas = document.getElementById('lava');
const ctx = canvas.getContext('2d', { willReadFrequently: false });

let w, h, t = 0, renderScale = isMobile ? 0.5 : 1;
function resize() {
  const cssW = canvas.clientWidth | 0;
  const cssH = canvas.clientHeight | 0;
  w = canvas.width = Math.max(2, Math.floor(cssW * renderScale));
  h = canvas.height = Math.max(2, Math.floor(cssH * renderScale));
  canvas.style.width = '100%';
  canvas.style.height = '100%';
}
addEventListener('resize', resize);
resize();

/* === NEW FEATURE: Fullscreen Toggle (Press F) === */
document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'f') {
    if (!document.fullscreenElement) {
      if (canvas.requestFullscreen) canvas.requestFullscreen();
      else if (canvas.webkitRequestFullscreen) canvas.webkitRequestFullscreen();
      else if (canvas.msRequestFullscreen) canvas.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  }
});
/* === END FULLSCREEN FEATURE === */

function rainbow(x, y, time) {
  const r = Math.sin(0.0008 * x + time) * 127 + 128;
  const g = Math.sin(0.0008 * y + time + 2) * 127 + 128;
  const b = Math.sin(0.0008 * (x + y) + time + 4) * 127 + 128;
  return [r | 0, g | 0, b | 0];
}

const state = {
  manualAngle: parseFloat(angleInput.value),
  spinLoop: false,
  spinSpeed: 12,
  spinOnce: { active: false, start: 0, duration: 3000, from: 0, to: 0 },
  pulse: false, basePeriod: 4, minPeriod: 2, maxPeriod: 12, pulseHz: 0.6,
  strobe: false, strobeHz: 7, jitter: 0,
  cycle: false, hue: 0, hueSpeed: 40,
  meltdown: false, meltAmpSkew: 10, meltAmpScale: 0.12, meltHz: 0.33
};

const el = id => document.getElementById(id);
const btnSpinOnce = el('spinOnce');
const btnSpinLoop = el('spinLoop');
const btnPulse = el('pulse');
const btnStrobe = el('strobe');
const btnCycle = el('cycle');
const btnMeltdown = el('meltdown');
const btnStop = el('stop');
const btnSave = el('saveShot');
const btnDraw = el('drawMode');

function setPressed(btn, val) {
  btn.setAttribute('aria-pressed', String(val));
}

// === DRAW FEATURE ===
let drawing = false;
let drawEnabled = false;
let drawCtx, drawCanvas;

function initDrawCanvas() {
  drawCanvas = document.createElement('canvas');
  drawCanvas.id = 'drawCanvas';
  drawCanvas.width = innerWidth;
  drawCanvas.height = innerHeight;
  Object.assign(drawCanvas.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    zIndex: '5',
    touchAction: 'none',
    pointerEvents: 'none'
  });
  document.body.appendChild(drawCanvas);
  drawCtx = drawCanvas.getContext('2d');
  drawCtx.lineCap = 'round';
  drawCtx.lineJoin = 'round';
  drawCtx.lineWidth = 8;
}
initDrawCanvas();

addEventListener('resize', () => {
  drawCanvas.width = innerWidth;
  drawCanvas.height = innerHeight;
});

function toggleDraw() {
  drawEnabled = !drawEnabled;
  btnDraw && setPressed(btnDraw, drawEnabled);
  const mobDraw = controlsMobile.querySelector('[data-act="draw"]');
  if (mobDraw) setPressed(mobDraw, drawEnabled);
  drawCanvas.style.pointerEvents = drawEnabled ? 'auto' : 'none';
  if (!drawEnabled) drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
}

let hue = 0;
drawCanvas.addEventListener('pointerdown', e => {
  if (!drawEnabled) return;
  drawing = true;
  drawCtx.beginPath();
  drawCtx.moveTo(e.clientX, e.clientY);
  drawCanvas.setPointerCapture(e.pointerId);
});
drawCanvas.addEventListener('pointermove', e => {
  if (!drawEnabled || !drawing) return;
  hue = (hue + 2) % 360;
  drawCtx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
  drawCtx.lineTo(e.clientX, e.clientY);
  drawCtx.stroke();
});
drawCanvas.addEventListener('pointerup', e => {
  if (drawing) {
    drawing = false;
    drawCtx.closePath();
    drawCanvas.releasePointerCapture(e.pointerId);
  }
});
drawCanvas.addEventListener('pointerleave', () => {
  if (drawing) {
    drawing = false;
    drawCtx.closePath();
  }
});
// === END DRAW FEATURE ===

function getCurrentAngle() {
  const v = getComputedStyle(root).getPropertyValue('--angle').trim();
  return parseFloat(v.endsWith('deg') ? v.slice(0, -3) : v);
}

function stopAll() {
  state.spinLoop = false;
  state.spinOnce.active = false;
  state.pulse = false;
  state.strobe = false;
  state.cycle = false;
  state.meltdown = false;
  [btnSpinLoop, btnPulse, btnStrobe, btnCycle, btnMeltdown].forEach(b => b && setPressed(b, false));
  const mobBtns = controlsMobile.querySelectorAll('[data-act][aria-pressed="true"]');
  mobBtns.forEach(b => setPressed(b, false));
  setAngle(state.manualAngle);
  root.style.setProperty('--period', state.basePeriod + 'px');
  root.style.setProperty('--line-color', 'hsla(0,0%,100%,0.9)');
  root.style.setProperty('--bgx', '0px');
  root.style.setProperty('--bgy', '0px');
  root.style.setProperty('--skx', '0deg');
  root.style.setProperty('--sky', '0deg');
  root.style.setProperty('--sc', '1');
  layersEl.classList.remove('invert');
}

// Bind buttons
btnSpinOnce.addEventListener('click', () => {
  state.spinOnce.active = true;
  state.spinOnce.start = performance.now();
  state.spinOnce.from = getCurrentAngle();
  state.spinOnce.to = state.spinOnce.from + 360;
});
btnSpinLoop.addEventListener('click', () => {
  state.spinLoop = !state.spinLoop;
  setPressed(btnSpinLoop, state.spinLoop);
});
btnPulse.addEventListener('click', () => {
  state.pulse = !state.pulse;
  setPressed(btnPulse, state.pulse);
  if (!state.pulse) root.style.setProperty('--period', state.basePeriod + 'px');
});
btnStrobe.addEventListener('click', () => {
  state.strobe = !state.strobe;
  setPressed(btnStrobe, state.strobe);
  if (!state.strobe) {
    layersEl.classList.remove('invert');
    root.style.setProperty('--bgx', '0px');
    root.style.setProperty('--bgy', '0px');
  }
});
btnCycle.addEventListener('click', () => {
  state.cycle = !state.cycle;
  setPressed(btnCycle, state.cycle);
  if (!state.cycle) root.style.setProperty('--line-color', 'hsla(0,0%,100%,0.9)');
});
btnMeltdown.addEventListener('click', () => {
  state.meltdown = !state.meltdown;
  setPressed(btnMeltdown, state.meltdown);
  if (!state.meltdown) {
    root.style.setProperty('--skx', '0deg');
    root.style.setProperty('--sky', '0deg');
    root.style.setProperty('--sc', '1');
  }
});
btnStop.addEventListener('click', stopAll);
btnDraw.addEventListener('click', toggleDraw);

async function saveComposite() {
  if (isMobile || !html2canvasReady || !window.html2canvas) return;
  try {
    controlsDesktop.style.visibility = 'hidden';
    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const offctx = off.getContext('2d');
    offctx.drawImage(canvas, 0, 0);
    const layerCanvas = await html2canvas(layersEl, { useCORS: true, backgroundColor: null });
    offctx.drawImage(layerCanvas, 0, 0);
    offctx.drawImage(drawCanvas, 0, 0);
    const link = document.createElement('a');
    link.download = 'screenshot.png';
    link.href = off.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('Screenshot failed:', err);
  } finally {
    controlsDesktop.style.visibility = '';
  }
}
btnSave.addEventListener('click', saveComposite);

// Mobile control delegation
controlsMobile.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.getAttribute('data-act');
  switch (act) {
    case 'spinOnce': state.spinOnce.active = true; state.spinOnce.start = performance.now();
      state.spinOnce.from = getCurrentAngle(); state.spinOnce.to = state.spinOnce.from + 360; break;
    case 'spinLoop': state.spinLoop = !state.spinLoop; setPressed(b, state.spinLoop); break;
    case 'pulse': state.pulse = !state.pulse; setPressed(b, state.pulse);
      if (!state.pulse) root.style.setProperty('--period', state.basePeriod + 'px'); break;
    case 'strobe': state.strobe = !state.strobe; setPressed(b, state.strobe);
      if (!state.strobe) { layersEl.classList.remove('invert'); root.style.setProperty('--bgx','0px'); root.style.setProperty('--bgy','0px'); } break;
    case 'cycle': state.cycle = !state.cycle; setPressed(b, state.cycle);
      if (!state.cycle) root.style.setProperty('--line-color', 'hsla(0,0%,100%,0.9)'); break;
    case 'meltdown': state.meltdown = !state.meltdown; setPressed(b, state.meltdown);
      if (!state.meltdown) { root.style.setProperty('--skx','0deg'); root.style.setProperty('--sky','0deg'); root.style.setProperty('--sc','1'); } break;
    case 'stop': stopAll(); break;
    case 'draw': toggleDraw(); break;
  }
});

// Animation loop
let last = performance.now();
let skip = false;
function tick(now) {
  const dt = (now - last) / 1000;
  last = now;

  if (state.spinOnce.active) {
    const p = Math.min(1, (now - state.spinOnce.start) / state.spinOnce.duration);
    const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const a = state.spinOnce.from + (state.spinOnce.to - state.spinOnce.from) * ease;
    setAngle(a);
    if (p >= 1) {
      state.spinOnce.active = false;
      state.manualAngle = a % 360;
      angleInput.value = state.manualAngle;
      angleInputM.value = state.manualAngle;
    }
  } else if (state.spinLoop) {
    setAngle(getCurrentAngle() + state.spinSpeed * dt);
  }

  if (state.pulse) {
    const omega = 2 * Math.PI * state.pulseHz;
    const time = now / 1000;
    const s = (Math.sin(omega * time) + 1) / 2;
    const period = state.minPeriod + s * (state.maxPeriod - state.minPeriod);
    root.style.setProperty('--period', period.toFixed(2) + 'px');
  }

  if (state.strobe) {
    const flash = Math.random() < state.strobeHz * dt * 0.5;
    if (flash) layersEl.classList.toggle('invert');
    root.style.setProperty('--bgx', ((Math.random() - 0.5) * 12).toFixed(1) + 'px');
    root.style.setProperty('--bgy', ((Math.random() - 0.5) * 12).toFixed(1) + 'px');
  }

  if (state.cycle) {
    state.hue = (state.hue + state.hueSpeed * dt) % 360;
    root.style.setProperty('--line-color', `hsla(${state.hue.toFixed(1)}, 95%, 70%, 0.95)`);
  }

  if (state.meltdown) {
    const tsec = now / 1000;
    const skx = Math.sin(2 * Math.PI * state.meltHz * tsec) * state.meltAmpSkew;
    const sky = Math.cos(2 * Math.PI * state.meltHz * tsec * 0.8) * state.meltAmpSkew;
    const sc = 1 + Math.sin(2 * Math.PI * state.meltHz * tsec * 1.3) * state.meltAmpScale;
    root.style.setProperty('--skx', skx.toFixed(2) + 'deg');
    root.style.setProperty('--sky', sky.toFixed(2) + 'deg');
    root.style.setProperty('--sc', sc.toFixed(3));
  }

  if (isMobile) {
    skip = !skip;
    if (skip) { requestAnimationFrame(tick); return; }
  }

  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const [r, g, b] = rainbow(x, y, t * 0.02);
      const idx = (y * w + x) * 4;
      d[idx] = r; d[idx + 1] = g; d[idx + 2] = b; d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  t++;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
