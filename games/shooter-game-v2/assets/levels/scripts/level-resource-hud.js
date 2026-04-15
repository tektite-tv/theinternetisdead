function _syncBombHud(){
  if (powerupSlot){
    powerupSlot.style.display = (bombsCount > 0 || infiniteModeActive || bombsInfiniteActive) ? "flex" : "none";
  }
  if (powerupHint){
    if (infiniteModeActive || bombsInfiniteActive) powerupHint.textContent = "Press Q (\u221e)";
    else powerupHint.textContent = "Press Q" + (bombsCount > 1 ? (" x" + bombsCount) : "");
  }
}
