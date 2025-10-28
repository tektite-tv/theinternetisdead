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
import { initScanlines } from "./scanlines.js"; // 👈 New import

/**
 * Dynamically loads header.html into #header-placeholder
 * and reinitializes header-dependent scripts AFTER it's inserted.
 */
async function loadHeader() {
  try {
    const res = await fetch("/header.html");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const placeholder = document.getElementById("header-placeholder");
    if (!placeholder) {
      console.warn("⚠️ #header-placeholder not found in DOM.");
      return;
    }

    placeholder.innerHTML = html;

    // Load header.css dynamically if it exists
    if (!document.querySelector('link[href="/header.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/header.css";
      document.head.appendChild(link);
    }

    await new Promise((resolve) => requestAnimationFrame(resolve));

    initMenu();
    initContact();

    console.log("✅ Header loaded and menu/contact initialized");
  } catch (err) {
    console.error("❌ Failed to load header:", err);
  }
}

/**
 * Dynamically loads footer.html into #footer-placeholder
 * and ensures footer.css is linked.
 */
async function loadFooter() {
  try {
    const res = await fetch("/footer.html");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const placeholder = document.getElementById("footer-placeholder");
    if (!placeholder) {
      console.warn("⚠️ #footer-placeholder not found in DOM.");
      return;
    }

    placeholder.innerHTML = html;

    // Load footer.css dynamically if it exists
    if (!document.querySelector('link[href="/footer.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/footer.css";
      document.head.appendChild(link);
    }

    console.log("✅ Footer loaded successfully");
  } catch (err) {
    console.error("❌ Failed to load footer:", err);
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

  // 1️⃣ Load the site header
  await loadHeader();

  // 2️⃣ Load content (posts + videos) and search index
  try {
    await Promise.all([loadPosts(), loadVideos()]);
    await buildIndex();
    initSearch();
    console.log("✅ Search initialized after index build");
  } catch (err) {
    console.error("❌ Failed loading posts/videos or building index:", err);
  }

  // 3️⃣ Initialize UI components
  safeInit("Lightbox", initLightbox);
  safeInit("Post Popup", initPostPopup);

  // 4️⃣ Initialize background scanline overlay
  safeInit("Scanlines", initScanlines);

  // 5️⃣ Load footer last
  await loadFooter();

  console.groupEnd();
});
