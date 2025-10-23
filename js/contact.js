export function initContact() {
  const submitBtn = document.querySelector(".submit-btn");
  const contactPopup = document.getElementById("contact-popup");
  const closeContact = document.querySelector(".close-contact");

  if (!submitBtn || !contactPopup) {
    console.warn("Contact form elements not found.");
    return;
  }

  // Open popup
  submitBtn.addEventListener("click", e => {
    e.preventDefault();
    contactPopup.style.display = "flex";
    contactPopup.style.opacity = "1";
  });

  // Close popup by button
  if (closeContact) {
    closeContact.addEventListener("click", () => {
      contactPopup.style.display = "none";
    });
  }

  // Close popup when clicking background
  contactPopup.addEventListener("click", e => {
    if (e.target === contactPopup) {
      contactPopup.style.display = "none";
    }
  });

  console.log("Contact popup initialized.");
}
