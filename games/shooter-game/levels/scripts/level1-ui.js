/* =======================
   UI
======================= */
const uiRoot = document.getElementById("uiRoot");
const startMenu = document.getElementById("startMenu");
const optionsMenu = document.getElementById("optionsMenu");
const cheatsMenu = document.getElementById("cheatsMenu");
const assetStatus = document.getElementById("assetStatus");
function getHeartsHudEl(){ return document.getElementById("heartsHud"); }

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
const btnCheats = document.getElementById("btnCheats");
const btnCheatsBack = document.getElementById("btnCheatsBack");

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
  // v1.97: each resource can independently use 100 as INFINITE.
  let START_LIVES_INFINITE = false;
  let START_HEARTS_INFINITE = false;
  let START_SHIELDS_INFINITE = false;
  let START_BOMBS_INFINITE = false;
  // v1.96: game speed slider (1-10). 5 = 1.0x.
  let START_GAME_SPEED = 5;
  let GAME_SPEED_MULT = 1.0;
  GAME_SPEED_MULT = Math.max(0.1, Math.min(3.0, START_GAME_SPEED / 5));
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
    INVERT_COLORS = invertColorsCheckbox.checked;
    applyInvertColors();
    syncCheatsMenuState();
  });
}

if (videoFxCheckbox){
  videoFxCheckbox.addEventListener("change", () => {
    VIDEO_FX_ENABLED = !!videoFxCheckbox.checked;
    syncCheatsMenuState();
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
  const raw = String(inputEl.value || "").trim().toLowerCase();
  if (raw === "infinite" || raw === "inf" || raw === "∞"){
    inputEl.value = "INFINITE";
    return;
  }
  let value = parseInt(raw, 10);
  if (!Number.isFinite(value)) value = Number.isFinite(min) ? min : 0;
  if (Number.isFinite(min)) value = Math.max(min, value);
  if (Number.isFinite(max)) value = Math.min(max, value);
  inputEl.value = value >= 100 ? "INFINITE" : String(value);
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

function formatResourceOptionValue(inputEl){
  const raw = String(inputEl && inputEl.value || "").trim().toLowerCase();
  const n = parseInt(raw, 10);
  return raw === "infinite" || raw === "inf" || raw === "∞" || n >= 100 ? "INFINITE" : String(Number.isFinite(n) ? n : 0);
}

function parseResourceOption(inputEl, minValue){
  const raw = String(inputEl && inputEl.value || "").trim().toLowerCase();
  const n = parseInt(raw, 10);
  if (raw === "infinite" || raw === "inf" || raw === "∞" || n >= 100) return { value: 100, infinite: true };
  return { value: Math.max(minValue || 0, Number.isFinite(n) ? n : (minValue || 0)), infinite: false };
}

function syncStartOptionsLabels(){
    if (typeof clampNumericInput === "function") { clampNumericInput(livesSlider); clampNumericInput(heartsSlider); clampNumericInput(shieldsSlider); clampNumericInput(bombsSlider); }
    if (livesVal && livesSlider) livesVal.textContent = formatResourceOptionValue(livesSlider);
    if (heartsVal && heartsSlider) heartsVal.textContent = formatResourceOptionValue(heartsSlider);
    if (shieldsVal && shieldsSlider) shieldsVal.textContent = formatResourceOptionValue(shieldsSlider);
    if (bombsVal && bombsSlider) bombsVal.textContent = formatResourceOptionValue(bombsSlider);
    if (speedVal && speedSlider) speedVal.textContent = speedSlider.value;
    syncRangeProgress(speedSlider);
    if (startWaveLabel && startWaveSelect) startWaveLabel.textContent = getStartWaveText(startWaveSelect.value);
  }

  [livesSlider, heartsSlider, shieldsSlider, bombsSlider, speedSlider].forEach(s => {
    s.addEventListener("input", syncStartOptionsLabels);
    s.addEventListener("change", syncStartOptionsLabels);
  });
  if (startWaveSelect) startWaveSelect.addEventListener("change", syncStartOptionsLabels);
  syncStartOptionsLabels();
  syncCheatsMenuState();

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
let controlsMoveFocusIndex = 0;
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
function formatCompactMoveBinding(value){
  if (controlsBindMode === INPUT_MODE_CONTROLLER){
    const map = {12:"D↑", 13:"D↓", 14:"D←", 15:"D→"};
    return map[value] || formatControllerBinding(value);
  }
  return formatKeyboardBinding(value);
}
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
  if (controlsMenuTitle){
    controlsMenuTitle.textContent = controlsBindMode === INPUT_MODE_CONTROLLER ? 'Controller Keybinds' : 'Keyboard / Mouse Controls';
  }
  if (controlsFixedInfo){
    controlsFixedInfo.textContent = '';
  }
}
function setActiveInputMode(mode){
  const nextMode = mode === INPUT_MODE_CONTROLLER ? INPUT_MODE_CONTROLLER : INPUT_MODE_KEYBOARD;
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
function getCurrentBindingDefs(){ return controlsBindMode === INPUT_MODE_CONTROLLER ? CONTROLLER_BIND_ACTIONS : KEYBOARD_BIND_ACTIONS; }
function getCurrentBindingValue(action){ return controlsBindMode === INPUT_MODE_CONTROLLER ? draftControllerBindings[action] : draftKeyboardBindings[action]; }
function setControlsBindStatus(message){ if (controlsBindStatus) controlsBindStatus.textContent = message; }
const MOVE_BIND_ACTIONS = ["moveUp", "moveDown", "moveLeft", "moveRight"];
const MOVE_BIND_LABELS = { moveUp: "Up", moveDown: "Down", moveLeft: "Left", moveRight: "Right" };
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
      button.textContent = `${label}: ${binding}`;
      if (bindingEditState && bindingEditState.scheme === controlsBindMode && bindingEditState.action === def.key){
        button.classList.add('listening');
        button.textContent = `${label}: Press input...`;
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
    hint.textContent = controlsBindMode === INPUT_MODE_CONTROLLER ? 'Aim stays on Right Stick.' : 'Aim stays on Mouse / Touch.';
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
let startingStatFocusIndex = 0;
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

if (controlsResetBinds) controlsResetBinds.addEventListener('click', () => { draftKeyboardBindings = { ...DEFAULT_KEYBOARD_BINDINGS }; draftControllerBindings = { ...DEFAULT_CONTROLLER_BINDINGS }; cancelBindingEdit('Draft reset to defaults. Press Apply to save.'); updateControlsDisplay(); renderControlsBindingList(); });
if (controlsApplyBinds) controlsApplyBinds.addEventListener('click', () => { applyDraftBindings(); cancelBindingEdit('Bindings applied and saved.'); updateControlsDisplay(); renderControlsBindingList(); if (pauseControlsOpen && isPaused) hidePauseControlsMenu(); });
if (controlsBack) controlsBack.addEventListener('click', hideControlsMenu);

function getMenuControllerTargets(){
  return [btnStart, btnOptions, btnControls].filter(Boolean);
}

function getStartingStatInputs(){
  return [heartsSlider, shieldsSlider, livesSlider, bombsSlider].filter(Boolean);
}

function getOptionsControllerTargets(){
  // Treat the four starting-stat number boxes as one vertical controller row.
  // Up/down enters/leaves the row; left/right chooses Hearts/Shields/Lives/Bombs.
  const statRowTarget = getStartingStatInputs()[startingStatFocusIndex] || getStartingStatInputs()[0];
  return [startWaveSelect, statRowTarget, speedSlider, btnCheats, btnBack, btnApply].filter(Boolean);
}

function getCheatsControllerTargets(){
  const skipTarget = (typeof btnSkipToLevel2 !== "undefined") ? btnSkipToLevel2 : null;
  return [infiniteToggle, invertColorsCheckbox, videoFxCheckbox, skipTarget, btnCheatsBack].filter(Boolean);
}

function getControlsControllerTargets(){
  const moveButtons = getControlsMoveButtons();
  const moveTarget = moveButtons[controlsMoveFocusIndex] || moveButtons[0];
  const otherBindButtons = Array.from(document.querySelectorAll('#controlsMenu .controlsBindButton:not(.controlsMoveButton)'));
  return [moveTarget, ...otherBindButtons, controlsBack, controlsResetBinds, controlsApplyBinds].filter(Boolean);
}

function getPauseControllerTargets(){
  return [btnPauseResume, btnPauseOpenChat, btnPauseQuit].filter(Boolean);
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

function syncPauseControllerFocus(){
  const items = getPauseControllerTargets();
  if (!items.length) return;
  pauseFocusIndex = Math.max(0, Math.min(pauseFocusIndex, items.length - 1));
  focusControllerElement(items[pauseFocusIndex]);
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

function movePauseControllerFocus(delta){
  const items = getPauseControllerTargets();
  if (!items.length) return;
  pauseFocusIndex = (pauseFocusIndex + delta + items.length) % items.length;
  syncPauseControllerFocus();
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
  syncOptionsControllerFocus();
  return true;
}

function isStartingStatFocused(){
  const statInputs = getStartingStatInputs();
  return statInputs.includes(getOptionsControllerTargets()[optionsFocusIndex]);
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
  inputEl.value = next >= 100 ? 'INFINITE' : String(next);
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
  if (el.type === 'number') return stepNumberInput(el, delta);
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
  // v1.96: drop shield when entering menus
  mouseShieldHolding = false;
  stopShield(false);

  deathOverlay.style.display = "none";
  if (winOverlay) winOverlay.style.display = "none";
  // v1.96: HUD should not appear on the menu
  livesSlot.style.display = "none";
  powerupSlot.style.display = "none";
  if (timerHud) timerHud.style.display = "none";
  { const heartsHud = getHeartsHudEl(); if (heartsHud) heartsHud.style.display = "none"; }

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

function showControlsMenu(){
  if (!controlsMenu || startMenu.style.display === "none") return;
  setPaused(false);
  pauseControlsOpen = false;
  pauseOverlay.classList.remove("pauseControlsVisible");
  uiRoot.classList.remove("pauseControlsOpen");
  gameState = STATE.CONTROLS;
  resetDraftBindingsFromActive();
  setControlsBindMode(activeInputMode);
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

function showWinOverlay(){
  gameWon = true;
  gameState = STATE.WIN;
  if (winOverlay) winOverlay.style.display = "flex";
  if (pauseOverlay) pauseOverlay.style.display = "none";
  livesSlot.style.display = "none";
  powerupSlot.style.display = "none";
  if (timerHud) timerHud.style.display = "none";
  { const heartsHud = getHeartsHudEl(); if (heartsHud) heartsHud.style.display = "none"; }
  stopMusic();
  if (activeInputMode === INPUT_MODE_CONTROLLER) syncWinControllerFocus();
  else clearControllerFocus();
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
function showOptions(){
  setPaused(false);
  gameState = STATE.OPTIONS;
    // v1.96: populate start options UI with saved settings
  livesSlider.value = START_LIVES_INFINITE ? "INFINITE" : START_LIVES;
  heartsSlider.value = START_HEARTS_INFINITE ? "INFINITE" : START_HEARTS;
  shieldsSlider.value = START_SHIELDS_INFINITE ? "INFINITE" : START_SHIELDS;
  bombsSlider.value = START_BOMBS_INFINITE ? "INFINITE" : START_BOMBS;
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
  { const heartsHud = getHeartsHudEl(); if (heartsHud) heartsHud.style.display = "none"; }

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
  { const heartsHud = getHeartsHudEl(); if (heartsHud) heartsHud.style.display = "block"; }

  // v1.96.x: Reset run timer at the start of each game
  runTimer = 0;
  updateTimerHUD();
  score = 0;
  frogKills = 0;
  shotsFired = 0;
  hitsConnected = 0;
  damageDealt = 0;
  bombDragonKills = 0;
  bombFrogKills = 0;
  // v1.96: Apply starting settings from OPTIONS menu
  infiniteModeActive = !!INFINITE_MODE;
  livesInfiniteActive = !!START_LIVES_INFINITE || !!INFINITE_MODE;
  heartsInfiniteActive = !!START_HEARTS_INFINITE || !!INFINITE_MODE;
  shieldsInfiniteActive = !!START_SHIELDS_INFINITE || !!INFINITE_MODE;
  bombsInfiniteActive = !!START_BOMBS_INFINITE || !!INFINITE_MODE;

  lives = livesInfiniteActive ? 100 : Math.max(0, parseInt(START_LIVES, 10) || 0);
  livesText.textContent = livesInfiniteActive ? "x∞" : ("x" + lives);

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

  // Only begin the level music after Wave 1 gameplay has actually spawned.
  pendingWaveStartMusic = true;

  clearControllerFocus();
  window.focus();
}

btnStart.addEventListener("click", startGame);
btnOptions.addEventListener("click", showOptions);
if (btnControls) btnControls.addEventListener("click", showControlsMenu);
if (btnCheats) btnCheats.addEventListener("click", showCheats);
if (btnCheatsBack) btnCheatsBack.addEventListener("click", hideCheats);
btnBack.addEventListener("click", showMenu);
btnApply.addEventListener("click", () => {
  // v1.96: Save start settings (lives/hearts/shields/bombs + infinite)
  {
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
  }
  // v1.96: Save game speed (1-10), where 5 = normal.
  START_GAME_SPEED = (speedSlider ? parseInt(speedSlider.value, 10) : 5);
  GAME_SPEED_MULT = Math.max(0.1, Math.min(3.0, START_GAME_SPEED / 5));
  START_WAVE = startWaveSelect ? (parseInt(startWaveSelect.value, 10) || 1) : 1;
  syncCheatsMenuState();

  // Keep the UI labels in sync and return to the main menu.
  syncStartOptionsLabels();
  showMenu();
});

btnRestart.addEventListener("click", () => {
  restartRun();
});

if (btnContinue){
  btnContinue.addEventListener("click", () => {
    if (window.parent && window.parent !== window){
      try{
        window.parent.postMessage({ type: "tektite:continue-to-level2" }, "*");
        return;
      }catch(err){
        console.warn("Failed to notify parent iframe host about level transition.", err);
      }
    }

    if (winOverlay) winOverlay.style.display = "none";
  });
}


function setAssetStatus(msg){ assetStatus.textContent = msg; }

