/* ======================================================================
  PROJECT CHANGELOG / REMOVAL LOG
========================================================================
[REMOVAL LOG]

- 2025-12-24 | v1.96
  Added: Pause commands /fullscreen (toggle fullscreen) and /help (lists commands alphabetically).


- 2025-12-23 | v1.96
  Added: Native Xbox controller support via Gamepad API (move/aim/shoot/shield/bomb/pause + menu navigation).


- 2025-12-17 | v1.96
  Fixed: Game not starting / enemy images not loading due to runtime error.
  Cause: resize() called resetStarfield() before starLayers const initialized (TDZ).
  Fix: Initialize starfield definitions before resize() runs; make resize() safe.

- 2025-12-17 | v1.96
  Undo: v1.96 "simplified demo" version (removed menus/options/combat/etc.).
  Reason: User requested undo; restored full game build.
  Added: Player size increase + enforced vertical padding between formation and player.
  Location: player sizing, spawnEnemies baseY, update() formation Y clamp.

- 2025-12-17 | v1.96
  Added: Responsive desktop spacing so enemy formation uses screen width better.
  Added: Hard top-of-screen clamp so enemies stay visible even after step-downs.
  Tweaked: Reduced enemy base size + breathing scale to prevent overlap on desktop.
  Tweaked: Formation edge detection uses predicted next position to avoid clipping.


- 2025-12-17 | v1.96
  Added: Galaga-like enemy descent (continuous downward pressure) + predictable wobble.
  Tweaked: Enemy formation clamped to ~top half of screen (prevents encroaching into player zone).
  Tweaked: Increased base enemy spacing (X/Y) for clearer separation.
  Added: Wave banner ("WAVE 1", "WAVE 2", etc.) shown on start and after wave clears.
  Tweaked: Difficulty scaling per wave (enemy horizontal speed, descent speed, step-down).


- 2025-12-17 | v1.96
  Added: Wave spawn scaling: Wave 1 = 1 enemy, then doubles each wave (capped).
  Tweaked: FUN MODE: more lives, slower enemy pressure, slower swoops, faster bullets, gentler scaling.
  Added: Dynamic formation packing: auto-cols/rows + auto enemy sizing to fit top-zone area.
  Kept: Galaga-style 'swoop' attackers: individual enemies break formation, dive toward the player, then return.
  Kept: Main formation stays in the top zone; only swoopers can enter player space.
  Tweaked: Player fire rate increases each wave (cooldown decreases).


- 2025-12-17 | v1.96
  Tweaked: Player bullets are slightly larger than enemy bullets (visual clarity).
  Added: Player bullets can collide with enemy bullets; both are deleted on contact (counter-shot mechanic).

- 2025-12-17 | v1.96
  Added: Always-on player health bar under the player.
  Changed: Health replaces lives. Each enemy hit drains 25% health (4 hits total).
  Added: On death, player explodes into violent pixel-dust particles and returns to menu.



- 2025-12-17 | v1.96
  Fix: Restored any accidentally removed gameplay systems while adding UI and powerups.
  Kept: 360° aim + orbit triangle, straight bullets, bullet-vs-bullet cancel, Galaga formation + swoops, wave sizing 1/2/4/6/..., HUD toggle, menus/options.
  Added: Lives box (bottom-left), powerup slot with 'Press Q', YOU DIED overlay + Restart reset, UFO 25% wave spawn with 3-hit color cycle + fade granting 💥, Q bomb drop (+ flash then AoE + knockback), health bar (4 hits per life), pixel-dust death.
- 2025-12-19 | v1.96
  Changed: 💥 bomb is now a short-range shot (spawns ahead of player in aim direction).
  Changed: Bomb detonates immediately on first enemy contact and can multi-kill enemies in the blast radius.

- 2025-12-19 | v1.96
  Changed: Bomb-killing a dragon.gif enemy no longer grants free armor.
  Changed: Frog kills no longer heal the player or award free lives.

====================================================================== */


/* =======================
   Paths (EDIT IF NEEDED)
======================= */
const ENEMY_WEBP_BASE = "/games/shooter-game/assets/enemy-webps/";
const ENEMY_WEBP_INDEX_URL = "/games/shooter-game/assets/enemy-webps.json";
const PLAYER_IMG_URL = "/games/shooter-game/assets/bananarama.gif";
const BOSS_IMG_URL = ENEMY_WEBP_BASE + "180px-NO_U_cycle.webp";
const ENEMY_ASSET_BASE = ENEMY_WEBP_BASE; // kept for legacy enemy-path code
const AUDIO_HIT = "/media/audio/hitmarker.mp3";
const AUDIO_OOF = "/media/audio/oof.mp3";


/* =======================
   Audio
======================= */
const AUDIO_BG_MUSIC = "/media/audio/spaceinvaders.mp3";
const AUDIO_DEATH_YELL = "/media/audio/link-yell.mp3";

// Background music (loops). We start it on the first user interaction (autoplay rules).
const musicBg = new Audio(AUDIO_BG_MUSIC);
musicBg.loop = true;
musicBg.preload = "auto";
musicBg.volume = 0.6;

// Death yell (plays once when GAME OVER screen appears)
const sfxDeath = new Audio(AUDIO_DEATH_YELL);
sfxDeath.preload = "auto";
sfxDeath.volume = 0.10;

// Global mute toggle (M key)
let audioMuted = false;

function applyMuteState(){
  const m = !!audioMuted;
  musicBg.muted = m;
  sfxDeath.muted = m;
  sfxHit.muted = m;
  sfxOof.muted = m;
}

function tryPlayWithRetry(audioEl, retries=20, delayMs=80){
  if (!audioEl || audioMuted) return;
  try{
    audioEl.muted = !!audioMuted;
  }catch(e){}
  try{
    const p = audioEl.play();
    if (p && typeof p.catch === "function"){
      p.catch(() => {
        // Some browsers reject play() briefly even when audio is "unlocked".
        // We retry a handful of times so the sound lands as soon as it's allowed.
        if (retries > 0){
          setTimeout(() => tryPlayWithRetry(audioEl, retries - 1, delayMs), delayMs);
        }
      });
    }
  }catch(e){
    if (retries > 0){
      setTimeout(() => tryPlayWithRetry(audioEl, retries - 1, delayMs), delayMs);
    }
  }
}

function ensureMusicPlaying(restart=false){
  // Start/resume looping background music immediately when gameplay begins.
  // "restart=true" forces it back to the beginning.
  try{
    if (restart){
      musicBg.currentTime = 0;
    }
    musicBg.loop = true;
  }catch(e){}
  if (audioMuted) return;
  try{
    // If already playing and not restarting, leave it alone.
    if (!restart && !musicBg.paused) return;
    tryPlayWithRetry(musicBg, 30, 80);
  }catch(e){}
}

function stopMusic(){
  try{
    musicBg.pause();
    musicBg.currentTime = 0;
  }catch(e){}
}

function playDeathYell(){
  if (audioMuted) return;
  try{
    sfxDeath.currentTime = 0;
    sfxDeath.muted = !!audioMuted;
  }catch(e){}
  // Try immediately, then retry briefly to avoid "plays only after next keypress" behavior.
  sfxDeath.play().catch(()=>{ tryPlayWithRetry(sfxDeath, 30, 60); });
}

/* =======================
   Player Firing Tuning
======================= */
const BASE_PLAYER_FIRE_COOLDOWN = 0.26; // seconds (wave scaling reduces this)
const PLAYER_BULLET_SPEED  = 8.0; // pixels per frame-ish (magnitude); direction comes from aim

function getPlayerFireCooldown(){
  // v1.96: player shoots faster every wave (lower cooldown)
  return Math.max(0.14, BASE_PLAYER_FIRE_COOLDOWN * Math.pow(0.94, (wave-1)));
}

/* =======================
   Canvas + Globals
======================= */
const canvas = document.getElementById("game");
// v1.96: Mouse handlers for holding the energy shield (RMB)
canvas.addEventListener("contextmenu", (e)=>e.preventDefault());
canvas.addEventListener("mousedown", (e)=>{
  if (keyboardBindings.shield === mouseButtonToBinding(e.button)){
    mouseShieldHolding = true;
    if (canActivateShield()) startShield();
  }
});
canvas.addEventListener("mouseup", (e)=>{
  if (keyboardBindings.shield === mouseButtonToBinding(e.button)){
    mouseShieldHolding = false;
    stopShield(false);
  }
});

const ctx = canvas.getContext("2d");

// Mobile sanity: disable scroll/zoom
document.body.style.touchAction = "none";
canvas.style.touchAction = "none";


// v1.96: Starfield background color override (default is black)
var starfieldBgOverride = null; // CSS color string (e.g. "navy" or "#0b1020") or null
// =======================
// Post FX: chromatic aberration + gentle hue drift (beat-reactive)
// =======================
const fxCanvas = document.createElement("canvas");
const fxCtx = fxCanvas.getContext("2d");

// v1.96: allow disabling post-processing via /video_fx
let VIDEO_FX_ENABLED = false;

// Screen-glitch spiral burst
let GLITCH_SPIRAL_T = 0;
const GLITCH_SPIRAL_DUR = 2.8;
function triggerGlitchSpiral(){
  GLITCH_SPIRAL_T = GLITCH_SPIRAL_DUR;
}

function resizeFX(){
  fxCanvas.width = canvas.width;
  fxCanvas.height = canvas.height;
}

// Audio analysis (uses the looping background music)
let audioCtx = null;
let analyser = null;
let freqData = null;
let beatLevel = 0; // smoothed 0..1

function initAudioAnalyser(){
  if (analyser || !musicBg) return;
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    freqData = new Uint8Array(analyser.frequencyBinCount);

    const srcNode = audioCtx.createMediaElementSource(musicBg);
    srcNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  }catch(e){
    // If the browser refuses (some do), we silently run FX in "ambient" mode.
    analyser = null;
  }
}

function getBeat(){
  // Gentle smoothing: quick rise, slow fall (prevents strobe)
  let v = 0;
  if (analyser && freqData){
    analyser.getByteFrequencyData(freqData);
    let sum = 0;
    for (let i = 0; i < freqData.length; i++) sum += freqData[i];
    v = (sum / freqData.length) / 255; // 0..1
  } else {
    // fallback "ambient pulse" if audio analysis unavailable
    v = 0.10 + 0.06 * Math.sin(time * 1.7);
  }

  // Smooth
  const attack = 0.45;
  const release = 0.08;
  if (v > beatLevel) beatLevel += (v - beatLevel) * attack;
  else beatLevel += (v - beatLevel) * release;

  return Math.max(0, Math.min(1, beatLevel));
}

function applyChromaticAberration(beat){
  const w = canvas.width, h = canvas.height;
  if (!w || !h) return;

  // Subtle offsets: ~1..4px
  const shift = 1.2 + beat * 2.8;

  // Slow hue drift; beat adds a gentle push
  const hue = (time * 10 + beat * 55) % 360;

  fxCtx.clearRect(0,0,w,h);

  // Base image with hue shift
  fxCtx.filter = `hue-rotate(${hue}deg)`;
  fxCtx.drawImage(canvas, 0, 0);

  // Light channel separation glow
  fxCtx.globalCompositeOperation = "screen";

  fxCtx.filter = `hue-rotate(${hue + 25}deg)`;
  fxCtx.drawImage(canvas, -shift, 0);

  fxCtx.filter = `hue-rotate(${hue + 55}deg)`;
  fxCtx.drawImage(canvas, shift, 0);

  fxCtx.globalCompositeOperation = "source-over";
  fxCtx.filter = "none";

  // Copy back
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(fxCanvas, 0, 0);
}

function syncWholeScreenVideoFx(beat=0){
  const enabled = !!VIDEO_FX_ENABLED;
  document.body.classList.toggle("videoFxActive", enabled);
  if (!enabled) return;
  const hue = (time * 10 + beat * 55) % 360;
  const shift = 1.2 + beat * 2.8;
  const overlayOpacity = Math.max(0.10, Math.min(0.28, 0.13 + beat * 0.14));
  document.documentElement.style.setProperty("--video-fx-hue", `${hue}deg`);
  document.documentElement.style.setProperty("--video-fx-shift", `${shift}px`);
  document.documentElement.style.setProperty("--video-fx-overlay-opacity", String(overlayOpacity));
}

function setVideoFxEnabled(enabled){
  VIDEO_FX_ENABLED = !!enabled;
  syncWholeScreenVideoFx(getBeat());
  syncCheatsMenuState();
}


const overlay = document.getElementById("overlay");
const livesSlot = document.getElementById("livesSlot");
const livesText = document.getElementById("livesText");
const powerupSlot = document.getElementById("powerupSlot");
const powerupHint = document.getElementById("powerupHint");
;
const deathOverlay = document.getElementById("deathOverlay");
const btnRestart = document.getElementById("btnRestart");
const btnDeathQuitToMenu = document.getElementById("btnDeathQuitToMenu");
const winOverlay = document.getElementById("winOverlay");
const btnContinue = document.getElementById("btnContinue");

let hudVisible = false;

// =======================
// Pause (v1.96)
// - ESC toggles pause while playing.
// - Freezes gameplay updates and input-driven actions.
// =======================
const pauseOverlay = document.getElementById("pauseOverlay");
const scoreStorePanel = document.getElementById("scoreStorePanel");
const scoreStoreItemsEl = document.getElementById("scoreStoreItems");
const scoreStoreCurrentScoreEl = document.getElementById("scoreStoreCurrentScore");
const scoreStoreStatusEl = document.getElementById("scoreStoreStatus");
const btnScoreStoreClose = document.getElementById("btnScoreStoreClose");

const btnPauseOpenStore = document.getElementById("btnPauseOpenStore");
const btnPauseOpenChat = document.getElementById("btnPauseOpenChat");
const pauseCommand = null;
const pauseCmdSuggest = null;
let parentChatVisible = false;
const pauseCloseBtn = document.getElementById("pauseCloseBtn");
if (pauseCloseBtn){
  pauseCloseBtn.addEventListener("click", () => {
    // Resume gameplay
    if (typeof togglePause === "function") togglePause();
  });
}
let isPaused = false;
let isScoreStoreOpen = false;
let scoreStoreFocusIndex = 0;
const btnPauseQuit = document.getElementById("btnPauseQuit");
if (btnPauseQuit){
  btnPauseQuit.addEventListener("click", () => {
    // Unpause and return to start menu
    setPaused(false);
    stopMusic();
    _resetStartResourceDefaults();
    showMenu();
  });
}

const btnPauseResume = document.getElementById("btnPauseResume");
if (btnPauseResume){
  btnPauseResume.addEventListener("click", () => {
    // Resume gameplay (same as pressing ESC)
    togglePause();
  });
}
if (btnPauseOpenStore){
  btnPauseOpenStore.addEventListener("click", () => {
    if (!canOpenStore()) return;
    openScoreStoreMenu();
  });
}
function setScoreStoreOverlayVisible(visible){
  isScoreStoreOpen = !!visible;
  if (pauseOverlay) pauseOverlay.classList.toggle("scoreStoreVisible", isScoreStoreOpen);
}
function setScoreStoreStatus(message){
  if (!scoreStoreStatusEl) return;
  scoreStoreStatusEl.textContent = message || "Select an item to preview this score-spend slot.";
}
function renderScoreStoreMenu(){
  if (scoreStoreCurrentScoreEl){
    scoreStoreCurrentScoreEl.textContent = "Current Score: " + String(Math.floor(score)) + "pts";
  }
  setScoreStoreStatus("");
  if (!scoreStoreItemsEl) return;
  scoreStoreItemsEl.innerHTML = "";
  SCORE_STORE_ITEMS.forEach((item) => {
    const row = document.createElement("div");
    row.className = "scoreStoreRow optRow";

    const meta = document.createElement("div");
    meta.className = "scoreStoreMeta";

    const head = document.createElement("div");
    head.className = "scoreStoreHead";

    const title = document.createElement("div");
    title.className = "scoreStoreItemTitle";
    title.textContent = item.label;

    const cost = document.createElement("div");
    cost.className = "scoreStoreCost";
    cost.textContent = String(item.cost) + " pts";

    const detail = document.createElement("div");
    detail.className = "scoreStoreItemDetail";
    detail.textContent = item.description;

    const action = document.createElement("button");
    action.type = "button";
    action.className = "scoreStoreAction smallBtn";
    action.dataset.scoreStoreItemId = item.id;
    action.textContent = String(item.cost) + " pts";
    action.addEventListener("click", () => {
      const currentScore = Math.floor(score);
      if (currentScore < item.cost){
        setScoreStoreStatus(item.label + " costs " + item.cost + " pts. Purchase logic is still a placeholder.");
        return;
      }
      setScoreStoreStatus(item.label + " is listed and selectable, but spending logic is still a placeholder.");
    });

    head.appendChild(title);
    head.appendChild(cost);
    meta.appendChild(head);
    meta.appendChild(detail);
    row.appendChild(meta);
    row.appendChild(action);
    scoreStoreItemsEl.appendChild(row);
  });
}
function openScoreStoreMenu(){
  if (!pauseOverlay || gameState !== STATE.PLAYING || isDead || !isStoreUnlocked()) return;
  setPaused(true);
  renderScoreStoreMenu();
  setScoreStoreOverlayVisible(true);
  scoreStoreFocusIndex = 0;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncScoreStoreControllerFocus();
  else clearControllerFocus();
}
function closeScoreStoreMenu(options = null){
  if (!isScoreStoreOpen) return;
  scoreStoreFocusIndex = 0;
  setScoreStoreOverlayVisible(false);
  if (activeInputMode === INPUT_MODE_CONTROLLER && isPaused) syncPauseControllerFocus();
  else clearControllerFocus();
}
if (btnScoreStoreClose){
  btnScoreStoreClose.addEventListener("click", () => {
    closeScoreStoreMenu();
  });
}

function requestOpenChatFromPause(){
  try{ setPaused(true); }catch(e){}
  requestOpenChat(false, "");
}
function showPauseControlsMenu(){
  if (!controlsMenu || !isPaused) return;
  pauseControlsOpen = true;
  resetDraftBindingsFromActive();
  pauseOverlay.classList.add("pauseControlsVisible");
  uiRoot.classList.add("pauseControlsOpen");
  lockControlsInputMode(activeInputMode);
  startMenu.style.display = "none";
  optionsMenu.style.display = "none";
  controlsMenu.style.display = "block";
  controlsMenu.classList.add("pauseControlsMode");
  uiRoot.style.display = "flex";
  updateControlsDisplay();
  renderControlsBindingList();
  fitControlsMenuToViewport();
  controlsFocusIndex = 0;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncControlsControllerFocus();
  else clearControllerFocus();
}
function hidePauseControlsMenu(){
  if (!pauseControlsOpen) return;
  pauseControlsOpen = false;
  controlsMenu.classList.remove("pauseControlsMode");
  controlsMenu.style.display = "none";
  pauseOverlay.classList.remove("pauseControlsVisible");
  uiRoot.classList.remove("pauseControlsOpen");
  uiRoot.style.display = "none";
  unlockControlsInputMode();
  cancelBindingEdit();
  pauseFocusIndex = 0;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncPauseControllerFocus();
  else clearControllerFocus();
}
if (btnPauseOpenChat){
  btnPauseOpenChat.addEventListener("click", () => {
    showPauseControlsMenu();
  });
}

// Temporary glitch spiral post effect (triggered by Tab)
// Uses the existing fxCanvas as a scratch buffer.
// strength: 0..1 (1 = strongest)
function applyGlitchSpiral(strength){
  const w = canvas.width, h = canvas.height;
  if (!w || !h) return;

  // Copy current frame into fxCanvas
  fxCanvas.width = w; fxCanvas.height = h;
  fxCtx.setTransform(1,0,0,1,0,0);
  fxCtx.clearRect(0,0,w,h);
  fxCtx.drawImage(canvas, 0, 0);

  const t = performance.now() * 0.001;

  // Spiral parameters
  const spin = (2.5 + strength * 7.5) * Math.sin(t * 5.0);
  const zoom = 1 + strength * (0.08 + 0.12 * Math.sin(t * 6.5));
  const wob  = strength * 10 * Math.sin(t * 9.0);

  // Base clear
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,w,h);

  // Draw a few rotated/scaled layers with subtle channel offsets and slice jitter
  const layers = 5;
  for (let i = 0; i < layers; i++){
    const a = spin * (0.25 + i * 0.12) + (Math.sin(t*3.0 + i) * 0.08);
    const s = zoom * (1 + i * 0.02 * strength);
    const ox = (Math.sin(t*7.0 + i*1.7) * (6 + 18*strength)) + wob;
    const oy = (Math.cos(t*6.0 + i*1.3) * (6 + 18*strength)) - wob;

    ctx.save();
    ctx.translate(w/2 + ox, h/2 + oy);
    ctx.rotate(a);
    ctx.scale(s, s);
    ctx.translate(-w/2, -h/2);

    // Slight RGB-ish offset using multiple draws (cheap and dirty)
    ctx.globalAlpha = 0.55 - i * 0.08;
    ctx.drawImage(fxCanvas, -2*strength, 0, w, h);
    ctx.globalAlpha = 0.40 - i * 0.06;
    ctx.drawImage(fxCanvas,  2*strength, 0, w, h);
    ctx.globalAlpha = 0.35 - i * 0.05;
    ctx.drawImage(fxCanvas, 0, 0, w, h);
    ctx.restore();
  }

  // Glitch slices: horizontal bands shifted sideways
  const bands = Math.floor(6 + strength * 16);
  for (let b = 0; b < bands; b++){
    const y = Math.floor(Math.random() * h);
    const bh = Math.floor(2 + Math.random() * (8 + 18*strength));
    const dx = Math.floor((Math.random()*2 - 1) * (30 + 160*strength));
    ctx.globalAlpha = 0.25 + Math.random() * 0.35;
    ctx.drawImage(fxCanvas, 0, y, w, bh, dx, y, w, bh);
  }

  // Noise overlay
  ctx.globalAlpha = 0.10 + 0.18 * strength;
  for (let k = 0; k < 200 + strength * 900; k++){
    const x = Math.random() * w;
    const y = Math.random() * h;
    const s = 1 + Math.random() * (2 + 2*strength);
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}

function setPaused(p){
  isPaused = !!p;
  if (!isPaused && pauseControlsOpen) hidePauseControlsMenu();
  if (!isPaused){
    if (isScoreStoreOpen) setScoreStoreOverlayVisible(false);
  }
  if (pauseOverlay) pauseOverlay.style.display = isPaused ? "flex" : "none";
  if (isPaused){
    pauseFocusIndex = 0;
    if (!parentChatVisible && !pauseControlsOpen && !isScoreStoreOpen) syncPauseControllerFocus();
  } else if (gameState !== STATE.MENU && gameState !== STATE.OPTIONS){
    clearControllerFocus();
  }

  // v1.96: focus the command input when paused
  if (pauseCommand){
    if (isPaused){
      setTimeout(()=>{ try{ pauseCommand.focus(); }catch(e){} }, 0);
    } else {
      try{ pauseCommand.blur(); }catch(e){}
      pauseCommand.value = "";
      if (pauseCmdSuggest){ pauseCmdSuggest.style.display = "none"; pauseCmdSuggest.innerHTML = ""; }
    }
  }

  // v1.96: pause ALSO pauses the looping music (resume continues from same timestamp)
  try{
    if (isPaused){
      if (!musicBg.paused) musicBg.pause();
    } else {
      // only resume if we're in gameplay and not muted
      if (gameState === STATE.PLAYING && !audioMuted) musicBg.play().catch(()=>{});
    }
  }catch(e){}

  // When pausing, clear held movement keys so you don't "drift" on resume.
  if (isPaused){
    for (const k in keys) keys[k] = false;
  }
}

function _applyLives(n, forceInfinite){
  const nextLives = forceInfinite ? 100 : Math.max(0, parseInt(n, 10) || 0);
  livesInfiniteActive = !!forceInfinite;
  lives = nextLives;
  _syncStartResourceControls();
  if (livesText) livesText.textContent = livesInfiniteActive ? "x∞" : ("x" + lives);
}

function _applyHearts(n, forceInfinite){
  heartsInfiniteActive = !!forceInfinite;
  MAX_HEARTS = heartsInfiniteActive ? 100 : Math.max(1, parseInt(n, 10) || 1);
  HIT_DAMAGE = 1 / MAX_HEARTS;
  _syncStartResourceControls();
  // Top off health so the new max doesn't instantly punish you.
  health = 1.0;
  if (typeof updateHearts === "function") updateHearts();
  // Re-anchor the player in case the hearts HUD size changes.
  try{ player.y = getPlayerAlignedY(); }catch(e){}
}

function _applyShields(n, forceInfinite){
  const nextShields = forceInfinite ? 100 : Math.max(0, parseInt(n, 10) || 0);
  shieldsInfiniteActive = !!forceInfinite;
  shieldPips = nextShields;
  _syncStartResourceControls();
  if (typeof updateHearts === "function") updateHearts();
}

function _applyBombs(n, forceInfinite){
  const nextBombs = forceInfinite ? 100 : Math.max(0, parseInt(n, 10) || 0);
  bombsInfiniteActive = !!forceInfinite;
  bombsCount = nextBombs;
  _syncStartResourceControls();
  _syncBombHud();
}
function renderMenuHudPreview(){
  const heartsHud = getHeartsHudEl();
  const previewLivesInfinite = !!(START_LIVES_INFINITE || INFINITE_MODE);
  const previewHeartsInfinite = !!(START_HEARTS_INFINITE || INFINITE_MODE);
  const previewShieldsInfinite = !!(START_SHIELDS_INFINITE || INFINITE_MODE);
  const previewBombsInfinite = !!(START_BOMBS_INFINITE || INFINITE_MODE);
  const previewLives = previewLivesInfinite ? 100 : Math.max(0, parseInt(START_LIVES, 10) || 0);
  const previewHearts = previewHeartsInfinite ? 100 : Math.max(1, parseInt(START_HEARTS, 10) || 1);
  const previewShields = previewShieldsInfinite ? 100 : Math.max(0, parseInt(START_SHIELDS, 10) || 0);
  const previewBombs = previewBombsInfinite ? 100 : Math.max(0, parseInt(START_BOMBS, 10) || 0);
  const maxVisibleHudIcons = 5;

  if (livesSlot) livesSlot.style.display = (previewLivesInfinite || previewLives > 0) ? "flex" : "none";
  if (livesText) livesText.textContent = previewLivesInfinite ? "x∞" : ("x" + previewLives);

  if (powerupSlot) powerupSlot.style.display = (previewBombsInfinite || previewBombs > 0) ? "flex" : "none";
  if (powerupHint){
    if (previewBombsInfinite) powerupHint.textContent = "Press Q (∞)";
    else powerupHint.textContent = "Press Q" + (previewBombs > 1 ? (" x" + previewBombs) : "");
  }

  if (scoreStoreHud){
    scoreStoreHud.style.display = "flex";
    scoreStoreHud.classList.remove("storeReady");
    scoreStoreHud.disabled = true;
    scoreStoreHud.tabIndex = -1;
    scoreStoreHud.setAttribute("aria-disabled", "true");
  }
  if (accuracyScoreEl){
    accuracyScoreEl.style.display = "block";
    accuracyScoreEl.textContent = "Score: 0pts";
  }
  if (storeUnlockedHudEl) storeUnlockedHudEl.style.display = "none";
  if (timerHud){
    timerHud.style.display = "block";
    timerHud.innerHTML = '<div class="timerHudLabel">Time</div><div>0.0s</div>';
  }
  if (!heartsHud) return;

  let out = "";
  if (previewHeartsInfinite) out += "❤️x♾️";
  else {
    const visibleHearts = Math.min(maxVisibleHudIcons, previewHearts);
    for (let i = 0; i < visibleHearts; i++) out += "❤️ ";
    if (previewHearts > maxVisibleHudIcons) out += `<span class="hudExtra">+${previewHearts - maxVisibleHudIcons}</span> `;
  }

  if (previewShieldsInfinite) out += "  🛡️x♾️";
  else if (previewShields > 0){
    const visibleShields = Math.min(maxVisibleHudIcons, previewShields);
    out += "  " + "🛡️ ".repeat(visibleShields);
    if (previewShields > maxVisibleHudIcons) out += `<span class="hudExtra">+${previewShields - maxVisibleHudIcons}</span> `;
  }

  heartsHud.innerHTML = out.trim();
  heartsHud.style.display = out.trim() ? "block" : "none";
}




let bgSuggestOpen = false;
let bgSuggestIndex = 0;
let bgSuggestList = [];

