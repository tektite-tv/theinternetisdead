(() => {
  if (window.__tektiteSuiteReaderLoaded) return;
  window.__tektiteSuiteReaderLoaded = true;

  const DEFAULT_SETTINGS = {
    readerEnabled: true,
    readerVoice: "Microsoft David",
    readerRate: 100,
    readerPitch: 100,
    readerHighlightWords: true
  };

  let selectedText = "";
  let lastSelectedText = "";
  let hideTimer = null;
  let savedControlPosition = null;
  let dragState = null;
  let suppressNextClick = false;
  let activeSelectionRange = null;
  let activeSelectionText = "";
  let activeSpeechOffsetBase = 0;
  let activeUtterance = null;

  const POSITION_STORAGE_KEY = "tektiteReaderControlPosition";
  const READ_HIGHLIGHT_NAME = "ms-david-reader-read-so-far";
  const CURRENT_HIGHLIGHT_NAME = "ms-david-reader-current-word";
  const STYLE_ID = "tektite-suite-reader-style";

  function ensureReaderStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #ms-david-selection-reader-controls {
        position: fixed;
        z-index: 2147483647;
        display: none;
        align-items: center;
        gap: 0;
        padding: 8px;
        border: 2px solid #99ff00;
        border-radius: 999px;
        background: rgba(26, 0, 38, 0.94);
        box-shadow: 0 0 12px rgba(153, 255, 0, 0.35), 0 0 22px rgba(128, 0, 255, 0.22);
        font-family: Courier New, monospace;
        pointer-events: auto;
        user-select: none;
        backdrop-filter: blur(3px);
        opacity: 0.15;
        transition: opacity 120ms ease, width 160ms ease;
        cursor: move;
      }

      #ms-david-selection-reader-controls.is-visible {
        display: inline-flex;
      }

      #ms-david-selection-reader-controls:hover,
      #ms-david-selection-reader-controls.is-dragging {
        opacity: 1;
      }

      .ms-david-reader-button {
        position: relative;
        z-index: 1;
        width: 48px;
        height: 48px;
        border: 2px solid rgba(153, 255, 0, 0.55);
        border-radius: 999px;
        background: rgba(81, 42, 103, 0.85);
        color: #99ff00;
        font: 700 28px/1 Courier New, monospace;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .ms-david-reader-button:hover {
        background: rgba(153, 255, 0, 0.18);
        border-color: #99ff00;
        box-shadow: 0 0 10px rgba(153, 255, 0, 0.35);
      }

      #ms-david-selection-reader-controls .ms-david-reader-button + .ms-david-reader-button {
        width: 0;
        min-width: 0;
        margin-left: 0;
        padding: 0;
        border-width: 0;
        opacity: 0;
        transform: translateX(-12px) scale(0.92);
        overflow: hidden;
        pointer-events: none;
        transition: width 180ms ease, margin-left 180ms ease, opacity 140ms ease, transform 180ms ease, border-width 180ms ease;
      }

      #ms-david-selection-reader-controls:hover .ms-david-reader-button + .ms-david-reader-button,
      #ms-david-selection-reader-controls.is-dragging .ms-david-reader-button + .ms-david-reader-button {
        width: 48px;
        margin-left: 8px;
        border-width: 2px;
        opacity: 1;
        transform: translateX(0) scale(1);
        pointer-events: auto;
      }

      ::highlight(ms-david-reader-read-so-far) {
        color: #99ff00;
        background: rgba(153, 255, 0, 0.16);
      }

      ::highlight(ms-david-reader-current-word) {
        color: #99ff00;
        background: #000000;
      }
    `;
    document.documentElement.appendChild(style);
  }

  ensureReaderStyle();

  const controls = document.createElement("div");
  controls.id = "ms-david-selection-reader-controls";
  controls.setAttribute("role", "toolbar");
  controls.setAttribute("aria-label", "theinternetisdead reader selection controls");

  const playButton = document.createElement("button");
  playButton.className = "ms-david-reader-button";
  playButton.type = "button";
  playButton.title = "Read selected text";
  playButton.setAttribute("aria-label", "Read selected text");
  playButton.textContent = "▶";

  const stopButton = document.createElement("button");
  stopButton.className = "ms-david-reader-button";
  stopButton.type = "button";
  stopButton.title = "Stop reading";
  stopButton.setAttribute("aria-label", "Stop reading");
  stopButton.textContent = "■";

  controls.append(playButton, stopButton);
  document.documentElement.appendChild(controls);

  chrome.storage.local.get({ [POSITION_STORAGE_KEY]: null }, (items) => {
    const position = items?.[POSITION_STORAGE_KEY];
    if (position && Number.isFinite(position.left) && Number.isFinite(position.top)) {
      savedControlPosition = position;
    }
  });

  function getSelectionText({ trim = true } = {}) {
    const text = String(window.getSelection?.()?.toString() || "");
    return trim ? text.trim() : text;
  }

  function clearReadingHighlights() {
    try {
      CSS?.highlights?.delete(READ_HIGHLIGHT_NAME);
      CSS?.highlights?.delete(CURRENT_HIGHLIGHT_NAME);
    } catch {
      // CSS Highlights are Chromium/Edge-era magic. If missing, speech still works.
    }
  }

  function rememberSelectionRange() {
    const selection = window.getSelection?.();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    activeSelectionRange = selection.getRangeAt(0).cloneRange();
    activeSelectionText = selection.toString();
    clearReadingHighlights();
  }

  function getTextSegmentsInRange(range) {
    const segments = [];
    const root = range.commonAncestorContainer;
    const walkerRoot = root.nodeType === Node.TEXT_NODE ? root.parentNode : root;
    if (!walkerRoot) return segments;

    const walker = document.createTreeWalker(walkerRoot, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    let absoluteStart = 0;
    let node;
    while ((node = walker.nextNode())) {
      let start = 0;
      let end = node.nodeValue.length;

      if (node === range.startContainer) start = range.startOffset;
      if (node === range.endContainer) end = range.endOffset;
      if (end <= start) continue;

      const length = end - start;
      segments.push({ node, start, end, absoluteStart, absoluteEnd: absoluteStart + length });
      absoluteStart += length;
    }

    return segments;
  }

  function makeRangesForOffsets(range, startOffset, endOffset) {
    if (!range || !CSS?.highlights || endOffset <= startOffset) return [];

    const segments = getTextSegmentsInRange(range);
    const ranges = [];

    for (const segment of segments) {
      const localStartAbsolute = Math.max(startOffset, segment.absoluteStart);
      const localEndAbsolute = Math.min(endOffset, segment.absoluteEnd);
      if (localEndAbsolute <= localStartAbsolute) continue;

      const highlightRange = document.createRange();
      highlightRange.setStart(segment.node, segment.start + (localStartAbsolute - segment.absoluteStart));
      highlightRange.setEnd(segment.node, segment.start + (localEndAbsolute - segment.absoluteStart));
      ranges.push(highlightRange);
    }

    return ranges;
  }

  function expandCurrentWordOffsets(text, charIndex, charLength) {
    const safeIndex = Math.max(0, Math.min(text.length, activeSpeechOffsetBase + (Number(charIndex) || 0)));
    let start = safeIndex;
    let end = Math.max(start + 1, start + (Number(charLength) || 0));

    while (start > 0 && !/\s/.test(text[start - 1])) start -= 1;
    while (end < text.length && !/\s/.test(text[end])) end += 1;

    return { start, end: Math.min(text.length, end) };
  }

  function updateReadingHighlights(charIndex = 0, charLength = 0) {
    if (!activeSelectionRange || !CSS?.highlights) return;

    const text = activeSelectionText || activeSelectionRange.toString();
    if (!text) return;

    const word = expandCurrentWordOffsets(text, charIndex, charLength);
    const readEnd = Math.max(word.end, Math.min(text.length, activeSpeechOffsetBase + (Number(charIndex) || 0) + (Number(charLength) || 0)));

    const readRanges = makeRangesForOffsets(activeSelectionRange, 0, readEnd);
    const currentRanges = makeRangesForOffsets(activeSelectionRange, word.start, word.end);

    if (readRanges.length) CSS.highlights.set(READ_HIGHLIGHT_NAME, new Highlight(...readRanges));
    if (currentRanges.length) CSS.highlights.set(CURRENT_HIGHLIGHT_NAME, new Highlight(...currentRanges));
  }

  function getSelectionRect() {
    const selection = window.getSelection?.();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects()).filter((rect) => rect.width || rect.height);
    if (!rects.length) return null;

    return rects[0];
  }

  function clampControlPosition(left, top) {
    const width = controls.offsetWidth || 72;
    const height = controls.offsetHeight || 36;

    return {
      left: Math.max(8, Math.min(window.innerWidth - width - 8, left)),
      top: Math.max(8, Math.min(window.innerHeight - height - 8, top))
    };
  }

  function applyControlPosition(left, top) {
    const position = clampControlPosition(left, top);
    controls.style.left = `${position.left}px`;
    controls.style.top = `${position.top}px`;
    return position;
  }

  function positionControls() {
    const rect = getSelectionRect();
    if (!rect) {
      if (isSpeechActive()) {
        keepControlsVisibleDuringSpeech();
        return;
      }
      return hideControls();
    }

    controls.classList.add("is-visible");

    if (savedControlPosition) {
      applyControlPosition(savedControlPosition.left, savedControlPosition.top);
      return;
    }

    const left = Math.max(8, Math.min(window.innerWidth - 72, rect.left));
    const top = Math.max(8, rect.top - 40);
    applyControlPosition(left, top);
  }

  function keepControlsVisibleDuringSpeech() {
    controls.classList.add("is-visible");

    if (savedControlPosition) {
      applyControlPosition(savedControlPosition.left, savedControlPosition.top);
      return;
    }

    const rect = controls.getBoundingClientRect();
    if (rect.width || rect.height) {
      applyControlPosition(rect.left || 8, rect.top || 8);
      return;
    }

    applyControlPosition(8, 8);
  }

  function hideControls() {
    controls.classList.remove("is-visible");
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
  }

  function isSpeechActive() {
    return Boolean(activeUtterance) || speechSynthesis.speaking || speechSynthesis.pending;
  }

  async function getSettings() {
    try {
      const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
      return {
        enabled: Boolean(settings.readerEnabled),
        voiceName: settings.readerVoice || "Microsoft David",
        rate: Number(settings.readerRate || 100) / 100,
        pitch: Number(settings.readerPitch || 100) / 100,
        volume: 1,
        highlightWords: Boolean(settings.readerHighlightWords)
      };
    } catch {
      return {
        enabled: true,
        voiceName: "Microsoft David",
        rate: 1,
        pitch: 1,
        volume: 1,
        highlightWords: true
      };
    }
  }

  async function updateFromSelection() {
    const settings = await getSettings();
    if (!settings.enabled) {
      hideControls();
      clearReadingHighlights();
      return;
    }

    const rawText = getSelectionText({ trim: false });
    const text = rawText.trim();

    if (!text) {
      selectedText = "";

      if (isSpeechActive()) {
        keepControlsVisibleDuringSpeech();
      } else {
        hideControls();
        activeSelectionRange = null;
        activeSelectionText = "";
        clearReadingHighlights();
      }

      return;
    }

    selectedText = text;
    lastSelectedText = text;
    rememberSelectionRange();
    positionControls();
    scheduleHide();
  }

  function getVoicesWhenReady() {
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length) return resolve(voices);

      const timeout = setTimeout(() => resolve(speechSynthesis.getVoices()), 500);
      speechSynthesis.onvoiceschanged = () => {
        clearTimeout(timeout);
        resolve(speechSynthesis.getVoices());
      };
    });
  }

  async function speak(text) {
    const settings = await getSettings();
    if (!settings.enabled) return;

    const selectionNow = getSelectionText({ trim: false });
    const rawText = String(text || selectionNow || selectedText || lastSelectedText || "");
    const cleanText = rawText.trim();
    if (!cleanText) return;

    activeSpeechOffsetBase = rawText.length - rawText.trimStart().length;
    if (selectionNow.trim()) rememberSelectionRange();

    const voices = await getVoicesWhenReady();
    const preferredVoice = voices.find((voice) =>
      voice.name.toLowerCase().includes(String(settings.voiceName || "Microsoft David").toLowerCase())
    ) || voices.find((voice) => voice.name.toLowerCase().includes("david")) || voices[0];

    speechSynthesis.cancel();
    clearReadingHighlights();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = Number(settings.rate) || 1;
    utterance.pitch = Number(settings.pitch) || 1;
    utterance.volume = Number(settings.volume) || 1;

    activeUtterance = utterance;

    utterance.onstart = () => {
      keepControlsVisibleDuringSpeech();
      if (settings.highlightWords) updateReadingHighlights(0, 0);
    };

    utterance.onboundary = (event) => {
      if (!settings.highlightWords) return;
      if (event.name === "word" || typeof event.charIndex === "number") {
        updateReadingHighlights(event.charIndex || 0, event.charLength || 0);
      }
    };

    utterance.onend = () => {
      if (settings.highlightWords) updateReadingHighlights(cleanText.length, 0);
      activeUtterance = null;
      if (!getSelectionText()) hideControls();
    };

    utterance.onerror = () => {
      activeUtterance = null;
      if (!getSelectionText()) hideControls();
    };

    speechSynthesis.speak(utterance);
  }

  function stop() {
    speechSynthesis.cancel();
    activeUtterance = null;
    clearReadingHighlights();
    if (!getSelectionText()) hideControls();
  }

  function saveDraggedPosition(left, top) {
    savedControlPosition = applyControlPosition(left, top);
    chrome.storage.local.set({ [POSITION_STORAGE_KEY]: savedControlPosition });
  }

  function startDragging(event) {
    if (event.button !== 0) return;
    if (event.target.closest?.("button")) return;

    const rect = controls.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      didDrag: false
    };

    controls.setPointerCapture?.(event.pointerId);
  }

  function dragControls(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const moved = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
    if (moved > 3) {
      dragState.didDrag = true;
      controls.classList.add("is-dragging");
      clearTimeout(hideTimer);
      const nextLeft = event.clientX - dragState.offsetX;
      const nextTop = event.clientY - dragState.offsetY;
      applyControlPosition(nextLeft, nextTop);
      event.preventDefault();
    }
  }

  function stopDragging(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (dragState.didDrag) {
      const nextLeft = event.clientX - dragState.offsetX;
      const nextTop = event.clientY - dragState.offsetY;
      saveDraggedPosition(nextLeft, nextTop);
      suppressNextClick = true;
      setTimeout(() => {
        suppressNextClick = false;
      }, 0);
    }

    controls.releasePointerCapture?.(event.pointerId);
    controls.classList.remove("is-dragging");
    dragState = null;
    scheduleHide();
  }

  playButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  stopButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  playButton.addEventListener("mousedown", (event) => event.preventDefault());
  stopButton.addEventListener("mousedown", (event) => event.preventDefault());

  controls.addEventListener("pointerdown", startDragging);
  controls.addEventListener("pointermove", dragControls);
  controls.addEventListener("pointerup", stopDragging);
  controls.addEventListener("pointercancel", stopDragging);

  playButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (suppressNextClick) return;
    speak(getSelectionText() || selectedText || lastSelectedText);
  });

  stopButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (suppressNextClick) return;
    stop();
  });

  controls.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  controls.addEventListener("mouseleave", scheduleHide);

  document.addEventListener("selectionchange", () => {
    window.requestAnimationFrame(updateFromSelection);
  });

  document.addEventListener("mouseup", () => {
    window.requestAnimationFrame(updateFromSelection);
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Escape") hideControls();
    window.requestAnimationFrame(updateFromSelection);
  });

  window.addEventListener("scroll", () => {
    if (controls.classList.contains("is-visible")) positionControls();
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (controls.classList.contains("is-visible")) positionControls();
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || typeof message !== "object") return;

    if (message.type === "TEKTITE_SUITE_READER_ACTION") {
      if (message.action === "speak-text") speak(message.text || "");
      if (message.action === "speak-selection") speak(getSelectionText() || selectedText || lastSelectedText);
      if (message.action === "stop") stop();
    }
  });
})();
