// search.js — modular version with export

export function initSearch() {
  const searchInput = document.querySelector(".search-input");
  const popup = document.getElementById("search-popup");
  let INDEX = window.INDEX || [];

  function renderResults(query) {
    if (!query) {
      popup.style.display = "none";
      return;
    }

    // Command handler
    if (query.startsWith("/")) {
      const command = query.slice(1).toLowerCase();
      if (command === "help") {
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
      }

      if (command === "contact") {
        document.getElementById("contact-popup").style.display = "flex";
        popup.style.display = "none";
        return;
      }

      if (command === "menu") {
        document.getElementById("menu-popup").classList.add("visible");
        popup.style.display = "none";
        return;
      }

      if (command === "clear") {
        popup.style.display = "none";
        return;
      }

      if (command === "posts" || command === "videos") {
        const kind = command.slice(0, -1);
        const list = INDEX.filter(r => r.kind === kind);
        popup.innerHTML = `
          <div class="promptline">theinternetisdead.org</div>
          ${list.map(r => `
            <div class="search-result" data-url="${r.url}" data-kind="${r.kind}">
              <span class="kind">[${r.kind}]</span>
              <span class="title">${r.title}</span>
            </div>`).join("")}
        `;
        popup.style.display = "block";
        return;
      }
    }

    // Normal search results
    const results = INDEX.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.content.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length === 0) {
      popup.innerHTML = '<div class="no-results">No results found.</div>';
    } else {
      popup.innerHTML = results.map(r => `
        <div class="search-result" data-url="${r.url}" data-kind="${r.kind}">
          <div class="title">${r.title}</div>
          <div class="snippet">${r.content.slice(0, 120)}...</div>
        </div>`).join("");
    }

    popup.style.display = "block";
    const rect = searchInput.getBoundingClientRect();
    popup.style.top = rect.bottom + window.scrollY + "px";
    popup.style.left = rect.left + "px";
    popup.style.width = rect.width + "px";
  }

  searchInput.addEventListener("input", e => renderResults(e.target.value));
  document.addEventListener("click", e => {
    if (!popup.contains(e.target) && e.target !== searchInput) {
      popup.style.display = "none";
    }
  });

  popup.addEventListener("click", e => {
    const item = e.target.closest(".search-result");
    if (item && item.dataset.url) {
      window.location.href = item.dataset.url;
    }
  });

  console.log("Search initialized.");
}
