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
  "/game_speed": "Set game speed from -5 to 20. 0 loads static Wave 1/UFO staring contest; 1 is normal.",
  "/hearts": "Set max hearts to 1-99, or 100/MAX (e.g. /hearts 6 or /hearts 100)",
  "/help": "List all available commands",
  "/invert": "Toggle inverted colors",
  "/lives": "Set lives to 0-99, or 100/MAX (e.g. /lives 3 or /lives 100)",
  "/shields": "Set shields to 0-99, or 100/MAX (e.g. /shields 2 or /shields 100)",
  "/video_fx": "Toggle chromatic aberration + hue shifting on/off"
};

// Controller-editable /help command arguments.
// 100 still formats as MAX for inventory-style commands.
// /game_speed keeps literal 20 as max and allows -5..20.
const PAUSE_COMMAND_CONTROLS = {
  "/bombs": { type:"number", min:0, max:100, step:1, defaultValue:5, maxLabel:"MAX", note:"100 = MAX" },
  "/game_speed": { type:"number", min:-5, max:20, step:1, defaultValue:1, note:"0 = static UFO tableau, 1 = normal" },
  "/hearts": { type:"number", min:1, max:100, step:1, defaultValue:3, maxLabel:"MAX", note:"100 = MAX" },
  "/lives": { type:"number", min:0, max:100, step:1, defaultValue:1, maxLabel:"MAX", note:"100 = MAX" },
  "/shields": { type:"number", min:0, max:100, step:1, defaultValue:2, maxLabel:"MAX", note:"100 = MAX" }
};

function _parseCountOrInfinite(arg){
  const a = String(arg||"").trim().toLowerCase();
  if (!a) return null;
  if (a === "max" || a === "infinite" || a === "inf" || a === "\u221e" || a === "forever") return { infinite:true, value: 100 };
  const n = parseInt(a, 10);
  if (isNaN(n)) return null;
  if (n >= 100) return { infinite:true, value: 100 };
  return { infinite:false, value: Math.max(0, Math.min(99, n)) };
}

function clampPauseCommandNumber(command, value){
  const cfg = PAUSE_COMMAND_CONTROLS[command];
  if (!cfg || cfg.type !== "number") return value;
  const raw = Number(value);
  const parsed = Number.isFinite(raw) ? raw : cfg.defaultValue;
  return Math.max(cfg.min, Math.min(cfg.max, Math.round(parsed)));
}

function formatPauseCommandNumber(command, value){
  const cfg = PAUSE_COMMAND_CONTROLS[command];
  const n = clampPauseCommandNumber(command, value);
  if (cfg && cfg.maxLabel && n >= cfg.max) return cfg.maxLabel;
  return String(n);
}

function buildPauseCommand(command, value){
  if (!PAUSE_COMMAND_CONTROLS[command]) return command;
  return `${command} ${formatPauseCommandNumber(command, value)}`;
}

function getPauseHelpCommandFromNode(node){
  if (!node) return "";
  const cmd = node.getAttribute("data-cmd") || "";
  if (!cmd) return "";
  if (!PAUSE_COMMAND_CONTROLS[cmd]) return cmd;
  return buildPauseCommand(cmd, node.getAttribute("data-value"));
}

function updatePauseHelpCommandNode(node, delta){
  if (!node) return false;
  const cmd = node.getAttribute("data-cmd") || "";
  const cfg = PAUSE_COMMAND_CONTROLS[cmd];
  if (!cfg) return false;
  const current = clampPauseCommandNumber(cmd, node.getAttribute("data-value"));
  const next = clampPauseCommandNumber(cmd, current + ((cfg.step || 1) * delta));
  node.setAttribute("data-value", String(next));
  const strong = node.querySelector("strong");
  if (strong) strong.textContent = `${cmd} ${formatPauseCommandNumber(cmd, next)}`;
  return true;
}

// v1.96: Help UI (lists commands in the pause suggestion panel)
function showHelp(){
  if (!pauseCmdSuggest) return;

  const cmds = Object.keys(PAUSE_COMMANDS).sort((a,b)=>a.localeCompare(b));
  pauseCmdSuggest.style.display = "block";
  pauseCmdSuggest.innerHTML = cmds.map(cmd => {
    const desc = PAUSE_COMMANDS[cmd] || "";
    const cfg = PAUSE_COMMAND_CONTROLS[cmd];
    const valueAttr = cfg ? ` data-value="${cfg.defaultValue}"` : "";
    const rangeLine = cfg ? `<div style="font-size:11px;opacity:0.72;">Range: ${cfg.min}..${cfg.max}${cfg.note ? " • " + cfg.note : ""}</div>` : "";
    const controllerLine = cfg ? `<div style="font-size:11px;opacity:0.72;">Controller: \u25c0/\u25b6 changes #, A runs</div>` : "";
    return `<div data-cmd="${cmd}"${valueAttr} style="padding:6px 8px;border-radius:8px;margin-bottom:4px;background: rgba(0,255,102,0.08);outline:1px solid rgba(0,255,102,0.18);cursor:pointer;">
      <strong>${cmd}${cfg ? " " + formatPauseCommandNumber(cmd, cfg.defaultValue) : ""}</strong>
      <div style="font-size:12px;opacity:0.85;">${desc}</div>
      ${rangeLine}
      ${controllerLine}
    </div>`;
  }).join("");
}
