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

    // Insert header HTML
    placeholder.innerHTML = html;

    // Wait one frame for DOM paint
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Initialize header scripts AFTER header exists
    initMenu();
    initContact();
    initSearch();
    console.log("✅ Header loaded and header scripts initialized");
  } catch (err) {
    console.error("❌ Failed to load header:", err);
  }
}

/**
 * Wrapper for safe initialization logging
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

  // 1️⃣ Load header before dependent scripts
  await loadHeader();

  // 2️⃣ Load site content
  try {
    await Promise.all([loadPosts(), loadVideos()]);
    buildIndex();
  } catch (err) {
    console.error("❌ Failed loading posts/videos:", err);
  }

  // 3️⃣ Initialize independent UI components
  safeInit("Lightbox", initLightbox);
  safeInit("Post Popup", initPostPopup);

  console.groupEnd();
});
