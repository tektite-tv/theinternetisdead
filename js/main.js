import { loadPosts } from "./posts.js";
import { loadVideos } from "./videos.js";
import { buildIndex } from "./indexBuilder.js";
import { initSearch } from "./search.js";
import { initContact } from "./contact.js";
import { initMenu } from "./menu.js";
import { initLightbox } from "./lightbox.js";
import { initPostPopup } from "./postPopup.js";

document.addEventListener("DOMContentLoaded", async () => {
  await loadPosts();
  await loadVideos();
  await buildIndex();
  initSearch();
  initContact();
  initMenu();
  initLightbox();
  initPostPopup();
});
