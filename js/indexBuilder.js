export async function buildIndex() {
  const index = [];

  try {
    // === LOAD POSTS ===
    const postRes = await fetch("/_posts/index.json", { cache: "no-store" });
    if (!postRes.ok) throw new Error("Missing /_posts/index.json");
    const posts = await postRes.json();

    for (const p of posts) {
      try {
        let txt = await (await fetch(p.file)).text();
        if (txt.startsWith("---")) {
          const end = txt.indexOf("---", 3);
          if (end !== -1) txt = txt.slice(end + 3);
        }
        const plain = txt
          .replace(/[#>*_`\[\]\(\)!-]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        index.push({
          kind: "post",
          title: p.title || "Untitled",
          url: p.file.replace(".md", ".html"),
          snippet: plain.slice(0, 200)
        });
      } catch (err) {
        console.warn("Post fetch failed:", p.file, err);
      }
    }

    console.log(`📜 Loaded ${index.length} posts`);
  } catch (err) {
    console.warn("⚠️ Could not load posts index:", err);
  }

  try {
    // === LOAD YOUTUBE FEED ===
    const feedUrl =
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCn3WLZT7k8nO24XimlJVJVQ";
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
      feedUrl
    )}`;
    const rssRes = await fetch(apiUrl);
    const rssData = rssRes.ok ? await rssRes.json() : { items: [] };

    const videoDocs = (rssData.items || []).map((v) => ({
      kind: "video",
      title: v.title,
      url: v.link,
      snippet: (v.description || "").replace(/<[^>]+>/g, "").slice(0, 200)
    }));

    console.log(`📺 Loaded ${videoDocs.length} videos`);
    index.push(...videoDocs);
  } catch (err) {
    console.warn("⚠️ Could not load YouTube RSS feed:", err);
  }

  // === FINALIZE ===
  window.INDEX = index;
  console.log(`✅ Index built successfully with ${index.length} entries.`);
}
