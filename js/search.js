// /js/search.js — aligned with modular CSS

export function initSearch() {
  const searchInput = document.querySelector(".search-input");
  const popup = document.getElementById("search-popup");
  if (!searchInput || !popup) return;

  const INDEX = window.INDEX || [];

  function renderPlaceholder() {
    popup.innerHTML = `
      <div class="promptline">theinternetisdead.org</div>
      <div class="search-result">Type to search posts/videos, or try commands: <b>/help</b></div>
    `;
  }

  function renderResults(query) {
    if (!query) {
      renderPlaceholder();
      popup.style.display = "block";
      return;
    }

    // === COMMANDS ===
    if (query.startsWith("/")) {
      const command = query.slice(1).toLowerCase();
      switch (command) {
        case "help":
          popup.innerHTML = `
            <div class="promptline">theinternetisdead.org</div>
            <div class="search-result">Available commands:</div>
            <div class="search-result">/posts — list all blog posts</div>
            <div class="search-result">/videos — list all videos</div>
            <div class="search-result">/contact — open contact form</div>
            <div class="search-result">/menu — open site menu</div>
            <div class="search-result">/clear — close search popup</div>
          `;
          popup.style.display = "block";
          return;

        case "contact":
          document.getElementById("contact-popup").style.display = "flex";
          popup.style.display = "none";
          return;

        case "menu":
          document.getElementById("menu-popup").classList.add("visible");
          popup.style.display = "none";
          return;

        case "clear":
          popup.style.display = "none";
          return;

        case "posts":
        case "videos": {
          const kind = command === "posts" ? "post" : "video";
          const list = INDEX.filter(r => r.kind === kind);
          popup.innerHTML = `
            <div class="promptline">theinternetisdead.org</div>
            ${list.map(r => `
              <div class="search-result" data-url="${r.url}" data-kind="${r.kind}">
                <span class="kind">[${r.kind}]</span>
                <span class="title">${r.title}</span>
              </div>`).join("") || '<div class="no-results">Nothing found.</div>'}
          `;
          popup.style.display = "block";
          return;
        }
      }
    }

    // === NORMAL SEARCH ===
    const results = INDEX.filter(item =>
      item.title?.toLowerCase().includes(query.toLowerCase()) ||
      item.snippet?.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length === 0) {
      popup.innerHTML = `<div class="no-results">No results found.</div>`;
    } else {
      popup.innerHTML = `
        <div class="promptline">Results for "${query}"</div>
        ${results.map(r => `
          <div class="search-result" data-url="${r.url}" data-kind="${r.kind}">
            <div class="title">${r.title}</div>
            <div class="snippet">${r.snippet || ""}</div>
          </div>
        `).join("")}
      `;
    }

    popup.style.display = "block";
  }

  // === EVENT BINDINGS ===
  searchInput.addEventListener("focus", () => {
    renderPlaceholder();
    popup.style.display = "block";
  });

  searchInput.addEventListener("input", e => renderResults(e.target.value.trim()));

  document.addEventListener("click", e => {
    if (!popup.contains(e.target) && e.target !== searchInput) {
      popup.style.display = "none";
    }
  });

  popup.addEventListener("click", e => {
    const item = e.target.closest(".search-result");
    if (item && item.dataset.url) window.location.href = item.dataset.url;
  });

  console.log("Search initialized (modular version).");
}
