export function initPostPopup() {
  if (document.getElementById("post-popup")) {
    return;
  }

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

  closeBtn.addEventListener("click", () => popup.style.display = "none");
  popup.addEventListener("click", e => {
    if (e.target === popup) popup.style.display = "none";
  });

  // Event: open when search result clicked
  document.addEventListener("click", async e => {
    const result = e.target.closest(".search-result");
    if (!result) return;

    const url = result.dataset.url || result.getAttribute("data-url");
    if (!url || !url.endsWith(".md")) return;

    try {
      const res = await fetch(url);
      let text = await res.text();
      if (text.startsWith("---")) {
        const end = text.indexOf("---", 3);
        if (end !== -1) text = text.slice(end + 3);
      }
      content.innerHTML = window.marked.parse(text.trim());
      popup.style.display = "flex";
    } catch (err) {
      content.innerHTML = `<p style="color:red;">Error loading post: ${err.message}</p>`;
      popup.style.display = "flex";
    }
  });
}
