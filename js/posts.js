// Load Marked globally (UMD build)
import "https://cdn.jsdelivr.net/npm/marked/marked.min.js";

export async function loadPosts() {
  const postsContainer = document.getElementById("posts");
  let allPosts = [];

  try {
    const res = await fetch("/_posts/index.json");
    allPosts = await res.json();
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderPosts(allPosts);
  } catch (err) {
    postsContainer.innerHTML = `<p style="color:red;">Error loading posts: ${err.message}</p>`;
  }
}

function renderPosts(posts) {
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = `
    <h1 style="color:#00ff99;">🌀 The Daily Spiral</h1>
    <h2>Latest Blog Posts</h2>
  `;

  const visiblePosts = posts.slice(0, 3);
  for (const p of visiblePosts) {
    const wrapper = document.createElement("div");
    wrapper.className = "post";
    wrapper.innerHTML = `
      <h3>${p.title}</h3>
      <small>${new Date(p.date).toLocaleString()}</small>
      ${p.image ? `<img src="${p.image}" alt="${p.title}" class="post-img" />` : ""}
      <div class="content"><em>Loading...</em></div>
    `;
    postsContainer.appendChild(wrapper);

    fetch(p.file)
      .then(r => r.text())
      .then(text => {
        // strip front-matter if present
        if (text.startsWith('---')) {
          const end = text.indexOf('---', 3);
          if (end !== -1) text = text.slice(end + 3);
        }
        // use global marked
        wrapper.querySelector(".content").innerHTML = window.marked.parse(text.trim());
      })
      .catch(() => {
        wrapper.querySelector(".content").innerHTML = "<em>Unable to load post content.</em>";
      });
  }
}
