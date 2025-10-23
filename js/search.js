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

  // === Actual search logic ===
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
        .map(r => {
          if (r.kind === "video") {
            const id = r.url.split("v=")[1] || r.url.split("/").pop();
            const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
            return `
              <div class="search-result video" data-url="${r.url}" data-kind="${r.kind}">
                <img src="${thumb}" class="thumbnail" alt="Video thumbnail">
                <div class="info">
                  <span class="kind">[video]</span>
                  <span class="title">${r.title}</span>
                  <div class="snippet">${r.snippet}</div>
                </div>
              </div>
            `;
          } else {
            return `
              <div class="search-result post" data-url="${r.url}" data-kind="${r.kind}">
                <span class="kind">[post]</span>
                <span class="title">${r.title}</span>
                <div class="snippet">${r.snippet}</div>
              </div>
            `;
          }
        })
        .join("")}
    `;
  }

  // Event: typing and Enter
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

  // Handle click events
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
      // Fire custom event to open post in popup
      const event = new CustomEvent("openPostPopup", { detail: { url } });
      document.dispatchEvent(event);
      closePopup();
    }
  });
}
