// /.netlify/functions/youtube-rss
export async function handler(event) {
  const channel = event.queryStringParameters.channel_id;
  if (!channel) {
    return { statusCode: 400, headers: cors(), body: 'Missing channel_id' };
  }
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channel)}`;
  try {
    const resp = await fetch(feedUrl, { headers: { 'User-Agent': 'tiid-rss-proxy' } });
    const text = await resp.text(); // pass through raw XML
    return {
      statusCode: 200,
      headers: { ...cors(), 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' },
      body: text
    };
  } catch (e) {
    return { statusCode: 502, headers: cors(), body: 'Upstream fetch failed' };
  }
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
