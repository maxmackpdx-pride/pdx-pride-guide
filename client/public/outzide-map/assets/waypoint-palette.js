// Snapshot theme tokens before a marker pass mutates DOM. Reading computed
// colors between marker writes forces repeated style/layout work on WebKit.
// A fresh snapshot each pass preserves theme changes without a permanent cache.
export function readWaypointPalette(tokens,root=globalThis.document.documentElement,readStyle=globalThis.getComputedStyle){
 const style=readStyle(root),values=new Map();
 const color=token=>{if(!values.has(token))values.set(token,style.getPropertyValue(token).trim());return values.get(token);};
 const colors=Object.fromEntries(Object.entries(tokens).map(([kind,token])=>[kind,color(token)]));
 return {colors,closed:(color('--status-closed')||'#FF0000').toUpperCase()};
}
