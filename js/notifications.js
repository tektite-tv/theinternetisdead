
document.addEventListener('DOMContentLoaded', () => {
  const notifLink = document.querySelector('.notifications-link');

  async function fetchLatestPostLine() {
    try {
      const indexRes = await fetch('/posts/index.json');
      if (!indexRes.ok) throw new Error("No index.json");

      const posts = await indexRes.json();
      if (!posts.length) throw new Error("No posts found");

      const latest = posts[0].file;
      const postRes = await fetch(`/posts/${latest}`);
      const text = await postRes.text();
      const firstLine = text.split('\n').find(line => line.trim() !== '') || 'New post available!';

      return firstLine;
    } catch (err) {
      console.warn("Error fetching post:", err);
      return "Check out the latest post!";
    }
  }

  async function showLatestNotification() {
    const firstLine = await fetchLatestPostLine();

    if (Notification.permission === 'granted') {
      new Notification('Latest Post 📜', { body: firstLine });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Latest Post 📜', { body: firstLine });
      }
    } else {
      alert("Notifications are blocked. Enable them in your browser settings.");
    }
  }

  if (notifLink) {
    notifLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLatestNotification();
    });
  }
});
