export function nextFlightPitchOffset(current,deltaY) {
  if(!Number.isFinite(deltaY)||deltaY===0)return Math.max(-20,Math.min(20,current));
  const step=Math.min(3,Math.max(.35,Math.abs(deltaY)*.025));
  return Math.max(-20,Math.min(20,current+Math.sign(deltaY)*step));
}
export const IOS_MAP_HANDLERS=['dragPan','dragRotate','scrollZoom','touchZoomRotate','touchPitch','keyboard','doubleClickZoom'];
export function trackpadGesture(event) {
  if(event.ctrlKey)return 'zoom';
  return Number.isFinite(event.deltaX)&&Number.isFinite(event.deltaY)&&(event.deltaX||event.deltaY)?'pan':'none';
}
export function trackpadPanDelta(delta,deltaMode=0) {
  const multiplier=deltaMode===1?16:deltaMode===2?120:1;
  return delta*multiplier;
}

// One idle timer; native map gestures stay disabled during the guided flight.
export function createMapExploration({map, pauseControl, message, reduced, isReady, onExplore, onFlightPitch, returnCamera, onResume, onMove}) {
  const container=map.getCanvasContainer(),canvas=map.getCanvas();
  const handlers=IOS_MAP_HANDLERS;
  const pointers=new Set();
  let panFrame=0,panX=0,panY=0;
  function flushPan(){
    panFrame=0;
    const offset=[panX,panY];panX=panY=0;
    if(disposed||mode!=='exploring')return;
    map.panBy(offset,{duration:0});onMove();
  }
  function cancelPan(){cancelAnimationFrame(panFrame);panFrame=0;panX=panY=0;}
  let mode='flight',idleTimer=0,returnEnd=null,disposed=false,instructionDismissed=false;
  try{instructionDismissed=localStorage.getItem('zaydar-exploration-seen')==='1';}catch{}
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','Portland map. Click or drag to pause and explore.');

  function setGestures(enabled) {
    for(const name of handlers)map[name][enabled?'enable':'disable']();
    if(enabled)map.touchZoomRotate.enableRotation();
    container.classList.toggle('is-exploring',enabled);
  }
  function clearIdle(){clearTimeout(idleTimer);idleTimer=0;}
  function noteActivity() {
    clearIdle();
    // Interactive browsing remains where the user leaves it.
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
      if(!instructionDismissed)message.textContent='Drag or zoom to explore';
    }
    noteActivity();
  }
  function returnToFlight() {
    if(disposed||mode==='flight')return;
    clearIdle();cancelPan();stopReturn();pointers.clear();mode='returning';
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
    if(event.button!==0&&event.button!==2&&event.pointerType!=='touch')return;
    explore();
    if(mode==='exploring'){pointers.add(event.pointerId);clearIdle();}
  }
  function pointerMove(event){if(pointers.has(event.pointerId))noteActivity();}
  function pointerUp(event){if(pointers.delete(event.pointerId))noteActivity();}
  function wheel(event){
    if(mode==='flight'){
      event.preventDefault();event.stopPropagation();onFlightPitch(event.deltaY);noteActivity();return;
    }
    explore();
    const gesture=trackpadGesture(event);
    if(gesture==='pan'){
      event.preventDefault();event.stopPropagation();
      panX+=trackpadPanDelta(event.deltaX,event.deltaMode);panY+=trackpadPanDelta(event.deltaY,event.deltaMode);
      if(!panFrame)panFrame=requestAnimationFrame(flushPan);
      noteActivity();
    }
  }
  function keyDown(event) {
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','_'].includes(event.key))explore();
  }
  function pauseInput(){if(pauseControl.checked)explore();else returnToFlight();}
  function move() {
    if(mode==='flight')return;
    if(mode==='exploring'){
      noteActivity();
      if(!instructionDismissed){instructionDismissed=true;message.textContent='';try{localStorage.setItem('zaydar-exploration-seen','1');}catch{}}
    }
    onMove();
  }
  function visibility() {
    if(document.hidden){clearIdle();pointers.clear();if(mode==='returning')stopReturn();}
    else if(mode==='returning')returnToFlight();
    else noteActivity();
  }
  function blur(){pointers.clear();noteActivity();}
  let clampingBearing=false;
  function constrainBearing(){
    if(clampingBearing||mode!=='exploring')return;
    const bearing=map.getBearing(),bounded=Math.max(-40,Math.min(40,bearing));
    if(bearing===bounded)return;
    clampingBearing=true;
    try{map.setBearing(bounded);}finally{clampingBearing=false;}
  }
  setGestures(false);
  container.addEventListener('pointerdown',pointerDown,{capture:true,passive:true});
  container.addEventListener('wheel',wheel,{capture:true,passive:false});
  container.addEventListener('keydown',keyDown,true);
  window.addEventListener('pointermove',pointerMove,{passive:true});
  window.addEventListener('pointerup',pointerUp,{passive:true});
  window.addEventListener('pointercancel',pointerUp,{passive:true});
  window.addEventListener('blur',blur);
  pauseControl.addEventListener('input',pauseInput);
  document.addEventListener('visibilitychange',visibility);
  map.on('move',move);
  map.on('rotate',constrainBearing);
  return {
    get mode(){return mode;},noteActivity,
    dispose(){
      disposed=true;clearIdle();cancelPan();stopReturn();setGestures(false);
      container.removeEventListener('pointerdown',pointerDown,true);
      container.removeEventListener('wheel',wheel,true);
      container.removeEventListener('keydown',keyDown,true);
      window.removeEventListener('pointermove',pointerMove);
      window.removeEventListener('pointerup',pointerUp);
      window.removeEventListener('pointercancel',pointerUp);
      window.removeEventListener('blur',blur);
      pauseControl.removeEventListener('input',pauseInput);
      document.removeEventListener('visibilitychange',visibility);
      map.off('move',move);map.off('rotate',constrainBearing);pointers.clear();
    }
  };
}
