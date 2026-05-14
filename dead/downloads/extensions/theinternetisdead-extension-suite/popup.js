const DEFAULTS = {
  suiteTool: "main",
  defaultSuiteTool: "main",
  mainVolume: 100,
  showBrowserControlsMenu: true,
  showCustomizerMenu: true,
  showFavoritesMenu: true,
  showReaderMenu: true,
  showStorageMenu: true,
  showTheInternetIsDeadMenu: true,
  showBrokenMenu: true,
  tabVolumeByTabId: {},
  volumeControlsOpen: false,

  customizerEnabled: false,
  customizerIntensity: 55,
  customizerSpeed: 14,
  customizerInverted: false,
  customizerCycleInvert: false,
  customizerHueMonochrome: false,
  customizerStaticColor: "",
  customizerBlendMode: "normal",
  customizerTextureFilters: [],
  customizerTextureColorMode: "normal",
  customizerTextureIntensity: 45,
  customizerTextureScale: 100,
  customizerAnimateTexture: false,
  customizerTextureAnimationStyle: "no-animation",
  customizerTextureAnimationSpeed: 100,
  customizerCrtEffects: false,
  customizerSettingsByPage: {},
  customizerSelectedStoredThemeByPage: {},
  customizerSavedThemesByPage: {},

  favoritesEnabled: true,
  favoritesOpenInNewTab: true,
  favoritesIncludeFolders: true,
  favoritesMaxItems: 80,

  readerEnabled: true,
  readerVoice: "Microsoft David",
  readerRate: 100,
  readerPitch: 100,
  readerHighlightWords: true
};


const CUSTOMIZER_PAGE_SETTINGS_KEY = "customizerSettingsByPage";
const CUSTOMIZER_SELECTED_STORED_THEME_KEY = "customizerSelectedStoredThemeByPage";
const CUSTOMIZER_SAVED_THEMES_KEY = "customizerSavedThemesByPage";
const CUSTOMIZER_SAVE_THEME_BUTTON_ID = "customizerSaveTheme";
const CUSTOMIZER_SAVE_THEME_INPUT_ID = "customizerSaveThemeNameInput";
const CUSTOMIZER_DELETE_LOCAL_THEME_BUTTON_ID = "customizerDeleteLocalTheme";
const CUSTOMIZER_CONTENT_SCRIPT_FILES = ["content-customizer.js"];
const THEME_FOLDER_SCOPES = {
  ChatGPT: ["chatgpt.com"],
  YouTube: ["youtube.com", "www.youtube.com"]
};

const CUSTOMIZER_DEFAULTS = {
  customizerEnabled: false,
  customizerIntensity: 55,
  customizerSpeed: 14,
  customizerInverted: false,
  customizerCycleInvert: false,
  customizerHueMonochrome: false,
  customizerStaticColor: "",
  customizerBlendMode: "normal",
  customizerTextureFilters: [],
  customizerTextureColorMode: "normal",
  customizerTextureIntensity: 45,
  customizerTextureScale: 100,
  customizerAnimateTexture: false,
  customizerTextureAnimationStyle: "no-animation",
  customizerTextureAnimationSpeed: 100,
  customizerCrtEffects: false
};

const storageReaderState = {
  activeStore: "localStorage",
  valuesVisible: false,
  data: {
    localStorage: {},
    sessionStorage: {}
  },
  url: "",
  origin: ""
};

const $ = (id) => document.getElementById(id);

const TOOL_META = {
  main: {
    title: "Settings",
    subtitle: "dropdown visibility controls",
    icon: "icons/icon48.png"
  },
  browserControls: {
    title: "tab-control-panel",
    subtitle: "browser / tab media volume",
    icon: "icons/icon48.png"
  },
  customizer: {
    title: "overlay-customizer",
    subtitle: "hueshift / inversion / page tint",
    icon: "icons/customizer48.png"
  },
  favorites: {
    title: "context-menu-bookmarks",
    subtitle: "native right-click favorites",
    icon: "icons/favorites48.png"
  },
  reader: {
    title: "tts-reader-popup",
    subtitle: "Microsoft David reader tools",
    icon: "icons/reader48.png"
  },
  storage: {
    title: "localsessionstorage-reader",
    subtitle: "localStorage / sessionStorage viewer",
    icon: "icons/storage48.png"
  },
  theinternetisdead: {
    title: "theinternetisdead.org",
    subtitle: "mobile iframe view",
    icon: "icons/icon48.png"
  },
  broken: {
    title: "Broken Features",
    subtitle: "disabled experiments / cursed leftovers",
    icon: "icons/customizer48.png"
  }
};

const panels = {
  main: $("panel-main"),
  browserControls: $("panel-browser-controls"),
  customizer: $("panel-customizer"),
  favorites: $("panel-favorites"),
  reader: $("panel-reader"),
  storage: $("panel-storage"),
  theinternetisdead: $("panel-theinternetisdead"),
  broken: $("panel-broken")
};

function cleanTool(tool) {
  return TOOL_META[tool] ? tool : "customizer";
}

const MENU_VISIBILITY = {
  browserControls: "showBrowserControlsMenu",
  customizer: "showCustomizerMenu",
  favorites: "showFavoritesMenu",
  reader: "showReaderMenu",
  storage: "showStorageMenu",
  theinternetisdead: "showTheInternetIsDeadMenu",
  broken: "showBrokenMenu"
};

const DEFAULT_TOOL_OPTIONS = ["browserControls", "customizer", "favorites", "reader", "storage", "theinternetisdead", "broken", "main"];

function getDefaultStartTool(settings = {}) {
  const requested = cleanTool(settings.defaultSuiteTool || "main");
  return isMenuVisible(requested, settings) ? requested : "main";
}

function renderDefaultMenuOptions(settings = {}) {
  const select = $("defaultSuiteTool");
  if (!select) return;

  const current = cleanTool(settings.defaultSuiteTool || "main");
  select.innerHTML = DEFAULT_TOOL_OPTIONS.map((tool) => {
    const meta = TOOL_META[tool];
    const hiddenNote = isMenuVisible(tool, settings) ? "" : " (hidden)";
    return `<option value="${tool}">${meta.title}${hiddenNote}</option>`;
  }).join("");
  select.value = current;
}

function isMenuVisible(tool, settings = {}) {
  if (tool === "main") return true;
  const setting = MENU_VISIBILITY[tool];
  if (!setting) return true;
  return settings[setting] !== false;
}

function refreshMenuVisibility(settings = {}) {
  const select = $("toolSelect");
  if (!select) return;

  Object.entries(MENU_VISIBILITY).forEach(([tool, setting]) => {
    const checked = settings[setting] !== false;
    const checkbox = $(setting);
    if (checkbox) checkbox.checked = checked;

    const option = [...select.options].find((item) => item.value === tool);
    if (option) {
      option.hidden = !checked;
      option.disabled = !checked;
      option.style.display = checked ? "" : "none";
    }
  });
}

async function saveMenuVisibility(tool, checked) {
  const setting = MENU_VISIBILITY[tool];
  if (!setting) return;

  const next = await save({ [setting]: Boolean(checked) });
  refreshMenuVisibility(next);

  if (!checked && next.suiteTool === tool) {
    const switched = await save({ suiteTool: "customizer" });
    refreshMenuVisibility(switched);
    showTool("customizer", switched);
    return;
  }

  showTool(next.suiteTool, next);
}

