export function initPostPopup() {
  // If popup already exists, skip duplicate setup
  if (document.getElementById("post-popup")) return;

  // Create popup container
  const popup = document.createElement("div");
  popup.id = "post-popup";
  popup.innerHTML = `
    <div class="popup-inner">
      <button class="close-btn">×</button>
      <div class="content"><em>Loading...</em></div>
    </div>
  `;
  document.body.appendChild(popup);

  const closeBtn = popup.querySelector(".close-btn");
  const content = popup.querySelector(".content");

  // Close popup on click or Escape
  const closePopup = () => {
    popup.style.display = "none";
    content.innerHTML = "<em>Loading...</em>";
  };
  closeBtn.addEventListener("click", closePopup);
  popup.addEventListener("click", e => {
    if (e.target === popup) closePopup();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closePopup();
  });

  // Listen for search-result clicks
  document.addEventListener("click", async e => {
    const result = e.target.closest(".search-result");
    if (!result) return;

    const url = result.dataset.url;
    const kind = result.dataset.kind;

    // Videos open normally
    if (kind === "video") {
      window.open(url, "_blank");
      return;
    }

    // Only handle posts (Markdown files)
    if (kind === "post" && url.endsWith(".md")) {
      try {
        const res = await fetch(url);
        let text = await res.text();
        if (text.startsWith("---")) {
          const end = text.indexOf("---", 3);
          if (end !== -1) text = text.slice(end + 3);
        }
        if (!window.marked) {
          console.error("Marked library not loaded");
          content.innerHTML = "<p style='color:red;'>Markdown parser missing.</p>";
        } else {
          content.innerHTML = window.marked.parse(text.trim());
        }
        popup.style.display = "flex";
      } catch (err) {
        content.innerHTML = `<p style="color:red;">Error loading post: ${err.message}</p>`;
        popup.style.display = "flex";
      }
    }
  });
}
