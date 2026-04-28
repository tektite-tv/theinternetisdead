(function () {
  function getIndexChatGotoSuggestions() {
    if (typeof window.normalizeIndexGotoSuggestions === 'function') {
      return window.normalizeIndexGotoSuggestions(window.indexGotoSuggestions);
    }
    return Array.isArray(window.indexGotoSuggestions) && window.indexGotoSuggestions.length
      ? window.indexGotoSuggestions
      : ['/'];
  }

  const controller = {
    getRegistrationPayload() {
      const gotoSuggestions = getIndexChatGotoSuggestions();
      return {
        type: 'pageChatRegister',
        pageOnly: false,
        pageId: 'index-home',
        title: 'The Internet Is Dead',
        sourceKey: 'index-home',
        commands: [
          {
            name: '/customize',
            usage: '/customize',
            desc: 'open chat customize plus a matching Customize Page panel for overlay and page colors',
            execute: true,
            replaceBuiltIn: true,
            passthroughBuiltIn: false
          },
          {
            name: '/clock_time',
            usage: '/clock_time 4:20pm',
            desc: 'set the overlay clock to a manual time string',
            execute: false,
            suggestions: ['4:20pm', '07:10am', '23:59:59']
          },
          {
            name: '/clock_date',
            usage: '/clock_date Saturday / March 28 / 2026',
            desc: 'set the overlay clock to a manual date string',
            execute: false,
            suggestions: ['Saturday / March 28 / 2026', 'Thursday / April 9 / 2026']
          },
          {
            name: '/clock_reset',
            usage: '/clock_reset',
            desc: 'reset the overlay clock to live Toronto time',
            execute: true
          },
          {
            name: '/clock_zone',
            usage: '/clock_zone America/Toronto',
            desc: 'sync the overlay clock to a named timezone',
            execute: false,
            suggestions: Array.isArray(window.allClockZones) ? window.allClockZones : []
          },
          {
            name: '/color_element',
            usage: '/color_element',
            desc: 'toggle click-to-pick color mode for page customize elements',
            execute: true
          },
          {
            name: '/goto',
            usage: '/goto /',
            desc: 'go to a folder on the site',
            execute: false,
            suggestions: gotoSuggestions,
            replaceBuiltIn: true
          }
        ]
      };
    },

    handlePageChatExecute(eventData) {
      const commandName = String(eventData && eventData.command || '').toLowerCase();
      const rawCommand = typeof eventData?.raw === 'string' ? eventData.raw.trim() : '';
      const commandValue = rawCommand ? rawCommand.slice(commandName.length).trim() : '';

      if (commandName === '/customize') {
        window.sendPageCustomizePanel({ includeBaseCustomize: true, announce: true });
        return true;
      }

      if (commandName === '/clock_time') {
        if (!commandValue) {
          window.postToChatSandbox({
            type: 'pageChatResult',
            command: '/clock_time',
            message: 'Usage: /clock_time [time]',
            announce: true
          });
          return true;
        }
        const nextSiteClock = window.setSiteTimeFromInput(commandValue, window.sanitizeClockZone(window.overlayClockState.zone));
        if (!nextSiteClock) {
          window.postToChatSandbox({
            type: 'pageChatResult',
            command: '/clock_time',
            message: 'Invalid time. Use h:mm, h:mm:ss, or add am/pm.',
            announce: true
          });
          return true;
        }
        window.setOverlayClockStateFromPage({ mode: 'time', manualTime: '', manualDate: '' });
        window.postToChatSandbox({
          type: 'pageChatResult',
          command: '/clock_time',
          message: `/clock_time executed: ${commandValue}`,
          announce: true
        });
        return true;
      }

      if (commandName === '/clock_date') {
        if (!commandValue) {
          window.postToChatSandbox({
            type: 'pageChatResult',
            command: '/clock_date',
            message: 'Usage: /clock_date [date]',
            announce: true
          });
          return true;
        }
        const nextSiteClock = window.setSiteDateFromInput(commandValue, window.sanitizeClockZone(window.overlayClockState.zone));
        if (!nextSiteClock) {
          window.postToChatSandbox({
            type: 'pageChatResult',
            command: '/clock_date',
            message: 'Invalid date. Try YYYY-MM-DD or a readable month/day/year.',
            announce: true
          });
          return true;
        }
        window.setOverlayClockStateFromPage({ mode: 'date', manualTime: '', manualDate: '' });
        window.postToChatSandbox({
          type: 'pageChatResult',
          command: '/clock_date',
          message: `/clock_date executed: ${commandValue}`,
          announce: true
        });
        return true;
      }

      if (commandName === '/color_element') {
        const enabled = window.toggleColorElementMode();
        window.closeChatFromParent();
        window.postToChatSandbox({
          type: 'pageChatResult',
          command: '/color_element',
          message: enabled ? '/color_element click mode enabled' : '/color_element click mode disabled',
          announce: false
        });
        return true;
      }

      if (commandName === '/goto') {
        const gotoSuggestions = getIndexChatGotoSuggestions();
        if (!commandValue) {
          window.postToChatSandbox({
            type: 'pageChatResult',
            panel: 'gotoFolders',
            command: '/goto',
            message: '/goto executed',
            folders: gotoSuggestions,
            announce: true
          });
          return true;
        }
        const target = gotoSuggestions.includes(commandValue) ? commandValue : '/';
        const href = target === '/' ? '/index.html' : target;
        try {
          window.location.href = href;
        } catch (error) {
          window.location.assign(href);
        }
        return true;
      }

      if (commandName === '/clock_reset') {
        window.setSiteClockStateFromPage({
          zone: window.defaultClockZone,
          overrideTimestampMs: null,
          overrideStartedRealMs: null
        });
        window.setOverlayClockStateFromPage({
          mode: 'time',
          zone: window.defaultClockZone,
          manualTime: '',
          manualDate: ''
        });
        window.postToChatSandbox({
          type: 'pageChatResult',
          command: '/clock_reset',
          message: '/clock_reset executed: synced to America/Toronto',
          announce: true
        });
        return true;
      }

      if (commandName === '/clock_zone') {
        const nextZone = window.sanitizeClockZone(commandValue);
        if (!commandValue) {
          window.postToChatSandbox({
            type: 'pageChatResult',
            command: '/clock_zone',
            message: 'Usage: /clock_zone [timezone]',
            announce: true
          });
          return true;
        }
        if (nextZone !== commandValue.trim()) {
          window.postToChatSandbox({
            type: 'pageChatResult',
            command: '/clock_zone',
            message: `Unknown timezone: ${commandValue}`,
            announce: true
          });
          return true;
        }
        window.setSiteClockStateFromPage({ zone: nextZone, overrideTimestampMs: null, overrideStartedRealMs: null });
        window.setOverlayClockStateFromPage({ mode: 'time', zone: nextZone, manualTime: '', manualDate: '' });
        window.postToChatSandbox({
          type: 'pageChatResult',
          command: '/clock_zone',
          message: `/clock_zone executed: synced to ${nextZone}`,
          announce: true
        });
        return true;
      }

      return false;
    }
  };


  window.TektiteIndexChatController = controller;

  // Re-register after this external controller loads. index.html can register once
  // before /scripts/index-chat.js finishes loading, because apparently web pages
  // are built out of timing goblins and duct tape.
  if (typeof window.registerPageCommands === 'function') {
    window.registerPageCommands();
  } else {
    const frame = document.getElementById('chat-sandbox-frame');
    if (frame && frame.contentWindow) {
      try {
        frame.contentWindow.postMessage(controller.getRegistrationPayload(), '*');
      } catch (error) {
      }
    }
  }
})();
