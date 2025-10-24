import { loadPosts } from "./posts.js";
import { loadVideos } from "./videos.js";
import { buildIndex } from "./indexBuilder.js";
import { initSearch } from "./search.js";
import { initContact } from "./contact.js";
import { initMenu } from "./menu.js";
import { initLightbox } from "./lightbox.js";
import { initPostPopup } from "./postPopup.js";

/**
 * Dynamically loads the header.html partial into the page
 * and re-initializes interactive header scripts.
 */
async function loadHeader() {
  try {
    const res = await fetch("/pages/sections/header.html");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const placeholder = document.getElementById("header-placeholder");
    if (placeholder) {
      placeholder.innerHTML = html;

      // Reinitialize scripts that depend on the header being present
      initMenu();
      initSearch();
      initContact();
      console.log("✅ Header loaded and initialized");
    } else {
      console.warn("⚠️ No #header-placeholder found in DOM.");
    }
  } catch (err) {
    console.error("❌ Failed to load header:", err);
  }
}

/**
 * Safely initialize a function and log its result
 */
const safeInit = (label, fn) => {
  try {
    fn?.();
    console.log(`✅ ${label} initialized`);
  } catch (e) {
    console.error(`❌ ${label} failed:`, e);
  }
};

/**
 * Master site initialization
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.groupCollapsed("🌐 Site Initialization");

  // 1️⃣ Load the header first (then scripts that depend on it)
  await loadHeader();

  // 2️⃣ Load dynamic site content
  try {
    await Promise.all([loadPosts(), loadVideos()]);
    buildIndex();
  } catch (e) {
    console.error("❌ Failed loading posts/videos:", e);
  }

  // 3️⃣ Initialize site-wide features
  safeInit("Lightbox", initLightbox);
  safeInit("Post Popup", initPostPopup);

  console.groupEnd();
});
