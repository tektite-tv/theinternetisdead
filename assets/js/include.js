/**
 * Dynamically loads external HTML snippets (header, footer, etc.)
 * and injects them into any element with data-include="path/to/file.html"
 */
document.addEventListener("DOMContentLoaded", () => {
  const includes = document.querySelectorAll("[data-include]");

  includes.forEach(async el => {
    const file = el.getAttribute("data-include");

    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error(`Failed to load ${file}`);
      const html = await res.text();
      el.innerHTML = html;
    } catch (err) {
      el.innerHTML = `<p style="color:red;">Error loading ${file}</p>`;
      console.error(err);
    }
  });
});
