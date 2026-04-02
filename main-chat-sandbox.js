const focusSink = document.getElementById('focusSink');
    const chatBar = document.getElementById('chatBar');
    const messages = document.getElementById('messages');
    const messagesWrap = document.getElementById('messagesWrap');
    const chatBarWrap = document.getElementById('chatBarWrap');
    const chatClose = document.getElementById('chatClose');
    const iframeOverlay = document.getElementById('iframeOverlay');
    const iframeOverlayFrame = document.getElementById('iframeOverlayFrame');
    const iframeOverlayTitle = document.getElementById('iframeOverlayTitle');
    const iframeOverlayOpen = document.getElementById('iframeOverlayOpen');
    const iframeOverlayClose = document.getElementById('iframeOverlayClose');
    const mediaOverlay = document.getElementById('mediaOverlay');
    const mediaOverlayBody = document.getElementById('mediaOverlayBody');
    const mediaOverlayTitle = document.getElementById('mediaOverlayTitle');
    const mediaOverlayOpen = document.getElementById('mediaOverlayOpen');
    const mediaOverlayClose = document.getElementById('mediaOverlayClose');
    const imageUploadInput = document.getElementById('imageUploadInput');
    const videoUploadInput = document.getElementById('videoUploadInput');
    const audioUploadInput = document.getElementById('audioUploadInput');
    const imageFolderInput = document.getElementById('imageFolderInput');
    const videoFolderInput = document.getElementById('videoFolderInput');
    const audioFolderInput = document.getElementById('audioFolderInput');
    const uploadFileInput = document.getElementById('uploadFileInput');
    const uploadFolderInput = document.getElementById('uploadFolderInput');
    const settingsLoadInput = document.getElementById('settingsLoadInput');
    const scriptLoadInput = document.getElementById('scriptLoadInput');

    let currentNickname = 'User';
    let showSystemPrefix = false;
    let debugMode = false;
    let scriptRunCounter = 0;
    let activeScriptRun = null;
    const scriptRuns = [];

    const customizeDefaults = {
      fontFamily: '"Courier New", Courier, monospace',
      fontScalePercent: 100,
      colors: {
        '--chatbar-bg': { color: '#ffffff', opacityPercent: 100, fallback: { r: 255, g: 255, b: 255, a: 1 } },
        '--chatbar-text': { color: '#000000', opacityPercent: 100, fallback: { r: 0, g: 0, b: 0, a: 1 } },
        '--message-text-color': { color: '#ffffff', opacityPercent: 100, fallback: { r: 255, g: 255, b: 255, a: 1 } },
        '--document-bg': { color: '#000000', opacityPercent: 100, fallback: { r: 0, g: 0, b: 0, a: 1 } },
        '--messages-bg': { color: '#000000', opacityPercent: 0, fallback: { r: 0, g: 0, b: 0, a: 0 } },
        '--chat-bg': { color: '#000000', opacityPercent: 100, fallback: { r: 0, g: 0, b: 0, a: 1 } },
        '--nickname-color': { color: '#ffffff', opacityPercent: 100, fallback: { r: 255, g: 255, b: 255, a: 1 } },
      }
    };
    const customizeBindingSets = new Set();
    let autoShuffleIntervalId = null;
    const autoShuffleIntervalMs = 2000;
    let globalColorInvertEnabled = false;
    let globalHueShiftEnabled = false;
    let globalHueShiftFrameId = null;
    let globalHueShiftStartTime = 0;
    let globalHueShiftFrozenAngle = null;
    const globalHueShiftDurationMs = 4000;
    const commandHueShiftDurationMs = 3000;

    let inputHistory = [];
    let historyIndex = -1;
    let historyDraft = '';
    let chatInputArmed = false;

    const builtInCommandList = ['/clear', '/color_hueshift', '/color_invert', '/customize', '/debug', '/help', '/iframe', '/script_load', '/settings_load', '/nickname', '/color_randomize', '/color_reset', '/settings_save', '/screenshot', '/stop', '/upload_file', '/upload_folder'];
    let pageCommandRegistry = [];
    let pageCommandMeta = { pageOnly: false, pageId: '', title: '', sourceKey: '' };
    let pendingPageCommand = null;
    let commandCycleIndex = -1;
    let commandCyclePrefix = '';

    function scrollToBottom() {
      messagesWrap.scrollTop = messagesWrap.scrollHeight;
    }

    function updateMessagesVisibility() {
      const visibleMessages = Array.from(messages.children).filter((child) => child.style.display !== 'none');
      messagesWrap.classList.toggle('visible', visibleMessages.length > 0);
    }

    function getCurrentGlobalHueShiftAngle(now = performance.now()) {
      if (globalHueShiftEnabled) {
        return (((now - globalHueShiftStartTime) % globalHueShiftDurationMs) / globalHueShiftDurationMs) * 360;
      }
      return globalHueShiftFrozenAngle;
    }

    function freezeGlobalHueShiftAtCurrentAngle(now = performance.now()) {
      globalHueShiftFrozenAngle = getCurrentGlobalHueShiftAngle(now) ?? 0;
      globalHueShiftEnabled = false;
      document.body.classList.remove('global-hueshift');
      stopGlobalHueShiftLoop();
      renderGlobalColorEffects();
    }

    function renderGlobalColorEffects() {
      const hueAngle = getCurrentGlobalHueShiftAngle();
      const filterParts = [];
      if (globalColorInvertEnabled) {
        filterParts.push('invert(1)');
      }
      if (typeof hueAngle === 'number') {
        filterParts.push(`hue-rotate(${hueAngle}deg)`);
      }
      document.body.style.filter = filterParts.length ? filterParts.join(' ') : 'none';
    }

    function renderCommandHueShiftFrame(now = performance.now()) {
      const progress = (now % commandHueShiftDurationMs) / commandHueShiftDurationMs;
      document.documentElement.style.setProperty('--command-shift-position', `${(progress * 300).toFixed(3)}%`);
      document.documentElement.style.setProperty('--command-shift-rotate', `${(progress * 360).toFixed(3)}deg`);
      requestAnimationFrame(renderCommandHueShiftFrame);
    }

    function stopGlobalHueShiftLoop() {
      if (globalHueShiftFrameId !== null) {
        cancelAnimationFrame(globalHueShiftFrameId);
        globalHueShiftFrameId = null;
      }
    }

    function runGlobalHueShiftLoop() {
      renderGlobalColorEffects();
      if (!globalHueShiftEnabled) {
        stopGlobalHueShiftLoop();
        return;
      }
      globalHueShiftFrameId = requestAnimationFrame(runGlobalHueShiftLoop);
    }

    function setGlobalColorInvert(enabled) {
      globalColorInvertEnabled = !!enabled;
      document.body.classList.toggle('global-color-invert', globalColorInvertEnabled);
      renderGlobalColorEffects();
    }

    function setGlobalHueShift(enabled) {
      const shouldEnable = !!enabled;
      if (shouldEnable === globalHueShiftEnabled && !(shouldEnable && globalHueShiftFrozenAngle !== null)) {
        if (!shouldEnable) {
          globalHueShiftFrozenAngle = null;
        }
        renderGlobalColorEffects();
        return;
      }
      globalHueShiftEnabled = shouldEnable;
      document.body.classList.toggle('global-hueshift', globalHueShiftEnabled);
      if (globalHueShiftEnabled) {
        const startingAngle = globalHueShiftFrozenAngle;
        globalHueShiftFrozenAngle = null;
        globalHueShiftStartTime = performance.now() - (((startingAngle ?? 0) / 360) * globalHueShiftDurationMs);
        stopGlobalHueShiftLoop();
        runGlobalHueShiftLoop();
      } else {
        globalHueShiftFrozenAngle = null;
        stopGlobalHueShiftLoop();
        renderGlobalColorEffects();
      }
    }

    function toggleGlobalColorInvert() {
      setGlobalColorInvert(!globalColorInvertEnabled);
      return globalColorInvertEnabled;
    }

    function toggleGlobalHueShift() {
      setGlobalHueShift(!globalHueShiftEnabled);
      return globalHueShiftEnabled;
    }

    function clearStrayFocus() {
      if (document.activeElement && document.activeElement !== document.body && document.activeElement !== focusSink) {
        document.activeElement.blur();
      }
      if (window.getSelection) {
        const selection = window.getSelection();
        if (selection && selection.type === 'Range') {
          selection.removeAllRanges();
        }
      }
      if (focusSink && typeof focusSink.focus === 'function') {
        focusSink.focus({ preventScroll: true });
      }
    }

    function isVoidTarget(target) {
      return target === document.body || target === messagesWrap || target === messages;
    }
    function updateChatBarVisualState() {
      const commandMode = chatBar.value.startsWith('/');
      chatBar.classList.toggle('commandMode', commandMode);
      chatPrompt.classList.toggle('commandMode', commandMode);
      chatBarWrap.classList.toggle('commandMode', commandMode);
    }

    function updateChatBarState() {
      chatBar.classList.toggle('armed', chatInputArmed);
      if (chatInputArmed) {
        chatBar.removeAttribute('readonly');
      } else {
        chatBar.setAttribute('readonly', 'readonly');
      }
      updateChatBarVisualState();
    }

    function armChatInput({ focus = true } = {}) {
      chatInputArmed = true;
      applyFontScale(100);
    applyGlobalFontFamily('"Courier New", Courier, monospace');
    updateChatBarState();
    updateChatBarVisualState();
      if (focus) {
        chatBar.focus();
        moveCursorToEnd();
      }
    }

    function disarmChatInput() {
      chatInputArmed = false;
      updateChatBarState();
    }

    function notifyParentChatSandboxState() {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'chatSandboxState',
          visible: chatBarWrap.classList.contains('visible')
        }, '*');
      }
    }

    function showChatBar() {
      chatBarWrap.classList.add('visible');
      document.body.classList.add('chat-open');
      disarmChatInput();
      requestAnimationFrame(scrollToBottom);
      notifyParentChatSandboxState();
    }

    function hideChatBar() {
      chatBar.value = '';
      updateChatBarVisualState();
      historyIndex = -1;
      historyDraft = '';
      resetCommandCycle();
      chatBarWrap.classList.remove('visible');
      document.body.classList.remove('chat-open');
      disarmChatInput();
      chatBar.blur();
      notifyParentChatSandboxState();
    }

    function refreshScriptStatusVisibility() {
      scriptRuns.forEach((run) => {
        if (!run || !run.statusLine) return;
        const shouldShowStatus = debugMode || !!run.done;
        run.statusLine.style.display = shouldShowStatus ? '' : 'none';
        if (run.statusHint) {
          run.statusHint.style.display = debugMode ? '' : 'none';
        }
        updateScriptStatus(run, run.done ? (run.finalStatusText || 'completed') : 'running...');
      });
      updateMessagesVisibility();
    }

    function setDebugMode(enabled) {
      debugMode = enabled;
      document.body.classList.toggle('debug', enabled);
      refreshSystemMessagePrefixes();
      refreshScriptStatusVisibility();
    }

    function getRenderedSystemText(text) {
      if (showSystemPrefix) {
        return text.startsWith('System: ') ? text : `System: ${text}`;
      }
      return text.replace(/^System:\s*/i, '');
    }

    function getSystemBaseText(text) {
      return String(text || '').replace(/^System:\s*/i, '').trim();
    }

    function formatSystemDisplayText(rawContent, repeatCount = 1) {
      const rendered = getRenderedSystemText(rawContent);
      return repeatCount > 1 ? `${rendered} (${repeatCount})` : rendered;
    }

    function appendStyledSystemText(messageText, rawContent, repeatCount = 1) {
      messageText.innerHTML = '';
      const rendered = getRenderedSystemText(rawContent);
      const executionMatch = rendered.match(/^(System:\s+)?(\/\S+)\s+(executed|enabled|disabled)\s+by\s+(.+)$/i);
      const unknownCommandMatch = rendered.match(/^(System:\s+)?(\/\S+)\s+is\s+not\s+a\s+known\s+command$/i);

      if (executionMatch) {
        const [, prefix = '', commandToken, actionWord, nicknameText] = executionMatch;

        if (prefix) {
          messageText.appendChild(document.createTextNode(prefix));
        }

        const commandSpan = document.createElement('span');
        commandSpan.className = 'systemCommandLabel';
        commandSpan.textContent = commandToken;
        messageText.appendChild(commandSpan);

        messageText.appendChild(document.createTextNode(` ${actionWord} by `));

        const nicknameSpan = document.createElement('span');
        nicknameSpan.className = 'nicknameLabel';
        nicknameSpan.textContent = nicknameText;
        messageText.appendChild(nicknameSpan);

        if (repeatCount > 1) {
          messageText.appendChild(document.createTextNode(` (${repeatCount})`));
        }
        return;
      }

      if (unknownCommandMatch) {
        const [, prefix = '', commandToken] = unknownCommandMatch;

        if (prefix) {
          messageText.appendChild(document.createTextNode(prefix));
        }

        const commandSpan = document.createElement('span');
        commandSpan.className = 'unknownCommandLabel';
        commandSpan.textContent = commandToken;
        messageText.appendChild(commandSpan);

        messageText.appendChild(document.createTextNode(' is not a known command'));

        if (repeatCount > 1) {
          messageText.appendChild(document.createTextNode(` (${repeatCount})`));
        }
        return;
      }

      messageText.textContent = repeatCount > 1 ? `${rendered} (${repeatCount})` : rendered;
    }

    function formatCommandExecutionMessage(commandToken, state = 'executed', nickname = currentNickname) {
      return `${commandToken} ${state} by ${nickname}`;
    }


    function waitForNextPaint() {
      return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }

    function copyComputedStylesRecursive(sourceNode, targetNode) {
      if (!(sourceNode instanceof Element) || !(targetNode instanceof Element)) {
        return;
      }

      const computed = window.getComputedStyle(sourceNode);
      Array.from(computed).forEach((propertyName) => {
        targetNode.style.setProperty(
          propertyName,
          computed.getPropertyValue(propertyName),
          computed.getPropertyPriority(propertyName)
        );
      });

      targetNode.style.setProperty('box-sizing', computed.boxSizing || 'border-box');

      const sourceChildren = Array.from(sourceNode.children);
      const targetChildren = Array.from(targetNode.children);
      sourceChildren.forEach((child, index) => {
        copyComputedStylesRecursive(child, targetChildren[index]);
      });
    }

    function buildScreenshotClone() {
      const screenshotWidth = Math.ceil(messagesWrap.clientWidth || messagesWrap.getBoundingClientRect().width || 1);
      const screenshotHeight = Math.max(
        Math.ceil(messages.scrollHeight || 0),
        Math.ceil(messagesWrap.scrollHeight || 0),
        Math.ceil(messagesWrap.clientHeight || 0),
        1
      );

      const clone = messagesWrap.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
      clone.id = 'messagesWrapScreenshotClone';
      clone.classList.add('visible');
      clone.style.width = `${screenshotWidth}px`;
      clone.style.minWidth = `${screenshotWidth}px`;
      clone.style.maxWidth = `${screenshotWidth}px`;
      clone.style.height = `${screenshotHeight}px`;
      clone.style.minHeight = `${screenshotHeight}px`;
      clone.style.maxHeight = `${screenshotHeight}px`;
      clone.style.overflow = 'visible';
      clone.style.margin = '0';
      clone.style.transform = 'none';
      clone.style.filter = 'none';

      const cloneMessages = clone.querySelector('#messages');
      if (cloneMessages) {
        cloneMessages.style.height = 'auto';
        cloneMessages.style.minHeight = `${screenshotHeight}px`;
        cloneMessages.style.overflow = 'visible';
      }

      clone.querySelectorAll('.messageDelete').forEach((button) => {
        button.style.visibility = 'hidden';
      });

      copyComputedStylesRecursive(messagesWrap, clone);

      clone.style.width = `${screenshotWidth}px`;
      clone.style.minWidth = `${screenshotWidth}px`;
      clone.style.maxWidth = `${screenshotWidth}px`;
      clone.style.height = `${screenshotHeight}px`;
      clone.style.minHeight = `${screenshotHeight}px`;
      clone.style.maxHeight = `${screenshotHeight}px`;
      clone.style.overflow = 'visible';
      clone.style.margin = '0';
      clone.style.transform = 'none';
      clone.style.filter = 'none';

      if (cloneMessages) {
        cloneMessages.style.height = 'auto';
        cloneMessages.style.minHeight = `${screenshotHeight}px`;
        cloneMessages.style.overflow = 'visible';
      }

      const wrapper = document.createElement('div');
      wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
      wrapper.style.width = `${screenshotWidth}px`;
      wrapper.style.height = `${screenshotHeight}px`;
      wrapper.style.margin = '0';
      wrapper.style.padding = '0';
      wrapper.style.overflow = 'hidden';
      wrapper.appendChild(clone);

      return { wrapper, screenshotWidth, screenshotHeight };
    }

    function renderCloneToPngBlob(wrapper, width, height) {
      return new Promise((resolve, reject) => {
        const serializedMarkup = new XMLSerializer().serializeToString(wrapper);
        const svgMarkup = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <foreignObject x="0" y="0" width="100%" height="100%">${serializedMarkup}</foreignObject>
          </svg>
        `;

        const loadImageFromSource = (source) => new Promise((innerResolve, innerReject) => {
          const image = new Image();
          image.decoding = 'sync';
          image.onload = () => innerResolve(image);
          image.onerror = () => innerReject(new Error('The browser could not render the chat screenshot image.'));
          image.src = source;
        });

        const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
        const svgObjectUrl = URL.createObjectURL(svgBlob);
        const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;

        (async () => {
          let image = null;
          let lastError = null;

          try {
            image = await loadImageFromSource(svgDataUrl);
          } catch (error) {
            lastError = error;
            try {
              image = await loadImageFromSource(svgObjectUrl);
            } catch (fallbackError) {
              lastError = fallbackError;
            }
          }

          URL.revokeObjectURL(svgObjectUrl);

          if (!image) {
            reject(lastError || new Error('The browser could not render the chat screenshot image.'));
            return;
          }

          try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            if (!context) {
              reject(new Error('The browser could not create a drawing context for the screenshot.'));
              return;
            }
            context.drawImage(image, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas export returned an empty blob.'));
              }
            }, 'image/png');
          } catch (error) {
            reject(error);
          }
        })();
      });
    }

    function downloadBlob(blob, filename) {
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      return blobUrl;
    }

    async function captureChatScreenshot() {
      addSystemMessage(formatCommandExecutionMessage('/screenshot'));
      await waitForNextPaint();
      const { wrapper, screenshotWidth, screenshotHeight } = buildScreenshotClone();
      const pngBlob = await renderCloneToPngBlob(wrapper, screenshotWidth, screenshotHeight);
      const filename = `chat-screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      downloadBlob(pngBlob, filename);
    }

    function refreshSystemMessagePrefixes() {
      const systemMessages = messages.querySelectorAll('.message[data-role="system"]');
      systemMessages.forEach((line) => {
        const rawContent = line.dataset.rawContent;
        if (!rawContent) return;
        const messageText = line.querySelector('.messageText');
        if (!messageText) return;
        const repeatCount = Number(line.dataset.repeatCount || '1');
        appendStyledSystemText(messageText, rawContent, repeatCount);
      });
    }


    function renderUserMessage(line, messageTextEl = null) {
      const rawContent = line.dataset.rawContent || '';
      const separatorIndex = rawContent.indexOf(':');
      const messageText = messageTextEl || line.querySelector('.messageText');
      if (!messageText) return;
      if (separatorIndex === -1) {
        messageText.textContent = rawContent;
        return;
      }
      const nickname = rawContent.slice(0, separatorIndex).trim();
      const bodyText = rawContent.slice(separatorIndex + 1).replace(/^\s*/, '');
      messageText.innerHTML = '';
      const nickSpan = document.createElement('span');
      nickSpan.className = 'nicknameLabel';
      nickSpan.textContent = `${nickname}:`;
      messageText.appendChild(nickSpan);
      messageText.appendChild(document.createTextNode(bodyText ? ` ${bodyText}` : ''));
    }

    function formatTimestamp(date = new Date()) {
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    function addMessage(content, role = 'user', isHtml = false) {
      const line = document.createElement('div');
      line.className = 'message';
      line.dataset.role = role;

      const meta = document.createElement('div');
      meta.className = 'messageMeta';

      const timestamp = document.createElement('div');
      timestamp.className = 'timestamp';
      timestamp.textContent = formatTimestamp();

      meta.appendChild(timestamp);

      const row = document.createElement('div');
      row.className = 'messageRow';

      const messageText = document.createElement('div');
      messageText.className = 'messageText';

      if (content instanceof Node) {
        messageText.appendChild(content);
      } else if (isHtml) {
        messageText.innerHTML = content;
      } else {
        let displayContent = content;
        if (typeof displayContent === 'string') {
          line.dataset.rawContent = displayContent;
        }
        if (role === 'system' && typeof displayContent === 'string') {
          appendStyledSystemText(messageText, displayContent, Number(line.dataset.repeatCount || '1'));
        } else if (role === 'user' && typeof displayContent === 'string') {
          renderUserMessage(line, messageText);
        } else {
          messageText.textContent = displayContent;
        }
      }

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'messageDelete';
      deleteBtn.type = 'button';
      deleteBtn.setAttribute('aria-label', 'Delete message');
      deleteBtn.textContent = 'x';
      deleteBtn.addEventListener('click', () => {
        const wasNearBottom = Math.abs(
          messagesWrap.scrollHeight - messagesWrap.clientHeight - messagesWrap.scrollTop
        ) < 8;
        const containsCustomizePanel = line.querySelector('.customizePanel');
        if (containsCustomizePanel && autoShuffleIntervalId !== null) {
          line.style.display = 'none';
        } else {
          line.remove();
        }
        updateMessagesVisibility();
        if (wasNearBottom && Array.from(messages.children).some((child) => child.style.display !== 'none')) {
          scrollToBottom();
        }
      });

      row.appendChild(messageText);
      row.appendChild(deleteBtn);

      line.appendChild(meta);
      line.appendChild(row);
      messages.appendChild(line);
      updateMessagesVisibility();
      requestAnimationFrame(scrollToBottom);
      return line;
    }

    function addSystemMessage(text) {
      const baseText = getSystemBaseText(text);
      const matchingMessages = Array.from(messages.querySelectorAll('.message[data-role="system"]')).filter((line) => {
        return getSystemBaseText(line.dataset.rawContent || '') === baseText;
      });
      const repeatCount = matchingMessages.length + 1;
      matchingMessages.forEach((line) => line.remove());

      const line = addMessage(baseText, 'system');
      if (line) {
        line.dataset.rawContent = baseText;
        line.dataset.repeatCount = String(repeatCount);
        const messageText = line.querySelector('.messageText');
        if (messageText) {
          appendStyledSystemText(messageText, baseText, repeatCount);
        }
      }
    }

    function moveCursorToEnd() {
      const end = chatBar.value.length;
      chatBar.setSelectionRange(end, end);
    }

    function resetHistoryNavigation() {
      historyIndex = -1;
      historyDraft = '';
    }

    function recallOlderHistory() {
      if (inputHistory.length === 0) return;

      if (historyIndex === -1) {
        historyDraft = chatBar.value;
        historyIndex = inputHistory.length - 1;
      } else if (historyIndex > 0) {
        historyIndex -= 1;
      }

      chatBar.value = inputHistory[historyIndex];
      updateChatBarVisualState();
      moveCursorToEnd();
    }

    function recallNewerHistory() {
      if (inputHistory.length === 0 || historyIndex === -1) return;

      if (historyIndex < inputHistory.length - 1) {
        historyIndex += 1;
        chatBar.value = inputHistory[historyIndex];
      } else {
        historyIndex = -1;
        chatBar.value = historyDraft;
        updateChatBarVisualState();
        historyDraft = '';
      }

      moveCursorToEnd();
    }

    function sendSystemActionMessage(text) {
      addSystemMessage(text);
    }


    function clampFontScalePercent(value) {
      if (!Number.isFinite(value)) return null;
      return Math.min(500, Math.max(10, value));
    }

    function applyFontScale(percent) {
      const safePercent = clampFontScalePercent(percent);
      if (safePercent === null) return false;
      document.body.style.setProperty('--font-scale', String(safePercent / 100));
      return true;
    }


    function clampChannel(value) {
      const num = Number(value);
      if (!Number.isFinite(num)) return 0;
      return Math.min(255, Math.max(0, Math.round(num)));
    }

    function clampAlpha(value) {
      const num = Number(value);
      if (!Number.isFinite(num)) return 1;
      return Math.min(1, Math.max(0, num));
    }

    function toRgbaString(r, g, b, a) {
      return `rgba(${clampChannel(r)}, ${clampChannel(g)}, ${clampChannel(b)}, ${clampAlpha(a)})`;
    }

    function colorToRgbaChannels(value, fallback = { r: 255, g: 255, b: 255, a: 1 }) {
      const probe = document.createElement('div');
      probe.style.color = '';
      probe.style.color = String(value || '').trim();
      if (!probe.style.color) return { ...fallback };
      document.body.appendChild(probe);
      const computed = getComputedStyle(probe).color;
      probe.remove();
      const match = computed.match(/rgba?\(([^)]+)\)/i);
      if (!match) return { ...fallback };
      const parts = match[1].split(',').map(part => part.trim());
      return {
        r: clampChannel(parts[0]),
        g: clampChannel(parts[1]),
        b: clampChannel(parts[2]),
        a: parts.length > 3 ? clampAlpha(parts[3]) : 1
      };
    }

    function rgbaChannelsToHex(channels) {
      return `#${[channels.r, channels.g, channels.b].map((value) => clampChannel(value).toString(16).padStart(2, '0')).join('')}`;
    }

    function generateRandomHexColor() {
      const randomChannel = () => Math.floor(Math.random() * 256);
      return rgbaChannelsToHex({
        r: randomChannel(),
        g: randomChannel(),
        b: randomChannel()
      });
    }

    function parseCssColorWithOpacity(value, fallback = { r: 255, g: 255, b: 255, a: 1 }) {
      const rgba = colorToRgbaChannels(value, fallback);
      return {
        color: rgbaChannelsToHex(rgba),
        opacityPercent: Math.round(clampAlpha(rgba.a) * 100)
      };
    }

    function applyGlobalFontFamily(fontFamily) {
      const safeFont = String(fontFamily || '').trim() || '"Courier New", Courier, monospace';
      document.documentElement.style.setProperty('--global-font-family', safeFont);
      document.body.style.fontFamily = safeFont;
      document.querySelectorAll('input, button, select, textarea').forEach((el) => {
        el.style.fontFamily = safeFont;
      });
    }


    function getStyleTargetForCssVar(cssVarName) {
      return cssVarName === '--document-bg' ? document.documentElement : document.body;
    }

    function getComputedCssVarValue(cssVarName) {
      return getComputedStyle(getStyleTargetForCssVar(cssVarName)).getPropertyValue(cssVarName).trim();
    }

    function applyCssVarColor(cssVarName, color, opacityPercent, fallback) {
      const parsed = colorToRgbaChannels(color, fallback);
      getStyleTargetForCssVar(cssVarName).style.setProperty(
        cssVarName,
        toRgbaString(parsed.r, parsed.g, parsed.b, clampAlpha((Number.isFinite(opacityPercent) ? opacityPercent : 100) / 100))
      );
    }


    function syncCustomizePanelUi(bindingSet) {
      if (!bindingSet) return;
      const { fontSelect, fontScaleInput, fontScaleValue, controlBindings } = bindingSet;
      if (fontSelect) {
        fontSelect.value = getComputedStyle(document.documentElement).getPropertyValue('--global-font-family').trim() || customizeDefaults.fontFamily;
      }
      if (fontScaleInput && fontScaleValue) {
        const currentScaleValue = parseFloat(getComputedStyle(document.body).getPropertyValue('--font-scale'));
        const currentScalePercent = Number.isFinite(currentScaleValue) && currentScaleValue > 0 ? Math.round(currentScaleValue * 100) : customizeDefaults.fontScalePercent;
        fontScaleInput.value = String(currentScalePercent);
        fontScaleValue.textContent = `${currentScalePercent}%`;
      }
      (controlBindings || []).forEach((binding) => {
        if (!binding?.textInput || !binding?.pickerInput || !binding?.opacityInput || !binding?.opacityValue) return;
        const current = parseCssColorWithOpacity(getComputedCssVarValue(binding.cssVar), binding.fallback);
        binding.textInput.value = current.color;
        binding.pickerInput.value = current.color;
        binding.opacityInput.value = String(current.opacityPercent);
        binding.opacityValue.textContent = `${current.opacityPercent}%`;
      });
    }

    function syncAllCustomizePanels() {
      customizeBindingSets.forEach((bindingSet) => {
        if (!bindingSet?.wrapper?.isConnected) {
          customizeBindingSets.delete(bindingSet);
          return;
        }
        syncCustomizePanelUi(bindingSet);
      });
    }

    function getCurrentSettingsSnapshot() {
      const computedRoot = getComputedStyle(document.documentElement);
      const computedBody = getComputedStyle(document.body);
      const fontFamily = computedRoot.getPropertyValue('--global-font-family').trim() || computedBody.fontFamily || customizeDefaults.fontFamily;
      const scaleValue = parseFloat(computedBody.getPropertyValue('--font-scale'));
      const fontScalePercent = Number.isFinite(scaleValue) && scaleValue > 0 ? Math.round(scaleValue * 100) : customizeDefaults.fontScalePercent;
      const colors = {};
      Object.entries(customizeDefaults.colors).forEach(([cssVar, defaults]) => {
        colors[cssVar] = parseCssColorWithOpacity(getComputedCssVarValue(cssVar), defaults.fallback);
      });
      return {
        version: 1,
        nickname: currentNickname,
        debugMode: !!debugMode,
        showSystemPrefix: !!showSystemPrefix,
        autoShuffleActive: autoShuffleIntervalId !== null,
        colorInvertEnabled: !!globalColorInvertEnabled,
        colorHueShiftEnabled: !!globalHueShiftEnabled,
        customize: {
          fontFamily,
          fontScalePercent,
          colors,
        },
      };
    }

    function applySettingsSnapshot(snapshot) {
      if (!snapshot || typeof snapshot !== 'object') {
        throw new Error('Settings file is invalid');
      }

      if (typeof snapshot.nickname === 'string' && snapshot.nickname.trim()) {
        currentNickname = snapshot.nickname.trim();
      }

      if (typeof snapshot.showSystemPrefix === 'boolean') {
        showSystemPrefix = snapshot.showSystemPrefix;
      }

      if (typeof snapshot.debugMode === 'boolean') {
        setDebugMode(snapshot.debugMode);
        debugMode = snapshot.debugMode;
      }

      if (typeof snapshot.colorInvertEnabled === 'boolean') {
        setGlobalColorInvert(snapshot.colorInvertEnabled);
      }

      if (typeof snapshot.colorHueShiftEnabled === 'boolean') {
        setGlobalHueShift(snapshot.colorHueShiftEnabled);
      }

      const customize = snapshot.customize;
      if (customize && typeof customize === 'object') {
        if (typeof customize.fontFamily === 'string' && customize.fontFamily.trim()) {
          applyGlobalFontFamily(customize.fontFamily.trim());
        }
        if (customize.fontScalePercent != null) {
          applyFontScale(clampFontScalePercent(Number(customize.fontScalePercent)) || customizeDefaults.fontScalePercent);
        }
        if (customize.colors && typeof customize.colors === 'object') {
          Object.entries(customizeDefaults.colors).forEach(([cssVar, defaults]) => {
            const entry = customize.colors[cssVar];
            if (!entry || typeof entry !== 'object') return;
            const color = typeof entry.color === 'string' && entry.color.trim() ? entry.color.trim() : defaults.color;
            const opacityPercent = Math.max(0, Math.min(100, Number(entry.opacityPercent)));
            applyCssVarColor(cssVar, color, Number.isFinite(opacityPercent) ? opacityPercent : defaults.opacityPercent, defaults.fallback);
          });
        }
      }

      syncAllCustomizePanels();

      if (snapshot.autoShuffleActive) {
        startAutoShuffleColors();
      } else {
        stopAutoShuffleColors();
      }
    }

    function downloadSettingsFile() {
      const snapshot = getCurrentSettingsSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'settings.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function triggerSettingsLoad() {
      settingsLoadInput.value = '';
      settingsLoadInput.click();
    }

    function handleSettingsLoadSelection(event) {
      const [file] = Array.from(event.target.files || []);
      event.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '{}'));
          applySettingsSnapshot(parsed);
          
        } catch (error) {
          addSystemMessage(`Failed to load settings.json: ${error && error.message ? error.message : 'Invalid file'}`);
        }
      };
      reader.onerror = () => {
        addSystemMessage('Failed to read settings.json');
      };
      reader.readAsText(file);
    }


    function sleep(ms) {
      return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    function triggerScriptLoad() {
      scriptLoadInput.value = '';
      scriptLoadInput.click();
    }

    function setScriptGroupVisibility(run, hidden) {
      if (!run) return;
      run.hidden = !!hidden;
      const scriptLines = Array.from(messages.querySelectorAll(`.message[data-script-run-id="${run.id}"][data-role="user"]`));
      scriptLines.forEach((line) => {
        line.style.display = hidden ? 'none' : '';
      });
      updateMessagesVisibility();
      if (!hidden) {
        requestAnimationFrame(scrollToBottom);
      }
    }

    function getInvertedScriptMessageBackground() {
      const current = colorToRgbaChannels(getComputedCssVarValue('--messages-bg'), { r: 0, g: 0, b: 0, a: 0 });
      return toRgbaString(255 - current.r, 255 - current.g, 255 - current.b, 0.75);
    }

    function applyScriptMessageStyling(line, sentIndex) {
      if (!line) return;
      line.dataset.scriptSentIndex = String(sentIndex);
      if (sentIndex % 2 === 1) {
        line.style.background = getInvertedScriptMessageBackground();
      } else {
        line.style.background = '';
      }
    }

    function updateScriptStatus(run, statusText = '') {
      if (!run || !run.statusLine || !run.statusLabel) return;
      const base = `Script run (${run.sentCount}/${run.totalCount})`;
      const suffix = statusText ? ` ${statusText}` : '';
      const plainText = `${base}${suffix}`;
      const displayText = (!debugMode && run.done) ? plainText : plainText;
      run.statusLabel.textContent = displayText;
      run.statusLine.dataset.rawContent = displayText;
      run.statusLine.title = run.done ? (run.hidden ? 'Click to show sent script messages' : 'Click to hide sent script messages') : 'Script is running';
      run.statusLine.style.cursor = run.done ? 'pointer' : 'default';
      run.statusLine.classList.toggle('scriptRunComplete', !!run.done);
      run.statusLine.style.display = debugMode ? '' : 'none';
      if (run.statusHint) {
        run.statusHint.style.display = debugMode ? '' : 'none';
      }
    }

    function createScriptStatusMessage(run) {
      const wrapper = document.createElement('div');
      wrapper.className = 'scriptRunStatus';

      const label = document.createElement('span');
      label.className = 'scriptRunStatusLabel';
      wrapper.appendChild(label);

      const hint = document.createElement('span');
      hint.className = 'scriptRunStatusHint';
      hint.textContent = ' click to hide/show lines after completion';
      wrapper.appendChild(hint);

      const line = addMessage(wrapper, 'system');
      line.dataset.scriptRunId = String(run.id);
      line.style.display = debugMode ? '' : 'none';
      run.statusLine = line;
      run.statusLabel = label;
      run.statusHint = hint;

      wrapper.addEventListener('click', () => {
        if (!run.done) return;
        setScriptGroupVisibility(run, !run.hidden);
        updateScriptStatus(run, run.finalStatusText || 'completed');
      });

      updateScriptStatus(run, 'running...');
      return line;
    }

    async function runScriptLines(run) {
      for (let index = 0; index < run.lines.length; index += 1) {
        if (run.cancelled) break;
        const lineText = run.lines[index];
        if (lineText.trim()) {
          const line = addMessage(`${currentNickname}: ${lineText}`, 'user');
          line.dataset.scriptRunId = String(run.id);
          line.dataset.scriptMessageId = `${run.id}-${run.messageIds.length + 1}`;
          run.messageIds.push(line.dataset.scriptMessageId);
          run.sentCount += 1;
          applyScriptMessageStyling(line, run.sentCount);
        }
        updateScriptStatus(run, 'running...');
        if (index < run.lines.length - 1 && !run.cancelled) {
          await sleep(330);
        }
      }

      run.done = true;
      if (run.cancelled) {
        run.finalStatusText = 'stopped';
      } else {
        run.finalStatusText = 'completed';
      }
      setScriptGroupVisibility(run, true);
      updateScriptStatus(run, run.finalStatusText);
      if (run.statusHint) {
        run.statusHint.textContent = ' click to hide/show lines';
      }
      if (activeScriptRun && activeScriptRun.id === run.id) {
        activeScriptRun = null;
      }
    }

    function startScriptRunFromText(fileText, filename = 'script.txt') {
      if (activeScriptRun) {
        activeScriptRun.cancelled = true;
      }

      const normalizedText = String(fileText || '').replace(/\r\n?/g, '\n');
      const lines = normalizedText.split('\n');
      const run = {
        id: ++scriptRunCounter,
        filename,
        lines,
        totalCount: lines.length,
        sentCount: 0,
        messageIds: [],
        hidden: false,
        done: false,
        cancelled: false,
        finalStatusText: ''
      };

      scriptRuns.push(run);
      activeScriptRun = run;
      createScriptStatusMessage(run);
      runScriptLines(run);
    }

    function handleScriptLoadSelection(event) {
      const [file] = Array.from(event.target.files || []);
      event.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          startScriptRunFromText(String(reader.result || ''), file.name || 'script.txt');
        } catch (error) {
          addSystemMessage(`Failed to load script file: ${error && error.message ? error.message : 'Invalid file'}`);
        }
      };
      reader.onerror = () => {
        addSystemMessage('Failed to read script file');
      };
      reader.readAsText(file);
    }

    function applyCustomizeDefaults() {
      setGlobalColorInvert(false);
      setGlobalHueShift(false);
      applyGlobalFontFamily(customizeDefaults.fontFamily);
      applyFontScale(customizeDefaults.fontScalePercent);
      Object.entries(customizeDefaults.colors).forEach(([cssVar, defaults]) => {
        applyCssVarColor(cssVar, defaults.color, defaults.opacityPercent, defaults.fallback);
      });
      syncAllCustomizePanels();
    }

    function applyRandomizeColors() {
      Object.entries(customizeDefaults.colors).forEach(([cssVar, defaults]) => {
        const randomColor = generateRandomHexColor();
        const opacityPercent = 100;
        applyCssVarColor(cssVar, randomColor, opacityPercent, defaults.fallback);
      });
      syncAllCustomizePanels();
    }

    function stopAutoShuffleColors() {
      if (autoShuffleIntervalId !== null) {
        clearInterval(autoShuffleIntervalId);
        autoShuffleIntervalId = null;
      }
    }

    function startAutoShuffleColors() {
      applyRandomizeColors();
      stopAutoShuffleColors();
      autoShuffleIntervalId = window.setInterval(() => {
        applyRandomizeColors();
      }, autoShuffleIntervalMs);
    }

    function createColorOpacityEditor(labelText, cssVarName, fallback) {
      const group = document.createElement('div');
      group.className = 'rgbaGroup';
      const initial = parseCssColorWithOpacity(getComputedCssVarValue(cssVarName), fallback);

      const colorWrapper = document.createElement('label');
      const colorCaption = document.createElement('span');
      colorCaption.textContent = 'Color';
      const colorInput = document.createElement('input');
      colorInput.type = 'text';
      colorInput.value = initial.color;
      colorInput.placeholder = '#ffffff or white';
      colorInput.dataset.channel = 'color';
      colorInput.setAttribute('aria-label', `${labelText} color`);

      const pickerWrapper = document.createElement('label');
      pickerWrapper.className = 'colorPickerButton';
      pickerWrapper.title = `${labelText} color picker`;
      const pickerInput = document.createElement('input');
      pickerInput.type = 'color';
      pickerInput.className = 'colorPickerInput';
      pickerInput.value = initial.color;
      pickerInput.setAttribute('aria-label', `${labelText} color picker`);

      const opacityWrapper = document.createElement('label');
      const opacityCaption = document.createElement('span');
      opacityCaption.textContent = 'Opacity';
      const opacityRow = document.createElement('div');
      opacityRow.style.display = 'flex';
      opacityRow.style.alignItems = 'center';
      opacityRow.style.gap = '8px';
      opacityRow.style.width = '100%';
      opacityRow.style.minWidth = '0';
      const opacityInput = document.createElement('input');
      opacityInput.type = 'range';
      opacityInput.min = '0';
      opacityInput.max = '100';
      opacityInput.step = '1';
      opacityInput.value = String(initial.opacityPercent);
      opacityInput.dataset.channel = 'opacity';
      opacityInput.setAttribute('aria-label', `${labelText} opacity`);
      const opacityValue = document.createElement('span');
      opacityValue.textContent = `${initial.opacityPercent}%`;
      opacityValue.style.minWidth = '3.5em';
      opacityValue.style.flex = '0 0 auto';
      opacityInput.style.flex = '1 1 auto';
      opacityInput.style.minWidth = '0';

      const applyValue = (normalizeColor = false) => {
        const parsed = colorToRgbaChannels(colorInput.value.trim(), fallback);
        const alpha = clampAlpha(Number(opacityInput.value) / 100);
        const normalizedHex = rgbaChannelsToHex(parsed);
        getStyleTargetForCssVar(cssVarName).style.setProperty(cssVarName, toRgbaString(parsed.r, parsed.g, parsed.b, alpha));
        opacityValue.textContent = `${Math.round(alpha * 100)}%`;
        pickerInput.value = normalizedHex;
        if (normalizeColor) {
          colorInput.value = normalizedHex;
        }
      };

      colorInput.addEventListener('input', () => applyValue(false));
      colorInput.addEventListener('change', () => applyValue(true));
      colorInput.addEventListener('blur', () => applyValue(true));
      pickerInput.addEventListener('input', () => {
        colorInput.value = pickerInput.value;
        applyValue(true);
      });
      opacityInput.addEventListener('input', () => applyValue(false));

      colorWrapper.appendChild(colorCaption);
      colorWrapper.appendChild(colorInput);
      pickerWrapper.appendChild(pickerInput);
      opacityRow.appendChild(opacityInput);
      opacityRow.appendChild(opacityValue);
      opacityWrapper.appendChild(opacityCaption);
      opacityWrapper.appendChild(opacityRow);
      group.appendChild(colorWrapper);
      group.appendChild(pickerWrapper);
      group.appendChild(opacityWrapper);

      return group;
    }

    function createPageColorOpacityEditor(controlKey, currentValue = {}) {
      const fallbackHex = /^#[0-9a-fA-F]{6}$/.test(currentValue.hex || '') ? currentValue.hex : '#000000';
      const fallbackAlpha = Number.isFinite(Number(currentValue.alpha)) ? Math.min(1, Math.max(0, Number(currentValue.alpha))) : 1;

      const group = document.createElement('div');
      group.className = 'rgbaGroup';

      const colorWrapper = document.createElement('label');
      const colorCaption = document.createElement('span');
      colorCaption.textContent = 'Color';
      const colorInput = document.createElement('input');
      colorInput.type = 'text';
      colorInput.value = fallbackHex;
      colorInput.placeholder = '#ffffff';
      colorInput.maxLength = 7;
      colorInput.spellcheck = false;
      colorInput.autocomplete = 'off';
      colorInput.setAttribute('aria-label', `${controlKey} color`);

      const pickerWrapper = document.createElement('label');
      pickerWrapper.className = 'colorPickerButton';
      pickerWrapper.title = `${controlKey} color picker`;
      const pickerInput = document.createElement('input');
      pickerInput.type = 'color';
      pickerInput.className = 'colorPickerInput';
      pickerInput.value = fallbackHex;
      pickerInput.setAttribute('aria-label', `${controlKey} color picker`);

      const opacityWrapper = document.createElement('label');
      const opacityCaption = document.createElement('span');
      opacityCaption.textContent = 'Opacity';
      const opacityRow = document.createElement('div');
      opacityRow.style.display = 'flex';
      opacityRow.style.alignItems = 'center';
      opacityRow.style.gap = '8px';
      opacityRow.style.width = '100%';
      opacityRow.style.minWidth = '0';
      const opacityInput = document.createElement('input');
      opacityInput.type = 'range';
      opacityInput.min = '0';
      opacityInput.max = '100';
      opacityInput.step = '1';
      opacityInput.value = String(Math.round(fallbackAlpha * 100));
      const opacityValue = document.createElement('span');
      opacityValue.textContent = `${Math.round(fallbackAlpha * 100)}%`;
      opacityValue.style.minWidth = '3.5em';
      opacityValue.style.flex = '0 0 auto';
      opacityInput.style.flex = '1 1 auto';
      opacityInput.style.minWidth = '0';

      function emitChange(normalizeColor = false) {
        const maybe = colorInput.value.trim();
        const safeHex = /^#?[0-9a-fA-F]{6}$/.test(maybe)
          ? (maybe.startsWith('#') ? maybe : `#${maybe}`)
          : fallbackHex;
        const safeAlpha = Math.min(1, Math.max(0, Number(opacityInput.value) / 100));
        opacityValue.textContent = `${Math.round(safeAlpha * 100)}%`;
        pickerInput.value = safeHex;
        if (normalizeColor) {
          colorInput.value = safeHex;
        }
        window.parent.postMessage({ type: 'pageCustomizeSet', key: controlKey, value: { hex: safeHex, alpha: safeAlpha } }, '*');
      }

      colorInput.addEventListener('input', () => emitChange(false));
      colorInput.addEventListener('change', () => emitChange(true));
      colorInput.addEventListener('blur', () => emitChange(true));
      pickerInput.addEventListener('input', () => {
        colorInput.value = pickerInput.value;
        emitChange(true);
      });
      opacityInput.addEventListener('input', () => emitChange(false));

      colorWrapper.appendChild(colorCaption);
      colorWrapper.appendChild(colorInput);
      pickerWrapper.appendChild(pickerInput);
      opacityRow.appendChild(opacityInput);
      opacityRow.appendChild(opacityValue);
      opacityWrapper.appendChild(opacityCaption);
      opacityWrapper.appendChild(opacityRow);
      group.appendChild(colorWrapper);
      group.appendChild(pickerWrapper);
      group.appendChild(opacityWrapper);
      return group;
    }

    function createHomepageCustomizeMessageNode(result = {}) {
      const wrapper = document.createElement('div');
      wrapper.className = 'customizePanel';

      const title = document.createElement('div');
      title.className = 'customizeTitle';
      const titleText = document.createElement('span');
      titleText.className = 'customizeTitleText';
      titleText.textContent = 'Customize Page';
      const actionButtons = document.createElement('div');
      actionButtons.className = 'customizeActionButtons';
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.className = 'customizeResetButton';
      resetButton.textContent = 'Reset';
      actionButtons.appendChild(resetButton);
      title.appendChild(titleText);
      title.appendChild(actionButtons);
      wrapper.appendChild(title);


      const state = result.state && typeof result.state === 'object' ? result.state : {};
      const controls = Array.isArray(result.controls) ? result.controls : [];
      controls.forEach((control) => {
        if (!control || !control.key) return;
        const row = document.createElement('div');
        row.className = 'customizeRow';
        const label = document.createElement('label');
        label.textContent = control.label || control.key;
        row.appendChild(label);
        row.appendChild(createPageColorOpacityEditor(control.key, state[control.key] || {}));
        wrapper.appendChild(row);
      });

      resetButton.addEventListener('click', () => {
        window.parent.postMessage({ type: 'pageCustomizeReset' }, '*');
      });
      return wrapper;
    }

    function createCustomizeMessageNode() {
      const wrapper = document.createElement('div');
      wrapper.className = 'customizePanel';

      const controlBindings = [];

      const title = document.createElement('div');
      title.className = 'customizeTitle';
      const titleText = document.createElement('span');
      titleText.className = 'customizeTitleText';
      titleText.textContent = 'Customize Chat';
      const actionButtons = document.createElement('div');
      actionButtons.className = 'customizeActionButtons';
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.className = 'customizeResetButton';
      resetButton.textContent = 'Reset';
      const randomizeButton = document.createElement('button');
      randomizeButton.type = 'button';
      randomizeButton.className = 'customizeRandomizeButton';
      randomizeButton.textContent = 'Randomize';
      actionButtons.appendChild(resetButton);
      actionButtons.appendChild(randomizeButton);
      title.appendChild(titleText);
      title.appendChild(actionButtons);
      wrapper.appendChild(title);

      const fontRow = document.createElement('div');
      fontRow.className = 'customizeRow';
      const fontLabel = document.createElement('label');
      fontLabel.textContent = 'Global font';

      const fontControlGroup = document.createElement('div');
      fontControlGroup.className = 'fontControlGroup';

      const fontSelect = document.createElement('select');
      const fonts = [
        { label: 'Courier New', value: '"Courier New", Courier, monospace' },
        { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
        { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
        { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
        { label: 'Georgia', value: 'Georgia, serif' },
        { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
        { label: 'Lucida Console', value: '"Lucida Console", Monaco, monospace' },
      ];
      const defaultFontValue = '"Courier New", Courier, monospace';
      const currentFont = (getComputedStyle(document.body).fontFamily || '').trim();
      let matchedFont = false;
      fonts.forEach((font) => {
        const option = document.createElement('option');
        option.value = font.value;
        option.textContent = font.label;
        const normalizedCurrent = currentFont.toLowerCase();
        const normalizedLabel = font.label.toLowerCase().replace(/\s+/g, ' ');
        if (normalizedCurrent.includes(normalizedLabel) || currentFont === font.value) {
          option.selected = true;
          matchedFont = true;
        }
        fontSelect.appendChild(option);
      });
      fontSelect.value = matchedFont ? fontSelect.value : defaultFontValue;
      fontSelect.addEventListener('change', () => applyGlobalFontFamily(fontSelect.value));
      fontControlGroup.appendChild(fontSelect);

      const fontScaleBlock = document.createElement('div');
      fontScaleBlock.className = 'fontScaleBlock';
      const fontScaleCaption = document.createElement('span');
      fontScaleCaption.className = 'fontScaleCaption';
      fontScaleCaption.textContent = 'Scale';
      const fontScaleRow = document.createElement('div');
      fontScaleRow.className = 'fontScaleRow';
      const fontScaleInput = document.createElement('input');
      fontScaleInput.type = 'range';
      fontScaleInput.min = '10';
      fontScaleInput.max = '500';
      fontScaleInput.step = '1';
      const currentScaleValue = parseFloat(getComputedStyle(document.body).getPropertyValue('--font-scale'));
      const currentScalePercent = Number.isFinite(currentScaleValue) && currentScaleValue > 0 ? Math.round(currentScaleValue * 100) : 100;
      fontScaleInput.value = String(currentScalePercent);
      fontScaleInput.setAttribute('aria-label', 'Global font scale');
      const fontScaleValue = document.createElement('span');
      fontScaleValue.className = 'fontScaleValue';
      fontScaleValue.textContent = `${currentScalePercent}%`;
      fontScaleInput.addEventListener('input', () => {
        const safePercent = clampFontScalePercent(Number(fontScaleInput.value)) || 100;
        applyFontScale(safePercent);
        fontScaleValue.textContent = `${safePercent}%`;
      });
      fontScaleRow.appendChild(fontScaleInput);
      fontScaleRow.appendChild(fontScaleValue);
      fontScaleBlock.appendChild(fontScaleCaption);
      fontScaleBlock.appendChild(fontScaleRow);
      fontControlGroup.appendChild(fontScaleBlock);

      fontRow.appendChild(fontLabel);
      fontRow.appendChild(fontControlGroup);
      wrapper.appendChild(fontRow);

      const controls = [
        { label: 'Input Bar Background Color', cssVar: '--chatbar-bg', fallback: { r: 255, g: 255, b: 255, a: 1 } },
        { label: 'Input Bar Text Color', cssVar: '--chatbar-text', fallback: { r: 0, g: 0, b: 0, a: 1 } },
        { label: 'Message Text Color', cssVar: '--message-text-color', fallback: { r: 255, g: 255, b: 255, a: 1 } },
        { label: 'Message Backgrounds', cssVar: '--messages-bg', fallback: { r: 0, g: 0, b: 0, a: 0 } },
        { label: 'Chat Background', cssVar: '--chat-bg', fallback: { r: 0, g: 0, b: 0, a: 1 } },
        { label: 'Nickname color', cssVar: '--nickname-color', fallback: { r: 255, g: 255, b: 255, a: 1 } },
      ];

      controls.forEach((control) => {
        const row = document.createElement('div');
        row.className = 'customizeRow';
        const label = document.createElement('label');
        label.textContent = control.label;
        row.appendChild(label);
        const editor = createColorOpacityEditor(control.label, control.cssVar, control.fallback);
        const textInput = editor.querySelector('input[type="text"]');
        const pickerInput = editor.querySelector('input[type="color"]');
        const opacityInput = editor.querySelector('input[type="range"]');
        const opacityValue = editor.querySelector('label:last-child span:last-child');
        controlBindings.push({
          cssVar: control.cssVar,
          textInput,
          pickerInput,
          opacityInput,
          opacityValue,
          fallback: control.fallback,
        });
        row.appendChild(editor);
        wrapper.appendChild(row);
      });

      const bindingSet = {
        wrapper,
        fontSelect,
        fontScaleInput,
        fontScaleValue,
        controlBindings,
      };
      customizeBindingSets.add(bindingSet);
      syncCustomizePanelUi(bindingSet);

      resetButton.addEventListener('click', () => {
        applyCustomizeDefaults();
      });

      randomizeButton.addEventListener('click', (event) => {
        if (event.shiftKey) {
          if (autoShuffleIntervalId !== null) {
            stopAutoShuffleColors();
          } else {
            startAutoShuffleColors();
          }
          return;
        }
        applyRandomizeColors();
      });

      return wrapper;
    }

    function sanitizeUrl(rawUrl) {
      const value = rawUrl.trim();
      if (!value) return null;

      const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(value) ? value : `https://${value}`;

      try {
        const parsed = new URL(withProtocol);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return null;
        }
        return parsed.toString();
      } catch (error) {
        return null;
      }
    }

    function openIframeOverlay(url) {
      closeMediaOverlay();
      iframeOverlayFrame.src = url;
      iframeOverlayTitle.textContent = url;
      iframeOverlayOpen.href = url;
      iframeOverlay.classList.add('visible');
      iframeOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeIframeOverlay() {
      iframeOverlay.classList.remove('visible');
      iframeOverlay.setAttribute('aria-hidden', 'true');
      iframeOverlayFrame.src = 'about:blank';
      iframeOverlayTitle.textContent = 'Iframe preview';
      iframeOverlayOpen.href = '#';
    }

    function createIframeMessageNode(url) {
      const wrapper = document.createElement('div');
      wrapper.className = 'iframeCard';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'iframePreviewButton';
      button.setAttribute('aria-label', `Expand iframe preview for ${url}`);

      const label = document.createElement('span');
      label.className = 'iframePreviewLabel';
      label.textContent = 'Iframe preview window';

      const urlText = document.createElement('span');
      urlText.className = 'iframePreviewUrl';
      urlText.textContent = url;

      button.appendChild(label);
      button.appendChild(urlText);
      button.addEventListener('click', () => {
        openIframeOverlay(url);
      });

      const frame = document.createElement('iframe');
      frame.className = 'iframePreviewFrame';
      frame.src = url;
      frame.title = `Iframe preview for ${url}`;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';

      wrapper.appendChild(button);
      wrapper.appendChild(frame);
      return wrapper;
    }

    function getCommandCatalog() {
      const pageCommands = pageCommandRegistry.map((entry) => entry.name);
      if (document.body.classList.contains('embedded') && pageCommandMeta.pageOnly) {
        return Array.from(new Set(pageCommands)).sort((a, b) => a.localeCompare(b));
      }
      return Array.from(new Set([...builtInCommandList, ...pageCommands])).sort((a, b) => a.localeCompare(b));
    }

    function setPageCommands(payload = []) {
      const source = Array.isArray(payload) ? { commands: payload } : (payload && typeof payload === 'object' ? payload : {});
      const commands = Array.isArray(source.commands) ? source.commands : [];
      pageCommandRegistry = commands
        .filter((entry) => entry && typeof entry.name === 'string' && entry.name.trim().startsWith('/'))
        .map((entry) => ({
          name: entry.name.trim().toLowerCase(),
          desc: entry.desc ? String(entry.desc) : 'page command',
          usage: entry.usage ? String(entry.usage) : entry.name.trim(),
          execute: entry.execute !== false,
          passthroughBuiltIn: entry.passthroughBuiltIn === true
        }));
      pageCommandMeta = {
        pageOnly: !!source.pageOnly,
        pageId: typeof source.pageId === 'string' ? source.pageId : '',
        title: typeof source.title === 'string' ? source.title : '',
        sourceKey: typeof source.sourceKey === 'string' ? source.sourceKey : ''
      };
    }

    function getPageCommandDefinition(command) {
      const normalized = String(command || '').trim().toLowerCase();
      return pageCommandRegistry.find((entry) => entry.name === normalized) || null;
    }

    function dispatchPageCommand(command, raw, args) {
      pendingPageCommand = { command, raw };
      window.parent.postMessage({
        type: 'pageChatExecute',
        command,
        raw,
        args
      }, '*');
    }

    function createHelpMessageNode() {
      const wrapper = document.createElement('div');

      const title = document.createElement('div');
      const titleStrong = document.createElement('strong');
      titleStrong.textContent = 'Help with commands...';
      title.appendChild(titleStrong);
      wrapper.appendChild(title);

      const helpList = document.createElement('div');
      helpList.className = 'helpList';

      const showPageOnlyHelp = document.body.classList.contains('embedded') && pageCommandMeta.pageOnly && pageCommandRegistry.length > 0;
      const builtInCommands = [
        { name: '/upload_file', value: '/upload_file', execute: true, desc: 'open a file picker to embed one file into chat' },
        { name: '/upload_folder', value: '/upload_folder', execute: true, desc: 'open a folder picker to browse and embed local files' },
        { name: '/clear', value: '/clear', execute: true, desc: 'clear the visible chat messages' },
        { name: '/color_hueshift', value: '/color_hueshift', execute: true, desc: 'toggle a global hue shift and override local hue-shift effects while active' },
        { name: '/color_invert', value: '/color_invert', execute: true, desc: 'toggle a global full-color invert on or off' },
        { name: '/customize', value: '/customize', execute: true, desc: 'open the customize panel for colors, opacity, font, and scale' },
        { name: '/debug', value: '/debug', execute: true, desc: 'toggle debug mode and system label visibility' },
        { name: '/help', value: '/help', execute: true, desc: 'show this help message with command links' },
        { name: '/iframe', value: '/iframe https://example.com/', execute: false, desc: 'paste a URL after it to embed a webpage preview' },
        { name: '/script_load', value: '/script_load', execute: true, desc: 'choose a .txt file and send each line into chat every 0.33 seconds' },
        { name: '/settings_load', value: '/settings_load', execute: true, desc: 'choose a settings.json file and load saved settings' },
        { name: '/nickname', value: '/nickname ', execute: false, desc: 'set the displayed username used by system messages' },
        { name: '/color_randomize', value: '/color_randomize', execute: true, desc: 'toggle the automatic random color shuffle on or off' },
        { name: '/color_reset', value: '/color_reset', execute: true, desc: 'restore default appearance settings' },
        { name: '/settings_save', value: '/settings_save', execute: true, desc: 'download a settings.json with the current command-configurable state' },
        { name: '/screenshot', value: '/screenshot', execute: true, desc: 'save a PNG screenshot of the full chat area without changing the chat view' },
        { name: '/stop', value: '/stop', execute: true, desc: 'stop auto color shuffle, script playback, hue shift, and invert effects' }
      ];
      const pageCommands = pageCommandRegistry.map((entry) => ({
        name: entry.name,
        value: entry.usage || entry.name,
        execute: entry.execute !== false,
        desc: entry.desc || 'page command'
      }));
      const commands = (showPageOnlyHelp ? pageCommands : [...builtInCommands, ...pageCommands])
        .sort((a, b) => a.name.localeCompare(b.name));

      commands.forEach((command) => {
        const item = document.createElement('a');
        item.className = 'helpItem';
        item.href = '#';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'helpCommandName';
        nameSpan.textContent = command.name;

        const descSpan = document.createElement('span');
        descSpan.className = 'helpCommandDesc';
        descSpan.textContent = `- ${command.desc}`;

        item.appendChild(nameSpan);
        item.appendChild(descSpan);

        item.addEventListener('click', (event) => {
          event.preventDefault();
          showChatBar();

          if (command.execute) {
            chatBar.value = command.value;
            moveCursorToEnd();
            submitMessage();
          } else {
            chatBar.value = command.value;
            moveCursorToEnd();
          }
        });
        helpList.appendChild(item);
      });

      wrapper.appendChild(helpList);
      return wrapper;
    }


    function createMediaElement(type, url, { controls = true, expanded = false } = {}) {
      if (type === 'image') {
        const img = document.createElement('img');
        img.className = 'mediaPreviewImage';
        img.src = url;
        img.alt = 'Uploaded image preview';
        if (expanded) {
          img.style.maxHeight = 'calc(100vh - 180px)';
        }
        return img;
      }

      if (type === 'video') {
        const video = document.createElement('video');
        video.className = 'mediaPreviewVideo';
        video.src = url;
        video.controls = controls;
        video.preload = 'metadata';
        if (expanded) {
          video.style.maxHeight = 'calc(100vh - 180px)';
        }
        return video;
      }

      const audio = document.createElement('audio');
      audio.className = 'mediaPreviewAudio';
      audio.src = url;
      audio.controls = controls;
      audio.preload = 'metadata';
      return audio;
    }

    function openMediaOverlay(type, url, name) {
      closeIframeOverlay();
      mediaOverlayBody.innerHTML = '';
      mediaOverlayTitle.textContent = name || `${type} preview`;
      mediaOverlayOpen.href = url;
      mediaOverlayOpen.style.display = '';

      const media = createMediaElement(type, url, { controls: true, expanded: true });
      mediaOverlayBody.appendChild(media);

      mediaOverlay.classList.add('visible');
      mediaOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeMediaOverlay() {
      mediaOverlay.classList.remove('visible');
      mediaOverlay.setAttribute('aria-hidden', 'true');
      mediaOverlayTitle.textContent = 'Media preview';
      mediaOverlayOpen.href = '#';
      mediaOverlayOpen.style.display = '';
      mediaOverlayBody.innerHTML = '';
    }

    function createMediaMessageNode(type, file) {
      const objectUrl = URL.createObjectURL(file);

      const wrapper = document.createElement('div');
      wrapper.className = 'mediaCard';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mediaPreviewButton';
      button.setAttribute('aria-label', `Expand ${type} preview for ${file.name}`);

      const label = document.createElement('span');
      label.className = 'mediaPreviewLabel';
      label.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} preview window`;

      const name = document.createElement('span');
      name.className = 'mediaPreviewName';
      name.textContent = file.name;

      button.appendChild(label);
      button.appendChild(name);
      button.addEventListener('click', () => {
        openMediaOverlay(type, objectUrl, file.name);
      });

      const media = createMediaElement(type, objectUrl, { controls: true, expanded: false });

      wrapper.appendChild(button);
      wrapper.appendChild(media);
      return wrapper;
    }


    function inferMediaType(file) {
      const mime = (file && file.type) || '';
      if (mime.startsWith('image/')) return 'image';
      if (mime.startsWith('video/')) return 'video';
      if (mime.startsWith('audio/')) return 'audio';
      return null;
    }

    function getFolderUploadInput(type) {
      const inputMap = {
        image: imageFolderInput,
        video: videoFolderInput,
        audio: audioFolderInput
      };
      return inputMap[type] || null;
    }

    function triggerMediaFolderUpload(type) {
      const input = getFolderUploadInput(type);
      if (!input) return;
      input.value = '';
      input.click();
    }

    function createMediaRecords(type, fileList) {
      const records = Array.from(fileList || [])
        .map(file => {
          const inferredType = type === 'mixed' ? inferMediaType(file) : (file && file.type && file.type.startsWith(`${type}/`) ? type : null);
          if (!file || !inferredType) return null;
          const relativePath = file.webkitRelativePath || file.name;
          const parts = relativePath.split('/');
          const folderPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '/';
          return {
            name: file.name,
            type: inferredType,
            url: URL.createObjectURL(file),
            relativePath,
            folderPath
          };
        })
        .filter(Boolean);

      records.sort((a, b) => a.relativePath.localeCompare(b.relativePath, undefined, { numeric: true, sensitivity: 'base' }));
      return records;
    }

    function getFolderBrowserTitle(records, type) {
      const first = records[0];
      const label = type === 'mixed' ? 'media folder' : `${type} folder`;
      if (!first) return label;
      const root = (first.relativePath || '').split('/')[0] || label;
      return root;
    }

    function createMediaBrowserMessageNode(type, records) {
      const wrapper = document.createElement('div');
      wrapper.className = 'mediaBrowserCard';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mediaPreviewButton';
      button.setAttribute('aria-label', `Expand ${type} folder browser`);

      const label = document.createElement('span');
      label.className = 'mediaPreviewLabel';
      label.textContent = `${type === 'mixed' ? 'Media' : type.charAt(0).toUpperCase() + type.slice(1)} folder browser`;

      const meta = document.createElement('span');
      meta.className = 'mediaBrowserMeta';
      const folderTitle = getFolderBrowserTitle(records, type);
      meta.textContent = `${folderTitle} • ${records.length} file${records.length === 1 ? '' : 's'}`;

      button.appendChild(label);
      button.appendChild(meta);
      button.addEventListener('click', () => {
        openMediaBrowserOverlay(type, records, folderTitle);
      });

      const strip = document.createElement('div');
      strip.className = 'mediaBrowserPreviewStrip';
      records.slice(0, 6).forEach((record) => {
        const thumb = document.createElement('div');
        thumb.className = 'mediaBrowserPreviewThumb';
        const recordType = record.type;
        const media = createMediaElement(recordType, record.url, { controls: recordType !== 'image', expanded: false });
        if (recordType === 'audio') {
          media.controls = false;
          thumb.textContent = record.name;
        } else {
          thumb.appendChild(media);
        }
        strip.appendChild(thumb);
      });

      wrapper.appendChild(button);
      wrapper.appendChild(strip);
      return wrapper;
    }

    function openMediaBrowserOverlay(type, records, title) {
      closeIframeOverlay();
      mediaOverlayBody.innerHTML = '';
      mediaOverlayTitle.textContent = title || `${type} folder`;
      mediaOverlayOpen.href = '#';
      mediaOverlayOpen.style.display = 'none';

      const overlay = document.createElement('div');
      overlay.className = 'mediaBrowserOverlay';

      const toolbar = document.createElement('div');
      toolbar.className = 'mediaBrowserToolbar';

      const listButton = document.createElement('button');
      listButton.type = 'button';
      listButton.textContent = 'list';
      const gridButton = document.createElement('button');
      gridButton.type = 'button';
      gridButton.textContent = 'grid';
      gridButton.classList.add('active');

      const pathLabel = document.createElement('div');
      pathLabel.className = 'mediaBrowserPath';

      toolbar.appendChild(listButton);
      toolbar.appendChild(gridButton);
      toolbar.appendChild(pathLabel);

      const main = document.createElement('div');
      main.className = 'mediaBrowserMain';

      const foldersPane = document.createElement('div');
      foldersPane.className = 'mediaBrowserFolders';
      const itemsPane = document.createElement('div');
      itemsPane.className = 'mediaBrowserItems grid';
      const previewPane = document.createElement('div');
      previewPane.className = 'mediaBrowserPreviewPane';

      const itemList = document.createElement('div');
      itemList.className = 'mediaBrowserItemList';
      itemsPane.appendChild(itemList);

      main.appendChild(foldersPane);
      main.appendChild(itemsPane);
      main.appendChild(previewPane);
      overlay.appendChild(toolbar);
      overlay.appendChild(main);
      mediaOverlayBody.appendChild(overlay);

      const folderNames = Array.from(new Set(records.map(record => record.folderPath || '/')));
      folderNames.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      if (!folderNames.includes('/')) folderNames.unshift('/');

      let currentFolder = folderNames[0] || '/';
      let currentView = 'grid';
      let selectedRecord = records[0] || null;

      function renderPreview() {
        previewPane.innerHTML = '';
        if (!selectedRecord) {
          const empty = document.createElement('div');
          empty.className = 'mediaBrowserEmpty';
          empty.textContent = 'No file selected.';
          previewPane.appendChild(empty);
          return;
        }

        const name = document.createElement('div');
        name.className = 'mediaPreviewLabel';
        name.textContent = selectedRecord.name;

        const rel = document.createElement('div');
        rel.className = 'mediaBrowserPath';
        rel.textContent = selectedRecord.relativePath;

        const inner = document.createElement('div');
        inner.className = 'mediaBrowserPreviewInner';
        inner.appendChild(createMediaElement(selectedRecord.type, selectedRecord.url, { controls: true, expanded: true }));

        previewPane.appendChild(name);
        previewPane.appendChild(rel);
        previewPane.appendChild(inner);
      }

      function renderItems() {
        itemList.innerHTML = '';
        const filtered = records.filter(record => (record.folderPath || '/') === currentFolder);
        pathLabel.textContent = `folder: ${currentFolder}`;

        if (filtered.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'mediaBrowserEmpty';
          empty.textContent = 'No matching files in this folder.';
          itemList.appendChild(empty);
          selectedRecord = null;
          renderPreview();
          return;
        }

        if (!filtered.includes(selectedRecord)) {
          selectedRecord = filtered[0];
        }

        filtered.forEach((record) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'mediaBrowserItemButton';
          if (record === selectedRecord) button.classList.add('active');

          const thumb = document.createElement('div');
          thumb.className = 'mediaBrowserItemThumb';
          if (record.type === 'audio') {
            thumb.classList.add('audioThumb');
            const audio = createMediaElement(record.type, record.url, { controls: true, expanded: false });
            thumb.appendChild(audio);
          } else {
            thumb.appendChild(createMediaElement(record.type, record.url, { controls: false, expanded: false }));
          }

          const itemName = document.createElement('span');
          itemName.className = 'mediaBrowserItemName';
          itemName.textContent = record.name;

          const itemPath = document.createElement('span');
          itemPath.className = 'mediaBrowserItemPath';
          itemPath.textContent = record.relativePath;

          button.appendChild(thumb);
          button.appendChild(itemName);
          button.appendChild(itemPath);
          button.addEventListener('click', () => {
            selectedRecord = record;
            renderItems();
            renderPreview();
          });

          itemList.appendChild(button);
        });

        renderPreview();
      }

      function renderFolders() {
        foldersPane.innerHTML = '';
        folderNames.forEach((folderName) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'mediaBrowserFolderButton';
          if (folderName === currentFolder) button.classList.add('active');
          button.textContent = folderName;
          button.addEventListener('click', () => {
            currentFolder = folderName;
            renderFolders();
            renderItems();
          });
          foldersPane.appendChild(button);
        });
      }

      listButton.addEventListener('click', () => {
        currentView = 'list';
        itemsPane.classList.remove('grid');
        itemsPane.classList.add('list');
        listButton.classList.add('active');
        gridButton.classList.remove('active');
      });

      gridButton.addEventListener('click', () => {
        currentView = 'grid';
        itemsPane.classList.remove('list');
        itemsPane.classList.add('grid');
        gridButton.classList.add('active');
        listButton.classList.remove('active');
      });

      renderFolders();
      renderItems();
      mediaOverlay.classList.add('visible');
      mediaOverlay.setAttribute('aria-hidden', 'false');
    }

    function handleMediaFolderSelection(type, event) {
      const records = createMediaRecords(type, event.target.files || []);
      if (!records.length) {
        addSystemMessage(`No ${type} files found in selected folder.`);
        event.target.value = '';
        return;
      }

      addSystemMessage(formatCommandExecutionMessage('/upload_folder'));
      addMessage(createMediaBrowserMessageNode(type, records), 'system');
      event.target.value = '';
    }

    function triggerGenericUpload() {
      uploadFileInput.value = '';
      uploadFileInput.click();
    }

    function triggerGenericFolderUpload() {
      uploadFolderInput.value = '';
      uploadFolderInput.click();
    }

    function handleGenericMediaSelection(event) {
      const file = event.target.files && event.target.files[0];
      const type = inferMediaType(file);
      if (!file || !type) {
        addSystemMessage('Unsupported file type. Choose an image, video, or audio file.');
        event.target.value = '';
        return;
      }

      addSystemMessage(formatCommandExecutionMessage('/upload_file'));
      addMessage(createMediaMessageNode(type, file), 'system');
      event.target.value = '';
    }

    function handleGenericFolderSelection(event) {
      const records = createMediaRecords('mixed', event.target.files || []);
      if (!records.length) {
        addSystemMessage('No image, video, or audio files found in selected folder.');
        event.target.value = '';
        return;
      }

      addSystemMessage(formatCommandExecutionMessage('/upload_folder'));
      addMessage(createMediaBrowserMessageNode('mixed', records), 'system');
      event.target.value = '';
    }

    function triggerMediaUpload(type) {
      const inputMap = {
        image: imageUploadInput,
        video: videoUploadInput,
        audio: audioUploadInput
      };

      const input = inputMap[type];
      if (!input) return;

      input.value = '';
      input.click();
    }

    function handleMediaSelection(type, event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      addSystemMessage(formatCommandExecutionMessage(`/${type}`));
      addMessage(createMediaMessageNode(type, file), 'system');
      event.target.value = '';
    }

    function resetCommandCycle() {
      commandCycleIndex = -1;
      commandCyclePrefix = '';
    }

    function getCommandTokenInfo() {
      const value = chatBar.value;
      const trimmedLeft = value.trimStart();

      if (!trimmedLeft.startsWith('/')) {
        return null;
      }

      const slashIndex = value.indexOf('/');
      const caret = chatBar.selectionStart ?? value.length;
      const firstSpaceAfterSlash = value.indexOf(' ', slashIndex);

      if (firstSpaceAfterSlash !== -1 && caret > firstSpaceAfterSlash) {
        return null;
      }

      const tokenEnd = firstSpaceAfterSlash === -1 ? value.length : firstSpaceAfterSlash;
      const token = value.slice(slashIndex, tokenEnd);

      return {
        value,
        slashIndex,
        tokenEnd,
        token
      };
    }

    function getMatchingCommands(prefix) {
      const normalized = prefix.toLowerCase();
      return getCommandCatalog()
        .filter(command => command.startsWith(normalized))
        .slice()
        .sort((a, b) => a.localeCompare(b));
    }

    function cycleCommandSuggestion(direction = 1) {
      const info = getCommandTokenInfo();
      if (!info) return false;

      const token = info.token || '/';
      const normalizedToken = token.toLowerCase();

      if (!commandCyclePrefix || !normalizedToken.startsWith(commandCyclePrefix.toLowerCase())) {
        commandCyclePrefix = token;
        commandCycleIndex = -1;
      }

      const matches = getMatchingCommands(commandCyclePrefix || '/');
      if (matches.length === 0) return false;

      if (commandCycleIndex === -1) {
        const exactPrefixIndex = matches.findIndex(cmd => cmd.toLowerCase() === normalizedToken);

        if (exactPrefixIndex !== -1) {
          commandCycleIndex = exactPrefixIndex;
          commandCycleIndex = (commandCycleIndex + direction + matches.length) % matches.length;
        } else {
          commandCycleIndex = direction >= 0 ? 0 : matches.length - 1;
        }
      } else {
        commandCycleIndex = (commandCycleIndex + direction + matches.length) % matches.length;
      }

      const selected = matches[commandCycleIndex];
      chatBar.value = info.value.slice(0, info.slashIndex) + selected + info.value.slice(info.tokenEnd);
      moveCursorToEnd();
      return true;
    }

    async function handleCommand(raw) {
      const trimmed = raw.trim();
      const parts = trimmed.split(/\s+/);
      const command = parts[0].toLowerCase();
      const pageCommand = getPageCommandDefinition(command);
      const embeddedPageOnly = document.body.classList.contains('embedded') && pageCommandMeta.pageOnly;
      const preferPageCommand = document.body.classList.contains('embedded') && !!pageCommand && (embeddedPageOnly || command === '/help' || command === '/customize');

      if (preferPageCommand) {
        dispatchPageCommand(command, trimmed, parts.slice(1));
        return true;
      }

      if (embeddedPageOnly && trimmed.startsWith('/')) {
        return false;
      }

      if (command === '/nickname') {
        const newNickname = trimmed.slice(parts[0].length).trim();
        if (newNickname) {
          currentNickname = newNickname;
          addSystemMessage(formatCommandExecutionMessage('/nickname', 'executed', newNickname));
        }
        return true;
      }

      if (command === '/debug') {
        if (debugMode) {
          showSystemPrefix = false;
          setDebugMode(false);
          addSystemMessage(formatCommandExecutionMessage('/debug', 'disabled'));
        } else {
          showSystemPrefix = true;
          setDebugMode(true);
          addSystemMessage(formatCommandExecutionMessage('/debug', 'enabled'));
        }
        return true;
      }

      if (command === '/help') {
        addSystemMessage(formatCommandExecutionMessage('/help'));
        addMessage(createHelpMessageNode(), 'system');
        return true;
      }

      if (command === '/color_invert') {
        const enabled = toggleGlobalColorInvert();
        addSystemMessage(formatCommandExecutionMessage('/color_invert', enabled ? 'enabled' : 'disabled'));
        return true;
      }

      if (command === '/color_hueshift') {
        const enabled = toggleGlobalHueShift();
        addSystemMessage(formatCommandExecutionMessage('/color_hueshift', enabled ? 'enabled' : 'disabled'));
        return true;
      }

      if (command === '/customize') {
        addSystemMessage(formatCommandExecutionMessage('/customize'));
        addMessage(createCustomizeMessageNode(), 'system');
        return true;
      }

      if (command === '/stop') {
        const wasShuffleRunning = autoShuffleIntervalId !== null;
        const wasScriptRunning = !!(activeScriptRun && !activeScriptRun.done);
        const wasHueShiftEnabled = globalHueShiftEnabled;
        const wasColorInvertEnabled = globalColorInvertEnabled;
        stopAutoShuffleColors();
        if (wasHueShiftEnabled) {
          freezeGlobalHueShiftAtCurrentAngle();
        }
        setGlobalColorInvert(false);
        if (wasScriptRunning && activeScriptRun) {
          activeScriptRun.cancelled = true;
        }
        if (wasShuffleRunning || wasScriptRunning || wasHueShiftEnabled || wasColorInvertEnabled) {
          addSystemMessage(formatCommandExecutionMessage('/stop'));
        } else {
          addSystemMessage('No auto color or script effects are currently running');
        }
        return true;
      }

      if (command === '/color_randomize') {
        if (autoShuffleIntervalId !== null) {
          stopAutoShuffleColors();
          addSystemMessage(formatCommandExecutionMessage('/color_randomize', 'disabled'));
        } else {
          startAutoShuffleColors();
          addSystemMessage(formatCommandExecutionMessage('/color_randomize', 'enabled'));
        }
        return true;
      }

      if (command === '/color_reset') {
        applyCustomizeDefaults();
        addSystemMessage(formatCommandExecutionMessage('/color_reset'));
        return true;
      }

      if (command === '/settings_save') {
        downloadSettingsFile();
        addSystemMessage(formatCommandExecutionMessage('/settings_save'));
        return true;
      }

      if (command === '/screenshot') {
        try {
          await captureChatScreenshot();
        } catch (error) {
          console.error(error);
          addSystemMessage('Unable to save chat screenshot');
        }
        return true;
      }

      if (command === '/settings_load') {
        triggerSettingsLoad();
        addSystemMessage(formatCommandExecutionMessage('/settings_load'));
        return true;
      }

      if (command === '/script_load') {
        triggerScriptLoad();
        addSystemMessage(formatCommandExecutionMessage('/script_load'));
        return true;
      }

      if (command === '/iframe') {
        const rawUrl = trimmed.slice(parts[0].length).trim();
        const sanitizedUrl = sanitizeUrl(rawUrl);
        if (!sanitizedUrl) {
          addSystemMessage('Invalid iframe URL. Use /iframe https://example.com/');
          return true;
        }
        addSystemMessage(formatCommandExecutionMessage('/iframe'));
        addMessage(createIframeMessageNode(sanitizedUrl), 'system');
        return true;
      }

      if (command === '/upload_folder') {
        triggerGenericFolderUpload();
        return true;
      }

      if (command === '/upload_file') {
        triggerGenericUpload();
        return true;
      }

      if (command === '/clear') {
        closeIframeOverlay();
        closeMediaOverlay();
        messages.innerHTML = '';
        updateMessagesVisibility();
        if (debugMode) {
          addSystemMessage(formatCommandExecutionMessage('/clear'));
        }
        return true;
      }

      if (pageCommand) {
        dispatchPageCommand(command, raw, parts.slice(1));
        return true;
      }

      return false;
    }

    async function submitMessage() {
      const raw = chatBar.value;
      if (!raw.trim()) return;

      inputHistory.push(raw);
      resetHistoryNavigation();

      const trimmed = raw.trim();
      const handled = await handleCommand(raw);

      if (!handled) {
        if (trimmed.startsWith('/')) {
          const commandToken = trimmed.split(/\s+/)[0];
          addSystemMessage(`${commandToken} is not a known command`);
        } else {
          addMessage(`${currentNickname}: ${raw}`, 'user');
        }
      }

      chatBar.value = '';
      updateChatBarVisualState();
      resetCommandCycle();
    }

    renderCommandHueShiftFrame();
    updateChatBarState();

    chatBar.addEventListener('input', () => {
      if (historyIndex !== -1) {
        historyIndex = -1;
      }
      updateChatBarVisualState();
      resetCommandCycle();
    });

    chatBar.addEventListener('keyup', () => {
      updateChatBarVisualState();
    });

    chatBar.addEventListener('focus', () => {
      updateChatBarVisualState();
    });

    chatBar.addEventListener('keydown', (event) => {
      if (!chatInputArmed) {
        event.preventDefault();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const trimmedValue = chatBar.value.trim();
        if (!trimmedValue || trimmedValue === '/') {
          hideChatBar();
          return;
        }
        submitMessage();
        return;
      }

      const commandInfo = getCommandTokenInfo();

      if (event.key === 'Tab') {
        if (commandInfo) {
          event.preventDefault();
          cycleCommandSuggestion(event.shiftKey ? -1 : 1);
        }
        return;
      }

      if (event.key === 'ArrowUp') {
        if (commandInfo) {
          event.preventDefault();
          cycleCommandSuggestion(-1);
        } else {
          event.preventDefault();
          recallOlderHistory();
        }
        return;
      }

      if (event.key === 'ArrowDown') {
        if (commandInfo) {
          event.preventDefault();
          cycleCommandSuggestion(1);
        } else {
          event.preventDefault();
          recallNewerHistory();
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        hideChatBar();
      }
    });

    chatBar.addEventListener('click', () => {
      if (!chatInputArmed) {
        armChatInput();
        return;
      }
      chatBar.focus();
    });

    updateMessagesVisibility();

    chatBarWrap.addEventListener('click', (event) => {
      if (event.target !== chatClose) {
        armChatInput();
      }
    });

    chatClose.addEventListener('click', (event) => {
      event.stopPropagation();
      hideChatBar();
    });

    iframeOverlayClose.addEventListener('click', () => {
      closeIframeOverlay();
    });

    mediaOverlayClose.addEventListener('click', () => {
      closeMediaOverlay();
    });

    uploadFileInput.addEventListener('change', (event) => {
      handleGenericMediaSelection(event);
    });

    uploadFolderInput.addEventListener('change', (event) => {
      handleGenericFolderSelection(event);
    });

    settingsLoadInput.addEventListener('change', (event) => {
      handleSettingsLoadSelection(event);
    });

    scriptLoadInput.addEventListener('change', (event) => {
      handleScriptLoadSelection(event);
    });

    imageUploadInput.addEventListener('change', (event) => {
      handleMediaSelection('image', event);
    });

    videoUploadInput.addEventListener('change', (event) => {
      handleMediaSelection('video', event);
    });

    audioUploadInput.addEventListener('change', (event) => {
      handleMediaSelection('audio', event);
    });

    imageFolderInput.addEventListener('change', (event) => {
      handleMediaFolderSelection('image', event);
    });

    videoFolderInput.addEventListener('change', (event) => {
      handleMediaFolderSelection('video', event);
    });

    audioFolderInput.addEventListener('change', (event) => {
      handleMediaFolderSelection('audio', event);
    });



    document.addEventListener('pointerdown', (event) => {
      if (isVoidTarget(event.target)) {
        clearStrayFocus();
      }
    }, true);

    document.addEventListener('click', (event) => {
      if (isVoidTarget(event.target)) {
        event.preventDefault();
        clearStrayFocus();
      }
    }, true);
    window.addEventListener('message', (event) => {
      if (!event.data) return;

      if (event.data.type === 'chatSandboxOpen') {
        showChatBar();
        if (event.data.focus !== false) {
          armChatInput();
        }
        if (event.data.seedSlash) {
          chatBar.value = '/';
          updateChatBarVisualState();
          moveCursorToEnd();
        }
        return;
      }

      if (event.data.type === 'chatSandboxClose') {
        hideChatBar();
        return;
      }

      if (event.data.type === 'pageChatRegister') {
        setPageCommands({
          commands: Array.isArray(event.data.commands) ? event.data.commands : [],
          pageOnly: !!event.data.pageOnly,
          pageId: event.data.pageId || '',
          title: event.data.title || '',
          sourceKey: event.data.sourceKey || ''
        });
        return;
      }

      if (event.data.type === 'pageChatClear') {
        setPageCommands({ commands: [], pageOnly: false, pageId: '', title: '', sourceKey: '' });
        return;
      }

      if (event.data.type === 'pageChatResult') {
        const message = event.data.message || `${event.data.command || 'Page command'} executed`;
        if (event.data.panel === 'homepageCustomize') {
          addSystemMessage(formatCommandExecutionMessage(event.data.command || '/customize'));
          if (event.data.includeBaseCustomize) {
            addMessage(createCustomizeMessageNode(), 'system');
          }
          addMessage(createHomepageCustomizeMessageNode(event.data), 'system');
        } else {
          addSystemMessage(message);
        }
        pendingPageCommand = null;
      }
    });

    if (window.parent && window.parent !== window) {
      document.documentElement.classList.add('embedded');
      document.body.classList.add('embedded');
    }

    notifyParentChatSandboxState();

    window.addEventListener('keydown', (event) => {
      const activeElement = document.activeElement;
      const active = activeElement === chatBar;
      const visible = chatBarWrap.classList.contains('visible');
      const printable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
      const activeTag = activeElement && activeElement.tagName ? activeElement.tagName.toUpperCase() : '';
      const interactingWithCustomizeControl = !!(activeElement && activeElement.closest && activeElement.closest('.customizePanel') && (
        activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA' || activeElement.isContentEditable
      ));

      if (event.key === 'Escape') {
        if (iframeOverlay.classList.contains('visible')) {
          event.preventDefault();
          closeIframeOverlay();
          return;
        }
        if (mediaOverlay.classList.contains('visible')) {
          event.preventDefault();
          closeMediaOverlay();
          return;
        }
      }

      if (event.key === '/') {
        if (!visible) {
          event.preventDefault();
          showChatBar();
          return;
        }

        if (!chatInputArmed) {
          event.preventDefault();
          armChatInput();
          chatBar.value += '/';
          moveCursorToEnd();
          return;
        }

        if (!active) {
          event.preventDefault();
          chatBar.focus();
          chatBar.value += '/';
          moveCursorToEnd();
          return;
        }

        return;
      }

      if (!visible && event.key === 'Enter' && !event.shiftKey && !interactingWithCustomizeControl) {
        event.preventDefault();
        showChatBar();
        return;
      }

      if (!visible && printable) {
        event.preventDefault();
        return;
      }

      if (visible && !chatInputArmed && event.key === 'Enter' && !event.shiftKey && !interactingWithCustomizeControl) {
        event.preventDefault();
        armChatInput();
        chatBar.value = '';
        updateChatBarVisualState();
        return;
      }

      if (visible && !chatInputArmed && printable) {
        event.preventDefault();
        return;
      }

      if (visible && chatInputArmed && !active && !interactingWithCustomizeControl && event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submitMessage();
        return;
      }

      if (visible && chatInputArmed && !active && printable && !interactingWithCustomizeControl) {
        event.preventDefault();
        chatBar.focus();
        chatBar.value += event.key;
        moveCursorToEnd();
      }
    });
