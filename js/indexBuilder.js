// /js/indexBuilder.js
// Builds a full in-memory index of posts and videos for search + popups.

import { marked } from "https://cdn.jsdelivr.net/npm/marked@12.0.1/lib/marked.esm.js";

export async function buildIndex() {
  const index = [];

  try {
    // === Load posts from Netlify CMS-generated index.json ===
    const res = await fetch("/_posts/index.json");
    if (!res.ok) throw new Error("Failed to load post index");
    const posts = await res.json();

    for (const p of posts) {
      const filePath = `/${p.file}`;
      const response = await fetch(filePath);
      if (!response.ok) {
        console.warn("Skipping missing post:", filePath);
        continue;
      }

      const txt = await response.text();
      const plain = txt.replace(/[#>*_\-\n]/g, " ").trim();

      index.push({
        kind: "post",
        title: p.title || "Untitled",
        date: p.date || "",
        file: p.file,
        url: filePath,
        snippet: plain.slice(0, 200),
        content: txt
      });
    }

    // === Load video metadata directly from YouTube RSS feed ===
    try {
      console.log("Fetching YouTube RSS for index...");
      const feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCn3WLZT7k8nO24XimlJVJVQ";
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
      const vres = await fetch(apiUrl);
      if (!vres.ok) throw new Error(`HTTP ${vres.status}`);
      const data = await vres.json();

      const videos = data.items || [];
      for (const v of videos) {
        index.push({
          kind: "video",
          title: v.title || "Untitled Video",
          url: v.link || "",
          date: v.pubDate || "",
          snippet: (v.description || "").slice(0, 200)
        });
      }

      console.log(`🎥 Added ${videos.length} videos from YouTube feed`);
    } catch (err) {
      console.warn("YouTube RSS feed indexing failed (videos.js still handles display):", err);
    }

    // === Finalize ===
    window.INDEX = index;
    console.log(
      `✅ INDEX built: ${index.length} total entries (${index.filter(i => i.kind==='post').length} posts, ${index.filter(i => i.kind==='video').length} videos)`
    );
  } catch (err) {
    console.error("Error building index:", err);
  }
}
