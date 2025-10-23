export default async (req, res) => {
  try {
    const feed = await fetch(
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCn3WLZT7k8nO24XimlJVJVQ"
    );
    const text = await feed.text();
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
