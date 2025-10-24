import "../js/lib/marked.min.js";

export async function loadPosts() {
  const postsContainer = document.getElementById("posts");
  if (!postsContainer) return;

  try {
    console.log("Fetching posts...");
    const res = await fetch("/_posts/index.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    setupPosts(postsContainer, posts);
  } catch (err) {
    postsContainer.innerHTML = `<p style="color:red;">Error loading posts: ${err.message}</p>`;
  }
}

function setupPosts(container, posts) {
  container.innerHTML = `
    <h1 style="color:#00ff99;">🌀 The Daily Spiral</h1>
    <h2 style="color:#00ff99;">Latest Blog Posts</h2>
  `;
  container.dataset.visible = "0";
  appendPosts(container, posts);
}

function appendPosts(container, posts) {
  const alreadyVisible = parseInt(container.dataset.visible || "0");
  const nextBatch = posts.slice(alreadyVisible, alreadyVisible + 3);

  nextBatch.forEach(p => {
    const post = document.createElement("div");
    post.className = "post";
    post.innerHTML = `
      <h3>${p.title}</h3>
      <small>${new Date(p.date).toLocaleString()}</small>
      ${p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy" class="post-img">` : ""}
      <div class="content"><em>Loading...</em></div>
    `;
    container.appendChild(post);

    fetch(p.file)
      .then(r => r.text())
      .then(text => {
        if (text.startsWith("---")) {
          const end = text.indexOf("---", 3);
          if (end !== -1) text = text.slice(end + 3);
        }
        post.querySelector(".content").innerHTML = window.marked.parse(text.trim());
      })
      .catch(() => {
        post.querySelector(".content").innerHTML = "<em>Unable to load post content.</em>";
      });
  });

  const totalVisible = alreadyVisible + nextBatch.length;
  container.dataset.visible = totalVisible.toString();

  // Remove old button if present
  const oldBtn = container.querySelector(".load-more");
  if (oldBtn) oldBtn.remove();

  // Only add button if posts remain
  if (totalVisible < posts.length) {
    const btn = document.createElement("button");
    btn.className = "load-more";
    btn.textContent = "Read More";
    btn.addEventListener("click", () => appendPosts(container, posts));
    container.appendChild(btn);
  }

  console.log(`Visible posts: ${totalVisible}/${posts.length}`);
}
