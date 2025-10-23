export function initMenu() {
  const menuBtn = document.querySelector(".menu");
  const menuPopup = document.getElementById("menu-popup");

  if (!menuBtn || !menuPopup) return;

  menuBtn.addEventListener("click", e => {
    e.stopPropagation();
    menuPopup.classList.toggle("visible");
  });

  document.addEventListener("click", e => {
    if (!menuPopup.contains(e.target) && !menuBtn.contains(e.target))
      menuPopup.classList.remove("visible");
  });
}