function execPauseCommand(cmd){
  const raw = String(cmd||"").trim();
  if (!raw) return { ok:false, message:"No command provided" };

  // v1.96: /help -> list commands alphabetically inside the pause panel
  if (raw === "/help"){
    showHelp();
    return { ok:true, message:"/help executed" };
  }

  // v1.96: /fullscreen -> toggle browser fullscreen
  if (raw === "/fullscreen"){
    toggleFullscreen();
    return { ok:true, message:"/fullscreen executed" };
  }

  // /game_speed [#] -> set gameplay speed scale. 0 freezes, 1 normal, -5 slowest, 20 fastest.
  if (raw.startsWith("/game_speed")){
    const arg = raw.slice("/game_speed".length).trim();
    if (!arg){
      return { ok:true, message:`Game speed is ${clampGameSpeedValue(START_GAME_SPEED)} (${GAME_SPEED_MULT === 0 ? "frozen" : GAME_SPEED_MULT + "x"})` };
    }
    const parsed = Number(arg);
    if (!Number.isFinite(parsed)){
      return { ok:false, message:"Usage: /game_speed [-5..20], where 0 freezes and 1 is normal" };
    }
    const speed = applyGameSpeedValue(parsed);
    return { ok:true, message:`Game speed set to ${speed}${speed === 0 ? " (frozen)" : ""}` };
  }

  // /background_color [#RRGGBB] -> set starfield background color
  if (raw.startsWith("/background_color")){
    const arg = raw.slice("/background_color".length).trim();
    if (!arg){
      return { ok:true, message:`Background color is ${normalizeHexColor(starfieldBgOverride || "#000000") || "#000000"}` };
    }
    const normalized = normalizeHexColor(arg);
    if (!normalized){
      return { ok:false, message:"Usage: /background_color #000000" };
    }
    starfieldBgOverride = normalized;
    syncBackgroundColorControls();
    return { ok:true, message:`Background color set to ${normalized}` };
  }

  // /video_fx -> toggle chromatic aberration + hue drift
  if (raw === "/video_fx"){
    setVideoFxEnabled(!VIDEO_FX_ENABLED);
    return { ok:true, message:`Video FX ${VIDEO_FX_ENABLED ? "enabled" : "disabled"}` };
  }


  // v1.96: /lives [#|infinite]
  if (raw.startsWith("/lives")){
    const arg = raw.slice("/lives".length).trim();
    const p = _parseCountOrInfinite(arg);
    if (p){
      _applyLives(p.value, !!p.infinite);
      return { ok:true, message:`Set player lives to ${p.infinite ? "MAX" : p.value}` };
    }
    return { ok:false, message:"Usage: /lives [0-99|100|MAX]" };
  }

  // v1.96: /hearts [#|infinite]
  if (raw.startsWith("/hearts")){
    const arg = raw.slice("/hearts".length).trim();
    const p = _parseCountOrInfinite(arg);
    if (p){
      _applyHearts(p.value, !!p.infinite);
      return { ok:true, message:`Set player hearts to ${p.infinite ? "MAX" : p.value}` };
    }
    return { ok:false, message:"Usage: /hearts [1-99|100|MAX]" };
  }

  // v1.96: /shields [#|infinite]
  if (raw.startsWith("/shields")){
    const arg = raw.slice("/shields".length).trim();
    const p = _parseCountOrInfinite(arg);
    if (p){
      _applyShields(p.value, !!p.infinite);
      return { ok:true, message:`Set player shields to ${p.infinite ? "MAX" : p.value}` };
    }
    return { ok:false, message:"Usage: /shields [0-99|100|MAX]" };
  }

  // v1.96: /bombs [#|infinite]
  if (raw.startsWith("/bombs")){
    const arg = raw.slice("/bombs".length).trim();
    const p = _parseCountOrInfinite(arg);
    if (p){
      _applyBombs(p.value, !!p.infinite);
      return { ok:true, message:`Set player bombs to ${p.infinite ? "MAX" : p.value}` };
    }
    return { ok:false, message:"Usage: /bombs [0-99|100|MAX]" };
  }

  // /invert -> toggle invert colors mode (same as Options menu)
  if (raw === "/invert"){
    INVERT_COLORS = !INVERT_COLORS;
    applyInvertColors();
    syncCheatsMenuState();
    return { ok:true, message:`Invert colors ${INVERT_COLORS ? "enabled" : "disabled"}` };
  }

  if (raw.startsWith(BG_CMD)){
    const arg = raw.slice(BG_CMD.length).trim();

    if (!arg){
      starfieldBgOverride = null;
      return { ok:true, message:"/background_color reset" };
    }

    const hexMatch = arg.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
    if (hexMatch){
      starfieldBgOverride = "#" + hexMatch[1];
      return { ok:true, message:`/background_color ${starfieldBgOverride}` };
    }

    starfieldBgOverride = arg;
    return { ok:true, message:`/background_color ${arg}` };
  }

  try{ console.log("[PAUSE CMD]", raw); }catch(e){}
  return { ok:false, message:`${raw.split(/\s+/)[0]} is not a known command` };
}

window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "tektite:chat-visibility"){
    parentChatVisible = !!data.visible;
    if (parentChatVisible) clearControllerFocus();
    else syncControllerFocusForCurrentState();
    return;
  }

  if (data.type === "tektite:pause-for-chat"){
    if (gameState === STATE.PLAYING && !isPaused && !isDead && !(deathOverlay && deathOverlay.style.display === "flex")){
      setPaused(true);
    }
    return;
  }

  if (data.type !== "tektite:execute-command") return;

  const command = String(data.command || "").trim();
  const result = execPauseCommand(command);

  if (window.parent && window.parent !== window) {
    postCommandResult(command, result);
  }
});

// v1.96: Pause command input listeners
if (pauseCommand){
  pauseCommand.addEventListener("keydown", (ev) => {
    // Prevent gameplay binds while typing
    ev.stopPropagation();

    // Autocomplete cycling for slash commands and /background_color values.
    if (ev.key === "Tab" || ev.key === "ArrowDown" || ev.key === "ArrowUp"){
      const currentValue = pauseCommand.value || "";
      if (!bgSuggestOpen && bgPrefix(currentValue)) openBgSuggestFromValue(currentValue);
      if (bgSuggestOpen){
        if (ev.key === "ArrowUp") cycleBgChoice(-1);
        else cycleBgChoice(1);
        applyBgChoiceToInput();
        ev.preventDefault();
        return;
      }
    }

    if (ev.key === "Enter"){
      const cmd = (pauseCommand.value || "").trim();
      if (cmd) execPauseCommand(cmd);
      pauseCommand.value = "";
      // v1.96 fix: keep /help visible (don’t immediately close the panel)
      if (cmd !== "/help") closeBgSuggest();
      ev.preventDefault();
      return;
    }

    // Let Esc unpause even when focused
    if (ev.key === "Escape"){
      ev.preventDefault();
      closeBgSuggest();
      togglePause();
      return;
    }
  });

  pauseCommand.addEventListener("input", () => {
    const v = pauseCommand.value || "";
    if (bgPrefix(v)) openBgSuggestFromValue(v);
    else closeBgSuggest();
  });
}

if (pauseCmdSuggest){
  pauseCmdSuggest.addEventListener("mousedown", (ev) => {
    // v1.96: Click-to-fill for /help command list.
    const cmdRow = ev.target && ev.target.closest ? ev.target.closest("[data-cmd]") : null;
    if (cmdRow && pauseCommand){
      const cmd = (typeof getPauseHelpCommandFromNode === "function")
        ? getPauseHelpCommandFromNode(cmdRow)
        : (cmdRow.getAttribute("data-cmd") || "");
      pauseCommand.value = cmd ? (cmd + (cmd.includes(" ") ? "" : " ")) : "";
      try{ pauseCommand.focus(); }catch(e){}
      // If background suggestions were open, close them (help list is the focus now).
      closeBgSuggest();
      ev.preventDefault();
      return;
    }

    // Existing behavior: click to select a /background_color suggestion
    const row = ev.target && ev.target.closest ? ev.target.closest("div[data-i]") : null;
    if (!row) return;
    const i = parseInt(row.getAttribute("data-i"), 10);
    if (!isNaN(i)){
      bgSuggestIndex = i;
      applyBgChoiceToInput();
      renderBgSuggest();
    }
    ev.preventDefault();
  });
}

function togglePause(){
  if (gameState !== STATE.PLAYING) return;
  if (isScoreStoreOpen){
    closeScoreStoreMenu();
    return;
  }
  if (isDead) return; // don't pause during death freeze/respawn
  if (deathOverlay && deathOverlay.style.display === "flex") return; // don't pause on GAME OVER
  setPaused(!isPaused);
}


// =======================
// Right-Click Shield (v1.96)
// - Hold RIGHT MOUSE to raise a neon rainbow shield ring.
// - Shield blocks/bounces enemy contact + enemy bullets.
// - Uses "shield HP" so bullets don't erase it instantly.
// - Shield persists while held; only drops on release or when HP is depleted.
// - 30s cooldown after releasing or after shield breaks.
// =======================
let shieldActive = false;
let mouseShieldHolding = false;
let mouseFireHolding = false; // v1.96: allow holding LMB to keep firing (even while shielding)
let gamepadShieldHolding = false;
let shieldHolding = false; // combined (mouse OR gamepad)
const GP_MENU_AXIS_THRESHOLD = 0.55;
const GP_MENU_REPEAT_DELAY = 0.24;
const GP_MENU_REPEAT_RATE = 0.12;
const GP_OPTION_REPEAT_DELAY = 0.06;
const GP_OPTION_REPEAT_RATE = 0.06;
// HP model (more sane than "3 hits" when bullets are flying)
let shieldHP = 0;
const SHIELD_HP_MAX = 120;             // "reasonable amount" of damage before it breaks
const SHIELD_BULLET_DMG = 6;           // bullets nibble, they don't annihilate
const SHIELD_COLLISION_DMG = 18;       // ramming the shield costs more
let shieldCooldown = 0;                // seconds remaining
const SHIELD_COOLDOWN_SECS = 30;
const SHIELD_RADIUS_MULT = 0.78;       // relative to player size

// If focus/pointer events get weird, don't insta-drop the shield.
// Give a short grace period before forcing it off.
let shieldHoldGrace = 0;
const SHIELD_HOLD_GRACE_SECS = 0.25;

function hasActivePlayer(){
  return gameState === STATE.PLAYING && !playerSpectatorMode;
}

function canActivateShield(){
  return (hasActivePlayer() && !isGameSpeedFrozen() && !isDead && shieldCooldown <= 0 && !shieldActive);
}
function startShield(){
  shieldActive = true;
  // v1.96: If you let go earlier, keep remaining HP for next time.
  // Only refill to full when it was fully broken (shieldHP == 0) and cooldown has expired.
  if (shieldHP <= 0) shieldHP = SHIELD_HP_MAX;
  shieldHoldGrace = SHIELD_HOLD_GRACE_SECS;
}
function stopShield(startCooldown=false){
  // v1.96: Releasing shield should NOT trigger cooldown and should NOT erase remaining HP.
  if (shieldActive){
    shieldActive = false;
    shieldHoldGrace = 0;
    if (startCooldown) shieldCooldown = SHIELD_COOLDOWN_SECS;
  }
}
function shieldApplyDamage(dmg){
  if (!shieldActive) return;
  shieldHP = Math.max(0, shieldHP - Math.max(0, dmg));
  if (shieldHP <= 0){
    // v1.96: Cooldown ONLY when the shield breaks.
    stopShield(false);
  }
}
 // v1.96: HUD hidden by default; toggle with / (Slash)

let time = 0;
let score = 0;
let shotsFired = 0;
let hitsConnected = 0;
let damageDealt = 0;
let runTimer = 0; // seconds since Start Game
// IMPORTANT: Do not rename this localStorage key or change the stored stat property names casually.
// Players' lifetime stats depend on this exact schema surviving future updates.
// If the schema ever changes, migrate old values forward instead of resetting them.
// Yes, even for a joke browser game. People get attached to numbers. Humanity is weird like that.
const LIFETIME_STATS_KEY = "tektiteShooterLevel1LifetimeStats";
let currentRunStatsCommitted = false;

function getDefaultLifetimeStats(){
  return {
    lifetimeScoreEarned: 0,
    lifetimeEnemiesKilled: 0,
    lifetimeUfosKilled: 0,
    lifetimeGamesWon: 0,
    lifetimeTotalDeaths: 0,
    lifetimeBulletsFired: 0
  };
}

function readLifetimeStats(){
  try{
    const parsed = JSON.parse(localStorage.getItem(LIFETIME_STATS_KEY) || "null");
    return Object.assign(getDefaultLifetimeStats(), parsed || {});
  }catch(e){
    return getDefaultLifetimeStats();
  }
}

function writeLifetimeStats(stats){
  try{
    localStorage.setItem(LIFETIME_STATS_KEY, JSON.stringify(Object.assign(getDefaultLifetimeStats(), stats || {})));
  }catch(e){}
}

function incrementLifetimeStat(key, amount=1){
  const stats = readLifetimeStats();
  stats[key] = Math.max(0, Number(stats[key] || 0) + Math.max(0, Number(amount) || 0));
  writeLifetimeStats(stats);
  renderLifetimeStats();
}

function formatLifetimeNumber(value){
  return Math.floor(Number(value) || 0).toLocaleString();
}

function renderLifetimeStats(){
  const stats = readLifetimeStats();
  const statBindings = [
    ["lifetimeScoreEarned", statLifetimeScore],
    ["lifetimeEnemiesKilled", statLifetimeEnemies],
    ["lifetimeUfosKilled", statLifetimeUfos],
    ["lifetimeGamesWon", statLifetimeWins],
    ["lifetimeTotalDeaths", statLifetimeDeaths],
    ["lifetimeBulletsFired", statLifetimeBullets]
  ];

  const statsList = document.getElementById("statsList");
  const lockedDetails = document.getElementById("statsLockedDetails");
  const lockedList = document.getElementById("statsLockedList");
  let lockedCount = 0;

  for (const [key, el] of statBindings){
    const value = Math.max(0, Number(stats[key] || 0));
    const row = document.querySelector(`[data-stat-row="${key}"]`);
    if (el) el.textContent = formatLifetimeNumber(value);
    if (!row) continue;

    if (value > 0){
      row.style.display = "flex";
      if (statsList && row.parentNode !== statsList) statsList.appendChild(row);
    } else {
      row.style.display = "flex";
      if (lockedList && row.parentNode !== lockedList) lockedList.appendChild(row);
      lockedCount += 1;
    }
  }

  if (lockedDetails){
    lockedDetails.hidden = lockedCount <= 0;
    const summary = lockedDetails.querySelector("summary");
    if (summary) summary.textContent = lockedCount > 0
      ? `Play More To Unlock (${lockedCount})`
      : "Play More To Unlock";
  }
}

function openStatsPanel(){
  renderLifetimeStats();
  if (statsPanel){
    statsPanel.style.display = "flex";
    statsPanel.setAttribute("aria-hidden", "false");
  }
}

function closeStatsPanel(){
  if (statsPanel){
    statsPanel.style.display = "none";
    statsPanel.setAttribute("aria-hidden", "true");
  }
}

function resetLifetimeStats(){
  writeLifetimeStats(getDefaultLifetimeStats());
  renderLifetimeStats();
}

function commitRunLifetimeStats({won=false, died=false} = {}){
  if (currentRunStatsCommitted) return;
  currentRunStatsCommitted = true;
  const stats = readLifetimeStats();
  if (won) stats.lifetimeGamesWon += 1;
  if (died) stats.lifetimeTotalDeaths += 1;
  writeLifetimeStats(stats);
  renderLifetimeStats();
}

const STORE_UNLOCK_SCORE_THRESHOLD = 100;
const SCORE_STORE_ITEMS = [
  { id: "hearts", label: "Hearts", cost: 25, description: "Foundation slot for future heart refills or max-heart upgrades." },
  { id: "lives", label: "Lives", cost: 50, description: "Foundation slot for extra-life purchases tied to current score." },
  { id: "shields", label: "Shields", cost: 40, description: "Foundation slot for shield charges or shield-capacity upgrades." },
  { id: "bombs", label: "Bombs", cost: 35, description: "Foundation slot for bomb stock refills and future bomb upgrades." }
];
let totalEnemiesSpawned = 0;
let bombDragonKills = 0;
let bombFrogKills = 0;
// v1.96: "Spectral Funk" tuning knob (because humans love naming sliders like they're mixtapes).
// 1000 = baseline. Higher = spicier enemies (faster patterns + smarter shots). Lower = chill mode.
const SPECTRAL_FUNK = 1000;
const FUNK = Math.max(0.25, Math.min(2.5, SPECTRAL_FUNK / 1000));

let lives = 0; // extra lives (decremented when health hits 0)
let playerSpectatorMode = false; // true when Starting Lives is 0: no player spawn, enemies run unattended
let frogKills = 0; // legacy counter kept for reset compatibility; frog kills no longer award free lives
let health = 1.0; // 0..1 (4 hits -> 0)
let MAX_HEARTS = 3; // v1.96: configurable hearts per life
let HIT_DAMAGE = 0.25; // 25% per hit (4 hearts = one life)

// =======================
// Dragon Bomb-Kill Armor (v1.96)
// - Dragon bomb kills are tracked for the win screen, but no longer grant free armor.
// - Armor absorbs the next hit, then turns into an ❌ briefly next to the hearts HUD.
// =======================
let bonusArmor = 0;              // 0 or 0.25
let bonusArmorBrokenT = 0;       // seconds remaining to show ❌
let shieldPips = 0;            // v1.96: extra one-hit armor pips
let isDead = false;
let deathTimer = 0;
let deathGameOver = false;
let deathYellPlayed = false;
const deathParticles = [];

let deathFocusIndex = 0;
let deathQuitConfirmArmed = false;
let deathQuitConfirmReady = false;
let deathQuitConfirmTimer = null;
let deathQuitConfirmRemaining = 0;
const deathButtons = [];



let wave = 1;
let firstBossSpawned = false; // track first boss size


// v1.96: formation dimensions are dynamic per wave (wave 1 = 1 enemy, then doubles)
let formationCols = 1;
let formationRows = 1;
// v1.96: debug-only numbers shown in the HUD overlay
let ENEMY_COLS = formationCols;
let ENEMY_ROWS = formationRows;
// v1.96: wave banner (big text popup)
let waveBanner = { text:"", t:0, color:"#00ff66" };

function getWaveLabel(n){
  // Wave label rules:
  // - Waves 1-10: "Wave N"
  // - Wave 11: "Boss Mode" (red)
  // - Waves 12-21: "INSANITY WAVE: K" where K = n-11
  if (n === 11) return { text:"Boss Mode", color:"#ff3333" };
  if (n >= 12 && n <= 21) return { text:"INSANITY WAVE: " + (n - 11), color:"#ffffff" };
  return { text:"Wave " + n, color:"#ffffff" };
}

function showWaveBanner(n){
  const lab = getWaveLabel(n);
  waveBanner.text = lab.text;
  waveBanner.color = lab.color;
  waveBanner.t = 1.35;
}

const STATE = { MENU:"menu", OPTIONS:"options", CHEATS:"cheats", CONTROLS:"controls", PLAYING:"playing", WIN:"win" };
let gameState = STATE.MENU;
let gameWon = false;

// Powerup state (v1.96)
let ufo = null;
let bomb = null;
let bombsCount = 0;
let infiniteModeActive = false;
let livesInfiniteActive = false;
let heartsInfiniteActive = false;
let shieldsInfiniteActive = false;
let bombsInfiniteActive = false;


/* =======================
   Utility
======================= */
// =======================
// Accuracy Scoring (v1.96)
// - shotsFired: player bullets spawned
// - hitsConnected: player bullet hits that dealt damage
// - damageDealt: sum of bullet damage that landed
// Score awards scale with accuracy so spray-and-pray pays less.
// =======================
function getAccuracy(){
  if (shotsFired <= 0) return 0;
  return Math.max(0, Math.min(1, hitsConnected / shotsFired));
}

function getAccuracyMultiplier(){
  // 0% -> 0.55x, 100% -> 1.75x (gentle, not punitive)
  const a = getAccuracy();
  return 0.55 + a * 1.20;
}

function awardScore(basePoints){
  const awarded = Math.round(Math.max(0, basePoints) * getAccuracyMultiplier());
  score += awarded;
  incrementLifetimeStat("lifetimeScoreEarned", awarded);
}

function isStoreUnlocked(){
  return Math.floor(score) >= STORE_UNLOCK_SCORE_THRESHOLD;
}

function canOpenStore(){
  return gameState === STATE.PLAYING && isStoreUnlocked();
}

const scoreStoreHud = document.getElementById("scoreStoreHud");
const accuracyScoreEl = document.getElementById("accuracyScore");
const storeUnlockedHudEl = document.getElementById("storeUnlockedHud");
const timerHud = document.getElementById("timerHud");
const winStatScoreEl = document.getElementById("winStatScore");
const winStatKillsEl = document.getElementById("winStatKills");
const winStatBulletsEl = document.getElementById("winStatBullets");
const winStatAccuracyEl = document.getElementById("winStatAccuracy");
const winStatBonusEl = document.getElementById("winStatBonus");
const winStatBonusDragonsEl = document.getElementById("winStatBonusDragons");
const winStatBonusFrogsEl = document.getElementById("winStatBonusFrogs");
const winStatTimeEl = document.getElementById("winStatTime");
if (scoreStoreHud){
  scoreStoreHud.addEventListener("click", () => {
    if (!canOpenStore()) return;
    openScoreStoreMenu();
  });
}
function updateAccuracyScoreHUD(){
  if (!accuracyScoreEl) return;
  const isPlaying = gameState === STATE.PLAYING;
  const storeUnlocked = isStoreUnlocked();
  const canOpen = canOpenStore();
  if (scoreStoreHud){
    scoreStoreHud.style.display = isPlaying ? "flex" : "none";
    scoreStoreHud.classList.toggle("storeReady", canOpen);
    scoreStoreHud.disabled = !canOpen;
    scoreStoreHud.tabIndex = canOpen ? 0 : -1;
    scoreStoreHud.setAttribute("aria-disabled", canOpen ? "false" : "true");
  }
  if (btnPauseOpenStore) btnPauseOpenStore.style.display = storeUnlocked ? "block" : "none";
  if (gameState === STATE.PLAYING) accuracyScoreEl.style.display = "block";
  else accuracyScoreEl.style.display = "none";
  accuracyScoreEl.textContent = "Score: " + String(Math.floor(score)) + "pts";
  if (storeUnlockedHudEl){
    storeUnlockedHudEl.style.display = (isPlaying && storeUnlocked) ? "block" : "none";
    storeUnlockedHudEl.textContent = canOpen ? "Open Store" : "Store Unlocked";
  }
}

function formatRunTime(seconds){
  return (Math.max(0, seconds || 0)).toFixed(1) + "s";
}

function clamp01(n){
  return Math.max(0, Math.min(1, n));
}


function refreshWinStats(){
  const accuracyPercent = Math.round(getAccuracy() * 100);
  if (winStatTimeEl) winStatTimeEl.textContent = "Time: " + formatRunTime(runTimer);
  if (winStatScoreEl) winStatScoreEl.textContent = "Score: " + Math.floor(score);
  if (winStatKillsEl) winStatKillsEl.textContent = "Enemies Killed: " + totalEnemiesSpawned + " / " + totalEnemiesSpawned;
  if (winStatBulletsEl) winStatBulletsEl.textContent = "Bullets Shot: " + shotsFired;
  if (winStatAccuracyEl) winStatAccuracyEl.textContent = "Accuracy: " + accuracyPercent + "%";

  const hasBombBonus = (bombDragonKills + bombFrogKills) > 0;
  if (winStatBonusEl) winStatBonusEl.style.display = hasBombBonus ? "block" : "none";
  if (winStatBonusDragonsEl) winStatBonusDragonsEl.textContent = "Dragons Bombed: +" + bombDragonKills;
  if (winStatBonusFrogsEl) winStatBonusFrogsEl.textContent = "Frogs Bombed: +" + bombFrogKills;
}

function updateTimerHUD(){
  if (!timerHud) return;
  // Show timer only while actually playing
  if (gameState !== STATE.PLAYING){
    timerHud.style.display = "none";
    return;
  }
  timerHud.style.display = "block";
  timerHud.innerHTML = '<div class="timerHudLabel">Time</div><div>' + runTimer.toFixed(1) + 's</div>';
}

function isDragonEnemy(e){
  return !!(e && e.img && e.img.src && e.img.src.toLowerCase().includes("dragon.gif"));
}

// =======================
// Enemy hit feedback (v1.96)
// - flash red briefly when damaged
// - fade out when killed (instead of instantly vanishing)
// NOTE: This only touches canvas drawing + enemy objects; it will not mess with menus.
// =======================
const ENEMY_HIT_FLASH_SECS = 0.12;   // how long the red flash lasts
const ENEMY_DEATH_FADE_SECS = 0.35;  // how long the death fade lasts

function enemyMarkHit(e){
  if (!e) return;
  e.hitFlash = ENEMY_HIT_FLASH_SECS;
}


function drawFloatingTexts(ctx){
  if (!window._floatTexts || window._floatTexts.length === 0) return;
  ctx.save();
  ctx.font = "16px monospace";
  ctx.textAlign = "center";
  for (let i = window._floatTexts.length - 1; i >= 0; i--){
    const f = window._floatTexts[i];
    f.t += (window._dt || 0.016);
    const a = Math.max(0, 1 - (f.t / f.ttl));
    const yy = f.y - (f.t * 28);
    ctx.globalAlpha = a;
    ctx.fillText(f.text, f.x, yy);
    if (f.t >= f.ttl) window._floatTexts.splice(i, 1);
  }
  ctx.restore();
}

function spawnFloatingText(x, y, text, ttl=0.9){
  // Lightweight popup text. Stored in particles array if available, otherwise ignored gracefully.
  if (!window._floatTexts) window._floatTexts = [];
  window._floatTexts.push({x, y, text, t:0, ttl});
}

function enemyKill(e, source){
  if (!e || e.dying) return;
  e.dying = true;
  e.fade = 1;
  e.fadeRate = 1 / ENEMY_DEATH_FADE_SECS;

  // Freeze where it died so the formation doesn't yoink it around while fading.
  e.lockX = e.x; e.lockY = e.y;
  e.lockW = e.w; e.lockH = e.h;
  e.swoop = null;

  // One-time kill side effects.
  if (!e._killAwarded){
    e._killAwarded = true;
    if (source === "bomb" && isDragonEnemy(e)){
      bombDragonKills += 1;
    }

    if (source === "bomb" && e.isFrog){
      bombFrogKills += 1;
    }

    // Frog kills no longer heal the player or award free lives.
    awardScore(10);
    incrementLifetimeStat("lifetimeEnemiesKilled", 1);
    playSfx(sfxHit);
  }
}

function enemyApplyDamage(e, dmg, source){
  if (!e) return;
  enemyMarkHit(e);
  e.hp = (typeof e.hp === "number") ? e.hp : 1;
  e.hp -= Math.max(0, dmg|0);
  if (e.hp <= 0){
    enemyKill(e, source);
  }
}

function grantBonusArmor(){
  // Do not stack. Just refresh.
  bonusArmor = 0.25;
  bonusArmorBrokenT = 0;
}

function breakBonusArmor(){
  bonusArmor = 0;
  bonusArmorBrokenT = 1.8;
}

/* =======================
   UFO + Bomb Powerup (v1.96)
   - 25% chance to spawn at wave start
   - UFO takes 3 hits: red -> green -> blue -> fade
   - On fade, grants 💥 item (Press Q)
   - Press Q drops a flashing + that explodes after 3 flashes (0.5s each)
======================= */

function trySpawnUFO(force=false){
  if (ufo) return; // only one at a time
  // v1.96: Force-spawn on wave 11 and 21 (or when explicitly forced).
  if (!force && !shouldForceUFOForWave(wave) && Math.random() > 0.25) return;

  // Spawn near top area, tiny and fast.
  ufo = {
    x: rand(30, canvas.width - 30),
    y: rand(40, 110),
    vx: rand(-420, 420) / 60, // px/frame-ish
    vy: rand(260, 520) / 60,
    r: 10,
    hits: 0,
    stage: 0, // 0 none, 1 red, 2 green, 3 blue
    fade: 0,
    strobeT: 0
  };

  // Ensure it's actually moving.
  if (Math.abs(ufo.vx) < 2) ufo.vx = (ufo.vx < 0 ? -2.5 : 2.5);
}

function updateUFO(dt){
  if (!ufo) return;

  // If fading, just fade out and then grant powerup.
  if (ufo.fade > 0){
    ufo.fade += dt;
    if (ufo.fade >= 0.55){
      ufo = null;
      bombsCount += 1;
      powerupSlot.style.display = "flex";
    }
    return;
  }

  // Move + bounce around the top half.
  ufo.x += ufo.vx;
  ufo.y += ufo.vy;

  const left = 16, right = canvas.width - 16, top = 30, bottom = canvas.height * 0.48;
  if (ufo.x < left){ ufo.x = left; ufo.vx *= -1; }
  if (ufo.x > right){ ufo.x = right; ufo.vx *= -1; }
  if (ufo.y < top){ ufo.y = top; ufo.vy *= -1; }
  if (ufo.y > bottom){ ufo.y = bottom; ufo.vy *= -1; }

  // "Avoid the player's movement toward it": if player is moving toward UFO, add a shove away.
  const movingLeft  = isKeyboardActionHeld("moveLeft");
  const movingRight = isKeyboardActionHeld("moveRight");
  const toward =
    (movingLeft  && player.x > ufo.x) ||
    (movingRight && player.x < ufo.x);

  if (toward){
    const away = Math.sign(ufo.x - player.x) || (Math.random() < 0.5 ? -1 : 1);
    ufo.vx += away * (0.65 + 0.35 * FUNK);
    // clamp
    ufo.vx = Math.max(-9.5, Math.min(9.5, ufo.vx));
  }

  ufo.strobeT += dt;
}

