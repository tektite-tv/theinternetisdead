export async function loadVideos() {
  const youtubeContainer = document.getElementById("youtube");
  if (!youtubeContainer) return;

  try {
    console.log("Fetching YouTube RSS feed...");
    const RSS_URL = "https://www.youtube.com/feeds/videos.xml?channel_id=UCn3WLZT7k8nO24XimlJVJVQ";
    const res = await fetch(RSS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");

    // Convert RSS <entry> nodes into objects
    const entries = Array.from(xml.querySelectorAll("entry")).map(entry => ({
      title: entry.querySelector("title")?.textContent || "Untitled",
      url: entry.querySelector("link")?.getAttribute("href") || "",
      date: entry.querySelector("published")?.textContent || "",
      description:
        entry.querySelector("media\\:description, description")?.textContent || ""
    }));

    setupVideos(youtubeContainer, entries);
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
    const wrapper = document.createElement("div");
    wrapper.className = "video";

    // Extract YouTube video ID safely
    let id = "";
    try {
      const urlObj = new URL(v.url);
      id = urlObj.searchParams.get("v") || v.url.split("/").pop();
    } catch {
      id = v.url.split("/").pop();
    }

    wrapper.innerHTML = `
      <h3>${v.title}</h3>
      <small>${new Date(v.date).toLocaleString()}</small>
      <iframe
        src="https://www.youtube.com/embed/${id}"
        title="${v.title}"
        loading="lazy"
        allowfullscreen
      ></iframe>
      <p>${v.description}</p>
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
