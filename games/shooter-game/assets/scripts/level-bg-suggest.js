function bgPrefix(v){ return String(v||"").startsWith(BG_CMD + " "); }
function bgTyped(v){ return bgPrefix(v) ? String(v||"").slice((BG_CMD + " ").length) : ""; }
function norm(s){ return String(s||"").trim().toLowerCase(); }

function buildBgList(typed){
  const t = norm(typed);
  const list = BG_COLORS.filter(c => norm(c).startsWith(t));

  // v1.96: if the user is typing a hex-like token, keep it as a selectable suggestion
  // Example: "/background_color #1a2b" should let them continue typing without being "corrected" to a named color.
  const looksHexy = /^#?[0-9a-fA-F]{1,8}$/.test(String(typed||"").trim());
  if (looksHexy && t.length){
    const token = String(typed||"").trim().startsWith("#") ? String(typed||"").trim() : ("#" + String(typed||"").trim());
    const out = [token];
    for (const c of (list.length ? list : BG_COLORS)) if (!out.includes(c)) out.push(c);
    return out;
  }

  return list.length ? list : BG_COLORS.slice();
}

function renderBgSuggest(){
  if (!pauseCmdSuggest) return;
  if (!bgSuggestOpen){
    pauseCmdSuggest.style.display = "none";
    pauseCmdSuggest.innerHTML = "";
    return;
  }
  pauseCmdSuggest.style.display = "block";
  pauseCmdSuggest.innerHTML = bgSuggestList.map((c,i)=>{
    const active = (i===bgSuggestIndex);
    return `<div data-i="${i}" style="padding:6px 6px;border-radius:8px;${active ? 'background: rgba(0,255,102,0.12); outline:1px solid rgba(0,255,102,0.25);' : ''}">
      <span style="display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:8px;vertical-align:middle;background:${c};border:1px solid rgba(255,255,255,0.18);"></span>
      <span>${c}</span>
    </div>`;
  }).join("");
  const activeEl = pauseCmdSuggest.querySelector(`div[data-i="${bgSuggestIndex}"]`);
  if (activeEl && activeEl.scrollIntoView) activeEl.scrollIntoView({ block: "nearest" });
}

function openBgSuggestFromValue(v){
  bgSuggestOpen = true;
  bgSuggestList = buildBgList(bgTyped(v));
  bgSuggestIndex = 0;
  renderBgSuggest();
}
function closeBgSuggest(){ bgSuggestOpen = false; renderBgSuggest(); }

function applyBgChoiceToInput(){
  if (!pauseCommand) return;
  if (!bgSuggestOpen || !bgSuggestList.length) return;
  const chosen = bgSuggestList[bgSuggestIndex] || bgSuggestList[0];
  pauseCommand.value = BG_CMD + " " + chosen;
}

function cycleBgChoice(dir){
  if (!bgSuggestOpen) return;
  const n = bgSuggestList.length;
  if (!n) return;
  bgSuggestIndex = (bgSuggestIndex + dir) % n;
  if (bgSuggestIndex < 0) bgSuggestIndex += n;
  renderBgSuggest();
}
