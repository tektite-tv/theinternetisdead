// netlify/functions/youtube-feed.js
export default async (req, context) => {
  const url = new URL(req.url);
  const handle = url.searchParams.get('handle') || 'Honestly_Thomas';
  const nocacheSeconds = 300; // 5 min CDN cache; tune as you like

  try {
    // 1) Resolve handle -> channelId by scraping the channel page for "channelId"
    const channelHtml = await fetch(`https://www.youtube.com/@${handle}`, {
      // avoid getting localized JS-only shell
      headers: { 'accept-language': 'en' }
    }).then(r => {
      if (!r.ok) throw new Error(`Handle fetch failed: ${r.status}`);
      return r.text();
    });

    const chIdMatch = channelHtml.match(/"channelId":"(UC[0-9A-Za-z_-]{22})"/);
    if (!chIdMatch) throw new Error('channelId not found for handle');

    const channelId = chIdMatch[1];

    // 2) Fetch uploads feed (no API key needed)
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const xml = await fetch(feedUrl).then(r => {
      if (!r.ok) throw new Error(`Feed fetch failed: ${r.status}`);
      return r.text();
    });

    // 3) Parse minimal fields with lightweight regex (robust enough for yt feed)
    // Extract entries
    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let m;
    while ((m = entryRegex.exec(xml)) !== null) {
      const entry = m[1];
      const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
      // Prefer maxres thumbnail if present; else default hq
      const thumbMatch = entry.match(/<media:thumbnail[^>]+url="([^"]+)"/);

      const id = idMatch ? idMatch[1] : '';
      const title = titleMatch ? decodeHtml(titleMatch[1]) : 'Untitled';
      const published = publishedMatch ? publishedMatch[1] : '';
      const thumbnail = thumbMatch ? thumbMatch[1] : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      if (id) {
        entries.push({
          id,
          title,
          published,
          thumbnail,
          embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
          watchUrl: `https://www.youtube.com/watch?v=${id}`
        });
      }
    }

    // 4) Respond
    return new Response(JSON.stringify(entries, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': `public, max-age=${nocacheSeconds}`
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
};

// tiny XML text unescape for &amp; etc.
function decodeHtml(s) {
  return s
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}
