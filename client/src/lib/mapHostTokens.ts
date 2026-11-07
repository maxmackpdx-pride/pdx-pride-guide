const tokens=['--neon-magenta','--neon-orange','--neon-green','--neon-cyan','--neon-violet','--neon-yellow','--neon-red','--neon-blue','--text-heading','--day-mon','--day-tue','--day-wed','--day-thu','--day-fri','--day-sat','--day-sun'];
/** Exact serialization only, never nearest-color substitution. CSS minifiers can
 * legally serialize #FF0000 as red; the pinned API adapter requires hex. */
export function opaqueRgbHex(value:string):string|undefined{
 const match=value.trim().match(/^rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)(?:\s*[,/]\s*(1(?:\.0+)?))?\s*\)$/i);
 if(!match)return;const channels=match.slice(1,4).map(Number);if(channels.some(n=>n>255))return;return '#'+channels.map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
}
export function normalizeMapHostTokens(root=document.documentElement){
 const previous:{token:string;value:string;priority:string}[]=[];
 const probe=document.createElement('span');probe.hidden=true;root.appendChild(probe);
 try{for(const token of tokens){const value=getComputedStyle(root).getPropertyValue(token).trim();if(!value||/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value)||!CSS.supports('color',value))continue;probe.style.color=value;const hex=opaqueRgbHex(getComputedStyle(probe).color);if(!hex)continue;previous.push({token,value:root.style.getPropertyValue(token),priority:root.style.getPropertyPriority(token)});root.style.setProperty(token,hex);}}
 finally{probe.remove();}
 return()=>{for(const entry of previous)if(entry.value)root.style.setProperty(entry.token,entry.value,entry.priority);else root.style.removeProperty(entry.token);};
}
