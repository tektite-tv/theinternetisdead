import { loadPosts } from "./posts.js";
import { loadVideos } from "./videos.js";
import { buildIndex } from "./indexBuilder.js";
import { initSearch } from "./search.js";
import { initContact } from "./contact.js";
import { initMenu } from "./menu.js";
import { initLightbox } from "./lightbox.js";
import { initPostPopup } from "./postPopup.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.groupCollapsed("🌐 Site initialization");

  const safeInit = (label, fn) => {
    try {
      fn?.();
      console.log(`✅ ${label} initialized`);
    } catch (e) {
      console.error(`❌ ${label} failed:`, e);
    }
  };

  // Always initialize the menu (was previously desktop-only)
  safeInit("Menu", initMenu);

  safeInit("Search", initSearch);
  safeInit("Contact", initContact);
  safeInit("Lightbox", initLightbox);
  safeInit("Post Popup", initPostPopup);

  try {
    await Promise.all([loadPosts(), loadVideos()]);
    buildIndex();
  } catch (e) {
    console.error("❌ Failed loading posts/videos:", e);
  }

  console.groupEnd();
});
