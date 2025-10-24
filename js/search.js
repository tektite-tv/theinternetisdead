import { openPostPopup } from "./postPopup.js"; // ensure postPopup exports this

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

  const COMMANDS = [
    { cmd: "/help", desc: "Show all available commands" },
    { cmd: "/revive", desc: "Revive the site’s spirit" },
    { cmd: "/die", desc: "Put the site into dead mode" },
    { cmd: "/glitchtv", desc: "Open Glitch TV" },
    { cmd: "/maze", desc: "Launch the Maze Game" },
    { cmd: "/contact", desc: "Open the contact popup" },
  ];

  const openPopup = (html = "<p>Search posts/videos or type a command like /help</p>") => {
    popup.innerHTML = html;
    popup.style.display = "block";
    popup.style.position = "absolute";
    popup.style.top = `${searchBar.offsetHeight + 4}px`;
    popup.style.left = "0";
    popup.style.width = "100%";
    popup.style.zIndex = "5000";
  };

  const closePopup = () => (popup.style.display = "none");

  const showCommands = () => {
    let html = "<div class='promptline'>sudo theinternetisdead.org</div>";
    COMMANDS.forEach((c) => {
      html += `<div class="search-result"><span class="title">${c.cmd}</span>
               <span class="snippet">${c.desc}</span></div>`;
    });
    openPopup(html);
  };

  const performSearch = () => {
    const query = input.value.trim().toLowerCase();
    if (query.startsWith("/")) return showCommands();
    if (!query) return openPopup();
    if (!window.INDEX) return openPopup("<p>No index loaded yet.</p>");

    const results = window.INDEX.filter(
      (i) =>
        i.title.toLowerCase().includes(query) ||
        i.snippet.toLowerCase().includes(query)
    );

    if (!results.length) {
      openPopup(`<p>No results found for "<b>${query}</b>".</p>`);
      return;
    }

    const html = results
      .map((r) => {
        if (r.kind === "video") {
          const idMatch = r.url.match(
            /(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/
          );
          const id = idMatch ? idMatch[1] : null;
          const thumb = id
            ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
            : "/images/default-thumb.png";
          const dateStr = r.date ? new Date(r.date).toLocaleDateString() : "";
          return `
          <div class="search-result video-result" data-kind="video" data-url="${r.url}">
            <img src="${thumb}" alt="${r.title}" class="video-thumb">
            <div class="video-meta">
              <span class="title">${r.title}</span>
              <div class="video-date">${dateStr}</div>
              <p class="snippet">${r.snippet}</p>
            </div>
          </div>`;
        } else {
          return `
          <div class="search-result post-result" data-kind="post" data-url="${r.url}">
            <span class="title">${r.title}</span><br/>
            <span class="snippet">${r.snippet}</span>
          </div>`;
        }
      })
      .join("");

    openPopup(html);
  };

  // === EVENTS ===
  let searchTimeout;
  input.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 200);
  });

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    performSearch();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "/") showCommands();
  });

  input.addEventListener("focus", showCommands);
  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (!popup.matches(":hover") && document.activeElement !== input)
        closePopup();
    }, 150);
  });

  document.addEventListener("click", (e) => {
    if (!searchBar.contains(e.target) && !popup.contains(e.target))
      closePopup();
  });

  // === HANDLE CLICK ON RESULTS ===
  popup.addEventListener("click", async (e) => {
    const result = e.target.closest(".search-result");
    if (!result) return;
    const kind = result.dataset.kind;
    const url = result.dataset.url;

    if (kind === "video") {
      window.open(url, "_blank");
    } else if (kind === "post") {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Post not found");
        const md = await res.text();
        openPostPopup(md);
        closePopup();
      } catch (err) {
        console.error("Failed to load post:", err);
        openPopup("<p>Failed to load post content.</p>");
      }
    }
  });
}
