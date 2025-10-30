export const player = { x: 0, y: 0, speed: 4, size: 64 };
export const keys = { w: false, a: false, s: false, d: false, space: false };
export let mouseX = 0, mouseY = 0;

export function setupPlayer(canvas) {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = true;
    if (e.code === "Space") { keys.space = true; e.preventDefault(); }
  });
  window.addEventListener("keyup", e => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
    if (e.code === "Space") { keys.space = false; e.preventDefault(); }
  });
  canvas.addEventListener("mousemove", e => { mouseX = e.clientX; mouseY = e.clientY; });
}