function clampPercent(value, fallback = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function showTool(tool, settings = {}) {
  let selected = cleanTool(tool);
  if (!isMenuVisible(selected, settings)) selected = "customizer";

  const siteFrameMode = selected === "theinternetisdead";
  document.documentElement.classList.toggle("site-frame-mode", siteFrameMode);
  document.body.classList.toggle("site-frame-mode", siteFrameMode);

  Object.entries(panels).forEach(([key, panel]) => {
    if (panel) panel.classList.toggle("hidden", key !== selected);
  });

  const meta = TOOL_META[selected];
  $("headerTitle").textContent = meta.title;
  $("headerSubtitle").textContent = meta.subtitle;
  $("headerIcon").src = meta.icon;
  $("headerIcon").alt = meta.title;
  $("toolSelect").value = selected;

  if (selected === "browserControls") {
    chrome.storage.local.get(DEFAULTS).then((settings) => {
      if (settings.volumeControlsOpen) refreshAudioTabs().catch(() => {});
    });
  }

  if (selected === "storage") {
    refreshStorageReader().catch(() => {});
  }
}

function setVolumeControlsOpen(open) {
  const panel = $("volumeControlsPanel");
  const toggle = $("volumeControlsToggle");
  if (!panel || !toggle) return;

  panel.classList.toggle("is-open", Boolean(open));
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
}

async function toggleVolumeControls() {
  const s = await chrome.storage.local.get(DEFAULTS);
  const open = !Boolean(s.volumeControlsOpen);
  await chrome.storage.local.set({ volumeControlsOpen: open });
  setVolumeControlsOpen(open);

  if (open) refreshAudioTabs().catch(() => {});
}


function setColorFilterControlsOpen(open) {
  const panel = $("customizerColorSlideout");
  const toggle = $("customizerColorToggle");
  if (!panel || !toggle) return;

  panel.classList.toggle("is-open", Boolean(open));
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleColorFilterControls() {
  const panel = $("customizerColorSlideout");
  setColorFilterControlsOpen(!panel?.classList.contains("is-open"));
}

function setTextureControlsOpen(open) {
  const panel = $("customizerTextureSlideout");
  const toggle = $("customizerTextureToggle");
  if (!panel || !toggle) return;

  panel.classList.toggle("is-open", Boolean(open));
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleTextureControls() {
  const panel = $("customizerTextureSlideout");
  setTextureControlsOpen(!panel?.classList.contains("is-open"));
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isInjectableUrl(url = "") {
  return /^(https?:|file:)/.test(url);
}

async function sendToTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    const text = String(error?.message || error || "");

    if (
      text.includes("Receiving end does not exist") ||
      text.includes("Could not establish connection") ||
      text.includes("No tab with id") ||
      text.includes("Cannot access")
    ) {
      return { ok: false, ignored: true, reason: "no-receiving-end" };
    }

    throw error;
  }
}

async function sendToActiveTab(message) {
  const tab = await getActiveTab();

  if (!tab || !isInjectableUrl(tab.url)) {
    return { ok: false, ignored: true, reason: "non-injectable-url" };
  }

  return sendToTab(tab.id, message);
}

async function save(patch) {
  const current = await chrome.storage.local.get(DEFAULTS);
  const next = { ...current, ...patch };
  await chrome.storage.local.set(next);
  applyLabels(next);
  return next;
}

const CUSTOMIZER_BLEND_MODES = new Set([
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

function normalizeBlendMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  return CUSTOMIZER_BLEND_MODES.has(mode) ? mode : "normal";
}

const CUSTOMIZER_TEXTURE_FILTERS = new Map([
  ["black-and-white-grid", "Black and White Grid"],
  ["cobblestone", "Cobblestone"],
  ["cracked-01", "Cracked 01"],
  ["cracked-02", "Cracked 02"],
  ["dirt", "Dirt"],
  ["grass", "Grass"],
  ["lime-and-magenta-grid", "Lime and Magenta Grid"],
  ["sand", "Sand"],
  ["tv-wood", "TV Wood"],
  ["water", "Water"]
]);


const CUSTOMIZER_TEXTURE_COLOR_MODES = new Map([
  ["normal", "Normal"],
  ["grayscale", "Grayscale"],
  ["chromatic-aberration", "Chromatic Aberration"],
  ["inverted", "Inverted"],
  ["sepia", "Sepia"],
  ["terminal-green", "Terminal Green"],
  ["vaporwave", "Vaporwave"],
  ["acid-wash", "Acid Wash"],
  ["deep-fried", "Deep Fried"],
  ["washed-out", "Washed Out"]
]);

const CUSTOMIZER_TEXTURE_ANIMATION_STYLES = new Set([
  "no-animation",
  "diagonal-south-east",
  "diagonal-south-west",
  "diagonal-north-east",
  "diagonal-north-west",
  "linear-north",
  "linear-south",
  "linear-east",
  "linear-west",
  "ripple",
  "breathing"
]);

function normalizeTextureColorMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  return CUSTOMIZER_TEXTURE_COLOR_MODES.has(mode) ? mode : "normal";
}

function normalizeTextureAnimationStyle(value) {
  const style = String(value || "").trim().toLowerCase();
  if (style === "diagonal") return "diagonal-south-east";
  return CUSTOMIZER_TEXTURE_ANIMATION_STYLES.has(style) ? style : "no-animation";
}

function clampTextureAnimationSpeed(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 100;
  return Math.max(25, Math.min(300, Math.round(number)));
}

function normalizeTextureFilters(value) {
  const input = Array.isArray(value) ? value : String(value || "").split(",");
  const output = [];

  for (const item of input) {
    const key = String(item || "").trim().toLowerCase();
    if (!CUSTOMIZER_TEXTURE_FILTERS.has(key) || output.includes(key)) continue;
    output.push(key);
    if (output.length >= 3) break;
  }

  return output;
}

function textureFilterLabel(key) {
  return CUSTOMIZER_TEXTURE_FILTERS.get(key) || key;
}

function clampTextureIntensity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 45;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function clampTextureScale(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 100;
  return Math.max(25, Math.min(300, Math.round(number)));
}


function normalizeHexInput(value) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : "";
}

function getCustomizerPageKeyFromUrl(url = "") {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
    if (parsed.protocol === "file:") {
      parsed.hash = "";
      return parsed.href;
    }
  } catch (_error) {
    // Fall through to an empty key for browser/internal pages.
  }

  return "";
}

function getLegacyCustomizerPageKeyFromUrl(url = "") {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return `${parsed.origin}${parsed.pathname}${parsed.search}`;
    }
    if (parsed.protocol === "file:") {
      parsed.hash = "";
      return parsed.href;
    }
  } catch (_error) {
    // Older builds used exact path keys. This keeps them readable during the
    // transition to origin-wide themes, because apparently URLs breed edge cases.
  }

  return "";
}

function normalizeCustomizerSettings(settings = {}) {
  return {
    customizerEnabled: Boolean(settings.customizerEnabled),
    customizerIntensity: Number.isFinite(Number(settings.customizerIntensity)) ? Number(settings.customizerIntensity) : CUSTOMIZER_DEFAULTS.customizerIntensity,
    customizerSpeed: Number.isFinite(Number(settings.customizerSpeed)) ? Number(settings.customizerSpeed) : CUSTOMIZER_DEFAULTS.customizerSpeed,
    customizerInverted: Boolean(settings.customizerInverted),
    customizerCycleInvert: Boolean(settings.customizerCycleInvert),
    customizerHueMonochrome: Boolean(settings.customizerHueMonochrome),
    customizerStaticColor: normalizeHexInput(settings.customizerStaticColor),
    customizerBlendMode: normalizeBlendMode(settings.customizerBlendMode),
    customizerTextureFilters: normalizeTextureFilters(settings.customizerTextureFilters),
    customizerTextureColorMode: normalizeTextureColorMode(settings.customizerTextureColorMode),
    customizerTextureIntensity: clampTextureIntensity(settings.customizerTextureIntensity),
    customizerTextureScale: clampTextureScale(settings.customizerTextureScale),
    customizerAnimateTexture: Boolean(settings.customizerAnimateTexture ?? settings.animateTexture),
    customizerTextureAnimationStyle: normalizeTextureAnimationStyle(settings.customizerTextureAnimationStyle ?? settings.textureAnimationStyle),
    customizerTextureAnimationSpeed: clampTextureAnimationSpeed(settings.customizerTextureAnimationSpeed ?? settings.textureAnimationSpeed),
    customizerCrtEffects: false
  };
}

function extractCustomizerSettings(settings = {}) {
  return normalizeCustomizerSettings({ ...CUSTOMIZER_DEFAULTS, ...settings });
}

function customizerSettingsMatch(a = {}, b = {}) {
  const left = extractCustomizerSettings(a);
  const right = extractCustomizerSettings(b);
  return Object.keys(CUSTOMIZER_DEFAULTS).every((key) => {
    if (Array.isArray(left[key]) || Array.isArray(right[key])) {
      return JSON.stringify(left[key] || []) === JSON.stringify(right[key] || []);
    }
    return left[key] === right[key];
  });
}

function customizerSettingsAreDefault(settings = {}) {
  return customizerSettingsMatch(settings, CUSTOMIZER_DEFAULTS);
}

async function getActiveCustomizerPageKey() {
  const tab = await getActiveTab();
  return getCustomizerPageKeyFromUrl(tab?.url || "");
}

async function getCustomizerSettingsForActivePage() {
  const storage = await chrome.storage.local.get(DEFAULTS);
  const tab = await getActiveTab();
  const pageKey = getCustomizerPageKeyFromUrl(tab?.url || "");
  const legacyPageKey = getLegacyCustomizerPageKeyFromUrl(tab?.url || "");
  const pageSettings = storage[CUSTOMIZER_PAGE_SETTINGS_KEY] || {};
  const savedForPage = pageKey ? pageSettings[pageKey] : null;
  const legacySavedForPage = legacyPageKey && legacyPageKey !== pageKey ? pageSettings[legacyPageKey] : null;

  // New pages should start clean. Older builds used global customizer storage,
  // which made fresh tabs inherit effects before the user touched the page.
  // Because apparently browsers needed haunted hand-me-down CSS.
  return extractCustomizerSettings(savedForPage || legacySavedForPage || CUSTOMIZER_DEFAULTS);
}

