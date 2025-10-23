import { loadPosts } from "./posts.js";
import { loadVideos } from "./videos.js";
import { buildIndex } from "./indexBuilder.js";
import { initSearch } from "./search.js";
import { initContact } from "./contact.js";
import { initMenu } from "./menu.js";
import { initLightbox } from "./lightbox.js";
import { initPostPopup } from "./postPopup.js";

/**
 * Master site initializer
 * Handles async loading, UI setup, and defensive checks
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.groupCollapsed("🌐 Site initialization");

  // === PHASE 1: Load dynamic content ===
  try {
    await Promise.all([loadPosts(), loadVideos(), buildIndex()]);
    console.log("✅ Content loading complete (posts, videos, index).");
  } catch (err) {
    console.error("❌ Error while loading content:", err);
  }

  // === PHASE 2: Initialize UI components ===
  try {
    safeInit("Search", initSearch);
    safeInit("Contact", initContact);
    safeInit("Menu", initMenu);
    safeInit("Lightbox", initLightbox);
    safeInit("PostPopup", initPostPopup);
    console.log("✅ All UI modules initialized successfully.");
  } catch (err) {
    console.error("❌ Error during module initialization:", err);
  }

  console.groupEnd();
});

/**
 * Helper function to initialize modules safely
 */
function safeInit(name, fn) {
  try {
    if (typeof fn === "function") {
      fn();
      console.log(`🧩 ${name} initialized.`);
    } else {
      console.warn(`⚠️ ${name} init skipped (not a function).`);
    }
  } catch (e) {
    console.error(`❌ ${name} init failed:`, e);
  }
}

// === OPTIONAL: global error catcher for uncaught rejections ===
window.addEventListener("unhandledrejection", (e) => {
  console.error("🚨 Unhandled promise rejection:", e.reason);
});
