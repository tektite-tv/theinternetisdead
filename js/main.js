// ===========================================================
// MAIN.JS – Master Site Initializer
// ===========================================================

// Import all feature modules
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

  // === PHASE 1: Load dynamic content (posts, videos, index)
  try {
    await Promise.all([loadPosts(), loadVideos(), buildIndex()]);
    console.log("✅ Content loading complete (posts, videos, index).");
  } catch (err) {
    console.error("❌ Error while loading content:", err);
  }

  // === PHASE 2: Initialize UI components
  try {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    // Always-safe modules (work everywhere)
    safeInit("Search", initSearch);
    safeInit("Contact", initContact);
    safeInit("PostPopup", initPostPopup);

    // Desktop-only modules (skip if mobile)
    if (!isMobile) {
      safeInit("Menu", initMenu);
      safeInit("Lightbox", initLightbox);
    }

    console.log(
      `✅ UI modules initialized (mode: ${isMobile ? "mobile" : "desktop"})`
    );
  } catch (err) {
    console.error("❌ Error during module initialization:", err);
  }

  // === PHASE 3: Event & Resize handling
  try {
    window.addEventListener("resize", handleResize);
  } catch (err) {
    console.error("⚠️ Resize listener failed:", err);
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

/**
 * Handle responsive changes gracefully
 */
function handleResize() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  // Prevent re-running desktop initializers on mobile resize
  if (isMobile) {
    document.body.classList.add("mobile-mode");
    document.body.classList.remove("desktop-mode");
  } else {
    document.body.classList.add("desktop-mode");
    document.body.classList.remove("mobile-mode");
  }
  console.log(`📱 Resize detected: ${isMobile ? "mobile" : "desktop"} mode`);
}

/**
 * Global error catcher for unhandled promise rejections
 */
window.addEventListener("unhandledrejection", (e) => {
  console.error("🚨 Unhandled promise rejection:", e.reason);
});
