export function initSearch() {
  const popup = document.getElementById("search-popup");
  const searchInput = document.querySelector(".search-input");
  const searchBtn = document.querySelector(".search-btn");

  if (!popup || !searchInput) return;

  const renderPlaceholder = () => {
    popup.innerHTML = `
  <div class="promptline">theinternetisdead.org</div>
  <div class="search-result">Type to search posts/videos, or try commands: <b>/help</b></div>
`;
  };

  const openPopup = () => {
    if (!popup.innerHTML.trim()) renderPlaceholder();
    popup.style.display = "block";
  };

  const closePopup = () => popup.style.display = "none";

  searchInput.addEventListener("focus", openPopup);
  searchInput.addEventListener("click", openPopup);
  if (searchBtn) searchBtn.addEventListener("click", openPopup);

  document.addEventListener("click", e => {
    if (!popup.contains(e.target) && !searchInput.contains(e.target)) closePopup();
  });
}