function drawUFO(){
  if (!ufo) return;

  const strobe = Math.floor(time * 22) % 2 === 0;
  const baseFill = strobe ? "#fff" : "#000";
  const col = ufoColorForStage(ufo.stage);

  const alpha = (ufo.fade > 0) ? Math.max(0, 1 - (ufo.fade / 0.55)) : 1;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.translate(ufo.x, ufo.y);

  // core strobe oval
  ctx.fillStyle = baseFill;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // colored "shield" ring for hit streak feedback
  if (col){
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function dropBomb(){
  if (isPaused || isGameSpeedFrozen() || playerSpectatorMode) return;
  if (!infiniteModeActive && !bombsInfiniteActive && bombsCount <= 0) return;
  if (bomb) return; // only one active

  if (!infiniteModeActive && !bombsInfiniteActive) bombsCount = Math.max(0, bombsCount - 1);
  _syncBombHud();

  // Bomb glides in the current aim direction, keeps moving, and ricochets off screen edges
  // until it collides with an enemy.
  const dx = Math.cos(aimAngleSmoothed);
  const dy = Math.sin(aimAngleSmoothed);

  const spawnDist = player.w * 0.55;
  const speed = 900; // px/sec

  bomb = {
    x: player.x + dx * spawnDist,
    y: player.y + dy * spawnDist,
    vx: dx * speed,
    vy: dy * speed,
    r: 12,

    mode: "flying",
    flashT: 0,
    flashOn: true,

    exploding: false,
    rad: 0,
    alpha: 0.0
  };
}

function explodeBomb(){
  if (!bomb) return;
  bomb.exploding = true;
  bomb.mode = "exploding";
  bomb.rad = 0;
  bomb.alpha = 0.55;
}

function bombHitsEnemy(){
  if (!bomb || bomb.exploding) return false;
  for (let i = enemies.length - 1; i >= 0; i--){
    const e = enemies[i];
    if (e.dying) continue;
    const rx = e.x - e.w/2, ry = e.y - e.h/2;

    if (circleRect(bomb.x, bomb.y, bomb.r, rx, ry, e.w, e.h)){
      explodeBomb();
      return true;
    }
  }
  return false;
}

function updateBomb(dt){
  if (!bomb) return;

  bomb.flashT += dt;
  if (bomb.flashT >= 0.12){
    bomb.flashT -= 0.12;
    bomb.flashOn = !bomb.flashOn;
  }

  if (!bomb.exploding){
    const stepX = bomb.vx * dt;
    const stepY = bomb.vy * dt;

    bomb.x += stepX;
    bomb.y += stepY;

    const minX = bomb.r;
    const maxX = canvas.width - bomb.r;
    const minY = bomb.r;
    const maxY = canvas.height - bomb.r;

    if (bomb.x < minX){
      bomb.x = minX + (minX - bomb.x);
      bomb.vx = Math.abs(bomb.vx);
    } else if (bomb.x > maxX){
      bomb.x = maxX - (bomb.x - maxX);
      bomb.vx = -Math.abs(bomb.vx);
    }

    if (bomb.y < minY){
      bomb.y = minY + (minY - bomb.y);
      bomb.vy = Math.abs(bomb.vy);
    } else if (bomb.y > maxY){
      bomb.y = maxY - (bomb.y - maxY);
      bomb.vy = -Math.abs(bomb.vy);
    }

    if (bombHitsEnemy()) return;
  } else {
    bomb.rad += (560 + 220 * FUNK) * dt;
    bomb.alpha = Math.max(0, bomb.alpha - dt * 0.60);

    if (!bomb.didDamage){
      bomb.didDamage = true;

      const enemySize = enemies.length ? enemies.reduce((s,e)=>s+e.size,0)/enemies.length : 44;
      const radius = enemySize * 1.7;

      const BOMB_DAMAGE = 2;

      for (let i = enemies.length - 1; i >= 0; i--){
        const e = enemies[i];
        if (e.dying) continue;
        const dx = e.x - bomb.x;
        const dy = e.y - bomb.y;
        const d2 = dx*dx + dy*dy;

        if (d2 <= radius*radius){
          enemyApplyDamage(e, BOMB_DAMAGE, "bomb");
        } else {
          const r2 = (radius * 2.2);
          if (d2 <= r2*r2){
            const d = Math.max(1, Math.sqrt(d2));
            const push = (radius * 0.55) / d;
e.col += (dx / d) * push * 0.02;
            e.row += (dy / d) * push * 0.02;
          }
        }
      }
    }

    if (bomb.alpha <= 0){
      bomb = null;
    }
  }
}

function drawBomb(){
  if (!bomb) return;

  if (!bomb.exploding){
    // v1.96: flying/armed bomb (flashing plus)
    ctx.save();
    ctx.translate(bomb.x, bomb.y);

    // Slightly different color when armed vs flying so you can read it at a glance.
    const isArmed = (bomb.mode === "armed");
    const onCol  = isArmed ? "rgba(255,80,80,0.95)" : "rgba(255,255,0,0.95)";
    const offCol = isArmed ? "rgba(255,255,255,0.70)" : "rgba(255,60,60,0.95)";

    ctx.fillStyle = bomb.flashOn ? onCol : offCol;
    ctx.fillRect(-4, -16, 8, 32);
    ctx.fillRect(-16, -4, 32, 8);

    // tiny outline circle so it reads even when the plus is edge-on
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, bomb.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  } else {
    // explosion circle
    ctx.save();
    ctx.globalAlpha = bomb.alpha;
    ctx.fillStyle = "rgba(255,0,0,0.20)";
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, bomb.rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* =======================
   Parallax Starfield (safe init order)
======================= */
const starLayers = [
  { count: 180, baseSpeedY: 40,  parallaxX: 0.35, sizeMin: 1, sizeMax: 2 },
  { count: 120, baseSpeedY: 80,  parallaxX: 0.60, sizeMin: 1, sizeMax: 3 },
  { count: 70,  baseSpeedY: 140, parallaxX: 0.90, sizeMin: 2, sizeMax: 4 }
];

let stars = [];
let playerVxSmoothed = 0;
let starfieldReady = false;

function resetStarfield(){
  stars = starLayers.map(layer => {
    const arr = [];
    for (let i = 0; i < layer.count; i++){
      arr.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: rand(layer.sizeMin, layer.sizeMax),
        vyMul: rand(0.7, 1.3)
      });
    }
    return arr;
  });
  starfieldReady = true;
}

function updateStarfield(dt, keys, playerSpeed){
  if (!starfieldReady) return;

  let vxIntent = 0;
  if (gameState === STATE.PLAYING){
    if (isKeyboardActionHeld("moveLeft")) vxIntent -= 1;
    if (isKeyboardActionHeld("moveRight")) vxIntent += 1;
    // Xbox/Gamepad: use left-stick/D-pad horizontal intent too
    vxIntent += (typeof gpMoveX !== "undefined" ? (gpMoveX || 0) : 0);
    vxIntent = Math.max(-1, Math.min(1, vxIntent));
  } else {
    vxIntent = 0.15 * Math.sin(time * 0.6);
  }

  const targetVx = vxIntent * playerSpeed * 55;
  playerVxSmoothed += (targetVx - playerVxSmoothed) * Math.min(1, dt * 8);

  for (let li = 0; li < starLayers.length; li++){
    const layer = starLayers[li];
    const arr = stars[li];

    const driftX = -playerVxSmoothed * layer.parallaxX;
    const driftY = layer.baseSpeedY;

    for (const st of arr){
      st.x += driftX * dt;
      st.y += driftY * st.vyMul * dt;

      if (st.y > canvas.height + 10) st.y = -10;
      if (st.x < -10) st.x = canvas.width + 10;
      if (st.x > canvas.width + 10) st.x = -10;
    }
  }
}

function drawStarfield(){
  // v1.96: Stage 2+ visual shift (wave >= 11)
  const isStage2Plus = (gameState === STATE.PLAYING && wave >= 11);

  // Background
  ctx.fillStyle = (starfieldBgOverride ? starfieldBgOverride : (isStage2Plus ? "#300" : "#000"));
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if (!starfieldReady) return;

  for (let li = 0; li < starLayers.length; li++){
    const arr = stars[li];
    const alpha = li === 0 ? 0.35 : (li === 1 ? 0.55 : 0.85);

    // v1.96: Keep stars white for maximum contrast (even in Stage 2+)
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;

    for (const st of arr){
      ctx.fillRect(st.x, st.y, st.s, st.s);
    }
  }
}

/* =======================
   Resize
======================= */
function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // v1.96+: only bottom-anchor in menus; gameplay keeps spawn position
  if (gameState !== STATE.PLAYING){
    player.y = getPlayerAlignedY();
  }

  resetStarfield();
  resizeFX();
  fitOptionsMenuToViewport();
  fitCheatsMenuToViewport();
  fitControlsMenuToViewport();
}
window.addEventListener("resize", resize);

function fitOptionsMenuToViewport(){
  sizeMenuLikeStartMenu(optionsMenu, optionsMenuInner, optionsScroll);
}

function fitCheatsMenuToViewport(){
  sizeMenuLikeStartMenu(cheatsMenu, cheatsMenuInner, cheatsScroll);
}

function rememberStartMenuPanelRect(){
  if (!startMenu) return;
  try{
    if (startMenu.style.display !== "none" && startMenu.offsetParent !== null){
      const rect = startMenu.getBoundingClientRect();
      if (rect && rect.width && rect.height) startMenuPanelRect = rect;
    }
  }catch(e){}
}

function getFallbackMenuRect(){
  if (startMenuPanelRect && startMenuPanelRect.width && startMenuPanelRect.height) return startMenuPanelRect;
  if (startMenu){
    try{
      const previousDisplay = startMenu.style.display;
      const previousVisibility = startMenu.style.visibility;
      const previousPointerEvents = startMenu.style.pointerEvents;
      startMenu.style.visibility = "hidden";
      startMenu.style.pointerEvents = "none";
      startMenu.style.display = "block";
  rememberStartMenuPanelRect();
      const rect = startMenu.getBoundingClientRect();
      startMenu.style.display = previousDisplay;
      startMenu.style.visibility = previousVisibility;
      startMenu.style.pointerEvents = previousPointerEvents;
      if (rect && rect.width && rect.height){
        startMenuPanelRect = rect;
        return rect;
      }
    }catch(e){}
  }
  return null;
}

function sizeMenuLikeStartMenu(menuEl, innerEl=null, scrollEl=null){
  if (!menuEl) return;
  menuEl.style.transform = "scale(1)";
  menuEl.style.margin = "0";
  menuEl.style.transformOrigin = "center center";
  menuEl.style.boxSizing = "border-box";

  if (innerEl){
    innerEl.style.transform = "none";
    innerEl.style.marginBottom = "0";
  }
  if (scrollEl) scrollEl.scrollTop = 0;

  if (menuEl.style.display === "none" || menuEl.offsetParent === null) return;

  const sourceRect = getFallbackMenuRect();
  if (sourceRect && sourceRect.width && sourceRect.height){
    const panelW = Math.round(sourceRect.width);
    const panelH = Math.round(sourceRect.height);
    menuEl.style.width = `${panelW}px`;
    menuEl.style.height = `${panelH}px`;
    menuEl.style.minHeight = `${panelH}px`;
    menuEl.style.maxHeight = `${panelH}px`;
  }

  const margin = 12;
  const availableW = Math.max(320, window.innerWidth - margin * 2);
  const availableH = Math.max(240, window.innerHeight - margin * 2);
  const rect = menuEl.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const panelScale = Math.min(1, availableW / rect.width, availableH / rect.height);
  menuEl.style.transform = `scale(${panelScale})`;
  if (panelScale < 1) {
    const scaledHeight = rect.height * panelScale;
    const slack = Math.max(0, availableH - scaledHeight);
    menuEl.style.margin = `${Math.floor(slack / 2)}px 0`;
  }
}

function fitControlsMenuToViewport(){
  sizeMenuLikeStartMenu(controlsMenu, controlsMenuInner, controlsListScroll);
}

/* =======================
   HUD/Player Alignment
   - Keep the bottom of the player aligned to the top of the hearts HUD (DOM element),
     regardless of fullscreen, browser chrome, or embedding under a site banner.
======================= */
function getPlayerAlignedY(gapPx = 6){
  const heartsTop = getHeartsTopInCanvas();
  // player.y is CENTER-based, so subtract half-height.
  let y = heartsTop - (player.h / 2) - gapPx;
  // Clamp to canvas bounds
  y = Math.max(player.h/2, Math.min(canvas.height - player.h/2, y));
  return y;
}

/* =======================
   Audio
======================= */
const sfxHit = new Audio(AUDIO_HIT);
const sfxOof = new Audio(AUDIO_OOF);
sfxHit.preload = "auto";
sfxOof.preload = "auto";
sfxHit.volume = 0.7;
sfxOof.volume = 0.8;

let audioUnlocked = false;
let pendingWaveStartMusic = false;
function unlockAudioOnce(){
  if (audioUnlocked) return;
  audioUnlocked = true;
  initAudioAnalyser();
  try{ if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){}
  try{
    sfxHit.muted = true;
    sfxHit.play().then(() => { sfxHit.pause(); sfxHit.currentTime = 0; sfxHit.muted = false; }).catch(()=>{ sfxHit.muted = false; });

    sfxOof.muted = true;
    sfxOof.play().then(() => { sfxOof.pause(); sfxOof.currentTime = 0; sfxOof.muted = false; }).catch(()=>{ sfxOof.muted = false; });
  }catch(e){}

  // Prime music/death audio once the browser allows it.
  try{
    // Prime the background music once the browser allows it.
    musicBg.muted = true;
    musicBg.play().then(()=>{ musicBg.pause(); musicBg.currentTime = 0; musicBg.muted = false; }).catch(()=>{ musicBg.muted = false; });

    // Prime the death yell audio once the browser allows it.
    sfxDeath.muted = true;
    sfxDeath.play().then(()=>{ sfxDeath.pause(); sfxDeath.currentTime = 0; sfxDeath.muted = false; }).catch(()=>{ sfxDeath.muted = false; });
  }catch(e){}

  applyMuteState();
}

function playSfx(a){
  if (audioMuted) return;
  try{
    const c = a.cloneNode();
    c.volume = a.volume;
    c.muted = !!audioMuted;
    c.play().catch(()=>{});
  }catch(e){}
}
function playSfxImmediate(a){
  if (audioMuted || !a) return;
  try{
    a.currentTime = 0;
    a.muted = !!audioMuted;
    a.play().catch(()=>{});
  }catch(e){}
}

/* =======================
   UI
======================= */
const uiRoot = document.getElementById("uiRoot");
const startMenu = document.getElementById("startMenu");
const optionsMenu = document.getElementById("optionsMenu");
const optionsMenuInner = document.getElementById("optionsMenuInner");
const optionsScroll = document.getElementById("optionsScroll");
const cheatsMenu = document.getElementById("cheatsMenu");
const cheatsMenuInner = document.getElementById("cheatsMenuInner");
const cheatsScroll = document.getElementById("cheatsScroll");
const assetStatus = document.getElementById("assetStatus");
function getHeartsHudEl(){ return document.getElementById("heartsHud"); }

const btnStart = document.getElementById("btnStart");
const btnOptions = document.getElementById("btnOptions");
const startMenuTitle = document.getElementById("startMenuTitle");
const titleHoverReveal = document.getElementById("titleHoverReveal");
const btnControls = document.getElementById("btnControls");
const btnMysteryLink = document.getElementById("btnMysteryLink");
const btnStats = document.getElementById("btnStats");
const statsPanel = document.getElementById("statsPanel");
const btnStatsClose = document.getElementById("btnStatsClose");
const btnStatsReset = document.getElementById("btnStatsReset");
const statLifetimeScore = document.getElementById("statLifetimeScore");
const statLifetimeEnemies = document.getElementById("statLifetimeEnemies");
const statLifetimeUfos = document.getElementById("statLifetimeUfos");
const statLifetimeWins = document.getElementById("statLifetimeWins");
const statLifetimeDeaths = document.getElementById("statLifetimeDeaths");
const statLifetimeBullets = document.getElementById("statLifetimeBullets");
const controlsMenu = document.getElementById("controlsMenu");
const controlsMenuTitle = document.getElementById("controlsMenuTitle");
const controlsBindList = document.getElementById("controlsBindList");
const controlsResetBinds = document.getElementById("controlsResetBinds");
const controlsApplyBinds = document.getElementById("controlsApplyBinds");
const controlsBack = document.getElementById("controlsBack");
const controlsMenuInner = document.getElementById("controlsMenuInner");
const controlsListScroll = document.getElementById("controlsListScroll");
const btnBack = document.getElementById("btnBack");
const btnApply = document.getElementById("btnApply");
const btnCheats = document.getElementById("btnCheats");
const btnFullscreenOption = document.getElementById("btnFullscreenOption");
const backgroundColorHex = document.getElementById("backgroundColorHex");
const backgroundColorPicker = document.getElementById("backgroundColorPicker");
const btnCheatsBack = document.getElementById("btnCheatsBack");
const btnCheatsApply = document.getElementById("btnCheatsApply");

  // =======================
  // Start Options (v1.96)
  // =======================
  const livesSlider = document.getElementById("livesSlider");
  const heartsSlider = document.getElementById("heartsSlider");
  const shieldsSlider = document.getElementById("shieldsSlider");
  const bombsSlider = document.getElementById("bombsSlider");
  const speedSlider = document.getElementById("speedSlider");
  const infiniteToggle = document.getElementById("infiniteToggle");
  const startWaveSelect = document.getElementById("startWaveSelect");
const btnSkipToLevel2 = document.getElementById("btnSkipToLevel2");
  const startWaveLabel = document.getElementById("startWaveLabel");

  const livesVal = document.getElementById("livesVal");
  const heartsVal = document.getElementById("heartsVal");
  const shieldsVal = document.getElementById("shieldsVal");
  const bombsVal = document.getElementById("bombsVal");

  const speedVal = document.getElementById("speedVal");
  // Saved settings (persist for the session)
  let START_LIVES = 1;
  let START_HEARTS = 3;
  let START_SHIELDS = 0;
  let START_BOMBS = 0;
  // v1.97: each resource can independently use 100 as INFINITE.
  let START_LIVES_INFINITE = false;
  let START_HEARTS_INFINITE = false;
  let START_SHIELDS_INFINITE = false;
  let START_BOMBS_INFINITE = false;
  // v1.96: game speed slider (1-10). 5 = 1.0x.
  let START_GAME_SPEED = 1;
  let GAME_SPEED_MULT = 1;
  let INFINITE_MODE = false;
  
let START_WAVE = 1; // 1-10 = normal waves, 11 = Boss Mode, 12-21 = Insanity 1-10

let INVERT_COLORS = false;
const invertColorsCheckbox = document.getElementById("invertColorsCheckbox");
const videoFxCheckbox = document.getElementById("videoFxCheckbox");
const infiniteToggleStatus = document.getElementById("infiniteToggleStatus");
const invertColorsStatus = document.getElementById("invertColorsStatus");
const videoFxStatus = document.getElementById("videoFxStatus");

function applyInvertColors(){
  document.body.classList.toggle("invert-colors", INVERT_COLORS);
}

function updateCheatsApplyButtonState(){
  if (!btnCheatsApply) return;
  if (cheatsHavePendingChanges) setStateApplyButton(btnCheatsApply, "dirty");
  else if (cheatsJustApplied) setStateApplyButton(btnCheatsApply, "applied");
  else setStateApplyButton(btnCheatsApply, "hidden");
}

function markCheatsDirty(){
  cheatsHavePendingChanges = true;
  cheatsJustApplied = false;
  updateCheatsApplyButtonState();
}

function markCheatsClean(applied=false){
  cheatsHavePendingChanges = false;
  cheatsJustApplied = !!applied;
  updateCheatsApplyButtonState();
}

function syncCheatsMenuState(){
  if (infiniteToggle) infiniteToggle.checked = !!INFINITE_MODE;
  if (invertColorsCheckbox) invertColorsCheckbox.checked = !!INVERT_COLORS;
  if (videoFxCheckbox) videoFxCheckbox.checked = !!VIDEO_FX_ENABLED;
  if (infiniteToggleStatus) infiniteToggleStatus.textContent = INFINITE_MODE ? "Enabled" : "Disabled";
  if (invertColorsStatus) invertColorsStatus.textContent = INVERT_COLORS ? "Enabled" : "Disabled";
  if (videoFxStatus) videoFxStatus.textContent = VIDEO_FX_ENABLED ? "Enabled" : "Disabled";
}

if (infiniteToggle){
  infiniteToggle.addEventListener("change", () => {
    INFINITE_MODE = !!infiniteToggle.checked;
    infiniteModeActive = !!INFINITE_MODE;
    syncCheatsMenuState();
  });
}

if (invertColorsCheckbox){
  invertColorsCheckbox.addEventListener("change", () => {
    INVERT_COLORS = !!invertColorsCheckbox.checked;
    applyInvertColors();
    syncCheatsMenuState();
  });
}

if (videoFxCheckbox){
  videoFxCheckbox.addEventListener("change", () => {
    setVideoFxEnabled(!!videoFxCheckbox.checked);
  });
}


  function getStartWaveText(v){
    const n = parseInt(v, 10) || 1;
    if (n === 11) return "Boss Mode";
    if (n >= 12 && n <= 21) return "Insanity " + (n - 11);
    return String(n);
  }

  function clampNumericInput(inputEl){
    if (!inputEl) return;
    const min = Number(inputEl.min);
    const max = Number(inputEl.max);
    let value = parseInt(inputEl.value, 10);
    if (!Number.isFinite(value)) value = Number.isFinite(min) ? min : 0;
    if (Number.isFinite(min)) value = Math.max(min, value);
    if (Number.isFinite(max)) value = Math.min(max, value);
    inputEl.value = String(value);
  }

  function isStartingStatInputEl(inputEl){
    return !!inputEl && getStartingStatInputs().includes(inputEl);
  }

  function normalizeStartStatInput(inputEl){
    if (!inputEl) return;
    const min = Number(inputEl.min);
    const max = Number(inputEl.max);
    const parsed = parseResourceOption(inputEl, Number.isFinite(min) ? min : 0);
    let nextValue = parsed.infinite ? 100 : parsed.value;
    if (Number.isFinite(min)) nextValue = Math.max(min, nextValue);
    if (Number.isFinite(max)) nextValue = Math.min(max, nextValue);
    inputEl.value = parsed.infinite ? "\u221e" : String(nextValue);
  }

  function syncRangeProgress(rangeEl){
  if (!rangeEl) return;
  const min = parseFloat(rangeEl.min || '0');
  const max = parseFloat(rangeEl.max || '100');
  const value = parseFloat(rangeEl.value || '0');
  const span = max - min;
  const progress = span ? ((value - min) / span) * 100 : 0;
  rangeEl.style.setProperty('--range-progress', Math.max(0, Math.min(100, progress)) + '%');
}

function syncStartOptionsLabels(){
    if (livesVal && livesSlider) livesVal.textContent = formatResourceOptionValue(livesSlider);
    if (heartsVal && heartsSlider) heartsVal.textContent = formatResourceOptionValue(heartsSlider);
    if (shieldsVal && shieldsSlider) shieldsVal.textContent = formatResourceOptionValue(shieldsSlider);
    if (bombsVal && bombsSlider) bombsVal.textContent = formatResourceOptionValue(bombsSlider);
    if (speedVal && speedSlider) speedVal.textContent = String(getSpeedValueFromSlider());
    syncRangeProgress(speedSlider);
    if (startWaveLabel && startWaveSelect) startWaveLabel.textContent = getStartWaveText(startWaveSelect.value);
  }

  [livesSlider, heartsSlider, shieldsSlider, bombsSlider].forEach(inputEl => {
    if (!inputEl) return;
    inputEl.addEventListener("focus", () => {
      if (activeInputMode !== INPUT_MODE_CONTROLLER) inputEl.select();
    });
    inputEl.addEventListener("click", () => {
      if (activeInputMode !== INPUT_MODE_CONTROLLER) inputEl.select();
    });
    inputEl.addEventListener("input", syncStartOptionsLabels);
    inputEl.addEventListener("change", () => {
      normalizeStartStatInput(inputEl);
      syncStartOptionsLabels();
    });
    inputEl.addEventListener("blur", () => {
      normalizeStartStatInput(inputEl);
      syncStartOptionsLabels();
    });
    inputEl.addEventListener("wheel", (e) => {
      if (activeInputMode === INPUT_MODE_CONTROLLER) return;
      e.preventDefault();
      setActiveInputMode(INPUT_MODE_KEYBOARD);
      stepNumberInput(inputEl, e.deltaY < 0 ? 1 : -1);
    }, { passive:false });
  });
  if (speedSlider){
    speedSlider.addEventListener("input", syncStartOptionsLabels);
    speedSlider.addEventListener("change", syncStartOptionsLabels);
  }
  if (startWaveSelect) startWaveSelect.addEventListener("change", syncStartOptionsLabels);
  syncStartOptionsLabels();
  syncCheatsMenuState();
  syncBackgroundColorControls();

const INPUT_MODE_KEYBOARD = "keyboardMouse";
const INPUT_MODE_CONTROLLER = "controller";
const BINDINGS_STORAGE_KEY = "tektiteShooterBindings_v1";
const DEFAULT_KEYBOARD_BINDINGS = {
  moveLeft: "KeyA",
  moveRight: "KeyD",
  moveUp: "KeyW",
  moveDown: "KeyS",
  shoot: "Mouse0",
  shield: "Mouse2",
  bomb: "KeyQ",
  pause: "Escape",
  commands: "Slash",
  mute: "KeyM",
  fullscreen: "KeyF"
};
const DEFAULT_CONTROLLER_BINDINGS = {
  moveUp: 12,
  moveDown: 13,
  moveLeft: 14,
  moveRight: 15,
  shoot: 7,
  shield: 4,
  bomb: 6,
  pause: 9,
  commands: 8,
  menuSelect: 0,
  menuBack: 1,
  fullscreen: 11
};
const KEYBOARD_BIND_ACTIONS = [
  { key: "moveLeft", label: "Move Left", hint: "Gameplay movement" },
  { key: "moveRight", label: "Move Right", hint: "Gameplay movement" },
  { key: "moveUp", label: "Move Up", hint: "Gameplay movement" },
  { key: "moveDown", label: "Move Down", hint: "Gameplay movement" },
  { key: "shoot", label: "Shoot", hint: "Key or mouse button" },
  { key: "shield", label: "Shield", hint: "Key or mouse button" },
  { key: "bomb", label: "Bomb", hint: "Gameplay action" },
  { key: "pause", label: "Pause / Resume", hint: "Gameplay and pause menu" },
  { key: "commands", label: "Open Commands", hint: "Open slash chat" },
  { key: "mute", label: "Mute", hint: "Toggle audio" },
  { key: "fullscreen", label: "Fullscreen", hint: "Whole shooter shell" }
];
const CONTROLLER_BIND_ACTIONS = [
  { key: "moveUp", label: "Move Up", hint: "Gameplay movement" },
  { key: "moveDown", label: "Move Down", hint: "Gameplay movement" },
  { key: "moveLeft", label: "Move Left", hint: "Gameplay movement" },
  { key: "moveRight", label: "Move Right", hint: "Gameplay movement" },
  { key: "shoot", label: "Shoot", hint: "Gameplay action" },
  { key: "shield", label: "Shield", hint: "Gameplay action" },
  { key: "bomb", label: "Bomb", hint: "Gameplay action" },
  { key: "pause", label: "Pause / Resume", hint: "Gameplay and pause menu" },
  { key: "commands", label: "Open Commands", hint: "Open slash chat" },
  { key: "menuSelect", label: "Menu Select", hint: "Menus and command list" },
  { key: "menuBack", label: "Menu Back / Close Chat", hint: "Menus and pause chat" },
  { key: "fullscreen", label: "Fullscreen", hint: "Whole shooter shell" }
];
let activeInputMode = INPUT_MODE_KEYBOARD;
let controlsInputLockMode = null;
let controlsBindMode = INPUT_MODE_KEYBOARD;
let controlsFocusIndex = 0;
let controlsMoveFocusIndex = 0;
let controlsReturnState = STATE.MENU;
let controlsHavePendingChanges = false;
let controlsJustApplied = false;
let startMenuPanelRect = null;
let bindingEditState = null;
let controllerRebindReady = false;
let pauseControlsOpen = false;
let keyboardBindings = { ...DEFAULT_KEYBOARD_BINDINGS };
let controllerBindings = { ...DEFAULT_CONTROLLER_BINDINGS };
let draftKeyboardBindings = { ...DEFAULT_KEYBOARD_BINDINGS };
let draftControllerBindings = { ...DEFAULT_CONTROLLER_BINDINGS };

function loadSavedBindings(){
  try{
    const raw = localStorage.getItem(BINDINGS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.keyboard && typeof parsed.keyboard === 'object') keyboardBindings = { ...DEFAULT_KEYBOARD_BINDINGS, ...parsed.keyboard };
    if (parsed && parsed.controller && typeof parsed.controller === 'object') controllerBindings = { ...DEFAULT_CONTROLLER_BINDINGS, ...parsed.controller };
  }catch(_){
    keyboardBindings = { ...DEFAULT_KEYBOARD_BINDINGS };
    controllerBindings = { ...DEFAULT_CONTROLLER_BINDINGS };
  }
}
function saveBindings(){ try{ localStorage.setItem(BINDINGS_STORAGE_KEY, JSON.stringify({ keyboard: keyboardBindings, controller: controllerBindings })); }catch(_){} }
function resetDraftBindingsFromActive(){
  draftKeyboardBindings = { ...keyboardBindings };
  draftControllerBindings = { ...controllerBindings };
}
function applyDraftBindings(){
  keyboardBindings = { ...draftKeyboardBindings };
  controllerBindings = { ...draftControllerBindings };
  saveBindings();
}
function formatCompactMoveBinding(value){
  if (controlsBindMode === INPUT_MODE_CONTROLLER){
    const map = {12:"D↑", 13:"D↓", 14:"D←", 15:"D→"};
    return map[value] || formatControllerBinding(value);
  }
  return formatKeyboardBinding(value);
}
function isKeyboardActionHeld(action){ const code = keyboardBindings[action]; return !!(code && keys[code]); }
function getGpButtonPressedByIndex(gp, index){ const btn = gpBtn(gp, index); return (index === 6 || index === 7) ? ((btn.value || 0) > GP_TRIGGER_DEADZONE) : !!btn.pressed; }
function getGpActionPressed(gp, action){ const index = controllerBindings[action]; return typeof index === 'number' ? getGpButtonPressedByIndex(gp, index) : false; }
function updateControlsDisplay(){
  const usingController = activeInputMode === INPUT_MODE_CONTROLLER;
  if (btnControls){
    const inputLabel = usingController ? '🎮' : '⌨️';
    const inputTitle = usingController ? 'Controller active' : 'Keyboard / mouse active';
    btnControls.textContent = `Controls ${inputLabel}`;
    btnControls.title = inputTitle;
    btnControls.setAttribute('aria-label', `Controls. ${inputTitle}`);
  }
  if (controlsMenuTitle){
    controlsMenuTitle.textContent = controlsBindMode === INPUT_MODE_CONTROLLER
      ? 'Controller Keybinds'
      : 'Keyboard / Mouse Controls';
  }
}
function setActiveInputMode(mode, options = null){
  const nextMode = mode === INPUT_MODE_CONTROLLER ? INPUT_MODE_CONTROLLER : INPUT_MODE_KEYBOARD;
  const force = !!(options && options.force);
  if (!force && nextMode === INPUT_MODE_KEYBOARD && controlsMenu && controlsMenu.style.display !== 'none' && controlsInputLockMode === INPUT_MODE_CONTROLLER) return;
  if (activeInputMode === nextMode) return;
  activeInputMode = nextMode;
  document.body.classList.toggle('controller-active', activeInputMode === INPUT_MODE_CONTROLLER);
  if (controlsMenu && controlsMenu.style.display !== 'none') {
    controlsBindMode = activeInputMode;
    bindingEditState = null;
    controllerRebindReady = false;
    renderControlsBindingList();
  }
  updateControlsDisplay();
}
function lockControlsInputMode(mode){
  controlsInputLockMode = mode === INPUT_MODE_CONTROLLER ? INPUT_MODE_CONTROLLER : null;
}
function unlockControlsInputMode(){
  controlsInputLockMode = null;
}
function getCurrentBindingDefs(){ return controlsBindMode === INPUT_MODE_CONTROLLER ? CONTROLLER_BIND_ACTIONS : KEYBOARD_BIND_ACTIONS; }
function getCurrentBindingValue(action){ return controlsBindMode === INPUT_MODE_CONTROLLER ? draftControllerBindings[action] : draftKeyboardBindings[action]; }
const MOVE_BIND_ACTIONS = ["moveUp", "moveDown", "moveLeft", "moveRight"];
const MOVE_BIND_LABELS = { moveUp: "↑", moveDown: "↓", moveLeft: "←", moveRight: "→" };
function isMoveBindAction(action){ return MOVE_BIND_ACTIONS.includes(action); }
function getControlsMoveButtons(){ return Array.from(document.querySelectorAll('#controlsMenu .controlsMoveButton')); }
function isControlsMoveFocused(){
  const target = getControlsControllerTargets()[controlsFocusIndex];
  return !!(target && target.classList && target.classList.contains('controlsMoveButton'));
}
function syncControlsMoveFocus(){
  const moveButtons = getControlsMoveButtons();
  if (!moveButtons.length) return;
  controlsMoveFocusIndex = Math.max(0, Math.min(controlsMoveFocusIndex, moveButtons.length - 1));
  const items = getControlsControllerTargets();
  const targetIndex = items.indexOf(moveButtons[controlsMoveFocusIndex]);
  if (targetIndex !== -1) controlsFocusIndex = targetIndex;
  focusControllerElement(moveButtons[controlsMoveFocusIndex]);
}
function moveControlsMoveFocus(delta){
  const moveButtons = getControlsMoveButtons();
  if (!moveButtons.length) return false;
  controlsMoveFocusIndex = Math.max(0, Math.min(moveButtons.length - 1, controlsMoveFocusIndex + delta));
  syncControlsMoveFocus();
  return true;
}
function renderControlsBindingList(){
  if (!controlsBindList) return;
  controlsBindList.innerHTML = '';
  const defs = getCurrentBindingDefs();
  const moveDefs = defs.filter(def => isMoveBindAction(def.key));
  const otherDefs = defs.filter(def => !isMoveBindAction(def.key));

  if (moveDefs.length){
    const row = document.createElement('div');
    row.className = 'controlsBindRow controlsMoveRow';
    const meta = document.createElement('div');
    meta.className = 'controlsBindMeta';
    const title = document.createElement('div');
    title.className = 'controlsBindTitle';
    title.textContent = 'Move Controls';
    const hint = document.createElement('div');
    hint.className = 'controlsBindHint';
    hint.textContent = 'Left stick left/right chooses a direction; A edits it.';
    meta.appendChild(title);
    meta.appendChild(hint);
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'controlsMoveButtonGroup';
    MOVE_BIND_ACTIONS.forEach(action => {
      const def = moveDefs.find(item => item.key === action);
      if (!def) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'controlsBindButton controlsMoveButton smallBtn';
      button.dataset.action = def.key;
      button.dataset.scheme = controlsBindMode;
      const value = getCurrentBindingValue(def.key);
      const label = MOVE_BIND_LABELS[def.key] || def.label.replace(/^Move\s+/i, '');
      const binding = formatCompactMoveBinding(value);
      const labelSpan = document.createElement('span');
      labelSpan.className = 'moveBindLabel';
      labelSpan.textContent = label;
      const valueSpan = document.createElement('span');
      valueSpan.className = 'moveBindValue';
      valueSpan.textContent = binding;
      button.replaceChildren(labelSpan, valueSpan);
      if (bindingEditState && bindingEditState.scheme === controlsBindMode && bindingEditState.action === def.key){
        button.classList.add('listening');
        valueSpan.textContent = 'Press...';
      }
      button.addEventListener('click', () => startBindingEdit(controlsBindMode, def.key));
      buttonGroup.appendChild(button);
    });
    row.appendChild(meta);
    row.appendChild(buttonGroup);
    controlsBindList.appendChild(row);
  }

  {
    const row = document.createElement('div');
    row.className = 'controlsBindRow controlsAimRow';
    const meta = document.createElement('div');
    meta.className = 'controlsBindMeta';
    const title = document.createElement('div');
    title.className = 'controlsBindTitle';
    title.textContent = 'Aim Control';
    const hint = document.createElement('div');
    hint.className = 'controlsBindHint';
    hint.textContent = controlsBindMode === INPUT_MODE_CONTROLLER ? 'Right Stick' : 'Mouse';
    meta.appendChild(title);
    meta.appendChild(hint);
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'controlsAimButtonGroup';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'controlsBindButton controlsAimButton controlsFixedBindButton smallBtn';
    button.disabled = true;
    button.tabIndex = -1;
    button.setAttribute('aria-disabled', 'true');
    button.textContent = controlsBindMode === INPUT_MODE_CONTROLLER ? 'Right Stick' : 'Mouse';
    buttonGroup.appendChild(button);
    row.appendChild(meta);
    row.appendChild(buttonGroup);
    controlsBindList.appendChild(row);
  }

  otherDefs.forEach(def => {
    const row = document.createElement('div');
    row.className = 'controlsBindRow';
    const meta = document.createElement('div');
    meta.className = 'controlsBindMeta';
    const title = document.createElement('div');
    title.className = 'controlsBindTitle';
    title.textContent = def.label;
    const hint = document.createElement('div');
    hint.className = 'controlsBindHint';
    hint.textContent = def.hint;
    meta.appendChild(title);
    meta.appendChild(hint);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'controlsBindButton smallBtn';
    button.dataset.action = def.key;
    button.dataset.scheme = controlsBindMode;
    const value = getCurrentBindingValue(def.key);
    button.textContent = controlsBindMode === INPUT_MODE_CONTROLLER ? formatControllerBinding(value) : formatKeyboardBinding(value);
    if (bindingEditState && bindingEditState.scheme === controlsBindMode && bindingEditState.action === def.key){
      button.classList.add('listening');
      button.textContent = 'Press input...';
    }
    button.addEventListener('click', () => startBindingEdit(controlsBindMode, def.key));
    row.appendChild(meta);
    row.appendChild(button);
    controlsBindList.appendChild(row);
  });
  fitControlsMenuToViewport();
}
function setControlsBindMode(mode){
  controlsBindMode = mode === INPUT_MODE_CONTROLLER ? INPUT_MODE_CONTROLLER : INPUT_MODE_KEYBOARD;
  bindingEditState = null;
  controllerRebindReady = false;
  updateControlsDisplay();
  renderControlsBindingList();
  fitControlsMenuToViewport();
}
function applyBindingValue(scheme, action, value){
  if (scheme === INPUT_MODE_CONTROLLER) draftControllerBindings[action] = Number(value);
  else draftKeyboardBindings[action] = String(value);
  bindingEditState = null;
  controllerRebindReady = false;
  updateControlsDisplay();
  renderControlsBindingList();
  fitControlsMenuToViewport();
  markControlsDirty();
}
function startBindingEdit(scheme, action){
  controlsBindMode = scheme === INPUT_MODE_CONTROLLER ? INPUT_MODE_CONTROLLER : INPUT_MODE_KEYBOARD;
  bindingEditState = { scheme: controlsBindMode, action };
  controllerRebindReady = false;
  updateControlsDisplay();
  renderControlsBindingList();
  fitControlsMenuToViewport();
}
function cancelBindingEdit(){ bindingEditState = null; controllerRebindReady = false; renderControlsBindingList(); fitControlsMenuToViewport(); }
loadSavedBindings();
resetDraftBindingsFromActive();
updateControlsDisplay();
renderControlsBindingList();
let menuFocusIndex = 0;
let optionsFocusIndex = 0;
let optionsHavePendingChanges = false;
let optionsJustApplied = false;
let cheatsFocusIndex = 0;
let cheatsHavePendingChanges = false;
let cheatsJustApplied = false;
let startingStatFocusIndex = 0;
let pauseFocusIndex = 0;
let gpNavRepeat = { up:0, down:0, left:0, right:0 };
let gpNavPrevAxis = { horizontal:0, vertical:0 };

function refreshEntireShooterPage(){
  try{
    if (window.top && window.top.location) window.top.location.reload();
    else window.location.reload();
  }catch(e){
    window.location.reload();
  }
}

function focusControllerElement(el){
  if (activeInputMode !== INPUT_MODE_CONTROLLER) {
    clearControllerFocus();
    return;
  }
  if (!el) return;
  document.querySelectorAll('.controllerFocus').forEach(node => node.classList.remove('controllerFocus'));
  el.classList.add('controllerFocus');
  const optRow = el.closest('.optRow');
  if (optRow) optRow.classList.add('controllerFocus');
  const bindRow = el.closest('.controlsBindRow');
  if (bindRow) bindRow.classList.add('controllerFocus');
  if (typeof el.focus === 'function') { try{ el.focus({ preventScroll:true }); }catch(_){ try{ el.focus(); }catch(__){} } }
  if (typeof el.scrollIntoView === 'function') {
    try{ el.scrollIntoView({ block:'nearest', inline:'nearest' }); }catch(_){ }
  }
}

function clearControllerFocus(){
  document.querySelectorAll('.controllerFocus').forEach(node => node.classList.remove('controllerFocus'));
}

if (controlsResetBinds) controlsResetBinds.addEventListener('click', () => { draftKeyboardBindings = { ...DEFAULT_KEYBOARD_BINDINGS }; draftControllerBindings = { ...DEFAULT_CONTROLLER_BINDINGS }; cancelBindingEdit(); updateControlsDisplay(); renderControlsBindingList(); markControlsDirty(); });
if (controlsApplyBinds) controlsApplyBinds.addEventListener('click', () => { if (!controlsHavePendingChanges) return; applyDraftBindings(); cancelBindingEdit(); updateControlsDisplay(); renderControlsBindingList(); markControlsClean(true); });
if (controlsBack) controlsBack.addEventListener('click', hideControlsMenu);

function updateControlsApplyButtonState(){
  if (!controlsApplyBinds) return;
  if (controlsHavePendingChanges) setStateApplyButton(controlsApplyBinds, "dirty");
  else if (controlsJustApplied) setStateApplyButton(controlsApplyBinds, "applied");
  else setStateApplyButton(controlsApplyBinds, "hidden");
}

function markControlsDirty(){
  controlsHavePendingChanges = true;
  controlsJustApplied = false;
  updateControlsApplyButtonState();
}

function markControlsClean(applied=false){
  controlsHavePendingChanges = false;
  controlsJustApplied = !!applied;
  updateControlsApplyButtonState();
}

function getMenuControllerTargets(){
  return [startMenuTitle, titleHoverReveal, btnStart, btnOptions, btnMysteryLink, btnStats].filter(Boolean);
}

function isTitleHoverRevealFocused(){
  return getMenuControllerTargets()[menuFocusIndex] === titleHoverReveal;
}

function getStartingStatInputs(){
  return [heartsSlider, shieldsSlider, livesSlider, bombsSlider].filter(Boolean);
}

function getOptionsControllerTargets(){
  // Treat the four starting-stat number boxes as one vertical controller row.
  // Up/down enters/leaves the row; left/right chooses Hearts/Shields/Lives/Bombs.
  const statRowTarget = getStartingStatInputs()[startingStatFocusIndex] || getStartingStatInputs()[0];
  return [btnControls, btnFullscreenOption, speedSlider, backgroundColorHex, backgroundColorPicker, invertColorsCheckbox, videoFxCheckbox, btnCheats, btnBack, (btnApply && btnApply.style.display !== 'none' ? btnApply : null)].filter(Boolean);
}

function getCheatsControllerTargets(){
  const skipTarget = (typeof btnSkipToLevel2 !== "undefined") ? btnSkipToLevel2 : null;
  const statRowTarget = getStartingStatInputs()[startingStatFocusIndex] || getStartingStatInputs()[0];
  return [startWaveSelect, statRowTarget, infiniteToggle, skipTarget, btnCheatsBack, (btnCheatsApply && btnCheatsApply.style.display !== 'none' ? btnCheatsApply : null)].filter(Boolean);
}

function getControlsControllerTargets(){
  const moveButtons = getControlsMoveButtons();
  const moveTarget = moveButtons[controlsMoveFocusIndex] || moveButtons[0];
  const otherBindButtons = Array.from(document.querySelectorAll('#controlsMenu .controlsBindButton:not(.controlsMoveButton)'));
  return [moveTarget, ...otherBindButtons, controlsBack, controlsResetBinds, (controlsApplyBinds && controlsApplyBinds.style.display !== 'none' ? controlsApplyBinds : null)].filter(Boolean);
}

function getPauseHelpControllerTargets(){
  if (!pauseCmdSuggest || pauseCmdSuggest.style.display === "none") return [];
  return Array.from(pauseCmdSuggest.querySelectorAll("[data-cmd]"));
}

function getPauseControllerTargets(){
  const helpTargets = getPauseHelpControllerTargets();
  if (helpTargets.length) return helpTargets;
  return [btnPauseResume, (canOpenStore() ? btnPauseOpenStore : null), btnPauseOpenChat, btnPauseQuit].filter(Boolean);
}

function getScoreStoreControllerTargets(){
  return [...Array.from(document.querySelectorAll('#scoreStoreItems .scoreStoreAction')), btnScoreStoreClose].filter(Boolean);
}

function getWinControllerTargets(){
  return [btnContinue].filter(Boolean);
}

function syncMenuControllerFocus(){
  const items = getMenuControllerTargets();
  if (!items.length) return;
  menuFocusIndex = Math.max(0, Math.min(menuFocusIndex, items.length - 1));
  focusControllerElement(items[menuFocusIndex]);
}

function syncOptionsControllerFocus(){
  const statInputs = getStartingStatInputs();
  if (statInputs.length) startingStatFocusIndex = Math.max(0, Math.min(startingStatFocusIndex, statInputs.length - 1));
  const items = getOptionsControllerTargets();
  if (!items.length) return;
  optionsFocusIndex = Math.max(0, Math.min(optionsFocusIndex, items.length - 1));
  focusControllerElement(items[optionsFocusIndex]);
}

function syncCheatsControllerFocus(){
  const items = getCheatsControllerTargets();
  if (!items.length) return;
  cheatsFocusIndex = Math.max(0, Math.min(cheatsFocusIndex, items.length - 1));
  focusControllerElement(items[cheatsFocusIndex]);
}

function syncPauseControllerFocus(){
  const items = getPauseControllerTargets();
  if (!items.length) return;
  pauseFocusIndex = Math.max(0, Math.min(pauseFocusIndex, items.length - 1));
  focusControllerElement(items[pauseFocusIndex]);
}

function syncScoreStoreControllerFocus(){
  const items = getScoreStoreControllerTargets();
  if (!items.length) return;
  scoreStoreFocusIndex = Math.max(0, Math.min(scoreStoreFocusIndex, items.length - 1));
  focusControllerElement(items[scoreStoreFocusIndex]);
}

function syncWinControllerFocus(){
  const items = getWinControllerTargets();
  if (!items.length) return;
  focusControllerElement(items[0]);
}

function syncControlsControllerFocus(){
  const items = getControlsControllerTargets();
  if (!items.length) return;
  controlsFocusIndex = Math.max(0, Math.min(controlsFocusIndex, items.length - 1));
  focusControllerElement(items[controlsFocusIndex]);
}

function syncControllerFocusForCurrentState(){
  if (activeInputMode !== INPUT_MODE_CONTROLLER || parentChatVisible){
    clearControllerFocus();
    return;
  }
  if (isScoreStoreOpen && isPaused){
    syncScoreStoreControllerFocus();
    return;
  }
  if (pauseControlsOpen && isPaused){
    syncControlsControllerFocus();
    return;
  }
  if (isPaused){
    syncPauseControllerFocus();
    return;
  }
  if (gameState === STATE.MENU){
    syncMenuControllerFocus();
    return;
  }
  if (gameState === STATE.OPTIONS){
    syncOptionsControllerFocus();
    return;
  }
  if (gameState === STATE.CHEATS){
    syncCheatsControllerFocus();
    return;
  }
  if (gameState === STATE.CONTROLS){
    syncControlsControllerFocus();
    return;
  }
  if (gameState === STATE.WIN){
    syncWinControllerFocus();
    return;
  }
  clearControllerFocus();
}

function moveMenuControllerFocus(delta){
  const items = getMenuControllerTargets();
  if (!items.length) return;
  menuFocusIndex = (menuFocusIndex + delta + items.length) % items.length;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
  else clearControllerFocus();
}

function moveOptionsControllerFocus(delta){
  const previous = getOptionsControllerTargets()[optionsFocusIndex];
  const items = getOptionsControllerTargets();
  if (!items.length) return;
  optionsFocusIndex = (optionsFocusIndex + delta + items.length) % items.length;
  const next = getOptionsControllerTargets()[optionsFocusIndex];
  const statInputs = getStartingStatInputs();
  if (statInputs.includes(next) && !statInputs.includes(previous)){
    startingStatFocusIndex = 0; // Entering the stat row lands on Hearts. Humanity survives.
  }
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncOptionsControllerFocus();
  else clearControllerFocus();
}

function moveCheatsControllerFocus(delta){
  const items = getCheatsControllerTargets();
  if (!items.length) return;
  cheatsFocusIndex = (cheatsFocusIndex + delta + items.length) % items.length;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncCheatsControllerFocus();
  else clearControllerFocus();
}

function movePauseControllerFocus(delta){
  const items = getPauseControllerTargets();
  if (!items.length) return;
  pauseFocusIndex = (pauseFocusIndex + delta + items.length) % items.length;
  syncPauseControllerFocus();
}

function moveScoreStoreControllerFocus(delta){
  const items = getScoreStoreControllerTargets();
  if (!items.length) return;
  scoreStoreFocusIndex = (scoreStoreFocusIndex + delta + items.length) % items.length;
  syncScoreStoreControllerFocus();
}

function moveControlsControllerFocus(delta){
  const previous = getControlsControllerTargets()[controlsFocusIndex];
  const items = getControlsControllerTargets();
  if (!items.length) return;
  controlsFocusIndex = (controlsFocusIndex + delta + items.length) % items.length;
  const next = getControlsControllerTargets()[controlsFocusIndex];
  const moveButtons = getControlsMoveButtons();
  if (moveButtons.includes(next) && !moveButtons.includes(previous)){
    controlsMoveFocusIndex = 0;
  }
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncControlsControllerFocus();
  else clearControllerFocus();
  fitControlsMenuToViewport();
}

function moveStartingStatFocus(delta){
  const statInputs = getStartingStatInputs();
  if (!statInputs.length) return false;
  startingStatFocusIndex = Math.max(0, Math.min(statInputs.length - 1, startingStatFocusIndex + delta));
  if (gameState === STATE.CHEATS) syncCheatsControllerFocus();
  else syncOptionsControllerFocus();
  return true;
}

function isStartingStatFocused(){
  const statInputs = getStartingStatInputs();
  return statInputs.includes(getCheatsControllerTargets()[cheatsFocusIndex]);
}

function isOptionsBottomButtonFocused(){
  const items = getOptionsControllerTargets();
  const current = items[optionsFocusIndex];
  return current === btnBack || current === btnApply;
}

function moveOptionsBottomButtonsHorizontally(delta){
  const items = getOptionsControllerTargets();
  const current = items[optionsFocusIndex];
  if (current !== btnBack && current !== btnApply) return false;
  if (delta < 0 && current === btnApply && btnBack){
    optionsFocusIndex = Math.max(0, items.indexOf(btnBack));
  } else if (delta > 0 && current === btnBack && btnApply){
    optionsFocusIndex = Math.max(0, items.indexOf(btnApply));
  } else {
    return false;
  }
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncOptionsControllerFocus();
  else clearControllerFocus();
  return true;
}

function wrapOptionsBottomButtonsToTop(){
  if (!isOptionsBottomButtonFocused()) return false;
  optionsFocusIndex = 0;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncOptionsControllerFocus();
  else clearControllerFocus();
  return true;
}

function cycleSelect(selectEl, delta){
  if (!selectEl || !selectEl.options || !selectEl.options.length) return false;
  const current = Math.max(0, selectEl.selectedIndex);
  const next = Math.max(0, Math.min(selectEl.options.length - 1, current + delta));
  if (next === current) return false;
  selectEl.selectedIndex = next;
  selectEl.dispatchEvent(new Event('change', { bubbles:true }));
  return true;
}

function stepRange(rangeEl, delta){
  if (!rangeEl) return false;
  const step = parseFloat(rangeEl.step || '1') || 1;
  const min = parseFloat(rangeEl.min || '0');
  const max = parseFloat(rangeEl.max || '100');
  const current = parseFloat(rangeEl.value || '0');
  const next = Math.max(min, Math.min(max, current + (step * delta)));
  if (next === current) return false;
  rangeEl.value = String(next);
  rangeEl.dispatchEvent(new Event('input', { bubbles:true }));
  rangeEl.dispatchEvent(new Event('change', { bubbles:true }));
  return true;
}

function stepNumberInput(inputEl, delta){
  if (!inputEl) return false;
  const step = parseInt(inputEl.step || '1', 10) || 1;
  const min = parseInt(inputEl.min || '0', 10);
  const max = parseInt(inputEl.max || '999', 10);
  const raw = String(inputEl.value || '').trim().toLowerCase();
  const isInfinite = raw === 'infinite' || raw === 'inf' || raw === '∞';
  const current = isInfinite ? max : parseInt(raw || '0', 10);
  const safeCurrent = Number.isFinite(current) ? current : min;
  const next = Math.max(min, Math.min(max, safeCurrent + (step * delta)));
  if (next === safeCurrent) return false;
  inputEl.value = String(next >= 100 ? 100 : next);
  inputEl.dispatchEvent(new Event('input', { bubbles:true }));
  inputEl.dispatchEvent(new Event('change', { bubbles:true }));
  focusControllerElement(inputEl);
  return true;
}

function openControllerSelect(selectEl){
  if (!selectEl || selectEl.tagName !== 'SELECT') return false;
  focusControllerElement(selectEl);
  const forceTopOpen = selectEl.id === 'startWaveSelect';
  const previousIndex = selectEl.selectedIndex;
  if (forceTopOpen){
    try{ selectEl.scrollTop = 0; }catch(_){ }
    try{ selectEl.selectedIndex = 0; }catch(_){ }
  }
  let opened = false;
  try{ if (typeof selectEl.showPicker === 'function'){ selectEl.showPicker(); opened = true; } }catch(_){}
  if (!opened){
    try{ selectEl.dispatchEvent(new MouseEvent('mousedown', { bubbles:true, cancelable:true, view:window })); opened = true; }catch(_){}
  }
  if (!opened){
    try{ selectEl.dispatchEvent(new KeyboardEvent('keydown', { key:'ArrowDown', code:'ArrowDown', keyCode:40, which:40, altKey:true, bubbles:true })); opened = true; }catch(_){}
  }
  if (forceTopOpen){
    const restoreSelection = () => {
      try{ selectEl.scrollTop = 0; }catch(_){ }
      try{ selectEl.selectedIndex = previousIndex; }catch(_){ }
    };
    setTimeout(restoreSelection, 0);
    setTimeout(restoreSelection, 120);
  }
  return opened;
}

function stepNumberInput(inputEl, delta){
  if (!inputEl) return false;
  const step = parseInt(inputEl.step || '1', 10) || 1;
  const min = parseInt(inputEl.min || '0', 10);
  const max = parseInt(inputEl.max || '999', 10);
  const raw = String(inputEl.value || '').trim().toLowerCase();
  const isInfinite = raw === 'infinite' || raw === 'inf' || raw === '\u221e';
  const current = isInfinite ? max : parseInt(raw || '0', 10);
  const safeCurrent = Number.isFinite(current) ? current : min;
  const next = Math.max(min, Math.min(max, safeCurrent + (step * delta)));
  if (next === safeCurrent) return false;
  inputEl.value = next >= 100 ? "\u221e" : String(next);
  inputEl.dispatchEvent(new Event('input', { bubbles:true }));
  inputEl.dispatchEvent(new Event('change', { bubbles:true }));
  focusControllerElement(inputEl);
  return true;
}

function activateControllerTarget(el){
  if (!el) return;
  if (el.tagName === "A"){
    el.click();
    return true;
  }
  if (el.dataset && el.dataset.cmd){
    const command = (typeof getPauseHelpCommandFromNode === "function")
      ? getPauseHelpCommandFromNode(el)
      : (el.dataset.cmd || "");
    if (command) execPauseCommand(command);
    return true;
  }
  if (el.dataset && el.dataset.action && el.dataset.scheme){
    startBindingEdit(el.dataset.scheme, el.dataset.action);
    return;
  }
  if (el === btnControls){
    showControlsMenu();
    return;
  }
  if (el.tagName === 'SELECT'){
    openControllerSelect(el);
    return;
  }
  if (el.type === 'checkbox'){
    el.checked = !el.checked;
    el.dispatchEvent(new Event('change', { bubbles:true }));
    focusControllerElement(el);
    return;
  }
  if (isStartingStatInputEl(el)){
    el.focus();
    focusControllerElement(el);
    return;
  }
  if (typeof el.click === 'function') el.click();
}

function stepColorInput(inputEl, delta){
  if (!inputEl) return false;
  const current = normalizeHexColor(inputEl.value || starfieldBgOverride || "#000000") || "#000000";
  const n = parseInt(current.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const step = delta > 0 ? 16 : -16;
  r = Math.max(0, Math.min(255, r + step));
  g = Math.max(0, Math.min(255, g + step));
  b = Math.max(0, Math.min(255, b + step));
  const next = "#" + [r,g,b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
  applyBackgroundColorFromControls(next);
  return true;
}

function adjustControllerOption(delta){
  const items = getOptionsControllerTargets();
  const el = items[optionsFocusIndex];
  if (!el) return false;
  if (el.tagName === 'SELECT') return cycleSelect(el, delta);
  if (el.type === 'range') return stepRange(el, delta);
  if (el === backgroundColorPicker) return stepColorInput(el, delta);
  if (el === backgroundColorHex) return false;
  if (isStartingStatInputEl(el)) return stepNumberInput(el, delta);
  if (el.type === 'checkbox'){
    el.checked = delta > 0;
    el.dispatchEvent(new Event('change', { bubbles:true }));
    focusControllerElement(el);
    return true;
  }
  return false;
}

function adjustControllerCheat(delta){
  const items = getCheatsControllerTargets();
  const el = items[cheatsFocusIndex];
  if (!el) return false;
  if (el.tagName === 'SELECT') return cycleSelect(el, delta);
  if (isStartingStatInputEl(el)) return stepNumberInput(el, delta);
  if (el.type === 'checkbox'){
    el.checked = delta > 0;
    el.dispatchEvent(new Event('change', { bubbles:true }));
    focusControllerElement(el);
    return true;
  }
  return false;
}
function showMenu(){
  setPaused(false);
  playerSpectatorMode = false;
  try{ document.body.classList.remove("zeroLivesSpectatorMode"); }catch(e){}
  deathYellPlayed = false;
  gameState = STATE.MENU;
  gameWon = false;
  // v1.96: drop shield when entering menus
  mouseShieldHolding = false;
  stopShield(false);

  deathOverlay.style.display = "none";
  clearDeathControllerFocus();
  if (winOverlay) winOverlay.style.display = "none";

  startMenu.style.display = "block";
  rememberStartMenuPanelRect();
  optionsMenu.style.display = "none";
  if (controlsMenu) { controlsMenu.style.display = "none"; controlsMenu.classList.remove("pauseControlsMode"); }
  if (cheatsMenu) cheatsMenu.style.display = "none";
  pauseControlsOpen = false;
  if (pauseOverlay) pauseOverlay.classList.remove("pauseControlsVisible");
  uiRoot.classList.remove("pauseControlsOpen");
  uiRoot.style.display = "flex";
  menuFocusIndex = 0;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
  else clearControllerFocus();
  renderMenuHudPreview();
  syncSpeedZeroStaticImages();
  renderLifetimeStats();
}

function showControlsMenu(){
  if (!controlsMenu) return;
  const fromOptions = optionsMenu && optionsMenu.style.display !== "none";
  const fromMenu = startMenu && startMenu.style.display !== "none";
  if (!fromOptions && !fromMenu && !pauseControlsOpen) return;

  if (fromMenu) rememberStartMenuPanelRect();
  else getFallbackMenuRect();

  controlsReturnState = fromOptions ? STATE.OPTIONS : STATE.MENU;

  setPaused(false);
  pauseControlsOpen = false;
  pauseOverlay.classList.remove("pauseControlsVisible");
  uiRoot.classList.remove("pauseControlsOpen");
  gameState = STATE.CONTROLS;
  resetDraftBindingsFromActive();
  markControlsClean(false);
  lockControlsInputMode(activeInputMode);
  setControlsBindMode(activeInputMode);
  startMenu.style.display = "none";
  optionsMenu.style.display = "none";
  if (cheatsMenu) cheatsMenu.style.display = "none";
  controlsMenu.style.display = "block";
  controlsMenu.classList.remove("pauseControlsMode");
  uiRoot.style.display = "flex";
  updateControlsDisplay();
  renderControlsBindingList();
  fitControlsMenuToViewport();
  controlsFocusIndex = 0;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncControlsControllerFocus();
  else clearControllerFocus();
  renderMenuHudPreview();
  updateHearts();
}
function hideControlsMenu(){
  if (!controlsMenu) return;
  resetDraftBindingsFromActive();
  controlsMenu.style.display = "none";
  controlsMenu.classList.remove("pauseControlsMode");
  unlockControlsInputMode();
  cancelBindingEdit();
  if (pauseControlsOpen && isPaused){
    hidePauseControlsMenu();
    return;
  }
  if (controlsReturnState === STATE.OPTIONS){
    showOptions();
    return;
  }
  showMenu();
}

function showWinOverlay(){
  commitRunLifetimeStats({ won:true });
  gameWon = true;
  gameState = STATE.WIN;
  if (winOverlay) winOverlay.style.display = "flex";
  if (pauseOverlay) pauseOverlay.style.display = "none";
  refreshWinStats();
  livesSlot.style.display = "none";
  powerupSlot.style.display = "none";
  if (timerHud) timerHud.style.display = "none";
  { const heartsHud = getHeartsHudEl(); if (heartsHud) heartsHud.style.display = "none"; }
  stopMusic();
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncWinControllerFocus();
  else clearControllerFocus();
}



function resetDeathQuitConfirm(){
  deathQuitConfirmArmed = false;
  deathQuitConfirmReady = false;
  deathQuitConfirmRemaining = 0;
  if (deathQuitConfirmTimer){
    clearInterval(deathQuitConfirmTimer);
    deathQuitConfirmTimer = null;
  }
  if (btnDeathQuitToMenu) btnDeathQuitToMenu.textContent = "Quit to Menu";
}

function getDeathButtons(){
  const buttons = [];
  if (btnRestart) buttons.push(btnRestart);
  if (btnDeathQuitToMenu) buttons.push(btnDeathQuitToMenu);
  return buttons.filter((button) => !!button);
}

function clearDeathControllerFocus(){
  getDeathButtons().forEach((button) => {
    button.classList.remove("controllerFocus");
    try{ button.blur(); }catch(e){}
  });
}

function syncDeathControllerFocus(){
  const buttons = getDeathButtons();
  if (!buttons.length) return;
  document.body.classList.add("controller-active");
  deathFocusIndex = Math.max(0, Math.min(deathFocusIndex, buttons.length - 1));
  buttons.forEach((button, index) => {
    button.classList.toggle("controllerFocus", index === deathFocusIndex);
    if (index === deathFocusIndex){
      try{ button.focus({ preventScroll:true }); }catch(e){ try{ button.focus(); }catch(_){} }
    }
  });
}

function moveDeathControllerFocus(delta){
  const buttons = getDeathButtons();
  if (!buttons.length) return;
  deathFocusIndex = (deathFocusIndex + delta + buttons.length) % buttons.length;
  syncDeathControllerFocus();
}

function activateDeathControllerFocus(){
  const buttons = getDeathButtons();
  if (!buttons.length) return false;
  const button = buttons[Math.max(0, Math.min(deathFocusIndex, buttons.length - 1))];
  if (!button) return false;
  try{ button.click(); return true; }catch(e){ return false; }
}

function performDeathQuitToMenu(){
  if (deathQuitConfirmTimer){
    clearInterval(deathQuitConfirmTimer);
    deathQuitConfirmTimer = null;
  }

  deathOverlay.style.display = "none";
    clearDeathControllerFocus();
    setPaused(false);
    stopMusic();
    _resetStartResourceDefaults();
    showMenu();
}

function armDeathQuitConfirmCountdown(){
  deathQuitConfirmArmed = true;
  deathQuitConfirmReady = false;
  deathQuitConfirmRemaining = 5;
  if (deathQuitConfirmTimer){
    clearInterval(deathQuitConfirmTimer);
    deathQuitConfirmTimer = null;
  }
  if (btnDeathQuitToMenu) btnDeathQuitToMenu.textContent = "Really, Quit? (5s)";
  deathQuitConfirmTimer = setInterval(() => {
    deathQuitConfirmRemaining = Math.max(0, deathQuitConfirmRemaining - 1);
    if (btnDeathQuitToMenu){
      btnDeathQuitToMenu.textContent = deathQuitConfirmRemaining > 0
        ? "Really, Quit? (" + deathQuitConfirmRemaining + "s)"
        : "Really, Quit?";
    }
    if (deathQuitConfirmRemaining <= 0){
      clearInterval(deathQuitConfirmTimer);
      deathQuitConfirmTimer = null;
      deathQuitConfirmReady = true;
    }
  }, 1000);
}

function quitDeathToMenu(){
  if (!deathQuitConfirmArmed){
    armDeathQuitConfirmCountdown();
    syncDeathControllerFocus();
    return;
  }
  if (!deathQuitConfirmReady){
    syncDeathControllerFocus();
    return;
  }
  performDeathQuitToMenu();
}

function restartRun(){
  resetDeathQuitConfirm();
  setPaused(false);
  // Restart music immediately when restarting a run.
  ensureMusicPlaying(true);
  // v1.96: Hard reset from GAME OVER screen (full reset to beginning)
  deathOverlay.style.display = "none";
  clearDeathControllerFocus();
  bomb = null;
  ufo = null;
  powerupSlot.style.display = "none";
  startGame();
}
function showCheats(){
  if (startMenu && startMenu.style.display !== "none") rememberStartMenuPanelRect();
  else getFallbackMenuRect();
  setPaused(false);
  gameState = STATE.CHEATS;
  if (startWaveSelect) startWaveSelect.value = String(START_WAVE);
  livesSlider.value = START_LIVES_INFINITE ? 100 : START_LIVES;
  heartsSlider.value = START_HEARTS_INFINITE ? 100 : START_HEARTS;
  shieldsSlider.value = START_SHIELDS_INFINITE ? 100 : START_SHIELDS;
  bombsSlider.value = START_BOMBS_INFINITE ? 100 : START_BOMBS;
  normalizeStartStatInput(livesSlider);
  normalizeStartStatInput(heartsSlider);
  normalizeStartStatInput(shieldsSlider);
  normalizeStartStatInput(bombsSlider);
  syncStartOptionsLabels();
  syncCheatsMenuState();
  markCheatsClean(false);
  startMenu.style.display = "none";
  if (controlsMenu) { controlsMenu.style.display = "none"; controlsMenu.classList.remove("pauseControlsMode"); }
  optionsMenu.style.display = "none";
  if (cheatsMenu) cheatsMenu.style.display = "block";
  uiRoot.style.display = "flex";
  fitCheatsMenuToViewport();
  cheatsFocusIndex = 0;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncCheatsControllerFocus();
  else clearControllerFocus();
  renderMenuHudPreview();
}

function hideCheats(){
  gameState = STATE.OPTIONS;
  if (cheatsMenu) cheatsMenu.style.display = "none";
  optionsMenu.style.display = "block";
  fitOptionsMenuToViewport();
  optionsFocusIndex = Math.max(0, getOptionsControllerTargets().indexOf(btnCheats));
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncOptionsControllerFocus();
  else clearControllerFocus();
  renderMenuHudPreview();
}

function setStateApplyButton(button, state){
  if (!button) return;
  if (button._applyHideTimer){
    clearTimeout(button._applyHideTimer);
    button._applyHideTimer = null;
  }
  if (state === "dirty"){
    button.style.display = "";
    button.innerHTML = 'Apply? <span class="applyX">(✕)</span>';
    button.title = "Apply pending changes";
    return;
  }
  if (state === "applied"){
    button.style.display = "";
    button.innerHTML = 'Applied! <span class="applyCheck">(✓)</span>';
    button.title = "Changes applied";
    button._applyHideTimer = setTimeout(() => {
      button.style.display = "none";
      button.innerHTML = 'Apply? <span class="applyX">(✕)</span>';
      button.title = "Apply pending changes";
      button._applyHideTimer = null;
    }, 3000);
    return;
  }
  button.style.display = "none";
  button.innerHTML = 'Apply? <span class="applyX">(✕)</span>';
  button.title = "Apply pending changes";
}

function updateOptionsApplyButtonState(){
  if (!btnApply) return;
  if (optionsHavePendingChanges) setStateApplyButton(btnApply, "dirty");
  else if (optionsJustApplied) setStateApplyButton(btnApply, "applied");
  else setStateApplyButton(btnApply, "hidden");
}

function markOptionsDirty(){
  optionsHavePendingChanges = true;
  optionsJustApplied = false;
  updateOptionsApplyButtonState();
}

function markOptionsClean(applied=false){
  optionsHavePendingChanges = false;
  optionsJustApplied = !!applied;
  updateOptionsApplyButtonState();
}

function clampGameSpeedValue(value){
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(-5, Math.min(20, Math.round(n)));
}

function gameSpeedToMultiplier(value){
  const speed = clampGameSpeedValue(value);
  if (speed === 0) return 0;
  if (speed === 1) return 1;
  if (speed < 0) return Math.max(0.05, (speed + 6) / 6);
  return speed;
}

function speedToSliderPosition(value){
  const speed = clampGameSpeedValue(value);
  return speed <= 0 ? speed + 5 : speed + 5;
}

function sliderPositionToSpeed(value){
  const pos = Math.max(0, Math.min(25, Math.round(Number(value))));
  return pos <= 5 ? pos - 5 : pos - 5;
}

function setSpeedSliderPositionFromSpeed(value){
  if (!speedSlider) return;
  speedSlider.value = String(speedToSliderPosition(value));
}

function getSpeedValueFromSlider(){
  return speedSlider ? sliderPositionToSpeed(speedSlider.value) : 1;
}

function applyGameSpeedValue(value, syncSlider=true){
  const speed = clampGameSpeedValue(value);
  START_GAME_SPEED = speed;
  GAME_SPEED_MULT = gameSpeedToMultiplier(speed);
  if (speed === 0){
    pendingWaveStartMusic = false;
    stopMusic();
  }
  if (syncSlider) setSpeedSliderPositionFromSpeed(speed);
  syncStartOptionsLabels();
  syncSpeedZeroStaticImages();
  return speed;
}

function isGameSpeedFrozen(){
  return clampGameSpeedValue(START_GAME_SPEED) === 0 || GAME_SPEED_MULT === 0;
}

window.TektiteLevel1SpeedZero = {
  isFrozen(){
    try{
      return gameState === STATE.PLAYING && isGameSpeedFrozen() && !isPaused;
    }catch(e){
      return false;
    }
  },
  getPlayerState(){
    try{
      return {
        x: player.x,
        y: player.y,
        w: player.w,
        h: player.h,
        facing: playerFacing,
        imageUrl: "/games/shooter-game/assets/bananarama.gif"
      };
    }catch(e){
      return null;
    }
  },
  setPlayerX(nextX){
    try{
      const n = Number(nextX);
      if (!Number.isFinite(n)) return;
      player.x = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, n));
    }catch(e){}
  },
  hideCanvasPlayer(hidden){
    try{
      document.body.classList.toggle("speedZeroMeltHideCanvasPlayer", !!hidden);
    }catch(e){}
  },
  forceDraw(){
    try{
      draw();
    }catch(e){}
  },
  setNegativeTimeTravel(seconds){
    try{
      const value = Math.max(0, Number(seconds) || 0);
      document.body.classList.add("speedZeroTimeTravel");
      if (timerHud){
        timerHud.style.display = "block";
        timerHud.innerHTML = '<div class="timerHudLabel">Time Travel</div><div>-' + value.toFixed(1) + 's</div>';
      }
    }catch(e){}
  },
  resetToSpeedOneAndMenu(){
    try{
      this.hideCanvasPlayer(false);
      applyGameSpeedValue(1, true);
      setPaused(false);
      showMenu();
      syncStartOptionsLabels();
      ensureMusicPlaying(true);
    }catch(e){
      try{ console.warn("Speed-zero easter egg reset failed", e); }catch(_){}
    }
  }
};

const frozenStaticImageUrlCache = new Map();

function getFrozenStaticImageUrlFromImage(img){
  if (!img) return null;
  const src = img.currentSrc || img.src || "";
  if (!src) return null;
  if (src.startsWith("data:image/")) return src;
  if (frozenStaticImageUrlCache.has(src)) return frozenStaticImageUrlCache.get(src);

  try{
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) return null;
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const cctx = c.getContext("2d");
    if (!cctx) return null;
    cctx.drawImage(img, 0, 0, c.width, c.height);
    const url = c.toDataURL("image/png");
    frozenStaticImageUrlCache.set(src, url);
    return url;
  }catch(e){
    return null;
  }
}

