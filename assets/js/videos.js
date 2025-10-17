// /assets/js/videos.js
export async function loadVideos() {
  const container = document.getElementById("youtube");
  if (!container) return console.warn("No #youtube container found.");

  try {
    const feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCn3WLZT7k8nO24XimlJVJVJVQ";
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
    const data = await res.json();

    const videos = data.items || [];
    container.innerHTML = `
      <h1 style="color:#66ccff;">My Latest Broadcast</h1>
      ${videos.slice(0, 3).map(v => `
        <div class="video">
          <iframe src="https://www.youtube.com/embed/${v.guid.split(":").pop()}" allowfullscreen></iframe>
          <a href="${v.link}" target="_blank">${v.title}</a>
        </div>
      `).join("")}
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:red;">Error loading videos: ${err.message}</p>`;
  }
}
