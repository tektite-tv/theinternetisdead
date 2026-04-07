(function (global) {
  const MESSAGE_TYPES = Object.freeze({
    CONTINUE_TO_LEVEL2: 'tektite:continue-to-level2',
    RETURN_TO_LEVEL1: 'tektite:return-to-level1',
    FULLSCREEN: 'tektite:fullscreen'
  });

  function isEmbedded() {
    return !!(global.parent && global.parent !== global);
  }

  function postToHost(type, payload) {
    if (!isEmbedded()) return false;
    try {
      global.parent.postMessage(Object.assign({ type }, payload || {}), '*');
      return true;
    } catch (error) {
      console.warn('Host bridge postMessage failed.', error);
      return false;
    }
  }

  function requestFullscreen(action) {
    return postToHost(MESSAGE_TYPES.FULLSCREEN, { action: action || 'toggle' });
  }

  function notifyContinueToLevel2() {
    return postToHost(MESSAGE_TYPES.CONTINUE_TO_LEVEL2);
  }

  function notifyReturnToLevel1() {
    return postToHost(MESSAGE_TYPES.RETURN_TO_LEVEL1);
  }

  global.TektiteHostBridge = {
    MESSAGE_TYPES,
    isEmbedded,
    postToHost,
    requestFullscreen,
    notifyContinueToLevel2,
    notifyReturnToLevel1
  };
})(window);
