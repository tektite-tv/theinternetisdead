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

    function getChatInput() {
      try {
        const chatWindow = getChatWindow();
        const chatDoc = chatWindow && chatWindow.document;
        if (!chatDoc) return null;
        return chatDoc.getElementById('chatBar');
      } catch (error) {
        return null;
      }
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

    function dispatchChatKey(key, code) {
      const input = getChatInput();
      if (!input) return false;
      try {
        input.focus();
        const view = (input.ownerDocument && input.ownerDocument.defaultView) || window;
        const event = new view.KeyboardEvent('keydown', {
          key,
          code: code || key,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(event);
        return true;
      } catch (error) {
        return false;
      }
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
        return;
      }
      if (data.type === 'closeChatFromChild') {
        closeChatFromParent();
        return;
      }
      if (data.type === 'tektite:chat-control') {
        const action = String(data.action || '').trim();
        if (action === 'cycleUp') {
          dispatchChatKey('ArrowUp', 'ArrowUp');
        } else if (action === 'cycleDown') {
          dispatchChatKey('ArrowDown', 'ArrowDown');
        } else if (action === 'execute') {
          dispatchChatKey('Enter', 'Enter');
        } else if (action === 'seedSlash') {
          withChatInputReady(primeChatSlashSuggestion);
        } else if (action === 'close') {
          closeChatFromParent();
        }
        return;
      }
    });
  