(() => {
  const ROOT_ID = "tektite-suite-customizer-root";
  const CRT_CABINET_ID = "tektite-suite-customizer-crt-cabinet";
  const CRT_OVERLAY_ID = "tektite-suite-customizer-crt-overlay";
  const PAGE_SHELL_ID = "tektite-suite-customizer-page-shell";
  const CRT_SIGNAL_CANVAS_ID = "tektite-suite-customizer-crt-signal-canvas";
  const CRT_CONTROLS_ID = "tektite-suite-customizer-crt-controls";
  const FULLSCREEN_TARGET_CLASS = "tektite-suite-crt-fullscreen-target";
  const VIDEO_TARGET_CLASS = "tektite-suite-crt-video-target";
  const MEDIA_TARGET_CLASS = "tektite-suite-crt-media-target";
  const CONTROLS_TARGET_CLASS = "tektite-suite-crt-controls-target";
  const STYLE_ID = "tektite-suite-customizer-style";
  const PAGE_SETTINGS_KEY = "customizerSettingsByPage";

  const DEFAULT_CUSTOMIZER_STATE = {
    enabled: false,
    intensity: 55,
    speed: 14,
    inverted: false,
    cycleInvert: false,
    hueMonochrome: false,
    staticColor: "",
    blendMode: "normal",
    textureFilters: [],
    textureColorMode: "normal",
    textureIntensity: 45,
    textureScale: 100,
    crtEffects: false
  };

  let state = { ...DEFAULT_CUSTOMIZER_STATE };

  let cycleTimer = null;
  let cyclePhase = false;
  let hueOverlayTimer = null;
  let hueOverlayHue = 84;
  let shellActive = false;
  const OVERLAY_BLEND_MODES = new Set([
    "normal",
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
    "hue",
    "saturation",
    "color",
    "luminosity"
  ]);
  const TEXTURE_FILTERS = new Set([
    "black-and-white-grid",
    "cobblestone",
    "cracked-01",
    "cracked-02",
    "dirt",
    "grass",
    "lime-and-magenta-grid",
    "sand",
    "tv-wood",
    "water"
  ]);
  const TEXTURE_FILTER_STYLES = {
    "black-and-white-grid": { file: "black-and-white-grid.png", opacity: 0.88, mixBlendMode: "overlay", backgroundSize: "180px 180px", filter: "contrast(1.55) brightness(1.05)" },
    "cobblestone": { file: "cobblestone.png", opacity: 1.12, mixBlendMode: "overlay", backgroundSize: "360px 360px", filter: "contrast(1.35) brightness(1.06)" },
    "cracked-01": { file: "cracked-01.png", opacity: 0.92, mixBlendMode: "multiply", backgroundSize: "420px 420px", filter: "contrast(1.35) brightness(1.04)" },
    "cracked-02": { file: "cracked-02.png", opacity: 1.05, mixBlendMode: "multiply", backgroundSize: "420px 420px", filter: "contrast(1.45) brightness(0.98)" },
    "dirt": { file: "dirt.png", opacity: 0.98, mixBlendMode: "soft-light", backgroundSize: "300px 300px", filter: "contrast(1.25) brightness(0.98) saturate(1.05)" },
    "grass": { file: "grass.png", opacity: 0.92, mixBlendMode: "soft-light", backgroundSize: "300px 300px", filter: "contrast(1.25) brightness(1.02) saturate(1.08)" },
    "lime-and-magenta-grid": { file: "lime-and-magenta-grid.png", opacity: 0.82, mixBlendMode: "screen", backgroundSize: "180px 180px", filter: "saturate(1.2) contrast(1.35) brightness(1.02)" },
    "sand": { file: "sand.png", opacity: 0.9, mixBlendMode: "soft-light", backgroundSize: "300px 300px", filter: "contrast(1.18) brightness(1.06) saturate(1.04)" },
    "tv-wood": { file: "tv-wood.png", opacity: 0.95, mixBlendMode: "soft-light", backgroundSize: "320px 320px", filter: "contrast(1.16) brightness(1.02) saturate(1.05)" },
    "water": { file: "water.png", opacity: 0.86, mixBlendMode: "overlay", backgroundSize: "320px 320px", filter: "contrast(1.25) brightness(1.08) saturate(1.12)" }
  };
  const TEXTURE_COLOR_MODES = {
    normal: "",
    grayscale: "grayscale(1)",
    "chromatic-aberration": "saturate(1.45) contrast(1.18) drop-shadow(1px 0 rgba(255, 0, 80, 0.65)) drop-shadow(-1px 0 rgba(0, 255, 255, 0.65))",
    inverted: "invert(1)",
    sepia: "sepia(0.85) saturate(1.15) brightness(1.04)",
    "terminal-green": "grayscale(1) sepia(1) hue-rotate(55deg) saturate(3.4) brightness(1.08)",
    vaporwave: "saturate(1.8) hue-rotate(285deg) contrast(1.18)",
    "acid-wash": "saturate(2.4) hue-rotate(95deg) contrast(1.35) brightness(1.08)",
    "deep-fried": "saturate(2.2) contrast(1.65) brightness(1.08)",
    "washed-out": "saturate(0.45) contrast(0.85) brightness(1.12)"
  };
  let resizeTimer = null;
  let crtInlineTimer = null;
  let crtCanvasAnimation = null;
  const crtPreviousStyle = new Map();

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html.tektite-suite-customizer-crt-frame {
        --tektite-crt-screen-left: 12vw;
        --tektite-crt-screen-top: 10vh;
        --tektite-crt-screen-width: 76vw;
        --tektite-crt-screen-height: 80vh;
        --tektite-crt-page-scale: 0.78;
        --tektite-crt-side-width: 120px;
        --tektite-crt-side-gap: 10px;
        --tektite-crt-wood-url: none;
        background:
          radial-gradient(circle at 50% 50%, rgba(28, 28, 28, 0.96) 0%, rgba(10, 10, 10, 0.99) 58%, #000 100%) !important;
        overflow: hidden !important;
      }

      html.tektite-suite-customizer-crt-frame body {
        overflow: hidden !important;
      }

      #${CRT_CABINET_ID},
      #${CRT_OVERLAY_ID} {
        position: fixed !important;
        inset: 0 !important;
        pointer-events: none !important;
        display: none !important;
        overflow: hidden !important;
      }

      #${CRT_CABINET_ID} {
        z-index: 2147483643 !important;
        background:
          radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.24) 68%, rgba(0, 0, 0, 0.62) 100%),
          var(--tektite-crt-wood-url) repeat !important;
        background-size:
          cover,
          320px 320px !important;
      }

      #${CRT_OVERLAY_ID} {
        z-index: 2147483646 !important;
        background:
          radial-gradient(circle at 50% 50%, transparent 0 43%, rgba(0, 0, 0, 0.06) 62%, rgba(0, 0, 0, 0.24) 100%) !important;
      }

      html.tektite-suite-customizer-crt-frame #${CRT_CABINET_ID},
      html.tektite-suite-customizer-crt-frame #${CRT_OVERLAY_ID} {
        display: block !important;
      }

      #${PAGE_SHELL_ID} {
        position: fixed !important;
        left: var(--tektite-crt-screen-left) !important;
        top: var(--tektite-crt-screen-top) !important;
        z-index: 2147483645 !important;
        width: 100vw !important;
        height: 100vh !important;
        overflow: auto !important;
        transform: scale(var(--tektite-crt-page-scale)) !important;
        transform-origin: top left !important;
        box-sizing: border-box !important;
        border: 0 !important;
        border-radius: calc(clamp(16px, 2vw, 28px) / var(--tektite-crt-page-scale)) !important;
        background: inherit !important;
        box-shadow:
          inset 0 0 calc(75px / var(--tektite-crt-page-scale)) rgba(0, 0, 0, 0.72),
          inset 0 0 calc(18px / var(--tektite-crt-page-scale)) rgba(255, 255, 255, 0.14) !important;
      }

      #${PAGE_SHELL_ID}::-webkit-scrollbar,
      #${PAGE_SHELL_ID} *::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }

      #${PAGE_SHELL_ID},
      #${PAGE_SHELL_ID} * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      #${CRT_OVERLAY_ID} .tektite-crt-screen {
        position: fixed !important;
        z-index: 2 !important;
        left: var(--tektite-crt-screen-left) !important;
        top: var(--tektite-crt-screen-top) !important;
        width: var(--tektite-crt-screen-width) !important;
        height: var(--tektite-crt-screen-height) !important;
        transform: none !important;
        border: 0 !important;
        border-radius: clamp(16px, 2vw, 28px) !important;
        overflow: hidden !important;
        clip-path: inset(0 round clamp(16px, 2vw, 28px)) !important;
        box-shadow:
          0 0 0 clamp(10px, 1.4vw, 18px) #171717,
          0 0 0 calc(clamp(10px, 1.4vw, 18px) + 4px) #99ff00,
          0 0 0 calc(clamp(10px, 1.4vw, 18px) + 7px) #4b0076,
          0 0 36px rgba(153, 255, 0, 0.42),
          inset 0 0 80px rgba(0, 0, 0, 0.84),
          inset 0 0 18px rgba(255, 255, 255, 0.14) !important;
      }

      #${CRT_OVERLAY_ID} .tektite-crt-edge-mask {
        position: fixed !important;
        left: var(--tektite-crt-screen-left) !important;
        top: var(--tektite-crt-screen-top) !important;
        width: var(--tektite-crt-screen-width) !important;
        height: var(--tektite-crt-screen-height) !important;
        transform: none !important;
        pointer-events: none !important;
        border: 5px solid #000000 !important;
        border-radius: clamp(16px, 2vw, 28px) !important;
        box-sizing: border-box !important;
        z-index: 2147483646 !important;
        background: transparent !important;
        box-shadow:
          inset 0 0 0 1px rgba(0, 0, 0, 0.92),
          0 0 0 1px rgba(0, 0, 0, 0.92) !important;
      }

      #${CRT_OVERLAY_ID} .tektite-crt-screen::before {
        content: "" !important;
        z-index: 2147483644 !important;
        position: absolute !important;
        inset: 5px !important;
        border-radius: max(10px, calc(clamp(16px, 2vw, 28px) - 5px)) !important;
        background:
          radial-gradient(
            ellipse at center,
            transparent 0%,
            transparent 48%,
            rgba(0, 0, 0, 0.32) 72%,
            rgba(0, 0, 0, 0.76) 100%
          ),
          repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.50) 0px,
            rgba(0, 0, 0, 0.50) 1px,
            rgba(255, 255, 255, 0.09) 1px,
            rgba(255, 255, 255, 0.09) 2px,
            rgba(0, 0, 0, 0.18) 2px,
            rgba(0, 0, 0, 0.18) 4px
          ) !important;
        mix-blend-mode: multiply !important;
      }

      #${CRT_OVERLAY_ID} .tektite-crt-screen::after {
        content: "" !important;
        z-index: 4 !important;
        position: absolute !important;
        inset: 5px !important;
        border-radius: max(10px, calc(clamp(16px, 2vw, 28px) - 5px)) !important;
        background:
          linear-gradient(90deg, rgba(255, 0, 80, 0.17), transparent 18%, transparent 82%, rgba(0, 210, 255, 0.16)),
          repeating-linear-gradient(
            90deg,
            rgba(255, 0, 0, 0.09) 0px,
            rgba(255, 0, 0, 0.09) 1px,
            rgba(0, 255, 80, 0.06) 1px,
            rgba(0, 255, 80, 0.06) 2px,
            rgba(0, 90, 255, 0.08) 2px,
            rgba(0, 90, 255, 0.08) 3px
          ) !important;
        mix-blend-mode: screen !important;
        animation: tektiteSuiteCrtRgbDrift 1.6s steps(2, end) infinite !important;
      }

      #${CRT_CABINET_ID} .tektite-crt-wood-backdrop {
        position: fixed !important;
        inset: 0 !important;
        z-index: 0 !important;
        pointer-events: none !important;
        background-color: #2a160b !important;
        background-image:
          radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.24) 68%, rgba(0, 0, 0, 0.62) 100%),
          var(--tektite-crt-wood-url) !important;
        background-repeat:
          no-repeat,
          repeat !important;
        background-size:
          cover,
          320px 320px !important;
        background-position:
          center center,
          center center !important;
      }

      #${CRT_CABINET_ID} .tektite-crt-speaker,
      #${CRT_CABINET_ID} .tektite-crt-controls {
        position: fixed !important;
        z-index: 2 !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        width: var(--tektite-crt-side-width) !important;
        height: var(--tektite-crt-screen-height) !important;
        border-radius: clamp(14px, 2vw, 24px) !important;
        background:
          radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.08), transparent 32%),
          linear-gradient(180deg, rgba(58, 58, 58, 0.96), rgba(16, 16, 16, 0.98)) !important;
        box-shadow:
          inset 0 0 0 2px rgba(95, 95, 95, 0.72),
          inset 0 0 22px rgba(255, 255, 255, 0.055),
          inset 0 0 52px rgba(0, 0, 0, 0.76),
          0 0 24px rgba(0, 0, 0, 0.72) !important;
      }

      #${CRT_CABINET_ID} .tektite-crt-speaker {
        left: var(--tektite-crt-side-gap) !important;
        background:
          radial-gradient(circle at 50% 14%, rgba(255, 255, 255, 0.10), transparent 26%),
          repeating-linear-gradient(
            180deg,
            rgba(52, 52, 52, 0.98) 0px,
            rgba(52, 52, 52, 0.98) 5px,
            rgba(9, 9, 9, 0.98) 5px,
            rgba(9, 9, 9, 0.98) 10px
          ),
          linear-gradient(180deg, rgba(62, 62, 62, 0.96), rgba(16, 16, 16, 0.98)) !important;
      }

      #${CRT_CABINET_ID} .tektite-crt-speaker::before {
        content: "SPEAKER" !important;
        position: absolute !important;
        left: 0 !important;
        right: 0 !important;
        top: 16px !important;
        text-align: center !important;
        color: rgba(184, 255, 44, 0.6) !important;
        font: 11px "Courier New", monospace !important;
        letter-spacing: 0.18em !important;
        text-shadow: 0 0 8px rgba(184, 255, 44, 0.45) !important;
      }

      #${CRT_CABINET_ID} .tektite-crt-controls {
        right: var(--tektite-crt-side-gap) !important;
        background:
          radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.08), transparent 32%),
          linear-gradient(180deg, rgba(58, 58, 58, 0.96), rgba(16, 16, 16, 0.98)) !important;
      }

      #${CRT_CABINET_ID} .tektite-crt-knob {
        position: absolute !important;
        left: 50% !important;
        width: clamp(34px, 4vw, 52px) !important;
        height: clamp(34px, 4vw, 52px) !important;
        transform: translateX(-50%) !important;
        border-radius: 50% !important;
        background:
          radial-gradient(circle at 36% 30%, rgba(255, 255, 255, 0.24), transparent 18%),
          radial-gradient(circle, rgba(92, 92, 92, 1) 0 46%, rgba(32, 32, 32, 1) 48% 66%, rgba(8, 8, 8, 1) 68% 100%) !important;
        box-shadow:
          inset 0 0 0 2px rgba(180, 180, 180, 0.18),
          inset 0 0 16px rgba(0, 0, 0, 0.82),
          0 0 10px rgba(153, 255, 0, 0.15) !important;
      }

      #${CRT_CABINET_ID} .tektite-crt-knob::after {
        content: "" !important;
        position: absolute !important;
        left: 50% !important;
        top: 8px !important;
        width: 4px !important;
        height: 16px !important;
        transform: translateX(-50%) rotate(28deg) !important;
        transform-origin: 50% 20px !important;
        border-radius: 999px !important;
        background: #99ff00 !important;
        box-shadow: 0 0 8px rgba(153, 255, 0, 0.55) !important;
      }

      #${CRT_CABINET_ID} .tektite-crt-knob.one { top: 20% !important; }
      #${CRT_CABINET_ID} .tektite-crt-knob.two { top: 39% !important; }

      #${CRT_CABINET_ID} .tektite-crt-controls::before {
        content: "CHANNEL\\A VOLUME" !important;
        white-space: pre !important;
        position: absolute !important;
        left: 0 !important;
        right: 0 !important;
        top: 59% !important;
        text-align: center !important;
        color: rgba(255, 156, 255, 0.78) !important;
        font: 12px/2 "Courier New", monospace !important;
        letter-spacing: 0.12em !important;
        text-shadow: 0 0 8px rgba(255, 77, 255, 0.45) !important;
      }

      .tektite-suite-crt-fullscreen-target {
        background: #000 !important;
        overflow: hidden !important;
        position: relative !important;
        isolation: isolate !important;
      }

      #${CRT_CONTROLS_ID} {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        display: none !important;
        font-family: Arial, Helvetica, sans-serif !important;
        color: #fff !important;
      }

      html.tektite-suite-customizer-crt-frame #${CRT_CONTROLS_ID} {
        display: block !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-titlebar {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        right: 0 !important;
        min-height: 76px !important;
        padding: 18px 24px 42px !important;
        box-sizing: border-box !important;
        pointer-events: none !important;
        background: linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0.34), transparent) !important;
        text-shadow: 0 1px 3px rgba(0,0,0,0.95) !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-title {
        max-width: calc(100vw - 48px) !important;
        font-size: 18px !important;
        font-weight: 600 !important;
        line-height: 1.25 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-bottombar {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        min-height: 86px !important;
        padding: 36px 20px 16px !important;
        box-sizing: border-box !important;
        pointer-events: auto !important;
        background: linear-gradient(0deg, rgba(0,0,0,0.82), rgba(0,0,0,0.40), transparent) !important;
        text-shadow: 0 1px 3px rgba(0,0,0,0.95) !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-progress {
        position: relative !important;
        height: 10px !important;
        margin: 0 0 12px !important;
        cursor: pointer !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-progress-track {
        position: absolute !important;
        left: 0 !important;
        right: 0 !important;
        top: 4px !important;
        height: 3px !important;
        background: rgba(255,255,255,0.34) !important;
        border-radius: 999px !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-progress-fill {
        position: absolute !important;
        left: 0 !important;
        top: 4px !important;
        height: 3px !important;
        width: 0% !important;
        background: #ff0033 !important;
        border-radius: 999px !important;
        box-shadow: 0 0 8px rgba(255,0,51,0.72) !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-progress-knob {
        position: absolute !important;
        top: 0 !important;
        left: 0% !important;
        width: 11px !important;
        height: 11px !important;
        transform: translateX(-50%) !important;
        border-radius: 999px !important;
        background: #ff0033 !important;
        box-shadow: 0 0 8px rgba(255,0,51,0.8) !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-control-row {
        display: flex !important;
        align-items: center !important;
        gap: 14px !important;
        height: 30px !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-btn {
        appearance: none !important;
        border: 0 !important;
        background: transparent !important;
        color: #fff !important;
        width: 34px !important;
        height: 30px !important;
        font-size: 20px !important;
        line-height: 30px !important;
        padding: 0 !important;
        cursor: pointer !important;
        text-align: center !important;
        pointer-events: auto !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-time {
        font-size: 13px !important;
        line-height: 30px !important;
        white-space: nowrap !important;
        color: #fff !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-exit {
        margin-left: auto !important;
        font-size: 22px !important;
        width: 38px !important;
        height: 30px !important;
        line-height: 30px !important;
      }

      #${CRT_CONTROLS_ID} .tektite-crt-exit:hover,
      #${CRT_CONTROLS_ID} .tektite-crt-btn:hover {
        color: #b8ff2c !important;
        text-shadow: 0 0 8px rgba(184, 255, 44, 0.85) !important;
      }


      #${CRT_CONTROLS_ID}.tektite-crt-controls-hidden .tektite-crt-titlebar,
      #${CRT_CONTROLS_ID}.tektite-crt-controls-hidden .tektite-crt-bottombar {
        opacity: 0 !important;
        transition: opacity 180ms ease !important;
      }

      #${CRT_CONTROLS_ID}:hover .tektite-crt-titlebar,
      #${CRT_CONTROLS_ID}:hover .tektite-crt-bottombar {
        opacity: 1 !important;
      }

      #${CRT_SIGNAL_CANVAS_ID} {
        position: fixed !important;
        left: var(--tektite-crt-screen-left) !important;
        top: var(--tektite-crt-screen-top) !important;
        width: var(--tektite-crt-screen-width) !important;
        height: var(--tektite-crt-screen-height) !important;
        z-index: 2147483644 !important;
        pointer-events: none !important;
        background: #000 !important;
        object-fit: contain !important;
        display: none !important;
        border-radius: clamp(16px, 2vw, 28px) !important;
      }

      html.tektite-suite-customizer-crt-frame #${CRT_SIGNAL_CANVAS_ID} {
        display: block !important;
      }

      .tektite-suite-crt-media-target {
        position: fixed !important;
        left: var(--tektite-crt-screen-left) !important;
        top: var(--tektite-crt-screen-top) !important;
        width: var(--tektite-crt-screen-width) !important;
        height: var(--tektite-crt-screen-height) !important;
        max-width: none !important;
        max-height: none !important;
        min-width: 0 !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: none !important;
        background: #000 !important;
        z-index: 2147483644 !important;
        overflow: hidden !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        pointer-events: none !important;
      }

      .tektite-suite-crt-media-target video,
      .tektite-suite-crt-media-target .html5-main-video,
      .tektite-suite-crt-video-target {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        right: auto !important;
        bottom: auto !important;
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        max-height: none !important;
        min-width: 0 !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: none !important;
        object-fit: contain !important;
        background: #000 !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        z-index: 2147483644 !important;
      }

      .tektite-suite-crt-video-target {
        position: absolute !important;
      }

      .tektite-suite-crt-controls-target {
        z-index: 2147483647 !important;
      }

      .tektite-suite-crt-fullscreen-target .ytp-autohide .ytp-chrome-top,
      .tektite-suite-crt-fullscreen-target .ytp-autohide .ytp-chrome-bottom,
      .tektite-suite-crt-fullscreen-target .ytp-autohide .ytp-gradient-top,
      .tektite-suite-crt-fullscreen-target .ytp-autohide .ytp-gradient-bottom,
      .tektite-suite-crt-fullscreen-target .ytp-autohide .ytp-title,
      .tektite-suite-crt-fullscreen-target .ytp-autohide .ytp-title-text,
      .tektite-suite-crt-fullscreen-target .ytp-autohide .ytp-progress-bar-container {
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
      }

      .tektite-suite-crt-fullscreen-target .ytp-chrome-top,
      .tektite-suite-crt-fullscreen-target .ytp-gradient-top,
      .tektite-suite-crt-fullscreen-target .ytp-title,
      .tektite-suite-crt-fullscreen-target .ytp-title-text,
      .tektite-suite-crt-fullscreen-target .ytp-show-cards-title {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        width: 100vw !important;
        max-width: none !important;
        transform: none !important;
        z-index: 2147483647 !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        pointer-events: auto !important;
      }

      .tektite-suite-crt-fullscreen-target .ytp-chrome-bottom,
      .tektite-suite-crt-fullscreen-target .ytp-gradient-bottom,
      .tektite-suite-crt-fullscreen-target .ytp-progress-bar-container {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        max-width: none !important;
        transform: none !important;
        z-index: 2147483647 !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        pointer-events: auto !important;
      }

      .tektite-suite-crt-fullscreen-target .ytp-caption-window-container,
      .tektite-suite-crt-fullscreen-target .ytp-ce-element,
      .tektite-suite-crt-fullscreen-target .ytp-spinner,
      .tektite-suite-crt-fullscreen-target .ytp-spinner-container {
        position: fixed !important;
        z-index: 2147483647 !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }

      .tektite-suite-crt-fullscreen-target .ytp-chrome-top,
      .tektite-suite-crt-fullscreen-target .ytp-gradient-top,
      .tektite-suite-crt-fullscreen-target .ytp-chrome-bottom,
      .tektite-suite-crt-fullscreen-target .ytp-gradient-bottom,
      .tektite-suite-crt-fullscreen-target .ytp-progress-bar-container,
      .tektite-suite-crt-fullscreen-target .ytp-caption-window-container,
      .tektite-suite-crt-fullscreen-target .ytp-ce-element,
      .tektite-suite-crt-fullscreen-target .ytp-title,
      .tektite-suite-crt-fullscreen-target .ytp-title-text,
      .tektite-suite-crt-fullscreen-target .ytp-show-cards-title {
        transform: none !important;
        z-index: 2147483647 !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }

      .tektite-suite-crt-fullscreen-target .ytp-chrome-top,
      .tektite-suite-crt-fullscreen-target .ytp-gradient-top,
      .tektite-suite-crt-fullscreen-target .ytp-chrome-bottom,
      .tektite-suite-crt-fullscreen-target .ytp-gradient-bottom,
      .tektite-suite-crt-fullscreen-target .ytp-progress-bar-container,
      .tektite-suite-crt-fullscreen-target .ytp-caption-window-container,
      .tektite-suite-crt-fullscreen-target .ytp-ce-element,
      .tektite-suite-crt-fullscreen-target .ytp-title,
      .tektite-suite-crt-fullscreen-target .ytp-title-text {
        transform: none !important;
        z-index: 2147483647 !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }

      .tektite-suite-crt-fullscreen-target .ytp-chrome-top,
      .tektite-suite-crt-fullscreen-target .ytp-gradient-top,
      .tektite-suite-crt-fullscreen-target .ytp-title {
        top: 0 !important;
      }

      .tektite-suite-crt-fullscreen-target .ytp-chrome-bottom,
      .tektite-suite-crt-fullscreen-target .ytp-gradient-bottom {
        bottom: 0 !important;
      }

      .tektite-suite-crt-media-target .html5-main-video,
      .tektite-suite-crt-media-target video.html5-main-video {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: 100% !important;
        transform: none !important;
      }

      .tektite-suite-crt-fullscreen-target .ytp-chrome-bottom,
      .tektite-suite-crt-fullscreen-target .ytp-chrome-top,
      .tektite-suite-crt-fullscreen-target .ytp-gradient-bottom,
      .tektite-suite-crt-fullscreen-target .ytp-gradient-top,
      .tektite-suite-crt-fullscreen-target .ytp-caption-window-container {
        z-index: 2147483647 !important;
      }

      @media (max-width: 760px) {
        html.tektite-suite-customizer-crt-frame {
          --tektite-crt-screen-left: 4vw;
          --tektite-crt-screen-top: 6vh;
          --tektite-crt-screen-width: 92vw;
          --tektite-crt-screen-height: 88vh;
          --tektite-crt-page-scale: 0.90;
          --tektite-crt-side-width: 0px;
          --tektite-crt-side-gap: 0px;
        }

        #${CRT_CABINET_ID} .tektite-crt-speaker,
        #${CRT_CABINET_ID} .tektite-crt-controls {
          display: none !important;
        }
      }
    `;
    document.documentElement.appendChild(style);
  }

  function intensityToVars(intensity) {
    const normalized = Math.max(10, Math.min(100, Number(intensity) || 55)) / 100;
    return {
      opacityLow: (0.025 + normalized * 0.075).toFixed(3),
      opacityMid: (0.035 + normalized * 0.105).toFixed(3),
      opacityHigh: (0.045 + normalized * 0.135).toFixed(3),
      pageSaturation: (1.00 + normalized * 0.45).toFixed(3),
      pageSepia: (0.02 + normalized * 0.10).toFixed(3)
    };
  }

  function setWoodTextureUrl() {
    try {
      const woodUrl = chrome.runtime.getURL("assets/tv-wood.png");
      const cssUrl = `url("${woodUrl}")`;
      document.documentElement.style.setProperty("--tektite-crt-wood-url", cssUrl);

      const backdrop = document
        .getElementById(CRT_CABINET_ID)
        ?.querySelector?.(".tektite-crt-wood-backdrop");

      if (backdrop) {
        backdrop.style.setProperty(
          "background-image",
          `radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.24) 68%, rgba(0, 0, 0, 0.62) 100%), ${cssUrl}`,
          "important"
        );
        backdrop.style.setProperty("background-repeat", "no-repeat, repeat", "important");
        backdrop.style.setProperty("background-size", "cover, 320px 320px", "important");
        backdrop.style.setProperty("background-position", "center center, center center", "important");
      }
    } catch (error) {
      document.documentElement.style.setProperty("--tektite-crt-wood-url", "none");
    }
  }

  function updateCrtResponsiveVars() {
    const width = window.innerWidth || document.documentElement.clientWidth || 1200;
    const height = window.innerHeight || document.documentElement.clientHeight || 800;
    const root = document.documentElement;

    let sideWidth = 0;
    let gap = 0;
    let sideBuffer = 0;
    let verticalMarginTop = Math.max(14, Math.round(height * 0.055));
    let verticalMarginBottom = Math.max(14, Math.round(height * 0.055));

    if (width > 760) {
      gap = Math.max(8, Math.min(16, Math.round(width * 0.01)));
      sideWidth = Math.max(78, Math.min(150, Math.round(width * 0.09)));
      sideBuffer = sideWidth + gap + Math.max(16, Math.round(width * 0.018));
      verticalMarginTop = Math.max(18, Math.round(height * 0.105));
      verticalMarginBottom = Math.max(18, Math.round(height * 0.085));
    }

    const availableWidth = Math.max(320, width - sideBuffer * 2);
    const availableHeight = Math.max(260, height - verticalMarginTop - verticalMarginBottom);

    // Preserve the real browser viewport aspect ratio.
    // The page remains laid out as 100vw x 100vh, then this full signal is scaled into the CRT screen.
    const scale = Math.max(0.46, Math.min(0.96, Math.min(availableWidth / width, availableHeight / height)));

    const screenWidth = Math.round(width * scale);
    const screenHeight = Math.round(height * scale);
    const screenLeft = Math.round((width - screenWidth) / 2);
    const screenTop = Math.round((height - screenHeight) / 2);

    root.style.setProperty("--tektite-crt-page-scale", scale.toFixed(4));
    root.style.setProperty("--tektite-crt-screen-left", `${screenLeft}px`);
    root.style.setProperty("--tektite-crt-screen-top", `${screenTop}px`);
    root.style.setProperty("--tektite-crt-screen-width", `${screenWidth}px`);
    root.style.setProperty("--tektite-crt-screen-height", `${screenHeight}px`);
    root.style.setProperty("--tektite-crt-side-width", `${sideWidth}px`);
    root.style.setProperty("--tektite-crt-side-gap", `${gap}px`);
  }


  function getRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      root.setAttribute("aria-hidden", "true");
      document.documentElement.appendChild(root);
    }
    return root;
  }

  function styleCustomizerOverlay(root) {
    root.style.setProperty("position", "fixed", "important");
    root.style.setProperty("inset", "0", "important");
    root.style.setProperty("z-index", "2147483647", "important");
    root.style.setProperty("pointer-events", "none", "important");
    root.style.setProperty("isolation", "isolate", "important");
    root.style.setProperty("contain", "strict", "important");
    root.style.setProperty("overflow", "hidden", "important");
    root.style.setProperty("display", "none", "important");
    root.style.setProperty("background", "transparent", "important");
    root.style.setProperty("opacity", "1", "important");
    root.style.setProperty("mix-blend-mode", "normal", "important");
    root.style.setProperty("transition", "none", "important");
  }

  function updateOverlayTransition(root) {
    if (!root) return;
    const transition = state.cycleInvert
      ? "backdrop-filter 5s linear, -webkit-backdrop-filter 5s linear"
      : "none";
    root.style.setProperty("transition", transition, "important");
  }

  function stopHueOverlayTimer() {
    if (hueOverlayTimer) {
      window.clearInterval(hueOverlayTimer);
      hueOverlayTimer = null;
    }
  }

  function overlayAlpha(vars) {
    return Math.max(0.04, Math.min(0.42, Number(vars.opacityHigh) * 1.85));
  }

  function normalizeBlendMode(value) {
    const mode = String(value || "").trim().toLowerCase();
    return OVERLAY_BLEND_MODES.has(mode) ? mode : "normal";
  }

  function normalizeTextureFilters(value) {
    const input = Array.isArray(value) ? value : String(value || "").split(",");
    const output = [];

    for (const item of input) {
      const key = String(item || "").trim().toLowerCase();
      if (!TEXTURE_FILTERS.has(key) || output.includes(key)) continue;
      output.push(key);
      if (output.length >= 3) break;
    }

    return output;
  }


  function normalizeTextureColorMode(value) {
    const mode = String(value || "").trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(TEXTURE_COLOR_MODES, mode) ? mode : "normal";
  }

  function textureColorModeFilter() {
    return TEXTURE_COLOR_MODES[normalizeTextureColorMode(state.textureColorMode)] || "";
  }

  function normalizeTextureIntensity(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 45;
    return Math.max(0, Math.min(100, Math.round(number)));
  }

  function normalizeTextureScale(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 100;
    return Math.max(25, Math.min(300, Math.round(number)));
  }

  function scaleTextureBackgroundSize(backgroundSize) {
    const scale = normalizeTextureScale(state.textureScale) / 100;
    return String(backgroundSize || "320px 320px").replace(/(-?\d*\.?\d+)px/g, (_match, px) => `${Math.max(1, Number(px) * scale)}px`);
  }

  function textureAssetUrl(path) {
    try {
      return chrome.runtime.getURL(path);
    } catch (error) {
      return "";
    }
  }

  function removeTextureLayers(root) {
    for (const layer of root.querySelectorAll?.("[data-tektite-texture-filter]") || []) {
      layer.remove();
    }
  }

  function styleTextureLayer(layer, index) {
    layer.style.setProperty("position", "absolute", "important");
    layer.style.setProperty("inset", "0", "important");
    layer.style.setProperty("z-index", String(10 + index), "important");
    layer.style.setProperty("pointer-events", "none", "important");
    layer.style.setProperty("display", "block", "important");
    layer.style.setProperty("opacity", "1", "important");
    layer.style.setProperty("background-repeat", "repeat", "important");
    layer.style.setProperty("background-position", "0 0", "important");
  }

  function textureOpacity(vars, multiplier = 1) {
    const normalized = normalizeTextureIntensity(state.textureIntensity) / 100;
    if (normalized <= 0) return 0;
    const base = Number(vars.opacityHigh || 0.14);
    return Math.max(0, Math.min(0.82, (0.04 + base * 2.8) * normalized * multiplier));
  }

  function textureLayerStyles(name, vars) {
    const config = TEXTURE_FILTER_STYLES[name];
    if (!config) return null;

    const assetUrl = textureAssetUrl(`assets/${config.file}`);
    if (!assetUrl) return null;

    return {
      opacity: textureOpacity(vars, config.opacity),
      mixBlendMode: config.mixBlendMode,
      backgroundSize: scaleTextureBackgroundSize(config.backgroundSize),
      backgroundImage: `url("${assetUrl}")`,
      filter: [config.filter, textureColorModeFilter()].filter(Boolean).join(" ") || "none"
    };
  }

  function updateTextureFilters(root, vars) {
    const filters = normalizeTextureFilters(state.textureFilters);
    const activeKeys = new Set(filters);

    for (const layer of root.querySelectorAll?.("[data-tektite-texture-filter]") || []) {
      if (!activeKeys.has(layer.dataset.tektiteTextureFilter)) layer.remove();
    }

    filters.forEach((filterName, index) => {
      let layer = root.querySelector(`[data-tektite-texture-filter="${filterName}"]`);
      if (!layer) {
        layer = document.createElement("div");
        layer.dataset.tektiteTextureFilter = filterName;
        root.appendChild(layer);
      }

      const layerStyles = textureLayerStyles(filterName, vars);
      if (!layerStyles) {
        layer.remove();
        return;
      }

      styleTextureLayer(layer, index);
      layer.style.setProperty("opacity", String(layerStyles.opacity), "important");
      layer.style.setProperty("mix-blend-mode", layerStyles.mixBlendMode, "important");
      layer.style.setProperty("background-size", layerStyles.backgroundSize, "important");
      layer.style.setProperty("background-image", layerStyles.backgroundImage, "important");
      layer.style.setProperty("filter", layerStyles.filter, "important");
    });
  }

  function normalizeHexColor(value) {
    const text = String(value || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(text)) return text.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(text)) {
      return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`.toLowerCase();
    }
    return "";
  }

  function hexToRgb(hex) {
    const color = normalizeHexColor(hex);
    if (!color) return null;
    const value = Number.parseInt(color.slice(1), 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }

  function hueOverlayColorValue(vars) {
    const alpha = overlayAlpha(vars);
    return `hsla(${hueOverlayHue}deg, 100%, 52%, ${alpha})`;
  }

  function rootBackdropFilterValue(invertValue) {
    const parts = [`invert(${invertValue})`];

    if (state.enabled && !state.hueMonochrome) {
      const vars = intensityToVars(state.intensity);
      parts.push(`hue-rotate(${hueOverlayHue}deg)`);
      parts.push(`saturate(${vars.pageSaturation})`);
    }

    return parts.join(" ");
  }

  function updateRootBackdropFilter(root, invertValue = effectiveInverted() ? "1" : "0") {
    const filter = rootBackdropFilterValue(invertValue);
    root.style.setProperty("backdrop-filter", filter, "important");
    root.style.setProperty("-webkit-backdrop-filter", filter, "important");
  }

  function updateHueOverlayColor(root, vars) {
    if (!state.hueMonochrome) {
      root.style.setProperty("background-color", "transparent", "important");
      updateRootBackdropFilter(root);
      return;
    }

    root.style.setProperty("background-color", hueOverlayColorValue(vars), "important");
    updateRootBackdropFilter(root);
  }

  function updateStaticOverlayColor(root, vars) {
    const rgb = hexToRgb(state.staticColor);
    if (!rgb) {
      root.style.setProperty("background-color", "transparent", "important");
      return;
    }

    root.style.setProperty("background-color", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${overlayAlpha(vars)})`, "important");
  }

  function startHueOverlayTimer(root, vars, speedSeconds) {
    stopHueOverlayTimer();

    updateHueOverlayColor(root, vars);

    const frameMs = 50;
    const durationMs = Math.max(2, Number(speedSeconds) || 30) * 1000;
    const degreesPerFrame = 360 * frameMs / durationMs;

    hueOverlayTimer = window.setInterval(() => {
      hueOverlayHue = (hueOverlayHue + degreesPerFrame) % 360;
      updateHueOverlayColor(root, vars);
    }, frameMs);
  }

  function getCrtCabinet() {
    ensureStyle();

    let cabinet = document.getElementById(CRT_CABINET_ID);
    if (!cabinet) {
      cabinet = document.createElement("div");
      cabinet.id = CRT_CABINET_ID;
      cabinet.setAttribute("aria-hidden", "true");
      cabinet.innerHTML = `
        <div class="tektite-crt-wood-backdrop"></div>
        <div class="tektite-crt-speaker"></div>
        <div class="tektite-crt-controls">
          <div class="tektite-crt-knob one"></div>
          <div class="tektite-crt-knob two"></div>
        </div>
      `;
      document.documentElement.appendChild(cabinet);
    }

    return cabinet;
  }

  function getCrtOverlay() {
    ensureStyle();

    let overlay = document.getElementById(CRT_OVERLAY_ID);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = CRT_OVERLAY_ID;
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = `
        <div class="tektite-crt-screen"></div>
        <div class="tektite-crt-edge-mask"></div>
      `;
      document.documentElement.appendChild(overlay);
    }

    return overlay;
  }

  function getPageShell() {
    let shell = document.getElementById(PAGE_SHELL_ID);
    if (!shell) {
      shell = document.createElement("div");
      shell.id = PAGE_SHELL_ID;
    }
    return shell;
  }

  function shouldSkipShellNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    return node.id === ROOT_ID ||
      node.id === CRT_CABINET_ID ||
      node.id === CRT_OVERLAY_ID ||
      node.id === STYLE_ID ||
      node.id === PAGE_SHELL_ID;
  }

  function enableCrtShell() {
    if (shellActive) return;

    const shell = getPageShell();
    const nodes = Array.from(document.body.childNodes).filter((node) => !shouldSkipShellNode(node));
    document.body.insertBefore(shell, document.body.firstChild);

    for (const node of nodes) {
      shell.appendChild(node);
    }

    shellActive = true;
    updateCrtResponsiveVars();
  }

  function disableCrtShell() {
    clearFullscreenTargetClass();
    restoreCrtLayersToDocument();
    if (!shellActive) return;

    const shell = document.getElementById(PAGE_SHELL_ID);
    if (shell && shell.parentNode) {
      while (shell.firstChild) {
        document.body.insertBefore(shell.firstChild, shell);
      }
      shell.remove();
    }

    shellActive = false;
  }

  function isYouTubeHost() {
    return /(^|\.)youtube\.com$/i.test(location.hostname) || /(^|\.)youtu\.be$/i.test(location.hostname);
  }

  function getFullscreenElement() {
    return document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null;
  }

  function cleanupCrtFullscreenArtifacts() {
    // Stop canvas draw loops first.
    if (crtCanvasAnimation) {
      try {
        cancelAnimationFrame(crtCanvasAnimation);
        const video = findFullscreenVideoElement(getFullscreenElement());
        video?.cancelVideoFrameCallback?.(crtCanvasAnimation);
      } catch (error) {
        // Ignore cancellation mismatch.
      }
      crtCanvasAnimation = null;
    }

    if (crtInlineTimer) {
      window.clearInterval(crtInlineTimer);
      crtInlineTimer = null;
    }

    restoreInlineCrtStyles();

    clearFullscreenTargetClass();

    for (const id of [CRT_CABINET_ID, CRT_OVERLAY_ID, CRT_SIGNAL_CANVAS_ID, CRT_CONTROLS_ID]) {
      const element = document.getElementById(id);
      if (!element) continue;

      element.style.setProperty("display", "none", "important");

      if (id === CRT_SIGNAL_CANVAS_ID) {
        const context = element.getContext?.("2d");
        context?.clearRect(0, 0, element.width || 0, element.height || 0);
      }

      if (element.parentNode !== document.documentElement) {
        document.documentElement.appendChild(element);
      }
    }

    document.documentElement.classList.remove("tektite-suite-customizer-crt-frame");
  }

  async function exitCrtFullscreen() {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    } catch (error) {
      // Some browsers reject if fullscreen is already gone. The drama is unnecessary.
    } finally {
      cleanupCrtFullscreenArtifacts();
    }
  }

  function getCrtControls() {
    let controls = document.getElementById(CRT_CONTROLS_ID);
    if (!controls) {
      controls = document.createElement("div");
      controls.id = CRT_CONTROLS_ID;
      controls.setAttribute("aria-hidden", "false");
      controls.innerHTML = `
        <div class="tektite-crt-titlebar">
          <div class="tektite-crt-title"></div>
        </div>
        <div class="tektite-crt-bottombar">
          <div class="tektite-crt-progress" title="Seek">
            <div class="tektite-crt-progress-track"></div>
            <div class="tektite-crt-progress-fill"></div>
            <div class="tektite-crt-progress-knob"></div>
          </div>
          <div class="tektite-crt-control-row">
            <button class="tektite-crt-btn tektite-crt-play" type="button" title="Play / Pause">▶</button>
            <div class="tektite-crt-time">0:00 / 0:00</div>
            <button class="tektite-crt-btn tektite-crt-exit" type="button" title="Exit fullscreen">⛶</button>
          </div>
        </div>
      `;

      const play = controls.querySelector(".tektite-crt-play");
      const exit = controls.querySelector(".tektite-crt-exit");
      const progress = controls.querySelector(".tektite-crt-progress");

      play?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const video = findFullscreenVideoElement(getFullscreenElement());
        if (!video) return;
        if (video.paused) video.play();
        else video.pause();
      });

      exit?.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await exitCrtFullscreen();
      });

      controls.addEventListener("dblclick", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await exitCrtFullscreen();
      }, true);

      progress?.addEventListener("pointerdown", (event) => {
        const video = findFullscreenVideoElement(getFullscreenElement());
        if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

        const rect = progress.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        video.currentTime = pct * video.duration;
      });
    }

    return controls;
  }

  function mountCrtControlsInsideFullscreen() {
    const fullscreenElement = getFullscreenElement();
    if (!fullscreenElement) return;

    const controls = getCrtControls();
    if (!fullscreenElement.contains(controls)) fullscreenElement.appendChild(controls);
  }

  function restoreCrtControlsToDocument() {
    const controls = document.getElementById(CRT_CONTROLS_ID);
    if (controls && controls.parentNode !== document.documentElement) {
      document.documentElement.appendChild(controls);
    }
  }

  function formatCrtTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    const m = Math.floor((seconds / 60) % 60);
    const h = Math.floor(seconds / 3600);
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
  }

  function getYouTubeTitleText() {
    const selectors = [
      ".ytp-title-text",
      ".ytp-title-link",
      "h1.ytd-watch-metadata",
      "h1.title",
      "title"
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const text = String(element?.textContent || "").trim();
      if (text) return text.replace(/\\s+-\\s+YouTube\\s*$/i, "");
    }

    return document.title.replace(/\\s+-\\s+YouTube\\s*$/i, "") || "YouTube";
  }

  function updateCrtControls() {
    if (!shouldShowCrtEffects()) return;

    mountCrtControlsInsideFullscreen();

    const controls = getCrtControls();
    const video = findFullscreenVideoElement(getFullscreenElement());
    if (!video) return;

    const title = controls.querySelector(".tektite-crt-title");
    const play = controls.querySelector(".tektite-crt-play");
    const time = controls.querySelector(".tektite-crt-time");
    const fill = controls.querySelector(".tektite-crt-progress-fill");
    const knob = controls.querySelector(".tektite-crt-progress-knob");

    if (title) title.textContent = getYouTubeTitleText();
    if (play) play.textContent = video.paused ? "▶" : "❚❚";

    const duration = Number(video.duration) || 0;
    const current = Number(video.currentTime) || 0;
    const pct = duration > 0 ? Math.max(0, Math.min(100, (current / duration) * 100)) : 0;

    if (time) time.textContent = `${formatCrtTime(current)} / ${formatCrtTime(duration)}`;
    if (fill) fill.style.setProperty("width", `${pct}%`, "important");
    if (knob) knob.style.setProperty("left", `${pct}%`, "important");

    controls.style.setProperty("display", "block", "important");
  }

  function getSignalCanvas() {
    let canvas = document.getElementById(CRT_SIGNAL_CANVAS_ID);
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = CRT_SIGNAL_CANVAS_ID;
      canvas.setAttribute("aria-hidden", "true");
    }
    return canvas;
  }

  function mountSignalCanvasInsideFullscreen() {
    const fullscreenElement = getFullscreenElement();
    if (!fullscreenElement) return;

    const canvas = getSignalCanvas();
    if (!fullscreenElement.contains(canvas)) fullscreenElement.appendChild(canvas);
  }

  function restoreSignalCanvasToDocument() {
    const canvas = document.getElementById(CRT_SIGNAL_CANVAS_ID);
    if (canvas && canvas.parentNode !== document.documentElement) {
      document.documentElement.appendChild(canvas);
    }
  }

  function stopCrtCanvasSignal() {
    if (crtCanvasAnimation) {
      try {
        cancelAnimationFrame(crtCanvasAnimation);
        const video = findFullscreenVideoElement(getFullscreenElement());
        video?.cancelVideoFrameCallback?.(crtCanvasAnimation);
      } catch (error) {
        // Ignore cancellation mismatch between rAF and video-frame callbacks.
      }
      crtCanvasAnimation = null;
    }

    const canvas = document.getElementById(CRT_SIGNAL_CANVAS_ID);
    if (canvas) {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.setProperty("display", "none", "important");
    }

    restoreSignalCanvasToDocument();

    const controls = document.getElementById(CRT_CONTROLS_ID);
    if (controls) controls.style.setProperty("display", "none", "important");
  }

  function drawVideoContain(context, video, width, height) {
    const videoWidth = video.videoWidth || width;
    const videoHeight = video.videoHeight || height;
    if (!videoWidth || !videoHeight || !width || !height) return;

    const videoRatio = videoWidth / videoHeight;
    const canvasRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let drawX = 0;
    let drawY = 0;

    if (videoRatio > canvasRatio) {
      drawHeight = width / videoRatio;
      drawY = (height - drawHeight) / 2;
    } else {
      drawWidth = height * videoRatio;
      drawX = (width - drawWidth) / 2;
    }

    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);
    context.drawImage(video, drawX, drawY, drawWidth, drawHeight);
  }

  function promoteYouTubeChrome() {
    const fullscreenElement = getFullscreenElement();
    if (!fullscreenElement) return;

    const topSelectors = ".ytp-chrome-top, .ytp-gradient-top, .ytp-title, .ytp-title-text, .ytp-show-cards-title";
    const bottomSelectors = ".ytp-chrome-bottom, .ytp-gradient-bottom, .ytp-progress-bar-container";

    for (const chrome of fullscreenElement.querySelectorAll?.(
      ".ytp-chrome-bottom, .ytp-chrome-top, .ytp-gradient-bottom, .ytp-gradient-top, .ytp-ce-element, .ytp-caption-window-container, .ytp-progress-bar-container, .ytp-spinner, .ytp-spinner-container, .ytp-title, .ytp-title-text, .ytp-show-cards-title"
    ) || []) {
      chrome.classList.add(CONTROLS_TARGET_CLASS);
      chrome.style.setProperty("transform", "none", "important");
      chrome.style.setProperty("z-index", "2147483647", "important");
      chrome.style.setProperty("opacity", "1", "important");
      chrome.style.setProperty("visibility", "visible", "important");
      chrome.style.setProperty("display", "block", "important");
      chrome.style.setProperty("pointer-events", "auto", "important");

      if (chrome.matches?.(topSelectors)) {
        chrome.style.setProperty("position", "fixed", "important");
        chrome.style.setProperty("left", "0", "important");
        chrome.style.setProperty("right", "0", "important");
        chrome.style.setProperty("top", "0", "important");
        chrome.style.setProperty("width", "100vw", "important");
        chrome.style.setProperty("max-width", "none", "important");
      }

      if (chrome.matches?.(bottomSelectors)) {
        chrome.style.setProperty("position", "fixed", "important");
        chrome.style.setProperty("left", "0", "important");
        chrome.style.setProperty("right", "0", "important");
        chrome.style.setProperty("bottom", "0", "important");
        chrome.style.setProperty("width", "100vw", "important");
        chrome.style.setProperty("max-width", "none", "important");
      }
    }

    const player = findFullscreenPlayerStack?.(fullscreenElement);
    player?.classList?.remove("ytp-autohide");
  }

  function startCrtCanvasSignal() {
    const fullscreenElement = getFullscreenElement();
    const video = findFullscreenVideoElement(fullscreenElement);
    if (!fullscreenElement || !video || !shouldShowCrtEffects()) {
      stopCrtCanvasSignal();
      return;
    }

    mountSignalCanvasInsideFullscreen();
    promoteYouTubeChrome();

    const canvas = getSignalCanvas();
    const context = canvas.getContext("2d", { alpha: false });

    const drawOnce = () => {
      if (!shouldShowCrtEffects()) {
        stopCrtCanvasSignal();
        return;
      }

      const activeVideo = findFullscreenVideoElement(getFullscreenElement());
      if (!activeVideo || activeVideo.readyState < 2) return;

      const rect = canvas.getBoundingClientRect();

      // Keep internal resolution lower. It lives under scanlines/vignette anyway.
      const signalScale = 0.72;
      const width = Math.max(2, Math.round(rect.width * signalScale));
      const height = Math.max(2, Math.round(rect.height * signalScale));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      canvas.style.setProperty("display", "block", "important");
      canvas.style.setProperty("image-rendering", "auto", "important");
      updateCrtControls();

      try {
        drawVideoContain(context, activeVideo, width, height);
      } catch (error) {
        // Keep the loop alive if a frame fails.
      }
    };

    const tick = () => {
      drawOnce();

      const activeVideo = findFullscreenVideoElement(getFullscreenElement());
      if (!activeVideo || !shouldShowCrtEffects()) {
        stopCrtCanvasSignal();
        return;
      }

      if (typeof activeVideo.requestVideoFrameCallback === "function") {
        crtCanvasAnimation = activeVideo.requestVideoFrameCallback(() => tick());
      } else {
        crtCanvasAnimation = requestAnimationFrame(tick);
      }
    };

    if (!crtCanvasAnimation) tick();
  }

  function findFullscreenVideoElement(fullscreenElement = getFullscreenElement()) {
    if (!fullscreenElement) return null;
    if (fullscreenElement.matches?.("video")) return fullscreenElement;
    return fullscreenElement.querySelector?.("video") || document.querySelector("video");
  }

  function findFullscreenMediaSurface(fullscreenElement = getFullscreenElement()) {
    const video = findFullscreenVideoElement(fullscreenElement);
    if (!video) return null;

    // Only the actual media surface gets moved into the CRT signal rectangle.
    // Do not move #movie_player / .html5-video-player, because that shrinks/misplaces
    // the title and controls too.
    const container =
      video.closest?.(".html5-video-container") ||
      video.parentElement?.closest?.(".html5-video-container") ||
      video.parentElement;

    if (container && container !== video) return container;

    const fallback = fullscreenElement?.querySelector?.(".html5-video-container");
    if (fallback && fallback !== video) return fallback;

    return null;
  }

  function findFullscreenPlayerStack(fullscreenElement = getFullscreenElement()) {
    if (!fullscreenElement) return null;

    if (fullscreenElement.matches?.("#movie_player, .html5-video-player")) {
      return fullscreenElement;
    }

    return fullscreenElement.querySelector?.("#movie_player, .html5-video-player") ||
      findFullscreenVideoElement(fullscreenElement)?.closest?.("#movie_player, .html5-video-player") ||
      fullscreenElement;
  }

  function findFullscreenControlsSurface(fullscreenElement = getFullscreenElement()) {
    if (!fullscreenElement) return null;

    return fullscreenElement.querySelector?.(
      ".ytp-chrome-bottom, .ytp-chrome-top, .ytp-gradient-bottom, .ytp-gradient-top, .ytp-ce-element, .ytp-caption-window-container"
    );
  }

  function clearFullscreenTargetClass() {
    stopCrtCanvasSignal();
    restoreInlineCrtStyles();

    for (const element of document.querySelectorAll(`.${FULLSCREEN_TARGET_CLASS}`)) {
      element.classList.remove(FULLSCREEN_TARGET_CLASS);
    }

    for (const element of document.querySelectorAll(`.${VIDEO_TARGET_CLASS}`)) {
      element.classList.remove(VIDEO_TARGET_CLASS);
    }

    for (const element of document.querySelectorAll(`.${MEDIA_TARGET_CLASS}`)) {
      element.classList.remove(MEDIA_TARGET_CLASS);
    }

    for (const element of document.querySelectorAll(`.${CONTROLS_TARGET_CLASS}`)) {
      element.classList.remove(CONTROLS_TARGET_CLASS);
    }
  }

  function mountCrtLayersInsideFullscreen() {
    const fullscreenElement = getFullscreenElement();
    if (!fullscreenElement) return;

    const cabinet = getCrtCabinet();
    const overlay = getCrtOverlay();

    if (!fullscreenElement.contains(cabinet)) fullscreenElement.insertBefore(cabinet, fullscreenElement.firstChild);
    mountSignalCanvasInsideFullscreen();
    if (!fullscreenElement.contains(overlay)) fullscreenElement.appendChild(overlay);
    mountCrtControlsInsideFullscreen();

    setWoodTextureUrl();
  }

  function restoreCrtLayersToDocument() {
    const cabinet = document.getElementById(CRT_CABINET_ID);
    const overlay = document.getElementById(CRT_OVERLAY_ID);

    if (cabinet && cabinet.parentNode !== document.documentElement) document.documentElement.appendChild(cabinet);
    restoreSignalCanvasToDocument();
    restoreCrtControlsToDocument();
    if (overlay && overlay.parentNode !== document.documentElement) document.documentElement.appendChild(overlay);
  }

  function rememberStyle(element) {
    if (element && !crtPreviousStyle.has(element)) {
      crtPreviousStyle.set(element, element.getAttribute("style") || "");
    }
  }

  function importantStyle(element, property, value) {
    if (!element) return;
    rememberStyle(element);
    element.style.setProperty(property, value, "important");
  }

  function restoreInlineCrtStyles() {
    for (const [element, previous] of crtPreviousStyle.entries()) {
      if (!element || !element.isConnected) continue;

      if (previous) element.setAttribute("style", previous);
      else element.removeAttribute("style");
    }

    crtPreviousStyle.clear();

    if (crtInlineTimer) {
      window.clearInterval(crtInlineTimer);
      crtInlineTimer = null;
    }
  }

  function applyInlineCrtVideoLayout() {
    // Deprecated in v1.41. Do not move YouTube's video DOM.
    startCrtCanvasSignal();
  }

  function startInlineCrtLoop() {
    // v1.41: video is rendered into the CRT signal via canvas.
    // Keep the old interval name so the rest of the code path does not have to care.
    if (crtInlineTimer) return;
    startCrtCanvasSignal();
    crtInlineTimer = window.setInterval(() => {
      promoteYouTubeChrome();
      updateCrtControls();
      startCrtCanvasSignal();
    }, 500);
  }

  function applyFullscreenTargetClass() {
    clearFullscreenTargetClass();

    const fullscreenElement = getFullscreenElement();
    if (fullscreenElement?.classList) {
      fullscreenElement.classList.add(FULLSCREEN_TARGET_CLASS);
    }

    const mediaSurface = findFullscreenMediaSurface(fullscreenElement);
    const video = findFullscreenVideoElement(fullscreenElement);

    if (mediaSurface?.classList) {
      mediaSurface.classList.add(MEDIA_TARGET_CLASS);
    }

    if (video?.classList) {
      video.classList.add(VIDEO_TARGET_CLASS);
    }

    for (const chrome of fullscreenElement.querySelectorAll?.(
      ".ytp-chrome-bottom, .ytp-chrome-top, .ytp-gradient-bottom, .ytp-gradient-top, .ytp-ce-element, .ytp-caption-window-container, .ytp-progress-bar-container, .ytp-spinner, .ytp-spinner-container, .ytp-title, .ytp-title-text"
    ) || []) {
      chrome.classList.add(CONTROLS_TARGET_CLASS);
    }

    mountCrtLayersInsideFullscreen();
    startInlineCrtLoop();

    // YouTube mutates/repositions the media layer during fullscreen entry.
    // Reapply a few times, but only to the media/video and normal-scale chrome.
    window.clearTimeout(applyFullscreenTargetClass.timer);
    let tries = 0;
    const reapply = () => {
      const stillFullscreen = getFullscreenElement();
      if (!stillFullscreen || !shouldShowCrtEffects()) return;

      const nextVideo = findFullscreenVideoElement(stillFullscreen);
      const nextSurface = findFullscreenMediaSurface(stillFullscreen);

      if (nextSurface?.classList) nextSurface.classList.add(MEDIA_TARGET_CLASS);
      if (nextVideo?.classList) nextVideo.classList.add(VIDEO_TARGET_CLASS);
      applyInlineCrtVideoLayout();

      for (const chrome of stillFullscreen.querySelectorAll?.(
        ".ytp-chrome-bottom, .ytp-chrome-top, .ytp-gradient-bottom, .ytp-gradient-top, .ytp-ce-element, .ytp-caption-window-container, .ytp-progress-bar-container, .ytp-spinner, .ytp-spinner-container, .ytp-title, .ytp-title-text"
      ) || []) {
        chrome.classList.add(CONTROLS_TARGET_CLASS);
      }

      tries += 1;
      if (tries < 5) applyFullscreenTargetClass.timer = window.setTimeout(reapply, 250);
    };

    applyFullscreenTargetClass.timer = window.setTimeout(reapply, 150);
  }

  function isFullscreenVideoActive() {
    const fullscreenElement = getFullscreenElement();

    if (!fullscreenElement) return false;

    if (fullscreenElement.matches?.("video")) return true;
    if (fullscreenElement.querySelector?.("video")) return true;

    const ytPlayer = fullscreenElement.closest?.("#movie_player, .html5-video-player, ytd-watch-flexy")
      || fullscreenElement.querySelector?.("#movie_player, .html5-video-player, ytd-watch-flexy");

    return Boolean(ytPlayer && (fullscreenElement.querySelector?.("video") || document.querySelector("video")));
  }

  // Disabled in v1.48+.
// The YouTube fullscreen CRT experiment is intentionally preserved but blocked here.
// Re-enable only after fixing fullscreen video/control layering without breaking YouTube fullscreen.
function shouldShowCrtEffects() {
    return false;
  }

  function effectiveInverted() {
    return Boolean(state.inverted) !== Boolean(cyclePhase);
  }

  function applyVisuals() {
    const vars = intensityToVars(state.intensity);
    const speedSliderValue = Math.max(4, Math.min(40, Number(state.speed) || 14));
    const speed = 44 - speedSliderValue;
    const activeTextureFilters = normalizeTextureFilters(state.textureFilters);
    const hasVisualEffect = Boolean(state.enabled || state.staticColor || state.inverted || state.cycleInvert || activeTextureFilters.length);
    const invertValue = effectiveInverted() ? "1" : "0";
    const effectiveCrtEffects = shouldShowCrtEffects();

    let root = document.getElementById(ROOT_ID);
    if (hasVisualEffect) {
      root = getRoot();
      styleCustomizerOverlay(root);
      updateOverlayTransition(root);
      root.style.setProperty("display", "block", "important");
      root.style.setProperty("mix-blend-mode", normalizeBlendMode(state.blendMode), "important");
      updateRootBackdropFilter(root, invertValue);

      if (state.enabled) {
        startHueOverlayTimer(root, vars, speed);
      } else if (state.staticColor) {
        stopHueOverlayTimer();
        updateStaticOverlayColor(root, vars);
      } else {
        stopHueOverlayTimer();
        root.style.setProperty("background-color", "transparent", "important");
      }

      updateTextureFilters(root, vars);
    } else {
      stopHueOverlayTimer();
      if (root) {
        styleCustomizerOverlay(root);
        updateOverlayTransition(root);
        root.style.setProperty("display", "none", "important");
        root.style.setProperty("background-color", "transparent", "important");
        root.style.setProperty("mix-blend-mode", "normal", "important");
        removeTextureLayers(root);
        updateRootBackdropFilter(root, "0");
      }
    }

    if (effectiveCrtEffects) {
      ensureStyle();
      setWoodTextureUrl();
      const cabinet = getCrtCabinet();
      const overlay = getCrtOverlay();
      // Fullscreen mode must not move/wrap DOM, or the browser exits fullscreen.
      disableCrtShell();
      updateCrtResponsiveVars();
      applyFullscreenTargetClass();
      cabinet.style.display = "block";
      overlay.style.display = "block";
    } else {
      disableCrtShell();
      cleanupCrtFullscreenArtifacts();
      const cabinet = document.getElementById(CRT_CABINET_ID);
      const overlay = document.getElementById(CRT_OVERLAY_ID);
      if (cabinet) cabinet.style.display = "none";
      if (overlay) overlay.style.display = "none";
    }

    document.documentElement.classList.toggle("tektite-suite-customizer-crt-frame", Boolean(effectiveCrtEffects));

    return {
      enabled: state.enabled,
      inverted: effectiveInverted(),
      cycleInvert: state.cycleInvert,
      hueMonochrome: state.hueMonochrome,
      staticColor: state.staticColor,
      blendMode: normalizeBlendMode(state.blendMode),
      textureFilters: normalizeTextureFilters(state.textureFilters),
      textureColorMode: normalizeTextureColorMode(state.textureColorMode),
      textureIntensity: normalizeTextureIntensity(state.textureIntensity),
      textureScale: normalizeTextureScale(state.textureScale),
      crtEffects: state.crtEffects,
      crtEffectsActive: effectiveCrtEffects
    };
  }


  function getCurrentPageKey() {
    try {
      const parsed = new URL(window.location.href);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return `${parsed.origin}${parsed.pathname}${parsed.search}`;
      }
      if (parsed.protocol === "file:") {
        parsed.hash = "";
        return parsed.href;
      }
    } catch (_error) {
      // Browser internals and malformed URLs fall back to a safe global-ish key.
    }

    return "__global__";
  }

  function normalizeStoredCustomizerState(settings = {}) {
    return {
      enabled: Boolean(settings.customizerEnabled ?? settings.enabled ?? DEFAULT_CUSTOMIZER_STATE.enabled),
      intensity: Number.isFinite(Number(settings.customizerIntensity ?? settings.intensity)) ? Number(settings.customizerIntensity ?? settings.intensity) : DEFAULT_CUSTOMIZER_STATE.intensity,
      speed: Number.isFinite(Number(settings.customizerSpeed ?? settings.speed)) ? Number(settings.customizerSpeed ?? settings.speed) : DEFAULT_CUSTOMIZER_STATE.speed,
      inverted: Boolean(settings.customizerInverted ?? settings.inverted ?? DEFAULT_CUSTOMIZER_STATE.inverted),
      cycleInvert: Boolean(settings.customizerCycleInvert ?? settings.cycleInvert ?? DEFAULT_CUSTOMIZER_STATE.cycleInvert),
      hueMonochrome: Boolean(settings.customizerHueMonochrome ?? settings.hueMonochrome ?? DEFAULT_CUSTOMIZER_STATE.hueMonochrome),
      staticColor: normalizeHexColor(settings.customizerStaticColor ?? settings.staticColor ?? DEFAULT_CUSTOMIZER_STATE.staticColor),
      blendMode: normalizeBlendMode(settings.customizerBlendMode ?? settings.blendMode ?? DEFAULT_CUSTOMIZER_STATE.blendMode),
      textureFilters: normalizeTextureFilters(settings.customizerTextureFilters ?? settings.textureFilters ?? DEFAULT_CUSTOMIZER_STATE.textureFilters),
      textureColorMode: normalizeTextureColorMode(settings.customizerTextureColorMode ?? settings.textureColorMode ?? DEFAULT_CUSTOMIZER_STATE.textureColorMode),
      textureIntensity: normalizeTextureIntensity(settings.customizerTextureIntensity ?? settings.textureIntensity ?? DEFAULT_CUSTOMIZER_STATE.textureIntensity),
      textureScale: normalizeTextureScale(settings.customizerTextureScale ?? settings.textureScale ?? DEFAULT_CUSTOMIZER_STATE.textureScale),
      crtEffects: false
    };
  }

  function getStoredCustomizerStateForCurrentPage(saved = {}) {
    const pageKey = getCurrentPageKey();
    const pageSettings = saved[PAGE_SETTINGS_KEY] || {};

    // Never inherit legacy/global visual settings on a page with no saved entry.
    // Each new page starts with all customizer effects disabled until the popup
    // saves settings for that exact URL. Tiny mercy, delivered by JavaScript.
    return normalizeStoredCustomizerState(pageSettings[pageKey] || DEFAULT_CUSTOMIZER_STATE);
  }

  function loadStoredCustomizerStateForCurrentPage() {
    if (!chrome.storage?.local?.get) {
      applyState(DEFAULT_CUSTOMIZER_STATE);
      return Promise.resolve();
    }

    return chrome.storage.local.get({
      customizerEnabled: false,
      customizerIntensity: 55,
      customizerSpeed: 14,
      customizerInverted: false,
      customizerCycleInvert: false,
      customizerHueMonochrome: false,
      customizerStaticColor: "",
      customizerBlendMode: "normal",
      customizerTextureFilters: [],
      customizerTextureIntensity: 45,
      customizerTextureScale: 100,
      customizerCrtEffects: false,
      customizerScanlines: false,
      customizerCrtFrame: false,
      [PAGE_SETTINGS_KEY]: {}
    }).then((saved) => {
      applyState(getStoredCustomizerStateForCurrentPage(saved));
    }).catch(() => applyVisuals());
  }

  function restartCycleTimer() {
    if (cycleTimer) {
      window.clearInterval(cycleTimer);
      cycleTimer = null;
    }

    cyclePhase = false;

    if (state.cycleInvert) {
      cycleTimer = window.setInterval(() => {
        cyclePhase = !cyclePhase;
        applyVisuals();
      }, 5000);
    }
  }

  function applyState(nextState) {
    const previousCycle = state.cycleInvert;
    const previousHueMonochrome = state.hueMonochrome;
    state = { ...state, ...nextState };

    if (previousCycle !== state.cycleInvert) restartCycleTimer();
    if (previousHueMonochrome !== state.hueMonochrome && state.enabled) {
      hueOverlayHue = state.hueMonochrome ? hueOverlayHue : (hueOverlayHue || 84);
    }
    return applyVisuals();
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (shouldShowCrtEffects()) {
        updateCrtResponsiveVars();
        applyFullscreenTargetClass();
      }
    }, 80);
  }, { passive: true });

  function handleCrtDoubleClick(event) {
    if (!shouldShowCrtEffects()) return;

    event.preventDefault();
    event.stopPropagation();
    exitCrtFullscreen();
  }

  function scheduleCrtRecheck() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!getFullscreenElement()) {
        cleanupCrtFullscreenArtifacts();
      }
      applyVisuals();
    }, 80);
  }

  document.addEventListener("fullscreenchange", scheduleCrtRecheck, true);
  document.addEventListener("webkitfullscreenchange", scheduleCrtRecheck, true);
  document.addEventListener("mozfullscreenchange", scheduleCrtRecheck, true);
  document.addEventListener("MSFullscreenChange", scheduleCrtRecheck, true);
  document.addEventListener("dblclick", handleCrtDoubleClick, true);

  window.addEventListener("locationchange", () => {
    scheduleCrtRecheck();
    loadStoredCustomizerStateForCurrentPage();
  }, true);
  window.addEventListener("yt-navigate-finish", scheduleCrtRecheck, true);

  function installLocationChangeHook() {
    if (window.__tektiteSuiteLocationHookInstalled) return;
    window.__tektiteSuiteLocationHookInstalled = true;

    const fire = () => window.dispatchEvent(new Event("locationchange"));
    const rawPushState = history.pushState;
    const rawReplaceState = history.replaceState;

    history.pushState = function pushState(...args) {
      const result = rawPushState.apply(this, args);
      fire();
      return result;
    };

    history.replaceState = function replaceState(...args) {
      const result = rawReplaceState.apply(this, args);
      fire();
      return result;
    };

    window.addEventListener("popstate", fire);
  }

  installLocationChangeHook();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== "object") return;

    if (message.type === "TEKTITE_SUITE_CUSTOMIZER_PING") {
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === "TEKTITE_SUITE_CUSTOMIZER_SET") {
      sendResponse(applyState({
        enabled: Boolean(message.enabled),
        intensity: message.intensity,
        speed: message.speed,
        inverted: Boolean(message.inverted),
        cycleInvert: Boolean(message.cycleInvert),
        hueMonochrome: Boolean(message.hueMonochrome),
        staticColor: normalizeHexColor(message.staticColor),
        blendMode: normalizeBlendMode(message.blendMode),
        textureFilters: normalizeTextureFilters(message.textureFilters),
        textureColorMode: normalizeTextureColorMode(message.textureColorMode),
        textureIntensity: normalizeTextureIntensity(message.textureIntensity),
        textureScale: normalizeTextureScale(message.textureScale),
        crtEffects: Boolean(message.crtEffects)
      }));
      return true;
    }
  });

  loadStoredCustomizerStateForCurrentPage();
})();
