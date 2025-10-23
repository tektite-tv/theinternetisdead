export function initLightbox() {
  if (document.getElementById("img-lightbox")) return; // already exists

  const lightbox = document.createElement("div");
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

  const lightImg = lightbox.querySelector("img");
  const filenameEl = lightbox.querySelector(".filename");
  const dlBtn = lightbox.querySelector(".download-btn");
  const closeBtn = lightbox.querySelector(".close-x");

  // Open on image click
  document.body.addEventListener("click", e => {
    const img = e.target.closest("img");
    if (!img || img.classList.contains("no-lightbox")) return;
    lightImg.src = img.src;
    dlBtn.href = img.src;
    filenameEl.textContent = img.src.split("/").pop() || "";
    lightbox.classList.add("visible");
  });

  // Close handlers
  const closeLightbox = () => lightbox.classList.remove("visible");
  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeLightbox();
  });
}
