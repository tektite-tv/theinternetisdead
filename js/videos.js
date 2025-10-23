export async function loadVideos() {
  const youtubeContainer = document.getElementById("youtube");
  if (!youtubeContainer) return;

  try {
    console.log("Fetching YouTube RSS feed...");
    const feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCn3WLZT7k8nO24XimlJVJVQ";
    // rss2json proxy converts the feed and bypasses CORS
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const videos = data.items || [];
    renderVideos(youtubeContainer, videos);
  } catch (err) {
    youtubeContainer.innerHTML = `<p style="color:red;">Error loading YouTube feed: ${err.message}</p>`;
  }
}

function renderVideos(container, allVideos) {
  const visibleCount = parseInt(container.dataset.visible || "0");
  const batch = allVideos.slice(visibleCount, visibleCount + 3);

  if (visibleCount === 0) {
    container.innerHTML = `
      <h1 style="color:#66ccff;">My Latest Broadcast</h1>
      <h2>Honestly Thomas (Tektite) on YouTube</h2>
    `;
  }

  batch.forEach(v => {
    const id = v.guid?.split(":").pop() || "";
    const div = document.createElement("div");
    div.className = "video";
    div.innerHTML = `
      <iframe src="https://www.youtube.com/embed/${id}" allowfullscreen loading="lazy"></iframe>
      <a href="${v.link}" target="_blank">${v.title}</a>
    `;
    container.appendChild(div);
  });

  const newVisible = visibleCount + batch.length;
  container.dataset.visible = newVisible.toString();

  const oldBtn = container.querySelector(".load-more");
  if (oldBtn) oldBtn.remove();

  if (newVisible < allVideos.length) {
    const btn = document.createElement("button");
    btn.className = "load-more";
    btn.id = "loadMoreVideos";
    btn.textContent = "Watch More";
    btn.addEventListener("click", () => renderVideos(container, allVideos));
    container.appendChild(btn);
  }

  const ytBtn = document.createElement("a");
  ytBtn.href = "https://www.youtube.com/channel/UCn3WLZT7k8nO24XimlJVJVQ";
  ytBtn.target = "_blank";
  ytBtn.className = "youtube-btn";
  ytBtn.textContent = "Watch on YouTube";
  container.appendChild(ytBtn);

  console.log(`Visible videos: ${newVisible}/${allVideos.length}`);
}
