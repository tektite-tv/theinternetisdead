export function initLightbox() {
  const postsContainer = document.getElementById("posts");
  if (!postsContainer) return;

  // Create lightbox if it doesn’t exist
  let lightbox = document.getElementById("img-lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "img-lightbox";
    lightbox.innerHTML = `
      <div class="inner">
        <div class="toolbar">
          <a class="download-btn" target="_blank" download>Download</a>
          <div class="close-x">×</div>
        </div>
        <img src="" alt="Expanded image">
        <div class="filename" style="color:#0f0;text-align:center;font-family:monospace;margin-top:8px;"></div>
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  const lightImg = lightbox.querySelector("img");
  const filenameEl = lightbox.querySelector(".filename");
  const dlBtn = lightbox.querySelector(".download-btn");
  const closeBtn = lightbox.querySelector(".close-x");

  const closeLightbox = () => lightbox.classList.remove("visible");

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeLightbox();
  });

  // Observe the posts container only
  const observer = new MutationObserver(() => {
    const imgs = postsContainer.querySelectorAll("img:not([data-lb-ready])");
    imgs.forEach(img => {
      img.dataset.lbReady = "true";
      img.addEventListener("click", () => {
        lightImg.src = img.src;
        dlBtn.href = img.src;
        filenameEl.textContent = img.src.split("/").pop() || "";
        lightbox.classList.add("visible");
      });
    });
  });

  // Observe changes within posts
  observer.observe(postsContainer, { childList: true, subtree: true });

  // Also run once initially
  const initialImgs = postsContainer.querySelectorAll("img");
  initialImgs.forEach(img => {
    img.dataset.lbReady = "true";
    img.addEventListener("click", () => {
      lightImg.src = img.src;
      dlBtn.href = img.src;
      filenameEl.textContent = img.src.split("/").pop() || "";
      lightbox.classList.add("visible");
    });
  });
}
