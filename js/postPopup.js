// /js/postPopup.js — Dedicated popup for displaying posts in-page
import { marked } from "https://cdn.jsdelivr.net/npm/marked@12.0.1/lib/marked.esm.js";

/**
 * Initializes the post popup element and event listeners.
 */
export function initPostPopup() {
  let postPopup = document.getElementById("post-popup");

  // Create structure if it doesn't exist
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

  const closePopup = () => {
    postPopup.style.display = "none";
    content.innerHTML = "";
  };

  closeBtn.addEventListener("click", closePopup);
  postPopup.addEventListener("click", (e) => {
    if (e.target === postPopup) closePopup();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup();
  });

  console.log("✅ Post popup initialized.");
}

/**
 * Opens the post popup and renders Markdown content.
 * Accepts either a Markdown string or a post object from the index.
 */
export function openPostPopup(postOrMarkdown) {
  const postPopup = document.getElementById("post-popup");
  if (!postPopup) return console.warn("Post popup not initialized yet.");

  const content = postPopup.querySelector(".post-content");

  try {
    let title = "Untitled Post";
    let date = "";
    let markdown = "";

    // Determine data source
    if (typeof postOrMarkdown === "string") {
      markdown = postOrMarkdown;
    } else if (typeof postOrMarkdown === "object") {
      title = postOrMarkdown.title || "Untitled";
      date = postOrMarkdown.date || "";
      markdown = postOrMarkdown.content || "";
    }

    // Extract YAML or top-level metadata
    const yamlMatch = markdown.match(/^---([\s\S]*?)---/);
    if (yamlMatch) {
      const yamlContent = yamlMatch[1];
      const titleMatch = yamlContent.match(/title:\s*(.*)/);
      const dateMatch = yamlContent.match(/date:\s*(.*)/);
      if (titleMatch && !postOrMarkdown.title) title = titleMatch[1].trim();
      if (dateMatch && !postOrMarkdown.date) date = dateMatch[1].trim();
    }

    // Strip YAML block and cleanup
    markdown = markdown.replace(/^---[\s\S]*?---/, "").trim();

    // Auto-detect Markdown header title if YAML title missing
    if (title === "Untitled Post") {
      const headerMatch = markdown.match(/^#\s+(.+)/m);
      if (headerMatch) {
        title = headerMatch[1].trim();
        markdown = markdown.replace(/^#\s+.+/, "").trim();
      }
    }

    // Format date
    const formattedDate = date
      ? new Date(date).toLocaleString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    // Render HTML
    const html = `
      <article class="popup-post">
        <h2>${title}</h2>
        ${formattedDate ? `<small class="post-date">${formattedDate}</small>` : ""}
        <div class="post-body">${marked.parse(markdown)}</div>
      </article>
    `;

    content.innerHTML = html;
    postPopup.style.display = "flex";
  } catch (err) {
    console.error("❌ Error displaying post:", err);
    content.innerHTML = `<p style="color:#f66;">Error displaying post: ${err.message}</p>`;
    postPopup.style.display = "flex";
  }
}

/**
 * Enables external triggering via event:
 * document.dispatchEvent(new CustomEvent("openPostPopup", { detail: postObject }));
 */
document.addEventListener("openPostPopup", (e) => {
  openPostPopup(e.detail);
});
