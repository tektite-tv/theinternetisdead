export function initSearch() {
  const searchBar = document.querySelector(".search-bar");
  const input = document.querySelector(".search-input");
  const btn = document.querySelector(".search-btn");
  const popup = document.getElementById("search-popup");

  if (!searchBar || !input || !btn || !popup) {
    console.warn("Search elements not found in header.");
    return;
  }

  // Helper: open and close popup
  const openPopup = (html = "") => {
    popup.innerHTML = html;
    popup.style.display = "block";
    popup.style.position = "absolute";
    popup.style.top = `${searchBar.offsetHeight + 4}px`;
    popup.style.left = "0";
    popup.style.width = "100%";
    popup.style.background = "#000";
    popup.style.border = "1px solid #00ff99";
    popup.style.borderRadius = "8px";
    popup.style.padding = "10px";
    popup.style.boxShadow = "0 0 15px rgba(0,255,153,0.3)";
    popup.style.zIndex = "9999";
    popup.style.maxHeight = "300px";
    popup.style.overflowY = "auto";
  };

  const closePopup = () => {
    popup.style.display = "none";
  };

  // Search trigger
  const performSearch = async () => {
    const query = input.value.trim();
    if (!query) return;

    openPopup("<p>Loading...</p>");
    try {
      openPopup(`<p>Searching for <strong>${query}</strong>...</p>`);
      if (!res.ok) throw new Error("Bad response");
      const html = await res.text();
      openPopup(html);
    } catch (err) {
      openPopup("<p style='color:red;'>Error fetching results.</p>");
    }
  };

  // Click events
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    performSearch();
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  });

  // Close popup on outside click
  document.addEventListener("click", (e) => {
    if (!searchBar.contains(e.target) && !popup.contains(e.target)) {
      closePopup();
    }
  });

  // Prevent header shifting when popup appears
  popup.addEventListener("click", (e) => e.stopPropagation());
}
