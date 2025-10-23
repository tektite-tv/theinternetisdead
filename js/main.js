import { loadPosts } from "./posts.js";
import { loadVideos } from "./videos.js";
import { buildIndex } from "./indexBuilder.js";
import { initSearch } from "./search.js";
import { initContact } from "./contact.js";
import { initMenu } from "./menu.js";
import { initLightbox } from "./lightbox.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Initializing site modules...");

  try {
    await loadPosts();
    await loadVideos();
    await buildIndex();
  } catch (err) {
    console.error("Error during async loading:", err);
  }

  // Initialize interactive modules after content loads
  initSearch();
  initContact();
  initMenu();
  initLightbox();

  console.log("All modules initialized successfully.");
});
