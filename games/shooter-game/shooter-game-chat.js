    const tektiteFrame = document.getElementById('tektite-frame');
    const chatSandboxFrame = document.getElementById('chat-sandbox-frame');
    const LEVEL1_SRC = '/games/shooter-game/shooter-game-level1.html';
    const LEVEL2_SRC = '/games/shooter-game/shooter-game-level2.html?autostart=1';
    const shooterPageCommands = [
      { name: '/background_color', desc: 'Set starfield background color', usage: '/background_color [name|hex]', suggestions: ['black', 'purple', 'lime', '#110019'] },
      { name: '/bombs', desc: 'Set bombs to a number or infinite', usage: '/bombs [number|infinite]', suggestions: ['0', '3', '5', 'infinite'] },
      { name: '/fullscreen', desc: 'Toggle fullscreen', usage: '/fullscreen' },
      { name: '/hearts', desc: 'Set max hearts to a number or infinite', usage: '/hearts [number|infinite]', suggestions: ['1', '4', '8', 'infinite'] },
      { name: '/invert', desc: 'Toggle invert colors', usage: '/invert' },
      { name: '/lives', desc: 'Set lives to a number or infinite', usage: '/lives [number|infinite]', suggestions: ['0', '3', '5', 'infinite'] },
      { name: '/shields', desc: 'Set shields to a number or infinite', usage: '/shields [number|infinite]', suggestions: ['0', '1', '3', 'infinite'] },
      { name: '/video_fx', desc: 'Toggle video effects on or off', usage: '/video_fx' }
    ];
    let hasSwitchedToLevel2 = false;
    let chatSandboxVisible = false;
    let chatSandboxReady = false;
    let pendingChatOpenOptions = null;
    let chatControllerTargetIndex = -1;

    function getChatWindow() {
      return chatSandboxFrame && chatSandboxFrame.contentWindow ? chatSandboxFrame.contentWindow : null;
    }

    function postToChatSandbox(payload) {
      const chatWindow = getChatWindow();
      if (!chatWindow) return;
      chatWindow.postMessage(payload, '*');
    }

    function notifyChildChatVisibility() {
      try {
        if (tektiteFrame && tektiteFrame.contentWindow) {
          tektiteFrame.contentWindow.postMessage({
            type: 'tektite:chat-visibility',
            visible: !!chatSandboxVisible
          }, '*');
        }
      } catch (error) {}
    }

    function setChatFrameVisible(visible) {
      chatSandboxVisible = !!visible;
      chatSandboxFrame.classList.toggle('visible', chatSandboxVisible);
      notifyChildChatVisibility();
    }

    function getChatDocument() {
      try {
        const chatWindow = getChatWindow();
        return chatWindow && chatWindow.document ? chatWindow.document : null;
      } catch (error) {
        return null;
      }
    }

    function getChatInput() {
      try {
        const chatDoc = getChatDocument();
        if (!chatDoc) return null;
        return chatDoc.getElementById('chatBar');
      } catch (error) {
        return null;
      }
    }

    function getChatInteractiveTargets() {
      const chatDoc = getChatDocument();
      if (!chatDoc) return [];
      const preferredSelectors = [
        '[data-command]',
        '[data-cmd]',
        '.help-link',
        '.command-link',
        '.chat-command-link'
      ];
      const fallbackSelectors = [
        'a[href]',
        'button',
        '[role="button"]'
      ];
      const allSelectors = preferredSelectors.concat(fallbackSelectors);
      const nodes = Array.from(chatDoc.querySelectorAll(allSelectors.join(',')));
      const filtered = nodes.filter((node) => {
        if (!node) return false;
        const style = node.ownerDocument && node.ownerDocument.defaultView ? node.ownerDocument.defaultView.getComputedStyle(node) : null;
        const hidden = style && (style.display === 'none' || style.visibility === 'hidden');
        const rect = typeof node.getBoundingClientRect === 'function' ? node.getBoundingClientRect() : null;
        return !hidden && !node.disabled && !node.hasAttribute('disabled') && !node.hasAttribute('aria-hidden') && (!rect || (rect.width > 0 && rect.height > 0)) && (!style || style.pointerEvents !== 'none');
      });
      const preferred = filtered.filter((node) =>
        node.matches(preferredSelectors.join(','))
      );
      return preferred.length ? preferred : filtered;
    }

    function updateChatControllerSelectionVisuals(selectedNode) {
      const targets = getChatInteractiveTargets();
      targets.forEach((node) => {
        if (!node) return;
        const isSelected = node === selectedNode;
        if (!node.dataset.tektiteControllerBaseBg) node.dataset.tektiteControllerBaseBg = node.style.backgroundColor || '';
        if (!node.dataset.tektiteControllerBaseOutline) node.dataset.tektiteControllerBaseOutline = node.style.outline || '';
        if (!node.dataset.tektiteControllerBaseBoxShadow) node.dataset.tektiteControllerBaseBoxShadow = node.style.boxShadow || '';
        if (!node.dataset.tektiteControllerBaseBorderRadius) node.dataset.tektiteControllerBaseBorderRadius = node.style.borderRadius || '';
        if (!node.dataset.tektiteControllerBaseColor) node.dataset.tektiteControllerBaseColor = node.style.color || '';
        if (!node.dataset.tektiteControllerBaseFilter) node.dataset.tektiteControllerBaseFilter = node.style.filter || '';
        if (!node.dataset.tektiteControllerBaseTransform) node.dataset.tektiteControllerBaseTransform = node.style.transform || '';
        if (isSelected) {
          node.dataset.tektiteControllerSelected = 'true';
          node.style.backgroundColor = 'rgba(75,0,118,0.82)';
          node.style.outline = '2px solid rgba(0,255,102,0.98)';
          node.style.boxShadow = '0 0 0 1px rgba(0,255,102,0.35), 0 0 14px rgba(0,255,102,0.28)';
          node.style.borderRadius = node.dataset.tektiteControllerBaseBorderRadius || '10px';
          node.style.color = '#ffffff';
          node.style.filter = 'brightness(1.08)';
          node.style.transform = 'translateX(0)';
        } else if (node.dataset.tektiteControllerSelected === 'true') {
          node.dataset.tektiteControllerSelected = 'false';
          node.style.backgroundColor = node.dataset.tektiteControllerBaseBg || '';
          node.style.outline = node.dataset.tektiteControllerBaseOutline || '';
          node.style.boxShadow = node.dataset.tektiteControllerBaseBoxShadow || '';
          node.style.borderRadius = node.dataset.tektiteControllerBaseBorderRadius || '';
          node.style.color = node.dataset.tektiteControllerBaseColor || '';
          node.style.filter = node.dataset.tektiteControllerBaseFilter || '';
          node.style.transform = node.dataset.tektiteControllerBaseTransform || '';
        }
      });
    }

    function syncChatControllerTargetIndex(targets) {
      if (!targets.length) {
        chatControllerTargetIndex = -1;
        return -1;
      }
      const chatDoc = getChatDocument();
      const active = chatDoc && chatDoc.activeElement ? chatDoc.activeElement : null;
      let index = targets.findIndex((node) => node === active);
      if (index < 0) {
        index = targets.findIndex((node) => active && typeof node.contains === 'function' && node.contains(active));
      }
      if (index >= 0) {
        chatControllerTargetIndex = index;
        return index;
      }
      if (chatControllerTargetIndex < 0 || chatControllerTargetIndex >= targets.length) {
        chatControllerTargetIndex = 0;
      }
      return chatControllerTargetIndex;
    }

    function focusChatTargetByIndex(index) {
      const targets = getChatInteractiveTargets();
      if (!targets.length) {
        updateChatControllerSelectionVisuals(null);
        return false;
      }
      if (typeof index !== 'number' || Number.isNaN(index)) index = 0;
      chatControllerTargetIndex = ((index % targets.length) + targets.length) % targets.length;
      const next = targets[chatControllerTargetIndex];
      if (!next) {
        updateChatControllerSelectionVisuals(null);
        return false;
      }
      try { next.setAttribute('tabindex', next.getAttribute('tabindex') || '0'); } catch (error) {}
      updateChatControllerSelectionVisuals(next);
      try { next.focus({ preventScroll: false }); } catch (error) { try { next.focus(); } catch (_) {} }
      try { next.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (error) {}
      return true;
    }

    function focusChatTargetByStep(step) {
      const targets = getChatInteractiveTargets();
      if (!targets.length) return false;
      const currentIndex = syncChatControllerTargetIndex(targets);
      const nextIndex = currentIndex < 0 ? (step > 0 ? 0 : targets.length - 1) : (currentIndex + step + targets.length) % targets.length;
      return focusChatTargetByIndex(nextIndex);
    }

    function focusFirstChatInteractiveTarget() {
      return focusChatTargetByIndex(0);
    }

    function activateFocusedChatTarget() {
      const targets = getChatInteractiveTargets();
      const activeIndex = syncChatControllerTargetIndex(targets);
      const target = activeIndex >= 0 ? targets[activeIndex] : null;
      const chatDoc = getChatDocument();
      const active = target || (chatDoc && chatDoc.activeElement ? chatDoc.activeElement : null);
      if (active && chatDoc && active !== chatDoc.body) {
        try {
          const view = (active.ownerDocument && active.ownerDocument.defaultView) || window;
          active.dispatchEvent(new view.MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
          active.dispatchEvent(new view.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          active.dispatchEvent(new view.MouseEvent('mouseup', { bubbles: true, cancelable: true }));
          active.click();
          return true;
        } catch (error) {}
        try {
          const view = (active.ownerDocument && active.ownerDocument.defaultView) || window;
          active.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
          active.dispatchEvent(new view.KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
          return true;
        } catch (error) {}
      }
      return dispatchChatKey('Enter', 'Enter');
    }

    function setChatInputValue(input, value) {
      if (!input) return false;
      try {
        const proto = input.ownerDocument && input.ownerDocument.defaultView
          ? input.ownerDocument.defaultView.HTMLInputElement.prototype
          : HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
        if (descriptor && typeof descriptor.set === 'function') {
          descriptor.set.call(input, value);
        } else {
          input.value = value;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('keyup', { bubbles: true }));
        return true;
      } catch (error) {
        try {
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('keyup', { bubbles: true }));
          return true;
        } catch (_) {
          return false;
        }
      }
    }

    function dispatchChatKey(key, code, options = {}) {
      const chatDoc = getChatDocument();
      const input = getChatInput();
      const target = options.target === 'active' && chatDoc && chatDoc.activeElement && chatDoc.activeElement !== chatDoc.body
        ? chatDoc.activeElement
        : input;
      if (!target) return false;
      try {
        if (typeof target.focus === 'function') target.focus();
        const view = (target.ownerDocument && target.ownerDocument.defaultView) || window;
        const event = new view.KeyboardEvent('keydown', {
          key,
          code: code || key,
          bubbles: true,
          cancelable: true,
          shiftKey: !!options.shiftKey
        });
        target.dispatchEvent(event);
        return true;
      } catch (error) {
        return false;
      }
    }

    function runChatCommand(command) {
      const input = getChatInput();
      if (!input) return false;
      const normalizedCommand = String(command || '').trim();
      try {
        input.focus();
        input.click();
      } catch (error) {}
      chatControllerTargetIndex = -1;
      if (!setChatInputValue(input, normalizedCommand)) return false;
      const didDispatch = dispatchChatKey('Enter', 'Enter');
      if (didDispatch && normalizedCommand.toLowerCase() === '/help') {
        const focusHelpTargets = (attempt = 0) => {
          if (focusFirstChatInteractiveTarget()) return true;
          if (attempt >= 15) return false;
          window.setTimeout(() => focusHelpTargets(attempt + 1), 40);
          return false;
        };
        window.setTimeout(() => focusHelpTargets(0), 50);
      }
      return didDispatch;
    }

    function primeChatSlashSuggestion() {
      const input = getChatInput();
      if (!input) return false;
      try {
        input.focus();
        input.click();
      } catch (error) {}
      if (!setChatInputValue(input, '/')) return false;
      dispatchChatKey('ArrowDown', 'ArrowDown');
      return true;
    }

    function withChatInputReady(callback, attempt = 0) {
      if (callback()) return;
      if (attempt >= 12) return;
      window.setTimeout(() => withChatInputReady(callback, attempt + 1), 35);
    }

    function flushPendingChatOpen() {
      if (!pendingChatOpenOptions || !chatSandboxReady) return;
      const options = pendingChatOpenOptions;
      pendingChatOpenOptions = null;
      postToChatSandbox({
        type: 'chatSandboxOpen',
        focus: options.focus !== false,
        seedSlash: !!options.seedSlash
      });
      if (options.autoSuggestSlash) {
        withChatInputReady(primeChatSlashSuggestion);
      }
    }

    function openChatFromParent(options = {}) {
      chatControllerTargetIndex = -1;
      try {
        if (tektiteFrame && tektiteFrame.contentWindow) {
          tektiteFrame.contentWindow.postMessage({
            type: 'tektite:pause-for-chat'
          }, '*');
        }
      } catch (error) {}
      setChatFrameVisible(true);
      pendingChatOpenOptions = {
        focus: options.focus !== false,
        seedSlash: !!options.seedSlash,
        autoSuggestSlash: !!options.autoSuggestSlash
      };
      flushPendingChatOpen();
    }

    function closeChatFromParent() {
      chatControllerTargetIndex = -1;
      updateChatControllerSelectionVisuals(null);
      postToChatSandbox({ type: 'chatSandboxClose' });
      setChatFrameVisible(false);
      try { tektiteFrame.contentWindow.focus(); } catch (error) {}
    }

    function registerPageCommands() {
      postToChatSandbox({
        type: 'pageChatRegister',
        commands: shooterPageCommands,
        pageOnly: true,
        pageId: hasSwitchedToLevel2 ? 'shooter-game-level2' : 'shooter-game-level1',
        title: 'Tektite Shooter',
        sourceKey: 'shooter-game',
        welcomeMessage: "System: Welcome to Tektite's Shooter Game..."
      });
    }

    async function setIframeFullscreen(shouldEnter) {
      const fullscreenTarget = document.documentElement || document.body || tektiteFrame;
      if (!fullscreenTarget) return;
      try {
        const fsElement = document.fullscreenElement;
        if (shouldEnter) {
          if (fsElement !== fullscreenTarget && fullscreenTarget.requestFullscreen) {
            await fullscreenTarget.requestFullscreen();
          }
        } else if (fsElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.warn('Fullscreen request failed.', error);
      }
    }

    function switchToLevel2() {
      if (!tektiteFrame || hasSwitchedToLevel2) return;
      hasSwitchedToLevel2 = true;
      const keepFullscreen = !!document.fullscreenElement;
      tektiteFrame.src = LEVEL2_SRC;
      if (keepFullscreen) {
        tektiteFrame.addEventListener('load', () => {
          setIframeFullscreen(true);
        }, { once: true });
      }
    }

    function switchToLevel1Reloaded() {
      if (!tektiteFrame) return;
      hasSwitchedToLevel2 = false;
      const keepFullscreen = !!document.fullscreenElement;
      tektiteFrame.src = `${LEVEL1_SRC}?reload=${Date.now()}`;
      if (keepFullscreen) {
        tektiteFrame.addEventListener('load', () => {
          setIframeFullscreen(true);
        }, { once: true });
      }
    }

    function shouldIgnoreChatShortcutFromEvent(event) {
      const view = event.view || window;
      const doc = view.document || document;
      const activeElement = doc.activeElement;
      const activeTag = activeElement && activeElement.tagName ? activeElement.tagName.toUpperCase() : '';
      return !!(activeElement && (
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        activeTag === 'SELECT' ||
        activeElement.isContentEditable
      ));
    }

    function handleChatShortcutKeydown(event) {
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (shouldIgnoreChatShortcutFromEvent(event)) return;
        event.preventDefault();
        event.stopPropagation();
        openChatFromParent({ focus: true, seedSlash: true });
        return;
      }

      if (event.key === 'Escape' && chatSandboxVisible) {
        event.preventDefault();
        event.stopPropagation();
        closeChatFromParent();
      }
    }

    function bindChatShortcutToFrame(frame) {
      try {
        const frameWindow = frame && frame.contentWindow;
        const frameDoc = frameWindow && frameWindow.document;
        if (!frameWindow || !frameDoc || frameWindow.__shooterChatShortcutBound) return;
        frameWindow.addEventListener('keydown', handleChatShortcutKeydown, true);
        frameDoc.addEventListener('keydown', handleChatShortcutKeydown, true);
        frameWindow.__shooterChatShortcutBound = true;
      } catch (error) {
        console.warn('Unable to bind chat shortcut to frame', error);
      }
    }

    window.addEventListener('keydown', handleChatShortcutKeydown, true);

    chatSandboxFrame.addEventListener('load', () => {
      chatSandboxReady = true;
      flushPendingChatOpen();
      registerPageCommands();
      bindChatShortcutToFrame(chatSandboxFrame);
    });

    tektiteFrame.addEventListener('load', () => {
      bindChatShortcutToFrame(tektiteFrame);
      registerPageCommands();
    });

    window.addEventListener('message', async (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (event.source === getChatWindow()) {
        if (data.type === 'chatSandboxState') {
          chatSandboxReady = true;
          flushPendingChatOpen();
          setChatFrameVisible(!!data.visible);
          registerPageCommands();
          return;
        }
        if (data.type === 'pageChatExecute') {
          if (tektiteFrame && tektiteFrame.contentWindow) {
            tektiteFrame.contentWindow.postMessage({
              type: 'tektite:execute-command',
              command: String(data.raw || data.command || '').trim()
            }, '*');
          }
          return;
        }
      }

      if (data.type === 'tektite:continue-to-level2') {
        switchToLevel2();
        return;
      }
      if (data.type === 'tektite:return-to-level1') {
        switchToLevel1Reloaded();
        return;
      }
      if (data.type === 'tektite:fullscreen') {
        const action = data.action || 'toggle';
        if (action === 'enter') await setIframeFullscreen(true);
        else if (action === 'exit') await setIframeFullscreen(false);
        else await setIframeFullscreen(document.fullscreenElement !== tektiteFrame);
        return;
      }
      if (data.type === 'tektite:command-result') {
        postToChatSandbox({
          type: 'pageChatResult',
          command: data.command || '',
          message: data.message || `${data.command || 'Command'} executed`,
          announce: true
        });
        return;
      }
      if (data.type === 'openChatFromChild') {
        openChatFromParent({
          focus: true,
          seedSlash: !!data.seedSlash,
          autoSuggestSlash: !!data.autoSuggestSlash
        });
        if (data.runCommand) {
          withChatInputReady(() => runChatCommand(data.runCommand));
        }
        return;
      }
      if (data.type === 'closeChatFromChild') {
        closeChatFromParent();
        return;
      }
      if (data.type === 'tektite:chat-control') {
        const action = String(data.action || '').trim();
        if (action === 'cycleUp') {
          if (!focusChatTargetByStep(-1)) dispatchChatKey('ArrowUp', 'ArrowUp', { target: 'active' });
        } else if (action === 'cycleDown') {
          if (!focusChatTargetByStep(1)) dispatchChatKey('ArrowDown', 'ArrowDown', { target: 'active' });
        } else if (action === 'execute') {
          activateFocusedChatTarget();
        } else if (action === 'seedSlash') {
          withChatInputReady(primeChatSlashSuggestion);
        } else if (action === 'close') {
          closeChatFromParent();
        }
        return;
      }
    });
  