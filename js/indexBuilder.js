export async function buildIndex() {
  try {
    const postRes = await fetch("/_posts/index.json");
    const posts = await postRes.json();
    const postDocs = await Promise.all(posts.map(async p => {
      try {
        let txt = await (await fetch(p.file)).text();
        if (txt.startsWith("---")) {
          const end = txt.indexOf("---", 3);
          if (end !== -1) txt = txt.slice(end + 3);
        }
        const plain = txt.replace(/[#>*_`\[\]\(\)!-]/g, " ").replace(/\s+/g, " ").trim();
        return { kind: "post", title: p.title, url: p.file.replace(".md", ".html"), snippet: plain.slice(0, 200) };
      } catch {
        return { kind: "post", title: p.title, url: p.file, snippet: "" };
      }
    }));

    const feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCn3WLZT7k8nO24XimlJVJVQ";
    const rssRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
    const rssData = await rssRes.json();
    const videoDocs = (rssData.items || []).map(v => ({
      kind: "video",
      title: v.title,
      url: v.link,
      snippet: (v.description || "").replace(/<[^>]+>/g, "").slice(0, 200)
    }));

    window.INDEX = [...postDocs, ...videoDocs];
    console.log("Index built:", window.INDEX.length, "entries");
  } catch (err) {
    console.error("Error building index:", err);
  }
}
