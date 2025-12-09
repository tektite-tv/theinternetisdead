// Bananaman Shooter v0.6.2 — boss at wave 6 with win overlay

const bg = document.getElementById("bg");
const g = bg.getContext("2d");
const game = document.getElementById("game");
const ctx = game.getContext("2d");

let W = innerWidth, H = innerHeight;
bg.width = game.width = W;
bg.height = game.height = H;
addEventListener("resize", () => {
  W = innerWidth; H = innerHeight;
  bg.width = game.width = W;
  bg.height = game.height = H;
});

// === STATE ===
let state = "menu", keys = {}, mouse = {x:W/2,y:H/2};
let kills = 0, wave = 1, damage = 0, startTime = null;

// === PLAYER ===
const playerImg = new Image();
playerImg.src = "/media/images/gifs/bananarama.gif";
let playerLoaded = false; playerImg.onload = () => playerLoaded = true;
const player = {x:W/2, y:H/2, size:96, hp:100, speed:280, hitTimer:0, invuln:0};

// === AUDIO ===
const hitSound = new Audio('/media/audio/hitmarker.mp3');
const oofSound = new Audio('/media/audio/oof.mp3');
const bgMusic = new Audio('/media/audio/spaceinvaders.mp3');
const linkYell = new Audio('/media/audio/link-yell.mp3');
bgMusic.loop = true; bgMusic.volume = 0.6;

// === DOM ELEMENTS ===
const killsEl = document.getElementById("kills"),
waveEl = document.getElementById("wave"),
damageEl = document.getElementById("damage"),
timerEl = document.getElementById("timer"),
healthFill = document.getElementById("healthfill"),
healthText = document.getElementById("healthtext"),
menu = document.getElementById("menu"),
deathOverlay = document.getElementById("deathOverlay"),
restartBtn = document.getElementById("restartBtn"),
// NEW: win overlay elements
winOverlay = document.getElementById("winOverlay"),
winRestartBtn = document.getElementById("winRestartBtn");

// === GRID ===
let gridOffsetX = 0, gridOffsetY = 0, gridSpacing = 40, gridStatic = true;
function drawGrid(){
  g.clearRect(0,0,W,H);
  g.strokeStyle = "rgba(0,255,150,0.4)";
  g.shadowColor = "#00ffaa";
  g.shadowBlur = gridStatic ? 4 : 10;
  g.lineWidth = 1.2;
  g.beginPath();
  for(let x=-gridSpacing;x<W+gridSpacing;x+=gridSpacing){
    g.moveTo(x+gridOffsetX%gridSpacing,0);
    g.lineTo(x+gridOffsetX%gridSpacing,H);
  }
  for(let y=-gridSpacing;y<H+gridSpacing;y+=gridSpacing){
    g.moveTo(0,y+gridOffsetY%gridSpacing);
    g.lineTo(W,y+gridOffsetY%gridSpacing);
  }
  g.stroke();
}

// === HUD ===
function updateHUD(){
  killsEl.textContent = kills;
  waveEl.textContent = wave;
  damageEl.textContent = damage;
  if(startTime) timerEl.textContent = ((performance.now() - startTime)/1000).toFixed(1) + "s";
}
function updateHealth(){
  const p = Math.max(0, Math.round(player.hp));
  healthFill.style.width = p + "%";
  healthText.textContent = p + "%";
}

