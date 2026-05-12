const ROOT_ID = "tektite-suite-favorites-root";
const OPEN_BOOKMARK_PREFIX = "suite-open-bookmark:";
const OPEN_FOLDER_PREFIX = "suite-open-folder:";
const REFRESH_ID = "suite-refresh-favorites";
const EMPTY_ID = "suite-empty-favorites";

const DEFAULTS = {
  favoritesEnabled: true,
  favoritesOpenInNewTab: true,
  favoritesIncludeFolders: true,
  favoritesMaxItems: 80
};

let bookmarkUrlByMenuId = new Map();
let rebuildTimer = null;
let rebuildInProgress = false;
let rebuildRequestedAgain = false;

async function getSettings() {
  return chrome.storage.local.get(DEFAULTS);
}

function safeMenuId(prefix, id) {
  return `${prefix}${String(id).replace(/[^a-zA-Z0-9_:-]/g, "_")}`;
}

function truncateTitle(title, fallback = "Untitled") {
  const text = String(title || fallback).trim() || fallback;
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

function createContextMenu(props) {
  return new Promise((resolve) => {
    chrome.contextMenus.create(props, () => {
      // Swallow duplicate/creation errors so the service worker doesn't keep screaming in Edge's error page.
      // The next queued rebuild will clean up the state anyway.
      void chrome.runtime.lastError;
      resolve();
    });
  });
}

function removeAllContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      void chrome.runtime.lastError;
      resolve();
    });
  });
}

async function findFavoritesBarNode() {
  const tree = await chrome.bookmarks.getTree();
  const root = tree?.[0];
  if (!root?.children?.length) return null;

  const likely = root.children.find((node) => {
    const title = String(node.title || "").toLowerCase();
    return title.includes("bookmarks bar") || title.includes("favorites bar") || title.includes("favourites bar");
  });

  return likely || root.children[0] || null;
}

function flattenBookmarks(nodes, output = []) {
  for (const node of nodes || []) {
    if (node.url) output.push(node);
    else if (node.children?.length) flattenBookmarks(node.children, output);
  }
  return output;
}

async function createBookmarkItem(node, parentId, index) {
  const menuId = safeMenuId(OPEN_BOOKMARK_PREFIX, `${node.id}-${index}`);
  bookmarkUrlByMenuId.set(menuId, node.url);

  await createContextMenu({
    id: menuId,
    parentId,
    title: truncateTitle(node.title, node.url),
    contexts: ["page", "selection", "link", "image", "video", "audio"]
  });
}

async function createFolderMenu(node, parentId, settings, counter) {
  const folderId = safeMenuId(OPEN_FOLDER_PREFIX, node.id);

  await createContextMenu({
    id: folderId,
    parentId,
    title: `📁 ${truncateTitle(node.title, "Folder")}`,
    contexts: ["page", "selection", "link", "image", "video", "audio"]
  });

  for (const child of node.children || []) {
    if (counter.count >= Number(settings.favoritesMaxItems || 80)) return;

    if (child.url) {
      counter.count += 1;
      await createBookmarkItem(child, folderId, counter.count);
    } else if (child.children?.length && settings.favoritesIncludeFolders) {
      await createFolderMenu(child, folderId, settings, counter);
    }
  }
}

async function rebuildMenusNow() {
  if (rebuildInProgress) {
    rebuildRequestedAgain = true;
    return;
  }

  rebuildInProgress = true;

  try {
    bookmarkUrlByMenuId = new Map();
    await removeAllContextMenus();

    const settings = await getSettings();
    if (!settings.favoritesEnabled) return;

    await createContextMenu({
      id: ROOT_ID,
      title: "theinternetisdead Favorites",
      contexts: ["page", "selection", "link", "image", "video", "audio"]
    });

    const bar = await findFavoritesBarNode();

    if (!bar || !bar.children?.length) {
      await createContextMenu({
        id: EMPTY_ID,
        parentId: ROOT_ID,
        title: "Favorites bar is empty",
        enabled: false,
        contexts: ["page", "selection", "link", "image", "video", "audio"]
      });
      return;
    }

    const counter = { count: 0 };
    const maxItems = Number(settings.favoritesMaxItems || 80);

    for (const child of bar.children) {
      if (counter.count >= maxItems) break;

      if (child.url) {
        counter.count += 1;
        await createBookmarkItem(child, ROOT_ID, counter.count);
      } else if (child.children?.length && settings.favoritesIncludeFolders) {
        await createFolderMenu(child, ROOT_ID, settings, counter);
      } else if (child.children?.length && !settings.favoritesIncludeFolders) {
        const flattened = flattenBookmarks(child.children);
        for (const bookmark of flattened) {
          if (counter.count >= maxItems) break;
          counter.count += 1;
          await createBookmarkItem(bookmark, ROOT_ID, counter.count);
        }
      }
    }

    await createContextMenu({
      id: REFRESH_ID,
      parentId: ROOT_ID,
      title: "↻ Refresh favorites menu",
      contexts: ["page", "selection", "link", "image", "video", "audio"]
    });
  } finally {
    rebuildInProgress = false;

    if (rebuildRequestedAgain) {
      rebuildRequestedAgain = false;
      scheduleRebuildMenus(250);
    }
  }
}

function scheduleRebuildMenus(delay = 250) {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    rebuildMenusNow().catch(() => {});
  }, delay);
}

async function openUrl(url) {
  if (!url) return;

  const settings = await getSettings();

  if (settings.favoritesOpenInNewTab) {
    await chrome.tabs.create({ url, active: true });
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) await chrome.tabs.update(tab.id, { url });
  else await chrome.tabs.create({ url, active: true });
}

chrome.contextMenus.onClicked.addListener((info) => {
  const id = String(info.menuItemId || "");
  if (id === REFRESH_ID) {
    scheduleRebuildMenus(0);
    return;
  }

  const url = bookmarkUrlByMenuId.get(id);
  if (url) openUrl(url);
});

chrome.runtime.onInstalled.addListener(() => scheduleRebuildMenus(0));
chrome.runtime.onStartup.addListener(() => scheduleRebuildMenus(0));

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") scheduleRebuildMenus(300);
});

chrome.bookmarks.onCreated.addListener(() => scheduleRebuildMenus(300));
chrome.bookmarks.onRemoved.addListener(() => scheduleRebuildMenus(300));
chrome.bookmarks.onChanged.addListener(() => scheduleRebuildMenus(300));
chrome.bookmarks.onMoved.addListener(() => scheduleRebuildMenus(300));
chrome.bookmarks.onChildrenReordered.addListener(() => scheduleRebuildMenus(300));

scheduleRebuildMenus(0);
