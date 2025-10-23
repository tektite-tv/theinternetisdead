export async function loadVideos() {
  const youtubeContainer = document.getElementById("youtube");
  if (!youtubeContainer) return;

  try {
    console.log("Fetching YouTube feed...");
    const feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCn3WLZT7k8nO24XimlJVJVQ";
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
    const data = await res.json();
    const videos = data.items || [];
    renderVideos(videos);
  } catch (err) {
    youtubeContainer.innerHTML = `<p style="color:red;">Error loading videos: ${err.message}</p>`;
  }
}

function renderVideos(videos) {
  const youtubeContainer = document.getElementById("youtube");
  youtubeContainer.innerHTML = `
    <h1 style="color:#66ccff;">My Latest Broadcast</h1>
    <h2>Honestly Thomas (Tektite) on YouTube</h2>
  `;

  const visible = videos.slice(0, 3);
  visible.forEach(v => {
    const id = v.guid?.split(":").pop() || "";
    youtubeContainer.innerHTML += `
      <div class="video">
        <iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>
        <a href="${v.link}" target="_blank">${v.title}</a>
      </div>
    `;
  });

  if (videos.length > 3) {
    youtubeContainer.innerHTML += `<button id="loadMoreVideos" class="load-more">Watch More</button>`;
    document.getElementById("loadMoreVideos").addEventListener("click", () => {
      renderVideos(videos.slice(visible.length + 3));
    });
  }

  youtubeContainer.innerHTML += `
    <a href="https://www.youtube.com/channel/UCn3WLZT7k8nO24XimlJVJVQ" target="_blank" class="youtube-btn">
      Watch on YouTube
    </a>
  `;
}
