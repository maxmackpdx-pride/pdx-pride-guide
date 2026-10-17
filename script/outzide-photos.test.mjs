import test from 'node:test';
import assert from 'node:assert/strict';
import {createPhotoMotion,photoMarkup,photoUrl} from '../client/public/outzide-map/assets/destination-photos.js';
function events(){const listeners=new Map();return {listeners,addEventListener(t,f){if(!listeners.has(t))listeners.set(t,new Set());listeners.get(t).add(f)},removeEventListener(t,f){listeners.get(t)?.delete(f)},emit(t){listeners.get(t)?.forEach(f=>f({}))}}}
function fixture(){
 const doc={...events(),hidden:false,documentElement:{classList:{contains(){return false}},dataset:{}}};
 const fine={...events(),matches:true},reduced={...events(),matches:false};let observer;
 const scope={...events(),document:doc,localStorage:{getItem(){return 'false'}},matchMedia:q=>q.includes('hover')?fine:reduced,IntersectionObserver:class{constructor(callback){this.callback=callback;observer=this}observe(){}unobserve(){}disconnect(){this.disconnected=true}}};
 const elements=Array.from({length:5},()=>({...events(),dataset:{photoRank:'1'},style:{values:{},setProperty(k,v){this.values[k]=v}},isConnected:true,getBoundingClientRect(){return {left:0,top:0,width:300,height:200}}}));
 return {scope,doc,fine,reduced,elements,observe(){observer.callback(elements.map(target=>({target,isIntersecting:true,intersectionRatio:1})))}};
}
test('photo asset URLs stay local and escaped with explicit layer dimensions',()=>{
 assert.equal(photoUrl('https://evil.test/image.svg'),'');assert.equal(photoUrl('assets/photos/sky.svg'),'/outzide-map/assets/photos/sky.svg');
 const html=photoMarkup({src:'assets/photos/base.webp',overlaySrc:'assets/photos/overlay.svg',overlayGlowSrc:'assets/photos/nodes.svg',alt:'A <lake>',width:2048,height:1280,rank:1});
 assert.match(html,/A &lt;lake&gt;/);assert.equal((html.match(/width="2048" height="1280"/g)||[]).length,3);assert.match(html,/outz-photo__nodes/);
 assert.doesNotMatch(photoMarkup({src:'assets/photos/base.webp',overlayGlowSrc:'assets/photos/nodes.svg',overlaySrc:'assets/photos/overlay.svg',rank:21}),/outz-photo__nodes/);
});
test('responsive base images use safe local variants and retain the static fallback',()=>{
 const html=photoMarkup({src:'assets/photos/base.webp',overlaySrc:'assets/photos/overlay.svg',alt:'A "lake" <view>',variants:[{src:'assets/photos/base-640.webp',width:640},{src:'/outzide-map/assets/photos/base-1280.webp',width:1280},{src:'assets/photos/base.webp',width:2048}]});
 assert.match(html,/src="\/outzide-map\/assets\/photos\/base.webp"/);
 assert.match(html,/srcset="\/outzide-map\/assets\/photos\/base-640.webp 640w, \/outzide-map\/assets\/photos\/base-1280.webp 1280w, \/outzide-map\/assets\/photos\/base.webp 2048w"/);
 assert.match(html,/sizes="\(max-width: 800px\) 100vw, 800px"/);
 assert.equal((html.match(/srcset=/g)||[]).length,1);assert.match(html,/alt="A &quot;lake&quot; &lt;view&gt;"/);
});
test('responsive variants reject remote paths, traversal, unsupported formats and invalid widths',()=>{
 const variants=[null,'image.webp',{},...['https://evil.test/x.webp','//evil.test/x.webp','assets/photos/../x.webp','assets/photos/./x.webp','assets/photos/base.webp" onerror="alert(1)','assets/photos/base.svg'].map(src=>({src,width:640})),...[0,-1,Infinity,NaN,8193,640.5,'640'].map(width=>({src:'assets/photos/base.webp',width}))];
 const html=photoMarkup({src:'assets/photos/base.webp',variants});assert.doesNotMatch(html,/srcset=|sizes=|evil|onerror/);assert.match(html,/src="\/outzide-map\/assets\/photos\/base.webp"/);
 assert.equal(photoUrl('assets/photos/../x.webp'),'');
 assert.doesNotMatch(photoMarkup({src:'assets/photos/base.webp',variants:{src:'assets/photos/base.webp',width:640}}),/srcset=/);
});
test('caps visible node glows at three and resets motion when document is hidden',()=>{
 const f=fixture(),runtime=createPhotoMotion(f.scope);f.elements.forEach(runtime.attach);f.observe();
 assert.equal(f.elements.filter(e=>e.dataset.photoGlowing==='true').length,3);
 f.elements[0].listeners.get('pointermove').forEach(fn=>fn({clientX:300,clientY:200}));assert.equal(f.elements[0].style.values['--photo-x'],'1.5px');
 f.doc.hidden=true;f.doc.emit('visibilitychange');assert.ok(f.elements.every(e=>e.dataset.photoGlowing==='false'&&e.dataset.photoMotion==='false'));assert.equal(f.elements[0].style.values['--photo-x'],'0px');
 f.doc.hidden=false;f.doc.emit('visibilitychange');assert.equal(f.elements[0].dataset.photoGlowing,'true');runtime.dispose();assert.equal(f.doc.listeners.get('visibilitychange').size,0);assert.equal(f.elements[0].listeners.get('pointermove').size,0);
});
test('reduced motion and coarse pointers stop parallax, and detach releases visibility slots',()=>{
 const f=fixture(),runtime=createPhotoMotion(f.scope),detach=f.elements.map(runtime.attach);f.observe();
 f.reduced.matches=true;f.reduced.emit('change');assert.ok(f.elements.every(e=>e.dataset.photoMotion==='false'&&e.dataset.photoGlowing==='false'));
 f.reduced.matches=false;f.fine.matches=false;f.reduced.emit('change');assert.ok(f.elements.every(e=>e.dataset.photoMotion==='false'));assert.equal(f.elements[0].dataset.photoGlowing,'true');
 detach[0]();assert.equal(f.elements[3].dataset.photoGlowing,'true');runtime.dispose();
});
test('Calm Mode stops motion and offscreen artwork remains static',()=>{
 const f=fixture();let calm=false;f.doc.documentElement.classList.contains=()=>calm;const runtime=createPhotoMotion(f.scope);runtime.attach(f.elements[0]);
 assert.equal(f.elements[0].dataset.photoMotion,'false');assert.equal(f.elements[0].dataset.photoGlowing,'false');f.observe();assert.equal(f.elements[0].dataset.photoMotion,'true');
 calm=true;f.scope.emit('storage');assert.equal(f.elements[0].dataset.photoMotion,'false');assert.equal(f.elements[0].dataset.photoGlowing,'false');runtime.dispose();
});
