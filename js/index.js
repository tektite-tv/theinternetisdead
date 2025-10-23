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

  // === POPUP HELPERS ===
  function openPopup(html) {
    popup.innerHTML = html || "";
    popup.style.display = "block";
  }
  function closePopup() { popup.style.display = "none"; }

  // === LIGHTBOX SETUP ===
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

  const closeLightbox = () => lightbox.classList.remove("visible");
  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeLightbox();
  });

  function showLightboxImage(src) {
    lightImg.src = src;
    dlBtn.href = src;
    const name = src.split("/").pop();
    filenameEl.textContent = name || "";
    lightbox.classList.add("visible");
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
      <h2>Latest Blog Posts</h2>`;
    const displayed = allPosts.slice(0, visiblePosts);
    for (const p of displayed) {
      const wrap = document.createElement("div");
      wrap.className = "post";
      wrap.innerHTML = `
        <h3>${p.title}</h3>
        <small>${new Date(p.date).toLocaleString()}</small>
        ${p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy" class="post-img">` : ""}
        <div class="content"><em>Loading...</em></div>`;
      postsContainer.appendChild(wrap);
      try {
        let text = await (await fetch(p.file)).text();
        if (text.startsWith('---')) {
          const end = text.indexOf('---', 3);
          if (end !== -1) text = text.slice(end + 3);
        }
        wrap.querySelector(".content").innerHTML = marked.parse(text.trim());
      } catch {
        wrap.querySelector(".content").innerHTML = "<em>Unable to load post content.</em>";
      }
    }
    postsContainer.querySelectorAll("img").forEach(img => {
      img.addEventListener("click", () => showLightboxImage(img.src));
    });
    if (visiblePosts < allPosts.length) {
      const btn = document.createElement("button");
      btn.className = "load-more";
      btn.textContent = "Read More";
      btn.onclick = () => { visiblePosts += 3; renderPosts(); };
      postsContainer.appendChild(btn);
    }
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
    const shown = allVideos.slice(0, visibleVideos);
    youtubeContainer.innerHTML = `
      <h1 style="color:#66ccff;">My Latest Broadcast</h1>
      <h2>Honestly Thomas (Tektite) on YouTube</h2>
      ${shown.map(v => {
        const id = v.guid?.split(":").pop() || "";
        return `<div class="video">
          <iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>
          <a href="${v.link}" target="_blank">${v.title}</a>
        </div>`;
      }).join("")}
      ${visibleVideos < allVideos.length ? `<button id="loadMoreVideos" class="load-more">Watch More</button>` : ""}
      <a href="https://www.youtube.com/channel/UCn3WLZT7k8nO24XimlJVJVQ" target="_blank" class="youtube-btn">Watch on YouTube</a>`;
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
        return { kind: "post", title: p.title, url: p.file, date: p.date, snippet: plain.slice(0, 200), image: p.image };
      } catch {
        return { kind: "post", title: p.title, url: p.file, date: p.date, snippet: "" };
      }
    }));
    const videoDocs = allVideos.map(v => ({
      kind: "video", title: v.title, url: v.link, date: v.pubDate,
      snippet: (v.description || "").replace(/<[^>]+>/g, "").slice(0, 200)
    }));
    INDEX = [...postDocs, ...videoDocs];
  }

  // === COMMAND DESCRIPTIONS ===
  const COMMANDS = {
    "/help": "Show this list of commands",
    "/revive": "Reload posts and videos",
    "/die": "Clear the popup",
    "/space": "Engage cosmic flight mode",
    "/gifs": "Summon gif rain (coming soon)"
  };

  // === COMMAND HANDLER ===
  async function handleCommand(cmd) {
    switch (cmd) {
      case "/help":
        openPopup(`<div class="promptline">Commands available:</div>
          ${Object.entries(COMMANDS).map(([k,v]) => `<div class="search-result"><b>${k}</b> — ${v}</div>`).join("")}`);
        break;
      case "/revive":
        await loadPosts(); await loadVideos();
        openPopup(`<div class="search-result">Feeds revived.</div>`);
        break;
      case "/die":
        closePopup();
        break;
      case "/space":
        if (!document.getElementById("space-canvas")) {
          const c = document.createElement("canvas");
          c.id = "space-canvas"; document.body.appendChild(c);
          const ctx = c.getContext("2d");
          function stars() {
            const w = c.width = innerWidth, h = c.height = innerHeight;
            ctx.fillStyle = "black"; ctx.fillRect(0,0,w,h);
            for (let i=0;i<400;i++){
              ctx.fillStyle = `rgba(0,255,${Math.random()*255|0},${Math.random()})`;
              ctx.fillRect(Math.random()*w, Math.random()*h,2,2);
            }
            requestAnimationFrame(stars);
          }
          stars();
        }
        openPopup(`<div class="search-result">Space mode engaged.</div>`);
        break;
      case "/gifs":
        openPopup(`<div class="search-result">Gif summoning not yet implemented.</div>`);
        break;
      default:
        openPopup(`<div class="search-result">Unknown command: ${cmd}</div>`);
    }
  }

  // === LIVE COMMAND HINTS ===
  function showCommandHints(q) {
    const filtered = Object.entries(COMMANDS)
      .filter(([k]) => k.startsWith(q.toLowerCase()))
      .map(([k,v]) => `<div class="search-result"><b>${k}</b> — ${v}</div>`).join("");
    openPopup(filtered || `<div class="search-result no-results">No command found for "${q}"</div>`);
  }

  // === SEARCH RESULTS ===
  function renderResults(q) {
    const results = INDEX.filter(item =>
      item.title.toLowerCase().includes(q.toLowerCase()) ||
      item.snippet.toLowerCase().includes(q.toLowerCase())
    );
    if (!results.length) return openPopup(`<div class="search-result no-results">No results for "${q}"</div>`);
    popup.innerHTML = results.map(r => `
      <div class="search-result" data-kind="${r.kind}" data-url="${r.url}" data-img="${r.image || ""}">
        <span class="kind">[${r.kind}]</span>
        <span class="title">${r.title}</span>
        <span class="meta">${new Date(r.date).toLocaleString()}</span>
        <span class="snippet">${r.snippet}</span>
      </div>`).join("");
    popup.style.display = "block";
    popup.querySelectorAll(".search-result").forEach(res => {
      res.addEventListener("click", async () => {
        if (res.dataset.kind === "video") {
          window.open(res.dataset.url, "_blank");
        } else {
          const file = res.dataset.url;
          try {
            let text = await (await fetch(file)).text();
            if (text.startsWith('---')) {
              const end = text.indexOf('---', 3);
              if (end !== -1) text = text.slice(end + 3);
            }
            const html = marked.parse(text.trim());
            const tmp = document.createElement("div");
            tmp.className = "popup-inner";
            tmp.innerHTML = `
              <button class="close-btn">×</button>
              ${res.dataset.img ? `<img src="${res.dataset.img}" alt="">` : ""}
              <h1 class="popup-title">${res.querySelector(".title").textContent}</h1>
              <div>${html}</div>`;
            const postPopup = document.createElement("div");
            postPopup.id = "post-popup";
            postPopup.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:99999;";
            postPopup.appendChild(tmp);
            document.body.appendChild(postPopup);
            tmp.querySelector(".close-btn").addEventListener("click",()=>postPopup.remove());
            postPopup.addEventListener("click",e=>{if(e.target===postPopup)postPopup.remove();});
          } catch { alert("Could not load post."); }
        }
      });
    });
  }

  // === SEARCH BAR LOGIC ===
  if (searchInput && popup) {
    searchInput.addEventListener("input", () => {
      const val = searchInput.value.trim();
      if (!val) return closePopup();
      if (val.startsWith("/")) return showCommandHints(val);
      renderResults(val);
    });
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = searchInput.value.trim();
        if (!val) return;
        if (val.startsWith("/")) handleCommand(val.toLowerCase());
        else renderResults(val);
      }
    });
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        const val = searchInput.value.trim();
        if (!val) return;
        if (val.startsWith("/")) handleCommand(val.toLowerCase());
        else renderResults(val);
      });
    }
    document.addEventListener("click", e => {
      if (!popup.contains(e.target) && !searchInput.contains(e.target) && !searchBtn.contains(e.target))
        closePopup();
    });
  }

  // === CONTACT & MENU ===
  if (submitBtn) submitBtn.addEventListener("click", e => { e.preventDefault(); contactPopup.style.display = "flex"; });
  if (closeContact) closeContact.addEventListener("click", () => contactPopup.style.display = "none");
  if (contactPopup) contactPopup.addEventListener("click", e => { if (e.target === contactPopup) contactPopup.style.display = "none"; });
  if (menuBtn && menuPopup) {
    menuBtn.addEventListener("click", e => { e.stopPropagation(); menuPopup.classList.toggle("visible"); });
    document.addEventListener("click", e => { if (!menuPopup.contains(e.target) && !menuBtn.contains(e.target)) menuPopup.classList.remove("visible"); });
  }

  await loadPosts();
  await loadVideos();
  await buildIndex();
});
