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

    // === Optionally include videos if available ===
    try {
      const vres = await fetch("/_videos/index.json");
      if (vres.ok) {
        const videos = await vres.json();
        for (const v of videos) {
          index.push({
            kind: "video",
            title: v.title || "Untitled Video",
            url: v.url || "",
            snippet: v.description || "",
          });
        }
      } else {
        console.warn("No /_videos/index.json found (optional).");
      }
    } catch (err) {
      console.warn("Video index fetch failed (optional):", err);
    }

    window.INDEX = index;
    console.log(`✅ INDEX built: ${index.length} entries`);
  } catch (err) {
    console.error("Error building index:", err);
  }
}
