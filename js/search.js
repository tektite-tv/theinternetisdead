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
    // Other styling if needed could go here
  };

  const closePopup = () => {
    popup.style.display = "none";
  };

  const performSearch = async () => {
    const query = input.value.trim();
    if (!query) {
      // Nothing to search → optionally close popup
      closePopup();
      return;
    }

    openPopup("<p>Loading results…</p>");

    try {
      // Modify this URL/logic if you actually have a results endpoint
      const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      openPopup(html);

    } catch (err) {
      console.error("Search error:", err);
      openPopup("<p style='color: red;'>Error retrieving results.</p>");
    }
  };

  // Button click
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    performSearch();
  });

  // Enter key in input
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  });

  // Close popup when clicking outside searchBar + popup
  document.addEventListener("click", (e) => {
    if (!searchBar.contains(e.target) && !popup.contains(e.target)) {
      closePopup();
    }
  });

  // Prevent propagation from popup to document click listener
  popup.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}
