import { loadPosts } from "./posts.js";
import { loadVideos } from "./videos.js";
import { buildIndex } from "./indexBuilder.js";
import { initSearch } from "./search.js";
import { initContact } from "./contact.js";
import { initMenu } from "./menu.js";

document.addEventListener("DOMContentLoaded", async () => {
  await loadPosts();
  await loadVideos();
  await buildIndex();
  initSearch();
  initContact();
  initMenu();
});
