// Load Marked globally (UMD build)
import "../js/lib/marked.min.js";

export async function loadPosts() {
  const postsContainer = document.getElementById("posts");
  if (!postsContainer) return;

  let allPosts = [];
  try {
    console.log("Fetching posts...");
    const res = await fetch("/_posts/index.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allPosts = await res.json();
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderPosts(allPosts);
  } catch (err) {
    postsContainer.innerHTML = `<p style="color:red;">Error loading posts: ${err.message}</p>`;
  }
}

function renderPosts(posts) {
  const postsContainer = document.getElementById("posts");

  // Initial render header only once
  if (!postsContainer.dataset.rendered) {
    postsContainer.innerHTML = `
      <h1 style="color:#00ff99;">🌀 The Daily Spiral</h1>
      <h2>Latest Blog Posts</h2>
    `;
    postsContainer.dataset.rendered = "true";
    postsContainer.dataset.visible = "0";
  }

  // Determine next batch
  let visibleCount = parseInt(postsContainer.dataset.visible || "0");
  const nextBatch = posts.slice(visibleCount, visibleCount + 3);

  // Append new posts
  nextBatch.forEach(p => {
    const wrapper = document.createElement("div");
    wrapper.className = "post";
    wrapper.innerHTML = `
      <h3>${p.title}</h3>
      <small>${new Date(p.date).toLocaleString()}</small>
      ${p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy" class="post-img">` : ""}
      <div class="content"><em>Loading...</em></div>
    `;
    postsContainer.appendChild(wrapper);

    // Load markdown content
    fetch(p.file)
      .then(r => r.text())
      .then(text => {
        if (text.startsWith("---")) {
          const end = text.indexOf("---", 3);
          if (end !== -1) text = text.slice(end + 3);
        }
        wrapper.querySelector(".content").innerHTML = window.marked.parse(text.trim());
      })
      .catch(() => {
        wrapper.querySelector(".content").innerHTML = "<em>Unable to load post content.</em>";
      });
  });

  visibleCount += nextBatch.length;
  postsContainer.dataset.visible = visibleCount.toString();

  // Remove any previous Read More button
  const oldBtn = postsContainer.querySelector(".load-more");
  if (oldBtn) oldBtn.remove();

  // Add Read More if posts remain
  if (visibleCount < posts.length) {
    const btn = document.createElement("button");
    btn.className = "load-more";
    btn.textContent = "Read More";
    btn.onclick = () => renderPosts(posts);
    postsContainer.appendChild(btn);
  }

  console.log(`Rendered ${visibleCount} of ${posts.length} posts.`);
}