async function saveCustomizer(patch) {
  const storage = await chrome.storage.local.get(DEFAULTS);
  const tab = await getActiveTab();
  const pageKey = getCustomizerPageKeyFromUrl(tab?.url || "");
  const legacyPageKey = getLegacyCustomizerPageKeyFromUrl(tab?.url || "");
  const safePageKey = pageKey || "__global__";
  const pageSettings = storage[CUSTOMIZER_PAGE_SETTINGS_KEY] || {};
  const current = extractCustomizerSettings(pageSettings[safePageKey] || pageSettings[legacyPageKey] || CUSTOMIZER_DEFAULTS);
  const nextCustomizer = normalizeCustomizerSettings({ ...current, ...patch, customizerCrtEffects: false });
  const nextPageSettings = {
    ...pageSettings,
    [safePageKey]: nextCustomizer
  };
  if (legacyPageKey && legacyPageKey !== safePageKey) delete nextPageSettings[legacyPageKey];

  await chrome.storage.local.set({
    [CUSTOMIZER_PAGE_SETTINGS_KEY]: nextPageSettings,
    customizerCrtEffects: false,
    customizerScanlines: false,
    customizerCrtFrame: false
  });

  applyLabels({ ...storage, ...nextCustomizer, [CUSTOMIZER_PAGE_SETTINGS_KEY]: nextPageSettings });
  return nextCustomizer;
}


async function replaceCustomizerForActivePage(settings = {}) {
  const storage = await chrome.storage.local.get(DEFAULTS);
  const tab = await getActiveTab();
  const pageKey = getCustomizerPageKeyFromUrl(tab?.url || "");
  const legacyPageKey = getLegacyCustomizerPageKeyFromUrl(tab?.url || "");
  const safePageKey = pageKey || "__global__";
  const pageSettings = storage[CUSTOMIZER_PAGE_SETTINGS_KEY] || {};
  const nextCustomizer = normalizeCustomizerSettings({
    ...CUSTOMIZER_DEFAULTS,
    ...(settings || {}),
    customizerCrtEffects: false
  });
  const nextPageSettings = {
    ...pageSettings,
    [safePageKey]: nextCustomizer
  };
  if (legacyPageKey && legacyPageKey !== safePageKey) delete nextPageSettings[legacyPageKey];

  await chrome.storage.local.set({
    [CUSTOMIZER_PAGE_SETTINGS_KEY]: nextPageSettings,
    customizerCrtEffects: false,
    customizerScanlines: false,
    customizerCrtFrame: false
  });

  applyLabels({ ...storage, ...nextCustomizer, [CUSTOMIZER_PAGE_SETTINGS_KEY]: nextPageSettings });
  return nextCustomizer;
}

async function resetCustomizerForActivePage() {
  const storage = await chrome.storage.local.get(DEFAULTS);
  const tab = await getActiveTab();
  const pageKey = getCustomizerPageKeyFromUrl(tab?.url || "");
  const legacyPageKey = getLegacyCustomizerPageKeyFromUrl(tab?.url || "");
  const safePageKey = pageKey || "__global__";
  const pageSettings = { ...(storage[CUSTOMIZER_PAGE_SETTINGS_KEY] || {}) };
  delete pageSettings[safePageKey];
  if (legacyPageKey && legacyPageKey !== safePageKey) delete pageSettings[legacyPageKey];

  await chrome.storage.local.set({
    [CUSTOMIZER_PAGE_SETTINGS_KEY]: pageSettings,
    customizerCrtEffects: false,
    customizerScanlines: false,
    customizerCrtFrame: false
  });

  const resetSettings = extractCustomizerSettings(CUSTOMIZER_DEFAULTS);
  applyLabels({ ...storage, ...resetSettings, [CUSTOMIZER_PAGE_SETTINGS_KEY]: pageSettings });
  return resetSettings;
}

function slugifyThemePart(value, fallback = "page-theme") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return slug || fallback;
}

function formatThemeTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function themeDisplayName(tab, date = new Date()) {
  const title = String(tab?.title || "Page Theme").replace(/\s+/g, " ").trim();
  return `${title || "Page Theme"} · ${date.toLocaleString()}`;
}

function getLocalThemeBucketKey(pageKey = "") {
  return pageKey || "__global__";
}

function getThemeFilenameStem(filename = "") {
  return String(filename || "")
    .split("/")
    .pop()
    .replace(/\.json$/i, "")
    .replace(/\s+/g, " ")
    .trim() || "page-theme";
}

function createCurrentPageTheme({ withTimestamp = false, filenameStemOverride = "" } = {}) {
  return getActiveThemePageContext().then(async ({ tab, pageKey, legacyPageKey }) => {
    const savedAt = new Date();
    const settings = extractCustomizerSettings(await getCustomizerSettingsForActivePage());
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const themeOrigin = pageKey === "__global__" ? "" : pageKey;
    const sourcePageUrl = tab?.url || "";
    const siteScopeDomains = getThemeDomainsForUrl(sourcePageUrl || themeOrigin);
    const stemBase = slugifyThemePart(filenameStemOverride || themeOrigin || sourcePageUrl || tab?.title || pageKey, "page-theme");
    const filenameStem = withTimestamp ? `${stemBase}-${formatThemeTimestamp(savedAt)}` : stemBase;
    const filename = `${filenameStem}.json`;
    const theme = {
      id,
      name: filenameStem,
      displayName: filenameStem,
      filename,
      pageKey,
      pageUrl: themeOrigin || sourcePageUrl,
      pageOrigin: themeOrigin,
      pageMatchMode: siteScopeDomains.length ? "domain" : "exact",
      siteScopeDomains,
      sourcePageUrl,
      legacyPageKey,
      pageTitle: tab?.title || "",
      savedAt: savedAt.toISOString(),
      extension: "theinternetisdead-extension-suite",
      type: "theinternetisdead-customizer-page-theme",
      version: 2,
      settings
    };
    return { tab, pageKey, legacyPageKey, theme, filename, filenameStem };
  });
}

async function getLocalSavedThemesForActivePage(pageKey = "", tabUrl = "") {
  const storage = await chrome.storage.local.get({ [CUSTOMIZER_SAVED_THEMES_KEY]: {} });
  const savedByPage = storage[CUSTOMIZER_SAVED_THEMES_KEY] || {};
  const activeBucket = getLocalThemeBucketKey(pageKey || getCustomizerPageKeyFromUrl(tabUrl || ""));
  const rawThemes = Array.isArray(savedByPage[activeBucket]) ? savedByPage[activeBucket] : [];

  return rawThemes
    .filter((theme) => theme?.type === "theinternetisdead-customizer-page-theme" && theme?.settings)
    .map((theme) => {
      const filename = theme.filename || `${slugifyThemePart(theme.displayName || theme.name || activeBucket, "page-theme")}.json`;
      const id = String(theme.id || filename);
      const label = getThemeFilenameStem(filename);
      return {
        ...theme,
        filename,
        __path: `localStorage/${activeBucket}/${filename}`,
        __selectId: `local:${activeBucket}:${id}`,
        __matchesActivePage: true,
        __displayName: label,
        __source: "local",
        __localBucket: activeBucket,
        __localId: id
      };
    });
}

async function getActiveThemePageContext() {
  const tab = await getActiveTab();
  const pageKey = getCustomizerPageKeyFromUrl(tab?.url || "") || "__global__";
  const legacyPageKey = getLegacyCustomizerPageKeyFromUrl(tab?.url || "") || pageKey;
  return { tab, pageKey, legacyPageKey };
}

async function fetchJsonResource(path) {
  const response = await fetch(chrome.runtime.getURL(path), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }
  return response.json();
}

function normalizeStoredThemeEntry(entry) {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry.path === "string") return entry.path;
  if (entry && typeof entry.file === "string") return entry.file;
  return "";
}

function normalizeThemeDomain(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";

  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.replace(/\.$/, "");
  } catch (_error) {
    return raw
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/:\d+$/, "")
      .replace(/\.$/, "");
  }
}

function expandThemeDomainAliases(domain = "") {
  const normalized = normalizeThemeDomain(domain);
  if (!normalized) return [];
  const aliases = new Set([normalized]);
  if (normalized.startsWith("www.")) {
    aliases.add(normalized.slice(4));
  } else if (!normalized.includes(":")) {
    aliases.add(`www.${normalized}`);
  }
  return Array.from(aliases);
}

