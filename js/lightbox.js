// lightbox.js — matches /css/components/popups.css

export function initLightbox() {
  const postsContainer = document.getElementById("posts");
  if (!postsContainer) return;

  // Get or create the lightbox container
  let lightbox = document.getElementById("img-lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "img-lightbox";
    lightbox.innerHTML = `
      <div class="inner">
        <button class="close-x" aria-label="Close">✕</button>
        <img src="" alt="">
        <div class="toolbar">
          <span class="filename"></span>
          <a class="download-btn" href="" download>Download</a>
        </div>
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  const lightImg = lightbox.querySelector("img");
  const filenameEl = lightbox.querySelector(".filename");
  const dlBtn = lightbox.querySelector(".download-btn");
  const closeBtn = lightbox.querySelector(".close-x");

  // --- Functions ---
  const openLightbox = src => {
    lightImg.src = src;
    dlBtn.href = src;
    filenameEl.textContent = src.split("/").pop() || "";
    lightbox.style.display = "flex";
  };

  const closeLightbox = () => {
    lightbox.style.display = "none";
    lightImg.src = "";
  };

  // --- Event listeners ---
  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeLightbox();
  });

  // --- Observe posts and attach click handlers dynamically ---
  const attachLightbox = img => {
    if (img.dataset.lbReady) return;
    img.dataset.lbReady = "true";
    img.addEventListener("click", () => openLightbox(img.src));
  };

  // Observe posts for dynamically added images
  const observer = new MutationObserver(() => {
    postsContainer.querySelectorAll("img:not([data-lb-ready])").forEach(attachLightbox);
  });
  observer.observe(postsContainer, { childList: true, subtree: true });

  // Attach to existing images on load
  postsContainer.querySelectorAll("img").forEach(attachLightbox);

  console.log("Lightbox initialized and synced with CSS.");
}
