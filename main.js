// v0.1 — proxy telemetry. No API yet. No secrets stored. No shame.
const promptEl = document.getElementById("prompt");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");

const mClarity = document.getElementById("mClarity");
const mSpecific = document.getElementById("mSpecific");
const mExplore = document.getElementById("mExplore");

const mClarityVal = document.getElementById("mClarityVal");
const mSpecificVal = document.getElementById("mSpecificVal");
const mExploreVal = document.getElementById("mExploreVal");

const btnAnalyze = document.getElementById("btnAnalyze");
const btnClear = document.getElementById("btnClear");
const btnAbout = document.getElementById("btnAbout");
const btnCloseAbout = document.getElementById("btnCloseAbout");
const about = document.getElementById("about");
const btnEnter = document.getElementById("btnEnter");

// ----- Proxy scoring (cheap + interpretable) -----
function clamp01(x){ return Math.max(0, Math.min(1, x)); }

function scorePrompt(text){
  const t = (text || "").trim();

  // Clarity proxy: structure signals + constraints
  const hasBullets = /(^|\n)\s*[-*]\s+/.test(t);
  const hasSteps = /\b(step|steps|1\)|2\)|first|second|then|next)\b/i.test(t);
  const hasConstraints = /\b(exactly|at least|no more than|must|avoid|include)\b/i.test(t);

  const words = t.length ? t.split(/\s+/).length : 0;
  const sentences = (t.match(/[.!?]/g) || []).length;

  let clarity = 0;
  clarity += hasBullets ? 0.25 : 0;
  clarity += hasSteps ? 0.25 : 0;
  clarity += hasConstraints ? 0.25 : 0;
  clarity += clamp01(words / 80) * 0.25;

  // Specificity proxy: nouns-ish density (hacky), numbers, proper nouns, concrete ask verbs
  const hasNumbers = /\d/.test(t);
  const hasQuoted = /"[^"]{3,}"/.test(t) || /'[^']{3,}'/.test(t);
  const hasExamplesAsk = /\b(example|examples|compare|table|criteria|checklist)\b/i.test(t);

  // crude "noun-ish": count words longer than 5 chars, minus common fillers
  const fillers = new Set(["really","very","maybe","kind","sort","stuff","things","anything","something","somehow","basically","like"]);
  const tokens = t.toLowerCase().split(/\s+/).filter(Boolean);
  const longish = tokens.filter(w => w.replace(/[^a-z]/g,"").length >= 6 && !fillers.has(w)).length;
  const longishRate = words ? (longish / words) : 0;

  let specific = 0;
  specific += hasNumbers ? 0.2 : 0;
  specific += hasQuoted ? 0.2 : 0;
  specific += hasExamplesAsk ? 0.2 : 0;
  specific += clamp01(longishRate / 0.18) * 0.4;

  // Exploration proxy: open-ended language vs narrow constraints
  const openWords = (t.match(/\b(brainstorm|wild|weird|surreal|metaphor|speculate|possibilities|interpret|ambiguous)\b/ig) || []).length;
  const hardConstraints = (t.match(/\b(exactly|only|must|never|avoid|strict|format)\b/ig) || []).length;
  let explore = 0.5 + (openWords * 0.06) - (hardConstraints * 0.08);
  explore = clamp01(explore);

  return {
    clarity: clamp01(clarity),
    specific: clamp01(specific),
    explore
  };
}

function setMeter(el, val01){
  el.style.width = `${Math.round(val01 * 100)}%`;
}

function renderScores(scores){
  setMeter(mClarity, scores.clarity);
  setMeter(mSpecific, scores.specific);
  setMeter(mExplore, scores.explore);

  mClarityVal.textContent = Math.round(scores.clarity * 100);
  mSpecificVal.textContent = Math.round(scores.specific * 100);
  mExploreVal.textContent = Math.round(scores.explore * 100);
}

// Live update while typing (your “dashboard lights”)
let typingTimer = null;
promptEl.addEventListener("input", () => {
  statusEl.textContent = "sensing…";
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    const scores = scorePrompt(promptEl.value);
    renderScores(scores);
    statusEl.textContent = "idle";
  }, 80);
});

btnAnalyze.addEventListener("click", () => {
  const text = promptEl.value.trim();
  if(!text){
    logEl.textContent = "log: empty prompt. nothing to analyze. try words.";
    return;
  }
  const scores = scorePrompt(text);
  renderScores(scores);

  const line = [
    `log:`,
    `clarity=${Math.round(scores.clarity*100)}`,
    `specificity=${Math.round(scores.specific*100)}`,
    `exploration=${Math.round(scores.explore*100)}`,
    ``,
    `tip: tighten constraints to raise clarity/specificity; loosen to raise exploration.`
  ].join(" ");
  logEl.textContent = line;
});

btnClear.addEventListener("click", () => {
  promptEl.value = "";
  renderScores({clarity:0, specific:0, explore:0});
  logEl.textContent = "log: cleared.";
});

btnAbout.addEventListener("click", () => about.showModal());
btnCloseAbout.addEventListener("click", () => about.close());
btnEnter.addEventListener("click", () => {
  logEl.textContent = "log: enter acknowledged. (Next: wire API preview sampling.)";
});

// ----- Animated noise canvas (cheap CRT vibe) -----
const canvas = document.getElementById("noise");
const ctx = canvas.getContext("2d", { alpha: true });

function resize(){
  canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
  canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
}
window.addEventListener("resize", resize);
resize();

function drawNoise(){
  const w = canvas.width, h = canvas.height;
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;

  // sparse noise for performance
  for(let i=0; i<data.length; i+=16){
    const v = (Math.random() * 255) | 0;
    data[i] = v;
    data[i+1] = v;
    data[i+2] = v;
    data[i+3] = 18;
  }
  ctx.putImageData(imageData, 0, 0);
  requestAnimationFrame(drawNoise);
}
drawNoise();