function getThemeDomainsForUrl(url = "") {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return [];
    return expandThemeDomainAliases(parsed.hostname);
  } catch (_error) {
    return [];
  }
}

function getThemeFolderFromPath(path = "") {
  const parts = String(path || "").split("/");
  return parts.length >= 3 && parts[0] === "stored-themes" ? parts[1] : "";
}

function getThemeFolderScopeDomains(path = "") {
  const folder = getThemeFolderFromPath(path);
  return Array.isArray(THEME_FOLDER_SCOPES[folder]) ? THEME_FOLDER_SCOPES[folder] : [];
}

function safeUrlOrigin(value) {
  try {
    return new URL(String(value || "")).origin;
  } catch (_error) {
    return "";
  }
}

function domainSetsIntersect(left = [], right = []) {
  const rightSet = new Set(right.map(normalizeThemeDomain).filter(Boolean));
  return left.map(normalizeThemeDomain).filter(Boolean).some((domain) => rightSet.has(domain));
}

function pageMatchesStoredTheme(theme, pageKey, tabUrl, path = "") {
  if (theme?.pageMatchMode === "global" || theme?.siteScope === "global") return true;

  const themeScopeDomains = [
    ...(Array.isArray(theme?.siteScopeDomains) ? theme.siteScopeDomains : []),
    ...(Array.isArray(theme?.scopeDomains) ? theme.scopeDomains : []),
    ...getThemeFolderScopeDomains(path)
  ].filter(Boolean);

  if (themeScopeDomains.length) {
    return domainSetsIntersect(getThemeDomainsForUrl(tabUrl || pageKey), themeScopeDomains);
  }

  const candidates = new Set([
    String(theme?.pageKey || ""),
    String(theme?.pageUrl || "")
  ].filter((candidate) => candidate && candidate !== "__global__"));

  if (candidates.has(pageKey) || candidates.has(tabUrl)) return true;

  if (theme?.pageMatchMode === "origin") {
    const activeOrigin = safeUrlOrigin(tabUrl || pageKey);
    return Array.from(candidates).some((candidate) => safeUrlOrigin(candidate) === activeOrigin);
  }

  return false;
}

function storedThemeDisplayName(_theme, path, matchesActivePage = true) {
  const filename = String(path || "")
    .split("/")
    .pop()
    .replace(/\.json$/i, "");
  const label = String(filename || "Stored Theme")
    .replace(/\s+/g, " ")
    .trim();
  return matchesActivePage ? label : `${label} · other page`;
}

async function getStoredThemesForActivePage() {
  const { tab, pageKey } = await getActiveThemePageContext();
  const tabUrl = tab?.url || "";
  const indexPaths = [
    "stored-themes/index.json",
    ...Object.keys(THEME_FOLDER_SCOPES).map((folder) => `stored-themes/${folder}/index.json`)
  ];
  const index = [];

  for (const indexPath of indexPaths) {
    try {
      const indexJson = await fetchJsonResource(indexPath);
      const entries = Array.isArray(indexJson) ? indexJson : Array.isArray(indexJson.themes) ? indexJson.themes : [];
      index.push(...entries);
    } catch (_error) {
      // Missing theme indexes are fine. Apparently folders need lore now.
    }
  }

  const themes = [];
  const seenPaths = new Set();
  for (const entry of index) {
    const path = normalizeStoredThemeEntry(entry);
    if (!path || !path.startsWith("stored-themes/") || !path.endsWith(".json")) continue;
    if (path.endsWith("/index.json") || path === "stored-themes/index.json") continue;
    if (seenPaths.has(path)) continue;
    seenPaths.add(path);

    try {
      const theme = await fetchJsonResource(path);
      if (theme?.type !== "theinternetisdead-customizer-page-theme" || !theme?.settings) continue;
      const matchesActivePage = pageMatchesStoredTheme(theme, pageKey, tabUrl, path);
      if (!matchesActivePage) continue;
      themes.push({
        ...theme,
        __path: path,
        __selectId: path,
        __matchesActivePage: matchesActivePage,
        __displayName: storedThemeDisplayName(theme, path, matchesActivePage),
        __source: "stored"
      });
    } catch (_error) {
      // Ignore broken theme files so one bad JSON doesn't brick the dropdown.
    }
  }

  themes.push(...await getLocalSavedThemesForActivePage(pageKey, tabUrl));

  return themes.sort((a, b) => {
    return String(a.__path || a.__displayName).localeCompare(String(b.__path || b.__displayName));
  });
}


async function getSelectedStoredThemeForActivePage() {
  const storage = await chrome.storage.local.get({ [CUSTOMIZER_SELECTED_STORED_THEME_KEY]: {} });
  const pageKey = await getActiveCustomizerPageKey();
  const safePageKey = pageKey || "__global__";
  const selectedByPage = storage[CUSTOMIZER_SELECTED_STORED_THEME_KEY] || {};
  return String(selectedByPage[safePageKey] || "");
}

async function setSelectedStoredThemeForActivePage(selectedId = "") {
  const storage = await chrome.storage.local.get({ [CUSTOMIZER_SELECTED_STORED_THEME_KEY]: {} });
  const pageKey = await getActiveCustomizerPageKey();
  const safePageKey = pageKey || "__global__";
  const selectedByPage = { ...(storage[CUSTOMIZER_SELECTED_STORED_THEME_KEY] || {}) };

  if (selectedId) {
    selectedByPage[safePageKey] = String(selectedId);
  } else {
    delete selectedByPage[safePageKey];
  }

  await chrome.storage.local.set({ [CUSTOMIZER_SELECTED_STORED_THEME_KEY]: selectedByPage });
}

async function renderSavedThemesDropdown(selectedId = "", currentSettings = null) {
  const select = $("customizerSavedThemesSelect");
  if (!select) return;

  const themes = await getStoredThemesForActivePage();
  const activeSelectedId = selectedId || await getSelectedStoredThemeForActivePage();
  const selectedTheme = activeSelectedId ? themes.find((theme) => theme.__selectId === activeSelectedId) : null;
  const hasSelectedTheme = Boolean(selectedTheme);
  const settings = currentSettings || await getCustomizerSettingsForActivePage();
  const isDefaultTheme = customizerSettingsAreDefault(settings);
  const selectedThemeIsClean = Boolean(selectedTheme?.settings && customizerSettingsMatch(settings, selectedTheme.settings));
  const isCustomizedState = !isDefaultTheme && !selectedThemeIsClean;

  select.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Default";
  select.append(defaultOption);

  if (isCustomizedState) {
    const customizedOption = document.createElement("option");
    customizedOption.value = "__customized__";
    customizedOption.textContent = "Customized";
    select.append(customizedOption);
  }

  for (const theme of themes) {
    const option = document.createElement("option");
    option.value = theme.__selectId;
    const label = theme.__displayName || String(theme.__path || "").split("/").pop().replace(/\.json$/i, "");
    option.textContent = label;
    select.append(option);
  }


  if (hasSelectedTheme && selectedThemeIsClean) {
    select.value = activeSelectedId;
  } else if (isCustomizedState) {
    select.value = "__customized__";
  } else {
    select.value = "";
  }

  updateDeleteLocalThemeButton(themes, select.value);
}

function updateDeleteLocalThemeButton(themes = [], selectedId = "") {
  const button = $(CUSTOMIZER_DELETE_LOCAL_THEME_BUTTON_ID);
  if (!button) return;

  const selectedTheme = themes.find((theme) => theme.__selectId === selectedId);
  const canDelete = selectedTheme?.__source === "local";
  button.hidden = !canDelete;
  button.disabled = !canDelete;
  button.dataset.themeId = canDelete ? selectedTheme.__selectId : "";
}

async function deleteSelectedLocalTheme() {
  const select = $("customizerSavedThemesSelect");
  const selectedId = String(select?.value || "");
  if (!selectedId) return;

  const themes = await getStoredThemesForActivePage();
  const selectedTheme = themes.find((theme) => theme.__selectId === selectedId && theme.__source === "local");
  const bucketKey = selectedTheme?.__localBucket;
  const localId = selectedTheme?.__localId;
  if (!bucketKey || !localId) return;

  const storage = await chrome.storage.local.get({ [CUSTOMIZER_SAVED_THEMES_KEY]: {} });
  const savedByPage = { ...(storage[CUSTOMIZER_SAVED_THEMES_KEY] || {}) };
  const existing = Array.isArray(savedByPage[bucketKey]) ? savedByPage[bucketKey] : [];
  const nextThemes = existing.filter((theme) => String(theme?.id || theme?.filename || "") !== String(localId));

  if (nextThemes.length) {
    savedByPage[bucketKey] = nextThemes;
  } else {
    delete savedByPage[bucketKey];
  }

  await chrome.storage.local.set({ [CUSTOMIZER_SAVED_THEMES_KEY]: savedByPage });
  await setSelectedStoredThemeForActivePage("");
  const resetSettings = await resetCustomizerForActivePage();
  await renderSavedThemesDropdown("", resetSettings);
}

