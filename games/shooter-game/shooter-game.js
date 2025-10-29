/* ===========================================================
   Bananarama Apocalypse v6 — "Wave Function Collapse"
   ===========================================================
   ✦ Progressive difficulty waves restored
   ✦ Twin bosses for INSANE mode
   ✦ Bullet collisions + GIF backgrounds + pushback
   =========================================================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
function fitCanvas(){canvas.width=innerWidth;canvas.height=innerHeight;}
fitCanvas();
addEventListener("resize",fitCanvas);

// --- UI ---
const ui={
  kills:document.getElementById("kills"),
  deaths:document.getElementById("deaths"),
  health:document.getElementById("health"),
  restart:document.getElementById("restart")
};

// --- MENU ---
const menu=document.getElementById("menu");
const startBtn=document.getElementById("startBtn");

const bossBtn=document.createElement("button");
bossBtn.textContent="Boss Mode";
bossBtn.className="menu-button";
menu.appendChild(bossBtn);

const insaneBtn=document.createElement("button");
insaneBtn.textContent="INSANE BOSS MODE";
insaneBtn.className="menu-button";
insaneBtn.style.background="#ff3333";
insaneBtn.style.color="white";
menu.appendChild(insaneBtn);

const optionsBtn=document.getElementById("optionsBtn");
const optionsMenu=document.getElementById("optionsMenu");
const backBtn=document.getElementById("backBtn");
const bgSelect=document.getElementById("bgSelect");
const uploadBtn=document.getElementById("uploadBgBtn");
const bgUpload=document.getElementById("bgUpload");

let backgroundColor="#000";
let customBg=null;
let customBgURL=null;
document.getElementById("ui").classList.add("hidden");

// --- MENU LOGIC ---
startBtn.onclick=()=>startGame("normal");
bossBtn.onclick=()=>startGame("boss");
insaneBtn.onclick=()=>startGame("insane");

function startGame(mode){
  menu.classList.add("hidden");
  document.getElementById("ui").classList.remove("hidden");
  resetGame();
  gameRunning=true;
  if(mode==="normal")spawnEnemyWave(5);
  if(mode==="boss")spawnBoss();
  if(mode==="insane")spawnInsaneBossMode();

  const angle=Math.random()*Math.PI*2;
  const safe=400;
  player.x=canvas.width/2+Math.cos(angle)*safe;
  player.y=canvas.height/2+Math.sin(angle)*safe;
  player.x=Math.max(100,Math.min(canvas.width-100,player.x));
  player.y=Math.max(100,Math.min(canvas.height-100,player.y));
  startTimer();
}

optionsBtn.onclick=()=>{
  optionsMenu.classList.remove("hidden");
  startBtn.style.display="none";
  bossBtn.style.display="none";
  insaneBtn.style.display="none";
  optionsBtn.style.display="none";
};
backBtn.onclick=()=>{
  optionsMenu.classList.add("hidden");
  startBtn.style.display="inline-block";
  bossBtn.style.display="inline-block";
  insaneBtn.style.display="inline-block";
  optionsBtn.style.display="inline-block";
};

// --- BACKGROUND ---
bgSelect.onchange=()=>{
  const colors={black:"#000",green:"#002b00",blue:"#001133",purple:"#150021"};
  backgroundColor=colors[bgSelect.value]||"#000";
  customBg=null;
};
uploadBtn.onclick=()=>bgUpload.click();
bgUpload.onchange=e=>{
  const file=e.target.files[0];
  if(!file)return;
  if(customBgURL)URL.revokeObjectURL(customBgURL);
  customBgURL=URL.createObjectURL(file);
  const img=new Image();
  img.src=customBgURL;
  img.onload=()=>{customBg=img;backgroundColor=null;};
};

// --- GAME VARS ---
const basePath="/media/images/gifs/";
const enemyFiles=[
  "dancing-guy.gif","dancingzoidberg.gif","dragon.gif","eyes.gif",
  "fatspiderman.gif","firework.gif","frog.gif","keyboard_smash.gif","skeleton.gif"
];
let imagesLoaded=false,enemyImages={},playerImg,bossImg;
let gameRunning=false,paused=false,gameOver=false;
let bosses=[],enemies=[],bullets=[],lightnings=[];
let kills=0,deaths=0,health=100,stamina=100;
let frameCount=0,wave=1;
let pushCharges=3,pushCooldown=false,cooldownTimer=0,pushFxTimer=0;
let gameTimer=0,timerInterval=null;

function startTimer(){
  gameTimer=0;clearInterval(timerInterval);
  timerInterval=setInterval(()=>{if(!paused&&gameRunning&&!gameOver)gameTimer+=0.016;},16);
}
function stopTimer(){clearInterval(timerInterval);}

// --- CONTROLS ---
const keys={w:false,a:false,s:false,d:false,space:false};
addEventListener("keydown",e=>{
  const k=e.key.toLowerCase();
  if(k in keys)keys[k]=true;
  if(e.code==="Space"){keys.space=true;e.preventDefault();}
  if(e.code==="Escape")paused=!paused;
});
addEventListener("keyup",e=>{
  const k=e.key.toLowerCase();
  if(k in keys)keys[k]=false;
  if(e.code==="Space"){keys.space=false;e.preventDefault();}
});
ui.restart.onclick=resetGame;

// --- PLAYER ---
const player={x:canvas.width/2,y:canvas.height/2,speed:4,size:64};
let mouseX=player.x,mouseY=player.y,aimAngle=0;
canvas.addEventListener("mousemove",e=>{mouseX=e.clientX;mouseY=e.clientY;});
canvas.addEventListener("mousedown",()=>{
  if(!gameOver&&imagesLoaded&&gameRunning&&!paused){
    const angle=Math.atan2(mouseY-player.y,mouseX-player.x);
    shootBullet(angle);
  }
});

// --- LOAD IMAGES ---
function loadImage(src){return new Promise(r=>{const i=new Image();i.src=src;i.onload=()=>r(i);});}
Promise.all([
  loadImage(basePath+"bananarama.gif"),
  loadImage(basePath+"180px-NO_U_cycle.gif"),
  ...enemyFiles.map(f=>loadImage(basePath+f))
]).then(loaded=>{
  playerImg=loaded[0];
  bossImg=loaded[1];
  enemyFiles.forEach((f,i)=>(enemyImages[f]=loaded[i+2]));
  imagesLoaded=true;
  init();
});

// --- ENEMIES ---
function spawnEnemyWave(count){for(let i=0;i<count;i++)spawnEnemy();}
function spawnEnemy(){
  const side=Math.floor(Math.random()*4);
  let x,y;
  if(side===0){x=Math.random()*canvas.width;y=-50;}
  if(side===1){x=canvas.width+50;y=Math.random()*canvas.height;}
  if(side===2){x=Math.random()*canvas.width;y=canvas.height+50;}
  if(side===3){x=-50;y=Math.random()*canvas.height;}
  const size=Math.random()*40+40,hp=size*(0.4+wave*0.1),speed=0.8+Math.random()*0.5+wave*0.1;
  const file=enemyFiles[Math.floor(Math.random()*enemyFiles.length)];
  enemies.push({x,y,size,speed,img:enemyImages[file],health:hp,vx:0,vy:0,knock:0});
}

// --- SHOOT ---
function shootBullet(angle){
  bullets.push({x:player.x,y:player.y,angle,speed:12,life:60});
  aimAngle=angle;
}

// --- BOSSES ---
function spawnBoss(x=canvas.width/2,y=canvas.height/3){
  const b={x,y,size:180,speed:1.2,img:bossImg,health:1000,orbiters:[],flashTimer:0,shootTimer:150};
  for(let i=0;i<4;i++){
    b.orbiters.push({angle:(Math.PI/2)*i,radius:150,size:90,speed:0.13,img:bossImg,health:150,vx:0,vy:0,knock:0,shootTimer:Math.random()*100});
  }
  bosses.push(b);
}
function spawnInsaneBossMode(){bosses=[];spawnBoss(250,150);spawnBoss(canvas.width-250,150);}

// --- UPDATE ---
function update(){
  if(!gameRunning||gameOver||!imagesLoaded||paused)return;
  frameCount++;

  // Player movement
  let dx=0,dy=0;
  if(keys.w)dy-=player.speed;if(keys.s)dy+=player.speed;if(keys.a)dx-=player.speed;if(keys.d)dx+=player.speed;
  player.x=Math.max(0,Math.min(canvas.width,player.x+dx));
  player.y=Math.max(0,Math.min(canvas.height,player.y+dy));
  if(keys.space){pushBackEnemies();keys.space=false;}
  if(!pushCooldown&&stamina<100)stamina+=0.12;
  if(pushCooldown){cooldownTimer--;if(cooldownTimer<=0){pushCooldown=false;pushCharges=3;}}
  aimAngle=Math.atan2(mouseY-player.y,mouseX-player.x);

  bullets.forEach(b=>{b.x+=Math.cos(b.angle)*b.speed;b.y+=Math.sin(b.angle)*b.speed;b.life--;});
  bullets=bullets.filter(b=>b.life>0);
  lightnings.forEach(l=>{l.x+=Math.cos(l.angle)*l.speed;l.y+=Math.sin(l.angle)*l.speed;l.life--;});
  lightnings=lightnings.filter(l=>l.life>0);

  // Enemy updates
  enemies.forEach((e)=>{
    if(e.knock>0){e.x+=e.vx;e.y+=e.vy;e.vx*=0.88;e.vy*=0.88;e.knock--;}
    else{const a=Math.atan2(player.y-e.y,player.x-e.x);e.x+=Math.cos(a)*e.speed;e.y+=Math.sin(a)*e.speed;}
    const dist=Math.hypot(player.x-e.x,player.y-e.y);
    if(dist<e.size/2+player.size/2){health-=0.5;if(health<=0)endGame();}
  });

  // bullet collisions
  bullets.forEach((b,bi)=>{
    enemies.forEach((e,ei)=>{
      if(Math.hypot(b.x-e.x,b.y-e.y)<e.size/2){
        e.health-=25;bullets.splice(bi,1);
        if(e.health<=0){kills++;enemies.splice(ei,1);}
      }
    });
    bosses.forEach(boss=>{
      if(Math.hypot(b.x-boss.x,b.y-boss.y)<boss.size/2){boss.health-=10;bullets.splice(bi,1);}
      boss.orbiters.forEach(o=>{
        if(Math.hypot(b.x-o.x,b.y-o.y)<o.size/2){o.health-=20;bullets.splice(bi,1);}
      });
    });
  });

  // Boss behavior
  bosses.forEach((boss,bi)=>{
    boss.x+=Math.sin(frameCount/60+bi)*2;
    boss.y+=Math.cos(frameCount/80+bi)*1.5;
    boss.orbiters=boss.orbiters.filter(o=>o.health>0);
    boss.orbiters.forEach(o=>{
      if(o.knock>0){o.x+=o.vx;o.y+=o.vy;o.vx*=0.9;o.vy*=0.9;o.knock--;}
      else{o.angle+=o.speed;o.x=boss.x+Math.cos(o.angle)*o.radius;o.y=boss.y+Math.sin(o.angle)*o.radius;}
      o.shootTimer--;
      if(o.shootTimer<=0){
        const ang=Math.atan2(player.y-o.y,player.x-o.x);
        lightnings.push({x:o.x,y:o.y,angle:ang,speed:14,life:140,width:5,length:60});
        o.shootTimer=150+Math.random()*50;
      }
    });
  });
  bosses=bosses.filter(b=>b.health>0);

  // Lightnings hurt
  lightnings.forEach(l=>{if(Math.hypot(player.x-l.x,player.y-l.y)<60){health-=7;if(health<=0)endGame();}});
  ui.kills.textContent=kills;
  ui.health.textContent=Math.max(0,Math.floor(health));

  // --- WAVE SYSTEM ---
  if(enemies.length===0 && bosses.length===0 && !gameOver){
    if(kills>=50 && !bosses.length){spawnBoss();} // optional midboss
    else{
      wave++;
      spawnEnemyWave(5 + wave * 3);
    }
  }
}

// --- DRAW ---
function draw(){
  if(customBg)ctx.drawImage(customBg,0,0,canvas.width,canvas.height);
  else{ctx.fillStyle=backgroundColor||"#000";ctx.fillRect(0,0,canvas.width,canvas.height);}
  if(!imagesLoaded){ctx.fillStyle="#00ff99";ctx.font="30px monospace";ctx.fillText("Loading...",canvas.width/2-80,canvas.height/2);return;}
  if(!gameRunning)return;

  ctx.drawImage(playerImg,player.x-player.size/2,player.y-player.size/2,player.size,player.size);

  bullets.forEach(b=>{
    ctx.save();ctx.fillStyle="#ff66cc";ctx.shadowColor="#ff66cc";ctx.shadowBlur=15;
    ctx.beginPath();ctx.arc(b.x,b.y,6,0,Math.PI*2);ctx.fill();ctx.restore();
  });

  lightnings.forEach(l=>{
    ctx.save();ctx.strokeStyle="cyan";ctx.lineWidth=l.width;
    ctx.beginPath();ctx.moveTo(l.x,l.y);
    ctx.lineTo(l.x-Math.cos(l.angle)*l.length,l.y-Math.sin(l.angle)*l.length);
    ctx.stroke();ctx.restore();
  });

  enemies.forEach(e=>ctx.drawImage(e.img,e.x-e.size/2,e.y-e.size/2,e.size,e.size));
  bosses.forEach(boss=>{
    ctx.drawImage(boss.img,boss.x-boss.size/2,boss.y-boss.size/2,boss.size,boss.size);
    boss.orbiters.forEach(o=>ctx.drawImage(o.img,o.x-o.size/2,o.y-o.size/2,o.size,o.size));
  });

  drawBar("HEALTH",20,50,health,100,"#ff3333",true);
  drawBar("STAMINA",20,25,stamina,100,pushCooldown?"#333333":"#00ccff",true);
  ctx.fillStyle="#00ff99";ctx.font="20px monospace";ctx.textAlign="right";
  ctx.fillText(`Wave ${wave} | Time: ${gameTimer.toFixed(1)}s`,canvas.width-20,canvas.height-20);
  if(gameOver){ctx.fillStyle="red";ctx.font="80px Impact";ctx.textAlign="center";ctx.fillText("YOU DIED",canvas.width/2,canvas.height/2);}
}

// --- UTIL ---
function drawBar(label,x,y,value,max,color,alignBottom=false){
  const w=220,h=15,baseY=alignBottom?canvas.height-y-h:y;
  ctx.fillStyle="black";ctx.fillRect(x-2,baseY-2,w+4,h+4);
  ctx.fillStyle=color;ctx.fillRect(x,baseY,(value/max)*w,h);
  ctx.strokeStyle="#00ff99";ctx.strokeRect(x-2,baseY-2,w+4,h+4);
  ctx.fillStyle="#00ff99";ctx.font="12px monospace";ctx.fillText(label,x,baseY-6);
}
function pushBackEnemies(){
  if(pushCooldown||pushCharges<=0||stamina<20)return;
  pushCharges--;stamina=Math.max(0,stamina-35);pushFxTimer=18;
  const radius=320,maxKick=18,stunFrames=16;
  enemies.forEach(e=>{
    const dx=e.x-player.x,dy=e.y-player.y,dist=Math.hypot(dx,dy)||0.001;
    if(dist<radius){const f=maxKick*(1-dist/radius);e.vx+=(dx/dist)*f;e.vy+=(dy/dist)*f;e.knock=stunFrames;}
  });
  if(pushCharges===0){pushCooldown=true;cooldownTimer=300;}
}
function endGame(){if(!gameOver){gameOver=true;deaths++;ui.deaths.textContent=deaths;stopTimer();}}
function resetGame(){
  enemies.length=0;bullets.length=0;lightnings.length=0;bosses.length=0;
  kills=0;health=100;stamina=100;gameOver=false;pushCharges=3;pushCooldown=false;
  cooldownTimer=0;pushFxTimer=0;wave=1;paused=false;stopTimer();
}
function init(){requestAnimationFrame(loop);}
function loop(){update();draw();requestAnimationFrame(loop);}
