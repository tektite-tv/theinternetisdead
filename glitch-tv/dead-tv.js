// /glitch-tv/dead-tv.js
// DeadTV Resurrection — glitchcore overlay and canvas animation controller
// Compatible with your current dead-tv.html layout

// Element references
const root = document.documentElement;
const layerRoot = document.getElementById('layerRoot');
const hwrap = document.getElementById('hwrap');
const canvas = document.getElementById('lava');
const ctx = canvas.getContext('2d');

const angleSlider = document.getElementById('angle');
const angleVal = document.getElementById('angleVal');

// Buttons
const btnSpinOnce = document.getElementById('spinOnce');
const btnSpinLoop = document.getElementById('spinLoop');
const btnPulse = document.getElementById('pulse');
const btnStrobe = document.getElementById('strobe');
const btnCycle = document.getElementById('cycle');
const btnMeltdown = document.getElementById('meltdown');
const btnStop = document.getElementById('stop');
const btnDraw = document.getElementById('drawMode');
const btnSave = document.getElementById('saveShot');

// --- CANVAS SETUP ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let t = 0;
let stopAll = false;

// Basic lava noise background
function lava() {
  const w = canvas.width, h = canvas.height;
  const imageData = ctx.createImageData(w, h);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const x = (i / 4) % w;
    const y = Math.floor(i / 4 / w);
    const v = Math.sin(x * 0.02 + t) + Math.cos(y * 0.02 + t * 1.1);
    const c = Math.floor((v + 2) * 64);
    imageData.data[i] = c;
    imageData.data[i + 1] = c * 0.8;
    imageData.data[i + 2] = c * 1.2;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  t += 0.03;
  if (!stopAll) requestAnimationFrame(lava);
}

// --- STATE FLAGS ---
let spinLoop = false;
let pulseActive = false;
let strobeActive = false;
let cycleActive = false;
let meltdownActive = false;
let drawMode = false;

// --- ANGLE SLIDER ---
angleSlider.addEventListener('input', () => {
  const deg = parseFloat(angleSlider.value);
  root.style.setProperty('--angle', `${deg}deg`);
  angleVal.textContent = `${deg.toFixed(1)}°`;
});

// --- SPIN ONCE ---
btnSpinOnce.addEventListener('click', () => {
  let current = parseFloat(getComputedStyle(root).getPropertyValue('--angle')) || 0;
  const start = current, end = current + 360, duration = 2000;
  const startTime = performance.now();

  function step(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const deg = start + (end - start) * p;
    root.style.setProperty('--angle', `${deg}deg`);
    if (p < 1 && !stopAll) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
});

// --- SPIN LOOP ---
btnSpinLoop.addEventListener('click', () => {
  spinLoop = !spinLoop;
  btnSpinLoop.setAttribute('aria-pressed', spinLoop);
  if (spinLoop) spinAnim();
});

function spinAnim() {
  if (!spinLoop || stopAll) return;
  const a = (parseFloat(getComputedStyle(root).getPropertyValue('--angle')) || 0) + 0.8;
  root.style.setProperty('--angle', `${a}deg`);
  requestAnimationFrame(spinAnim);
}

// --- PULSE LINES ---
btnPulse.addEventListener('click', () => {
  pulseActive = !pulseActive;
  btnPulse.setAttribute('aria-pressed', pulseActive);
  if (pulseActive) pulseAnim();
});

function pulseAnim() {
  if (!pulseActive || stopAll) return;
  const period = 4 + Math.sin(Date.now() * 0.01) * 2;
  root.style.setProperty('--period', `${period}px`);
  requestAnimationFrame(pulseAnim);
}

// --- STROBE ---
btnStrobe.addEventListener('click', () => {
  strobeActive = !strobeActive;
  btnStrobe.setAttribute('aria-pressed', strobeActive);
  if (strobeActive) strobeAnim();
});

function strobeAnim() {
  if (!strobeActive || stopAll) return;
  layerRoot.classList.toggle('invert');
  setTimeout(strobeAnim, 60);
}

// --- COLOR CYCLE ---
btnCycle.addEventListener('click', () => {
  cycleActive = !cycleActive;
  btnCycle.setAttribute('aria-pressed', cycleActive);
  if (cycleActive) cycleAnim();
});

function cycleAnim() {
  if (!cycleActive || stopAll) return;
  const hue = (Date.now() / 10) % 360;
  root.style.setProperty('--line-color', `hsl(${hue},100%,75%)`);
  requestAnimationFrame(cycleAnim);
}

// --- MELTDOWN WARP ---
btnMeltdown.addEventListener('click', () => {
  meltdownActive = !meltdownActive;
  btnMeltdown.setAttribute('aria-pressed', meltdownActive);
  if (meltdownActive) meltdownAnim();
});

function meltdownAnim() {
  if (!meltdownActive || stopAll) return;
  const skew = Math.sin(Date.now() * 0.002) * 25;
  const scale = 1 + Math.sin(Date.now() * 0.001) * 0.1;
  root.style.setProperty('--skx', `${skew}deg`);
  root.style.setProperty('--sky', `${skew / 2}deg`);
  root.style.setProperty('--sc', scale);
  requestAnimationFrame(meltdownAnim);
}

// --- STOP EVERYTHING ---
btnStop.addEventListener('click', () => {
  stopAll = true;
  spinLoop = pulseActive = strobeActive = cycleActive = meltdownActive = false;
  document.querySelectorAll('.btn[aria-pressed="true"]').forEach(b => b.setAttribute('aria-pressed', false));
  layerRoot.classList.remove('invert');
  root.style.removeProperty('--skx');
  root.style.removeProperty('--sky');
  root.style.removeProperty('--sc');
  root.style.removeProperty('--line-color');
  root.style.setProperty('--period', '4px');
  setTimeout(() => { stopAll = false; lava(); }, 600);
});

// --- DRAW MODE ---
btnDraw.addEventListener('click', () => {
  drawMode = !drawMode;
  btnDraw.setAttribute('aria-pressed', drawMode);
});

canvas.addEventListener('mousemove', e => {
  if (!drawMode || !e.buttons) return;
  ctx.fillStyle = `hsl(${(e.clientX + e.clientY) % 360},100%,60%)`;
  ctx.beginPath();
  ctx.arc(e.clientX, e.clientY, 8, 0, Math.PI * 2);
  ctx.fill();
});

// --- SAVE SCREENSHOT ---
btnSave.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'dead-tv.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// Start background render
lava();