async function exportCurrentPageThemeJson() {
  const { theme, filename } = await createCurrentPageTheme({ withTimestamp: true });
  const blob = new Blob([JSON.stringify(theme, null, 2)], { type: "application/json" });
  const objectUrl = URL.createObjectURL(blob);

  try {
    if (chrome.downloads?.download) {
      await chrome.downloads.download({
        url: objectUrl,
        filename,
        saveAs: true,
        conflictAction: "uniquify"
      });
    }
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
  }

  await renderSavedThemesDropdown();
  return theme;
}

async function saveCurrentPageThemeToLocalStorage(themeName = "") {
  const cleanThemeName = slugifyThemePart(themeName, "page-theme");
  const { pageKey, theme } = await createCurrentPageTheme({
    withTimestamp: false,
    filenameStemOverride: cleanThemeName
  });
  const bucketKey = getLocalThemeBucketKey(pageKey);
  const storage = await chrome.storage.local.get({
    [CUSTOMIZER_SAVED_THEMES_KEY]: {},
    [CUSTOMIZER_SELECTED_STORED_THEME_KEY]: {}
  });
  const savedByPage = { ...(storage[CUSTOMIZER_SAVED_THEMES_KEY] || {}) };
  const existing = Array.isArray(savedByPage[bucketKey]) ? savedByPage[bucketKey] : [];
  const filename = theme.filename;
  const localId = filename;
  const label = getThemeFilenameStem(filename);
  const nextTheme = {
    ...theme,
    id: localId,
    name: label,
    displayName: label
  };
  const withoutOldCopy = existing.filter((item) => item?.filename !== filename && item?.id !== localId);
  savedByPage[bucketKey] = [...withoutOldCopy, nextTheme];

  await chrome.storage.local.set({ [CUSTOMIZER_SAVED_THEMES_KEY]: savedByPage });
  const selectedId = `local:${bucketKey}:${localId}`;
  await setSelectedStoredThemeForActivePage(selectedId);
  await renderSavedThemesDropdown(selectedId, nextTheme.settings);
  return nextTheme;
}

function restoreSaveThemeButton(label = "Save Page Theme") {
  const input = $(CUSTOMIZER_SAVE_THEME_INPUT_ID);
  if (!input) return;

  const button = document.createElement("button");
  button.id = CUSTOMIZER_SAVE_THEME_BUTTON_ID;
  button.className = "secondary";
  button.type = "button";
  button.title = "Click to name and save this site theme locally. Shift-click to export a JSON file.";
  button.textContent = label;
  input.replaceWith(button);
  attachSaveThemeButtonHandler(button);

  if (label !== "Save Page Theme") {
    setTimeout(() => {
      const currentButton = $(CUSTOMIZER_SAVE_THEME_BUTTON_ID);
      if (currentButton) currentButton.textContent = "Save Page Theme";
    }, 1200);
  }
}

function showSaveThemeNameInput() {
  const button = $(CUSTOMIZER_SAVE_THEME_BUTTON_ID);
  if (!button) return;

  const input = document.createElement("input");
  input.id = CUSTOMIZER_SAVE_THEME_INPUT_ID;
  input.className = "secondary save-theme-name-input";
  input.type = "text";
  input.placeholder = "Theme name, then Enter";
  input.title = "Type a theme name, then press Enter to save locally. Esc cancels.";
  input.autocomplete = "off";
  input.spellcheck = false;

  button.replaceWith(input);
  requestAnimationFrame(() => input.focus());

  input.addEventListener("keydown", async (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      restoreSaveThemeButton();
      return;
    }

    if (event.key !== "Enter") return;
    event.preventDefault();

    const themeName = input.value.trim();
    if (!themeName) {
      input.placeholder = "Name required, tiny tragedy";
      input.classList.add("needs-value");
      return;
    }

    input.disabled = true;
    await saveCurrentPageThemeToLocalStorage(themeName);
    restoreSaveThemeButton("Saved");
  });
}

function attachSaveThemeButtonHandler(button = $(CUSTOMIZER_SAVE_THEME_BUTTON_ID)) {
  if (!button) return;
  button.addEventListener("click", async (event) => {
    if (event.shiftKey) {
      await exportCurrentPageThemeJson();
      return;
    }

    showSaveThemeNameInput();
  });
}

async function applySelectedSavedTheme() {
  const select = $("customizerSavedThemesSelect");
  const selectedId = String(select?.value || "");

  if (selectedId === "__customized__") return;

  if (!selectedId) {
    const next = await resetCustomizerForActivePage();
    await setSelectedStoredThemeForActivePage("");
    await applyCustomizer(next);
    await renderSavedThemesDropdown("", next);
    return;
  }

  const themes = await getStoredThemesForActivePage();
  const theme = themes.find((item) => item.__selectId === selectedId);
  if (!theme?.settings) return;

  // Changing stored themes should replace the current page theme, not merge
  // over it. Otherwise old texture filters/static colors can linger like
  // emotional baggage with CSS variables.
  const resetSettings = extractCustomizerSettings(CUSTOMIZER_DEFAULTS);
  await applyCustomizer(resetSettings);
  const next = await replaceCustomizerForActivePage(theme.settings);
  await setSelectedStoredThemeForActivePage(selectedId);
  await applyCustomizer(next);
  applyLabels({ ...(await chrome.storage.local.get(DEFAULTS)), ...next });
  await renderSavedThemesDropdown(selectedId, next);
}

function renderTextureFilterList(filters) {
  const list = $("customizerTextureFilterList");
  const select = $("customizerTextureFilterSelect");
  const addButton = $("customizerAddTextureFilter");
  if (!list || !select || !addButton) return;

  const normalized = normalizeTextureFilters(filters);
  const available = [...CUSTOMIZER_TEXTURE_FILTERS.keys()].filter((key) => !normalized.includes(key));

  list.innerHTML = "";

  if (!normalized.length) {
    const empty = document.createElement("span");
    empty.className = "texture-filter-empty";
    empty.textContent = "No texture filters selected";
    list.append(empty);
  } else {
    for (const key of normalized) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "secondary texture-filter-chip";
      chip.dataset.textureFilter = key;
      chip.textContent = `${textureFilterLabel(key)} ×`;
      chip.title = `Remove ${textureFilterLabel(key)}`;
      list.append(chip);
    }
  }

  for (const option of select.options) {
    option.disabled = normalized.includes(option.value);
  }

  if (available.length) select.value = available.includes(select.value) ? select.value : available[0];

  addButton.disabled = normalized.length >= 3 || !available.length;
  addButton.title = normalized.length >= 3 ? "Maximum of 3 texture filters" : "Add texture filter";
}

