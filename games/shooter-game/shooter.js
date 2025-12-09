// Bananaman Shooter v0.6.1 — finalized audio hierarchy + pause menu (Esc)

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
let state = "menu", keys = {}, mouse = {x:0,y:0,down:false}, lastTime = 0;
let bullets = [], enemies = [], particles = [];
let kills = 0, wave = 1, damage = 0, elapsed = 0;
let spawnTimer = 0, spawnInterval = 3;

// === GRID BACKGROUND (BANANA MATRIX) ===
const gridSpacing = 40;
let gridStatic = false;
function drawGrid(){
  g.clearRect(0,0,W,H);
  g.strokeStyle = "rgba(0,255,150,0.4)";
  g.lineWidth = 1;
  for(let x=0;x<=W;x+=gridSpacing){
    g.beginPath();
    g.moveTo(x,0);g.lineTo(x,H);g.stroke();
  }
  for(let y=0;y<=H;y+=gridSpacing){
    g.beginPath();
    g.moveTo(0,y);g.lineTo(W,y);g.stroke();
  }
}
drawGrid();

// === MOUSE / KEY INPUT ===
addEventListener("mousemove", e => {
  const rect = game.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
addEventListener("mousedown", () => mouse.down = true);
addEventListener("mouseup", () => mouse.down = false);
addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if(e.key === "Escape"){
    if(state === "playing") pauseGame();
    else if(state === "paused") resumeGame();
  }
});
addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// === PLAYER ===
const playerImg = new Image();
playerImg.src = "/media/images/gifs/bananarama.gif";
let playerLoaded = false; playerImg.onload = () => playerLoaded = true;
const player = {x:W/2, y:H/2, size:96, hp:100, speed:280, hitTimer:0, invuln:0};

// === ENEMY SPRITES ===
// Try to load a list of enemy GIFs from /media/images/gifs/index.json.
// Falls back to bananaclone.gif if the JSON is missing or malformed.
let enemyGifList = ["/media/images/gifs/bananaclone.gif"];

function initEnemyGifList(){
  try{
    fetch("/media/images/gifs/index.json")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        let rawList = [];

        if(Array.isArray(data)){
          rawList = data;
        }else if(data && Array.isArray(data.gifs)){
          rawList = data.gifs;
        }else if(data && Array.isArray(data.files)){
          rawList = data.files;
        }else if(data && typeof data === "object"){
          rawList = Object.values(data);
        }

        let list = [];
        for(const item of rawList){
          if(typeof item === "string"){
            list.push(item);
          }else if(item && typeof item === "object"){
            if(typeof item.src === "string") list.push(item.src);
            else if(typeof item.url === "string") list.push(item.url);
            else if(typeof item.path === "string") list.push(item.path);
            else if(typeof item.name === "string") list.push(item.name);
          }
        }

        list = list
          .map(name => {
            if(typeof name !== "string") return null;
            if(name.startsWith("/")) return name;
            return "/media/images/gifs/" + name;
          })
          .filter(Boolean);

        if(list.length){
          enemyGifList = list;
        }
      })
      .catch(()=>{ /* keep fallback list */ });
  }catch(e){
    // fetch not available (very old browser or file://); keep fallback.
  }
}

// Initialize enemy GIF list on startup
initEnemyGifList();

function makeEnemySprite(){
  const img = new Image();
  const src = enemyGifList[Math.floor(Math.random()*enemyGifList.length)];
  img.src = src;
  return img;
}

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
pauseOverlay = document.getElementById("pauseOverlay"),
pauseResumeBtn = document.getElementById("pauseResumeBtn");

// === UI UPDATE ===
function updateUI(){
  killsEl.textContent = kills;
  waveEl.textContent = wave;
  damageEl.textContent = damage;
  timerEl.textContent = elapsed.toFixed(1);
}
function updateHealth(){
  healthFill.style.width = player.hp + "%";
  healthText.textContent = Math.max(0,Math.round(player.hp)) + "%";
}

// === BULLETS ===
function shoot(){
  if(state !== "playing") return;
  const angle = Math.atan2(mouse.y-player.y, mouse.x-player.x);
  const speed = 600;
  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle)*speed,
    vy: Math.sin(angle)*speed,
    life: 1.2
  });
}
let shootCooldown = 0;

// === ENEMIES ===
function makeEnemy(){
  // const img = new Image();
  // img.src = "/media/images/gifs/bananaclone.gif";
  const img = makeEnemySprite();
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

// === COLLISIONS ===
function checkCollisions(){
  for(let i=enemies.length-1;i>=0;i--){
    const e = enemies[i];

    // bullet hit
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

        e.hitTimer = 0.2;
        if(e.hp <= 0){
          enemies.splice(i,1);
          kills++;
          spawnParticles(e.x,e.y,"lime");

          // wave clear check
          if(enemies.length === 0){
            wave++;
            spawnWave();
          }
          return;
        }
      }
    }

    // enemy collision with player
    const dxp = player.x - e.x, dyp = player.y - e.y;
    if(dxp*dxp + dyp*dyp < (player.size/2 + e.size/2)**2){
      if(player.invuln <= 0){
        player.hp -= 10;
        player.invuln = 1.0;
        player.hitTimer = 0.3;
        damage += 5;

        // player hurt sound = oof.mp3
        const pain = oofSound.cloneNode();
        pain.volume = 0.7;
        pain.playbackRate = 0.95 + Math.random()*0.1;
        pain.play().catch(()=>{});

        // Red flash overlay
        ctx.save();
        ctx.fillStyle = "rgba(255,0,0,0.25)";
        ctx.fillRect(0,0,W,H);
        ctx.restore();

        updateHealth();
        if(player.hp <= 0) die();
      }
    }
  }
}

