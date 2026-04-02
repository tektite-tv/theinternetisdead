(function(){
  const api = window.hostChatApi;
  if (!api || typeof api.registerCommands !== 'function') {
    console.error('hostChatApi is not available for index-chat.js');
    return;
  }

  const commands = [
    { name: '/help', desc: 'show homepage command help', usage: '/help', execute: true },
    { name: '/customize', desc: 'open homepage customize controls', usage: '/customize', execute: true }
  ];

  const homepageCustomizeControls = [
    { key: 'shellBg', label: 'Shell Background' },
    { key: 'overlayTopbarBg', label: 'Overlay Topbar Background' },
    { key: 'overlaySidebarBg', label: 'Overlay Sidebar Background' },
    { key: 'overlayLinkBg', label: 'Overlay Link Background' },
    { key: 'overlayLinkText', label: 'Overlay Link Text / Accent' },
    { key: 'pageBg', label: 'Homepage Background' },
    { key: 'pageText', label: 'Homepage Text' },
    { key: 'pageHeaderBg', label: 'Homepage Header Background' },
    { key: 'pageAccent', label: 'Homepage Border / Accent' },
    { key: 'pageControlBg', label: 'Homepage Buttons / Search Background' }
  ];

  function buildHelpText(){
    return [
      'Commands for index.html',
      '/help - show homepage command help',
      '/customize - open homepage customize controls'
    ].join('\n');
  }

  api.registerCommands({
    pageId: 'index',
    title: 'index.html',
    commands,
    async execute(ctx){
      const command = String(ctx.command || '').toLowerCase();
      if (command === '/help') {
        return { command, ok: true, message: buildHelpText() };
      }
      if (command === '/customize') {
        const state = typeof api.getHomepageCustomizeState === 'function'
          ? api.getHomepageCustomizeState()
          : {};
        return {
          command,
          ok: true,
          message: 'Homepage Customize',
          panel: 'homepageCustomize',
          includeBaseCustomize: true,
          state,
          controls: homepageCustomizeControls
        };
      }
      return { command, ok: false, message: command + ' is not a known page command' };
    }
  });
})();