function applyLabels(s) {
  refreshMenuVisibility(s);
  renderDefaultMenuOptions(s);
  showTool(s.suiteTool || getDefaultStartTool(s), s);

  $("mainVolume").value = clampPercent(s.mainVolume, 100);
  $("mainVolumeValue").textContent = `${clampPercent(s.mainVolume, 100)}%`;
  setVolumeControlsOpen(Boolean(s.volumeControlsOpen));

  $("customizerToggle").checked = Boolean(s.customizerEnabled);
  $("customizerIntensity").value = s.customizerIntensity;
  $("customizerSpeed").value = s.customizerSpeed;
  const staticColor = /^#[0-9a-f]{6}$/i.test(String(s.customizerStaticColor || "")) ? String(s.customizerStaticColor) : "";
  const staticColorValue = $("customizerStaticColorValue");
  const staticColorTarget = $("customizerStaticColorTarget");
  staticColorValue.textContent = staticColor ? staticColor.toUpperCase() : "Default";
  staticColorTarget.style.background = staticColor || "rgba(5, 0, 8, 0.95)";
  $("customizerStaticColorPicker").value = staticColor || "#99ff00";
  const clearStaticColor = $("customizerClearStaticColor");
  if (clearStaticColor) clearStaticColor.hidden = !staticColor;
  $("customizerBlendMode").value = normalizeBlendMode(s.customizerBlendMode);
  const textureColorMode = $("customizerTextureColorMode");
  if (textureColorMode) textureColorMode.value = normalizeTextureColorMode(s.customizerTextureColorMode);
  $("customizerTextureIntensity").value = clampTextureIntensity(s.customizerTextureIntensity);
  $("customizerTextureScale").value = clampTextureScale(s.customizerTextureScale);
  const animateTexture = $("customizerAnimateTexture");
  if (animateTexture) animateTexture.checked = Boolean(s.customizerAnimateTexture);
  const textureAnimationStyle = $("customizerTextureAnimationStyle");
  const normalizedTextureAnimationStyle = Boolean(s.customizerAnimateTexture)
    ? normalizeTextureAnimationStyle(s.customizerTextureAnimationStyle)
    : "no-animation";
  if (textureAnimationStyle) textureAnimationStyle.value = normalizedTextureAnimationStyle;
  const textureAnimationStyleRow = $("customizerTextureAnimationStyleRow");
  if (textureAnimationStyleRow) textureAnimationStyleRow.hidden = !Boolean(s.customizerAnimateTexture);
  const textureAnimationSpeed = $("customizerTextureAnimationSpeed");
  if (textureAnimationSpeed) textureAnimationSpeed.value = clampTextureAnimationSpeed(s.customizerTextureAnimationSpeed);
  const textureAnimationSpeedRow = $("customizerTextureAnimationSpeedRow");
  if (textureAnimationSpeedRow) textureAnimationSpeedRow.hidden = !Boolean(s.customizerAnimateTexture) || normalizedTextureAnimationStyle === "no-animation";
  renderTextureFilterList(s.customizerTextureFilters);
  $("customizerInvert").checked = Boolean(s.customizerInverted);
  $("customizerCycleInvert").checked = Boolean(s.customizerCycleInvert);
  const hueMonochrome = $("customizerHueMonochrome");
  if (hueMonochrome) hueMonochrome.checked = Boolean(s.customizerHueMonochrome);
  const crtEffects = $("customizerCrtEffects");
  if (crtEffects) crtEffects.checked = false;

  $("favoritesToggle").textContent = s.favoritesEnabled ? "Disable Favorites Menu" : "Enable Favorites Menu";
  $("favoritesOpenNewTab").checked = Boolean(s.favoritesOpenInNewTab);
  $("favoritesIncludeFolders").checked = Boolean(s.favoritesIncludeFolders);
  $("favoritesMaxItems").value = Number(s.favoritesMaxItems || 80);

  $("readerToggle").textContent = s.readerEnabled ? "Disable Reader Tools" : "Enable Reader Tools";
  $("readerVoice").value = s.readerVoice ?? "Microsoft David";
  $("readerRate").value = Number(s.readerRate || 100);
  $("readerPitch").value = Number(s.readerPitch || 100);
  $("readerHighlightWords").checked = Boolean(s.readerHighlightWords);
}

async function getAllInjectableTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs.filter((tab) => tab?.id && isInjectableUrl(tab.url));
}

function getTabVolume(settings, tabId) {
  const byTab = settings.tabVolumeByTabId || {};
  return clampPercent(byTab[String(tabId)], 100);
}

async function applyVolumeToTab(tab, settings) {
  if (!tab?.id || !isInjectableUrl(tab.url)) return;

  await sendToTab(tab.id, {
    type: "TEKTITE_SUITE_VOLUME_SET",
    masterVolume: clampPercent(settings.mainVolume, 100),
    tabVolume: getTabVolume(settings, tab.id)
  });
}

async function applyVolumeToAllTabs(settings) {
  const tabs = await getAllInjectableTabs();
  await Promise.allSettled(tabs.map((tab) => applyVolumeToTab(tab, settings)));
}

function tabLabel(tab, report) {
  const title = String(tab.title || tab.url || "Untitled audio tab").trim();
  const count = Number(report?.mediaCount || 0);
  const suffix = count > 1 ? ` · ${count} media elements` : count === 1 ? " · 1 media element" : tab.audible ? " · audible" : "";
  return `${title}${suffix}`;
}

function setupHoverMarquee(nameEl) {
  const inner = nameEl?.querySelector(".tab-volume-marquee");
  if (!nameEl || !inner) return;

  requestAnimationFrame(() => {
    const overflow = inner.scrollWidth > nameEl.clientWidth + 1;
    nameEl.classList.toggle("is-overflowing", overflow);

    if (!overflow) {
      nameEl.style.removeProperty("--marquee-distance");
      nameEl.style.removeProperty("--marquee-duration");
      return;
    }

    const distance = Math.max(0, inner.scrollWidth - nameEl.clientWidth + 12);
    const duration = Math.max(4, Math.min(16, distance / 18));
    nameEl.style.setProperty("--marquee-distance", `${distance}px`);
    nameEl.style.setProperty("--marquee-duration", `${duration}s`);
  });
}


async function refreshAudioTabs() {
  const list = $("tabVolumeList");
  if (!list) return;

  list.innerHTML = '<p class="note">Scanning tabs for media...</p>';

  const settings = await chrome.storage.local.get(DEFAULTS);
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabs = await getAllInjectableTabs();
  const rows = [];

  for (const tab of tabs) {
    const report = await sendToTab(tab.id, { type: "TEKTITE_SUITE_VOLUME_REPORT" });
    const hasMedia = Number(report?.mediaCount || 0) > 0 || Boolean(tab.audible);
    if (!hasMedia) continue;

    rows.push({ tab, report });
    await applyVolumeToTab(tab, settings);
  }

  if (!rows.length) {
    list.innerHTML = '<p class="note">No tabs with detectable HTML audio/video right now. Humanity may briefly know peace.</p>';
    return;
  }

  list.innerHTML = "";

  for (const { tab, report } of rows) {
    const value = getTabVolume(settings, tab.id);
    const card = document.createElement("div");
    card.className = "tab-volume-card";
    if (activeTab?.id === tab.id) card.classList.add("is-active-tab");

    const label = tabLabel(tab, report);
    const name = document.createElement("div");
    name.className = "tab-volume-name";
    name.title = label;

    const marquee = document.createElement("span");
    marquee.className = "tab-volume-marquee";
    marquee.textContent = label;
    name.append(marquee);

    const controls = document.createElement("div");
    controls.className = "tab-volume-controls";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = String(value);
    slider.dataset.tabId = String(tab.id);

    const readout = document.createElement("span");
    readout.className = "tab-volume-value";
    readout.textContent = `${value}%`;

    slider.addEventListener("input", async () => {
      const nextValue = clampPercent(slider.value, 100);
      readout.textContent = `${nextValue}%`;

      const fresh = await chrome.storage.local.get(DEFAULTS);
      const nextByTab = { ...(fresh.tabVolumeByTabId || {}), [String(tab.id)]: nextValue };
      const nextSettings = { ...fresh, tabVolumeByTabId: nextByTab };
      await chrome.storage.local.set({ tabVolumeByTabId: nextByTab });
      await applyVolumeToTab(tab, nextSettings);
    });

    controls.append(slider, readout);
    card.append(name, controls);
    list.append(card);
    setupHoverMarquee(name);
  }
}

async function ensureCustomizerContentScript(tab) {
  if (!tab?.id || !isInjectableUrl(tab.url || "")) return false;

  const ping = await sendToTab(tab.id, { type: "TEKTITE_SUITE_CUSTOMIZER_PING" });
  if (ping?.ok) return true;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: CUSTOMIZER_CONTENT_SCRIPT_FILES
    });
    return true;
  } catch (_error) {
    return false;
  }
}

async function applyCustomizer(s) {
  const tab = await getActiveTab();

  if (!tab || !isInjectableUrl(tab.url || "")) {
    return { ok: false, ignored: true, reason: "non-injectable-url" };
  }

  const ready = await ensureCustomizerContentScript(tab);
  if (!ready) return { ok: false, ignored: true, reason: "customizer-not-ready" };

  try {
    return await sendToTab(tab.id, {
      type: "TEKTITE_SUITE_CUSTOMIZER_SET",
      enabled: Boolean(s.customizerEnabled),
      intensity: Number(s.customizerIntensity),
      speed: Number(s.customizerSpeed),
      inverted: Boolean(s.customizerInverted),
      cycleInvert: Boolean(s.customizerCycleInvert),
      hueMonochrome: Boolean(s.customizerHueMonochrome),
      filterImages: false,
      staticColor: String(s.customizerStaticColor || ""),
      blendMode: normalizeBlendMode(s.customizerBlendMode),
      textureFilters: normalizeTextureFilters(s.customizerTextureFilters),
      textureColorMode: normalizeTextureColorMode(s.customizerTextureColorMode),
      textureIntensity: clampTextureIntensity(s.customizerTextureIntensity),
      textureScale: clampTextureScale(s.customizerTextureScale),
      animateTexture: Boolean(s.customizerAnimateTexture),
      textureAnimationStyle: normalizeTextureAnimationStyle(s.customizerTextureAnimationStyle),
      textureAnimationSpeed: clampTextureAnimationSpeed(s.customizerTextureAnimationSpeed),
      crtEffects: false
    });
  } catch (_error) {
    return { ok: false, ignored: true, reason: "customizer-apply-failed" };
  }
}

