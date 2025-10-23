export async function loadVideos() {
  const youtubeContainer = document.getElementById("youtube");
  if (!youtubeContainer) return;

  try {
    console.log("Fetching YouTube feed...");
    const res = await fetch("/_youtube/index.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const videos = await res.json();
    setupVideos(youtubeContainer, videos);
  } catch (err) {
    youtubeContainer.innerHTML = `<p style="color:red;">Error loading videos: ${err.message}</p>`;
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

    // Extract video ID safely from URL or embed
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
      <p>${v.description || ""}</p>
    `;
    container.appendChild(wrapper);
  });

  const totalVisible = alreadyVisible + nextBatch.length;
  container.dataset.visible = totalVisible.toString();

  // Remove any existing "Watch More" button
  const oldBtn = container.querySelector(".load-more");
  if (oldBtn) oldBtn.remove();

  // Add new "Watch More" if there are more videos
  if (totalVisible < videos.length) {
    const btn = document.createElement("button");
    btn.className = "load-more";
    btn.textContent = "Watch More";
    btn.addEventListener("click", () => appendVideos(container, videos));
    container.appendChild(btn);
  }

  console.log(`Visible videos: ${totalVisible}/${videos.length}`);
}

