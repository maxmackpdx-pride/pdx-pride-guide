/** Embedded consumers share the engine's CSS, but must not inherit its full-page
 * html/body/#root sizing. Preserve the surrounding page's exact overflow policy
 * and scroll position until the last embedded card/picker has released it. */
let users=0;let style:HTMLStyleElement|undefined;let position:[number,number]=[0,0];
export function captureMapDocumentPosition():[number,number]{
 const locked=document.body.style.position==='fixed';
 const top=Number.parseFloat(document.body.style.top),left=Number.parseFloat(document.body.style.left);
 return [locked&&Number.isFinite(left)?-left:window.scrollX,locked&&Number.isFinite(top)?-top:window.scrollY];
}
export function preserveMapDocument(){
 if(users++===0){
  // useModalA11y may already have locked the body before this effect runs.
  // Its negative top encodes the real pre-modal scroll, not window.scrollY=0.
  position=captureMapDocumentPosition();
  const selectors=['html','body','#root'];
  style=document.createElement('style');style.dataset.embeddedMapLayout='preserve';
  style.textContent=selectors.map(selector=>{
   const node=document.querySelector(selector);if(!node)return '';
   const value=getComputedStyle(node);
   return `${selector}{height:auto!important;overflow-x:${value.overflowX}!important;overflow-y:${value.overflowY}!important}`;
  }).join('\n');
  document.head.appendChild(style);
 }
 let released=false;
 return()=>{if(released)return;released=true;if(--users===0){style?.remove();style=undefined;window.scrollTo(...position);}};
}