async function saveAndApplyCustomizer(patch) {
  const next = await saveCustomizer(patch);
  await setSelectedStoredThemeForActivePage("");
  await applyCustomizer(next);
  await renderSavedThemesDropdown("", next);
  return next;
}

async function addSelectedTextureFilter() {
  const s = await getCustomizerSettingsForActivePage();
  const filters = normalizeTextureFilters(s.customizerTextureFilters);
  const selected = String($("customizerTextureFilterSelect").value || "").trim().toLowerCase();

  if (!CUSTOMIZER_TEXTURE_FILTERS.has(selected) || filters.includes(selected) || filters.length >= 3) return s;

  return saveAndApplyCustomizer({ customizerTextureFilters: [...filters, selected].slice(0, 3) });
}

async function sendReader(action, extra = {}) {
  const s = await chrome.storage.local.get(DEFAULTS);

  try {
    await sendToActiveTab({
      type: "TEKTITE_SUITE_READER_ACTION",
      action,
      enabled: Boolean(s.readerEnabled),
      voiceName: s.readerVoice,
      rate: Number(s.readerRate) / 100,
      pitch: Number(s.readerPitch) / 100,
      highlightWords: Boolean(s.readerHighlightWords),
      ...extra
    });
  } catch (error) {
    // Quiet expected no-content-script receiver cases.
  }
}


function storageEscapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function storagePrettyValue(value) {
  if (typeof value !== "string") return String(value);
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function storageRedactValue(value) {
  const length = String(value ?? "").length;
  return `Hidden (${length} character${length === 1 ? "" : "s"}). Use Show Values when not recording.`;
}

function storageSetStatus(message) {
  const status = $("storageStatus");
  if (!status) return;

  if (!message) {
    status.hidden = true;
    status.textContent = "";
    return;
  }

  status.hidden = false;
  status.textContent = message;
}

function storageReadFromPage() {
  function dumpStorage(storage) {
    const output = {};
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      output[key] = storage.getItem(key);
    }
    return output;
  }

  return {
    url: location.href,
    origin: location.origin,
    localStorage: dumpStorage(window.localStorage),
    sessionStorage: dumpStorage(window.sessionStorage)
  };
}

function setStorageMenuOpen(isOpen) {
  const panel = $("panel-storage");
  const drawer = $("storageMenuDrawer");
  const button = $("storageMenuBtn");
  if (!panel || !drawer || !button) return;

  panel.classList.toggle("storage-menu-closed", !isOpen);
  drawer.hidden = false;
  drawer.setAttribute("aria-hidden", String(!isOpen));
  button.setAttribute("aria-expanded", String(isOpen));
  button.textContent = isOpen ? "Hide" : "Menu";
  button.title = isOpen ? "Hide Menu" : "Menu";
}

function updateStorageRevealButton() {
  const reveal = $("storageRevealBtn");
  const copy = $("storageCopyBtn");
  if (!reveal || !copy) return;

  reveal.textContent = storageReaderState.valuesVisible ? "Hide Values" : "Show Values";
  reveal.setAttribute("aria-pressed", String(storageReaderState.valuesVisible));
  copy.disabled = !storageReaderState.valuesVisible;
  copy.title = storageReaderState.valuesVisible
    ? "Copy visible store as JSON"
    : "Values are hidden. Use Show Values before copying JSON.";
}

function renderStorageItems() {
  updateStorageRevealButton();

  const summary = $("storageSummary");
  const items = $("storageItems");
  const filter = $("storageFilterInput");
  if (!summary || !items || !filter) return;

  const storeName = storageReaderState.activeStore;
  const query = filter.value.trim().toLowerCase();
  const entries = Object.entries(storageReaderState.data[storeName] || {});
  const filtered = entries.filter(([key, value]) => {
    if (!query) return true;
    if (key.toLowerCase().includes(query)) return true;
    return storageReaderState.valuesVisible && String(value).toLowerCase().includes(query);
  });

  const visibilityNote = storageReaderState.valuesVisible ? "values shown" : "values hidden";
  summary.textContent = `${storeName}: ${entries.length} item${entries.length === 1 ? "" : "s"}${query ? `, ${filtered.length} shown` : ""} • ${visibilityNote}`;

  if (!filtered.length) {
    items.innerHTML = `<div class="storage-empty">No ${storageEscapeHtml(storeName)} entries found. The drawer is empty, somehow suspicious.</div>`;
    return;
  }

  items.innerHTML = filtered.map(([key, value], index) => {
    const valueText = storageReaderState.valuesVisible ? storagePrettyValue(value) : storageRedactValue(value);
    return `
      <article class="storage-item ${storageReaderState.valuesVisible ? "values-shown" : "values-hidden"}" data-index="${index}">
        <div class="storage-key-row">
          <div class="storage-key">${storageEscapeHtml(key)}</div>
          <button class="secondary storage-copy-one" type="button" data-key="${storageEscapeHtml(key)}" ${storageReaderState.valuesVisible ? "" : "disabled title=\"Use Show Values before copying this value\""}>Copy</button>
        </div>
        <pre class="storage-value ${storageReaderState.valuesVisible ? "" : "redacted"}">${storageEscapeHtml(valueText)}</pre>
      </article>
    `;
  }).join("");
}

function setActiveStorageStore(storeName) {
  storageReaderState.activeStore = storeName;
  $("storageLocalTab")?.classList.toggle("active", storeName === "localStorage");
  $("storageSessionTab")?.classList.toggle("active", storeName === "sessionStorage");
  renderStorageItems();
}

async function refreshStorageReader() {
  storageSetStatus("");
  const summary = $("storageSummary");
  const items = $("storageItems");
  if (summary) summary.textContent = "Reading storage...";
  if (items) items.innerHTML = "";

  try {
    const tab = await getActiveTab();
    if (!tab?.id) throw new Error("No active tab found. Browser goblin got evasive.");

    const url = tab.url || "";
    if (/^(edge|chrome|about|devtools|chrome-extension):/i.test(url)) {
      throw new Error("This page blocks extension page scripts. Try a normal webpage, localhost, or your site.");
    }

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: storageReadFromPage
    });

    const payload = result?.result;
    if (!payload) throw new Error("No storage payload returned from the page. Very theatrical of it.");

    storageReaderState.url = payload.url || url;
    storageReaderState.origin = payload.origin || "";
    storageReaderState.data.localStorage = payload.localStorage || {};
    storageReaderState.data.sessionStorage = payload.sessionStorage || {};

    const pageLabel = $("storagePageLabel");
    if (pageLabel) pageLabel.textContent = storageReaderState.origin || storageReaderState.url || "Current tab";
    renderStorageItems();
  } catch (err) {
    const message = err?.message || String(err);
    if (summary) summary.textContent = "";
    storageSetStatus(message);
  }
}

async function copyStorageText(text) {
  await navigator.clipboard.writeText(text);
}

function wireStorageReaderControls() {
  $("storageRefreshBtn")?.addEventListener("click", refreshStorageReader);
  $("storageMenuBtn")?.addEventListener("click", () => {
    const isOpen = $("storageMenuBtn")?.getAttribute("aria-expanded") !== "true";
    setStorageMenuOpen(isOpen);
  });
  $("storageLocalTab")?.addEventListener("click", () => setActiveStorageStore("localStorage"));
  $("storageSessionTab")?.addEventListener("click", () => setActiveStorageStore("sessionStorage"));
  $("storageFilterInput")?.addEventListener("input", renderStorageItems);

  $("storageRevealBtn")?.addEventListener("click", () => {
    storageReaderState.valuesVisible = !storageReaderState.valuesVisible;
    renderStorageItems();
  });

  $("storageCopyBtn")?.addEventListener("click", async () => {
    if (!storageReaderState.valuesVisible) return;
    const storeName = storageReaderState.activeStore;
    await copyStorageText(JSON.stringify(storageReaderState.data[storeName] || {}, null, 2));
    const copyButton = $("storageCopyBtn");
    if (!copyButton) return;
    copyButton.textContent = "Copied";
    setTimeout(() => { copyButton.textContent = "Copy JSON"; }, 800);
  });

  $("storageItems")?.addEventListener("click", async (event) => {
    const button = event.target.closest(".storage-copy-one");
    if (!button || !storageReaderState.valuesVisible) return;
    const key = button.dataset.key;
    const value = storageReaderState.data[storageReaderState.activeStore]?.[key] ?? "";
    await copyStorageText(value);
    button.textContent = "Copied";
    setTimeout(() => { button.textContent = "Copy"; }, 800);
  });

  storageReaderState.valuesVisible = false;
  setStorageMenuOpen(false);
  updateStorageRevealButton();
}

