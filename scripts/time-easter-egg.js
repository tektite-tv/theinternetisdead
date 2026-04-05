(function () {
  const CHECK_INTERVAL_MS = 1000;
  const TARGET_TIMES = new Set(['04:20', '16:20', '07:10', '19:10']);
  const STORAGE_KEY = 'time-easter-egg-last-trigger';
  const POPUP_ID = 'time-easter-egg-popup';

  function isIndexPage() {
    const path = String(window.location.pathname || '').toLowerCase();
    return path === '/' || path === '/index.html' || path.endsWith('/index.html');
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function getMinuteKey(date) {
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      pad(date.getHours()),
      pad(date.getMinutes())
    ].join('-');
  }

  function formatDisplayTime(date) {
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
  }

  function removePopup() {
    const existing = document.getElementById(POPUP_ID);
    if (existing) existing.remove();
  }

  function showPopup(displayTime) {
    removePopup();

    const popup = document.createElement('div');
    popup.id = POPUP_ID;
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.innerHTML = `
      <div class="time-easter-egg-backdrop"></div>
      <div class="time-easter-egg-panel">
        <div class="time-easter-egg-title">Congratulations! You just happened to be on my site at ${displayTime}</div>
        <button type="button" class="time-easter-egg-button">Click Here To Do Nothing</button>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #${POPUP_ID} {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        font-family: "Courier New", Courier, monospace;
      }
      #${POPUP_ID} .time-easter-egg-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
      }
      #${POPUP_ID} .time-easter-egg-panel {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: min(92vw, 560px);
        background: rgba(20, 0, 34, 0.96);
        color: #00ff66;
        border: 2px solid currentColor;
        box-shadow: 0 0 28px rgba(0, 255, 102, 0.28);
        padding: 22px 20px 18px;
        text-align: center;
      }
      #${POPUP_ID} .time-easter-egg-title {
        font-size: clamp(18px, 2.2vw, 28px);
        line-height: 1.35;
        margin-bottom: 16px;
        text-shadow: 0 0 8px rgba(0, 255, 102, 0.3);
      }
      #${POPUP_ID} .time-easter-egg-button {
        border: 2px solid currentColor;
        background: #000;
        color: #00ff66;
        font: inherit;
        padding: 10px 14px;
        cursor: pointer;
      }
      #${POPUP_ID} .time-easter-egg-button:hover,
      #${POPUP_ID} .time-easter-egg-button:focus-visible {
        filter: hue-rotate(120deg);
        outline: none;
      }
    `;
    popup.appendChild(style);

    popup.querySelector('.time-easter-egg-button').addEventListener('click', removePopup);
    popup.querySelector('.time-easter-egg-backdrop').addEventListener('click', removePopup);
    document.body.appendChild(popup);
  }

  function triggerColorParty() {
    try {
      if (typeof window.setRandomizeTintOpacitiesFull === 'function') {
        window.setRandomizeTintOpacitiesFull();
      }
      if (typeof window.setPageAutoShuffleEnabled === 'function') {
        window.setPageAutoShuffleEnabled(true);
      }
      if (typeof window.setPageGlobalHueShift === 'function') {
        window.setPageGlobalHueShift(true);
      }
      if (typeof window.sendPageCustomizePanel === 'function') {
        window.sendPageCustomizePanel({ includeBaseCustomize: false, announce: false });
      }
    } catch (error) {
      console.error('Time easter egg could not enable color party mode:', error);
    }
  }

  function maybeTrigger() {
    if (!isIndexPage() || document.hidden) return;

    const now = new Date();
    const timeKey = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (!TARGET_TIMES.has(timeKey)) return;

    const minuteKey = getMinuteKey(now);
    if (sessionStorage.getItem(STORAGE_KEY) === minuteKey) return;
    sessionStorage.setItem(STORAGE_KEY, minuteKey);

    triggerColorParty();
    showPopup(formatDisplayTime(now));
  }

  window.addEventListener('visibilitychange', () => {
    if (!document.hidden) maybeTrigger();
  });

  window.addEventListener('load', () => {
    maybeTrigger();
    window.setInterval(maybeTrigger, CHECK_INTERVAL_MS);
  });
})();
