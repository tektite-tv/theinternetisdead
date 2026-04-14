/* =======================
   UI
======================= */
const uiRoot = document.getElementById("uiRoot");
const startMenu = document.getElementById("startMenu");
const optionsMenu = document.getElementById("optionsMenu");
const assetStatus = document.getElementById("assetStatus");

const btnStart = document.getElementById("btnStart");
const btnOptions = document.getElementById("btnOptions");
const btnControls = document.getElementById("btnControls");
const controlsMenu = document.getElementById("controlsMenu");
const controlsModeKeyboard = document.getElementById("controlsModeKeyboard");
const controlsModeController = document.getElementById("controlsModeController");
const controlsBindStatus = document.getElementById("controlsBindStatus");
const controlsFixedInfo = document.getElementById("controlsFixedInfo");
const controlsBindList = document.getElementById("controlsBindList");
const controlsResetBinds = document.getElementById("controlsResetBinds");
const controlsApplyBinds = document.getElementById("controlsApplyBinds");
const controlsBack = document.getElementById("controlsBack");
const btnBack = document.getElementById("btnBack");
const btnApply = document.getElementById("btnApply");

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
  // v1.96: game speed slider (1-10). 5 = 1.0x.
  let START_GAME_SPEED = 5;
  let GAME_SPEED_MULT = 1.0;
  GAME_SPEED_MULT = Math.max(0.1, Math.min(3.0, START_GAME_SPEED / 5));
  let INFINITE_MODE = false;
  
let START_WAVE = 1; // 1-10 = maze waves, 11 = Bonus Mode, 12-21 = Insanity 1-10

let INVERT_COLORS = false;
const invertColorsCheckbox = document.getElementById("invertColorsCheckbox");

function applyInvertColors(){
  document.body.classList.toggle("invert-colors", INVERT_COLORS);
}

if (invertColorsCheckbox){
  invertColorsCheckbox.addEventListener("change", () => {
    INVERT_COLORS = invertColorsCheckbox.checked;
    applyInvertColors();
  });
}


  function getStartWaveText(v){
    const n = parseInt(v, 10) || 1;
    if (n === 11) return "Bonus Mode";
    if (n >= 12 && n <= 21) return "Insanity " + (n - 11);
    return "Wave " + n;
  }

  function syncStartOptionsLabels(){
    livesVal.textContent = livesSlider.value;
    heartsVal.textContent = heartsSlider.value;
    shieldsVal.textContent = shieldsSlider.value;
    bombsVal.textContent = bombsSlider.value;
    if (speedVal && speedSlider) speedVal.textContent = speedSlider.value;
    if (startWaveLabel && startWaveSelect) startWaveLabel.textContent = getStartWaveText(startWaveSelect.value);
  }

  [livesSlider, heartsSlider, shieldsSlider, bombsSlider, speedSlider].forEach(s => {
    s.addEventListener("input", syncStartOptionsLabels);
  });
  if (startWaveSelect) startWaveSelect.addEventListener("change", syncStartOptionsLabels);
  infiniteToggle.addEventListener("change", () => {});
  syncStartOptionsLabels();

