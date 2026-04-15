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

function requestOpenChat(focusSlash, runCommand){
  try{
    if (window.parent && window.parent !== window){
      window.parent.postMessage({ type: "openChatFromChild", seedSlash: !!focusSlash, autoSuggestSlash: !!focusSlash, runCommand: runCommand ? String(runCommand) : "" }, "*");
      return;
    }
  }catch(e){}
}

function toggleFullscreen(){
  if (requestHostFullscreen("toggle")) return;
  const elem = document.documentElement;
  if (!document.fullscreenElement){
    if (elem.requestFullscreen) elem.requestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}