function setDomImageFrozen(img, freeze){
  if (!img) return;
  if (!img.dataset.originalAnimatedSrc){
    img.dataset.originalAnimatedSrc = img.currentSrc || img.src || "";
  }

  if (freeze){
    const frozenUrl = getFrozenStaticImageUrlFromImage(img);
    if (frozenUrl && img.src !== frozenUrl) img.src = frozenUrl;
  } else {
    const original = img.dataset.originalAnimatedSrc;
    if (original && img.src !== original) img.src = original;
  }
}

function syncSpeedZeroStaticImages(){
  const freeze = isGameSpeedFrozen();

  // Start-menu Bananarama + lives counter Bananarama. Any Bananarama DOM img gets frozen
  // into a one-frame PNG while speed is 0, then restored afterward.
  const domImgs = Array.from(document.querySelectorAll('img[src*="bananarama."], img[data-original-animated-src*="bananarama."]'));
  for (const img of domImgs) setDomImageFrozen(img, freeze);

  document.body.classList.toggle("speedZeroStaticImages", freeze);
}

function getStaticFrameForImage(img){
  if (!img) return null;
  const src = img.currentSrc || img.src || "";
  if (!src) return img;

  const cachedUrl = getFrozenStaticImageUrlFromImage(img);
  if (!cachedUrl) return img;

  let cached = frozenStaticImageUrlCache.get(cachedUrl);
  if (cached && cached.__isFrozenStaticImageElement) return cached;

  const staticImg = new Image();
  staticImg.__isFrozenStaticImageElement = true;
  staticImg.src = cachedUrl;
  frozenStaticImageUrlCache.set(cachedUrl, staticImg);
  return staticImg.complete ? staticImg : img;
}

