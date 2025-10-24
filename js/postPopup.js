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
const openPostPopup = (slug) => {
  try {
    const post = window.INDEX?.find(p => p.file === slug || p.url === slug);
    if (!post) throw new Error("Post not found");

    const cleanContent = post.content
  // remove YAML-style metadata lines
  .replace(/^title:.*$/m, "")
  .replace(/^date:.*$/m, "")
  .trim();

const formattedDate = new Date(post.date).toLocaleString(undefined, {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

content.innerHTML = `
  <article class="popup-post">
    <h2>${post.title}</h2>
    <small class="post-date">${formattedDate}</small>
    <div class="post-body">${marked.parse(cleanContent)}</div>
  </article>
`;
    
  } catch (err) {
    content.innerHTML = `<p style="color:#f66;">Error loading post: ${err.message}</p>`;
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
