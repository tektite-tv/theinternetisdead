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

function consumeMenuAxis(direction, active, dt){
  const repeatKey = direction;
  if (!active){
    gpNavRepeat[repeatKey] = 0;
    return false;
  }
  if (gpNavRepeat[repeatKey] <= 0){
    gpNavRepeat[repeatKey] = GP_MENU_REPEAT_DELAY;
    return true;
  }
  gpNavRepeat[repeatKey] -= dt;
  if (gpNavRepeat[repeatKey] <= 0){
    gpNavRepeat[repeatKey] = GP_MENU_REPEAT_RATE;
    return true;
  }
  return false;
}

function postChatControllerAction(action){
  try{
    if (window.parent && window.parent !== window){
      window.parent.postMessage({ type: "tektite:chat-control", action }, "*");
    }
  }catch(e){}
}

function pollGamepad(dt){
  const gp = getGamepad();
  gpIsConnected = !!gp;
  gpHasAnyInput = false;

  gpMoveX = 0;
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

  const dUp = gpBtn(gp, 12).pressed;
  const dDown = gpBtn(gp, 13).pressed;
  const dLeft = gpBtn(gp, 14).pressed;
  const dRight = gpBtn(gp, 15).pressed;

  gpMoveX = Math.max(-1, Math.min(1, lx + (dLeft ? -1 : 0) + (dRight ? 1 : 0)));
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
  const pressMenuBack = gpEdge(controllerBindings.menuBack, getGpActionPressed(gp, 'menuBack'));
  const pressMenuSelect = gpEdge(controllerBindings.menuSelect, getGpActionPressed(gp, 'menuSelect'));
  const pressFullscreen = gpEdge(controllerBindings.fullscreen, getGpActionPressed(gp, 'fullscreen'));
  const pressBomb = gpEdge(controllerBindings.bomb, getGpActionPressed(gp, 'bomb'));
  const pressMuteHud = gpEdge(controllerBindings.muteHud, getGpActionPressed(gp, 'muteHud'));
  const pressY = gpEdge(3, y);

  if ((gpHasAnyInput || pressMenuSelect || pressMenuBack || pressY || pressPause || pressMuteHud || pressFullscreen || pressBomb) && !audioUnlocked){
    unlockAudioOnce();
  }

  const navUp = consumeMenuAxis('up', dUp || ly < -GP_MENU_AXIS_THRESHOLD, dt);
  const navDown = consumeMenuAxis('down', dDown || ly > GP_MENU_AXIS_THRESHOLD, dt);
  const navLeft = consumeMenuAxis('left', dLeft || lx < -GP_MENU_AXIS_THRESHOLD, dt);
  const navRight = consumeMenuAxis('right', dRight || lx > GP_MENU_AXIS_THRESHOLD, dt);
  // Options menu: right stick changes number values without dragging focus around like a caffeinated raccoon.
  const rNavUp = consumeMenuAxis('rUp', ry < -GP_MENU_AXIS_THRESHOLD, dt);
  const rNavDown = consumeMenuAxis('rDown', ry > GP_MENU_AXIS_THRESHOLD, dt);

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
    if (pressMuteHud){
      hudVisible = !hudVisible;
      overlay.style.display = hudVisible ? "block" : "none";
    }
    if (pressFullscreen){
      toggleFullscreen();
    }
    if (isPaused && parentChatVisible){
      if (navUp) postChatControllerAction('cycleUp');
      if (navDown) postChatControllerAction('cycleDown');
      if (navLeft) postChatControllerAction('cycleLeft');
      if (navRight) postChatControllerAction('cycleRight');
      if (pressMenuSelect) postChatControllerAction('execute');
      if (pressMenuBack) postChatControllerAction('close');
    } else if (isPaused){
      if (pauseControlsOpen){
        if (navUp || navLeft) moveControlsControllerFocus(-1);
        if (navDown || navRight) moveControlsControllerFocus(1);
        if (pressMenuSelect) activateControllerTarget(getControlsControllerTargets()[controlsFocusIndex]);
        if (pressMenuBack){
          if (bindingEditState) cancelBindingEdit('Binding cancelled.');
          else hidePauseControlsMenu();
        }
        if (pressPause) togglePause();
      } else {
        if (navUp || navLeft) movePauseControllerFocus(-1);
        if (navDown || navRight) movePauseControllerFocus(1);
        if (pressMenuSelect) activateControllerTarget(getPauseControllerTargets()[pauseFocusIndex]);
        if (pressMenuBack) requestOpenChatFromPause();
        if (pressPause) togglePause();
      }
    } else if (gameState === STATE.MENU){
      if (navLeft){
        if (menuFocusIndex === 1) menuFocusIndex = 0;
        else if (menuFocusIndex === 2) menuFocusIndex = 0;
        if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
  else clearControllerFocus();
      }
      if (navRight){
        if (menuFocusIndex === 0) menuFocusIndex = 1;
        else if (menuFocusIndex === 2) menuFocusIndex = 1;
        if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
  else clearControllerFocus();
      }
      if (navDown){
        if (menuFocusIndex === 0 || menuFocusIndex === 1) menuFocusIndex = 2;
        else menuFocusIndex = 0;
        if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
  else clearControllerFocus();
      }
      if (navUp){
        if (menuFocusIndex === 2) menuFocusIndex = 0;
        else menuFocusIndex = 2;
        if (activeInputMode === INPUT_MODE_CONTROLLER) syncMenuControllerFocus();
  else clearControllerFocus();
      }
      if (pressMenuSelect) activateControllerTarget(getMenuControllerTargets()[menuFocusIndex]);
      if (pressMenuBack && bindingEditState) cancelBindingEdit('Binding cancelled.');
      if (pressY) showOptions();
    } else if (gameState === STATE.OPTIONS){
      if (navUp) moveOptionsControllerFocus(-1);
      if (navDown) moveOptionsControllerFocus(1);
      if (typeof isStartingStatFocused === "function" && isStartingStatFocused()){
        if (navLeft) moveStartingStatFocus(-1);
        if (navRight) moveStartingStatFocus(1);
        if (rNavUp) adjustControllerOption(1);
        if (rNavDown) adjustControllerOption(-1);
      } else {
        if (navLeft) adjustControllerOption(-1);
        if (navRight) adjustControllerOption(1);
        if (rNavUp) adjustControllerOption(1);
        if (rNavDown) adjustControllerOption(-1);
      }
      if (pressMenuSelect) activateControllerTarget(getOptionsControllerTargets()[optionsFocusIndex]);
      if (pressMenuBack) showMenu();
    } else if (gameState === STATE.CONTROLS){
      if (navUp || navLeft) moveControlsControllerFocus(-1);
      if (navDown || navRight) moveControlsControllerFocus(1);
      if (pressMenuSelect) activateControllerTarget(getControlsControllerTargets()[controlsFocusIndex]);
      if (pressMenuBack){
        if (bindingEditState) cancelBindingEdit('Binding cancelled.');
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
      if (pressBomb) dropBomb();
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
   Input
======================= */

// Prevent right-click context menu so holding RMB can be used for shield.
window.addEventListener("contextmenu", (e) => {
  if (e.target === canvas) e.preventDefault();
}, { passive:false });


function toggleFullscreen(){
  if (requestHostFullscreen("toggle")) return;
  const elem = document.documentElement;
  if (!document.fullscreenElement){
    if (elem.requestFullscreen) elem.requestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}

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
  if (e.code === "Tab" && !typingIntoField){ triggerGlitchSpiral(); e.preventDefault(); }
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
  if (!(bindingEditState && bindingEditState.scheme === INPUT_MODE_KEYBOARD)) return;
  e.preventDefault();
  e.stopPropagation();
  setActiveInputMode(INPUT_MODE_KEYBOARD);
  applyBindingValue(INPUT_MODE_KEYBOARD, bindingEditState.action, mouseButtonToBinding(e.button));
}, true);

canvas.addEventListener("pointermove", (e) => {
  setActiveInputMode(INPUT_MODE_KEYBOARD);
  // v1.96: aim follows pointer (mouse or touch)
  setAimFromClient(e.clientX, e.clientY);
});

canvas.addEventListener("pointerdown", (e) => {
  setActiveInputMode(INPUT_MODE_KEYBOARD);
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

