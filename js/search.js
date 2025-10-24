// /js/search.js
// Handles search bar commands and post/video search using local index.

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

  // === COMMAND LIST ===
  const COMMANDS = [
    { cmd: "/help", desc: "Show all available commands" },
    { cmd: "/revive", desc: "Revive the site’s spirit" },
    { cmd: "/die", desc: "Put the site into dead mode" },
    { cmd: "/glitchtv", desc: "Open Glitch TV" },
    { cmd: "/maze", desc: "Launch the Maze Game" },
    { cmd: "/contact", desc: "Open the contact popup" },
  ];

  const openPopup = (htmlContent = "") => {
    popup.innerHTML =
      htmlContent ||
      "<p>Search posts/videos or type a command like /help</p>";
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

  const showCommands = () => {
    let html = "<div class='promptline'>sudo theinternetisdead.org</div>";
    COMMANDS.forEach((c) => {
      html += `<div class="search-result">
                 <span class="title">${c.cmd}</span>
                 <span class="snippet">${c.desc}</span>
               </div>`;
    });
    openPopup(html);
  };

  const performSearch = () => {
    const query = input.value.trim().toLowerCase();

    if (query.startsWith("/")) {
      showCommands();
      return;
    }

    if (!query) {
      openPopup("<p>Search posts/videos or type a command like /help</p>");
      return;
    }

    if (!window.INDEX || !Array.isArray(window.INDEX)) {
      openPopup("<p>No index loaded yet. Try reloading the page.</p>");
      return;
    }

    const results = window.INDEX.filter((item) =>
      item.title.toLowerCase().includes(query) ||
      item.snippet.toLowerCase().includes(query)
    );

    if (results.length === 0) {
      openPopup(`<p>No results found for "<b>${query}</b>".</p>`);
      return;
    }

    let html = results
      .map(
        (r) => `
        <div class="search-result" data-kind="${r.kind}">
          <span class="title">${r.title}</span><br/>
          <span class="snippet">${r.snippet}</span>
        </div>`
      )
      .join("");

    openPopup(html);
  };

  // === EVENT LISTENERS ===
input.addEventListener("focus", showCommands);

searchBar.addEventListener("mousedown", (e) => {
  if (!popup.contains(e.target)) showCommands();
});

input.addEventListener("blur", () => {
  setTimeout(() => {
    if (!popup.matches(":hover") && document.activeElement !== input)
      closePopup();
  }, 150);
});

// Handle live typing search
let searchTimeout;
input.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  // debounce so it doesn’t trigger every keystroke instantly
  searchTimeout = setTimeout(() => {
    const query = input.value.trim();
    if (query.startsWith("/")) {
      showCommands();
    } else if (query === "") {
      openPopup("<p>Search posts/videos or type a command like /help</p>");
    } else {
      performSearch();
    }
  }, 200); // 200ms delay to avoid lag
});

btn.addEventListener("click", (e) => {
  e.preventDefault();
  performSearch();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "/") {
    showCommands();
  }
});

document.addEventListener("click", (e) => {
  if (!searchBar.contains(e.target) && !popup.contains(e.target))
    closePopup();
});

  popup.addEventListener("click", (e) => e.stopPropagation());
} // closes initSearch function
