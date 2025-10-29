/* ===========================================================
   Bananarama Apocalypse v3 — "Boss Mode & Time Itself"
   ===========================================================
   ✦ Boss Mode button spawns the final boss immediately
   ✦ Timer bottom-right counts up from 0.0 seconds
   ✦ ESC pauses all motion and freezes damage ticks
   =========================================================== */

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
const bossBtn = document.createElement("button");
bossBtn.textContent = "Boss Mode";
bossBtn.className = "menu-button";
menu.appendChild(bossBtn);

const optionsBtn = document.getElementById("optionsBtn");
const optionsMenu = document.getElementById("optionsMenu");
const backBtn = document.getElementById("backBtn");
const bgSelect = document.getElementById("bgSelect");

let backgroundColor = "#000";
document.getElementById("ui").classList.add("hidden");

startBtn.onclick = () => {
  menu.classList.add("hidden");
  document.getElementById("ui").classList.remove("hidden");
  resetGame();
  gameRunning = true;
  spawnEnemyWave(5);
  startTimer();
};

bossBtn.onclick = () => {
  menu.classList.add("hidden");
  document.getElementById("ui").classList.remove("hidden");
  resetGame();
  gameRunning = true;
  spawnBoss();
  startTimer();
};

optionsBtn.onclick = () => {
  optionsMenu.classList.remove("hidden");
  startBtn.style.display = "none";
  bossBtn.style.display = "none";
  optionsBtn.style.display = "none";
};

backBtn.onclick = () => {
  optionsMenu.classList.add("hidden");
  startBtn.style.display = "inline-block";
  bossBtn.style.display = "inline-block";
  optionsBtn.style.display = "inline-block";
};

bgSelect.onchange = () => {
  const colors = { black: "#000", green: "#002b00", blue: "#001133", purple: "#150021" };
  backgroundColor = colors[bgSelect.value] || "#000";
};

// --- GAME VARIABLES ---
const basePath = "/media/images/gifs/";
const enemyFiles = [
  "dancing-guy.gif", "dancingzoidberg.gif", "dragon.gif", "eyes.gif",
  "fatspiderman.gif", "firework.gif", "frog.gif", "keyboard_smash.gif", "skeleton.gif"
];
let imagesLoaded = false, enemyImages = {}, playerImg, bossImg;
let gameRunning = false, paused = false, gameOver = false;
let bossActive = false, bossDefeated = false, boss = null;

let enemies = [], bullets = [], lightnings = [];
let kills = 0, deaths = 0, health = 100, stamina = 100;
let frameCount = 0, wave = 1;
let pushCharges = 3, pushCooldown = false, cooldownTimer = 0, pushFxTimer = 0;

// --- TIMER ---
let gameTimer = 0;
let timerInterval = null;

function startTimer() {
  gameTimer = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!paused && gameRunning && !gameOver) gameTimer += 0.016;
  }, 16);
}
function stopTimer() { clearInterval(timerInterval); }

// --- CONTROLS ---
const keys = { w:false, a:false, s:false, d:false, space:false };
addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = true;
  if (e.code === "Space") { keys.space = true; e.preventDefault(); }
  if (e.code === "Escape") paused = !paused;
});
addEventListener("keyup", e => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = false;
  if (e.code === "Space") { keys.space = false; e.preventDefault(); }
});
ui.restart.onclick = resetGame;

// --- PLAYER + AIM ---
const player = { x: canvas.width / 2, y: canvas.height / 2, speed: 4, size: 64 };
let mouseX = player.x, mouseY = player.y, aimAngle = 0;

