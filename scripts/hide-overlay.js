(function () {
  const PARAM_NAME = 'overlay';
  const HOTKEY_KEY = 'o';
  const FALSE_VALUES = new Set(['0', 'false', 'off', 'no']);

  function getOverlayContainer() {
    return document.getElementById('overlay-container');
  }

  function getUrl() {
    return new URL(window.location.href);
  }

  function isOverlayDisabledInUrl() {
    const value = getUrl().searchParams.get(PARAM_NAME);
    return value !== null && FALSE_VALUES.has(String(value).trim().toLowerCase());
  }

  function updateUrl(disabled) {
    const url = getUrl();
    if (disabled) {
      url.searchParams.set(PARAM_NAME, 'false');
    } else {
      url.searchParams.delete(PARAM_NAME);
    }
    history.replaceState(null, '', url.toString());
  }

  function measureOverlayHeight(container) {
    if (!container) return 0;
    if (container.style.display === 'none' || container.hidden) return 0;
    return Math.ceil(container.getBoundingClientRect().height || container.offsetHeight || 0);
  }

  function refreshLayout(container) {
    const overlayHeight = measureOverlayHeight(container || getOverlayContainer());
    document.body.style.setProperty('--overlay-height', `${overlayHeight}px`);
    if (typeof window.syncOverlayLayout === 'function') {
      try {
        window.syncOverlayLayout();
      } catch (error) {
        console.error('syncOverlayLayout failed:', error);
      }
    }
    window.dispatchEvent(new CustomEvent('overlaytoggle', {
      detail: {
        hidden: overlayHeight === 0,
        overlayHeight
      }
    }));
  }

  function applyOverlayState(disabled) {
    const container = getOverlayContainer();
    if (!container) return;
    container.style.display = disabled ? 'none' : '';
    container.setAttribute('aria-hidden', disabled ? 'true' : 'false');
    document.documentElement.classList.toggle('overlay-hidden', disabled);
    document.body.classList.toggle('overlay-hidden', disabled);
    requestAnimationFrame(() => refreshLayout(container));
  }

  function toggleOverlay() {
    const disabled = !document.body.classList.contains('overlay-hidden');
    updateUrl(disabled);
    applyOverlayState(disabled);
  }

  function onKeydown(event) {
    if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey) return;
    if (event.repeat) return;
    if (String(event.key || '').toLowerCase() !== HOTKEY_KEY) return;
    event.preventDefault();
    toggleOverlay();
  }

  window.applyOverlayStateFromUrl = function () {
    applyOverlayState(isOverlayDisabledInUrl());
  };

  document.addEventListener('DOMContentLoaded', window.applyOverlayStateFromUrl);
  window.addEventListener('load', window.applyOverlayStateFromUrl);
  window.addEventListener('keydown', onKeydown, true);
})();
