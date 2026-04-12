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

    function setChatFrameVisible(visible) {
      chatSandboxVisible = !!visible;
      chatSandboxFrame.classList.toggle('visible', chatSandboxVisible);
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
      pendingChatOpenOptions = { focus: options.focus !== false, seedSlash: !!options.seedSlash };
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
      if (!tektiteFrame) return;
      try {
        const fsElement = document.fullscreenElement;
        if (shouldEnter) {
          if (fsElement !== tektiteFrame && tektiteFrame.requestFullscreen) {
            await tektiteFrame.requestFullscreen();
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
      const keepFullscreen = document.fullscreenElement === tektiteFrame;
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
      const keepFullscreen = document.fullscreenElement === tektiteFrame;
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
        openChatFromParent({ focus: true, seedSlash: !!data.seedSlash });
      }
    });
  