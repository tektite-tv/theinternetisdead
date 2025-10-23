// Wait for the HTML to load before running any JS
document.addEventListener("DOMContentLoaded", () => {
  // ======== ELEMENT SHORTCUTS ========
  const yearSpan = document.getElementById("year");
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.querySelector(".main-nav");
  const postContainer = document.getElementById("post-container");
  const loadMorePosts = document.getElementById("loadMorePosts");

  // ======== FOOTER YEAR ========
  // Automatically set the current year
  yearSpan.textContent = new Date().getFullYear();

  // ======== MENU TOGGLE ========
  // Adds/removes "active" class to show/hide nav menu on mobile
  menuToggle.addEventListener("click", () => {
    nav.classList.toggle("active");
  });

  // ======== LOAD BLOG POSTS ========
  // Fetches posts from /posts/index.json
  async function loadPosts() {
    try {
      const res = await fetch("posts/index.json");
      const posts = await res.json();

      // Generate the first 3 posts
      posts.slice(0, 3).forEach(post => {
        const postEl = document.createElement("div");
        postEl.classList.add("post");
        postEl.innerHTML = `
          <h3>${post.title}</h3>
          <p>${post.date}</p>
          <a href="posts/${post.file}" target="_blank">Read more</a>
        `;
        postContainer.appendChild(postEl);
      });
    } catch (err) {
      console.error("Error loading posts:", err);
    }
  }

  loadPosts(); // Run immediately

  // ======== LOAD MORE BUTTON (placeholder) ========
  // You can expand this to fetch more posts later
  loadMorePosts.addEventListener("click", () => {
    alert("Feature coming soon!");
  });
});
