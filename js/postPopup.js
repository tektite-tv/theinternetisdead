// postPopup.js — dedicated popup for blog posts

export function initPostPopup() {
  // Create the popup container once
  let postPopup = document.getElementById("post-popup");
  if (!postPopup) {
    postPopup = document.createElement("div");
    postPopup.id = "post-popup";
    postPopup.innerHTML = `
      <div class="post-popup-inner">
        <button class="close-x" aria-label="Close">✕</button>
        <div class="post-content">Loading...</div>
      </div>
    `;
    document.body.appendChild(postPopup);
  }

  const closeBtn = postPopup.querySelector(".close-x");
  const content = postPopup.querySelector(".post-content");

  // --- Open popup ---
  const openPostPopup = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      content.innerHTML = text;
    } catch (err) {
      content.innerHTML = `<p style="color:#f66;">Error loading post: ${err.message}</p>`;
      console.error("Post popup error:", err);
    }
    postPopup.style.display = "flex";
  };

  // --- Close popup ---
  const closePopup = () => {
    postPopup.style.display = "none";
    content.innerHTML = "";
  };

  closeBtn.addEventListener("click", closePopup);
  postPopup.addEventListener("click", e => {
    if (e.target === postPopup) closePopup();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closePopup();
  });

  // --- Listen for events from search.js ---
  document.addEventListener("openPostPopup", e => openPostPopup(e.detail.url));

  console.log("Post popup initialized.");
}