const INPUT_MODE_KEYBOARD = "keyboardMouse";
const INPUT_MODE_CONTROLLER = "controller";
const BINDINGS_STORAGE_KEY = "tektiteShooterBindings_v1";
const DEFAULT_KEYBOARD_BINDINGS = {
  moveLeft: "KeyA",
  moveRight: "KeyD",
  shoot: "Mouse0",
  shield: "Mouse2",
  bomb: "KeyQ",
  pause: "Escape",
  commands: "Slash",
  mute: "KeyM",
  fullscreen: "KeyF"
};
const DEFAULT_CONTROLLER_BINDINGS = {
  shoot: 7,
  shield: 4,
  bomb: 6,
  pause: 9,
  menuSelect: 0,
  menuBack: 1,
  muteHud: 8,
  fullscreen: 11
};
const KEYBOARD_BIND_ACTIONS = [
  { key: "moveLeft", label: "Move Left", hint: "Gameplay movement" },
  { key: "moveRight", label: "Move Right", hint: "Gameplay movement" },
  { key: "shoot", label: "Shoot", hint: "Key or mouse button" },
  { key: "shield", label: "Shield", hint: "Key or mouse button" },
  { key: "bomb", label: "Bomb", hint: "Gameplay action" },
  { key: "pause", label: "Pause / Resume", hint: "Gameplay and pause menu" },
  { key: "commands", label: "Open Commands", hint: "Open slash chat" },
  { key: "mute", label: "Mute", hint: "Toggle audio" },
  { key: "fullscreen", label: "Fullscreen", hint: "Whole shooter shell" }
];
const CONTROLLER_BIND_ACTIONS = [
  { key: "shoot", label: "Shoot", hint: "Gameplay action" },
  { key: "shield", label: "Shield", hint: "Gameplay action" },
  { key: "bomb", label: "Bomb", hint: "Gameplay action" },
  { key: "pause", label: "Pause / Resume", hint: "Gameplay and pause menu" },
  { key: "menuSelect", label: "Menu Select", hint: "Menus and command list" },
  { key: "menuBack", label: "Menu Back / Close Chat", hint: "Menus and pause chat" },
  { key: "muteHud", label: "HUD Toggle", hint: "Show or hide HUD" },
  { key: "fullscreen", label: "Fullscreen", hint: "Whole shooter shell" }
];
const CONTROLLER_BUTTON_LABELS = {
  0: "A", 1: "B", 2: "X", 3: "Y", 4: "LB", 5: "RB", 6: "LT", 7: "RT",
  8: "Back", 9: "Start", 10: "LS", 11: "RS", 12: "D-Pad Up", 13: "D-Pad Down", 14: "D-Pad Left", 15: "D-Pad Right"
};
let activeInputMode = INPUT_MODE_KEYBOARD;
let controlsBindMode = INPUT_MODE_KEYBOARD;
let controlsFocusIndex = 0;
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
function formatKeyboardBinding(code){
  const map = {Space:'Space', Escape:'Esc', Slash:'/', ArrowLeft:'Left Arrow', ArrowRight:'Right Arrow', ArrowUp:'Up Arrow', ArrowDown:'Down Arrow', KeyF:'F', KeyM:'M', KeyQ:'Q', KeyA:'A', KeyD:'D'};
  if (!code) return 'Unbound';
  if (map[code]) return map[code];
  if (/^Mouse\d+$/.test(code)) return code === 'Mouse0' ? 'Left Click' : code === 'Mouse1' ? 'Middle Click' : code === 'Mouse2' ? 'Right Click' : code;
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  return code;
}
function formatControllerBinding(index){ return CONTROLLER_BUTTON_LABELS[index] || `Button ${index}`; }
function mouseButtonToBinding(button){ return `Mouse${Number(button) || 0}`; }
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
  if (controlsFixedInfo){
    controlsFixedInfo.textContent = controlsBindMode === INPUT_MODE_CONTROLLER
      ? 'Move stays on Left Stick / D-Pad. Aim stays on Right Stick. Fullscreen is rebindable below too.'
      : 'Aim stays on Mouse / Touch. Bind actions below to keys or mouse buttons, including Fullscreen.';
  }
}
function setActiveInputMode(mode){
  const nextMode = mode === INPUT_MODE_CONTROLLER ? INPUT_MODE_CONTROLLER : INPUT_MODE_KEYBOARD;
  if (activeInputMode === nextMode) return;
  activeInputMode = nextMode;
  document.body.classList.toggle('controller-active', activeInputMode === INPUT_MODE_CONTROLLER);
  updateControlsDisplay();
}
function getCurrentBindingDefs(){ return controlsBindMode === INPUT_MODE_CONTROLLER ? CONTROLLER_BIND_ACTIONS : KEYBOARD_BIND_ACTIONS; }
function getCurrentBindingValue(action){ return controlsBindMode === INPUT_MODE_CONTROLLER ? draftControllerBindings[action] : draftKeyboardBindings[action]; }
function setControlsBindStatus(message){ if (controlsBindStatus) controlsBindStatus.textContent = message; }
function renderControlsBindingList(){
  if (!controlsBindList) return;
  controlsBindList.innerHTML = '';
  getCurrentBindingDefs().forEach(def => {
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
  if (controlsModeKeyboard) controlsModeKeyboard.classList.toggle('active', controlsBindMode === INPUT_MODE_KEYBOARD);
  if (controlsModeController) controlsModeController.classList.toggle('active', controlsBindMode === INPUT_MODE_CONTROLLER);
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
  setControlsBindStatus('Binding updated. Press Apply to save.');
  fitControlsMenuToViewport();
}
function startBindingEdit(scheme, action){
  controlsBindMode = scheme === INPUT_MODE_CONTROLLER ? INPUT_MODE_CONTROLLER : INPUT_MODE_KEYBOARD;
  bindingEditState = { scheme: controlsBindMode, action };
  controllerRebindReady = false;
  updateControlsDisplay();
  renderControlsBindingList();
  setControlsBindStatus(controlsBindMode === INPUT_MODE_CONTROLLER ? 'Press a controller button for the selected action.' : 'Press a key or mouse button for the selected action.');
  fitControlsMenuToViewport();
}
function cancelBindingEdit(message){ bindingEditState = null; controllerRebindReady = false; renderControlsBindingList(); setControlsBindStatus(message || 'Select a control to rebind.'); fitControlsMenuToViewport(); }
loadSavedBindings();
resetDraftBindingsFromActive();
updateControlsDisplay();
renderControlsBindingList();
let menuFocusIndex = 0;
let optionsFocusIndex = 0;
let pauseFocusIndex = 0;
let gpNavRepeat = { up:0, down:0, left:0, right:0 };
let gpNavPrevAxis = { horizontal:0, vertical:0 };

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

if (controlsModeKeyboard) controlsModeKeyboard.addEventListener('click', () => setControlsBindMode(INPUT_MODE_KEYBOARD));
if (controlsModeController) controlsModeController.addEventListener('click', () => setControlsBindMode(INPUT_MODE_CONTROLLER));
if (controlsResetBinds) controlsResetBinds.addEventListener('click', () => { draftKeyboardBindings = { ...DEFAULT_KEYBOARD_BINDINGS }; draftControllerBindings = { ...DEFAULT_CONTROLLER_BINDINGS }; cancelBindingEdit('Draft reset to defaults. Press Apply to save.'); updateControlsDisplay(); renderControlsBindingList(); });
if (controlsApplyBinds) controlsApplyBinds.addEventListener('click', () => { applyDraftBindings(); cancelBindingEdit('Bindings applied and saved.'); updateControlsDisplay(); renderControlsBindingList(); if (pauseControlsOpen && isPaused) hidePauseControlsMenu(); });
if (controlsBack) controlsBack.addEventListener('click', hideControlsMenu);

function getMenuControllerTargets(){
  return [btnStart, btnOptions, btnControls].filter(Boolean);
}

function getOptionsControllerTargets(){
  return [startWaveSelect, livesSlider, heartsSlider, shieldsSlider, bombsSlider, speedSlider, infiniteToggle, invertColorsCheckbox, btnBack, btnApply].filter(Boolean);
}

function getControlsControllerTargets(){
  return [controlsModeKeyboard, controlsModeController, ...Array.from(document.querySelectorAll('#controlsMenu .controlsBindButton')), controlsBack, controlsResetBinds, controlsApplyBinds].filter(Boolean);
}

function getPauseControllerTargets(){
  return [btnPauseResume, btnPauseOpenChat, btnPauseOptions, btnPauseQuit].filter(Boolean);
}

function syncMenuControllerFocus(){
  const items = getMenuControllerTargets();
  if (!items.length) return;
  menuFocusIndex = Math.max(0, Math.min(menuFocusIndex, items.length - 1));
  focusControllerElement(items[menuFocusIndex]);
}

function syncOptionsControllerFocus(){
  const items = getOptionsControllerTargets();
  if (!items.length) return;
  optionsFocusIndex = Math.max(0, Math.min(optionsFocusIndex, items.length - 1));
  focusControllerElement(items[optionsFocusIndex]);
}

function syncPauseControllerFocus(){
  const items = getPauseControllerTargets();
  if (!items.length) return;
  pauseFocusIndex = Math.max(0, Math.min(pauseFocusIndex, items.length - 1));
  focusControllerElement(items[pauseFocusIndex]);
}

function syncControlsControllerFocus(){
  const items = getControlsControllerTargets();
  if (!items.length) return;
  controlsFocusIndex = Math.max(0, Math.min(controlsFocusIndex, items.length - 1));
  focusControllerElement(items[controlsFocusIndex]);
}

function moveMenuControllerFocus(delta){
  const items = getMenuControllerTargets();
  if (!items.length) return;
  menuFocusIndex = (menuFocusIndex + delta + items.length) % items.length;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
  else clearControllerFocus();
}

function moveOptionsControllerFocus(delta){
  const items = getOptionsControllerTargets();
  if (!items.length) return;
  optionsFocusIndex = (optionsFocusIndex + delta + items.length) % items.length;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncOptionsControllerFocus();
  else clearControllerFocus();
}

function movePauseControllerFocus(delta){
  const items = getPauseControllerTargets();
  if (!items.length) return;
  pauseFocusIndex = (pauseFocusIndex + delta + items.length) % items.length;
  syncPauseControllerFocus();
}

function moveControlsControllerFocus(delta){
  const items = getControlsControllerTargets();
  if (!items.length) return;
  controlsFocusIndex = (controlsFocusIndex + delta + items.length) % items.length;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncControlsControllerFocus();
  else clearControllerFocus();
  fitControlsMenuToViewport();
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

function activateControllerTarget(el){
  if (!el) return;
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
  if (typeof el.click === 'function') el.click();
}

function adjustControllerOption(delta){
  const items = getOptionsControllerTargets();
  const el = items[optionsFocusIndex];
  if (!el) return false;
  if (el.tagName === 'SELECT') return cycleSelect(el, delta);
  if (el.type === 'range') return stepRange(el, delta);
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
  deathYellPlayed = false;
  gameState = STATE.MENU;
  gameWon = false;
  mouseShieldHolding = false;
  stopShield(false);

  deathOverlay.style.display = "none";
  if (winOverlay) winOverlay.style.display = "none";
  if (mazeSummaryOverlay) mazeSummaryOverlay.style.display = "none";
  mazeSummaryActive = false;
  mazePendingNextWave = null;
  livesSlot.style.display = "none";
  powerupSlot.style.display = "none";
  if (timerHud) timerHud.style.display = "none";
  { const heartsHud = document.getElementById("heartsHud"); if (heartsHud) heartsHud.style.display = "none"; }

  startMenu.style.display = "block";
  optionsMenu.style.display = "none";
  if (controlsMenu) { controlsMenu.style.display = "none"; controlsMenu.classList.remove("pauseControlsMode"); }
  pauseControlsOpen = false;
  if (pauseOverlay) pauseOverlay.classList.remove("pauseControlsVisible");
  uiRoot.classList.remove("pauseControlsOpen");
  uiRoot.style.display = "flex";
  menuFocusIndex = 0;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
  else clearControllerFocus();
}

function showWinOverlay(){
  gameWon = true;
  gameState = STATE.WIN;
  if (winOverlay) winOverlay.style.display = "flex";
  if (mazeSummaryOverlay) mazeSummaryOverlay.style.display = "none";
  if (pauseOverlay) pauseOverlay.style.display = "none";
  livesSlot.style.display = "none";
  powerupSlot.style.display = "none";
  if (timerHud) timerHud.style.display = "none";
  { const heartsHud = document.getElementById("heartsHud"); if (heartsHud) heartsHud.style.display = "none"; }
  // keep music playing through the win/score screen
}

function restartRun(){
  setPaused(false);
  // Restart music immediately when restarting a run.
  ensureMusicPlaying(true);
  // v1.96: Hard reset from GAME OVER screen (full reset to beginning)
  deathOverlay.style.display = "none";
  bomb = null;
  ufo = null;
  powerupSlot.style.display = "none";
  startGame();
}
function showControlsMenu(){
  if (!controlsMenu || startMenu.style.display === "none") return;
  setPaused(false);
  pauseControlsOpen = false;
  if (pauseOverlay) pauseOverlay.classList.remove("pauseControlsVisible");
  uiRoot.classList.remove("pauseControlsOpen");
  gameState = STATE.CONTROLS;
  resetDraftBindingsFromActive();
  startMenu.style.display = "none";
  optionsMenu.style.display = "none";
  controlsMenu.style.display = "block";
  controlsMenu.classList.remove("pauseControlsMode");
  uiRoot.style.display = "flex";
  updateControlsDisplay();
  renderControlsBindingList();
  setControlsBindStatus('Select a control to rebind.');
  fitControlsMenuToViewport();
  controlsFocusIndex = 0;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncControlsControllerFocus();
  else clearControllerFocus();
}
function hideControlsMenu(){
  if (!controlsMenu) return;
  resetDraftBindingsFromActive();
  controlsMenu.style.display = "none";
  controlsMenu.classList.remove("pauseControlsMode");
  cancelBindingEdit('Select a control to rebind.');
  if (pauseControlsOpen && isPaused){
    hidePauseControlsMenu();
    return;
  }
  showMenu();
}

function showOptions(){
  setPaused(false);
  gameState = STATE.OPTIONS;
    // v1.96: populate start options UI with saved settings
  livesSlider.value = START_LIVES;
  heartsSlider.value = START_HEARTS;
  shieldsSlider.value = START_SHIELDS;
  bombsSlider.value = START_BOMBS;
  if (speedSlider) speedSlider.value = START_GAME_SPEED;
  infiniteToggle.checked = !!INFINITE_MODE;
  if (startWaveSelect) startWaveSelect.value = String(START_WAVE);
  if (invertColorsCheckbox) invertColorsCheckbox.checked = INVERT_COLORS;
  syncStartOptionsLabels();

// v1.96: drop shield when entering menus
  mouseShieldHolding = false;
  stopShield(false);

  // v1.96: hide HUD in menus
  livesSlot.style.display = "none";
  powerupSlot.style.display = "none";
  if (timerHud) timerHud.style.display = "none";

  startMenu.style.display = "none";
  if (controlsMenu) { controlsMenu.style.display = "none"; controlsMenu.classList.remove("pauseControlsMode"); }
  pauseControlsOpen = false;
  if (pauseOverlay) pauseOverlay.classList.remove("pauseControlsVisible");
  uiRoot.classList.remove("pauseControlsOpen");
  optionsMenu.style.display = "block";
  uiRoot.style.display = "flex";
  fitOptionsMenuToViewport();
  optionsFocusIndex = 0;
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncOptionsControllerFocus();
  else clearControllerFocus();
}
function startGame(){
  setPaused(false);
  unlockAudioOnce();
  // Start looping music exactly when the game starts.
  ensureMusicPlaying(true);
  gameState = STATE.PLAYING;
  uiRoot.style.display = "none";
  if (controlsMenu) { controlsMenu.style.display = "none"; controlsMenu.classList.remove("pauseControlsMode"); }
  pauseControlsOpen = false;
  if (pauseOverlay) pauseOverlay.classList.remove("pauseControlsVisible");
  uiRoot.classList.remove("pauseControlsOpen");
  deathOverlay.style.display = "none";
  if (winOverlay) winOverlay.style.display = "none";

  // v1.96: show HUD only in-game
  livesSlot.style.display = "flex";
  powerupSlot.style.display = "none";
  if (timerHud) timerHud.style.display = "block";


  // v1.96.x: Reset run timer at the start of each game
  runTimer = 0;
  updateTimerHUD();
  score = 0;
  frogKills = 0;
  shotsFired = 0;
  hitsConnected = 0;
  damageDealt = 0;
  // v1.96: Apply starting settings from OPTIONS menu
  infiniteModeActive = !!INFINITE_MODE;

  lives = Math.max(0, parseInt(START_LIVES, 10) || 0);
  livesText.textContent = "x" + lives;

  MAX_HEARTS = Math.max(1, parseInt(START_HEARTS, 10) || 4);
  HIT_DAMAGE = 1 / MAX_HEARTS;

  health = 1.0;

  // Spawn player fixed in the center for maze traversal
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  shieldPips = Math.max(0, parseInt(START_SHIELDS, 10) || 0);

  bombsCount = Math.max(0, parseInt(START_BOMBS, 10) || 0);
  _syncBombHud();

  health = 1.0;

  // Spawn player fixed in the center for maze traversal
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  bonusArmor = 0;
  bonusArmorBrokenT = 0;
  isDead = false;
  deathTimer = 0;
  deathGameOver = false;
  deathYellPlayed = false;
  deathParticles.length = 0;

  wave = START_WAVE;
  showWaveBanner(wave);
bullets.length = 0;
  enemyBullets.length = 0;
  fireCooldown = 0;
  bomb = null;
  ufo = null;

  resetFormation();
  updateHearts();
spawnEnemies();
  trySpawnUFO();

  clearControllerFocus();
  window.focus();
}

if (AUTO_START_LEVEL){
  window.addEventListener("load", () => {
    requestAnimationFrame(() => startGame());
  }, { once: true });
}

btnStart.addEventListener("click", startGame);
btnOptions.addEventListener("click", showOptions);
if (btnControls) btnControls.addEventListener("click", showControlsMenu);
btnBack.addEventListener("click", showMenu);
if (controlsBack) controlsBack.addEventListener("click", hideControlsMenu);
btnApply.addEventListener("click", () => {
  // v1.96: Save start settings (lives/hearts/shields/bombs + infinite)
  START_LIVES = parseInt(livesSlider.value, 10);
  START_HEARTS = parseInt(heartsSlider.value, 10);
  START_SHIELDS = parseInt(shieldsSlider.value, 10);
  START_BOMBS = parseInt(bombsSlider.value, 10);
  // v1.96: Save game speed (1-10), where 5 = normal.
  START_GAME_SPEED = (speedSlider ? parseInt(speedSlider.value, 10) : 5);
  GAME_SPEED_MULT = Math.max(0.1, Math.min(3.0, START_GAME_SPEED / 5));
  INFINITE_MODE = !!infiniteToggle.checked;
  if (invertColorsCheckbox) INVERT_COLORS = invertColorsCheckbox.checked;
  applyInvertColors();
  START_WAVE = startWaveSelect ? (parseInt(startWaveSelect.value, 10) || 1) : 1;

  // Keep the UI labels in sync and return to the main menu.
  syncStartOptionsLabels();
  showMenu();
});

btnRestart.addEventListener("click", () => {
  restartRun();
});

if (btnContinue){
  btnContinue.addEventListener("click", () => {
    // Hook this up later. For now it simply closes the overlay.
    if (winOverlay) winOverlay.style.display = "none";
  });
}

if (btnNextMaze){
  btnNextMaze.addEventListener("click", () => {
    advanceToNextMaze();
  });
}


function setAssetStatus(msg){ assetStatus.textContent = msg; }

