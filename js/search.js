export function initSearch() {
  const searchBar = document.querySelector(".search-bar");
  const input = document.querySelector(".search-input");
  const btn = document.querySelector(".search-btn");
  const popup = document.getElementById("search-popup");

  if (!searchBar || !input || !btn || !popup) {
    console.warn("Search init: missing one or more elements");
    return;
  }

  popup.style.display = "none";

  const openPopup = (htmlContent = "") => {
    popup.innerHTML = htmlContent || "<p>Search posts/videos or type a command like /help</p>";
    popup.style.display = "block";
    popup.style.position = "absolute";
    popup.style.top = `${searchBar.offsetHeight + 4}px`;
    popup.style.left = "0";
    popup.style.width = "100%";
    popup.style.zIndex = "5000";
  };

  const closePopup = () => {
    popup.style.display = "none";
  };

  const performSearch = async () => {
    const query = input.value.trim();
    if (!query) {
      openPopup("<p>Type a command or search query...</p>");
      return;
    }

    openPopup("<p>Loading results…</p>");
    try {
      const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      openPopup(html);
    } catch (err) {
      console.error("Search error:", err);
      openPopup("<p style='color:red;'>Error retrieving results.</p>");
    }
  };

  // === Event Listeners ===
  input.addEventListener("focus", () => openPopup());
  searchBar.addEventListener("mousedown", (e) => {
    if (!popup.contains(e.target)) openPopup();
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (!popup.matches(":hover") && document.activeElement !== input) closePopup();
    }, 150);
  });

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    performSearch();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  });

  document.addEventListener("click", (e) => {
    if (!searchBar.contains(e.target) && !popup.contains(e.target)) closePopup();
  });

  popup.addEventListener("click", (e) => e.stopPropagation());
}
