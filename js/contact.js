export function initContact() {
  const submitBtn = document.querySelector(".submit-btn");
  const contactPopup = document.getElementById("contact-popup");
  const closeContact = document.querySelector(".close-contact");

  if (!submitBtn || !contactPopup) return;

  submitBtn.addEventListener("click", e => {
    e.preventDefault();
    contactPopup.style.display = "flex";
  });

  closeContact?.addEventListener("click", () => contactPopup.style.display = "none");

  contactPopup.addEventListener("click", e => {
    if (e.target === contactPopup) contactPopup.style.display = "none";
  });
}
