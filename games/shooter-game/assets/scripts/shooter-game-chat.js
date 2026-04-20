(function(){
  'use strict';

  if (document.getElementById('chatRoot')) {

  const root = document.getElementById('chatRoot');
  const messagesWrap = document.getElementById('messagesWrap');
  const messages = document.getElementById('messages');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatBar');
  const closeBtn = document.getElementById('chatCloseBtn');
  const suggestions = document.getElementById('suggestions');
  const modeBadge = document.getElementById('chatModeBadge');
  const cheaterHold = document.getElementById('cheatermodeHoldStatus');

  const NICKNAME_KEY = 'tektiteChatNickname';
  const NICKNAME_EXPLICIT_KEY = 'tektiteChatNicknameExplicit';

  const localCommands = [
    { name:'/help', usage:'/help', desc:'Show shooter chat commands', local:true },
    { name:'/clear', usage:'/clear', desc:'Clear this visible chat log', local:true }
  ];

  let registeredCommands = [];
  let cheatsUnlocked = false;
  let inputMode = 'keyboardMouse';
  let isOpen = false;
  let activePickerCommand = '';
  let currentSuggestionIndex = -1;
  let welcomePrinted = false;
  let welcomeMessage = "System: Welcome to Tektite's Shooter Game...";

  function getParent(){
    return window.parent && window.parent !== window ? window.parent : null;
  }

  function post(message){
    const parent = getParent();
    if (!parent) return;
    parent.postMessage(message, '*');
  }

  function sendState(){
    post({
      type:'shooterChatState',
      visible:isOpen,
      valuePickerActive:!!activePickerCommand,
      valuePickerCommand:activePickerCommand || '',
      cheatsUnlocked:!!cheatsUnlocked,
      inputMode
    });
  }

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function getNickname(){
    try { return String(localStorage.getItem(NICKNAME_KEY) || '').trim(); }
    catch(error){ return ''; }
  }

  function setNickname(value){
    const next = String(value || '').trim();
    try {
      if (next) {
        localStorage.setItem(NICKNAME_KEY, next);
        localStorage.setItem(NICKNAME_EXPLICIT_KEY, 'true');
      } else {
        localStorage.removeItem(NICKNAME_KEY);
        localStorage.removeItem(NICKNAME_EXPLICIT_KEY);
      }
    } catch(error) {}
  }

  function linePrefix(kind){
    if (kind === 'user') return getNickname() || 'You';
    if (kind === 'error') return 'Error';
    if (kind === 'result') return 'System';
    return 'System';
  }

  function appendLine(text, kind = 'system'){
    if (!messages) return null;
    const line = document.createElement('p');
    line.className = `chatLine ${kind}`;
    const raw = String(text || '');
    const prefixMatch = raw.match(/^([^:]{1,32}):\s*(.*)$/s);
    let prefix = linePrefix(kind);
    let body = raw;
    if (prefixMatch && /^(system|error|you|player|tektite|jinclops)$/i.test(prefixMatch[1])) {
      prefix = prefixMatch[1];
      body = prefixMatch[2];
    }
    line.innerHTML = `<span class="prefix">${escapeHtml(prefix)}:</span> ${escapeHtml(body)}`;
    messages.appendChild(line);
    scrollToBottom();
    return line;
  }

  function scrollToBottom(){
    if (!messagesWrap) return;
    window.requestAnimationFrame(() => {
      messagesWrap.scrollTop = messagesWrap.scrollHeight;
    });
  }

  function ensureWelcome(){
    if (welcomePrinted) return;
    welcomePrinted = true;
    appendLine(welcomeMessage || "System: Welcome to Tektite's Shooter Game...", 'system');
  }

  function normalizeCommandName(command){
    return String(command || '').trim().split(/\s+/)[0].toLowerCase();
  }

  function allCommands(){
    const map = new Map();
    localCommands.concat(registeredCommands).forEach((cmd) => {
      if (!cmd || !cmd.name) return;
      const key = normalizeCommandName(cmd.name);
      if (!key || cmd.hidden) return;
      map.set(key, { ...cmd, name:key });
    });
    return Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name));
  }

  function commandByName(name){
    const key = normalizeCommandName(name);
    return allCommands().find((cmd) => normalizeCommandName(cmd.name) === key) || null;
  }

  function commandNeedsArgument(cmd){
    if (!cmd) return false;
    const name = normalizeCommandName(cmd.name);
    if (['/fullscreen','/mute','/video_fx','/color_invert','/log','/stop','/start','/clear','/help'].includes(name)) return false;
    if (name === '/cheatermode') return true;
    const usage = String(cmd.usage || '');
    return /\[|<|\s$/.test(usage) || (Array.isArray(cmd.suggestions) && cmd.suggestions.length > 0);
  }

  function usageSeedFor(cmd){
    if (!cmd) return '';
    const name = normalizeCommandName(cmd.name);
    if (name === '/cheatermode') return '/cheatermode cheatermode';
    if (String(cmd.usage || '').endsWith(' ')) return String(cmd.usage || cmd.name);
    return `${name} `;
  }

  function removeHelpBlock(){
    if (!messages) return;
    const existing = messages.querySelector('[data-shooter-help-block="true"]');
    if (existing) existing.remove();
  }

  function renderHelp(){
    if (!messages) return;
    ensureWelcome();
    const list = allCommands();
    removeHelpBlock();

    const block = document.createElement('div');
    block.className = 'chatLine system chatHelpBlock';
    block.dataset.shooterHelpBlock = 'true';
    block.innerHTML = `<span class="prefix">System:</span> <span class="chatHelpIntro">Commands</span>`;

    const ul = document.createElement('ul');
    ul.className = 'chatHelpList';
    list.forEach((cmd) => {
      const item = document.createElement('li');
      item.className = 'helpListItem';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'helpItem chat-command-link';
      btn.dataset.command = cmd.name;
      btn.title = cmd.usage || cmd.name;
      if (activePickerCommand === cmd.name) {
        const pickerType = pickerTypeForCommand(cmd);
        if (pickerType) btn.dataset[`${pickerType}PickerActive`] = 'true';
      }
      btn.innerHTML = `<span class="helpName">${escapeHtml(cmd.name)}</span><span class="helpDesc">${escapeHtml(cmd.desc || cmd.usage || '')}</span>`;
      btn.addEventListener('click', () => activateHelpCommand(cmd.name));

      item.appendChild(btn);
      ul.appendChild(item);
    });
    block.appendChild(ul);

    const welcomeLine = messages.querySelector('.chatLine.system:not(.chatHelpBlock)');
    if (welcomeLine && welcomeLine.nextSibling) {
      messages.insertBefore(block, welcomeLine.nextSibling);
    } else if (welcomeLine) {
      messages.appendChild(block);
    } else {
      messages.prepend(block);
    }
    scrollToBottom();
  }

  function hideHelp(){
    removeHelpBlock();
    activePickerCommand = '';
    sendState();
  }

  function pickerTypeForCommand(cmd){
    const name = normalizeCommandName(cmd && cmd.name);
    if (['/hearts','/lives','/bombs','/shields','/game_speed'].includes(name)) return 'number';
    if (name === '/background_color') return 'color';
    if (['/shoot','/infinite'].includes(name)) return 'choice';
    if (['/nickname','/cheatermode'].includes(name)) return 'text';
    return '';
  }

  function renderSuggestionsForCommand(cmd){
    if (!suggestions) return;
    suggestions.innerHTML = '';
    const name = normalizeCommandName(cmd && cmd.name);
    const values = Array.isArray(cmd && cmd.suggestions) ? cmd.suggestions : [];
    const fallback = {
      '/hearts':['1','3','4','8','99','100','INFINITE'],
      '/lives':['0','1','3','5','99','100','INFINITE'],
      '/bombs':['0','3','5','99','100','INFINITE'],
      '/shields':['0','1','3','99','100','INFINITE'],
      '/game_speed':['-5','0','1','5','10','20'],
      '/background_color':['#000000','#110019','#4b0076','#00ff66'],
      '/shoot':['normal','big_bullets','glitch'],
      '/infinite':['hearts','shields','lives','bombs'],
      '/cheatermode':['cheatermode']
    }[name] || [];
    const merged = Array.from(new Set(values.concat(fallback))).filter(Boolean);
    if (!merged.length) {
      suggestions.classList.remove('visible');
      return;
    }
    merged.forEach((value) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'suggestionBtn';
      btn.textContent = value;
      btn.addEventListener('click', () => {
        input.value = `${name} ${value}`;
        input.focus();
      });
      suggestions.appendChild(btn);
    });
    suggestions.classList.add('visible');
  }

  function clearSuggestions(){
    if (!suggestions) return;
    suggestions.innerHTML = '';
    suggestions.classList.remove('visible');
    currentSuggestionIndex = -1;
  }

  function activateHelpCommand(command){
    const cmd = commandByName(command);
    if (!cmd) return;
    const name = normalizeCommandName(cmd.name);
    if (commandNeedsArgument(cmd)) {
      activePickerCommand = name;
      input.value = usageSeedFor(cmd);
      input.focus();
      renderSuggestionsForCommand(cmd);
      renderHelp();
      sendState();
      return;
    }
    activePickerCommand = '';
    clearSuggestions();
    sendState();
    executeCommand(name, { echo:true });
  }

  function openChat(options = {}){
    isOpen = true;
    document.body.classList.add('chatOpen');
    ensureWelcome();
    if (options.seedSlash && input && !input.value) input.value = '/';
    if (options.focus !== false && input) window.setTimeout(() => input.focus(), 20);
    sendState();
  }

  function closeChat(){
    isOpen = false;
    activePickerCommand = '';
    clearSuggestions();
    document.body.classList.remove('chatOpen');
    sendState();
  }

  function executeCommand(raw, options = {}){
    let command = String(raw || '').trim();
    if (!command) return;
    if (command.toLowerCase() === 'cheatermode') command = '/cheatermode cheatermode';
    if (command.toLowerCase() === '/cheatermode') command = '/cheatermode cheatermode';
    const name = normalizeCommandName(command);
    clearSuggestions();
    activePickerCommand = '';
    sendState();

    if (name === '/help') {
      renderHelp();
      return;
    }

    if (options.echo !== false) appendLine(command, 'user');

    if (name === '/clear') {
      if (messages) messages.innerHTML = '';
      welcomePrinted = false;
      ensureWelcome();
      return;
    }

    post({
      type:'pageChatExecute',
      command:name,
      raw:command
    });
  }

  function updateSuggestionsFromInput(){
    const raw = input ? input.value.trim() : '';
    const name = normalizeCommandName(raw);
    const cmd = commandByName(name);
    if (!raw.startsWith('/') || !cmd || !commandNeedsArgument(cmd)) {
      clearSuggestions();
      return;
    }
    activePickerCommand = name;
    renderSuggestionsForCommand(cmd);
    renderHelp();
    sendState();
  }

  function cycleRootCommand(direction){
    const raw = input ? input.value : '';
    if (!raw.startsWith('/')) return false;
    const list = allCommands().map((cmd) => cmd.name);
    if (!list.length) return false;
    const typed = normalizeCommandName(raw);
    const matching = list.filter((name) => name.startsWith(typed || '/'));
    const pool = matching.length ? matching : list;
    currentSuggestionIndex = (currentSuggestionIndex + direction + pool.length) % pool.length;
    input.value = commandNeedsArgument(commandByName(pool[currentSuggestionIndex])) ? `${pool[currentSuggestionIndex]} ` : pool[currentSuggestionIndex];
    return true;
  }

  function handleResult(data){
    if (Object.prototype.hasOwnProperty.call(data, 'nickname')) {
      setNickname(data.nickname || '');
    }
    const msg = String(data.message || '').trim();
    if (msg) appendLine(msg, data.ok === false ? 'error' : 'result');
  }

  function registerCommands(data){
    registeredCommands = Array.isArray(data.commands) ? data.commands.map((cmd) => ({ ...cmd })) : [];
    cheatsUnlocked = !!data.cheatsUnlocked;
    inputMode = String(data.inputMode || inputMode || 'keyboardMouse');
    if (typeof data.welcomeMessage === 'string' && data.welcomeMessage.trim()) {
      welcomeMessage = data.welcomeMessage.trim();
    }
    updateModeBadge();
    renderHelp();
    post({ type:'shooterChatDvdState', sourceKey:data.sourceKey || 'shooter-game' });
    sendState();
  }

  function updateModeBadge(){
    if (!modeBadge) return;
    modeBadge.textContent = inputMode === 'controller'
      ? (cheatsUnlocked ? 'controller · cheats unlocked' : 'controller')
      : (cheatsUnlocked ? 'keyboard/mouse · cheats unlocked' : 'keyboard/mouse');
  }

  function updateCheaterHold(data){
    if (!cheaterHold) return;
    const active = !!data.active && !data.unlocked;
    cheaterHold.classList.toggle('active', active || !!data.unlocked);
    if (data.unlocked) {
      cheaterHold.textContent = 'Cheatermode unlocked';
      return;
    }
    if (!active) {
      cheaterHold.textContent = '';
      return;
    }
    const remaining = Math.max(0, Math.ceil(Number(data.remaining) || 0));
    const x = data.xPressed ? 'X' : 'x';
    const view = data.viewPressed ? 'View' : 'view';
    cheaterHold.textContent = `Hold ${x} + ${view}: ${remaining}s`;
  }

  form && form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input ? input.value : '';
    if (input) input.value = '';
    executeCommand(value, { echo:true });
  });

  closeBtn && closeBtn.addEventListener('click', closeChat);

  input && input.addEventListener('input', updateSuggestionsFromInput);

  input && input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeChat();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      cycleRootCommand(event.shiftKey ? -1 : 1);
      updateSuggestionsFromInput();
      return;
    }
    if (event.key === 'ArrowDown' && input.value.trim() === '/') {
      event.preventDefault();
      cycleRootCommand(1);
      return;
    }
  });

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    switch (data.type) {
      case 'pageChatRegister':
        registerCommands(data);
        break;
      case 'shooterChatOpen':
        openChat(data);
        break;
      case 'shooterChatClose':
        closeChat();
        break;
      case 'shooterChatExecuteCommand':
        openChat({ focus:data.focus !== false });
        executeCommand(data.command || '', { echo:true });
        break;
      case 'shooterChatActivateHelpCommand':
        activateHelpCommand(data.command || '');
        break;
      case 'shooterChatCloseActiveCommandPicker':
        activePickerCommand = '';
        clearSuggestions();
        renderHelp();
        sendState();
        break;
      case 'shooterChatInputMode':
        inputMode = String(data.mode || '').trim() === 'controller' ? 'controller' : 'keyboardMouse';
        updateModeBadge();
        sendState();
        break;
      case 'shooterChatCheatermodeHoldState':
        updateCheaterHold(data);
        break;
      case 'pageChatResult':
        handleResult(data);
        break;
      default:
        break;
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!isOpen || !root) return;
    if (event.target === root) closeChat();
  });

  window.addEventListener('load', () => {
    ensureWelcome();
    updateModeBadge();
    sendState();
  });

  // Tell the parent shell this iframe speaks the same message protocol as the old sandbox,
  // but the implementation is now local to /games/shooter-game. Tiny mercy, apparently.
  sendState();
    return;
  }

