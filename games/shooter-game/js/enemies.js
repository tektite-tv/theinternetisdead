import { player } from "./player.js";

// --- Enemy & Boss Containers ---
export let enemies = [];
export let bosses = [];

// --- Image Paths ---
const basePath = new URL("../../media/images/gifs/", import.meta.url).href;

// --- File List ---
const enemyFiles = [
  "dancing-guy.gif", "dancingzoidberg.gif", "dragon.gif", "eyes.gif",
  "fatspiderman.gif", "firework.gif", "frog.gif", "keyboard_smash.gif", "skeleton.gif"
];

// --- Image Storage ---
export let enemyImages = {}, playerImg, bossImg, imagesLoaded = false;

// --- Preload All Images ---
export function preloadImages() {
  const loadImage = src => new Promise(r => {
    const i = new Image();
    i.src = src;
    i.onload = () => r(i);
    i.onerror = () => {
      console.warn("⚠️ Failed to load:", src);
      r(null);
    };
  });

  return Promise.all([
    loadImage(basePath + "bananarama.gif"),
    loadImage(basePath + "180px-NO_U_cycle.gif"),
    ...enemyFiles.map(f => loadImage(basePath + f))
  ]).then(loaded => {
    playerImg = loaded[0];
    bossImg = loaded[1];
    enemyFiles.forEach((f, i) => (enemyImages[f] = loaded[i + 2]));
    imagesLoaded = true;
    console.log("✅ Images loaded:", Object.keys(enemyImages).length, "enemies ready.");
  });
}

// --- Enemy Spawning ---
export function spawnEnemyWave(count) {
  for (let i = 0; i < count; i++) spawnEnemy();
}

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = Math.random() * innerWidth; y = -50; }
  if (side === 1) { x = innerWidth + 50; y = Math.random() * innerHeight; }
  if (side === 2) { x = Math.random() * innerWidth; y = innerHeight + 50; }
  if (side === 3) { x = -50; y = Math.random() * innerHeight; }

  const size = Math.random() * 40 + 40;
  const hp = size * 0.6;
  const speed = 1 + Math.random();
  const file = enemyFiles[Math.floor(Math.random() * enemyFiles.length)];

  enemies.push({
    x, y, size, speed, img: enemyImages[file], health: hp
  });
}

// --- Boss Spawning ---
export function spawnBoss(x = innerWidth / 2, y = innerHeight / 3) {
  const b = {
    x, y, size: 180, speed: 1.2, img: bossImg, health: 1000, orbiters: [],
    enraged: false, patternTimer: 0
  };

  for (let i = 0; i < 4; i++) {
    b.orbiters.push({
      angle: (Math.PI / 2) * i,
      radius: 150,
      size: 90,
      health: 150,
      img: bossImg
    });
  }
  bosses.push(b);
}

export function spawnInsaneBossMode() {
  bosses = [];
  spawnBoss(250, 150);
  spawnBoss(innerWidth - 250, 150);
}

// ✅ Export key images for draw()
export { playerImg, bossImg };
