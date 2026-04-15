function requestHostFullscreen(action="toggle"){
  if (window.parent && window.parent !== window){
    try{
      window.parent.postMessage({ type: "tektite:fullscreen", action }, "*");
      return true;
    }catch(e){}
  }
  return false;
}

function postChatControllerAction(action){
  try{
    if (window.parent && window.parent !== window){
      window.parent.postMessage({ type: "tektite:chat-control", action }, "*");
    }
  }catch(e){}
}
