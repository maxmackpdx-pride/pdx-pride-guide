import test from 'node:test';
import assert from 'node:assert/strict';

// Leaflet only needs a browser-shaped global to load; waypointHtml itself is pure.
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='childNodes'?[]:el(),apply:()=>el(),set:()=>true});
globalThis.window??=globalThis;globalThis.document??=el();globalThis.screen??={};
try{globalThis.navigator??={userAgent:'node',platform:'node'};}catch{}
const {waypointHtml}=await import('../client/src/lib/livingMapWaypoints.ts');

const glow=html=>html.match(/<path class="wp-glow-ring"[^>]*stroke="([^"]*)"/)[1];
const ring=html=>html.match(/<path d="[^"]*" fill="#050506" stroke="([^"]*)"/)[1];

test('no category or closed: glow stroke equals ring and the icon is drawn',()=>{
  const html=waypointHtml({id:'venue',color:'#00FFFF'});
  assert.equal(glow(html),ring(html));
  assert.equal(glow(html),'#00FFFF');
  assert.doesNotMatch(html,/CLOSED/);
  assert.match(html,/<g transform="translate/);
});
test('category health: glow uses var(--neon-red); the outline keeps the base color',()=>{
  const html=waypointHtml({id:'venue',color:'#00FFFF',category:'health'});
  assert.equal(glow(html),'var(--neon-red)');
  assert.equal(ring(html),'#00FFFF');
});
test('unknown category and bloom keep the original glow',()=>{
  const unknown=waypointHtml({id:'venue',color:'#00FFFF',category:'nope'});
  assert.equal(glow(unknown),'#00FFFF');
  const bloom=waypointHtml({id:'venue',color:'#00FFFF',category:'health',bloom:true});
  assert.equal(glow(bloom),ring(bloom));
  assert.match(glow(bloom),/^url\(#/);
});
test('closed: CLOSED label replaces avatar/logo/icon in the shell',()=>{
  for(const extra of [{avatarUrl:'/a.png'},{logoUrl:'/l.png'},{logoUrl:'/l.png',alternateLogoUrl:'/m.png'},{}]){
    const html=waypointHtml({id:'venue',color:'#00FFFF',closed:true,...extra});
    assert.match(html,/>CLOSED<\/text>/);
    assert.doesNotMatch(html,/<image/);
    assert.doesNotMatch(html,/<g transform="translate/);
  }
  assert.doesNotMatch(waypointHtml({id:'venue',closed:false,logoUrl:'/l.png'}),/CLOSED/);
});
