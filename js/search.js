export function initSearch() {
  const popup = document.getElementById("search-popup");
  const searchInput = document.querySelector(".search-input");
  const searchBtn = document.querySelector(".search-btn");

  if (!popup || !searchInput) return;

  const renderPlaceholder = () => {
    popup.innerHTML = `
      <div class="promptline">theinternetisdead.org</div>
      <div class="search-result">Type to search posts/videos, or try commands: <b>/help</b></div>
    `;
  };

  const openPopup = () => {
    if (!popup.innerHTML.trim()) renderPlaceholder();
    popup.style.display = "block";
  };
  const closePopup = () => (popup.style.display = "none");

  searchInput.addEventListener("focus", openPopup);
  searchInput.addEventListener("click", openPopup);
  if (searchBtn) searchBtn.addEventListener("click", openPopup);

  document.addEventListener("click", e => {
    if (!popup.contains(e.target) && !searchInput.contains(e.target)) closePopup();
  });

  // === Search logic ===
  function renderResults(query) {
    const index = window.INDEX || [];
    const results = index.filter(entry => {
      const haystack = (entry.title + " " + entry.snippet).toLowerCase();
      return haystack.includes(query.toLowerCase());
    });

    if (!results.length) {
      popup.innerHTML = `<div class="promptline">theinternetisdead.org</div><div class="no-results">No results found.</div>`;
      return;
    }

    popup.innerHTML = `
      <div class="promptline">theinternetisdead.org</div>
      ${results
        .map(
          r => `
          <div class="search-result" data-url="${r.url}" data-kind="${r.kind}">
            <span class="kind">[${r.kind}]</span>
            <span class="title">${r.title}</span>
            <div class="snippet">${r.snippet}</div>
          </div>
        `
        )
        .join("")}
    `;
  }

  // Input events
  searchInput.addEventListener("input", e => {
    const val = e.target.value.trim();
    if (!val) {
      renderPlaceholder();
      return;
    }
    renderResults(val);
  });

  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const val = searchInput.value.trim();
      if (!val) return;
      renderResults(val);
    }
  });

  // Handle clicking on results
  popup.addEventListener("click", e => {
    const result = e.target.closest(".search-result");
    if (!result) return;

    const url = result.dataset.url;
    const kind = result.dataset.kind;

    if (kind === "video") {
      window.open(url, "_blank");
      closePopup();
      return;
    }

    if (kind === "post") {
      // Instead of navigating, trigger a custom event for postPopup.js
      const event = new CustomEvent("openPostPopup", { detail: { url } });
      document.dispatchEvent(event);
      closePopup();
    }
  });
}
