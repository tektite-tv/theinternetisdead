// /js/postPopup.js — Dedicated popup for displaying posts in-page

import { marked } from "https://cdn.jsdelivr.net/npm/marked@12.0.1/lib/marked.esm.js";

/**
 * Initializes the post popup element and event listeners
 */
export function initPostPopup() {
  let postPopup = document.getElementById("post-popup");

  // Create the popup structure once if not in DOM
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

  /** Close popup safely */
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
 * Opens the post popup using Markdown text or indexed post data.
 * @param {string|object} postOrMarkdown - Either raw markdown text or a post object
 */
export function openPostPopup(postOrMarkdown) {
  let postPopup = document.getElementById("post-popup");
  if (!postPopup) return console.warn("Post popup not initialized yet.");

  const content = postPopup.querySelector(".post-content");

  try {
    let title = "Untitled Post";
    let date = "";
    let markdown = "";

    if (typeof postOrMarkdown === "string") {
      // Received raw markdown text
      markdown = postOrMarkdown;
    } else if (typeof postOrMarkdown === "object") {
      title = postOrMarkdown.title || "Untitled";
      date = postOrMarkdown.date || "";
      markdown = postOrMarkdown.content || "";
    }

    // Strip YAML headers if any
    const cleanContent = markdown
      .replace(/^---[\s\S]*?---/, "")
      .replace(/^title:.*$/m, "")
      .replace(/^date:.*$/m, "")
      .trim();

    const formattedDate = date
      ? new Date(date).toLocaleString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const html = `
      <article class="popup-post">
        <h2>${title}</h2>
        ${
          formattedDate
            ? `<small class="post-date">${formattedDate}</small>`
            : ""
        }
        <div class="post-body">${marked.parse(cleanContent)}</div>
      </article>
    `;

    content.innerHTML = html;
    postPopup.style.display = "flex";
  } catch (err) {
    content.innerHTML = `<p style="color:#f66;">Error displaying post: ${err.message}</p>`;
    postPopup.style.display = "flex";
  }
}

/**
 * Allows triggering popup externally via:
 * document.dispatchEvent(new CustomEvent("openPostPopup", { detail: postObject }));
 */
document.addEventListener("openPostPopup", (e) => {
  openPostPopup(e.detail);
});
