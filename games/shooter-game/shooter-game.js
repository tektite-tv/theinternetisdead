/* =========================
   Bananarama Apocalypse
   - Waves increase difficulty
   - Boss at 50 kills (with 4 orbiters)
   - Orbiters shoot lightning to dodge
   - When all orbiters die: boss flashes red + spawns extra enemies
   - Pushback (SPACE) with charges, cooldown, stamina cost
   - Bottom-left Health/Stamina bars
   ========================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
function fitCanvas() { canvas.width = innerWidth; canvas.height = innerHeight; }
fitCanvas();
addEventListener("resize", fitCanvas);

// --- UI ---
const ui = {
  kills: document.getElementById("kills"),
  deaths: document.getElementById("deaths"),
  health: document.getElementById("health"),
  restart: document.getElementById("restart")
};

// --- MENU SYSTEM ---
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const optionsBtn = document.getElementById("optionsBtn");
const optionsMenu = document.getElementById("optionsMenu");
const backBtn = document.getElementById("backBtn");
const bgSelect = document.getElementById("bgSelect");

let backgroundColor = "#000";
document.getElementById("ui").classList.add("hidden");

startBtn.onclick = () => {
  menu.classList.add("hidden");
  document.getElementById("ui").classList.remove("hidden");
  gameRunning = true;
  spawnEnemyWave(5);
};

optionsBtn.onclick = () => {
  optionsMenu.classList.remove("hidden");
  startBtn.style.display = "none";
  optionsBtn.style.display = "none";
};

backBtn.onclick = () => {
  optionsMenu.classList.add("hidden");
  startBtn.style.display = "inline-block";
  optionsBtn.style.display = "inline-block";
};

bgSelect.onchange = () => {
  const colors = { black:"#000", green:"#002b00", blue:"#001133", purple:"#150021" };
  backgroundColor = colors[bgSelect.value] || "#000";
};

// --- GAME VARIABLES ---
const basePath = "/media/images/gifs/";
const enemyFiles = [
  "dancing-guy.gif", "dancingzoidberg.gif", "dragon.gif", "eyes.gif",
  "fatspiderman.gif", "firework.gif", "frog.gif", "keyboard_smash.gif", "skeleton.gif"
];

let imagesLoaded = false;
let enemyImages = {};
let playerImg, bossImg;
let gameRunning = false;
let gameOver = false;

let bossActive = false;
let bossDefeated = false;
let boss = null;

let enemies = [];
let bullets = [];
let lightnings = [];

let kills = 0;
let deaths = 0;
let health = 100;
let stamina = 100;

let frameCount = 0;
let wave = 1;

// --- PUSHBACK SYSTEM ---
let pushCharges = 3;
let pushCooldown = false;
let cooldownTimer = 0;
let pushFxTimer = 0; // ring effect frames

// --- CONTROLS ---
const keys = { w:false, a:false, s:false, d:false, space:false };
addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = true;
  if (e.code === "Space" || e.key === " ") { keys.space = true; e.preventDefault(); }
});
addEventListener("keyup", e => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = false;
  if (e.code === "Space" || e.key === " ") { keys.space = false; e.preventDefault(); }
});
ui.restart.onclick = resetGame;

// --- PLAYER + AIM ---
const player = { x: canvas.width/2, y: canvas.height/2, speed: 4, size: 64 };
let mouseX = player.x, mouseY = player.y, aimAngle = 0;

canvas.addEventListener("mousemove", e => { mouseX = e.clientX; mouseY = e.clientY; });
canvas.addEventListener("mousedown", () => {
  if (!gameOver && imagesLoaded && gameRunning) {
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    shootBullet(angle);
  }
});

// --- LOADING ---
function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}

Promise.all([
  loadImage(basePath + "bananarama.gif"),
  loadImage(basePath + "180px-NO_U_cycle.gif"),
  ...enemyFiles.map(f => loadImage(basePath + f))
]).then(loaded => {
  playerImg = loaded[0];
  bossImg = loaded[1];
  enemyFiles.forEach((f, i) => (enemyImages[f] = loaded[i + 2]));
  imagesLoaded = true;
  init();
});

// --- ENEMIES ---
function spawnEnemyWave(count) { for (let i=0;i<count;i++) spawnEnemy(); }
function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x,y;
  if (side===0){ x=Math.random()*canvas.width; y=-50; }
  if (side===1){ x=canvas.width+50; y=Math.random()*canvas.height; }
  if (side===2){ x=Math.random()*canvas.width; y=canvas.height+50; }
  if (side===3){ x=-50; y=Math.random()*canvas.height; }

  const size = Math.random()*40 + 40;
  const hp = size * (0.4 + wave*0.1);
  const speed = 0.8 + Math.random()*0.5 + wave*0.1;
  const file = enemyFiles[Math.floor(Math.random()*enemyFiles.length)];

  enemies.push({ x,y,size,speed,img:enemyImages[file],health:hp, vx:0,vy:0, knock:0 });
}

// --- BULLETS ---
function shootBullet(angle){
  bullets.push({ x:player.x, y:player.y, angle, speed:12, life:60 });
  aimAngle = angle;
}

// --- BOSS ---
function spawnBoss(){
  bossActive = true;
  boss = {
    x: canvas.width/2, y: canvas.height/3, size: 180, speed: 1.2, img: bossImg,
    health: 1000, isBoss: true, orbiters: [], flashTimer: 0
  };
  for (let i=0;i<4;i++){
    boss.orbiters.push({
      angle:(Math.PI/2)*i, radius:150, size:90, speed:0.13,
      img:bossImg, health:150, vx:0,vy:0, knock:0,
      shootTimer: Math.random()*120 // initial stagger
    });
  }
}

// --- PUSHBACK (balanced) ---
function pushBackEnemies(){
  if (pushCooldown || pushCharges<=0 || stamina<20) return;
  pushCharges--;
  stamina = Math.max(0, stamina - 35);
  pushFxTimer = 18; // ~0.3s visual ring

  const radius=320, maxKick=18, stunFrames=16;

  enemies.forEach(e=>{
    const dx=e.x-player.x, dy=e.y-player.y;
    const dist=Math.hypot(dx,dy)||0.001;
    if (dist<radius){
      const force=maxKick*(1-dist/radius);
      e.vx += (dx/dist)*force;
      e.vy += (dy/dist)*force;
      e.knock = Math.max(e.knock, stunFrames);
    }
  });

  if (bossActive && boss){
    const dx=boss.x-player.x, dy=boss.y-player.y;
    const dist=Math.hypot(dx,dy)||0.001;
    if (dist<radius){
      const force=(maxKick*0.35)*(1-dist/radius);
      boss.x += (dx/dist)*force;
      boss.y += (dy/dist)*force;
    }
    boss.orbiters.forEach(o=>{
      const ox=o.x-player.x, oy=o.y-player.y;
      const od=Math.hypot(ox,oy)||0.001;
      if (od<radius){
        const force=(maxKick*0.7)*(1-od/radius);
        o.vx=(ox/od)*force; o.vy=(oy/od)*force; o.knock = Math.max(o.knock||0, stunFrames);
      }
    });
  }

  if (pushCharges===0){ pushCooldown=true; cooldownTimer=300; } // ~5s
}

// --- UPDATE ---
function update(){
  if (!gameRunning || gameOver || bossDefeated || !imagesLoaded) return;
  frameCount++;

  // player move
  let dx=0, dy=0;
  if (keys.w) dy-=player.speed;
  if (keys.s) dy+=player.speed;
  if (keys.a) dx-=player.speed;
  if (keys.d) dx+=player.speed;
  player.x = Math.max(0, Math.min(canvas.width, player.x+dx));
  player.y = Math.max(0, Math.min(canvas.height, player.y+dy));

  // pushback
  if (keys.space){ pushBackEnemies(); keys.space=false; }

  // stamina/cooldown
  if (!pushCooldown && stamina<100) stamina += 0.12;
  if (pushCooldown){ cooldownTimer--; if (cooldownTimer<=0){ pushCooldown=false; pushCharges=3; } }

  // aim
  aimAngle = Math.atan2(mouseY - player.y, mouseX - player.x);

  // bullets
  bullets.forEach(b=>{ b.x += Math.cos(b.angle)*b.speed; b.y += Math.sin(b.angle)*b.speed; b.life--; });
  bullets = bullets.filter(b=>b.life>0 && b.x>-100 && b.x<canvas.width+100 && b.y>-100 && b.y<canvas.height+100);

  // lightning
  lightnings.forEach(l=>{ l.x += Math.cos(l.angle)*l.speed; l.y += Math.sin(l.angle)*l.speed; l.life--; });
  lightnings = lightnings.filter(l=>l.life>0);

  // waves keep coming (even during boss)
  if (enemies.length===0 && kills<50) spawnEnemyWave(5 + wave*2);
  if (kills >= wave*10 && kills < 50){ wave++; spawnEnemyWave(5 + wave*3); }
  if (!bossActive && kills >= 50) spawnBoss();

  // enemy update + collisions
  enemies.forEach((e, i)=>{
    if (e.knock>0){ e.x+=e.vx; e.y+=e.vy; e.vx*=0.88; e.vy*=0.88; e.knock--; }
    else { const a=Math.atan2(player.y-e.y, player.x-e.x); e.x+=Math.cos(a)*e.speed; e.y+=Math.sin(a)*e.speed; }

    const dist = Math.hypot(player.x-e.x, player.y-e.y);
    if (dist < e.size/2 + player.size/2){ health -= 0.5; if (health<=0) endGame(); }

    bullets.forEach((b, bi)=>{
      const hit = Math.hypot(b.x-e.x, b.y-e.y);
      if (hit < e.size/2){
        e.health -= 20;
        bullets.splice(bi,1);
        if (e.health<=0){ kills++; enemies.splice(i,1); }
      }
    });
  });

  // boss & orbiters
  if (bossActive && boss){
    // boss idle drift
    boss.x += Math.sin(frameCount/60)*2;
    boss.y += Math.cos(frameCount/80)*1.5;

    boss.orbiters.forEach(o=>{
      // knocked or orbit
      if (o.knock>0){ o.x+=o.vx; o.y+=o.vy; o.vx*=0.9; o.vy*=0.9; o.knock--; }
      else { o.angle += o.speed; o.x = boss.x + Math.cos(o.angle)*o.radius; o.y = boss.y + Math.sin(o.angle)*o.radius; }

      // shooting lightning
      o.shootTimer--;
      if (o.shootTimer<=0){
        const dx = player.x - o.x, dy = player.y - o.y;
        const ang = Math.atan2(dy, dx);
        lightnings.push({ x:o.x, y:o.y, angle:ang, speed:10, life:90 });
        o.shootTimer = 180 + Math.random()*60; // every ~3-4s
      }

      // bullets hit orbiters
      bullets.forEach((b, bi)=>{
        const hit = Math.hypot(b.x-o.x, b.y-o.y);
        if (hit < o.size/2){ o.health -= 20; bullets.splice(bi,1); }
      });
    });

    // remove dead clones
    const before = boss.orbiters.length;
    boss.orbiters = boss.orbiters.filter(o=>o.health>0);
    // rage trigger once when all clones are dead
    if (before>0 && boss.orbiters.length===0 && boss.flashTimer===0){
      boss.flashTimer = 180; // flash for 3s
      spawnEnemyWave(10 + wave*2); // extra chaos surge
    }
    if (boss.flashTimer>0) boss.flashTimer--;

    // bullets hit boss
    bullets.forEach((b, bi)=>{
      const hit = Math.hypot(b.x-boss.x, b.y-boss.y);
      if (hit < boss.size/2){
        boss.health -= 10;
        bullets.splice(bi,1);
        if (boss.health<=0){ bossDefeated=true; bossActive=false; }
      }
    });
  }

  // lightning hits player
  lightnings.forEach(l=>{
    const dist = Math.hypot(player.x - l.x, player.y - l.y);
    if (dist < 40){
      health -= 5;
      l.life = 0;
      if (health<=0) endGame();
    }
  });

  // UI text
  ui.kills.textContent = kills;
  ui.deaths.textContent = deaths;
  ui.health.textContent = Math.max(0, Math.floor(health));
}

// --- DRAW HELPERS ---
function drawBar(label, x, y, value, max, color, alignBottom=false){
  const width=220, height=15;
  const baseY = alignBottom ? canvas.height - y - height : y;
  ctx.fillStyle="black"; ctx.fillRect(x-2, baseY-2, width+4, height+4);
  ctx.fillStyle=color; ctx.fillRect(x, baseY, (value/max)*width, height);
  ctx.strokeStyle="#00ff99"; ctx.strokeRect(x-2, baseY-2, width+4, height+4);
  ctx.fillStyle="#00ff99"; ctx.font="12px monospace"; ctx.fillText(label, x, baseY-6);
}

function drawBossHealthBar(){
  if (!bossActive || !boss) return;
  const barWidth = canvas.width * 0.6, barHeight = 20;
  const x = (canvas.width - barWidth)/2, y = 30;
  const pct = Math.max(0, boss.health/1000);
  // flashing red while rage is active
  const fill = (boss.flashTimer>0 && Math.floor(boss.flashTimer/5)%2) ? "#ff5555" : "red";
  ctx.fillStyle="black"; ctx.fillRect(x-2,y-2,barWidth+4,barHeight+4);
  ctx.fillStyle=fill; ctx.fillRect(x,y,barWidth*pct,barHeight);
  ctx.strokeStyle="#00ff99"; ctx.strokeRect(x-2,y-2,barWidth+4,barHeight+4);
}

function drawArrow(x,y,angle){
  const orbitRadius=player.size*0.8, arrowLength=25, arrowWidth=16;
  const ax = x + Math.cos(angle)*orbitRadius;
  const ay = y + Math.sin(angle)*orbitRadius;
  ctx.save(); ctx.translate(ax,ay); ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(arrowLength,0); ctx.lineTo(0,arrowWidth/2); ctx.lineTo(0,-arrowWidth/2);
  ctx.closePath();
  ctx.fillStyle="#ff66cc"; ctx.shadowBlur=15; ctx.shadowColor="#ff66cc"; ctx.fill();
  ctx.restore();
}

function drawPushRing(){
  if (pushFxTimer<=0) return;
  const t = pushFxTimer/18; // 1 -> 0
  const maxR=360, r=(1-t)*maxR;
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${0.35*t})`;
  ctx.lineWidth = 6*t + 2;
  ctx.beginPath(); ctx.arc(player.x, player.y, r, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
  pushFxTimer--;
}

// --- DRAW ---
function draw(){
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if (!imagesLoaded) {
    ctx.fillStyle="#00ff99"; ctx.font="30px monospace";
    ctx.fillText("Loading GIFs...", canvas.width/2-100, canvas.height/2);
    return;
  }
  if (!gameRunning) return;

  // player
  ctx.drawImage(playerImg, player.x - player.size/2, player.y - player.size/2, player.size, player.size);
  drawArrow(player.x, player.y, aimAngle);
  drawPushRing();

  // HUD (bottom-left)
  drawBar("HEALTH", 20, 50, health, 100, "#ff3333", true);
  drawBar("STAMINA", 20, 25, stamina, 100, pushCooldown ? "#333333" : "#00ccff", true);

  // bullets
  bullets.forEach(b=>{
    ctx.save();
    ctx.shadowBlur=15; ctx.shadowColor="#ff66cc"; ctx.fillStyle="#ffffff";
    ctx.beginPath(); ctx.arc(b.x,b.y,6,0,Math.PI*2); ctx.fill();
    ctx.restore();
  });

  // lightning bolts from orbiters
  lightnings.forEach(l=>{
    ctx.save();
    ctx.strokeStyle="rgba(0,255,255,0.85)";
    ctx.lineWidth=3;
    ctx.shadowColor="#00ffff";
    ctx.shadowBlur=10;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y);
    // short jag to suggest energy
    ctx.lineTo(l.x - Math.cos(l.angle)*15, l.y - Math.sin(l.angle)*15);
    ctx.stroke();
    ctx.restore();
  });

  // enemies
  enemies.forEach(e=>{
    if (e.img) ctx.drawImage(e.img, e.x - e.size/2, e.y - e.size/2, e.size, e.size);
  });

  // boss + orbiters (with flashing)
  if (bossActive && boss){
    // flashing effect only on boss sprite
    if (boss.flashTimer>0 && Math.floor(boss.flashTimer/5)%2){
      ctx.save();
      ctx.filter = "brightness(1.6) saturate(1.4) hue-rotate(-20deg)";
      ctx.drawImage(boss.img, boss.x - boss.size/2, boss.y - boss.size/2, boss.size, boss.size);
      ctx.restore();
    } else {
      ctx.drawImage(boss.img, boss.x - boss.size/2, boss.y - boss.size/2, boss.size, boss.size);
    }

    boss.orbiters.forEach(o=>{
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.angle * 10);
      ctx.drawImage(o.img, -o.size/2, -o.size/2, o.size, o.size);
      ctx.restore();
    });

    drawBossHealthBar();
  }

  // end screens
  if (bossDefeated){
    ctx.fillStyle="#00ff99"; ctx.font="80px Impact";
    ctx.fillText("YOU WIN", canvas.width/2 - 200, canvas.height/2);
  } else if (gameOver){
    ctx.fillStyle="red"; ctx.font="80px Impact";
    ctx.fillText("YOU DIED", canvas.width/2 - 180, canvas.height/2);
  }
}

// --- LOOP / LIFECYCLE ---
function loop(){ update(); draw(); requestAnimationFrame(loop); }

function endGame(){
  if (!gameOver){ gameOver=true; deaths++; ui.deaths.textContent = deaths; }
}

function resetGame(){
  enemies.length = 0;
  bullets.length = 0;
  lightnings.length = 0;
  kills = 0;
  health = 100;
  stamina = 100;
  gameOver = false;
  bossActive = false;
  bossDefeated = false;
  pushCharges = 3;
  pushCooldown = false;
  cooldownTimer = 0;
  pushFxTimer = 0;
  wave = 1;
  boss = null;
  player.x = canvas.width/2; player.y = canvas.height/2;
}

function init(){ loop(); }
