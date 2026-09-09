// One idle timer; native map gestures stay disabled during the guided flight.
export function createMapExploration({map, pauseControl, message, reduced, isReady, isVisible=()=>!document.hidden, onExplore, returnCamera, onResume, onMove}) {
  const container=map.getCanvasContainer(),canvas=map.getCanvas();
  const handlers=['dragPan','scrollZoom','touchZoomRotate','keyboard','doubleClickZoom'];
  const pointers=new Set();
  let mode='flight',idleTimer=0,returnEnd=null,disposed=false;
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','Portland map. Click or drag to pause and explore.');

  function setGestures(enabled) {
    for(const name of handlers)map[name][enabled?'enable':'disable']();
    // Keep the horizon steady while allowing touch pinch zoom.
    map.touchZoomRotate.disableRotation();
    container.classList.toggle('is-exploring',enabled);
  }
  function clearIdle(){clearTimeout(idleTimer);idleTimer=0;}
  function noteActivity() {
    clearIdle();
    if(mode==='exploring'&&!pointers.size&&isVisible()&&!disposed)
      idleTimer=setTimeout(returnToFlight,15000);
  }
  function stopReturn() {
    if(returnEnd){map.off('moveend',returnEnd);returnEnd=null;}
    map.stop();
  }
  function explore() {
    if(disposed||!isReady()){pauseControl.checked=false;return;}
    if(mode!=='exploring') {
      stopReturn();mode='exploring';pauseControl.checked=true;
      onExplore();setGestures(true);
      message.textContent='Drag or zoom to explore · Flight resumes after 15 seconds idle';
    }
    noteActivity();
  }
  function returnToFlight() {
    if(disposed||mode==='flight')return;
    clearIdle();stopReturn();pointers.clear();mode='returning';
    pauseControl.checked=false;setGestures(false);
    message.textContent='Returning to the flight path…';
    returnEnd=()=>{
      map.off('moveend',returnEnd);returnEnd=null;
      mode='flight';message.textContent='';onResume();
    };
    map.on('moveend',returnEnd);
    map.easeTo({...returnCamera(),duration:reduced.matches?0:5000,easing:t=>t*t*t*(t*(t*6-15)+10)});
  }
  function pointerDown(event) {
    if(event.button!==0&&event.pointerType!=='touch')return;
    explore();
    if(mode==='exploring'){pointers.add(event.pointerId);clearIdle();}
  }
  function pointerMove(event){if(pointers.has(event.pointerId))noteActivity();}
  function pointerUp(event){if(pointers.delete(event.pointerId))noteActivity();}
  function wheel(){if(mode==='exploring')noteActivity();}
  function keyDown(event) {
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','_'].includes(event.key))explore();
  }
  function pauseInput(){if(pauseControl.checked)explore();else returnToFlight();}
  function move() {
    if(mode==='flight')return;
    if(mode==='exploring')noteActivity();
    onMove();
  }
  function visibility() {
    if(!isVisible()){clearIdle();pointers.clear();if(mode==='returning')stopReturn();}
    else if(mode==='returning')returnToFlight();
    else noteActivity();
  }
  function blur(){pointers.clear();noteActivity();}
  setGestures(false);
  container.addEventListener('pointerdown',pointerDown,{capture:true,passive:true});
  container.addEventListener('wheel',wheel,{capture:true,passive:true});
  container.addEventListener('keydown',keyDown,true);
  window.addEventListener('pointermove',pointerMove,{passive:true});
  window.addEventListener('pointerup',pointerUp,{passive:true});
  window.addEventListener('pointercancel',pointerUp,{passive:true});
  window.addEventListener('blur',blur);
  pauseControl.addEventListener('input',pauseInput);
  document.addEventListener('visibilitychange',visibility);
  window.addEventListener('flightvisibilitychange',visibility);
  map.on('move',move);
  return {
    get mode(){return mode;},noteActivity,
    dispose(){
      disposed=true;clearIdle();stopReturn();setGestures(false);
      container.removeEventListener('pointerdown',pointerDown,true);
      container.removeEventListener('wheel',wheel,true);
      container.removeEventListener('keydown',keyDown,true);
      window.removeEventListener('pointermove',pointerMove);
      window.removeEventListener('pointerup',pointerUp);
      window.removeEventListener('pointercancel',pointerUp);
      window.removeEventListener('blur',blur);
      pauseControl.removeEventListener('input',pauseInput);
      document.removeEventListener('visibilitychange',visibility);
      window.removeEventListener('flightvisibilitychange',visibility);
      map.off('move',move);pointers.clear();
    }
  };
}
