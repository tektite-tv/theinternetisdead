export async function loadVideos() {
  const youtubeContainer = document.getElementById("youtube");
  if (!youtubeContainer) return;

  try {
    console.log("Fetching YouTube RSS feed...");
    const feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCn3WLZT7k8nO24XimlJVJVQ";
    // rss2json proxy converts RSS → JSON and avoids CORS errors
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const videos = data.items || [];
    setupVideos(youtubeContainer, videos);
  } catch (err) {
    youtubeContainer.innerHTML = `<p style="color:red;">Error loading YouTube feed: ${err.message}</p>`;
  }
}

function setupVideos(container, videos) {
  container.innerHTML = `
    <h1 style="color:#00ccff;">📺 My Latest Broadcast</h1>
    <h2>Honestly Thomas (Tektite) on YouTube</h2>
  `;
  container.dataset.visible = "0";
  appendVideos(container, videos);
}

function appendVideos(container, videos) {
  const alreadyVisible = parseInt(container.dataset.visible || "0");
  const nextBatch = videos.slice(alreadyVisible, alreadyVisible + 3);

  nextBatch.forEach(v => {
    const id = v.guid?.split(":").pop() || "";
    const wrapper = document.createElement("div");
    wrapper.className = "video-card";

    wrapper.innerHTML = `
      <div class="video-frame">
        <iframe
          src="https://www.youtube.com/embed/${id}"
          title="${v.title}"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>
      <div class="video-info">
        <h3 class="video-title">${v.title}</h3>
        <small class="video-date">${new Date(v.pubDate).toLocaleString()}</small>
        <p class="video-desc">${v.description}</p>
        <a class="video-link" href="${v.link}" target="_blank">▶ Watch on YouTube</a>
      </div>
    `;

    container.appendChild(wrapper);
  });

  const totalVisible = alreadyVisible + nextBatch.length;
  container.dataset.visible = totalVisible.toString();

  // Remove old Watch More button if any
  const oldBtn = container.querySelector(".load-more");
  if (oldBtn) oldBtn.remove();

  // Add Watch More button if more videos remain
  if (totalVisible < videos.length) {
    const btn = document.createElement("button");
    btn.className = "load-more";
    btn.textContent = "Watch More";
    btn.addEventListener("click", () => appendVideos(container, videos));
    container.appendChild(btn);
  }

  console.log(`Visible videos: ${totalVisible}/${videos.length}`);
}
