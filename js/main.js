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
import { initScanlines } from "./scanlines.js";

/**
 * Dynamically loads header.html into #header-placeholder
 * and reinitializes header-dependent scripts AFTER it's inserted.
 */
async function loadHeader() {
  try {
    const res = await fetch(`/header.html?cacheBust=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const placeholder = document.getElementById("header-placeholder");
    if (!placeholder) {
      console.warn("⚠️ #header-placeholder not found in DOM.");
      return;
    }

    placeholder.innerHTML = html;

    // Ensure header.css loads only once
    if (!document.querySelector('link[href="/css/header.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/css/header.css";
      document.head.appendChild(link);
    }

    // Wait for layout reflow before initializing scripts
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Initialize dependent modules
    safeInit("Menu", initMenu);
    safeInit("Contact", initContact);

    console.log("✅ Header loaded and initialized successfully");
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
    const res = await fetch(`/footer.html?cacheBust=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const placeholder = document.getElementById("footer-placeholder");
    if (!placeholder) {
      console.warn("⚠️ #footer-placeholder not found in DOM.");
      return;
    }

    placeholder.innerHTML = html;

    if (!document.querySelector('link[href="/css/footer.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/css/footer.css";
      document.head.appendChild(link);
    }

    console.log("✅ Footer loaded successfully");
  } catch (err) {
    console.error("❌ Failed to load footer:", err);
  }
}

/**
 * Safe function initializer wrapper
 */
function safeInit(label, fn) {
  try {
    fn?.();
    console.log(`✅ ${label} initialized`);
  } catch (e) {
    console.error(`❌ ${label} failed:`, e);
  }
}

/**
 * Main site initialization — executed once DOM is ready.
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.groupCollapsed("🌐 Site Initialization");

  // 1️⃣ Load header
  await loadHeader();

  // 2️⃣ Load main content (posts, videos) and search
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
  safeInit("Scanlines", initScanlines);

  // 4️⃣ Load footer
  await loadFooter();

  console.groupEnd();
});