canvas.addEventListener("mousemove", e => { mouseX = e.clientX; mouseY = e.clientY; });
canvas.addEventListener("mousedown", () => {
  if (!gameOver && imagesLoaded && gameRunning && !paused) {
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
  const side = Math.floor(Math.random()*4);
  let x,y;
  if (side===0){x=Math.random()*canvas.width;y=-50;}
  if (side===1){x=canvas.width+50;y=Math.random()*canvas.height;}
  if (side===2){x=Math.random()*canvas.width;y=canvas.height+50;}
  if (side===3){x=-50;y=Math.random()*canvas.height;}
  const size = Math.random()*40+40, hp = size*(0.4+wave*0.1), speed = 0.8+Math.random()*0.5+wave*0.1;
  const file = enemyFiles[Math.floor(Math.random()*enemyFiles.length)];
  enemies.push({x,y,size,speed,img:enemyImages[file],health:hp,vx:0,vy:0,knock:0});
}

// --- SHOOT ---
function shootBullet(angle){ bullets.push({x:player.x,y:player.y,angle,speed:12,life:60}); aimAngle=angle; }

// --- PUSHBACK ---
function pushBackEnemies(){
  if (pushCooldown||pushCharges<=0||stamina<20)return;
  pushCharges--; stamina=Math.max(0,stamina-35); pushFxTimer=18;
  const radius=320,maxKick=18,stunFrames=16;
  enemies.forEach(e=>{
    const dx=e.x-player.x,dy=e.y-player.y,dist=Math.hypot(dx,dy)||0.001;
    if(dist<radius){const f=maxKick*(1-dist/radius);e.vx+=(dx/dist)*f;e.vy+=(dy/dist)*f;e.knock=stunFrames;}
  });
  if(bossActive&&boss){
    boss.orbiters.forEach(o=>{
      const dx=o.x-player.x,dy=o.y-player.y,dist=Math.hypot(dx,dy)||0.001;
      if(dist<radius){const f=(maxKick*0.7)*(1-dist/radius);o.vx=(dx/dist)*f;o.vy=(dy/dist)*f;o.knock=stunFrames;}
    });
  }
  if(pushCharges===0){pushCooldown=true;cooldownTimer=300;}
}

// --- BOSS ---
function spawnBoss(){
  bossActive=true;
  boss={x:canvas.width/2,y:canvas.height/3,size:180,speed:1.2,img:bossImg,health:1000,orbiters:[],flashTimer:0,shootTimer:150};
  for(let i=0;i<4;i++){
    boss.orbiters.push({
      angle:(Math.PI/2)*i,radius:150,size:90,speed:0.13,img:bossImg,health:150,vx:0,vy:0,knock:0,shootTimer:Math.random()*100
    });
  }
}

// --- UPDATE ---
function update(){
  if (!gameRunning||gameOver||bossDefeated||!imagesLoaded||paused) return;
  frameCount++;

  // Player move
  let dx=0,dy=0;
  if(keys.w)dy-=player.speed;if(keys.s)dy+=player.speed;if(keys.a)dx-=player.speed;if(keys.d)dx+=player.speed;
  player.x=Math.max(0,Math.min(canvas.width,player.x+dx));player.y=Math.max(0,Math.min(canvas.height,player.y+dy));
  if(keys.space){pushBackEnemies();keys.space=false;}
  if(!pushCooldown&&stamina<100)stamina+=0.12;
  if(pushCooldown){cooldownTimer--;if(cooldownTimer<=0){pushCooldown=false;pushCharges=3;}}
  aimAngle=Math.atan2(mouseY-player.y,mouseX-player.x);

  // Update bullets and lightning
  bullets.forEach(b=>{b.x+=Math.cos(b.angle)*b.speed;b.y+=Math.sin(b.angle)*b.speed;b.life--;});
  bullets=bullets.filter(b=>b.life>0);
  lightnings.forEach(l=>{l.x+=Math.cos(l.angle)*l.speed;l.y+=Math.sin(l.angle)*l.speed;l.life--;});
  lightnings=lightnings.filter(l=>l.life>0);

  // Waves
  if(enemies.length===0&&kills<50)spawnEnemyWave(5+wave*2);
  if(kills>=wave*10&&kills<50){wave++;spawnEnemyWave(5+wave*3);}
  if(!bossActive&&kills>=50)spawnBoss();

  // Enemies
  enemies.forEach((e,i)=>{
    if(e.knock>0){e.x+=e.vx;e.y+=e.vy;e.vx*=0.88;e.vy*=0.88;e.knock--;}
    else{const a=Math.atan2(player.y-e.y,player.x-e.x);e.x+=Math.cos(a)*e.speed;e.y+=Math.sin(a)*e.speed;}
    const dist=Math.hypot(player.x-e.x,player.y-e.y);
    if(dist<e.size/2+player.size/2){health-=0.5;if(health<=0)endGame();}
    bullets.forEach((b,bi)=>{if(Math.hypot(b.x-e.x,b.y-e.y)<e.size/2){e.health-=20;bullets.splice(bi,1);if(e.health<=0){kills++;enemies.splice(i,1);}}});
  });

  // Boss logic
  if(bossActive&&boss){
    boss.x+=Math.sin(frameCount/60)*2; boss.y+=Math.cos(frameCount/80)*1.5;
    boss.orbiters.forEach(o=>{
      if(o.knock>0){o.x+=o.vx;o.y+=o.vy;o.vx*=0.9;o.vy*=0.9;o.knock--;}
      else{o.angle+=o.speed;o.x=boss.x+Math.cos(o.angle)*o.radius;o.y=boss.y+Math.sin(o.angle)*o.radius;}
      o.shootTimer--;
      if(o.shootTimer<=0){
        const ang=Math.atan2(player.y-o.y,player.x-o.x);
        lightnings.push({x:o.x,y:o.y,angle:ang,speed:14,life:140,width:5,length:60});
        o.shootTimer=150+Math.random()*50;
      }
      bullets.forEach((b,bi)=>{if(Math.hypot(b.x-o.x,b.y-o.y)<o.size/2){o.health-=20;bullets.splice(bi,1);}});
    });

    const prev=boss.orbiters.length;
    boss.orbiters=boss.orbiters.filter(o=>o.health>0);
    if(prev>0&&boss.orbiters.length===0&&!boss.flashTimer){boss.flashTimer=180;spawnEnemyWave(10+wave*2);}
    if(boss.flashTimer>0)boss.flashTimer--;

    if(boss.orbiters.length===0){
      boss.shootTimer--;
      if(boss.shootTimer<=0){
        const ang=Math.atan2(player.y-boss.y,player.x-boss.x);
        lightnings.push({x:boss.x,y:boss.y,angle:ang,speed:15,life:160,width:7,length:80});
        boss.shootTimer=100+Math.random()*60;
      }
    }

    bullets.forEach((b,bi)=>{if(Math.hypot(b.x-boss.x,b.y-boss.y)<boss.size/2){boss.health-=10;bullets.splice(bi,1);if(boss.health<=0){bossDefeated=true;bossActive=false;}}});
  }

  // Lightning hits player
  lightnings.forEach(l=>{if(Math.hypot(player.x-l.x,player.y-l.y)<60){health-=7;if(health<=0)endGame();}});
  ui.kills.textContent=kills;ui.deaths.textContent=deaths;ui.health.textContent=Math.max(0,Math.floor(health));
}

// --- DRAW ---
function draw(){
  ctx.fillStyle=backgroundColor;ctx.fillRect(0,0,canvas.width,canvas.height);
  if(!imagesLoaded){ctx.fillStyle="#00ff99";ctx.font="30px monospace";ctx.fillText("Loading GIFs...",canvas.width/2-100,canvas.height/2);return;}
  if(!gameRunning)return;

  ctx.drawImage(playerImg,player.x-player.size/2,player.y-player.size/2,player.size,player.size);
  drawArrow(player.x,player.y,aimAngle);drawPushRing();
  drawBar("HEALTH",20,50,health,100,"#ff3333",true);
  drawBar("STAMINA",20,25,stamina,100,pushCooldown?"#333333":"#00ccff",true);

  bullets.forEach(b=>{ctx.save();ctx.shadowBlur=15;ctx.shadowColor="#ff66cc";ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(b.x,b.y,6,0,Math.PI*2);ctx.fill();ctx.restore();});

  lightnings.forEach(l=>{
    ctx.save();ctx.strokeStyle="rgba(0,255,255,0.9)";ctx.lineWidth=l.width;ctx.shadowColor="#00ffff";ctx.shadowBlur=18;
    const fade=Math.max(0.2,l.life/140);ctx.globalAlpha=fade;
    ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(l.x - Math.cos(l.angle)*l.length, l.y - Math.sin(l.angle)*l.length);
    ctx.stroke();ctx.restore();
  });

  enemies.forEach(e=>{if(e.img)ctx.drawImage(e.img,e.x-e.size/2,e.y-e.size/2,e.size,e.size);});
  if(bossActive&&boss){
    if(boss.flashTimer>0&&Math.floor(boss.flashTimer/5)%2){ctx.save();ctx.filter="brightness(1.6)";ctx.drawImage(boss.img,boss.x-boss.size/2,boss.y-boss.size/2,boss.size,boss.size);ctx.restore();}
    else ctx.drawImage(boss.img,boss.x-boss.size/2,boss.y-boss.size/2,boss.size,boss.size);
    boss.orbiters.forEach(o=>{ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.angle*10);ctx.drawImage(o.img,-o.size/2,-o.size/2,o.size,o.size);ctx.restore();});
    drawBossHealthBar();
  }

  // Timer display
  ctx.fillStyle="#00ff99";
  ctx.font="20px monospace";
  ctx.textAlign="right";
  ctx.fillText(`Time: ${gameTimer.toFixed(1)}s`, canvas.width-20, canvas.height-20);

  if(paused){ctx.fillStyle="rgba(0,0,0,0.6)";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#fff";ctx.font="60px Impact";ctx.textAlign="center";
    ctx.fillText("PAUSED", canvas.width/2, canvas.height/2);}
  if(bossDefeated){ctx.fillStyle="#00ff99";ctx.font="80px Impact";ctx.textAlign="center";ctx.fillText("YOU WIN", canvas.width/2, canvas.height/2);}
  if(gameOver){ctx.fillStyle="red";ctx.font="80px Impact";ctx.textAlign="center";ctx.fillText("YOU DIED", canvas.width/2, canvas.height/2);}
}

// --- UTIL DRAW FUNCS ---
function drawBar(label,x,y,value,max,color,alignBottom=false){
  const width=220,height=15,baseY=alignBottom?canvas.height-y-height:y;
  ctx.fillStyle="black";ctx.fillRect(x-2,baseY-2,width+4,height+4);
  ctx.fillStyle=color;ctx.fillRect(x,baseY,(value/max)*width,height);
  ctx.strokeStyle="#00ff99";ctx.strokeRect(x-2,baseY-2,width+4,height+4);
  ctx.fillStyle="#00ff99";ctx.font="12px monospace";ctx.fillText(label,x,baseY-6);
}
function drawBossHealthBar(){
  if(!bossActive||!boss)return;
  const bw=canvas.width*0.6,bh=20,x=(canvas.width-bw)/2,y=30,pct=Math.max(0,boss.health/1000);
  const fill=(boss.flashTimer>0&&Math.floor(boss.flashTimer/5)%2)?"#ff5555":"red";
  ctx.fillStyle="black";ctx.fillRect(x-2,y-2,bw+4,bh+4);
  ctx.fillStyle=fill;ctx.fillRect(x,y,bw*pct,bh);
  ctx.strokeStyle="#00ff99";ctx.strokeRect(x-2,y-2,bw+4,bh+4);
}
function drawArrow(x,y,angle){
  const r=player.size*0.8,len=25,w=16,ax=x+Math.cos(angle)*r,ay=y+Math.sin(angle)*r;
  ctx.save();ctx.translate(ax,ay);ctx.rotate(angle);
  ctx.beginPath();ctx.moveTo(len,0);ctx.lineTo(0,w/2);ctx.lineTo(0,-w/2);ctx.closePath();
  ctx.fillStyle="#ff66cc";ctx.shadowBlur=15;ctx.shadowColor="#ff66cc";ctx.fill();ctx.restore();
}
function drawPushRing(){
  if(pushFxTimer<=0)return;
  const t=pushFxTimer/18,maxR=360,r=(1-t)*maxR;
  ctx.save();ctx.strokeStyle=`rgba(255,255,255,${0.35*t})`;ctx.lineWidth=6*t+2;
  ctx.beginPath();ctx.arc(player.x,player.y,r,0,Math.PI*2);ctx.stroke();ctx.restore();pushFxTimer--;
}

// --- CONTROL ---
function loop(){update();draw();requestAnimationFrame(loop);}
function endGame(){if(!gameOver){gameOver=true;deaths++;ui.deaths.textContent=deaths;stopTimer();}}
function resetGame(){
  enemies.length=0;bullets.length=0;lightnings.length=0;kills=0;health=100;stamina=100;
  gameOver=false;bossActive=false;bossDefeated=false;pushCharges=3;pushCooldown=false;cooldownTimer=0;pushFxTimer=0;
  wave=1;boss=null;player.x=canvas.width/2;player.y=canvas.height/2;paused=false;stopTimer();
}
function init(){loop();}