// === PARTICLES ===
function spawnParticles(x,y,color){
  for(let i=0;i<20;i++){
    particles.push({
      x,y,
      vx:(Math.random()-0.5)*300,
      vy:(Math.random()-0.5)*300,
      life:0.6+Math.random()*0.4,
      color
    });
  }
}
function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx*dt; p.y+=p.vy*dt;
    p.life-=dt;
    if(p.life<=0) particles.splice(i,1);
  }
}
function drawParticles(){
  for(const p of particles){
    const alpha = Math.max(0,p.life/0.8);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x,p.y,3,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

// === PLAYER UPDATE/DRAW ===
function updatePlayer(dt){
  if(state!=="playing") return;
  let vx=0,vy=0;
  if(keys["w"]||keys["arrowup"])vy-=1;
  if(keys["s"]||keys["arrowdown"])vy+=1;
  if(keys["a"]||keys["arrowleft"])vx-=1;
  if(keys["d"]||keys["arrowright"])vx+=1;
  const len=Math.hypot(vx,vy)||1;
  vx/=len;vy/=len;
  player.x+=vx*player.speed*dt;
  player.y+=vy*player.speed*dt;
  player.x=Math.max(player.size/2,Math.min(W-player.size/2,player.x));
  player.y=Math.max(player.size/2,Math.min(H-player.size/2,player.y));
  if(player.invuln>0) player.invuln-=dt;
  if(player.hitTimer>0) player.hitTimer-=dt;
}
function drawPlayer(){
  ctx.save();
  if(player.invuln>0){
    const t = performance.now()*0.02;
    ctx.globalAlpha = 0.5+0.5*Math.sin(t);
  }
  const sx=player.x-player.size/2, sy=player.y-player.size/2;
  if(playerLoaded){
    ctx.drawImage(playerImg,sx,sy,player.size,player.size);
  }else{
    ctx.fillStyle="yellow";
    ctx.beginPath();
    ctx.arc(player.x,player.y,player.size/2,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

// === MAIN LOOP ===
function loop(timestamp){
  const dt = (timestamp-lastTime)/1000||0;
  lastTime = timestamp;

  if(state==="playing"){
    elapsed += dt;
    spawnTimer -= dt;
    if(spawnTimer <= 0){
      spawnWave();
      spawnTimer = spawnInterval;
    }

    shootCooldown -= dt;
    if(mouse.down && shootCooldown<=0){
      shoot();
      shootCooldown = 0.15;
    }

    // Update
    updatePlayer(dt);
    updateEnemies(dt);
    updateParticles(dt);
    for(const e of enemies){
      if(e.hitTimer>0) e.hitTimer -= dt;
    }
    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];
      b.x+=b.vx*dt; b.y+=b.vy*dt;
      b.life-=dt;
      if(b.life<=0) bullets.splice(i,1);
    }

    checkCollisions();
    updateUI();
  }

  // Draw everything
  ctx.clearRect(0,0,W,H);
  drawGrid();
  drawParticles();
  drawEnemies();
  drawPlayer();

  // bullets on top
  ctx.fillStyle="cyan";
  for(const b of bullets){
    ctx.beginPath();
    ctx.arc(b.x,b.y,4,0,Math.PI*2);
    ctx.fill();
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// === GAME STATE TRANSITIONS ===
function startGame(){
  state = "playing";
  menu.style.display = "none";
  deathOverlay.classList.remove("visible");
  pauseOverlay.classList.remove("visible");
  kills = 0; wave = 1; damage = 0; elapsed = 0;
  player.hp = 100; player.invuln = 0; player.hitTimer = 0;
  bullets.length = 0; enemies.length = 0; particles.length = 0;
  spawnTimer = 0; updateHealth(); updateUI();
  bgMusic.currentTime = 0;
  bgMusic.play().catch(()=>{});
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

restartBtn.onclick = () => {
  deathOverlay.classList.remove('visible');
  startGame();
};

// === PAUSE MENU ===
function pauseGame(){
  if(state !== "playing") return;
  state = "paused";
  bgMusic.pause();
  pauseOverlay.classList.add("visible");
}
function resumeGame(){
  if(state !== "paused") return;
  state = "playing";
  bgMusic.play().catch(()=>{});
  pauseOverlay.classList.remove("visible");
}
pauseResumeBtn.onclick = () => {
  if(state === "paused") resumeGame();
};

// Start from menu; play begins from button in HTML