function normalizeHexColor(value){
  const raw = String(value || "").trim();
  const withHash = raw.startsWith("#") ? raw : "#" + raw;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)){
    return "#" + withHash.slice(1).split("").map(ch => ch + ch).join("").toUpperCase();
  }
  return null;
}

function syncBackgroundColorControls(){
  const current = normalizeHexColor(starfieldBgOverride || "#000000") || "#000000";
  if (backgroundColorHex) backgroundColorHex.value = current;
  if (backgroundColorPicker) backgroundColorPicker.value = current;
}

function applyBackgroundColorFromControls(value){
  const normalized = normalizeHexColor(value);
  if (!normalized) return false;
  starfieldBgOverride = normalized;
  if (backgroundColorHex) backgroundColorHex.value = normalized;
  if (backgroundColorPicker) backgroundColorPicker.value = normalized;
  return true;
}

function showOptions(){
  if (startMenu && startMenu.style.display !== "none") rememberStartMenuPanelRect();
  else getFallbackMenuRect();
  setPaused(false);
  gameState = STATE.OPTIONS;
  markOptionsClean(false);
    // v1.96: populate start options UI with saved settings
  livesSlider.value = START_LIVES_INFINITE ? 100 : START_LIVES;
  heartsSlider.value = START_HEARTS_INFINITE ? 100 : START_HEARTS;
  shieldsSlider.value = START_SHIELDS_INFINITE ? 100 : START_SHIELDS;
  bombsSlider.value = START_BOMBS_INFINITE ? 100 : START_BOMBS;
  setSpeedSliderPositionFromSpeed(START_GAME_SPEED);
  if (startWaveSelect) startWaveSelect.value = String(START_WAVE);
  syncStartOptionsLabels();
  normalizeStartStatInput(livesSlider);
  normalizeStartStatInput(heartsSlider);
  normalizeStartStatInput(shieldsSlider);
  normalizeStartStatInput(bombsSlider);
  syncStartOptionsLabels();
  syncCheatsMenuState();

// v1.96: drop shield when entering menus
  mouseShieldHolding = false;
  stopShield(false);

  startMenu.style.display = "none";
  if (controlsMenu) { controlsMenu.style.display = "none"; controlsMenu.classList.remove("pauseControlsMode"); }
  pauseControlsOpen = false;
  if (pauseOverlay) pauseOverlay.classList.remove("pauseControlsVisible");
  uiRoot.classList.remove("pauseControlsOpen");
  optionsMenu.style.display = "block";
  if (cheatsMenu) cheatsMenu.style.display = "none";
  uiRoot.style.display = "flex";
  fitOptionsMenuToViewport();
  optionsFocusIndex = 0;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncOptionsControllerFocus();
  else clearControllerFocus();
  renderMenuHudPreview();
  updateHearts();
}
function startGame(){
  setPaused(false);
  unlockAudioOnce();
  gameState = STATE.PLAYING;
  uiRoot.style.display = "none";
  if (controlsMenu) { controlsMenu.style.display = "none"; controlsMenu.classList.remove("pauseControlsMode"); }
  pauseControlsOpen = false;
  if (pauseOverlay) pauseOverlay.classList.remove("pauseControlsVisible");
  uiRoot.classList.remove("pauseControlsOpen");
  deathOverlay.style.display = "none";
  clearDeathControllerFocus();
  if (winOverlay) winOverlay.style.display = "none";

  // v1.96: show HUD only in-game
  livesSlot.style.display = "flex";
  powerupSlot.style.display = "none";
  if (timerHud) timerHud.style.display = "block";
  { const heartsHud = getHeartsHudEl(); if (heartsHud) heartsHud.style.display = "block"; }

  // v1.96.x: Reset run timer at the start of each game
  runTimer = 0;
  updateTimerHUD();
  currentRunStatsCommitted = false;
  score = 0;
  frogKills = 0;
  shotsFired = 0;
  hitsConnected = 0;
  damageDealt = 0;
  totalEnemiesSpawned = 0;
  bombDragonKills = 0;
  bombFrogKills = 0;
  // v1.96: Apply starting settings from OPTIONS menu
  infiniteModeActive = !!INFINITE_MODE;
  livesInfiniteActive = !!START_LIVES_INFINITE || !!INFINITE_MODE;
  heartsInfiniteActive = !!START_HEARTS_INFINITE || !!INFINITE_MODE;
  shieldsInfiniteActive = !!START_SHIELDS_INFINITE || !!INFINITE_MODE;
  bombsInfiniteActive = !!START_BOMBS_INFINITE || !!INFINITE_MODE;

  lives = livesInfiniteActive ? 100 : Math.max(0, parseInt(START_LIVES, 10) || 0);
  playerSpectatorMode = !livesInfiniteActive && lives <= 0;
  try{ document.body.classList.toggle("zeroLivesSpectatorMode", playerSpectatorMode); }catch(e){}
  livesText.textContent = livesInfiniteActive ? "x∞" : ("x" + lives);
  if (playerSpectatorMode && livesSlot) livesSlot.style.display = "none";

  MAX_HEARTS = heartsInfiniteActive ? 100 : Math.max(1, parseInt(START_HEARTS, 10) || 4);
  HIT_DAMAGE = 1 / MAX_HEARTS;

  health = 1.0;

  // Spawn player mid-screen, above hearts HUD
  player.x = canvas.width / 2;
  player.y = getPlayerAlignedY();

  shieldPips = shieldsInfiniteActive ? 100 : Math.max(0, parseInt(START_SHIELDS, 10) || 0);

  bombsCount = bombsInfiniteActive ? 100 : Math.max(0, parseInt(START_BOMBS, 10) || 0);
  _syncBombHud();

  health = 1.0;

  // Spawn player mid-screen, above hearts HUD
  player.x = canvas.width / 2;
  player.y = getPlayerAlignedY();
  bonusArmor = 0;
  bonusArmorBrokenT = 0;
  isDead = false;
  deathTimer = 0;
  deathGameOver = false;
  deathYellPlayed = false;
  deathParticles.length = 0;
  playerGhosts.length = 0;
  playerGhostSpawnT = 0;
  playerTurnT = 1;

  const frozenStaringContest = isGameSpeedFrozen();

  // Speed 0 is an intentional static tableau: Wave 1 player vs one enemy, no progress.
  wave = frozenStaringContest ? 1 : START_WAVE;
  if (frozenStaringContest){
    waveBanner.t = 0;
    waveBanner.text = "";
  } else {
    showWaveBanner(wave);
  }

  bullets.length = 0;
  enemyBullets.length = 0;
  fireCooldown = 0;
  bomb = null;
  ufo = null;

  resetFormation();
  updateHearts();
  spawnEnemies();

  if (frozenStaringContest){
    // Position the Wave 1 enemy immediately so speed 0 makes the cut on the first drawn frame.
    positionFrozenStaringContestEnemies();

    // Keep the scene absolutely inert: one Wave 1 enemy, optional frozen UFO, no music start trigger.
    // Force-spawn the UFO so speed 0 can become a static staring contest bonus tableau.
    trySpawnUFO(true);
    pendingWaveStartMusic = false;
    stopMusic();
    runTimer = 0;
    document.body.classList.remove("speedZeroTimeTravel");
    if (timerHud) timerHud.style.display = "none";
  } else {
    trySpawnUFO();
    // Only begin the level music after Wave 1 gameplay has actually spawned.
    pendingWaveStartMusic = true;
  }

  clearControllerFocus();
  syncSpeedZeroStaticImages();
  window.focus();
}










if (speedSlider){
  speedSlider.addEventListener("input", markOptionsDirty);
  speedSlider.addEventListener("change", markOptionsDirty);
}










if (typeof livesSlider !== "undefined" && livesSlider){
  livesSlider.addEventListener("input", markCheatsDirty);
  livesSlider.addEventListener("change", markCheatsDirty);
}


if (typeof heartsSlider !== "undefined" && heartsSlider){
  heartsSlider.addEventListener("input", markCheatsDirty);
  heartsSlider.addEventListener("change", markCheatsDirty);
}


if (typeof shieldsSlider !== "undefined" && shieldsSlider){
  shieldsSlider.addEventListener("input", markCheatsDirty);
  shieldsSlider.addEventListener("change", markCheatsDirty);
}


if (typeof bombsSlider !== "undefined" && bombsSlider){
  bombsSlider.addEventListener("input", markCheatsDirty);
  bombsSlider.addEventListener("change", markCheatsDirty);
}


if (typeof startWaveSelect !== "undefined" && startWaveSelect){
  startWaveSelect.addEventListener("input", markCheatsDirty);
  startWaveSelect.addEventListener("change", markCheatsDirty);
}







if (titleHoverReveal){
  titleHoverReveal.addEventListener("click", refreshEntireShooterPage);
  titleHoverReveal.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " "){
      event.preventDefault();
      refreshEntireShooterPage();
    }
  });
}

if (btnMysteryLink){
  btnMysteryLink.addEventListener("click", (event) => {
    event.preventDefault();
    try{
      window.top.location.href = "https://honestlythomas.com";
    }catch(e){
      window.location.href = "https://honestlythomas.com";
    }
  });
}

if (backgroundColorHex){
  backgroundColorHex.addEventListener("input", () => {
    const normalized = normalizeHexColor(backgroundColorHex.value);
    if (normalized && backgroundColorPicker) backgroundColorPicker.value = normalized;
  });
  backgroundColorHex.addEventListener("change", () => {
    applyBackgroundColorFromControls(backgroundColorHex.value);
  });
  backgroundColorHex.addEventListener("keydown", (event) => {
    if (event.key === "Enter"){
      event.preventDefault();
      applyBackgroundColorFromControls(backgroundColorHex.value);
      try{ backgroundColorHex.blur(); }catch(e){}
    }
  });
}
if (backgroundColorPicker){
  backgroundColorPicker.addEventListener("input", () => {
    applyBackgroundColorFromControls(backgroundColorPicker.value);
  });
  backgroundColorPicker.addEventListener("change", () => {
    applyBackgroundColorFromControls(backgroundColorPicker.value);
  });
}

if (btnStats) btnStats.addEventListener("click", openStatsPanel);
if (btnStatsClose) btnStatsClose.addEventListener("click", closeStatsPanel);
if (btnStatsReset){
  btnStatsReset.addEventListener("click", () => {
    resetLifetimeStats();
  });
}
if (statsPanel){
  statsPanel.addEventListener("click", (event) => {
    if (event.target === statsPanel) closeStatsPanel();
  });
}

btnStart.addEventListener("click", startGame);
btnOptions.addEventListener("click", showOptions);
if (btnControls) btnControls.addEventListener("click", showControlsMenu);
if (btnFullscreenOption) btnFullscreenOption.addEventListener("click", toggleFullscreen);
if (btnCheats) btnCheats.addEventListener("click", showCheats);
function applyCheatsChanges(){
  applyStartSettingsFromControls();
  syncStartOptionsLabels();
  syncCheatsMenuState();
  markCheatsClean(true);
}

if (btnCheatsBack) btnCheatsBack.addEventListener("click", hideCheats);
if (btnCheatsApply) btnCheatsApply.addEventListener("click", () => { if (cheatsHavePendingChanges) applyCheatsChanges(); });
btnBack.addEventListener("click", showMenu);
function applyStartSettingsFromControls(){
  const livesOpt = parseResourceOption(livesSlider, 0);
  const heartsOpt = parseResourceOption(heartsSlider, 1);
  const shieldsOpt = parseResourceOption(shieldsSlider, 0);
  const bombsOpt = parseResourceOption(bombsSlider, 0);
  START_LIVES = livesOpt.value;
  START_HEARTS = heartsOpt.value;
  START_SHIELDS = shieldsOpt.value;
  START_BOMBS = bombsOpt.value;
  START_LIVES_INFINITE = livesOpt.infinite;
  START_HEARTS_INFINITE = heartsOpt.infinite;
  START_SHIELDS_INFINITE = shieldsOpt.infinite;
  START_BOMBS_INFINITE = bombsOpt.infinite;
  START_WAVE = startWaveSelect ? (parseInt(startWaveSelect.value, 10) || 1) : 1;
}

function applyOptionsChanges(){
  applyGameSpeedValue(getSpeedValueFromSlider(), false);
  syncStartOptionsLabels();
  markOptionsClean(true);
}

btnApply.addEventListener("click", () => {
  if (optionsHavePendingChanges) applyOptionsChanges();
});

btnRestart.addEventListener("click", () => {
  restartRun();
});


if (btnDeathQuitToMenu){
  btnDeathQuitToMenu.addEventListener("click", quitDeathToMenu);
}

if (btnRestart){
}


if (btnContinue){
  btnContinue.addEventListener("click", () => {
    if (window.parent && window.parent !== window){
      try{
        if (requestContinueToLevel2()) return;
      }catch(err){
        console.warn("Failed to notify parent iframe host about level transition.", err);
      }
    }

    if (winOverlay) winOverlay.style.display = "none";
  });
}

