(function () {
  const TARGET_PATHS = new Set(['/', '/index.html']);
  if (!TARGET_PATHS.has(window.location.pathname)) return;

  const TARGET_TIMES = new Set(['04:20', '07:10', '16:20', '19:10']);
  const CHECK_INTERVAL_MS = 5000;
  const RETRY_INTERVAL_MS = 1500;
  const COMMAND_DELAY_MS = 500;
  const COMMAND_SEQUENCE = ['/color_party', '/subscribe', '/dvd_infinite'];

  let popupVisible = false;
  let pendingTriggerDate = null;
  let pendingCommandId = null;
  let retryIntervalId = null;
  let sequenceIndex = -1;
  let waitingForCommand = false;
  let nextCommandTimeoutId = null;

  function getTimeKey(date = new Date()) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function formatDisplayTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function getMinuteStorageKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timeKey = getTimeKey(date);
    return `timeEasterEgg:${year}-${month}-${day}:${timeKey}`;
  }

  function createPopup(timeLabel) {
    if (popupVisible) return;
    popupVisible = true;

    const existing = document.getElementById('time-easter-egg-popup');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'time-easter-egg-popup';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="time-easter-egg-backdrop"></div>
      <div class="time-easter-egg-panel">
        <div class="time-easter-egg-message">Congratulations! You just happened to be on my site at ${timeLabel}</div>
        <button type="button" class="time-easter-egg-button">Click Here To Do Nothing</button>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #time-easter-egg-popup {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Courier New", Courier, monospace;
      }
      #time-easter-egg-popup .time-easter-egg-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.68);
        backdrop-filter: blur(4px);
      }
      #time-easter-egg-popup .time-easter-egg-panel {
        position: relative;
        width: min(92vw, 560px);
        background: rgba(0, 0, 0, 0.92);
        color: #00ff66;
        border: 2px solid #00ff66;
        box-shadow: 0 0 24px rgba(0, 255, 102, 0.35);
        padding: 24px;
        text-align: center;
      }
      #time-easter-egg-popup .time-easter-egg-message {
        font-size: clamp(18px, 2.2vw, 28px);
        line-height: 1.35;
        margin-bottom: 18px;
      }
      #time-easter-egg-popup .time-easter-egg-button {
        font: inherit;
        color: #00ff66;
        background: rgba(0, 255, 102, 0.08);
        border: 1px solid #00ff66;
        padding: 10px 18px;
        cursor: pointer;
      }
      #time-easter-egg-popup .time-easter-egg-button:hover,
      #time-easter-egg-popup .time-easter-egg-button:focus-visible {
        background: rgba(0, 255, 102, 0.16);
        outline: none;
      }
    `;
    overlay.appendChild(style);

    const close = () => {
      popupVisible = false;
      overlay.remove();
    };

    overlay.querySelector('.time-easter-egg-button')?.addEventListener('click', close);
    document.body.appendChild(overlay);
  }

  function clearNextCommandTimeout() {
    if (nextCommandTimeoutId !== null) {
      window.clearTimeout(nextCommandTimeoutId);
      nextCommandTimeoutId = null;
    }
  }

  function stopRetryLoop() {
    if (retryIntervalId !== null) {
      window.clearInterval(retryIntervalId);
      retryIntervalId = null;
    }
  }

  function resetPendingSequence() {
    clearNextCommandTimeout();
    waitingForCommand = false;
    sequenceIndex = -1;
    pendingTriggerDate = null;
    pendingCommandId = null;
    stopRetryLoop();
  }

  function getChatWindow() {
    const frame = document.getElementById('chat-sandbox-frame');
    return frame && frame.contentWindow ? frame.contentWindow : null;
  }

  function sendCurrentCommand() {
    const chatWindow = getChatWindow();
    const command = COMMAND_SEQUENCE[sequenceIndex];
    if (!chatWindow || !pendingTriggerDate || !pendingCommandId || !command) return false;
    waitingForCommand = true;
    chatWindow.postMessage({
      type: 'chatSandboxExecuteCommand',
      command,
      commandId: pendingCommandId,
      openChat: false,
      focus: false
    }, '*');
    return true;
  }

  function queueNextCommand() {
    clearNextCommandTimeout();
    nextCommandTimeoutId = window.setTimeout(() => {
      nextCommandTimeoutId = null;
      sequenceIndex += 1;
      if (sequenceIndex >= COMMAND_SEQUENCE.length) {
        if (!pendingTriggerDate) {
          resetPendingSequence();
          return;
        }
        const storageKey = getMinuteStorageKey(pendingTriggerDate);
        sessionStorage.setItem(storageKey, '1');
        createPopup(formatDisplayTime(pendingTriggerDate));
        resetPendingSequence();
        return;
      }
      sendCurrentCommand();
    }, sequenceIndex < 0 ? 0 : COMMAND_DELAY_MS);
  }

  function ensureRetryLoop() {
    if (retryIntervalId !== null) return;
    retryIntervalId = window.setInterval(() => {
      if (!pendingTriggerDate || !pendingCommandId) {
        resetPendingSequence();
        return;
      }
      if (getTimeKey(new Date()) !== getTimeKey(pendingTriggerDate)) {
        resetPendingSequence();
        return;
      }
      if (!waitingForCommand) {
        queueNextCommand();
        return;
      }
      sendCurrentCommand();
    }, RETRY_INTERVAL_MS);
  }

  function queueTrigger(date = new Date()) {
    pendingTriggerDate = new Date(date.getTime());
    pendingCommandId = `time-easter-egg-${date.getTime()}`;
    sequenceIndex = -1;
    waitingForCommand = false;
    queueNextCommand();
    ensureRetryLoop();
  }

  function attemptTrigger(date = new Date()) {
    const storageKey = getMinuteStorageKey(date);
    if (sessionStorage.getItem(storageKey) === '1') return;
    if (pendingTriggerDate && getTimeKey(pendingTriggerDate) === getTimeKey(date)) return;

    const timeKey = getTimeKey(date);
    if (!TARGET_TIMES.has(timeKey)) return;
    queueTrigger(date);
  }

  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'chatSandboxState') {
      if (pendingTriggerDate && pendingCommandId && !waitingForCommand) {
        queueNextCommand();
        ensureRetryLoop();
      }
      return;
    }

    if (event.data.type !== 'chatSandboxCommandResult') return;
    if (!pendingCommandId || event.data.commandId !== pendingCommandId) return;
    if (!pendingTriggerDate) return;

    const expectedCommand = COMMAND_SEQUENCE[sequenceIndex];
    if (!expectedCommand || event.data.command !== expectedCommand) return;

    if (!event.data.ok) {
      waitingForCommand = false;
      ensureRetryLoop();
      return;
    }

    waitingForCommand = false;
    queueNextCommand();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      attemptTrigger();
      window.setInterval(attemptTrigger, CHECK_INTERVAL_MS);
    }, { once: true });
  } else {
    attemptTrigger();
    window.setInterval(attemptTrigger, CHECK_INTERVAL_MS);
  }
})();