// === PLAYER MOVEMENT & DRAW ===
function updatePlayer(dt){
  let dx=0, dy=0;
  if(keys['w']) dy -= 1;
  if(keys['s']) dy += 1;
  if(keys['a']) dx -= 1;
  if(keys['d']) dx += 1;
  const m = Math.hypot(dx,dy)||1;
  const speedMult = keys['shift'] ? 1.6 : 1;
  player.x += dx/m * player.speed * dt * speedMult;
  player.y += dy/m * player.speed * dt * speedMult;
  player.x = Math.max(player.size/2, Math.min(W-player.size/2, player.x));
  player.y = Math.max(player.size/2, Math.min(H-player.size/2, player.y));
  if(player.invuln>0) player.invuln-=dt;
  if(player.hitTimer>0) player.hitTimer-=dt;
  gridOffsetX -= dx*dt*player.speed*0.3;
  gridOffsetY -= dy*dt*player.speed*0.3;
}
function drawPlayer(){
  ctx.save();
  const sx=player.x-player.size/2, sy=player.y-player.size/2, s=player.size;
  if(playerLoaded){ctx.drawImage(playerImg,sx,sy,s,s);}
  else {ctx.fillStyle="yellow";ctx.beginPath();ctx.arc(player.x,player.y,player.size/2,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}

// === SHOOTING ===
const bullets = [];
function shoot(){
  const dx = mouse.x - player.x, dy = mouse.y - player.y;
  const a = Math.atan2(dy,dx);
  bullets.push({x:player.x,y:player.y,vx:Math.cos(a)*700,vy:Math.sin(a)*700});
}
function shotgunPulse(){
  const dx = mouse.x - player.x, dy = mouse.y - player.y;
  const base = Math.atan2(dy,dx);
  for(let i=0;i<9;i++){
    const ang = base + (Math.random() - .5) * 0.5;
    bullets.push({x:player.x,y:player.y,vx:Math.cos(ang)*900,vy:Math.sin(ang)*900});
  }
}

// === ENEMIES ===
const enemies = [];
function makeEnemy(){
  const imgs = ['bananarama.gif','dancing-guy.gif','skeleton.gif','frog.gif','dragon.gif'];
  const src = imgs[Math.floor(Math.random()*imgs.length)];
  const img = new Image(); img.src = "/media/images/gifs/" + src;
  const s = 40 + Math.random()*100;
  const side = Math.floor(Math.random()*4);
  let x,y;
  if(side===0){x=Math.random()*W;y=-60;}
  else if(side===1){x=W+60;y=Math.random()*H;}
  else if(side===2){x=Math.random()*W;y=H+60;}
  else{x=-60;y=Math.random()*H;}
  const speed = 80 + Math.random()*60;
  const hp = 2 + Math.random()*3;
  return {x,y,img,size:s,speed,hp,fade:1,hitTimer:0};
}
function spawnWave(){
  for(let i=0;i<5+wave*2;i++) enemies.push(makeEnemy());
}
function updateEnemies(dt){
  for(const e of enemies){
    const dx=player.x-e.x, dy=player.y-e.y, d=Math.hypot(dx,dy)||1;
    e.x += dx/d * e.speed * dt;
    e.y += dy/d * e.speed * dt;
  }
}
function drawEnemies(){
  for(const e of enemies){
    ctx.save();
    ctx.globalAlpha = e.fade;
    const sx=e.x-e.size/2, sy=e.y-e.size/2;
    if(e.img.complete){ctx.drawImage(e.img,sx,sy,e.size,e.size);}
    else{ctx.fillStyle="lime";ctx.beginPath();ctx.arc(e.x,e.y,e.size/2,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}

// === BOSS LOGIC (NEW) ===
let bossActive = false;
let boss = null;

const bossImg = new Image();
bossImg.src = "/media/images/gifs/180px-NO_U_cycle.gif";
let bossLoaded = false;
bossImg.onload = () => bossLoaded = true;

function spawnBoss(){
  bossActive = true;
  // Big central boss with 4 orbiting minis
  const size = 220;
  boss = {
    x: W / 2,
    y: H / 2,
    size,
    hp: 250,
    maxHp: 250,
    angle: 0,
    orbitRadius: size * 0.85,
    orbitSpeed: 1.2,
    orbiters: []
  };
  for(let i=0;i<4;i++){
    boss.orbiters.push({
      angleOffset: (Math.PI*2/4)*i,
      size: size * 0.45,
      x: 0,
      y: 0
    });
  }
}

function updateBoss(dt){
  if(!bossActive || !boss) return;
  boss.angle += boss.orbitSpeed * dt;
}

function drawBoss(){
  if(!bossActive || !boss) return;
  ctx.save();

  // draw main boss
  const sx = boss.x - boss.size/2;
  const sy = boss.y - boss.size/2;
  if(bossLoaded){
    ctx.drawImage(bossImg, sx, sy, boss.size, boss.size);
  } else {
    ctx.fillStyle = "purple";
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.size/2, 0, Math.PI*2);
    ctx.fill();
  }

  // draw orbiters & store their positions for collision
  for(const orb of boss.orbiters){
    const ang = boss.angle + orb.angleOffset;
    const ox = boss.x + Math.cos(ang) * boss.orbitRadius;
    const oy = boss.y + Math.sin(ang) * boss.orbitRadius;
    orb.x = ox;
    orb.y = oy;
    const os = orb.size;
    const osx = ox - os/2;
    const osy = oy - os/2;

    if(bossLoaded){
      ctx.drawImage(bossImg, osx, osy, os, os);
    } else {
      ctx.fillStyle = "lime";
      ctx.beginPath();
      ctx.arc(ox, oy, os/2, 0, Math.PI*2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// === COLLISIONS ===
function checkCollisions(){
  // Regular enemies
  for(let i=enemies.length-1;i>=0;i--){
    const e = enemies[i];

    // Bullet collisions (enemy hit sound)
    for(let j=bullets.length-1;j>=0;j--){
      const b = bullets[j];
      const dx=b.x-e.x, dy=b.y-e.y;
      if(dx*dx+dy*dy < (e.size/2+4)**2){
        bullets.splice(j,1);
        e.hp--; damage += 10;

        // enemy hit sound = hitmarker.mp3
        const marker = hitSound.cloneNode();
        marker.volume = 0.5;
        marker.playbackRate = 0.9 + Math.random()*0.2;
        marker.play().catch(()=>{});

        if(e.hp <= 0){
          enemies.splice(i,1);
          kills++;
        }
        break;
      }
    }

    // Player contact damage
    const dxp = player.x - e.x, dyp = player.y - e.y;
    const dist = Math.hypot(dxp,dyp);
    if(dist < (player.size/2 + e.size/2) && player.invuln <= 0){
      applyDamage(15 * (e.size/80));
    }
  }

  // Wave progression: when all regular enemies are gone and no boss yet,
  // increment wave; at wave 6, spawn boss instead of another normal wave.
  if(enemies.length === 0 && !bossActive){
    wave++;
    if(wave === 6){
      spawnBoss();
    } else {
      spawnWave();
    }
  }

  // === BOSS COLLISIONS (NEW) ===
  if(bossActive && boss){
    // Bullets vs boss & orbiters
    for(let j=bullets.length-1;j>=0;j--){
      const b = bullets[j];
      let hit = false;

      // main boss
      const dx = b.x - boss.x;
      const dy = b.y - boss.y;
      if(dx*dx + dy*dy < (boss.size/2 + 4)**2){
        hit = true;
      } else {
        // orbiters
        for(const orb of boss.orbiters){
          const odx = b.x - orb.x;
          const ody = b.y - orb.y;
          if(odx*odx + ody*ody < (orb.size/2 + 4)**2){
            hit = true;
            break;
          }
        }
      }

      if(hit){
        bullets.splice(j,1);
        damage += 15;

        const marker = hitSound.cloneNode();
        marker.volume = 0.6;
        marker.playbackRate = 0.9 + Math.random()*0.2;
        marker.play().catch(()=>{});

        boss.hp -= 10;
        if(boss.hp <= 0){
          bossActive = false;
          boss = null;
          winGame();
          break;
        }
      }
    }

    // Player vs main boss
    const pdx = player.x - boss.x;
    const pdy = player.y - boss.y;
    if(Math.hypot(pdx,pdy) < (player.size/2 + boss.size/2) && player.invuln <= 0){
      applyDamage(30);
    }

    // Player vs orbiters
    for(const orb of boss.orbiters){
      const odx = player.x - orb.x;
      const ody = player.y - orb.y;
      if(Math.hypot(odx,ody) < (player.size/2 + orb.size/2) && player.invuln <= 0){
        applyDamage(20);
        break;
      }
    }
  }
}

// === DAMAGE / DEATH / WIN ===
function applyDamage(d){
  player.hp = Math.max(0, player.hp - d);
  player.hitTimer = 0.3;
  player.invuln = 0.6;

  // Player damage sound = oof.mp3
  const pain = oofSound.cloneNode();
  pain.volume = 0.9;
  pain.playbackRate = 0.9 + Math.random()*0.2;
  pain.play().catch(()=>{});

  // Red flash overlay
  ctx.save();
  ctx.fillStyle = "rgba(255,0,0,0.25)";
  ctx.fillRect(0,0,W,H);
  ctx.restore();

  updateHealth();
  if(player.hp <= 0) die();
}

function die(){
  state = 'dead';
  bgMusic.pause(); bgMusic.currentTime = 0;
  gridStatic = true; drawGrid();

  // Player death sound = link-yell.mp3
  const deathSound = linkYell.cloneNode();
  deathSound.volume = 0.8;
  deathSound.play().catch(()=>{});

  deathOverlay.classList.add('visible');
}

function winGame(){
  state = 'won';
  bgMusic.pause(); bgMusic.currentTime = 0;
  gridStatic = true; drawGrid();
  winOverlay.classList.add('visible');
}

// Restart from death overlay
restartBtn.onclick = () => {
  deathOverlay.classList.remove('visible');
  winOverlay.classList.remove('visible');
  menu.style.display='flex';
  player.hp=100; updateHealth();
  enemies.length=0; bullets.length=0;
  bossActive = false; boss = null;
  kills=0; wave=1; damage=0;
  gridStatic=true; drawGrid();
  state='menu';
};

// Restart from win overlay
winRestartBtn.onclick =