if (btnSkipToLevel2){
  btnSkipToLevel2.addEventListener("click", () => {
    if (window.parent && window.parent !== window){
      try{
        if (requestContinueToLevel2()) return;
      }catch(err){
        console.warn("Failed to notify parent iframe host about level transition.", err);
      }
    }

window.location.href = "/games/shooter-game/assets/levels/shooter-game-level2.html?autostart=1&startWave=1";
  });
}


function requestContinueToLevel2(){
  if (!window.parent || window.parent === window) return false;
  window.parent.postMessage({ type: "tektite:continue-to-level2" }, "*");
  return true;
}

function setAssetStatus(msg){
  if (!assetStatus) return;
  assetStatus.textContent = msg || "";
  assetStatus.style.display = msg ? "block" : "none";
}

/* =======================
   Player (v1.96 bigger)
======================= */
// Keep the player GIF alive as an attached DOM image so canvas draws the current animated frame.
// Canvas is a joyless little photocopier unless the browser sees the GIF actually living in the DOM.
const playerImg = (() => {
  const img = document.createElement("img");
  img.decoding = "async";
  img.loading = "eager";
  img.alt = "";
  img.style.cssText = "width:1px;height:1px;position:fixed;left:-99999px;top:-99999px;opacity:0;pointer-events:none;";
  img.src = PLAYER_IMG_URL;

  const attach = () => {
    if (!img.parentNode && document.body) document.body.appendChild(img);
  };
  if (document.body) attach();
  else document.addEventListener("DOMContentLoaded", attach, { once:true });

  return img;
})();

// Active player sprite freeze (v2.03): keep menu/lives/enemy animation behavior intact,
// but render the gameplay player from a one-time canvas snapshot so animated banana assets
// do not keep animating while the player is alive. Browser animation rules: still a circus.
let staticPlayerFrameCanvas = null;
let staticPlayerFrameSource = "";

function getStaticPlayerFrame(){
  if (!playerImg || !playerImg.complete || !playerImg.naturalWidth || !playerImg.naturalHeight) return playerImg;
  if (staticPlayerFrameCanvas && staticPlayerFrameSource === playerImg.currentSrc) return staticPlayerFrameCanvas;

  const frozen = document.createElement("canvas");
  frozen.width = playerImg.naturalWidth;
  frozen.height = playerImg.naturalHeight;
  const frozenCtx = frozen.getContext("2d");
  if (!frozenCtx) return playerImg;

  frozenCtx.drawImage(playerImg, 0, 0, frozen.width, frozen.height);
  staticPlayerFrameCanvas = frozen;
  staticPlayerFrameSource = playerImg.currentSrc;
  return staticPlayerFrameCanvas;
}

function drawStaticPlayerSprite(alpha = 1, xOff = 0, yOff = 0, extraWidthScale = 1, extraScaleY = 1){
  const source = getStaticPlayerFrame();
  if (!source) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(player.x + xOff, player.y + yOff);

  // Fake 2.5D turn by squeezing through a narrow midpoint during left/right flips.
  const turnEase = Math.sin(Math.min(1, Math.max(0, playerTurnT)) * Math.PI);
  const widthScale = (1 - turnEase * 0.82) * extraWidthScale;
  const facingScale = playerFacing >= 0 ? -1 : 1; // right = flipped horizontally

  ctx.scale(facingScale * Math.max(0.12, widthScale), extraScaleY);
  ctx.drawImage(source, -player.w/2, -player.h/2, player.w, player.h);
  ctx.restore();
}

function redrawPlayerSpriteAfterVideoFx(){
  if (gameState !== STATE.PLAYING) return;
  if (isDead || gameWon) return;
  const flicker = player.invuln > 0 && Math.floor(time * 20) % 2 === 0;
  if (flicker) return;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  drawStaticPlayerSprite();
  ctx.restore();
}

function drawPlayerGhosts(){
  if (!playerGhosts.length) return;
  for (const g of playerGhosts){
    const t = Math.max(0, g.life / g.ttl);
    drawStaticPlayerSprite(0.12 * t, g.xOff, g.yOff, g.widthScale, g.scaleY);
  }
}

// Animated GIF sprites are rendered as real DOM <img> elements positioned over the canvas.
// drawImage() can freeze animated GIFs on a single frame in Chromium, because naturally the browser chose drama.
const USE_DOM_ANIMATED_GIF_SPRITES = true;
const animatedGifSpriteLayer = (() => {
  let layer = document.getElementById("animatedGifSpriteLayer");
  if (!layer){
    layer = document.createElement("div");
    layer.id = "animatedGifSpriteLayer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "width:100vw",
      "height:100vh",
      "pointer-events:none",
      "overflow:hidden",
      "z-index:12"
    ].join(";");
    const attach = () => { if (!layer.parentNode && document.body) document.body.appendChild(layer); };
    if (document.body) attach();
    else document.addEventListener("DOMContentLoaded", attach, { once:true });
  }
  return layer;
})();

const animatedGifSpriteMap = new WeakMap();
const animatedGifSprites = new Set();
let animatedGifSpritesActiveThisFrame = new Set();

function beginAnimatedGifSpriteFrame(){
  animatedGifSpritesActiveThisFrame = new Set();
}

function getAnimatedGifSprite(owner, img, className){
  if (!owner || !img || !img.src || !USE_DOM_ANIMATED_GIF_SPRITES) return null;
  let sprite = animatedGifSpriteMap.get(owner);
  if (!sprite){
    sprite = document.createElement("img");
    sprite.decoding = "async";
    sprite.loading = "eager";
    sprite.alt = "";
    sprite.className = "animated-gif-sprite " + (className || "");
    sprite.draggable = false;
    sprite.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "pointer-events:none",
      "user-select:none",
      "image-rendering:auto",
      "transform-origin:center center",
      "will-change:transform,width,height,opacity,filter"
    ].join(";");
    animatedGifSpriteMap.set(owner, sprite);
    animatedGifSprites.add(sprite);
    animatedGifSpriteLayer.appendChild(sprite);
  }
  const shouldFreezeSprite = isGameSpeedFrozen() && className && String(className).includes("enemy");
  if (shouldFreezeSprite){
    const frozenUrl = getFrozenStaticImageUrlFromImage(img);
    if (frozenUrl && sprite.src !== frozenUrl) sprite.src = frozenUrl;
  } else if (sprite.src !== img.src) {
    sprite.src = img.src;
  }
  return sprite;
}

function syncAnimatedGifSprite(owner, img, x, y, w, h, opts = {}){
  const sprite = getAnimatedGifSprite(owner, img, opts.className);
  if (!sprite) return false;
  const alpha = Number.isFinite(opts.alpha) ? Math.max(0, Math.min(1, opts.alpha)) : 1;
  const hidden = !!opts.hidden || alpha <= 0;
  sprite.style.display = hidden ? "none" : "block";
  if (!hidden){
    sprite.style.width = Math.max(1, w) + "px";
    sprite.style.height = Math.max(1, h) + "px";
    sprite.style.opacity = String(alpha);
    sprite.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;

    const filters = [];
    const allowVideoFx = opts.videoFx !== false;
    if (VIDEO_FX_ENABLED && allowVideoFx){
      const beat = Math.max(0, Math.min(1, beatLevel || 0));
      const hue = (time * 10 + beat * 55) % 360;
      const glow = 1.05 + beat * 0.18;
      filters.push(`hue-rotate(${hue}deg)`, `saturate(${1.28 + beat * 0.25})`, `contrast(${glow})`, `drop-shadow(0 0 ${Math.round(4 + beat * 8)}px rgba(0,255,102,0.32))`);
    }
    if (opts.hitFlash){
      filters.push("brightness(1.7)", "sepia(1)", "saturate(5)", "hue-rotate(300deg)");
    }
    sprite.style.filter = filters.length ? filters.join(" ") : "none";
  }
  animatedGifSpritesActiveThisFrame.add(sprite);
  return true;
}

function endAnimatedGifSpriteFrame(){
  for (const sprite of animatedGifSprites){
    if (!animatedGifSpritesActiveThisFrame.has(sprite)) sprite.style.display = "none";
  }
}

// v1.96 sizing + anchoring
const PLAYER_SIZE = 72;                 // was 48
const PLAYER_BOTTOM_MARGIN = 100;
const PLAYER_SPAWN_Y_FACTOR = 0.95; // middle-ish, above hearts HUD       // gives breathing room vs browser UI
const FORMATION_PLAYER_GAP = 160;       // v1.96: no longer enforced (kept for tuning/experiments)

const player = {
  x: 0,
  y: 0,
  w: PLAYER_SIZE,
  h: PLAYER_SIZE,
  speed: 6,
  invuln: 0
};

// v2.07: Level 1 player turn + ghost trail.
// Level 1 only moves left/right, so this intentionally ignores vertical movement.
let playerFacing = -1; // -1 = facing left/default, 1 = facing right
let playerTurnT = 1;   // 0..1 progress through the current turn
const PLAYER_TURN_DUR = 0.16;

const playerGhosts = [];
let playerGhostSpawnT = 0;
const PLAYER_GHOST_MAX = 2;
const PLAYER_GHOST_SPAWN_EVERY = 0.072;
const PLAYER_GHOST_TTL = 0.18;

function spawnPlayerGhost(moveX){
  if (Math.abs(moveX || 0) < 0.08) return;
  const nx = moveX > 0 ? 1 : -1;
  const behindDist = rand(player.w * 0.62, player.w * 1.02);

  playerGhosts.push({
    xOff: -nx * behindDist,
    yOff: rand(-player.h * 0.035, player.h * 0.035),
    vxPull: nx,
    ttl: PLAYER_GHOST_TTL,
    life: PLAYER_GHOST_TTL,
    scaleY: rand(0.97, 1.03),
    widthScale: rand(0.88, 0.97)
  });

  while (playerGhosts.length > PLAYER_GHOST_MAX) playerGhosts.shift();
}

function updatePlayerGhosts(dt){
  for (let i = playerGhosts.length - 1; i >= 0; i--){
    const g = playerGhosts[i];
    g.life -= dt;
    const pull = Math.min(1, dt * 8.0);

    g.xOff += (0 - g.xOff) * pull;
    g.yOff += (0 - g.yOff) * pull;
    g.widthScale += (1 - g.widthScale) * Math.min(1, dt * 4.2);
    g.scaleY += (1 - g.scaleY) * Math.min(1, dt * 4.0);

    if (g.life <= 0) playerGhosts.splice(i, 1);
  }
}

const keys = {};
let fireCooldown = 0;
/* =======================
   Gamepad (Xbox Controller) Support (v1.96)
   - Uses the standard Gamepad API (works in modern Chromium/Firefox).
   - Mappings (Xbox layout):
     * Move: Left Stick X / D-Pad Left-Right
     * Aim:  Right Stick (360°)
     * Shoot: RT (hold) or A (hold)
     * Bomb:  X (press) or RB (press)
     * Shield: LB (hold) or LT (hold)
     * Pause: START (press)
     * HUD toggle: BACK/VIEW (press)
     * Fullscreen: Right Stick Click (press)
     * Menus:
        - Main Menu: A = Start, Y = Options
        - Options: A = Apply, B = Back
        - Death Screen: A = Restart
======================= */
let gpIndex = 0;
let gpPrev = null; // previous button pressed states
let gpMoveX = 0;
let gpMoveY = 0;
let gpAimX = 0;
let gpAimY = 0;
let gpFireHeld = false;
let gpShieldHeld = false;
let gpSpeedBoostHeld = false;
let gpHasAnyInput = false;
let gpIsConnected = false;

const GP_DEADZONE = 0.18;
const GP_AIM_DEADZONE = 0.22;
const GP_TRIGGER_DEADZONE = 0.35;

function gpDead(v, dz){ return (Math.abs(v) < dz) ? 0 : v; }

function getGamepad(){
  const pads = (navigator.getGamepads && navigator.getGamepads()) ? navigator.getGamepads() : [];
  if (!pads || !pads.length) return null;
  // Prefer last known index, otherwise first non-null.
  if (pads[gpIndex]) return pads[gpIndex];
  for (let i = 0; i < pads.length; i++){
    if (pads[i]){ gpIndex = i; return pads[i]; }
  }
  return null;
}

function gpBtn(gp, i){
  if (!gp || !gp.buttons || !gp.buttons[i]) return { pressed:false, value:0 };
  const b = gp.buttons[i];
  return { pressed: !!b.pressed, value: (typeof b.value === "number" ? b.value : (b.pressed ? 1 : 0)) };
}

function gpEdge(i, nowPressed){
  // true on rising edge
  const was = gpPrev ? !!gpPrev[i] : false;
  return (!!nowPressed && !was);
}

function consumeMenuAxis(direction, active, dt, repeatDelay = GP_MENU_REPEAT_DELAY, repeatRate = GP_MENU_REPEAT_RATE){
  const repeatKey = direction;
  if (!active){
    gpNavRepeat[repeatKey] = 0;
    return false;
  }
  if (gpNavRepeat[repeatKey] <= 0){
    gpNavRepeat[repeatKey] = repeatDelay;
    return true;
  }
  gpNavRepeat[repeatKey] -= dt;
  if (gpNavRepeat[repeatKey] <= 0){
    gpNavRepeat[repeatKey] = repeatRate;
    return true;
  }
  return false;
}

function pollGamepad(dt){
  const gp = getGamepad();
  gpIsConnected = !!gp;
  gpHasAnyInput = false;

  gpMoveX = 0;
  gpMoveY = 0;
  gpAimX = 0;
  gpAimY = 0;
  gpFireHeld = false;
  gpShieldHeld = false;
  gpSpeedBoostHeld = false;

  if (!gp){
    gpPrev = null;
    gpNavRepeat.up = gpNavRepeat.down = gpNavRepeat.left = gpNavRepeat.right = 0;
    gpNavPrevAxis.horizontal = 0;
    gpNavPrevAxis.vertical = 0;
    return;
  }

  if (!gpPrev || gpPrev.length !== gp.buttons.length){
    gpPrev = new Array(gp.buttons.length).fill(false);
  }

  const ax0 = gp.axes && gp.axes.length > 0 ? gp.axes[0] : 0;
  const ax1 = gp.axes && gp.axes.length > 1 ? gp.axes[1] : 0;
  const ax2 = gp.axes && gp.axes.length > 2 ? gp.axes[2] : 0;
  const ax3 = gp.axes && gp.axes.length > 3 ? gp.axes[3] : 0;

  const lx = gpDead(ax0, GP_DEADZONE);
  const ly = gpDead(ax1, GP_DEADZONE);
  const rx = gpDead(ax2, GP_AIM_DEADZONE);
  const ry = gpDead(ax3, GP_AIM_DEADZONE);

  const dUp = getGpActionPressed(gp, 'moveUp');
  const dDown = getGpActionPressed(gp, 'moveDown');
  const dLeft = getGpActionPressed(gp, 'moveLeft');
  const dRight = getGpActionPressed(gp, 'moveRight');

  gpMoveX = Math.max(-1, Math.min(1, lx + (dLeft ? -1 : 0) + (dRight ? 1 : 0)));
  gpMoveY = Math.max(-1, Math.min(1, ly + (dUp ? -1 : 0) + (dDown ? 1 : 0)));
  gpAimX = rx;
  gpAimY = ry;

  const lt = gpBtn(gp, 6).value;
  const rt = gpBtn(gp, 7).value;
  const a = gpBtn(gp, 0).pressed;
  const b = gpBtn(gp, 1).pressed;
  const x = gpBtn(gp, 2).pressed;
  const y = gpBtn(gp, 3).pressed;
  const lb = gpBtn(gp, 4).pressed;
  const rb = gpBtn(gp, 5).pressed;
  const back = gpBtn(gp, 8).pressed;
  const start = gpBtn(gp, 9).pressed;
  const lStick = gpBtn(gp, 10).pressed;
  const rStick = gpBtn(gp, 11).pressed;

  gpFireHeld = getGpActionPressed(gp, 'shoot');
  gpShieldHeld = getGpActionPressed(gp, 'shield');
  gpSpeedBoostHeld = lStick;

  if (Math.abs(lx) > 0.01 || Math.abs(ly) > 0.01 || Math.abs(rx) > 0.01 || Math.abs(ry) > 0.01 || lt > 0.05 || rt > 0.05 || dUp || dDown || dLeft || dRight || a || b || x || y || lb || rb || back || start || lStick || rStick){
    gpHasAnyInput = true;
    setActiveInputMode(INPUT_MODE_CONTROLLER);
  }

  const pressPause = gpEdge(controllerBindings.pause, getGpActionPressed(gp, 'pause'));
  const pressCommands = gpEdge(controllerBindings.commands, getGpActionPressed(gp, 'commands'));
  const pressMenuBack = gpEdge(controllerBindings.menuBack, getGpActionPressed(gp, 'menuBack'));
  const pressMenuSelect = gpEdge(controllerBindings.menuSelect, getGpActionPressed(gp, 'menuSelect'));
  const pressFullscreen = gpEdge(controllerBindings.fullscreen, getGpActionPressed(gp, 'fullscreen'));
  const pressBomb = gpEdge(controllerBindings.bomb, getGpActionPressed(gp, 'bomb'));
  const pressMuteHud = false;
  const pressY = gpEdge(3, y);

  if ((gpHasAnyInput || pressMenuSelect || pressMenuBack || pressCommands || pressY || pressPause || pressFullscreen || pressBomb) && !audioUnlocked){
    unlockAudioOnce();
  }

  const navUp = consumeMenuAxis('up', dUp || ly < -GP_MENU_AXIS_THRESHOLD, dt);
  const navDown = consumeMenuAxis('down', dDown || ly > GP_MENU_AXIS_THRESHOLD, dt);
  const navLeft = consumeMenuAxis('left', dLeft || lx < -GP_MENU_AXIS_THRESHOLD, dt);
  const navRight = consumeMenuAxis('right', dRight || lx > GP_MENU_AXIS_THRESHOLD, dt);

  if (deathOverlay && deathOverlay.style.display === "flex"){
    if (navUp) moveDeathControllerFocus(-1);
    if (navDown) moveDeathControllerFocus(1);
    if (pressMenuSelect) activateDeathControllerFocus();
    // B/back intentionally does nothing on the death screen to avoid accidental menu quits.
    return;
  }

  // Options menu: right stick changes number values without dragging focus around like a caffeinated raccoon.
  const rNavUp = consumeMenuAxis('rUp', ry < -GP_MENU_AXIS_THRESHOLD, dt, GP_OPTION_REPEAT_DELAY, GP_OPTION_REPEAT_RATE);
  const rNavDown = consumeMenuAxis('rDown', ry > GP_MENU_AXIS_THRESHOLD, dt, GP_OPTION_REPEAT_DELAY, GP_OPTION_REPEAT_RATE);

  if (bindingEditState && bindingEditState.scheme === INPUT_MODE_CONTROLLER){
    const anyPressedNow = gp.buttons.some((btn, idx) => idx <= 15 && getGpButtonPressedByIndex(gp, idx));
    if (!controllerRebindReady){
      if (!anyPressedNow) controllerRebindReady = true;
    } else {
      for (let idx = 0; idx < gp.buttons.length && idx <= 15; idx++){
        if (getGpButtonPressedByIndex(gp, idx)){
          applyBindingValue(INPUT_MODE_CONTROLLER, bindingEditState.action, idx);
          break;
        }
      }
    }
  } else {
    if (pressFullscreen){
      toggleFullscreen();
    }
    if (pressCommands){
      requestOpenChat(false);
      clearControllerFocus();
    }
    const chatOwnsControllerInput = parentChatVisible || pressCommands;
    if (chatOwnsControllerInput){
      if (parentChatVisible){
        if (navUp) postChatControllerAction('cycleUp');
        if (navDown) postChatControllerAction('cycleDown');
        if (navLeft) postChatControllerAction('cycleLeft');
        if (navRight) postChatControllerAction('cycleRight');
        if (pressMenuSelect) postChatControllerAction('execute');
        if (pressMenuBack){
          postChatControllerAction('close');
        }
      }
    } else if (isPaused){
      if (isScoreStoreOpen){
        if (navUp || navLeft) moveScoreStoreControllerFocus(-1);
        if (navDown || navRight) moveScoreStoreControllerFocus(1);
        if (pressMenuSelect) activateControllerTarget(getScoreStoreControllerTargets()[scoreStoreFocusIndex]);
        if (pressMenuBack) closeScoreStoreMenu();
        if (pressPause) togglePause();
      } else if (pauseControlsOpen){
        if (navUp || navLeft) moveControlsControllerFocus(-1);
        if (navDown || navRight) moveControlsControllerFocus(1);
        if (pressMenuSelect) activateControllerTarget(getControlsControllerTargets()[controlsFocusIndex]);
        if (pressMenuBack){
          if (bindingEditState) cancelBindingEdit();
          else hidePauseControlsMenu();
        }
        if (pressPause) togglePause();
      } else {
        const pauseTargets = getPauseControllerTargets();
        const pauseTarget = pauseTargets[pauseFocusIndex];
        const helpRowFocused = !!(pauseTarget && pauseTarget.dataset && pauseTarget.dataset.cmd);
        if (helpRowFocused){
          if (navLeft && typeof updatePauseHelpCommandNode === "function") updatePauseHelpCommandNode(pauseTarget, -1);
          if (navRight && typeof updatePauseHelpCommandNode === "function") updatePauseHelpCommandNode(pauseTarget, 1);
          if (navUp) movePauseControllerFocus(-1);
          if (navDown) movePauseControllerFocus(1);
        } else {
          if (navUp || navLeft) movePauseControllerFocus(-1);
          if (navDown || navRight) movePauseControllerFocus(1);
        }
        if (pressMenuSelect) activateControllerTarget(getPauseControllerTargets()[pauseFocusIndex]);
        if (pressMenuBack) togglePause();
        if (pressPause) togglePause();
      }
    } else if (gameState === STATE.MENU){
      if (navLeft){
        if (!isTitleHoverRevealFocused()){
          if (menuFocusIndex === 3) menuFocusIndex = 2;
          else if (menuFocusIndex === 2) menuFocusIndex = 1;
        }
        if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
        else clearControllerFocus();
      }
      if (navRight){
        if (!isTitleHoverRevealFocused()){
          if (menuFocusIndex === 1) menuFocusIndex = 2;
          else if (menuFocusIndex === 2) menuFocusIndex = 3;
        }
        if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
        else clearControllerFocus();
      }
      if (navDown){
        if (menuFocusIndex === 0) menuFocusIndex = 1;
        else if (menuFocusIndex === 1) menuFocusIndex = 2;
        else if (menuFocusIndex === 2 || menuFocusIndex === 3) menuFocusIndex = 4;
        else menuFocusIndex = 0;
        if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
        else clearControllerFocus();
      }
      if (navUp){
        if (menuFocusIndex === 2 || menuFocusIndex === 3) menuFocusIndex = 1;
        else if (menuFocusIndex === 1) menuFocusIndex = 0;
        else if (menuFocusIndex === 0) menuFocusIndex = 4;
        else menuFocusIndex = 2;
        if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
        else clearControllerFocus();
      }
      const menuTarget = getMenuControllerTargets()[menuFocusIndex];
      if (pressMenuSelect && menuTarget){
        if (menuTarget === titleHoverReveal) refreshEntireShooterPage();
        else if (menuTarget !== startMenuTitle) activateControllerTarget(menuTarget);
      }
      if (pressMenuBack && bindingEditState) cancelBindingEdit();
      if (pressY) showOptions();
    } else if (gameState === STATE.OPTIONS){
      if (navUp) moveOptionsControllerFocus(-1);
      if (navDown){
        if (!wrapOptionsBottomButtonsToTop()) moveOptionsControllerFocus(1);
      }
      if (typeof isStartingStatFocused === "function" && isStartingStatFocused()){
        if (navLeft) moveStartingStatFocus(-1);
        if (navRight) moveStartingStatFocus(1);
        if (rNavUp) adjustControllerOption(1);
        if (rNavDown) adjustControllerOption(-1);
      } else {
        if (navLeft && !moveOptionsBottomButtonsHorizontally(-1)) adjustControllerOption(-1);
        if (navRight && !moveOptionsBottomButtonsHorizontally(1)) adjustControllerOption(1);
        if (rNavUp) adjustControllerOption(1);
        if (rNavDown) adjustControllerOption(-1);
      }
      if (pressMenuSelect) activateControllerTarget(getOptionsControllerTargets()[optionsFocusIndex]);
      if (pressMenuBack) showMenu();
    } else if (gameState === STATE.CHEATS){
      if (navUp) moveCheatsControllerFocus(-1);
      if (navDown) moveCheatsControllerFocus(1);
      if (typeof isStartingStatFocused === "function" && isStartingStatFocused()){
        if (navLeft) moveStartingStatFocus(-1);
        if (navRight) moveStartingStatFocus(1);
        if (rNavUp) adjustControllerCheat(1);
        if (rNavDown) adjustControllerCheat(-1);
      } else {
        if (navLeft) adjustControllerCheat(-1);
        if (navRight) adjustControllerCheat(1);
        if (rNavUp) adjustControllerCheat(1);
        if (rNavDown) adjustControllerCheat(-1);
      }
      if (pressMenuSelect) activateControllerTarget(getCheatsControllerTargets()[cheatsFocusIndex]);
      if (pressMenuBack) hideCheats();
    } else if (gameState === STATE.CONTROLS){
      if (navUp) moveControlsControllerFocus(-1);
      if (navDown) moveControlsControllerFocus(1);
      if (isControlsMoveFocused()){
        if (navLeft) moveControlsMoveFocus(-1);
        if (navRight) moveControlsMoveFocus(1);
      } else {
        if (navLeft) moveControlsControllerFocus(-1);
        if (navRight) moveControlsControllerFocus(1);
      }
      if (pressMenuSelect) activateControllerTarget(getControlsControllerTargets()[controlsFocusIndex]);
      if (pressMenuBack){
        if (bindingEditState) cancelBindingEdit();
        else hideControlsMenu();
      }
    } else if (gameState === STATE.WIN){
      if (activeInputMode === INPUT_MODE_CONTROLLER) syncWinControllerFocus();
      if (pressMenuSelect) activateControllerTarget(getWinControllerTargets()[0]);
      if (pressMenuBack) activateControllerTarget(getWinControllerTargets()[0]);
    } else if (deathOverlay && deathOverlay.style.display === "flex"){
      if (pressMenuSelect) restartRun();
    } else if (gameState === STATE.PLAYING){
      if (pressPause) togglePause();
      if (!isGameSpeedFrozen() && !playerSpectatorMode && pressBomb) dropBomb();
    }
  }

  for (let i = 0; i < gp.buttons.length; i++){
    gpPrev[i] = !!(gp.buttons[i] && gp.buttons[i].pressed);
  }
}

window.addEventListener("gamepadconnected", (e) => {
  try{
    gpIndex = e.gamepad && typeof e.gamepad.index === "number" ? e.gamepad.index : gpIndex;
  }catch(_){}
});

/* =======================
   Aim (v1.96: 360° aim)
   - Mouse / touch sets an aim point.
   - We smooth the aim angle so the triangle feels less twitchy.
======================= */
let aimX = 0;
let aimY = 0;
let aimAngle = -Math.PI/2;
let aimAngleSmoothed = -Math.PI/2;

function setAimFromClient(clientX, clientY){
  const r = canvas.getBoundingClientRect();
  aimX = clientX - r.left;
  aimY = clientY - r.top;
  aimAngle = Math.atan2(aimY - player.y, aimX - player.x);
}

/* =======================
   Enemy Images from enemy-webps.json
======================= */
let enemyImages = [];
let assetsReady = false;

const FALLBACK_URLS = [
  BOSS_IMG_URL
];

function preloadImages(urls){
  return new Promise((resolve) => {
    const imgs = [];
    let done = 0;
    if (!urls.length) resolve(imgs);

    urls.forEach((url) => {
      const img = new Image();
      img.onload = () => { done++; if (done === urls.length) resolve(imgs); };
      img.onerror = () => { done++; if (done === urls.length) resolve(imgs); };
      img.src = url;
      imgs.push(img);
    });
  });
}

