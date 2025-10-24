// /js/main.js
// Master site initialization: coordinates all modules in proper order.

import { loadPosts } from "./posts.js";
import { loadVideos } from "./videos.js";
import { buildIndex } from "./indexBuilder.js";
import { initSearch } from "./search.js";
import { initContact } from "./contact.js";
import { initMenu } from "./menu.js";
import { initLightbox } from "./lightbox.js";
import { initPostPopup } from "./postPopup.js";

/**
 * Dynamically loads header.html into #header-placeholder
 * and reinitializes header-dependent scripts AFTER it's inserted.
 */
async function loadHeader() {
  try {
    const res = await fetch("/pages/sections/header.html");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const placeholder = document.getElementById("header-placeholder");
    if (!placeholder) {
      console.warn("⚠️ #header-placeholder not found in DOM.");
      return;
    }

    // Inject header into page
    placeholder.innerHTML = html;

    // Wait one frame for DOM paint before initializing dependent scripts
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Initialize header-level scripts
    initMenu();
    initContact();

    console.log("✅ Header loaded and menu/contact initialized");
  } catch (err) {
    console.error("❌ Failed to load header:", err);
  }
}

/**
 * Utility wrapper for safer function initialization
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
 * Main site initialization — executed once DOM is ready.
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.groupCollapsed("🌐 Site Initialization");

  // 1️⃣ Load the site header (needed before initializing menu/contact)
  await loadHeader();

  // 2️⃣ Build the content index for search + posts
  try {
    // Load posts and videos in parallel
    await Promise.all([loadPosts(), loadVideos()]);

    // Build search index and expose as window.INDEX
    await buildIndex();

    // Initialize the search AFTER index is ready
    initSearch();
    console.log("✅ Search initialized after index build");
  } catch (err) {
    console.error("❌ Failed loading posts/videos or building index:", err);
  }

  // 3️⃣ Initialize auxiliary UI components
  safeInit("Lightbox", initLightbox);
  safeInit("Post Popup", initPostPopup);

  console.groupEnd();
});
