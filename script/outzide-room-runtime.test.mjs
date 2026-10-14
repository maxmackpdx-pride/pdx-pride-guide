import test from 'node:test';
import assert from 'node:assert/strict';
import {mapzSurfaceStyle} from '../client/public/map-foundation/surface.js';
import {brightenOutzideTerrain} from '../client/public/outzide-map/assets/outzide-night-palette.js';
import {createNativePins} from '../client/public/map-foundation/native-pins.js';
import {oneShotMapLocation} from '../client/public/map-foundation/location.js';
import {registerImage} from '../client/public/map-foundation/layers.js';

test('richer Outzide palette preserves geography, provider data and Mapz style',()=>{
 const city=mapzSurfaceStyle(),before=JSON.stringify(city),outdoor=structuredClone(city);
 const structure=style=>style.layers.map(({id,type,source,filter,layout})=>({id,type,source,filter,layout}));
 brightenOutzideTerrain(outdoor);
 assert.equal(JSON.stringify(city),before);
 assert.deepEqual(outdoor.sources,city.sources);
 assert.deepEqual(structure(outdoor),structure(city));
 const land=outdoor.layers.find(layer=>layer.id==='forest-landcover').paint['fill-color'];
 const rgb=land.match(/[a-f0-9]{2}/gi).map(value=>parseInt(value,16));
 assert.ok(rgb[1]>rgb[0]&&rgb[1]>rgb[2],'forest geography remains green');
 assert.equal(outdoor.layers.find(layer=>layer.id==='ground').paint['background-color'],'#031009');
});

test('native pins can be disposed after a mini-map removes its style',async()=>{
 const events=new Map();let removed=false,styleReads=0;
 const map={on:(event,...args)=>events.set(event,args.at(-1)),off:()=>{},getLayer(){styleReads++;if(removed)throw Error('Style destroyed');},getSource(){if(removed)throw Error('Style destroyed');}};
 const pins=createNativePins(map,'fixture',{library:{}});
 removed=true;events.get('remove')();pins.dispose();pins.dispose();
 await pins.set([{id:1,color:'#FF6600',lng:0,lat:0}]);
 assert.equal(styleReads,0);
});

test('an image completing after map removal never accesses the destroyed style',async()=>{
 let active=true,removed=false,finish,added=0;
 const map={hasImage(){if(removed)throw Error('Style destroyed');return false;},addImage(){added++;}};
 const pending=registerImage(map,'late-pin',()=>new Promise(resolve=>{finish=resolve;}),{},()=>active);
 await Promise.resolve();active=false;removed=true;finish({});
 assert.equal(await pending,'late-pin');assert.equal(added,0);
});

test('Outzide low-power location lookup keeps cached fixes and stops on cancellation',()=>{
 let callback,options;const cleared=[];
 const provider={watchPosition(success,_failure,value){callback=success;options=value;return 9;},clearWatch:id=>cleared.push(id)};
 let moved=0;const cancel=oneShotMapLocation(provider,()=>moved++,()=>{},()=>true,{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
 cancel();callback({coords:{latitude:45.52,longitude:-122.67}});
 assert.deepEqual(options,{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
 assert.deepEqual(cleared,[9]);assert.equal(moved,0);
});
