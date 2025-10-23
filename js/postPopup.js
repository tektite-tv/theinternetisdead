export function initPostPopup() {
  // Create popup container if it doesn't exist
  if (document.getElementById("post-popup")) return;

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

  // Listen for custom search event
  document.addEventListener("openPostPopup", async e => {
    const url = e.detail.url;
    if (!url || !url.endsWith(".md")) return;

    try {
      const res = await fetch(url);
      let text = await res.text();
      if (text.startsWith("---")) {
        const end = text.indexOf("---", 3);
        if (end !== -1) text = text.slice(end + 3);
      }

      if (!window.marked) {
        console.error("Marked.js not loaded");
        content.innerHTML = "<p style='color:red;'>Markdown parser not available.</p>";
      } else {
        content.innerHTML = window.marked.parse(text.trim());
      }

      popup.style.display = "flex";
    } catch (err) {
      content.innerHTML = `<p style="color:red;">Error loading post: ${err.message}</p>`;
      popup.style.display = "flex";
    }
  });
}
