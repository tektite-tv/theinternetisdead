// Bananaman Shooter v0.5.5 – restored player/enemy visuals and spawns safely

const bg = document.getElementById("bg");
const g = bg.getContext("2d");
const game = document.getElementById("game");
const ctx = game.getContext("2d");
let W = innerWidth, H = innerHeight;
bg.width = game.width = W;
bg.height = game.height = H;
addEventListener("resize",()=>{W=innerWidth;H=innerHeight;bg.width=game.width=W;bg.height=game.height=H;});

// --- STATE ---
let state='menu',keys={},mouse={x:W/2,y:H/2};
let kills=0,wave=1,damage=0,startTime=null;
const bullets=[],enemies=[];

// --- PLAYER ---
const playerImg=new Image();
playerImg.src="/media/images/gifs/bananarama.gif";
let playerLoaded=false;playerImg.onload=()=>playerLoaded=true;
const player={x:W/2,y:H/2,size:96,hp:100,speed:280,hitTimer:0,invuln:0};

// --- AUDIO ---
const hitSound=new Audio('/media/audio/hitmarker.mp3');
const oofSound=new Audio('/media/audio/oof.mp3');
const bgMusic=new Audio('/media/audio/spaceinvaders.mp3');
const linkYell=new Audio('/media/audio/link-yell.mp3');
bgMusic.loop=true;bgMusic.volume=0.6;

// --- DOM ---
const killsEl=document.getElementById("kills"),
waveEl=document.getElementById("wave"),
damageEl=document.getElementById("damage"),
timerEl=document.getElementById("timer"),
healthFill=document.getElementById("healthfill"),
healthText=document.getElementById("healthtext"),
menu=document.getElementById("menu"),
deathOverlay=document.getElementById("deathOverlay"),
restartBtn=document.getElementById("restartBtn");

// --- GRID ---
let gridOffsetX=0,gridOffsetY=0,gridSpacing=40,gridStatic=true;
function drawGrid(){
  g.clearRect(0,0,W,H);
  g.strokeStyle="rgba(0,255,150,0.4)";
  g.shadowColor="#00ffaa";
  g.shadowBlur=gridStatic?4:10;
  g.lineWidth=1.2;
  g.beginPath();
  for(let x=-gridSpacing;x<W+gridSpacing;x+=gridSpacing){
    g.moveTo(x+gridOffsetX%gridSpacing,0);
    g.lineTo(x+gridOffsetX%gridSpacing,H);}
  for(let y=-gridSpacing;y<H+gridSpacing;y+=gridSpacing){
    g.moveTo(0,y+gridOffsetY%gridSpacing);
    g.lineTo(W,y+gridOffsetY%gridSpacing);}
  g.stroke();
}

// --- HUD ---
function updateHUD(){
  killsEl.textContent=kills;waveEl.textContent=wave;
  damageEl.textContent=damage;
  if(startTime)timerEl.textContent=((performance.now()-startTime)/1000).toFixed(1)+"s";
}
function updateHealth(){
  const p=Math.max(0,Math.round(player.hp));
  healthFill.style.width=p+"%";healthText.textContent=p+"%";
}

