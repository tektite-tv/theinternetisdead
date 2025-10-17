// /assets/js/main.js
import { loadPosts } from "./posts.js";
import { loadVideos } from "./videos.js";
import { setupSearch } from "./search.js";
import { activateLightbox } from "./lightbox.js";
import "./commands.js";
import "./eastereggs.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Temple booting...");
  await loadPosts();
  await loadVideos();
  activateLightbox();
  setupSearch();
});
