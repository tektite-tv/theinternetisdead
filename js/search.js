export function initSearch() {
  const input = document.querySelector(".search-input");
  const btn = document.querySelector(".search-btn");
  const popup = document.getElementById("search-popup");

  if (!input || !btn || !popup) return;

  const closePopup = () => (popup.style.display = "none");
  const openPopup = (html) => {
    popup.innerHTML = html || "";
    popup.style.display = "block";
  };

  btn.addEventListener("click", async () => {
    const q = input.value.trim();
    if (!q) return;

    openPopup("<p>Loading...</p>");
    try {
      const res = await fetch(`/search?q=${encodeURIComponent(q)}`);
      const html = await res.text();
      openPopup(html);
    } catch {
      openPopup("<p>Error fetching results</p>");
    }
  });

  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !input.contains(e.target) && !btn.contains(e.target)) {
      closePopup();
    }
  });
}
