(function(global){
  const TektiteGameUtils = {
    requestHostFullscreen(action = "toggle") {
      if (global.TektiteHostBridge && typeof global.TektiteHostBridge.requestFullscreen === "function") {
        return global.TektiteHostBridge.requestFullscreen(action);
      }
      if (global.parent && global.parent !== global) {
        try {
          global.parent.postMessage({ type: "tektite:fullscreen", action }, "*");
          return true;
        } catch (e) {}
      }
      return false;
    },

    toggleFullscreen() {
      try {
        if (TektiteGameUtils.requestHostFullscreen("toggle")) return;
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
          if (elem.requestFullscreen) elem.requestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      } catch (e) {}
    },

    parseCountOrInfinite(arg) {
      const a = String(arg || "").trim().toLowerCase();
      if (!a) return null;
      if (a === "infinite" || a === "inf" || a === "∞" || a === "forever") {
        return { infinite: true, value: 999999 };
      }
      const n = parseInt(a, 10);
      if (isNaN(n)) return null;
      return { infinite: false, value: Math.max(0, n) };
    },

    norm(value) {
      return String(value || "").trim().toLowerCase();
    },

    rand(min, max) {
      return min + Math.random() * (max - min);
    }
  };

  global.TektiteGameUtils = TektiteGameUtils;
})(window);
