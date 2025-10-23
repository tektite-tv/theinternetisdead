export function initMenu() {
  const menuBtn = document.querySelector(".menu");
  const menuPopup = document.getElementById("menu-popup");
  const contactPopup = document.getElementById("contact-popup");

  if (!menuBtn || !menuPopup) {
    console.warn("initMenu: missing .menu button or #menu-popup");
    return;
  }

  // Toggle the menu popup
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    // Close contact popup if it's open
    if (contactPopup && contactPopup.style.display === "flex") {
      contactPopup.style.display = "none";
      contactPopup.style.opacity = "0";
      contactPopup.setAttribute("aria-hidden", "true");
    }

    // Toggle menu visibility
    menuPopup.classList.toggle("visible");
  });

  // Click outside to close
  document.addEventListener("click", (e) => {
    if (!menuPopup.contains(e.target) && !menuBtn.contains(e.target)) {
      menuPopup.classList.remove("visible");
    }
  });

  console.log("Menu initialized.");
}
