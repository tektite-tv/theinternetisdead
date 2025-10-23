import { loadPosts } from "./posts.js";
import { loadVideos } from "./videos.js";
import { buildIndex } from "./indexBuilder.js";
import { initSearch } from "./search.js";
import { initContact } from "./contact.js"; // keep only ONE import
import { initMenu } from "./menu.js";
import { initLightbox } from "./lightbox.js";
import { initPostPopup } from "./postPopup.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Initializing site modules...");

  try {
    // Load core dynamic content first
    await loadPosts();
    await loadVideos();
    await buildIndex();
    console.log("Content loading complete.");
  } catch (err) {
    console.error("Error during async loading:", err);
  }

  try {
    // Initialize all interactive modules
    initSearch();
    initContact();
    initMenu();
    initLightbox();
    initPostPopup();
    console.log("All modules initialized successfully.");
  } catch (err) {
    console.error("Error during module initialization:", err);
  }
});