async function init() {
  wireStorageReaderControls();
  await chrome.storage.local.set({ customizerCrtEffects: false, customizerScanlines: false, customizerCrtFrame: false });
  const s = await chrome.storage.local.get(DEFAULTS);
  const customizerSettings = await getCustomizerSettingsForActivePage();
  const startTool = getDefaultStartTool(s);
  applyLabels({ ...s, ...customizerSettings, suiteTool: startTool });
  await renderSavedThemesDropdown();
  await applyCustomizer(customizerSettings);
  await applyVolumeToAllTabs(s);
}

$("toolSelect").addEventListener("change", async (event) => {
  const selected = cleanTool(event.target.value);
  const next = await save({ suiteTool: selected });
  refreshMenuVisibility(next);
  showTool(next.suiteTool, next);

  if (selected === "customizer") {
    const customizerSettings = await getCustomizerSettingsForActivePage();
    applyLabels({ ...next, ...customizerSettings });
    await renderSavedThemesDropdown();
    await applyCustomizer(customizerSettings);
  }
});

Object.keys(MENU_VISIBILITY).forEach((tool) => {
  const setting = MENU_VISIBILITY[tool];
  const checkbox = $(setting);
  if (checkbox) {
    checkbox.addEventListener("change", (event) => saveMenuVisibility(tool, event.target.checked));
  }
});

$("defaultSuiteTool")?.addEventListener("change", async () => {
  const selected = cleanTool($("defaultSuiteTool").value || "main");
  const next = await save({ defaultSuiteTool: selected });
  renderDefaultMenuOptions(next);
});

$("volumeControlsToggle").addEventListener("click", () => toggleVolumeControls());

$("mainVolume").addEventListener("input", async () => {
  const volume = clampPercent($("mainVolume").value, 100);
  $("mainVolumeValue").textContent = `${volume}%`;
  const next = await save({ mainVolume: volume });
  await applyVolumeToAllTabs(next);
});

$("refreshAudioTabs").addEventListener("click", () => refreshAudioTabs());

$("customizerColorToggle").addEventListener("click", () => toggleColorFilterControls());
$("customizerTextureToggle").addEventListener("click", () => toggleTextureControls());

attachSaveThemeButtonHandler();

$("customizerSavedThemesSelect").addEventListener("change", async () => {
  await applySelectedSavedTheme();
});

$(CUSTOMIZER_DELETE_LOCAL_THEME_BUTTON_ID)?.addEventListener("click", async (event) => {
  event.preventDefault();
  await deleteSelectedLocalTheme();
});

$("customizerReset").addEventListener("click", async () => {
  const next = await resetCustomizerForActivePage();
  await setSelectedStoredThemeForActivePage("");
  await applyCustomizer(next);
  await renderSavedThemesDropdown();
});

$("customizerStaticColorPicker").addEventListener("input", async () => {
  const color = String($("customizerStaticColorPicker").value || "");
  await saveAndApplyCustomizer({ customizerStaticColor: normalizeHexInput(color) });
});

$("customizerClearStaticColor").addEventListener("click", async (event) => {
  event.preventDefault();
  event.stopPropagation();
  await saveAndApplyCustomizer({ customizerStaticColor: "" });
});

$("customizerBlendMode").addEventListener("change", async () => {
  await saveAndApplyCustomizer({ customizerBlendMode: normalizeBlendMode($("customizerBlendMode").value) });
});

$("customizerTextureColorMode").addEventListener("change", async () => {
  await saveAndApplyCustomizer({ customizerTextureColorMode: normalizeTextureColorMode($("customizerTextureColorMode").value) });
});

$("customizerTextureIntensity").addEventListener("input", async () => {
  await saveAndApplyCustomizer({ customizerTextureIntensity: clampTextureIntensity($("customizerTextureIntensity").value) });
});

$("customizerTextureScale").addEventListener("input", async () => {
  await saveAndApplyCustomizer({ customizerTextureScale: clampTextureScale($("customizerTextureScale").value) });
});

$("customizerAnimateTexture").addEventListener("change", async () => {
  const enabled = $("customizerAnimateTexture").checked;
  const styleRow = $("customizerTextureAnimationStyleRow");
  const speedRow = $("customizerTextureAnimationSpeedRow");
  const styleSelect = $("customizerTextureAnimationStyle");
  if (!enabled && styleSelect) styleSelect.value = "no-animation";
  if (styleRow) styleRow.hidden = !enabled;
  if (speedRow) speedRow.hidden = !enabled || normalizeTextureAnimationStyle(styleSelect?.value) === "no-animation";
  await saveAndApplyCustomizer({
    customizerAnimateTexture: enabled,
    customizerTextureAnimationStyle: enabled ? normalizeTextureAnimationStyle(styleSelect?.value) : "no-animation"
  });
});

$("customizerTextureAnimationStyle").addEventListener("change", async () => {
  const style = normalizeTextureAnimationStyle($("customizerTextureAnimationStyle").value);
  const speedRow = $("customizerTextureAnimationSpeedRow");
  if (speedRow) speedRow.hidden = style === "no-animation";
  await saveAndApplyCustomizer({ customizerTextureAnimationStyle: style });
});

$("customizerTextureAnimationSpeed")?.addEventListener("input", async () => {
  await saveAndApplyCustomizer({ customizerTextureAnimationSpeed: clampTextureAnimationSpeed($("customizerTextureAnimationSpeed").value) });
});


$("customizerTextureFilterSelect").addEventListener("change", async () => {
  await addSelectedTextureFilter();
});

$("customizerAddTextureFilter").addEventListener("click", async () => {
  await addSelectedTextureFilter();
});

$("customizerTextureFilterList").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-texture-filter]");
  if (!button) return;

  const removeKey = String(button.dataset.textureFilter || "").trim().toLowerCase();
  const s = await getCustomizerSettingsForActivePage();
  const nextFilters = normalizeTextureFilters(s.customizerTextureFilters).filter((key) => key !== removeKey);
  await saveAndApplyCustomizer({ customizerTextureFilters: nextFilters });
});

$("customizerToggle").addEventListener("change", async () => {
  await saveAndApplyCustomizer({ customizerEnabled: $("customizerToggle").checked });
});

$("customizerIntensity").addEventListener("input", async () => {
  await saveAndApplyCustomizer({ customizerIntensity: Number($("customizerIntensity").value) });
});

$("customizerSpeed").addEventListener("input", async () => {
  await saveAndApplyCustomizer({ customizerSpeed: Number($("customizerSpeed").value) });
});

$("customizerInvert").addEventListener("change", async () => {
  await saveAndApplyCustomizer({ customizerInverted: $("customizerInvert").checked });
});

$("customizerCycleInvert").addEventListener("change", async () => {
  await saveAndApplyCustomizer({ customizerCycleInvert: $("customizerCycleInvert").checked });
});

$("customizerHueMonochrome").addEventListener("change", async () => {
  await saveAndApplyCustomizer({ customizerHueMonochrome: $("customizerHueMonochrome").checked });
});


$("favoritesToggle").addEventListener("click", async () => {
  const s = await chrome.storage.local.get(DEFAULTS);
  await save({ favoritesEnabled: !s.favoritesEnabled });
});

$("favoritesRefresh").addEventListener("click", async () => {
  const s = await chrome.storage.local.get(DEFAULTS);
  await chrome.storage.local.set({ ...s, favoritesMenuRefreshNonce: Date.now() });
  window.close();
});

$("favoritesOpenNewTab").addEventListener("change", async () => {
  await save({ favoritesOpenInNewTab: $("favoritesOpenNewTab").checked });
});

$("favoritesIncludeFolders").addEventListener("change", async () => {
  await save({ favoritesIncludeFolders: $("favoritesIncludeFolders").checked });
});

$("favoritesMaxItems").addEventListener("input", async () => {
  await save({ favoritesMaxItems: Number($("favoritesMaxItems").value) });
});

$("readerToggle").addEventListener("click", async () => {
  const s = await chrome.storage.local.get(DEFAULTS);
  await save({ readerEnabled: !s.readerEnabled });
});

$("readerVoice").addEventListener("change", async () => {
  await save({ readerVoice: $("readerVoice").value });
});

$("readerRate").addEventListener("input", async () => {
  await save({ readerRate: Number($("readerRate").value) });
});

$("readerPitch").addEventListener("input", async () => {
  await save({ readerPitch: Number($("readerPitch").value) });
});

$("readerHighlightWords").addEventListener("change", async () => {
  await save({ readerHighlightWords: $("readerHighlightWords").checked });
});

$("readerPlay").addEventListener("click", () => sendReader("speak-selection"));
$("readerSpeakSelection").addEventListener("click", () => sendReader("speak-selection"));
$("readerStop").addEventListener("click", () => sendReader("stop"));

init();
