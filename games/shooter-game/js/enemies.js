import { player } from "./player.js";

export let enemies = [];
export let bosses = [];

const basePath = new URL("../../media/images/gifs/", import.meta.url).href;

const enemyFiles = [
  "dancing-guy.gif",
  "dancingzoidberg.gif",
  "dragon.gif",
  "eyes.gif",
  "fatspiderman.gif",
  "firework.gif",
  "frog.gif",
  "keyboard_smash.gif",
  "skeleton.gif"
];

export let enemyImages = {};
export let playerImg;
export let bossImg;
export let imagesLoaded = false;

export function preloadImages() {
  const loadImage = src => new Promise(resolve => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => { console.warn("⚠️ Failed to load:", src); resolve(null); };
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
  const speed = 0.7 + Math.random() * 0.8;
  const file = enemyFiles[Math.floor(Math.random() * enemyFiles.length)];
  enemies.push({ x, y, size, speed, img: enemyImages[file], health: hp });
}

export function spawnBoss(x = innerWidth / 2, y = innerHeight / 3) {
  const b = {
    x, y, size: 180, speed: 1.2, img: bossImg, health: 1200, orbiters: [],
    enraged: false, patternTimer: 0
  };
  for (let i = 0; i < 4; i++) {
    b.orbiters.push({ angle: (Math.PI / 2) * i, radius: 150, size: 90, health: 200, img: bossImg });
  }
  bosses.push(b);
}

export function spawnInsaneBossMode() {
  bosses.length = 0;
  spawnBoss(250, 150);
  spawnBoss(innerWidth - 250, 150);
}
