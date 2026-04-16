function formatKeyboardBinding(code){
  const map = {Space:'Space', Escape:'Esc', Slash:'/', ArrowLeft:'Left Arrow', ArrowRight:'Right Arrow', ArrowUp:'Up Arrow', ArrowDown:'Down Arrow', KeyF:'F', KeyM:'M', KeyQ:'Q', KeyA:'A', KeyD:'D', KeyW:'W', KeyS:'S'};
  if (!code) return 'Unbound';
  if (map[code]) return map[code];
  if (/^Mouse\d+$/.test(code)) return code === 'Mouse0' ? 'Left Click' : code === 'Mouse1' ? 'Middle Click' : code === 'Mouse2' ? 'Right Click' : code;
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  return code;
}

function mouseButtonToBinding(button){ return `Mouse${Number(button) || 0}`; }
