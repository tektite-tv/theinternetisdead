// search.js
export function initSearch() {
  const searchBar = document.querySelector(".search-bar");
  const input    = document.querySelector(".search-input");
  const btn      = document.querySelector(".search-btn");
  const popup    = document.getElementById("search-popup");

  if (!searchBar || !input || !btn || !popup) {
    console.warn("Search init: missing one or more elements:", {
      searchBarExists: !!searchBar,
      inputExists:     !!input,
      btnExists:       !!btn,
      popupExists:     !!popup
    });
    return;
  }

  // Make sure popup is initially hidden
  popup.style.display = "none";

  // === Popup controls ===
  const openPopup = (htmlContent = "") => {
    popup.innerHTML      = htmlContent;
    popup.style.display  = "block";
    popup.style.position = "absolute";
    popup.style.top      = `${searchBar.offsetHeight + 4}px`;
    popup.style.left     = "0";
    popup.style.width    = "100%";
    popup.style.zIndex   = "5000";
    popup.style.maxHeight   = "300px";
    popup.style.overflowY    = "auto";
  };

  const closePopup = () => {
    popup.style.display = "none";
  };

  // === Search handling ===
  const performSearch = async () => {
    const query = input.value.trim();
    if (!query) {
      closePopup();
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
      openPopup("<p style='color: red;'>Error retrieving results.</p>");
    }
  };

  // === Events ===

  // Show popup immediately when clicking or focusing in the input
  input.addEventListener("focus", () => {
    openPopup("<p>Type a command or search query...</p>");
  });

  // Optional: Close popup when input loses focus (but not if popup hovered)
  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (!popup.matches(":hover")) closePopup();
    }, 150);
  });

  // Button click triggers search
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    performSearch();
  });

  // Enter key triggers search
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  });

  // Clicking outside closes popup
  document.addEventListener("click", (e) => {
    if (!searchBar.contains(e.target) && !popup.contains(e.target)) {
      closePopup();
    }
  });

  // Stop propagation from popup so clicks inside it don't close it
  popup.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}