// --- PLAYER MOVEMENT/DRAW ---
function updatePlayer(dt){
  let dx=0,dy=0;
  if(keys['w'])dy-=1;if(keys['s'])dy+=1;
  if(keys['a'])dx-=1;if(keys['d'])dx+=1;
  const m=Math.hypot(dx,dy)||1;
  const speedMult=keys['shift']?1.6:1;
  player.x+=dx/m*player.speed*dt*speedMult;
  player.y+=dy/m*player.speed*dt*speedMult;
  player.x=Math.max(player.size/2,Math.min(W-player.size/2,player.x));
  player.y=Math.max(player.size/2,Math.min(H-player.size/2,player.y));
  if(player.invuln>0)player.invuln-=dt;if(player.hitTimer>0)player.hitTimer-=dt;
  gridOffsetX-=dx*dt*player.speed*.3;gridOffsetY-=dy*dt*player.speed*.3;
}
function drawPlayer(){
  ctx.save();
  const sx=player.x-player.size/2,sy=player.y-player.size/2,s=player.size;
  if(playerLoaded){ctx.drawImage(playerImg,sx,sy,s,s);}
  else{ctx.fillStyle="yellow";ctx.beginPath();ctx.arc(player.x,player.y,player.size/2,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}

// --- SHOOTING ---
function shoot(){
  const dx=mouse.x-player.x,dy=mouse.y-player.y,a=Math.atan2(dy,dx);
  bullets.push({x:player.x,y:player.y,vx:Math.cos(a)*700,vy:Math.sin(a)*700});
}
function shotgunPulse(){
  const dx=mouse.x-player.x,dy=mouse.y-player.y,base=Math.atan2(dy,dx);
  for(let i=0;i<9;i++){
    const ang=base+(Math.random()-.5)*0.5;
    bullets.push({x:player.x,y:player.y,vx:Math.cos(ang)*900,vy:Math.sin(ang)*900});
  }
}

// --- ENEMIES ---
function makeEnemy(){
  const imgs=['bananarama.gif','dancing-guy.gif','skeleton.gif','frog.gif'];
  const src=imgs[Math.floor(Math.random()*imgs.length)];
  const img=new Image();img.src="/media/images/gifs/"+src;
  const s=40+Math.random()*100;
  const side=Math.floor(Math.random()*4);
  let x,y;
  if(side===0){x=Math.random()*W;y=-60;}else if(side===1){x=W+60;y=Math.random()*H;}
  else if(side===2){x=Math.random()*W;y=H+60;}else{x=-60;y=Math.random()*H;}
  const speed=80+Math.random()*60;
  const hp=2+Math.random()*3;
  return{x,y,img,size:s,speed,hp,fade:1,hitTimer:0};
}
function spawnWave(){
  for(let i=0;i<5+wave*2;i++)enemies.push(makeEnemy());
}
function updateEnemies(dt){
  for(const e of enemies){
    const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;
    e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt;
  }
}
function drawEnemies(){
  for(const e of enemies){
    ctx.save();ctx.globalAlpha=e.fade;
    const sx=e.x-e.size/2,sy=e.y-e.size/2;
    if(e.img.complete){ctx.drawImage(e.img,sx,sy,e.size,e.size);}
    else{ctx.fillStyle="lime";ctx.beginPath();ctx.arc(e.x,e.y,e.size/2,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}

// --- COLLISIONS ---
function checkCollisions(){
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    for(let j=bullets.length-1;j>=0;j--){
      const b=bullets[j];const dx=b.x-e.x,dy=b.y-e.y;
      if(dx*dx+dy*dy<(e.size/2+4)**2){
        bullets.splice(j,1);e.hp--;damage+=10;
        if(e.hp<=0){enemies.splice(i,1);kills++;}
        break;
      }
    }
  }
  if(enemies.length===0){wave++;spawnWave();}
}

// --- DAMAGE/DEATH ---
function applyDamage(d){
  player.hp=Math.max(0,player.hp-d);
  player.hitTimer=.3;player.invuln=.3;
  updateHealth();if(player.hp<=0)die();
}
function die(){
  state='dead';bgMusic.pause();bgMusic.currentTime=0;gridStatic=true;drawGrid();
  const deathSound=linkYell.cloneNode();deathSound.play().catch(()=>{});
  deathOverlay.classList.add('visible');
}
restartBtn.onclick=()=>{
  deathOverlay.classList.remove('visible');menu.style.display='flex';
  player.hp=100;updateHealth();enemies.length=0;bullets.length=0;
  kills=0;wave=1;damage=0;gridStatic=true;drawGrid();state='menu';
};

// --- LOOP ---
function update(dt){
  if(state!=='playing')return;
  updatePlayer(dt);for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;}
  updateEnemies(dt);checkCollisions();
  ctx.clearRect(0,0,W,H);drawGrid();drawPlayer();
  ctx.fillStyle="#f33";
  for(const b of bullets){ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();}
  drawEnemies();updateHUD();
}
function loop(){requestAnimationFrame(loop);update(0.016);}loop();

// --- INPUT ---
addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;});
document.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousedown',e=>{
  if(state!=='playing')return;
  if(e.button===0)shoot();else if(e.button===2)shotgunPulse();
});

// --- BUTTONS ---
document.getElementById('start').onclick=()=>{
  menu.style.display='none';gridStatic=false;bgMusic.currentTime=0;
  bgMusic.play().catch(()=>{});
  kills=0;wave=1;damage=0;player.hp=100;
  updateHealth();enemies.length=0;spawnWave();
  startTime=performance.now();state='playing';
};
document.getElementById('bossMode').onclick=()=>{
  menu.style.display='none';gridStatic=false;bgMusic.currentTime=0;
  bgMusic.play().catch(()=>{});
  kills=0;wave=6;damage=0;player.hp=100;
  updateHealth();enemies.length=0;spawnWave();
  startTime=performance.now();state='playing';
};

gridStatic=true;drawGrid();
