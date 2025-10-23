export function initSearch() {
  const popup = document.getElementById("search-popup");
  const searchInput = document.querySelector(".search-input");
  const searchBtn = document.querySelector(".search-btn");
  const contactPopup = document.getElementById("contact-popup");
  const menuPopup = document.getElementById("menu-popup");

  if (!popup || !searchInput) {
    console.warn("initSearch: missing popup or input");
    return;
  }

  const renderPlaceholder = () => {
    popup.innerHTML = `
      <div class="promptline">theinternetisdead.org</div>
      <div class="search-result">Type to search posts/videos<br><b>/help</b> for commands</div>
    `;
  };

  const openPopup = () => {
    if (contactPopup && contactPopup.style.display === "flex")
      contactPopup.style.display = "none";
    if (menuPopup) menuPopup.classList.remove("visible");

    if (!popup.innerHTML.trim()) renderPlaceholder();
    popup.style.display = "block";
  };

  const closePopup = () => {
    popup.style.display = "none";
  };

  searchInput.addEventListener("focus", openPopup);
  if (searchBtn) searchBtn.addEventListener("click", openPopup);

  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !searchInput.contains(e.target))
      closePopup();
  });

  // === Search logic ===
  function renderResults(query) {
    const index = window.INDEX || [];
    if (!index.length) {
      popup.innerHTML = `<div class="promptline">theinternetisdead.org</div>
        <div class="no-results">Index not loaded. Try reloading the page.</div>`;
      return;
    }

    const results = index.filter((entry) => {
      const haystack = (entry.title + " " + entry.snippet).toLowerCase();
      return haystack.includes(query.toLowerCase());
    });

    if (!results.length) {
      popup.innerHTML = `<div class="promptline">theinternetisdead.org</div>
        <div class="no-results">No results found for "${query}".</div>`;
      return;
    }

    popup.innerHTML = `
      <div class="promptline">theinternetisdead.org</div>
      ${results
        .map((r) => {
          if (r.kind === "video") {
            const id = r.url.split("v=")[1] || r.url.split("/").pop();
            const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
            return `
              <div class="search-result video" data-url="${r.url}" data-kind="${r.kind}">
                <img src="${thumb}" class="thumbnail" alt="">
                <div class="info">
                  <span class="kind">[video]</span>
                  <span class="title">${r.title}</span>
                  <div class="snippet">${r.snippet}</div>
                </div>
              </div>`;
          } else {
            return `
              <div class="search-result post" data-url="${r.url}" data-kind="${r.kind}">
                <span class="kind">[post]</span>
                <span class="title">${r.title}</span>
                <div class="snippet">${r.snippet}</div>
              </div>`;
          }
        })
        .join("")}
    `;
  }

  // Debounce typing to avoid lag
  let timeout = null;
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (!val) {
        renderPlaceholder();
      } else {
        renderResults(val);
      }
    }, 200);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = searchInput.value.trim();
      if (val) renderResults(val);
    }
  });

  popup.addEventListener("click", (e) => {
    const result = e.target.closest(".search-result");
    if (!result) return;

    const url = result.dataset.url;
    const kind = result.dataset.kind;

    if (kind === "video") {
      window.open(url, "_blank");
      closePopup();
    } else if (kind === "post") {
      const event = new CustomEvent("openPostPopup", { detail: { url } });
      document.dispatchEvent(event);
      closePopup();
    }
  });

  console.log("Search initialized.");
}
