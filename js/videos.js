export async function loadVideos() {
  const youtubeContainer = document.getElementById("youtube");
  let allVideos = [];

  try {
    const feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCn3WLZT7k8nO24XimlJVJVQ";
    const rssRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
    const rssData = await rssRes.json();
    allVideos = rssData.items || [];
    renderVideos(allVideos);
  } catch (err) {
    youtubeContainer.innerHTML = `<p style="color:red;">Error loading videos: ${err.message}</p>`;
  }
}

function renderVideos(videos) {
  const youtubeContainer = document.getElementById("youtube");
  const displayed = videos.slice(0, 3);
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
    ${videos.length > 3 ? `<button id="loadMoreVideos" class="load-more">Watch More</button>` : ""}
    <a href="https://www.youtube.com/channel/UCn3WLZT7k8nO24XimlJVJVQ" target="_blank" class="youtube-btn">Watch on YouTube</a>
  `;

  const btn = document.getElementById("loadMoreVideos");
  if (btn) btn.addEventListener("click", () => renderVideos(videos.slice(0, displayed.length + 3)));
}
