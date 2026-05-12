(() => {
  if (window.__tektiteSuiteVolumeLoaded) return;
  window.__tektiteSuiteVolumeLoaded = true;

  const DEFAULTS = {
    mainVolume: 100
  };

  let masterVolume = 100;
  let tabVolume = 100;
  let observer = null;

  function clampVolume(value, fallback = 100) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(0, Math.min(100, number));
  }

  function effectiveMediaVolume() {
    return Math.max(0, Math.min(1, (masterVolume / 100) * (tabVolume / 100)));
  }

  function getMediaElements() {
    return Array.from(document.querySelectorAll("audio, video"));
  }

  function applyVolume() {
    const volume = effectiveMediaVolume();

    for (const media of getMediaElements()) {
      try {
        media.volume = volume;
      } catch (error) {
        // Some embedded players are precious little locked boxes. Let them be annoying elsewhere.
      }
    }
  }

  function getReport() {
    const media = getMediaElements();
    const activeMedia = media.filter((item) => {
      try {
        return !item.paused || item.currentTime > 0 || item.readyState > 0;
      } catch (error) {
        return true;
      }
    });

    return {
      ok: true,
      mediaCount: media.length,
      activeMediaCount: activeMedia.length,
      masterVolume,
      tabVolume,
      effectiveVolume: Math.round(effectiveMediaVolume() * 100)
    };
  }

  function ensureObserver() {
    if (observer) return;

    observer = new MutationObserver(() => applyVolume());
    observer.observe(document.documentElement || document, {
      childList: true,
      subtree: true
    });
  }

  chrome.storage.local.get(DEFAULTS, (items) => {
    masterVolume = clampVolume(items.mainVolume, 100);
    applyVolume();
    ensureObserver();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (!changes.mainVolume) return;

    masterVolume = clampVolume(changes.mainVolume.newValue, 100);
    applyVolume();
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== "object") return false;

    if (message.type === "TEKTITE_SUITE_VOLUME_REPORT") {
      sendResponse(getReport());
      return true;
    }

    if (message.type === "TEKTITE_SUITE_VOLUME_SET") {
      masterVolume = clampVolume(message.masterVolume, masterVolume);
      tabVolume = clampVolume(message.tabVolume, tabVolume);
      applyVolume();
      sendResponse(getReport());
      return true;
    }

    return false;
  });
})();