async function loadEnemyImagesFromEnemyWebpsJson(){
  try{
    const res = await fetch(ENEMY_WEBP_INDEX_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const list = await res.json();
    if (!Array.isArray(list)) throw new Error("enemy-webps.json not an array");

    const urls = list
      .filter(name => typeof name === "string" && name.toLowerCase().endsWith(".webp"))
      .map(name => name.startsWith("/") ? name : ENEMY_WEBP_BASE + name);

    if (!urls.length) throw new Error("No webps in enemy-webps.json");

    setAssetStatus("");
    let imgs = await preloadImages(urls);
    imgs = imgs.filter(img => img && img.naturalWidth > 0);
    if (!imgs.length) throw new Error("All enemy images failed to load");

    enemyImages = imgs;
    assetsReady = true;
    setAssetStatus("");
  }catch(err){
    console.warn("Failed to load enemy-webps.json enemy list:", err);
    setAssetStatus("Enemy WebPs failed to load. Using fallback enemy image.");
    let imgs = await preloadImages(FALLBACK_URLS);
    enemyImages = imgs.filter(img => img && img.naturalWidth > 0);
    assetsReady = true;
    setAssetStatus("");
  }
}
loadEnemyImagesFromEnemyWebpsJson();

/* =======================
   Enemies + Formation Movement
======================= */
const BASE_SPACING_X = 105;

let enemies = [];

const formation = { xOffset:0, yOffset:0, dir:1, speed:1.2, stepDown:18, descentSpeed:12, boundsPad:40 };

function resetFormation(){
  formation.xOffset = 0;
  formation.yOffset = 0;
  formation.dir = 1;

  // v1.96: challenge/fun rebalance.
  // Horizontal sweep ramps, but capped so it stays readable.
  formation.speed = (0.95 + (wave-1) * 0.09) * FUNK;
  formation.speed = Math.min(2.2, formation.speed);

  // Step-down stays modest (most threat comes from swoops + bullets, not a doom-wall).
  formation.stepDown = 10 + Math.min(10, (wave-1) * 0.75);

  // Gentle downward pressure, capped hard to keep enemies mostly in the top zone.
  formation.descentSpeed = 3.5 + Math.min(10, (wave-1) * 1.25);
}

// v1.96: When an enemy dies, re-pack the remaining enemies into a tidy rectangle
// v1.96: Disabled by default because it turns the game into 'hold fire in one lane to win' mode.
// (no "missing tooth" gaps in the grid).
function compactEnemyGrid(){
  const count = enemies.length;
  if (!count){
    formationCols = 1;
    formationRows = 1;
    return;
  }

  // Mirror the spawn-time packing logic, but WITHOUT nuking the wave.
  const zoneW = canvas.width * 0.82;
  const zoneH = canvas.height * 0.38;

  const idealCols = Math.ceil(Math.sqrt(count * (zoneW / Math.max(1, zoneH))));
  formationCols = Math.max(1, Math.min(count, idealCols));
  formationRows = Math.max(1, Math.ceil(count / formationCols));

  // Re-assign slots in order so the formation closes ranks.
  for (let i = 0; i < enemies.length; i++){
    enemies[i].row = Math.floor(i / formationCols);
    enemies[i].col = i % formationCols;
  }
}


function randEnemyImg(){
  if (!enemyImages.length) return playerImg;
  return enemyImages[Math.floor(Math.random() * enemyImages.length)];
}

function spawnBossWave11(additive=false){
  // additive=true means "spawn the boss group on top of whatever enemies already exist"
  // (used for waves 12+). In that case we must NOT wipe the current wave's enemies or
  // clobber the formation grid settings.
  const prevEnemies = enemies;
  const prevCols = formationCols;
  const prevRows = formationRows;

  if (!additive){
    enemies = [];
    // Boss wave doesn't use the grid for gameplay, but other code expects these.
    formationCols = 1;
    formationRows = 1;
  }

  const baseY = 110; // keep boss in the top zone

  const zoneW = canvas.width * 0.82;
  const zoneH = canvas.height * 0.38;

  // Base "normal enemy" sizing in this zone.
  const baseSize = Math.max(26, Math.min(62, Math.min(zoneW/12, zoneH/7)));

  // Boss: noticeably bigger than everything else (requested).
  const isFirstBoss = !firstBossSpawned;
  const bossSize = isFirstBoss
    ? Math.max(baseSize * 4.0, 130)   // big intro boss
    : Math.max(baseSize * 2.0, 65);   // smaller recurring boss
  firstBossSpawned = true;

  const bossImg = new Image();
  bossImg.src = BOSS_IMG_URL;

  // Shared HP for core + orbiters (requested).
  const BOSS_HP = isFirstBoss
    ? 9   // big first boss = 3x hits
    : 1;  // small recurring bosses = 1 hit

  // Core boss: uses normal enemy damage system, but has more HP.
  const boss = {
    row:0, col:0, baseY,
    img: bossImg,
    isFrog:false,
    size: bossSize,
    hp: BOSS_HP,
    hitFlash:0,
    dying:false,
    fade:1,
    fadeRate:0,
    lockX:0, lockY:0, lockW:0, lockH:0,
    _killAwarded:false,
    x: canvas.width/2, y: baseY + 40, w:0, h:0,
    fx:0, fy:0,
    swoop:null,
    swoopCooldown: 9999,
    // Boss-wave behaviour flags/state
    isBossCore:true,
    bossWave:true,
    // Sporadic movement
    mx: canvas.width/2,
    my: baseY + 40,
    tx: canvas.width/2,
    ty: baseY + 40,
    moveTimer: 0,
    moveSpeed: 220,
    dashChance: 0.22,
    // Orbiting shield ring
    orbitAngle: 0,
    orbitSpeed: 1.7,
    orbitRadius: Math.max(52, bossSize * 0.62),
    shieldsAlive: 4
  };
  enemies.push(boss);
  totalEnemiesSpawned += 1;

  // Shields: 4 copies of the same GIF orbiting around the boss.
  // They do NOT move independently; their x/y is forced each frame.
  const shieldSize = Math.max(baseSize * 1.25, 44);

  for (let i = 0; i < 4; i++){
    const shield = {
      row:0, col:0, baseY,
      img: bossImg,
      isFrog:false,
      size: shieldSize,
      hp: BOSS_HP,
      hitFlash:0,
      dying:false,
      fade:1,
      fadeRate:0,
      lockX:0, lockY:0, lockW:0, lockH:0,
      _killAwarded:false,
      x: boss.x, y: boss.y, w:0, h:0,
      fx:0, fy:0,
      swoop:null,
      swoopCooldown: 9999,
      isBossShield:true,
      bossWave:true,
      bossRef: boss,
      orbitIndex: i,
      // Shield shooting (predictable pattern)
      shootInterval: 1.2,
      shootTimer: i * 0.25
    };
    enemies.push(shield);
    totalEnemiesSpawned += 1;
  }

  // Restore formation settings if we were additive.
  if (additive){
    formationCols = prevCols;
    formationRows = prevRows;
    // ensure we're still writing into the live enemies array reference
    enemies = prevEnemies;
  }
}


function positionFrozenStaringContestEnemies(){
  if (!enemies || !enemies.length) return;

  const breath = 0.5;
  const spacingX = getSpacingX() * (1 + breath * 0.25);
  const spacingY = getSpacingY() * (1 + breath * 0.15);
  const formationWidth = (formationCols - 1) * spacingX;
  const formationHeight = (formationRows - 1) * spacingY;
  const startX = canvas.width / 2 - formationWidth / 2 + formation.xOffset;

  const TOP_SAFE_MARGIN = 60;
  const ENEMY_ZONE_MAX_Y = canvas.height * 0.48;
  let baseY = 80 + formation.yOffset;

  if (baseY < TOP_SAFE_MARGIN) baseY = TOP_SAFE_MARGIN;

  const maxBaseY = ENEMY_ZONE_MAX_Y - formationHeight;
  if (baseY > maxBaseY){
    baseY = Math.max(TOP_SAFE_MARGIN, maxBaseY);
  }

  for (const e of enemies){
    if (!e) continue;
    const size = e.size;
    e.fx = startX + e.col * spacingX;
    e.fy = baseY + e.row * spacingY;
    e.x = e.fx;
    e.y = e.fy;
    e.w = size;
    e.h = size;
    e.swoop = null;
  }
}


function spawnEnemies(){
  // v1.96+: Boss wave / additive boss waves
  if (wave === 11){
    spawnBossWave11(false);
    return;
  }

  enemies = [];
  const baseY = 80; // start higher (top zone)

  // v1.96: Wave sizing
  // Wave 1 spawns 1 enemy, then doubles each wave (2x previous).
  // We cap it to keep browsers from melting into a puddle.
  const MAX_WAVE_ENEMIES = 128;
// v1.96: Balanced wave sizing (requested):
// Wave 1: 1 enemy
// Wave 2: 2 enemies
// Wave 3: 4 enemies
// Wave 4+: add +2 each wave (6, 8, 10, ...)
function getEnemyCountForWave(w){
  if (w === 1) return 1;
  if (w === 2) return 2;
  if (w === 3) return 4;
  return 4 + (w - 3) * 2;
}
const count = Math.min(MAX_WAVE_ENEMIES, getEnemyCountForWave(wave));
  totalEnemiesSpawned += count;

  // v1.96: Dynamically pack the formation into the enemy zone by shrinking spacing + size.
  // Keep the "formation area" mostly in the top half.
  const zoneW = canvas.width * 0.82;
  const zoneH = canvas.height * 0.38;

  // Choose columns/rows to fit the count into the zone with a roughly square-ish grid.
  const idealCols = Math.ceil(Math.sqrt(count * (zoneW / Math.max(1, zoneH))));
  formationCols = Math.max(1, Math.min(count, idealCols));
  formationRows = Math.max(1, Math.ceil(count / formationCols));

  // Compute a size that fits nicely in each cell.
  const cellW = zoneW / formationCols;
  const cellH = zoneH / formationRows;
  const baseSize = Math.max(18, Math.min(56, Math.min(cellW, cellH) * 0.60));

  for (let i = 0; i < count; i++){
    const r = Math.floor(i / formationCols);
    const c = i % formationCols;

    const img = randEnemyImg();
    const isFrog = (img && img.src && img.src.toLowerCase().includes("frog.gif"));

    enemies.push({ row:r, col:c, baseY, img, isFrog, size:baseSize, hp:1, hitFlash:0, dying:false, fade:1, fadeRate:0, lockX:0, lockY:0, lockW:0, lockH:0, _killAwarded:false, x:0,y:0,w:0,h:0,
      fx:0, fy:0, // formation-space position (computed each frame)
      swoop:null, // {t,dur,phase, sx,sy, c1x,c1y, ex,ey}
      swoopCooldown: rand(1.0, 3.0) // seconds until eligible to swoop
    });
  }

  if (wave > 11){ spawnBossWave11(true); }
}

/* =======================
   Bullets
======================= */
const bullets = [];
const enemyBullets = [];

// v1.96 PERF GUARDRAILS:
// When bullet counts explode, the nested bullet-vs-bullet collision check can get expensive.
// Cap counts to keep the game smooth instead of freezing when chaos spikes.
const MAX_PLAYER_BULLETS = 90;
const MAX_ENEMY_BULLETS  = 140;

function shoot(){
  if (isPaused || isGameSpeedFrozen() || playerSpectatorMode) return;
  if (fireCooldown > 0) return;

  // v1.96: fire in the current aim direction (defaults upward if aim is unset)
  const dx = Math.cos(aimAngleSmoothed);
  const dy = Math.sin(aimAngleSmoothed);

  let spawnDist = (player.w * 0.42);


  // v1.96: allow shooting THROUGH the right-click energy shield by spawning bullets


  // just outside the shield ring while it's active.


  if (shieldActive){


    const shieldR = (player.w * SHIELD_RADIUS_MULT);


    spawnDist = Math.max(spawnDist, shieldR + 6);


  }
  // v1.96: cap bullets to prevent performance spikes
  if (bullets.length >= MAX_PLAYER_BULLETS){
    bullets.splice(0, bullets.length - MAX_PLAYER_BULLETS + 1);
  }
  bullets.push({

    x: player.x + dx * spawnDist,
    y: player.y + dy * spawnDist,
    vx: dx * PLAYER_BULLET_SPEED,
    vy: dy * PLAYER_BULLET_SPEED,
    r: 5
  });

  
  shotsFired += 1;
  incrementLifetimeStat("lifetimeBulletsFired", 1);
// v1.96: faster firing as waves increase
  fireCooldown = getPlayerFireCooldown();
}


let enemyShootTimer = 0;
function enemyTryShoot(dt){
  enemyShootTimer -= dt;
  if (enemyShootTimer > 0) return;

  const alive = enemies.length;

  // v1.96: shot pacing is less spammy early, more spicy later.
  // FUNK scales the aggression (1000 = baseline).
  const base = Math.max(
    0.16,
    (0.72 - wave*0.05 - Math.min(0.28, alive*0.0016)) / FUNK
  );

  // Add a tiny bit of variance so it doesn't feel like a metronome.
  enemyShootTimer = base * (0.85 + Math.random()*0.35);

  if (!enemies.length) return;

  // Shoot source selection.
  // Boss wave: shoot from the core so the orbiting shields stay 'shieldy' instead of acting like turrets.
  let e = null;
  if (wave === 11){
    e = enemies.find(x => x && x.isBossCore);
  }
  if (!e){
    // Classic arcade chaos: shoot from a random alive enemy.
    e = enemies[Math.floor(Math.random() * enemies.length)];
  }

  // Straight-line shots, but slightly aimed (vx is constant, so still a straight path).
  const dx = (player.x - e.x);
  const vx = Math.max(-3.2, Math.min(3.2, dx * 0.012)); // gentle lead
  const vy = (5.6 + wave*0.45) * FUNK;

  // v1.96: cap enemy bullets to prevent the counter-shot collision loop from going nuclear
  if (enemyBullets.length >= MAX_ENEMY_BULLETS){
    enemyBullets.splice(0, enemyBullets.length - MAX_ENEMY_BULLETS + 1);
  }
  enemyBullets.push({ x: e.x, y: e.y + e.h/2 + 6, vx, vy, r: 4 });
}


let swoopTimer = 0;

/*
  v1.96: Galaga-like swoop attackers.
  The *formation* is clamped to the top zone.
  Individual enemies can temporarily dive into the player zone ("swoop") and then return.
*/
function tryStartSwoop(dt){
  // tick per-enemy cooldowns
  for (const e of enemies){
    if (e.swoopCooldown > 0) e.swoopCooldown = Math.max(0, e.swoopCooldown - dt);
  }

  swoopTimer -= dt;
  if (swoopTimer > 0) return;

  // How often a swoop starts (faster on higher waves)
  const interval = Math.max(0.7, 2.0 - wave * 0.12);
  swoopTimer = interval;

  // Limit simultaneous swoopers so it stays readable.
  const maxSwoopers = Math.min(4, Math.max(1, Math.floor((1 + (wave-1) / 3) * (0.9 + 0.25*(FUNK-1)))));
  const currentlySwooping = enemies.reduce((n, e) => n + (e.swoop ? 1 : 0), 0);
  if (currentlySwooping >= maxSwoopers) return;

  // Pick an eligible enemy.
  const candidates = enemies.filter(e => !e.swoop && e.swoopCooldown <= 0);
  if (!candidates.length) return;

  const e = candidates[Math.floor(Math.random() * candidates.length)];

  // Start at current formation position (fx/fy computed in update loop).
  const sx = e.fx || e.x;
  const sy = e.fy || e.y;

  // End near player area, but not *below* the player.
  const endY = Math.min(canvas.height * 0.90, player.y - 40);
  const endX = Math.max(40, Math.min(canvas.width - 40, player.x + rand(-140, 140)));

  // Control point makes an arcing dive (sideways + down).
  const c1x = sx + rand(-220, 220);
  const c1y = sy + rand(140, 260);

  // Duration scales with wave (faster dives later).
  const dur = Math.max(1.1, 1.75 - wave * 0.03);

  e.swoop = { t:0, dur, phase:"down", sx, sy, c1x, c1y, ex:endX, ey:endY };
  e.swoopCooldown = Math.max(1.2, 3.0 - wave * 0.10); // wait before it can swoop agai

}


function quadBezier(t, a, b, c){
  // (1-t)^2 a + 2(1-t)t b + t^2 c
  const mt = 1 - t;
  return (mt*mt)*a + (2*mt*t)*b + (t*t)*c;
}


/* =======================
   Collision helpers
======================= */
function circleRect(cx, cy, cr, rx, ry, rw, rh){
  const testX = Math.max(rx, Math.min(cx, rx+rw));
  const testY = Math.max(ry, Math.min(cy, ry+rh));
  const dx = cx - testX;
  const dy = cy - testY;
  return (dx*dx + dy*dy) <= cr*cr;
}

function spawnPlayerDeath(isGameOver){
  // v1.96+: violent pixel-dust death
  playerGhosts.length = 0;
  playerGhostSpawnT = 0;
  isDead = true;
  deathGameOver = !!isGameOver;
  deathTimer = deathGameOver ? 1.2 : 0.85;
  if (deathGameOver){
    triggerGlitchSpiral();
    deathOverlay.style.display = "flex";
    resetDeathQuitConfirm();
    deathFocusIndex = 0;
    syncDeathControllerFocus();
  }

  const n = 160;
  for (let i = 0; i < n; i++){
    const ang = Math.random() * Math.PI * 2;
    const spd = 140 + Math.random() * 520;
    deathParticles.push({
      x: player.x + rand(-player.w*0.15, player.w*0.15),
      y: player.y + rand(-player.h*0.15, player.h*0.15),
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 0.55 + Math.random()*0.55,
      s: 1 + Math.random()*3
    });
  }
}

function damagePlayer(){
  if (playerSpectatorMode || player.invuln > 0 || isDead) return;

  // v1.96: Infinite mode means consequences are cancelled.
  if (infiniteModeActive || heartsInfiniteActive){
    playSfx(sfxHit);
    player.invuln = 0.15;
    return;
  }

  // v1.96: shield pips absorb one hit (before health)
  if (shieldPips > 0 || shieldsInfiniteActive){
    if (!shieldsInfiniteActive) shieldPips = Math.max(0, shieldPips - 1);
    playSfx(sfxHit);
    player.invuln = 0.35;
    return;
  }

  // v1.96: bonus armor absorbs one hit
  if (bonusArmor > 0){
    breakBonusArmor();
    playSfx(sfxHit);
    player.invuln = 0.35;
    return;
  }

  // Each hit drains HIT_DAMAGE health (MAX_HEARTS hearts per life).
  const nextHealth = health - HIT_DAMAGE;
  health = (nextHealth <= 0.000001) ? 0 : Math.max(0, nextHealth);
  player.invuln = 1.00;

  if (health <= 0){
    // Lose a life and explode into pixel dust.
    if (!livesInfiniteActive) lives = Math.max(0, lives - 1);
    const deathIsGameOver = !livesInfiniteActive && lives <= 0;
    if (deathIsGameOver && !deathYellPlayed){
      commitRunLifetimeStats({ died:true });
      playSfxImmediate(sfxOof);
      deathYellPlayed = true;
      setTimeout(() => {
        if (deathYellPlayed) playDeathYell();
      }, 0);
      stopMusic();
    } else {
      playSfx(sfxOof);
    }
    spawnPlayerDeath(deathIsGameOver);
    return;
  }
  playSfx(sfxOof);
}

/* =======================
   Input
======================= */

// Prevent right-click context menu so holding RMB can be used for shield.
window.addEventListener("contextmenu", (e) => {
  if (e.target === canvas) e.preventDefault();
}, { passive:false });


window.addEventListener("keydown", (e) => {
  unlockAudioOnce();
  if (bindingEditState && bindingEditState.scheme === INPUT_MODE_KEYBOARD){
    e.preventDefault();
    e.stopPropagation();
    setActiveInputMode(INPUT_MODE_KEYBOARD);
    applyBindingValue(INPUT_MODE_KEYBOARD, bindingEditState.action, e.code || e.key);
    return;
  }
  if (e.code === "Space") e.preventDefault();
  const target = e.target;
  const typingIntoField = target && ((target.tagName === "INPUT") || (target.tagName === "TEXTAREA") || target.isContentEditable);

  if (deathOverlay && deathOverlay.style.display === "flex" && (e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "Enter" || e.code === "Space" || e.code === "Escape")){
    if (e.code === "ArrowUp") moveDeathControllerFocus(-1);
    else if (e.code === "ArrowDown") moveDeathControllerFocus(1);
    else if (e.code === "Enter" || e.code === "Space") activateDeathControllerFocus();
    else if (e.code === "Escape" && btnDeathQuitToMenu) btnDeathQuitToMenu.click();
    e.preventDefault();
    return;
  }

  // Tab no longer triggers the glitch spiral; prevent browser focus-stealing during gameplay.
  if (e.code === "Tab" && !typingIntoField){ e.preventDefault(); }
  const k = e.key.toLowerCase();
  const code = e.code || e.key;
  setActiveInputMode(INPUT_MODE_KEYBOARD);
  keys[k] = true;
  keys[code] = true;
  if (!typingIntoField && code === keyboardBindings.commands){ e.preventDefault(); requestOpenChat(true); return; }
  if (code === keyboardBindings.mute){ audioMuted = !audioMuted; applyMuteState(); if (!audioMuted) ensureMusicPlaying(); }
  if (code === keyboardBindings.shoot && gameState === STATE.PLAYING) shoot();
  if (code === keyboardBindings.fullscreen) toggleFullscreen();
  if (code === keyboardBindings.bomb && gameState === STATE.PLAYING) dropBomb();
  if (code === keyboardBindings.pause) togglePause();
}, { passive:false });

window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; keys[e.code || e.key] = false; });
window.addEventListener("mousedown", (e) => {
  if (controlsMenu && controlsMenu.style.display !== 'none' && controlsInputLockMode === INPUT_MODE_CONTROLLER) {
    unlockControlsInputMode();
    setActiveInputMode(INPUT_MODE_KEYBOARD, { force:true });
  }
  if (!(bindingEditState && bindingEditState.scheme === INPUT_MODE_KEYBOARD)) return;
  e.preventDefault();
  e.stopPropagation();
  setActiveInputMode(INPUT_MODE_KEYBOARD, { force:true });
  applyBindingValue(INPUT_MODE_KEYBOARD, bindingEditState.action, mouseButtonToBinding(e.button));
}, true);

canvas.addEventListener("pointermove", (e) => {
  setActiveInputMode(INPUT_MODE_KEYBOARD);
  // v1.96: aim follows pointer (mouse or touch)
  setAimFromClient(e.clientX, e.clientY);
});

canvas.addEventListener("pointerdown", (e) => {
  if (controlsMenu && controlsMenu.style.display !== 'none' && controlsInputLockMode === INPUT_MODE_CONTROLLER) {
    unlockControlsInputMode();
    setActiveInputMode(INPUT_MODE_KEYBOARD, { force:true });
  } else {
    setActiveInputMode(INPUT_MODE_KEYBOARD);
  }
  setAimFromClient(e.clientX, e.clientY);
  if (e.button === 2 && keyboardBindings.shield === 'Mouse2'){
    e.preventDefault();
    mouseShieldHolding = true;
    if (canActivateShield()) startShield();
    return;
  }
  if (keyboardBindings.shoot === mouseButtonToBinding(e.button)) mouseFireHolding = true;
  if (gameState === STATE.PLAYING && keyboardBindings.shoot === mouseButtonToBinding(e.button)) shoot();
});

canvas.addEventListener("pointerup", (e) => {
  if (keyboardBindings.shoot === mouseButtonToBinding(e.button)) mouseFireHolding = false;
  // Release RMB shield
  if (e.button === 2){
    mouseShieldHolding = false;
    // v1.96: Releasing it just deactivates; cooldown only happens if it BREAKS.
    if (shieldActive) stopShield(false);
  }
});

/* =======================
   Update + Draw
======================= */
function update(dt){
  // v1.96: gamepad input (Xbox controller) must still work in frozen speed-0 mode
  // so the player can pause and quit the static staring contest.
  pollGamepad(dt);

  // Speed 0 intentionally loads a static Wave 1 tableau:
  // static player, static single enemy, static background, no progress, no win/death.
  if (gameState === STATE.PLAYING && isGameSpeedFrozen()){
    if (!isPaused){
      runTimer = 0;
      if (timerHud && !document.body.classList.contains("speedZeroTimeTravel")){
        timerHud.style.display = "none";
      }
    }
    return;
  }

  time += dt;

  // v1.96: update glitch spiral timer
  if (GLITCH_SPIRAL_T > 0) GLITCH_SPIRAL_T = Math.max(0, GLITCH_SPIRAL_T - dt);

  if (bonusArmorBrokenT > 0) bonusArmorBrokenT = Math.max(0, bonusArmorBrokenT - dt);

  // starfield updates always
  updateStarfield(dt, keys, player.speed);

  // PAUSE_GUARD_v1_51: freeze gameplay updates while paused
  if (gameState === STATE.PLAYING && isPaused) return;

  if (gameState !== STATE.PLAYING) return;

  if (pendingWaveStartMusic){
    const waveIsLive = enemies.length > 0 || (wave === 11 && boss.active);
    if (waveIsLive){
      pendingWaveStartMusic = false;
      if (!audioMuted) ensureMusicPlaying(true);
    }
  }

  // Run timer (seconds since Start Game)
  runTimer += dt;

  // v1.96: shield cooldown + hold logic
  if (shieldCooldown > 0) shieldCooldown = Math.max(0, shieldCooldown - dt);

  if (shieldActive){
    if (shieldHolding){
      shieldHoldGrace = SHIELD_HOLD_GRACE_SECS; // refresh grace while held
    } else {
      shieldHoldGrace = Math.max(0, shieldHoldGrace - dt);
      if (shieldHoldGrace <= 0){
        // v1.96: If RMB isn't held for a bit, drop shield WITHOUT cooldown (HP is saved).
        stopShield(false);
      }
    }
  }

  // v1.96: death particles update + lockout
  if (isDead){
    deathTimer -= dt;

    // update particles
    for (let i = deathParticles.length - 1; i >= 0; i--){
      const p = deathParticles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 520 * dt; // gravity
      if (p.life <= 0) deathParticles.splice(i, 1);
    }

    if (deathTimer <= 0){
      if (deathGameOver){
        // GAME OVER overlay
        deathOverlay.style.display = "flex";
        if (!deathYellPlayed){
          stopMusic();
          playDeathYell();
          deathYellPlayed = true;
        }
      } else {
        // Respawn for next life (keep wave/enemies as-is)
        isDead = false;
        deathGameOver = false;
  deathYellPlayed = false;
        deathParticles.length = 0;
        health = 1.0;

  // Spawn player mid-screen, above hearts HUD
  player.x = canvas.width / 2;
  player.y = getPlayerAlignedY();
        player.invuln = 1.25;
      }
    }
    return; // freeze gameplay while dead
  }

  if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);
  if (fireCooldown > 0) fireCooldown = Math.max(0, fireCooldown - dt);

  if (waveBanner.t > 0) waveBanner.t = Math.max(0, waveBanner.t - dt);

  // player move (keyboard + gamepad)
  let moveX = 0;
  if (isKeyboardActionHeld("moveLeft")) moveX -= 1;
  if (isKeyboardActionHeld("moveRight")) moveX += 1;
  // add analog movement from Xbox pad
  moveX += gpMoveX || 0;
  moveX = Math.max(-1, Math.min(1, moveX));
  if (playerSpectatorMode) moveX = 0;

  // v2.07: left/right flip and ghost trail for Level 1.
  if (moveX > 0.08 && playerFacing !== 1){
    playerFacing = 1;
    playerTurnT = 0;
  } else if (moveX < -0.08 && playerFacing !== -1){
    playerFacing = -1;
    playerTurnT = 0;
  }
  if (playerTurnT < 1){
    playerTurnT = Math.min(1, playerTurnT + dt / PLAYER_TURN_DUR);
  }

  updatePlayerGhosts(dt);
  if (Math.abs(moveX) > 0.08){
    playerGhostSpawnT -= dt;
    if (playerGhostSpawnT <= 0){
      spawnPlayerGhost(moveX);
      playerGhostSpawnT = PLAYER_GHOST_SPAWN_EVERY;
    }
  } else {
    playerGhostSpawnT = 0;
  }

  player.x += moveX * player.speed * (gpSpeedBoostHeld ? 1.75 : 1.0);
  player.x = Math.max(player.w/2, Math.min(canvas.width - player.w/2, player.x));

  // Keep player vertically aligned to the hearts HUD
  player.y = getPlayerAlignedY();


// v1.96: right stick aim (only when the stick is actually being pushed)
const aimMag = Math.hypot(gpAimX || 0, gpAimY || 0);
if (!playerSpectatorMode && aimMag > GP_AIM_DEADZONE){
  const nx = (gpAimX / aimMag);
  const ny = (gpAimY / aimMag);
  // Convert stick direction into an aim point in front of the player.
  aimX = player.x + nx * 220;
  aimY = player.y + ny * 220;
  aimAngle = Math.atan2(aimY - player.y, aimX - player.x);
}

// v1.96: shield (LS click hold) and fire (RT/A hold); LT = speed boost
gamepadShieldHolding = playerSpectatorMode ? false : !!gpShieldHeld;
shieldHolding = playerSpectatorMode ? false : (mouseShieldHolding || gamepadShieldHolding);
if (shieldHolding && canActivateShield()) startShield();
if (playerSpectatorMode) stopShield(false);

if (!playerSpectatorMode && gpFireHeld) shoot();

  
  // v1.96: Held-fire (LMB) should keep shooting even while the shield is held.
  // shoot() already respects cooldown, pause, and state.
  if (gameState === STATE.PLAYING && !isPaused && !playerSpectatorMode && mouseFireHolding){
    shoot();
  }

