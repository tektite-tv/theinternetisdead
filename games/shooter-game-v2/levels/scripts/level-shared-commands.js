// v1.96: /background_color autocomplete + executor
const BG_CMD = "/background_color";
const BG_COLORS = [
  "black","white","navy","midnightblue","darkslateblue","indigo","purple","darkmagenta",
  "maroon","darkred","crimson","firebrick",
  "darkgreen","seagreen","teal","darkcyan",
  "darkslategray","dimgray","slategray",
  "#000000","#0b1020","#111827","#1f2937","#0f172a","#020617",
  "#300000","#001a33","#002b36","#003300","#1a0033","#2a0030"
];

// v1.96: Pause command registry for /help output (kept alphabetizable)
const PAUSE_COMMANDS = {
  "/background_color": "Set starfield background color (name or hex)",
  "/bombs": "Set bombs to 0-99, or 100/MAX (e.g. /bombs 5 or /bombs 100)",
  "/fullscreen": "Toggle fullscreen mode",
  "/hearts": "Set max hearts to 1-99, or 100/MAX (e.g. /hearts 6 or /hearts 100)",
  "/help": "List all available commands",
  "/invert": "Toggle inverted colors",
  "/lives": "Set lives to 0-99, or 100/MAX (e.g. /lives 3 or /lives 100)",
  "/shields": "Set shields to 0-99, or 100/MAX (e.g. /shields 2 or /shields 100)",
  "/video_fx": "Toggle chromatic aberration + hue shifting on/off"
};

// v1.96: Help UI (lists commands in the pause suggestion panel)
function showHelp(){
  if (!pauseCmdSuggest) return;

  const cmds = Object.keys(PAUSE_COMMANDS).sort((a,b)=>a.localeCompare(b));
  pauseCmdSuggest.style.display = "block";
  pauseCmdSuggest.innerHTML = cmds.map(cmd => {
    const desc = PAUSE_COMMANDS[cmd] || "";
    return `<div data-cmd="${cmd}" style="padding:6px 8px;border-radius:8px;margin-bottom:4px;background: rgba(0,255,102,0.08);outline:1px solid rgba(0,255,102,0.18);cursor:pointer;">
      <strong>${cmd}</strong>
      <div style="font-size:12px;opacity:0.85;">${desc}</div>
    </div>`;
  }).join("");
}
