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
 * and reinitializes header-dependent scripts.
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

    placeholder.innerHTML = html;

    // Wait for paint before attaching listeners
    requestAnimationFrame(() => {
      try {
        initMenu();
        initContact();
        initSearch();
        console.log("✅ Header loaded and all header scripts initialized");
      } catch (err) {
        console.error("❌ Header script init failed:", err);
      }
    });
  } catch (err) {
    console.error("❌ Failed to load header:", err);
  }
}

/**
 * Wrap any init function safely
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

  // 1️⃣ Load header before anything dependent on it
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