// v1.96: smooth the aim angle (shortest-path wrap) for nicer feel
  const da = normAngle(aimAngle - aimAngleSmoothed);
  aimAngleSmoothed = normAngle(aimAngleSmoothed + da * Math.min(1, dt * 18));

  updateUFO(dt);
  updateBomb(dt);

  // formation movement bounds depend on breathing spacing
  const breath = Math.sin(time * 2) * 0.5 + 0.5;
  const spacingX = getSpacingX() * (1 + breath * 0.25);

  const formationWidth = (formationCols - 1) * spacingX;

  // v1.96: predict next X so we don't clip enemies on wider desktop layouts
  const nextXOffset = formation.xOffset + (formation.dir * formation.speed);

  const leftEdgeNext  = canvas.width/2 - formationWidth/2 + nextXOffset;
  const rightEdgeNext = canvas.width/2 + formationWidth/2 + nextXOffset;

  if (leftEdgeNext < formation.boundsPad){
    formation.dir = 1;
    formation.xOffset += 2;
    formation.yOffset += formation.stepDown;
  } else if (rightEdgeNext > canvas.width - formation.boundsPad){
    formation.dir = -1;
    formation.xOffset -= 2;
    formation.yOffset += formation.stepDown;
  } else {
    formation.xOffset = nextXOffset;
  }

  // v1.96: always drift downward toward the player (Galaga pressure)
  formation.yOffset += formation.descentSpeed * dt;

  // update bullets
  for (let i = bullets.length - 1; i >= 0; i--){
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < -80 || b.x > canvas.width + 80 || b.y < -80 || b.y > canvas.height + 80) bullets.splice(i, 1);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--){
    const b = enemyBullets[i];
    b.x += (b.vx || 0);
    b.y += b.vy;
    if (enemyBullets[i].y > canvas.height + 60) enemyBullets.splice(i, 1);
  }


  // v1.96: player bullet <-> enemy bullet collision (both vanish on contact)
  // This prevents bullet spam from feeling unfair and adds a satisfying "counter-shot" mechanic.
  for (let pi = bullets.length - 1; pi >= 0; pi--){
    const p = bullets[pi];
    for (let ei = enemyBullets.length - 1; ei >= 0; ei--){
      const e = enemyBullets[ei];
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const rr = (p.r + e.r);
      // v1.96: cheap early-outs to avoid expensive nested collision work when bullets are far apart
      if (dy > rr + 6 || dy < -rr - 6) continue;
      if (dx > rr + 6 || dx < -rr - 6) continue;
      if (dx*dx + dy*dy <= rr*rr){
        bullets.splice(pi, 1);
        enemyBullets.splice(ei, 1);
        break; // player bullet is gone, move to next one
      }
    }
  }

  // v1.96: attempt to launch swoop attackers
  // Boss wave uses its own movement, no swoops.
  if (wave !== 11) tryStartSwoop(dt);

  // compute enemy positions
  const spacingY = getSpacingY() * (1 + breath * 0.15);
  const formationHeight = (formationRows - 1) * spacingY;

  const startX = canvas.width/2 - formationWidth/2 + formation.xOffset;

  // v1.96: base spawn Y from each enemy, plus formation yOffset
  // then clamp so the formation bottom never gets too close to player
  let baseY = 80 + formation.yOffset;

// Keep enemies in the TOP half-ish of the screen.
// We still drift downward (Galaga pressure), but we *cap* the formation so it doesn't
// invade the player's space like it's paying rent down there.
const TOP_SAFE_MARGIN = 60;
const ENEMY_ZONE_MAX_Y = canvas.height * 0.48; // ~top half with a little buffer

// Clamp TOP
if (baseY < TOP_SAFE_MARGIN){
  formation.yOffset += (TOP_SAFE_MARGIN - baseY);
  baseY = TOP_SAFE_MARGIN;
}

// Clamp BOTTOM (based on full formation height)
const maxBaseY = ENEMY_ZONE_MAX_Y - formationHeight;
if (baseY > maxBaseY){
  // pull the whole formation back up
  formation.yOffset -= (baseY - maxBaseY);
  baseY = maxBaseY;
  // if the formation is too tall to fit, at least respect the top margin
  if (baseY < TOP_SAFE_MARGIN) baseY = TOP_SAFE_MARGIN;
}


// Boss wave controller: sporadic movement + orbiting shield ring.
// We compute boss.x/y directly, then force shields to orbit it.
let bossCore = enemies.find(x => x && x.isBossCore && !x.dying);
if (bossCore){
  if (bossCore){
    // Update sporadic target selection
    bossCore.moveTimer -= dt;

    const left = 70;
    const right = canvas.width - 70;
    const top = 70;
    const bottom = canvas.height * 0.36;

    if (bossCore.moveTimer <= 0){
      const dash = Math.random() < bossCore.dashChance;
      bossCore.tx = rand(left, right);
      bossCore.ty = rand(top, bottom);

      // Occasionally do a more dramatic "dash" by picking a farther target + higher speed.
      const baseSpeed = dash ? rand(520, 760) : rand(200, 340);
      bossCore.moveSpeed = baseSpeed * FUNK;

      // Short, snappy pacing feels more "alive"
      bossCore.moveTimer = dash ? rand(0.35, 0.6) : rand(0.55, 1.15);

      // Small randomness in orbit speed so it doesn't feel like a perfect clock
      bossCore.orbitSpeed = rand(1.35, 2.25);
    }

    // Move toward target (ease-ish)
    const dx = bossCore.tx - bossCore.mx;
    const dy = bossCore.ty - bossCore.my;
    const dist = Math.hypot(dx, dy) || 1;

    const step = Math.min(dist, bossCore.moveSpeed * dt);
    bossCore.mx += (dx / dist) * step;
    bossCore.my += (dy / dist) * step;

    // Apply to render positions
    bossCore.x = bossCore.mx;
    bossCore.y = bossCore.my;

    // Orbit angle
    bossCore.orbitAngle += dt * bossCore.orbitSpeed;

    // Shield firing pattern: each orbiter shoots on a fixed cadence with a fixed spread.
    // This makes a predictable 'screen sweep' pattern rather than random snipes.
    for (const s of enemies){
      if (!s || s.dying) continue;
      if (!s.isBossShield || s.bossRef !== bossCore) continue;
      if (typeof s.shootTimer !== 'number') s.shootTimer = 0;
      s.shootTimer -= dt;
      if (s.shootTimer <= 0){
        // Fixed vx by index: [-3, -1, 1, 3] (scaled), always downward.
        const vxMap = [-3, -1, 1, 3];
        const idx = Math.max(0, Math.min(3, (s.orbitIndex|0)));
        const vx = vxMap[idx] * 1.15 * FUNK;
        const vy = (6.4 + wave * 0.35) * FUNK;
        if (enemyBullets.length >= MAX_ENEMY_BULLETS){
          enemyBullets.splice(0, enemyBullets.length - MAX_ENEMY_BULLETS + 1);
        }
        enemyBullets.push({ x: s.x, y: s.y + s.h/2 + 6, vx, vy, r: 4 });
        const interval = (typeof s.shootInterval === 'number') ? s.shootInterval : 1.2;
        s.shootTimer += interval;
      }
    }

    // Count alive shields (for invulnerability logic)
    let alive = 0;
    for (const s of enemies){
      if (s && s.isBossShield && !s.dying) alive++;
    }
    bossCore.shieldsAlive = alive;
  }
} else {
  // If the boss core is gone (killed/fading), any remaining orbiters should NOT become
  // a second full-health "boss". Make them a 1-hit cleanup target.
  for (const s of enemies){
    if (!s || s.dying) continue;
    if (!s.isBossShield) continue;
    if (!s.bossRef || s.bossRef.dying || (typeof s.bossRef.hp === "number" && s.bossRef.hp <= 0)){
      s.hp = 1;
      s.isBossShield = false;
      s.isBossRemnant = true;
      s.bossWave = false;
      s.bossRef = null;
      // stop shield firing
      s.shootTimer = 9999;
      s.shootInterval = 9999;
    }
  }
}

  for (const e of enemies){
    if (assetsReady && enemyImages.length && e.img === playerImg) e.img = randEnemyImg();

    const scale = 1 + breath * 0.18;
    const size = e.size * scale;

    // v1.96: predictable formation wobble (non-random, just annoying)
    const wobbleAmpX = 6 + Math.min(14, wave * 1.2);
    const wobbleAmpY = 3 + Math.min(10, wave * 0.7);
    const wobbleX = Math.sin(time * (0.9 + wave*0.03) + e.row * 0.7) * wobbleAmpX;
    const wobbleY = Math.cos(time * (1.1 + wave*0.02) + e.col * 0.6) * wobbleAmpY;


e.fx = startX + e.col * spacingX + wobbleX;
e.fy = baseY + e.row * spacingY + wobbleY;

// Boss group: override formation positioning with custom behaviour.
if (bossCore){
  if (e.isBossCore){
    e.fx = e.x;
    e.fy = e.y;
  } else if (e.isBossShield && e.bossRef){
    // Orbit around the core at 90° intervals.
    const core = e.bossRef;
    const ang = (core.orbitAngle || 0) + (e.orbitIndex || 0) * (Math.PI / 2);
    const r = core.orbitRadius || 70;

    e.fx = core.x + Math.cos(ang) * r;
    e.fy = core.y + Math.sin(ang) * r;
  }
}

if (!e.swoop){
      // Normal formation tracking.
      e.x = e.fx;
      e.y = e.fy;
    } else {
      // Swoop motion: dive down along a bezier arc, then return back to formation.
      e.swoop.t += dt;
      const u = Math.min(1, e.swoop.t / e.swoop.dur);

      if (e.swoop.phase === "down"){
        e.x = quadBezier(u, e.swoop.sx, e.swoop.c1x, e.swoop.ex);
        e.y = quadBezier(u, e.swoop.sy, e.swoop.c1y, e.swoop.ey);

        if (u >= 1){
          // Switch to return phase.
          e.swoop.phase = "up";
          e.swoop.t = 0;
          e.swoop.dur = Math.max(0.75, e.swoop.dur * 0.85);

          // Return target is the *current* formation slot (fx/fy),
          // so the enemy rejoins smoothly even if the formation moved.
          e.swoop.sx = e.x;
          e.swoop.sy = e.y;
          e.swoop.ex = e.fx;
          e.swoop.ey = e.fy;
          // new control point arcs upward.
          e.swoop.c1x = e.x + rand(-200, 200);
          e.swoop.c1y = Math.max(60, e.y - rand(160, 260));
        }
      } else {
        // Return-to-formation arc
        e.x = quadBezier(u, e.swoop.sx, e.swoop.c1x, e.swoop.ex);
        e.y = quadBezier(u, e.swoop.sy, e.swoop.c1y, e.swoop.ey);

        if (u >= 1){
          // Back in formation.
          e.swoop = null;
          e.x = e.fx;
          e.y = e.fy;
        }
      }
    }

    e.w = size;
    e.h = size;
  }

  // bullet -> enemy collision
  for (let bi = bullets.length - 1; bi >= 0; bi--){
    const b = bullets[bi];
    // v1.96+: bullet -> UFO collision (3-hit color cycle, then fade + powerup)
    if (ufo && ufo.fade === 0){
      const dxU = b.x - ufo.x;
      const dyU = b.y - ufo.y;
      const rrU = (b.r + ufo.r);
      if (dxU*dxU + dyU*dyU <= rrU*rrU){
        bullets.splice(bi, 1);
        ufo.hits += 1;
        ufo.stage = Math.min(3, ufo.hits); // 1 red, 2 green, 3 blue
        if (ufo.hits >= 3){
          if (ufo.fade === 0) incrementLifetimeStat("lifetimeUfosKilled", 1);
          ufo.fade = 0.001; // start fade-out
        }
        playSfx(sfxHit);
        continue; // bullet consumed
      }
    }

    for (let ei = enemies.length - 1; ei >= 0; ei--){
      const e = enemies[ei];

const rx = e.x - e.w/2, ry = e.y - e.h/2;

if (e.dying) continue;

// Boss wave: the orbiting shields protect the core.
if (wave === 11 && e.isBossCore){
  // If any shield is still alive, the core ignores direct hits.
  const shieldsAlive = (e.shieldsAlive ?? enemies.reduce((n, s) => n + (s && s.isBossShield && !s.dying ? 1 : 0), 0));
  if (shieldsAlive > 0) continue;
}

if (circleRect(b.x, b.y, b.r, rx, ry, e.w, e.h)){
        hitsConnected += 1;
        damageDealt += 1;
        enemyApplyDamage(e, 1, "bullet");
        // Bullet consumed on hit.
        bullets.splice(bi, 1);
        break;
      }
    }
  }

  // enemy bullet -> player collision
  const prx = player.x - player.w/2, pry = player.y - player.h/2;
  const shieldR = player.w * SHIELD_RADIUS_MULT;

  if (!playerSpectatorMode){
    for (let i = enemyBullets.length - 1; i >= 0; i--){
      const b = enemyBullets[i];

      // v1.96: shield blocks bullets (counts as a "hit" on the shield)
      if (shieldActive){
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        const rr = (shieldR + b.r);
        if (dx*dx + dy*dy <= rr*rr){
          enemyBullets.splice(i, 1);
          shieldApplyDamage(SHIELD_BULLET_DMG);
          continue;
        }
      }

      if (circleRect(b.x, b.y, b.r, prx, pry, player.w, player.h)){
        enemyBullets.splice(i, 1);
        damagePlayer();
      }
    }
  }

  // enemy contact damage

  // v1.96: shield makes enemies bounce off the player (and consumes shield hits on impact)
  if (!playerSpectatorMode && shieldActive){
    const shieldR = player.w * SHIELD_RADIUS_MULT;
    for (const e of enemies){
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      // approximate enemy radius from its sprite size
      const er = Math.max(e.w, e.h) * 0.45;
      const rr = shieldR + er;
      const d2 = dx*dx + dy*dy;

      if (d2 <= rr*rr){
        const d = Math.max(1, Math.sqrt(d2));
        const nx = dx / d;
        const ny = dy / d;

        // Push enemy out to the ring boundary
        e.x = player.x + nx * (rr + 2);
        e.y = player.y + ny * (rr + 2);

        // If it's swooping, cancel its swoop so it doesn't keep clipping the shield.
        if (e.swoop){
          e.swoop = null;
        }

        // Nudge its formation slot slightly away so it doesn't immediately re-collide
        e.col += nx * 0.35;
        e.row += ny * 0.25;

        shieldApplyDamage(SHIELD_BULLET_DMG);
        // If shield died from this hit, stop bouncing for this frame.
        if (!shieldActive) break;
      }
    }
  }

  if (!playerSpectatorMode && player.invuln <= 0){
    for (const e of enemies){
      const rx = e.x - e.w/2, ry = e.y - e.h/2;
      const overlap =
        prx < rx + e.w &&
        prx + player.w > rx &&
        pry < ry + e.h &&
        pry + player.h > ry;
      if (overlap){ damagePlayer(); break; }
    }
  }

  enemyTryShoot(dt);

  // Enemy hit flash + death fade timers (v1.96)
  for (let i = enemies.length - 1; i >= 0; i--){
    const e = enemies[i];

    // Hit flash timer
    if (e.hitFlash > 0){
      e.hitFlash = Math.max(0, e.hitFlash - dt);
    }

    // Death fade timer
    if (e.dying){
      // Keep the corpse where it died while fading out.
      if (typeof e.lockX === "number") e.x = e.lockX;
      if (typeof e.lockY === "number") e.y = e.lockY;
      if (typeof e.lockW === "number" && e.lockW > 0) e.w = e.lockW;
      if (typeof e.lockH === "number" && e.lockH > 0) e.h = e.lockH;

      const rate = (e.fadeRate && e.fadeRate > 0) ? e.fadeRate : (1 / ENEMY_DEATH_FADE_SECS);
      e.fade = Math.max(0, (typeof e.fade === "number" ? e.fade : 1) - dt * rate);

      if (e.fade <= 0){
        enemies.splice(i, 1);
      }
    }
  }


  // wave clear
  if (enemies.length === 0){
    // If player beat INSANITY WAVE: 10 (wave 21), show a win screen.
    if (wave === 21){
      showWinOverlay();
      return;
    }

    wave += 1;
    showWaveBanner(wave);

    resetFormation();
    spawnEnemies();
    trySpawnUFO();
  }
}


function healPlayer(amount){
  // Heal up to 100%. Used by frog enemies.
  if (isDead) return;
  health = Math.min(1, health + amount);
}


function drawShieldRing(){
  if (!(gameState === STATE.PLAYING && shieldActive)) return;

  const r = player.w * SHIELD_RADIUS_MULT;
  const segments = 72;
  const baseHue = (time * 180) % 360; // shifting rainbow
  ctx.save();
  ctx.translate(player.x, player.y);

  // Outer glow
  ctx.lineWidth = 6;
  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(0,255,255,0.35)";

  for (let i = 0; i < segments; i++){
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const hue = (baseHue + i * (360 / segments)) % 360;
    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.95)`;
    ctx.beginPath();
    ctx.arc(0, 0, r, a0, a1);
    ctx.stroke();
  }

  // Small inner ring to make it feel "contained"
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(0, 0, r - 6, 0, Math.PI*2);
  ctx.stroke();

  // Shield HP pips (more pips = more remaining shield)
  const PIPS = 6;
  const pipR = 3.2;
  const hpPerPip = SHIELD_HP_MAX / PIPS;
  const filled = Math.max(0, Math.min(PIPS, Math.ceil(shieldHP / hpPerPip)));

  for (let i = 0; i < PIPS; i++){
    const on = (i < filled);
    const px = (i - (PIPS-1)/2) * 10;
    const py = -r - 12;
    ctx.fillStyle = on ? "rgba(0,255,255,0.9)" : "rgba(0,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(px, py, pipR, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.restore();
}

function draw(){
  drawStarfield();

  // v1.96+: draw player death particles
  if (deathParticles.length){
    ctx.save();
    ctx.fillStyle = "#ff0";
    for (const p of deathParticles){
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    ctx.restore();
  }

  // v1.96: Wave banner popup
  if (gameState === STATE.PLAYING && waveBanner.t > 0){
    const p = Math.min(1, waveBanner.t / 1.35);
    const alpha = Math.min(1, 0.2 + p);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "bold 48px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = waveBanner.color || "#00ff66";
    ctx.shadowColor = "rgba(0,255,102,0.35)";
    ctx.shadowBlur = 12;
    ctx.fillText(waveBanner.text, canvas.width/2, Math.max(60, canvas.height*0.12));
    ctx.restore();
  }

  // v1.96: death particles
  if (deathParticles.length){
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (const p of deathParticles){
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillRect(p.x - p.s/2, p.y - p.s/2, p.s, p.s);
    }
    ctx.restore();
  }

  // player flicker on invulnerability
  const flicker = player.invuln > 0 && Math.floor(time * 20) % 2 === 0;
  const shouldDrawPlayer = (hasActivePlayer() && !document.body.classList.contains("speedZeroMeltHideCanvasPlayer"));
  if (USE_DOM_ANIMATED_GIF_SPRITES) beginAnimatedGifSpriteFrame();

  if (shouldDrawPlayer && !flicker){
    // Keep the active player static even when PLAYER_IMG_URL points at an animated GIF/WebP.
    // Enemies can still use the DOM animated sprite layer below.
    const oldDomPlayer = animatedGifSpriteMap.get(player);
    if (oldDomPlayer) oldDomPlayer.style.display = "none";
    drawPlayerGhosts();
    drawStaticPlayerSprite();
  }

    // v1.96: shield ring (RMB hold)
  drawShieldRing();

// v1.96: always-on health bar under the player
  if (hasActivePlayer() && !document.body.classList.contains("speedZeroMeltHideCanvasPlayer")){
    const barW = player.w;
    const barH = 7;
    const bx = player.x - barW/2;
    const by = player.y + player.h/2 + 10;
    const maxHearts = Math.max(1, MAX_HEARTS|0);
    const currentHearts = Math.max(0, Math.min(maxHearts, health * maxHearts));
    const healthBarPercent = Math.max(0, Math.min(100, (currentHearts / maxHearts) * 100));

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(bx-1, by-1, barW+2, barH+2);

    ctx.fillStyle = "rgba(255,0,0,0.22)";
    ctx.fillRect(bx, by, barW, barH);

    ctx.fillStyle = "rgba(0,255,102,0.85)";
    ctx.fillRect(bx, by, barW * (healthBarPercent / 100), barH);
    ctx.restore();
  }

// v1.96: aim indicator (yellow triangle orbiting around player, pointing where you're aiming)
if (hasActivePlayer() && !document.body.classList.contains("speedZeroMeltHideCanvasPlayer")){
  const a = aimAngleSmoothed;
  const orbitR = player.w * 0.62;
  const tx = player.x + Math.cos(a) * orbitR;
  const ty = player.y + Math.sin(a) * orbitR;

  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(a); // point outward
  ctx.fillStyle = "rgba(255,255,0,0.95)";
  ctx.beginPath();
  ctx.moveTo(16, 0);     // tip
  ctx.lineTo(-8, -7);    // base left
  ctx.lineTo(-8, 7);     // base right
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

  // UFO + bomb
  drawUFO();
  drawBomb();

  // enemies
  for (const e of enemies){
    // v1.96: frog enemies get a pulsing green aura ring
    if (e.isFrog){
      const pulse = 1 + 0.12 * Math.sin(time * 6.0);
      const r = Math.max(e.w, e.h) * 0.70 * pulse;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "rgba(0,255,0,0.10)";
      ctx.strokeStyle = "rgba(0,255,0,0.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // v1.96: enemy flash red on hit + fade out on death
    const ex = e.x - e.w/2, ey = e.y - e.h/2;
    const alpha = (e.dying ? Math.max(0, Math.min(1, e.fade)) : 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    const drewDomEnemy = syncAnimatedGifSprite(
      e,
      e.img,
      ex,
      ey,
      e.w,
      e.h,
      { className:"enemy-gif-sprite", alpha, hitFlash:e.hitFlash > 0 }
    );
    if (!drewDomEnemy){
      const enemySource = isGameSpeedFrozen() ? (getStaticFrameForImage(e.img) || e.img) : e.img;
      ctx.drawImage(enemySource, ex, ey, e.w, e.h);
    }

// Dragon marker: upside-down red equilateral triangle (because dragons deserve drama)
if (isDragonEnemy(e)){
  const r = Math.max(e.w, e.h) * 0.78;
  ctx.save();
  ctx.strokeStyle = "rgba(255,0,0,0.85)";
  ctx.lineWidth = 3;
  drawInvertedTriangle(e.x, e.y, r);
  ctx.restore();
}

    if (e.hitFlash > 0){
      const p = Math.max(0, Math.min(1, e.hitFlash / ENEMY_HIT_FLASH_SECS));
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = `rgba(255,0,0,${0.28 * p})`;
      ctx.fillRect(ex, ey, e.w, e.h);
    }
    ctx.restore();
  }

  if (USE_DOM_ANIMATED_GIF_SPRITES) endAnimatedGifSpriteFrame();

  // bullets (player)
  // v1.96: draw as simple circles (no text/letter-like shapes)
  ctx.fillStyle = "#ff0";
  for (const b of bullets){
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // bullets (enemy)
  ctx.fillStyle = "rgba(255,0,0,0.95)";
  for (const b of enemyBullets){
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fill();
  }
  // v1.96: keep debug grid numbers aligned with current formation
  ENEMY_ROWS = formationRows;
  ENEMY_COLS = formationCols;

  overlay.innerHTML =
    `Bananaman Shooter<br>` +
    `State: ${gameState}<br>` +
    `Score: ${score} | Health: ${Math.round(health*100)}% | Wave: ${wave}<br>` +
    `Shield: ${shieldActive ? (Math.round((shieldHP/SHIELD_HP_MAX)*100) + "%") : "off"} | CD: ${shieldCooldown.toFixed(1)}s<br>` +
    `Enemies: ${enemies.length} (${ENEMY_ROWS}x${ENEMY_COLS})<br>` +
    `Enemy pool: ${enemyImages.length || 0} images<br>` +
    `Bullets: ${bullets.length} | Enemy Bullets: ${enemyBullets.length}<br>` +
    `Fire CD: ${fireCooldown.toFixed(2)}s (target ${getPlayerFireCooldown().toFixed(2)}s)<br>` +
    `Player: ${player.w}px | Gap: ${FORMATION_PLAYER_GAP}px<br>` +
    `ESC: Menu`;

  updateAccuracyScoreHUD();
  updateTimerHUD();

  // v1.96: corner HUD updates
  if (gameState === STATE.PLAYING){
    livesText.textContent = livesInfiniteActive ? "x∞" : ("x" + lives);
    _syncBombHud();
  } else if (gameState === STATE.MENU || gameState === STATE.OPTIONS || gameState === STATE.CONTROLS || gameState === STATE.CHEATS){
    renderMenuHudPreview();
  }
  if (gameState === STATE.PLAYING){
    const info = getStageInfo(wave);
    const clampedWave = Math.min(wave, info.end);
    const lab = getWaveLabel(wave);
    const stageHudEl = document.getElementById("stageHud");
    stageHudEl.textContent = lab.text;
    stageHudEl.style.color = lab.color;
  } else if (gameState === STATE.MENU || gameState === STATE.OPTIONS || gameState === STATE.CONTROLS || gameState === STATE.CHEATS){
    const stageHudEl = document.getElementById("stageHud");
    stageHudEl.textContent = "Start Menu";
      stageHudEl.style.color = "#ffffff";
  } else {
    document.getElementById("stageHud").textContent = "";
  }

  // Post FX pass: canvas + visible DOM/HUD/menu layers.
  // Redraw the active player afterward so /video_fx does not hue-shift the player icon.
  if (VIDEO_FX_ENABLED){
    const beat = getBeat();
    applyChromaticAberration(beat);
    redrawPlayerSpriteAfterVideoFx();
    syncWholeScreenVideoFx(beat);
  } else if (document.body.classList.contains("videoFxActive")){
    syncWholeScreenVideoFx(0);
  }

  // Glitch spiral burst (Tab)
  if (GLITCH_SPIRAL_T > 0){
    const strength = Math.max(0, Math.min(1, GLITCH_SPIRAL_T / GLITCH_SPIRAL_DUR));
    applyGlitchSpiral(strength);
  }

}

let lastT = performance.now();

function updateHearts(){
  if (gameState === STATE.MENU || gameState === STATE.OPTIONS || gameState === STATE.CONTROLS || gameState === STATE.CHEATS){
    renderMenuHudPreview();
    return;
  }
  // v1.96: Hearts are configurable (MAX_HEARTS), and shields/bomb-armor show here too.
  const maxH = Math.max(1, MAX_HEARTS|0);
  const currentHearts = Math.max(0, Math.min(maxH, health * maxH));
  const heartsAreInfinite = !!(infiniteModeActive || heartsInfiniteActive);
  const shieldsAreInfinite = !!(infiniteModeActive || shieldsInfiniteActive);
  const infinityLabel = "x♾️";
  const maxVisibleHudIcons = 5;

  // Convert 0..1 health into "filled hearts" count.
  const hearts = Math.max(0, Math.min(maxH, Math.ceil(currentHearts - 0.000001)));

  const full = "❤️";
  const empty = "❌";
  let out = "";
  if (heartsAreInfinite){
    out += `${full}${infinityLabel}`;
  } else {
    const visibleMaxH = Math.min(maxVisibleHudIcons, maxH);
    for (let i = 0; i < visibleMaxH; i++){
      out += (i < hearts ? full : empty) + " ";
    }
    if (hearts > maxVisibleHudIcons) out += `<span class="hudExtra">+${hearts - maxVisibleHudIcons}</span> `;
  }

  // v1.96: shield pips (one-hit armor) next to hearts
  if (shieldsAreInfinite){
    out += "  🛡️" + infinityLabel;
  } else if (shieldPips > 0){
    const show = Math.min(maxVisibleHudIcons, shieldPips);
    out += "  " + "🛡️ ".repeat(show);
    if (shieldPips > maxVisibleHudIcons) out += `<span class="hudExtra">+${shieldPips - maxVisibleHudIcons}</span> `;
  }

  // v1.96: bonus armor indicator next to hearts
  let armorIcon = "";
  if (bonusArmor > 0) armorIcon = "🛡️";
  else if (bonusArmorBrokenT > 0) armorIcon = "❌";
  if (armorIcon) out += "  " + armorIcon;

  // v1.96: infinite marker so you remember you're cheating
  if (!heartsAreInfinite && !shieldsAreInfinite && (infiniteModeActive || heartsInfiniteActive || shieldsInfiniteActive || bombsInfiniteActive || livesInfiniteActive)) out += "  ♾️";

  const el = document.getElementById("heartsHud");
  if (el){
    el.innerHTML = out.trim();
    el.style.display = (gameState === STATE.PLAYING || gameState === STATE.MENU || gameState === STATE.OPTIONS || gameState === STATE.CONTROLS || gameState === STATE.CHEATS) ? "block" : "none";
  }
}

function loop(t){
  // v1.96: Game speed knob. We cap raw dt to prevent big frame hitch jumps,
  // then multiply by GAME_SPEED_MULT (5 = 1.0x, 1 = 0.2x, 10 = 2.0x).
  const rawDt = Math.min(0.033, (t - lastT) / 1000);
  const speedMult = Number.isFinite(GAME_SPEED_MULT) ? GAME_SPEED_MULT : 1.0;
  const dt = rawDt * speedMult;
  window._dt = dt;
  lastT = t;
  update(dt);
draw();
  updateHearts();
  requestAnimationFrame(loop);
}

/* =======================
   Boot
======================= */
player.x = canvas.width / 2;
player.y = getPlayerAlignedY();

// v1.96: default aim straight up until the player moves the pointer
aimX = player.x;
aimY = player.y - 200;
aimAngle = -Math.PI/2;
aimAngleSmoothed = -Math.PI/2;

resetStarfield();
resize(); // also resets starfield + anchors player
showMenu();
powerupSlot.style.display = "none";
spawnEnemies();
updateHearts();

requestAnimationFrame(loop);


document.addEventListener("DOMContentLoaded", syncSpeedZeroStaticImages);
window.addEventListener("load", syncSpeedZeroStaticImages);


document.addEventListener("DOMContentLoaded", renderLifetimeStats);
