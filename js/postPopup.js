// postPopup.js — unified with lightbox system
export function initPostPopup() {
  const lightbox = document.getElementById("img-lightbox");
  if (!lightbox) return;

  const lightImg = lightbox.querySelector("img");
  const postContent = lightbox.querySelector(".post-content");
  const closeBtn = lightbox.querySelector(".close-x");

  // Function to open post in lightbox
  const openPostPopup = async (url) => {
    try {
      const res = await fetch(url);
      const text = await res.text();

      // Render HTML/Markdown inside the popup
      postContent.innerHTML = text;
      lightImg.style.display = "none";
      lightbox.classList.add("post-mode");
      lightbox.style.display = "flex";
    } catch (err) {
      postContent.innerHTML = "<p>Error loading post.</p>";
      lightbox.classList.add("post-mode");
      lightbox.style.display = "flex";
      console.error("Post popup error:", err);
    }
  };

  // Cleanup + restore image mode
  const closePopup = () => {
    lightbox.style.display = "none";
    postContent.innerHTML = "";
    lightbox.classList.remove("post-mode");
    lightImg.style.display = "";
  };

  closeBtn.addEventListener("click", closePopup);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closePopup();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup();
  });

  // Listen for events from search.js
  document.addEventListener("openPostPopup", (e) => openPostPopup(e.detail.url));

  console.log("Post popup initialized (lightbox-integrated).");
}
