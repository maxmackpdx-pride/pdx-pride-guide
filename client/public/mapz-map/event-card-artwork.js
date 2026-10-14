// Each card owns its clock; camera motion and countdown updates never reset it.
export function artworkDuration(face,random=Math.random){
 const r=Math.min(1,Math.max(0,random()));
 return face==='poster'?5:face==='logo'?4+r*3:6+r*2;
}
export function advanceArtwork(state,seconds,posterReady,calm=false,random=Math.random){
 if(calm)return 'info';
 if(seconds>=state.next){
  state.face=state.face==='info'?(posterReady?'poster':'logo'):state.face==='poster'?'logo':'info';
  state.changed=seconds;state.next=seconds+artworkDuration(state.face,random);
 }
 return state.face==='poster'&&!posterReady?'logo':state.face;
}
export function updateEventArtwork(item,seconds,calm){
 const media=item.querySelector('.event-hologram-brand');if(!media)return;
 let state=item.artworkState;
 if(!state){const faces=media.dataset.posterReady==='true'?['info','poster','logo']:['info','logo'];const face=faces[Math.floor(Math.random()*faces.length)];state=item.artworkState={face,next:seconds+artworkDuration(face)*(.15+Math.random()*.85),changed:-Infinity};}
 const face=advanceArtwork(state,seconds,media.dataset.posterReady==='true',calm);
 if(item.dataset.artworkFace!==face)item.dataset.artworkFace=face;
 item.classList.toggle('is-artwork-switching',!calm&&seconds-state.changed<.22);
}