const tektiteFrame = document.getElementById('tektite-frame');
    const shooterChatFrame = document.getElementById('shooter-chat-frame');
const LEVEL1_SRC = '/games/shooter-game/assets/levels/shooter-game-level1.html';
const LEVEL2_SRC = '/games/shooter-game/assets/levels/shooter-game-level2.html?autostart=1&startWave=1';

    function buildLevel2Src() {
      return `${LEVEL2_SRC}&reload=${Date.now()}`;
    }

    function resetGameLoopWatch(options = {}) {
      try {
        if (typeof window.__tektiteResetGameLoopWatch === 'function') {
          window.__tektiteResetGameLoopWatch(options);
        }
      } catch (error) {}
    }

    function forceGameLoopFailureBackground() {
      try {
        if (typeof window.__tektiteShowGameLoopFailure === 'function') {
          window.__tektiteShowGameLoopFailure();
          return;
        }
      } catch (error) {}
      document.body.classList.add('game-loop-failed');
    }

    function clearForcedGameLoopFailureBackground() {
      try {
        if (typeof window.__tektiteClearForcedGameLoopFailure === 'function') {
          window.__tektiteClearForcedGameLoopFailure();
          return;
        }
      } catch (error) {}
      resetGameLoopWatch({ clearForced: true });
    }

    if (tektiteFrame) {
      tektiteFrame.addEventListener('load', resetGameLoopWatch);
    }
    const shooterPageCommands = [
      { name: '/background_color', desc: 'Set starfield background color', usage: '/background_color [name|hex]', suggestions: ['black', 'purple', 'lime', '#110019'] },
      { name: '/cheatermode', desc: 'Unlock cheat commands by typing the passphrase', usage: '/cheatermode', suggestions: ['cheatermode'], unlockOnly: true },
      { name: '/jinclops', desc: 'Hidden: set nickname to Jinclops and unlock cheat commands', usage: '/jinclops', hidden: true },
      { name: '/tektite', desc: 'Hidden: set nickname to Tektite and unlock cheat commands', usage: '/tektite', hidden: true },
      { name: '/bombs', desc: 'Set bombs to 0-99, or 100/INFINITE', usage: '/bombs [0-99|100|INFINITE]', suggestions: ['0', '3', '5', '99', '100', 'INFINITE'], cheatOnly: true },
      { name: '/fullscreen', desc: 'Toggle fullscreen', usage: '/fullscreen' },
      { name: '/game_speed', desc: 'Set game speed -5..20. 0 starts frozen staring-contest mode, 1 is normal', usage: '/game_speed [-5..20]', suggestions: ['-5', '0', '1', '5', '10', '20'], cheatOnly: true },
      { name: '/hearts', desc: 'Set max hearts to 1-99, or 100/INFINITE', usage: '/hearts [1-99|100|INFINITE]', suggestions: ['1', '4', '8', '99', '100', 'INFINITE'], cheatOnly: true },
      { name: '/infinite', desc: 'Toggle global infinite mode, or set one resource to infinite', usage: '/infinite', suggestions: ['hearts', 'shields', 'lives', 'bombs'], cheatOnly: true },
      { name: '/color_invert', desc: 'Toggle invert colors', usage: '/color_invert' },
      { name: '/lives', desc: 'Set lives to 0-99, or 100/INFINITE', usage: '/lives [0-99|100|INFINITE]', suggestions: ['0', '3', '5', '99', '100', 'INFINITE'], cheatOnly: true },
      { name: '/log', desc: 'Show the visible Last updated timestamp for the current level', usage: '/log' },
      { name: '/stop', desc: 'Testing: close the level iframe and expose the host 404 fallback', usage: '/stop', cheatOnly: true, hidden: true },
      { name: '/start', desc: 'Testing: reload Level 1 normally after /stop', usage: '/start', cheatOnly: true, hidden: true },
      { name: '/mute', desc: 'Toggle all shooter audio on or off', usage: '/mute' },
      { name: '/nickname', desc: 'Set the displayed username used by system messages', usage: '/nickname ', suggestions: ['Tektite', 'Guest', 'User'] },
      { name: '/shields', desc: 'Set shields to 0-99, or 100/INFINITE', usage: '/shields [0-99|100|INFINITE]', suggestions: ['0', '1', '3', '99', '100', 'INFINITE'], cheatOnly: true },
      { name: '/shoot', desc: 'Set player bullet mode', usage: '/shoot [normal|big_bullets|glitch]', suggestions: ['normal', 'big_bullets', 'glitch'], cheatOnly: true },
      { name: '/video_fx', desc: 'Toggle video effects on or off', usage: '/video_fx' }
    ];
    let hasSwitchedToLevel2 = false;
    let shooterCheatsUnlocked = false;
    let shooterChatVisible = false;
    let shooterChatReady = false;
    let chatValuePickerActive = false;
    let chatValuePickerCommand = '';
    let pendingChatOpenOptions = null;
    let chatControllerTargetIndex = -1;
    let shooterActiveInputMode = 'keyboardMouse';

    function getChatWindow() {
      return shooterChatFrame && shooterChatFrame.contentWindow ? shooterChatFrame.contentWindow : null;
    }

    function postToShooterChat(payload) {
      const chatWindow = getChatWindow();
      if (!chatWindow) return;
      chatWindow.postMessage(payload, '*');
    }

    function postInputModeToShooterChat() {
      postToShooterChat({
        type: 'shooterChatInputMode',
        mode: shooterActiveInputMode
      });
    }

    function postCheatermodeHoldStateToShooterChat(data = {}) {
      postToShooterChat({
        type: 'shooterChatCheatermodeHoldState',
        active: !!data.active,
        remaining: Math.max(0, Math.ceil(Number(data.remaining) || 0)),
        totalSeconds: Math.max(1, Math.ceil(Number(data.totalSeconds) || 5)),
        unlocked: !!data.unlocked,
        xPressed: !!data.xPressed,
        viewPressed: !!data.viewPressed
      });
    }

    function notifyChildChatVisibility() {
      try {
        if (tektiteFrame && tektiteFrame.contentWindow) {
          tektiteFrame.contentWindow.postMessage({
            type: 'tektite:shooter-chat-visibility',
            visible: !!shooterChatVisible,
            valuePickerActive: !!chatValuePickerActive,
            valuePickerCommand: chatValuePickerCommand
          }, '*');
        }
      } catch (error) {}
    }

    function notifyChildFullscreenState() {
      try {
        if (tektiteFrame && tektiteFrame.contentWindow) {
          tektiteFrame.contentWindow.postMessage({
            type: 'tektite:fullscreen-state',
            active: !!document.fullscreenElement
          }, '*');
        }
      } catch (error) {}
    }

    function setChatFrameVisible(visible) {
      shooterChatVisible = !!visible;
      shooterChatFrame.classList.toggle('visible', shooterChatVisible);
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

    function canScrollChatNode(node) {
      if (!node || typeof node.scrollTop !== 'number') return false;
      const maxScrollTop = Math.max(0, (node.scrollHeight || 0) - (node.clientHeight || 0));
      if (maxScrollTop <= 0) return false;
      const style = node.ownerDocument && node.ownerDocument.defaultView ? node.ownerDocument.defaultView.getComputedStyle(node) : null;
      if (!style) return true;
      return style.overflowY !== 'hidden' && style.overflow !== 'hidden';
    }

    function getChatScrollTarget() {
      const chatDoc = getChatDocument();
      if (!chatDoc) return null;
      const visited = new Set();
      const addCandidate = (node, collection) => {
        if (!node || visited.has(node)) return;
        visited.add(node);
        collection.push(node);
      };
      const active = chatDoc.activeElement && chatDoc.activeElement !== chatDoc.body ? chatDoc.activeElement : null;
      const controllerTargets = getChatInteractiveTargets();
      const selectedTarget = chatControllerTargetIndex >= 0 && chatControllerTargetIndex < controllerTargets.length
        ? controllerTargets[chatControllerTargetIndex]
        : null;
      const candidates = [];

      [active, selectedTarget, getChatInput()].forEach((node) => {
        let current = node;
        while (current && current !== chatDoc.body) {
          addCandidate(current, candidates);
          current = current.parentElement;
        }
      });

      const messagesWrap = chatDoc.getElementById('messagesWrap');
      addCandidate(messagesWrap, candidates);

      return candidates.find((node) => canScrollChatNode(node)) || null;
    }

    function scrollChatBy(delta) {
      const amount = Number(delta) || 0;
      if (!amount) return false;
      const target = getChatScrollTarget();
      if (!target) return false;
      const previous = target.scrollTop;
      const maxScrollTop = Math.max(0, (target.scrollHeight || 0) - (target.clientHeight || 0));
      target.scrollTop = Math.max(0, Math.min(maxScrollTop, previous + amount));
      return target.scrollTop !== previous;
    }

    function isVisibleChatTarget(node) {
      if (!node) return false;
      const style = node.ownerDocument && node.ownerDocument.defaultView ? node.ownerDocument.defaultView.getComputedStyle(node) : null;
      const hidden = style && (style.display === 'none' || style.visibility === 'hidden');
      const rect = typeof node.getBoundingClientRect === 'function' ? node.getBoundingClientRect() : null;
      return !hidden && !node.disabled && !node.hasAttribute('disabled') && !node.hasAttribute('aria-hidden') && (!rect || (rect.width > 0 && rect.height > 0)) && (!style || style.pointerEvents !== 'none');
    }

    function getChatPromptTarget() {
      const chatDoc = getChatDocument();
      if (!chatDoc) return null;
      const chatInput = getChatInput();
      if (chatInput && isVisibleChatTarget(chatInput)) return chatInput;
      const selectors = [
        '[data-chat-prompt]',
        '#chatPromptButton',
        '#chatPrompt',
        '.chat-prompt',
        '.chat-input-prompt',
        '.chat-open-prompt',
        '.chat-launcher'
      ];
      for (const selector of selectors) {
        const node = chatDoc.querySelector(selector);
        if (node && isVisibleChatTarget(node)) return node;
      }
      const textMatch = Array.from(chatDoc.querySelectorAll('button, [role="button"], a, div, span')).find((node) => {
        const text = String(node.textContent || '').trim().toLowerCase();
        return text.includes('press here to chat') || text.includes('/ for commands');
      });
      return textMatch && isVisibleChatTarget(textMatch) ? textMatch : null;
    }

    function getChatCloseTarget() {
      const chatDoc = getChatDocument();
      if (!chatDoc) return null;
      const selectors = [
        '#chatCloseBtn',
        '#closeChatBtn',
        '.chat-close-btn',
        '.chat-close',
        '[data-chat-close]',
        '[aria-label="Close chat"]',
        '[aria-label="Close"]'
      ];
      for (const selector of selectors) {
        const node = chatDoc.querySelector(selector);
        if (node && isVisibleChatTarget(node)) return node;
      }
      const textMatch = Array.from(chatDoc.querySelectorAll('button, [role="button"], a')).find((node) => {
        const text = String(node.textContent || '').trim().toLowerCase();
        return text in {'x':1, '×':1, 'close':1};
      });
      return textMatch && isVisibleChatTarget(textMatch) ? textMatch : null;
    }

    function getChatHelpCommandTargets() {
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
      const filtered = nodes.filter((node) => isVisibleChatTarget(node));
      const preferred = filtered.filter((node) => node.matches(preferredSelectors.join(',')));
      return preferred.length ? preferred : filtered;
    }

    function getChatInteractiveTargets() {
      const promptTarget = getChatPromptTarget();
      const closeTarget = getChatCloseTarget();
      const helpTargets = getChatHelpCommandTargets().filter((node) => node !== promptTarget && node !== closeTarget);
      const ordered = [];
      if (promptTarget) ordered.push(promptTarget);
      if (closeTarget) ordered.push(closeTarget);
      helpTargets.forEach((node) => {
        if (!ordered.includes(node)) ordered.push(node);
      });
      return ordered;
    }

    function rememberChatControllerBaseStyles(node) {
      if (!node) return;
      if (!node.hasAttribute('data-tektite-controller-base-bg')) node.dataset.tektiteControllerBaseBg = node.style.backgroundColor || '';
      if (!node.hasAttribute('data-tektite-controller-base-outline')) node.dataset.tektiteControllerBaseOutline = node.style.outline || '';
      if (!node.hasAttribute('data-tektite-controller-base-box-shadow')) node.dataset.tektiteControllerBaseBoxShadow = node.style.boxShadow || '';
      if (!node.hasAttribute('data-tektite-controller-base-border-radius')) node.dataset.tektiteControllerBaseBorderRadius = node.style.borderRadius || '';
      if (!node.hasAttribute('data-tektite-controller-base-color')) node.dataset.tektiteControllerBaseColor = node.style.color || '';
      if (!node.hasAttribute('data-tektite-controller-base-filter')) node.dataset.tektiteControllerBaseFilter = node.style.filter || '';
      if (!node.hasAttribute('data-tektite-controller-base-transform')) node.dataset.tektiteControllerBaseTransform = node.style.transform || '';
    }

    function updateChatControllerSelectionVisuals(selectedNode) {
      const chatDoc = getChatDocument();
      const targets = getChatInteractiveTargets();
      const previouslyTouched = chatDoc
        ? Array.from(chatDoc.querySelectorAll('[data-tektite-controller-selected], [data-tektite-controller-base-bg], [data-tektite-controller-base-outline]'))
        : [];
      const uniqueNodes = Array.from(new Set(previouslyTouched.concat(targets)));
      uniqueNodes.forEach((node) => {
        if (!node) return;
        rememberChatControllerBaseStyles(node);
        const isSelected = node === selectedNode;
        if (isSelected) {
          node.dataset.tektiteControllerSelected = 'true';
          try { node.classList.add('controllerFocus'); } catch (error) {}
          node.style.backgroundColor = 'rgba(75,0,118,0.82)';
          node.style.outline = '2px solid rgba(0,255,102,0.98)';
          node.style.boxShadow = '0 0 0 1px rgba(0,255,102,0.35), 0 0 14px rgba(0,255,102,0.28)';
          node.style.borderRadius = node.dataset.tektiteControllerBaseBorderRadius || '10px';
          node.style.color = '#ffffff';
          node.style.filter = 'brightness(1.08)';
          node.style.transform = 'translateX(0)';
        } else {
          node.dataset.tektiteControllerSelected = 'false';
          try { node.classList.remove('controllerFocus'); } catch (error) {}
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

    function focusChatPromptTarget() {
      const promptTarget = getChatPromptTarget();
      if (!promptTarget) return focusFirstChatInteractiveTarget();
      const targets = getChatInteractiveTargets();
      const index = targets.findIndex((node) => node === promptTarget);
      return focusChatTargetByIndex(index >= 0 ? index : 0);
    }

    function moveChatControllerSelection(direction) {
      const targets = getChatInteractiveTargets();
      if (!targets.length) return false;
      const currentIndex = syncChatControllerTargetIndex(targets);
      const promptTarget = getChatPromptTarget();
      const closeTarget = getChatCloseTarget();
      const helpTargets = targets.filter((node) => node !== promptTarget && node !== closeTarget);
      const current = currentIndex >= 0 ? targets[currentIndex] : null;

      if (direction === 'up') {
        if (current === promptTarget && helpTargets.length) return focusChatTargetByIndex(targets.findIndex((node) => node === helpTargets[helpTargets.length - 1]));
        if (current === closeTarget && helpTargets.length) return focusChatTargetByIndex(targets.findIndex((node) => node === helpTargets[helpTargets.length - 1]));
        if (current && helpTargets.includes(current)) {
          const helpIndex = helpTargets.indexOf(current);
          if (helpIndex > 0) return focusChatTargetByIndex(targets.findIndex((node) => node === helpTargets[helpIndex - 1]));
          if (helpIndex === 0 && promptTarget) return focusChatTargetByIndex(targets.findIndex((node) => node === promptTarget));
        }
        return focusChatPromptTarget();
      }
      if (direction === 'down') {
        if (current === promptTarget) return closeTarget ? focusChatTargetByIndex(targets.findIndex((node) => node === closeTarget)) : focusChatPromptTarget();
        if (current === closeTarget) {
          if (helpTargets.length) return focusChatTargetByIndex(targets.findIndex((node) => node === helpTargets[0]));
          return promptTarget ? focusChatTargetByIndex(targets.findIndex((node) => node === promptTarget)) : focusChatPromptTarget();
        }
        if (current && helpTargets.includes(current)) {
          const helpIndex = helpTargets.indexOf(current);
          if (helpIndex < helpTargets.length - 1) return focusChatTargetByIndex(targets.findIndex((node) => node === helpTargets[helpIndex + 1]));
          if (helpIndex === helpTargets.length - 1 && promptTarget) return focusChatTargetByIndex(targets.findIndex((node) => node === promptTarget));
        }
        return focusChatPromptTarget();
      }
      if (direction === 'right') {
        if (current === promptTarget && closeTarget) return focusChatTargetByIndex(targets.findIndex((node) => node === closeTarget));
        return current ? focusChatTargetByIndex(currentIndex) : focusChatPromptTarget();
      }
      if (direction === 'left') {
        if (current === closeTarget && promptTarget) return focusChatTargetByIndex(targets.findIndex((node) => node === promptTarget));
        return promptTarget ? focusChatTargetByIndex(targets.findIndex((node) => node === promptTarget)) : focusFirstChatInteractiveTarget();
      }
      return false;
    }

    function hasActiveChatValuePicker() {
      const chatDoc = getChatDocument();
      if (!chatDoc) return false;
      return !!chatDoc.querySelector('.helpItem[data-number-picker-active="true"], .helpItem[data-color-picker-active="true"], .helpItem[data-choice-picker-active="true"], .helpItem[data-text-picker-active="true"]');
    }


    function closeActiveChatValuePickerFromParent() {
      const chatDoc = getChatDocument();
      const activePickerItem = chatDoc
        ? chatDoc.querySelector('.helpItem[data-number-picker-active="true"], .helpItem[data-color-picker-active="true"], .helpItem[data-choice-picker-active="true"], .helpItem[data-text-picker-active="true"]')
        : null;
      postToShooterChat({ type: 'shooterChatCloseActiveCommandPicker' });
      if (activePickerItem) {
        const targets = getChatInteractiveTargets();
        const pickerIndex = targets.findIndex((node) => node === activePickerItem);
        if (pickerIndex >= 0) {
          chatControllerTargetIndex = pickerIndex;
          updateChatControllerSelectionVisuals(activePickerItem);
        }
      }
      chatValuePickerActive = false;
      chatValuePickerCommand = '';
      notifyChildChatVisibility();
      return true;
    }

    function activateFocusedChatTarget() {
      const targets = getChatInteractiveTargets();
      const activeIndex = syncChatControllerTargetIndex(targets);
      const target = activeIndex >= 0 ? targets[activeIndex] : null;
      const chatDoc = getChatDocument();
      const active = target || (chatDoc && chatDoc.activeElement ? chatDoc.activeElement : null);
      if (active && chatDoc && active !== chatDoc.body) {
        const activeTag = active.tagName ? active.tagName.toUpperCase() : '';
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || active.isContentEditable) {
          return dispatchChatKey('Enter', 'Enter', { target: 'active' });
        }
        const command = active.dataset && typeof active.dataset.command === 'string' ? active.dataset.command.trim() : '';
        if (command && getChatWindow()) {
          postToShooterChat({
            type: 'shooterChatActivateHelpCommand',
            command
          });
          return true;
        }
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
      const normalizedCommand = String(command || '').trim();
      if (!normalizedCommand || !shooterChatReady || !getChatWindow()) return false;
      chatControllerTargetIndex = -1;
      postToShooterChat({
        type: 'shooterChatExecuteCommand',
        command: normalizedCommand,
        openChat: true,
        focus: true
      });
      return true;
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
      if (!pendingChatOpenOptions || !shooterChatReady) return;
      const options = pendingChatOpenOptions;
      pendingChatOpenOptions = null;
      postToShooterChat({
        type: 'shooterChatOpen',
        focus: options.focus !== false,
        seedSlash: !!options.seedSlash
      });
      if (options.runCommand) {
        withChatInputReady(() => runChatCommand(options.runCommand));
      } else if (options.autoSuggestSlash) {
        withChatInputReady(primeChatSlashSuggestion);
      }
    }

    function openChatFromParent(options = {}) {
      chatControllerTargetIndex = -1;
      try {
        if (tektiteFrame && tektiteFrame.contentWindow) {
          tektiteFrame.contentWindow.postMessage({
            type: 'tektite:pause-for-shooter-chat'
          }, '*');
        }
      } catch (error) {}
      setChatFrameVisible(true);
      pendingChatOpenOptions = {
        focus: options.focus !== false,
        seedSlash: !!options.seedSlash,
        autoSuggestSlash: !!options.autoSuggestSlash,
        runCommand: options.runCommand ? String(options.runCommand).trim() : ''
      };
      flushPendingChatOpen();
    }

    function closeChatFromParent() {
      chatControllerTargetIndex = -1;
      updateChatControllerSelectionVisuals(null);
      postToShooterChat({ type: 'shooterChatClose' });
      setChatFrameVisible(false);
      try { tektiteFrame.contentWindow.focus(); } catch (error) {}
    }

    function getVisibleShooterPageCommands() {
      return shooterPageCommands
        .filter((command) => {
          if (shooterCheatsUnlocked) return command.unlockOnly !== true;
          return command.cheatOnly !== true;
        })
        .map((command) => ({ ...command }));
    }

    function registerPageCommands() {
      postToShooterChat({
        type: 'pageChatRegister',
        commands: getVisibleShooterPageCommands(),
        pageOnly: true,
        pageId: hasSwitchedToLevel2 ? 'shooter-game-level2' : 'shooter-game-level1',
        title: 'Tektite Shooter',
        sourceKey: 'shooter-game',
        cheatsUnlocked: shooterCheatsUnlocked,
        inputMode: shooterActiveInputMode,
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
      } finally {
        notifyChildFullscreenState();
      }
    }

    function stopShooterLevelFramesFor404() {
      hasSwitchedToLevel2 = false;
      forceGameLoopFailureBackground();
      const levelFrames = Array.from(document.querySelectorAll('iframe')).filter((frame) => {
        const src = String(frame.getAttribute('src') || '');
        return frame.id === 'tektite-frame' || src.includes('shooter-game-level1.html') || src.includes('shooter-game-level2.html');
      });
      levelFrames.forEach((frame) => {
        frame.dataset.tektiteStoppedByCommand = 'true';
        frame.style.opacity = '0';
        frame.style.visibility = 'hidden';
        frame.style.pointerEvents = 'none';
        frame.removeAttribute('srcdoc');
        frame.setAttribute('src', 'about:blank');
      });
    }

    function startShooterLevel1FromCommand() {
      hasSwitchedToLevel2 = false;
      clearForcedGameLoopFailureBackground();
      if (!tektiteFrame) return;
      tektiteFrame.dataset.tektiteStoppedByCommand = 'false';
      tektiteFrame.style.opacity = '';
      tektiteFrame.style.visibility = '';
      tektiteFrame.style.pointerEvents = '';
      resetGameLoopWatch({ clearForced: true });
      tektiteFrame.src = `${LEVEL1_SRC}?reload=${Date.now()}`;
      registerPageCommands();
      try { tektiteFrame.focus(); } catch (error) {}
    }

    function switchToLevel2() {
      if (!tektiteFrame || hasSwitchedToLevel2) return;
      hasSwitchedToLevel2 = true;
      const keepFullscreen = !!document.fullscreenElement;
      resetGameLoopWatch({ clearForced: true });
        tektiteFrame.style.opacity = '';
        tektiteFrame.style.visibility = '';
        tektiteFrame.style.pointerEvents = '';
        tektiteFrame.src = buildLevel2Src();
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
      resetGameLoopWatch({ clearForced: true });
        tektiteFrame.style.opacity = '';
        tektiteFrame.style.visibility = '';
        tektiteFrame.style.pointerEvents = '';
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
        openChatFromParent({ focus: true, runCommand: '/help' });
        return;
      }

      if (event.key === 'Escape' && shooterChatVisible) {
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

    shooterChatFrame.addEventListener('load', () => {
      shooterChatReady = true;
      flushPendingChatOpen();
      registerPageCommands();
      postInputModeToShooterChat();
      bindChatShortcutToFrame(shooterChatFrame);
    });

    tektiteFrame.addEventListener('load', () => {
      bindChatShortcutToFrame(tektiteFrame);
      registerPageCommands();
      notifyChildFullscreenState();
    });

    document.addEventListener('fullscreenchange', notifyChildFullscreenState);

    window.addEventListener('message', async (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (event.source === getChatWindow()) {
        if (data.type === 'shooterChatState') {
          shooterChatReady = true;
          chatValuePickerActive = !!data.valuePickerActive;
          chatValuePickerCommand = chatValuePickerActive ? String(data.valuePickerCommand || '').trim().toLowerCase() : '';
          flushPendingChatOpen();
          setChatFrameVisible(!!data.visible);
          return;
        }
        if (data.type === 'pageChatExecute') {
          const rawCommand = String(data.raw || data.command || '').trim();
          const commandName = String(data.command || '').trim().toLowerCase();
          if (commandName === '/stop') {
            if (!shooterCheatsUnlocked) {
              postToShooterChat({
                type: 'pageChatResult',
                command: '/stop',
                message: '/stop requires cheatermode to be active.',
                announce: true
              });
              return;
            }
            stopShooterLevelFramesFor404();
            postToShooterChat({
              type: 'pageChatResult',
              command: '/stop',
              message: '/stop executed. Level iframe closed; 404 test background exposed.',
              announce: true
            });
            return;
          }
          if (commandName === '/start') {
            if (!shooterCheatsUnlocked) {
              postToShooterChat({
                type: 'pageChatResult',
                command: '/start',
                message: '/start requires cheatermode to be active.',
                announce: true
              });
              return;
            }
            startShooterLevel1FromCommand();
            postToShooterChat({
              type: 'pageChatResult',
              command: '/start',
              message: '/start executed. Level 1 loading normally.',
              announce: true
            });
            return;
          }
          if (commandName === '/nickname') {
            const nextNickname = rawCommand.slice('/nickname'.length).trim();
            postToShooterChat({
              type: 'pageChatResult',
              command: '/nickname',
              message: nextNickname ? `/nickname executed by ${nextNickname}` : 'Usage: /nickname [name]',
              nickname: nextNickname || '',
              announce: true
            });
            return;
          }
          if (tektiteFrame && tektiteFrame.contentWindow) {
            tektiteFrame.contentWindow.postMessage({
              type: 'tektite:execute-command',
              command: rawCommand
            }, '*');
          }
          return;
        }
      }

      if (data.type === 'tektite:input-mode') {
        const nextMode = String(data.mode || '').trim() === 'controller' ? 'controller' : 'keyboardMouse';
        if (shooterActiveInputMode !== nextMode) {
          shooterActiveInputMode = nextMode;
          postInputModeToShooterChat();
        }
        return;
      }

      if (data.type === 'tektite:cheats-unlocked-state') {
        shooterCheatsUnlocked = !!data.unlocked;
        registerPageCommands();
        return;
      }

      if (data.type === 'tektite:cheatermode-hold-state') {
        postCheatermodeHoldStateToShooterChat(data);
        return;
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
        else await setIframeFullscreen(!document.fullscreenElement);
        return;
      }
      if (data.type === 'tektite:set-nickname') {
        const nextNickname = String(data.nickname || '').trim();
        postToShooterChat({
          type: 'pageChatResult',
          command: '/nickname',
          message: nextNickname ? `/nickname executed by ${nextNickname}` : 'Nickname cleared.',
          nickname: nextNickname,
          announce: data.announce === true
        });
        return;
      }
      if (data.type === 'tektite:command-result') {
        postToShooterChat({
          type: 'pageChatResult',
          command: data.command || '',
          message: data.message || `${data.command || 'Command'} executed`,
          announce: true
        });
        return;
      }
      if (data.type === 'tektite:open-shooter-chat') {
        openChatFromParent({
          focus: true,
          seedSlash: !!data.seedSlash,
          autoSuggestSlash: !!data.autoSuggestSlash,
          runCommand: data.runCommand ? String(data.runCommand) : ''
        });
        return;
      }
      if (data.type === 'tektite:close-shooter-chat') {
        closeChatFromParent();
        return;
      }
      if (data.type === 'tektite:shooter-chat-control') {
        const action = String(data.action || '').trim();
        const valuePickerActive = hasActiveChatValuePicker();
        if (action === 'cycleUp') {
          if (valuePickerActive) dispatchChatKey('ArrowUp', 'ArrowUp', { target: 'active' });
          else if (!moveChatControllerSelection('up')) dispatchChatKey('ArrowUp', 'ArrowUp', { target: 'active' });
        } else if (action === 'cycleDown') {
          if (valuePickerActive) dispatchChatKey('ArrowDown', 'ArrowDown', { target: 'active' });
          else if (!moveChatControllerSelection('down')) dispatchChatKey('ArrowDown', 'ArrowDown', { target: 'active' });
        } else if (action === 'cycleLeft') {
          if (valuePickerActive) dispatchChatKey('ArrowLeft', 'ArrowLeft', { target: 'active' });
          else if (!moveChatControllerSelection('left')) dispatchChatKey('ArrowLeft', 'ArrowLeft', { target: 'active' });
        } else if (action === 'cycleRight') {
          if (valuePickerActive) dispatchChatKey('ArrowRight', 'ArrowRight', { target: 'active' });
          else if (!moveChatControllerSelection('right')) dispatchChatKey('ArrowRight', 'ArrowRight', { target: 'active' });
        } else if (action === 'execute') {
          activateFocusedChatTarget();
        } else if (action === 'seedSlash') {
          withChatInputReady(primeChatSlashSuggestion);
        } else if (action === 'close') {
          if (valuePickerActive) closeActiveChatValuePickerFromParent();
          else closeChatFromParent();
        } else if (action === 'scrollUp') {
          scrollChatBy(-72);
        } else if (action === 'scrollDown') {
          scrollChatBy(72);
        }
        chatValuePickerActive = hasActiveChatValuePicker();
        notifyChildChatVisibility();
        return;
      }
    });
})();
