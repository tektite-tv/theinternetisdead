function getHeartsTopInCanvas(){
  const heartsEl = document.getElementById("heartsHud");
  if (!heartsEl) return canvas.height - 60;
  const hRect = heartsEl.getBoundingClientRect();
  const cRect = canvas.getBoundingClientRect();
  // Convert viewport pixels to canvas pixel space. This assumes 1:1 CSS sizing for the canvas.
  return (hRect.top - cRect.top);
}
