function requestHostFullscreen(action="toggle"){
  if (window.parent && window.parent !== window){
    try{
      window.parent.postMessage({ type: "tektite:fullscreen", action }, "*");
      return true;
    }catch(e){}
  }
  return false;
}
