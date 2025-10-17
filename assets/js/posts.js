// /assets/js/posts.js
export async function loadPosts() {
  const container = document.getElementById("posts");
  if (!container) return console.warn("No #posts container found.");

  try {
    const res = await fetch("/_posts/index.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();

    container.innerHTML = `
      <h1 style="color:#ff66cc;">🌀 The Daily Spiral</h1>
      ${posts.map(p => `
        <article class="post">
          <h3>${p.title}</h3>
          <small>${new Date(p.date).toLocaleString()}</small>
          ${p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy">` : ""}
          <p><a href="${p.file}" target="_blank">Read Post</a></p>
        </article>
      `).join("")}
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:red;">Error loading posts: ${err.message}</p>`;
  }
}
