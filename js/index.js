document.addEventListener("DOMContentLoaded", async () => {
  // === DOM SHORTCUTS ===
  const postsContainer = document.getElementById("posts");
  const youtubeContainer = document.getElementById("youtube");
  const searchInput = document.querySelector(".search-input");
  const searchBtn = document.querySelector(".search-btn");
  const popup = document.getElementById("search-popup");
  const contactPopup = document.getElementById("contact-popup");
  const submitBtn = document.querySelector(".submit-btn");
  const closeContact = document.querySelector(".close-contact");
  const menuBtn = document.querySelector(".menu");
  const menuPopup = document.getElementById("menu-popup");

  let allPosts = [], allVideos = [], INDEX = [];
  let visiblePosts = 3, visibleVideos = 3;
  let summoned = [];

  // === POPUP HELPERS ===
  function renderPlaceholder() {
    popup.innerHTML = `
      <div class="promptline">theinternetisdead.org</div>
      <div class="search-result">
        Type to search posts/videos, or try commands: <b>/help</b>
      </div>
    `;
  }
  function openPopup() {
    if (!popup) return;
    if (!popup.innerHTML.trim()) renderPlaceholder();
    popup.style.display = "block";
  }
  function closePopup() {
    if (!popup) return;
    popup.style.display = "none";
  }

  // === LOAD POSTS ===
  async function loadPosts() {
    try {
      const res = await fetch("/_posts/index.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allPosts = await res.json();
      allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
      renderPosts();
    } catch (err) {
      postsContainer.innerHTML = `<p style="color:red;">Error loading posts: ${err.message}</p>`;
    }
  }

  async function renderPosts() {
    postsContainer.innerHTML = `
      <h1 style="color:#00ff99;">🌀 The Daily Spiral</h1>
      <h2>Latest Blog Posts</h2>
    `;
    const displayed = allPosts.slice(0, visiblePosts);
    for (const p of displayed) {
      const wrapper = document.createElement("div");
      wrapper.className = "post";
      wrapper.innerHTML = `
        <h3>${p.title}</h3>
        <small>${new Date(p.date).toLocaleString()}</small>
        ${p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy" class="post-img">` : ""}
        <div class="content"><em>Loading...</em></div>`;
      postsContainer.appendChild(wrapper);
      try {
        let text = await (await fetch(p.file)).text();
        if (text.startsWith('---')) {
          const end = text.indexOf('---', 3);
          if (end !== -1) text = text.slice(end + 3);
        }
        wrapper.querySelector(".content").innerHTML = marked.parse(text.trim());
      } catch {
        wrapper.querySelector(".content").innerHTML = "<em>Unable to load post content.</em>";
      }
    }

    if (visiblePosts < allPosts.length) {
      const btn = document.createElement("button");
      btn.className = "load-more";
      btn.id = "loadMorePosts";
      btn.textContent = "Read More";
      btn.onclick = () => { visiblePosts += 3; renderPosts(); };
      postsContainer.appendChild(btn);
    }

    // === LIGHTBOX (with filename) ===
    if (!document.getElementById("img-lightbox")) {
      const box = document.createElement("div");
      box.id = "img-lightbox";
      box.innerHTML = `
        <div class="inner">
          <div class="toolbar">
            <a class="download-btn" target="_blank" download>Download</a>
            <div class="close-x">×</div>
          </div>
          <img src="" alt="Expanded image">
          <div class="filename" style="color:#0f0;text-align:center;font-family:monospace;margin-top:8px;"></div>
        </div>
      `;
      document.body.appendChild(box);
    }

    const lightbox = document.getElementById("img-lightbox");
    const lightImg = lightbox.querySelector("img");
    const filenameEl = lightbox.querySelector(".filename");
    const dlBtn = lightbox.querySelector(".download-btn");
    const closeBtn = lightbox.querySelector(".close-x");

    postsContainer.querySelectorAll("img").forEach(img => {
      img.addEventListener("click", () => {
        lightImg.src = img.src;
        dlBtn.href = img.src;
        const name = img.src.split("/").pop();
        filenameEl.textContent = name || "";
        lightbox.classList.add("visible");
      });
    });

    const closeLightbox = () => lightbox.classList.remove("visible");
    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", e => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeLightbox();
    });
  }

  // === LOAD VIDEOS ===
  async function loadVideos() {
    try {
      const feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCn3WLZT7k8nO24XimlJVJVQ";
      const rssRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
      const rssData = await rssRes.json();
      allVideos = rssData.items || [];
      renderVideos();
    } catch (err) {
      youtubeContainer.innerHTML = `<p style="color:red;">Error loading videos: ${err.message}</p>`;
    }
  }

  function renderVideos() {
    const displayed = allVideos.slice(0, visibleVideos);
    youtubeContainer.innerHTML = `
      <h1 style="color:#66ccff;">My Latest Broadcast</h1>
      <h2>Honestly Thomas (Tektite) on YouTube</h2>
      ${displayed.map(v => {
        const id = v.guid?.split(":").pop() || "";
        return `<div class="video">
          <iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>
          <a href="${v.link}" target="_blank">${v.title}</a>
        </div>`;
      }).join("")}
      ${visibleVideos < allVideos.length ? `<button id="loadMoreVideos" class="load-more">Watch More</button>` : ""}
      <a href="https://www.youtube.com/channel/UCn3WLZT7k8nO24XimlJVJVQ" target="_blank" class="youtube-btn">Watch on YouTube</a>
    `;
    const btn = document.getElementById("loadMoreVideos");
    if (btn) btn.addEventListener("click", () => { visibleVideos += 3; renderVideos(); });
  }

  // === BUILD SEARCH INDEX ===
  async function buildIndex() {
    const postDocs = await Promise.all(allPosts.map(async p => {
      try {
        let txt = await (await fetch(p.file)).text();
        if (txt.startsWith('---')) {
          const end = txt.indexOf('---', 3);
          if (end !== -1) txt = txt.slice(end + 3);
        }
        const plain = txt.replace(/[#>*_`\[\]\(\)!-]/g, " ").replace(/\s+/g, " ").trim();
        return { kind: "post", title: p.title, url: p.file.replace(".md", ".html"), date: p.date, snippet: plain.slice(0, 200) };
      } catch {
        return { kind: "post", title: p.title, url: p.file.replace(".md", ".html"), date: p.date, snippet: "" };
      }
    }));
    const videoDocs = allVideos.map(v => ({
      kind: "video", title: v.title, url: v.link, date: v.pubDate,
      snippet: (v.description || "").replace(/<[^>]+>/g, "").slice(0, 200)
    }));
    INDEX = [...postDocs, ...videoDocs];
  }

  // === GIF SUMMON (same as before) ===
  async function listGifs() { /* unchanged */ }
  function spawnGif(src) { /* unchanged */ }
  function clearSummoned() { /* unchanged */ }
  async function handleCommand(cmd) { /* unchanged */ }
  function renderResults(q) { /* unchanged */ }

  // === SEARCH, CONTACT, MENU INIT (same as before) ===
  if (searchInput && popup) {
    const showOnInteract = () => openPopup();
    searchInput.addEventListener("focus", showOnInteract);
    searchInput.addEventListener("click", showOnInteract);
    if (searchBtn) searchBtn.addEventListener("click", showOnInteract);

    searchInput.addEventListener("input", () => {
      const val = searchInput.value.trim();
      if (!val) { openPopup(); renderPlaceholder(); return; }
      renderResults(val);
    });

    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const val = searchInput.value.trim();
        if (val.startsWith("/")) handleCommand(val.toLowerCase());
        else if (val) renderResults(val);
      }
    });

    document.addEventListener("click", e => {
      const inside = popup.contains(e.target) || searchInput.contains(e.target) || (searchBtn && searchBtn.contains(e.target));
      if (!inside) closePopup();
    });
  }

  if (submitBtn) submitBtn.addEventListener("click", e => {
    e.preventDefault();
    contactPopup.style.display = "flex";
  });
  if (closeContact) closeContact.addEventListener("click", () => contactPopup.style.display = "none");
  if (contactPopup) contactPopup.addEventListener("click", e => {
    if (e.target === contactPopup) contactPopup.style.display = "none";
  });

  if (menuBtn && menuPopup) {
    menuBtn.addEventListener("click", e => {
      e.stopPropagation();
      menuPopup.classList.toggle("visible");
    });
    document.addEventListener("click", e => {
      if (!menuPopup.contains(e.target) && !menuBtn.contains(e.target))
        menuPopup.classList.remove("visible");
    });
  }

  await loadPosts();
  await loadVideos();
  await buildIndex();
});
