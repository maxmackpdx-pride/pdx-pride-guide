import {EVENT_CLOCK_HEIGHT,EVENT_CARD_HEIGHT} from '../client/public/mapz-map/event-hologram-model.js';
import {smoothCardVisibility,createEventCardLock} from '../client/public/mapz-map/event-card-motion.js';
import {eventCardGeometry,drawEventMiniBadge} from '../client/public/mapz-map/event-hologram-card.js';
import {eventDepthMeters,assignE3Levels,e3LodPlan,e3IsSameDay,e3StageTarget,e3VortexBlend,e3RepresentativeIndex,e3MixHex,E3_MINI_RISE_PX,E3_SAME_DAY_GREEN,e3BlenderScaleMeters,e3BlenderTakesOver,e3AnchorCoordinates,placezHoverMeters,PLACEZ_HOVER_METERS,e3RingText,e3CountdownText,e3NearestSameDayEvent} from '../client/public/mapz-map/e3-lod.js';
import {e3NearbyCount,e3NearbyPlacement,E3_NEARBY_MIN_VENUES} from '../client/public/mapz-map/e3-venue-stack.js';
import {planVenueStacks,drawVenueStacks,venueStackKey} from '../client/public/mapz-map/e3-vortex-stack.js';
import {eventCountdown} from '../client/public/mapz-map/event-countdown.js';
import {hologramPresence,HOLOGRAM_CAMERA_FOLLOW} from '../client/public/mapz-map/hologram-presence.js';
import {groupBoardPins,drawBoardPin} from '../client/public/mapz-map/board-pins.js';
import {eventProjectionGeometry,eventProjectionHeightLimit,eventProjectionSway,eventProjectionColor} from '../client/public/mapz-map/event-projection.js';
import {eventNight} from '../client/public/mapz-map/event-night.js';
import {screenNeighborCounts,signRise,createSignLift,SIGN_LIFT_ENTER_PX,SIGN_LIFT_EXIT_PX,SIGN_RISE_MAX_OF_CEILING} from '../client/public/mapz-map/screen-neighbors.js';
import {mizzedNotificationActive,extensionGeometry,EVENT_WAYPOINT_GAP} from '../client/public/mapz-map/venue-attachments.js';
import {visibleHologramLabels} from '../client/public/mapz-map/label-visibility.js';
import {waypointGeometry,waypointArtwork} from '../client/public/mapz-map/waypoint-markers.js';
import {housingIconSize} from '../client/public/mapz-map/housing-holograms.js';
import {hologramTypeForVenue} from '../client/public/mapz-map/venue-hologram-types.js';
import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {mapzSurfaceStyle} from '../client/public/mapz-map/natural-surfaces.js';
import {waterReflectionSegments,createBuildingChrome} from '../client/public/mapz-map/nightlife-materials.js';
import {projectorGroundScale} from '../client/public/mapz-map/hologram-materials.js';

const previousWindow=globalThis.window;
globalThis.window={};
after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});

test('projector circles shrink at overview zoom without a camera-facing guide line',async()=>{
  assert.equal(projectorGroundScale(12),.28*.3);
  assert.ok(projectorGroundScale(13)<projectorGroundScale(14));
  assert.equal(projectorGroundScale(15),.3);
  const renderer=await readFile(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
  assert.equal(renderer.includes('lineTo(logoX,raisedY)'),false);
  assert.equal(renderer.includes("lineTo(logoX+(p.x-logoX)*.08"),false);
});

test('labels and Placez markers stay locked to the map during camera movement',async()=>{
  const renderer=await readFile(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
  const canvasHost=await readFile(new URL('../client/src/components/MapzCanvas.tsx',import.meta.url),'utf8');
  assert.match(renderer,/visibleEventCards=new Set\(visibleHologramLabels/);
  assert.match(renderer,/renderHologramLabels\(\[\.\.\.eventLabels.filter\(label=>label.cardHeight\)/);
  assert.doesNotMatch(renderer,/tell\('labels'/);
  assert.doesNotMatch(canvasHost,/MapzEventLabel|event\.data\.type==='labels'/);
  assert.match(renderer,/const cameraMoving=Boolean\(target\.isMoving\?\.\(\)\)/);
  assert.match(renderer,/reduced\.matches\|\|cameraMoving\?0:/);
  assert.match(renderer,/r:Math\.max\(22,geometry\.size\/2\+8\)/);
  assert.match(renderer,/if\(!isBar\)\{[\s\S]*?drawWaypointHead\(lightsContext,geometry,color,typeIcons\.get\(feature\.properties\.typeIcon\)\?\.light,null,selected,coreAlpha,'place'\)/);
  assert.doesNotMatch(renderer,/drawDiscoveryOrb/);
  assert.match(renderer,/map\.on\('render',renderSceneOverlays\)/);
});

test('street inlays stay on major surface roads, below buildings, without recoloring bridges',()=>{
  const require=createRequire(import.meta.url),mr=createRequire(require.resolve('maplibre-gl'));
  const {createExpression}=mr('@maplibre/maplibre-gl-style-spec');
  const style=mapzSurfaceStyle(),inlay=style.layers.find(l=>l.id==='night-street-inlays');
  const compiled=createExpression(inlay.filter);assert.equal(compiled.result,'success');
  const accepts=properties=>compiled.value.evaluate({zoom:16},{type:2,properties});
  assert.equal(accepts({class:'primary'}),true);assert.equal(accepts({class:'secondary'}),true);
  for(const properties of [{class:'minor'},{class:'path'},{class:'rail'},{class:'primary',brunnel:'bridge'},
    {class:'primary',brunnel:'tunnel'},{class:'primary',layer:-1}])assert.equal(accepts(properties),false);
  assert.ok(style.layers.indexOf(inlay)<style.layers.findIndex(l=>l.id==='skyline'));
});

test('water streaks are short, fragmented, and fixed to their geographic source',()=>{
  const anchor=[-122.675,45.52],segments=waterReflectionSegments(anchor);
  assert.deepEqual(waterReflectionSegments([...anchor]),segments);assert.equal(segments.length,6);
  const southOffsets=segments.map(s=>(anchor[1]-s.a[1])*111320);
  assert.ok(southOffsets.every((v,i)=>v>=16&&v<64&&(i===0||v-southOffsets[i-1]>=5)));
  for(const s of segments){
    const width=(s.b[0]-s.a[0])*111320*Math.cos(anchor[1]*Math.PI/180);
    assert.ok(width>=3.99&&width<=12.01);assert.equal(s.a[1],s.b[1]);assert.ok(s.group>=0&&s.group<9);
  }
});

test('chrome reuses wall paths at rest and rebuilds only when the camera changes',()=>{
  const OriginalPath=globalThis.Path2D;let paths=0,projections=0;
  globalThis.Path2D=class{constructor(){paths++;}moveTo(){}lineTo(){}closePath(){}};
  try{
    let bearing=0;
    const map={getCenter:()=>({lng:0,lat:45}),getZoom:()=>16,getPitch:()=>48,getBearing:()=>bearing,
      project:([x,y])=>{projections++;return {x:x*1000,y:-y*1000};}};
    const buildings=[{center:[0,45],height:45,ring:[[0,45],[.01,45],[.01,45.01],[0,45.01]]}];
    const alphas=[],ctx={canvas:{width:900,height:1200},save(){},restore(){},fill(){alphas.push(this.globalAlpha);}};
    const chrome=createBuildingChrome();chrome.draw(ctx,map,buildings,1);
    const first={paths,projections};
    for(let i=0;i<100;i++)chrome.draw(ctx,map,buildings,1);
    assert.deepEqual({paths,projections},first);
    assert.ok(alphas.every(a=>a>=0&&a<=.12));
    bearing=30;chrome.draw(ctx,map,buildings,1);assert.ok(paths>first.paths&&projections>first.projections);
  }finally{globalThis.Path2D=OriginalPath;}
});

test('actual hologram draw paints sky artwork after building occlusion',async()=>{
  const renderer=await readFile(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
  const source=renderer.slice(renderer.indexOf('function drawLights('),renderer.indexOf('// Gentle corridor:'));
  const operations=[],projections=[],noop=()=>{},window={innerWidth:900,innerHeight:1200};
  const ctx=new Proxy({drawImage(image){operations.push(image);},createLinearGradient:()=>({addColorStop:noop}),
    createRadialGradient:()=>({addColorStop:noop})},{get:(target,key)=>key in target?target[key]:noop});
  const surface={width:900,height:1200,getContext:()=>ctx},map={getCenter:()=>({lat:45.52,lng:-122.675,distanceTo:()=>0}),getZoom:()=>15.5,getPitch:()=>55,transform:{cameraToCenterDistance:300},project:()=>({x:450,y:700})};
  const color='#FF00CC',feature={geometry:{coordinates:[-122.675,45.52]},properties:{key:'demo',kind:'event',demoOpen:true,name:'Musical Mondays',time:'9:00 PM',startsAtMs:Date.now()+720000,logo:'logo',phase:1,color,heightScale:1}};
  const logo={width:120,height:60,padding:1,outlined:'sky-logo',image:'artwork',silhouette:'mask'};
  const context=vm.createContext({window,parent:window,performance,EVENT_CLOCK_HEIGHT,eventCardLocks:new WeakMap(),createEventCardLock,rises:new Map(),folds:new Map(),lastBeaconKeys:new Set(),riseAmount:()=>1,foldAmount:()=>1,document:{getElementById:()=>null},map,lights:surface,devicePixelRatio:1,Intl,Date,Map,Set,Math,
    smoothCardVisibility,hologramTypeForVenue,eventCardGeometry,drawEventMiniBadge,eventDepthMeters,assignE3Levels,e3LodPlan,e3IsSameDay,E3_MINI_RISE_PX,E3_SAME_DAY_GREEN,e3NearbyCount,e3NearbyPlacement,E3_NEARBY_MIN_VENUES,planVenueStacks,drawVenueStacks,venueStackKey,HOLOGRAM_CAMERA_FOLLOW,signLift:createSignLift(),signRise,SIGN_LIFT_ENTER_PX,SIGN_LIFT_EXIT_PX,SIGN_RISE_MAX_OF_CEILING,e3LodPrevious:new Map(),e3Transitions:null,e3LoadedAt:0,e3LastZoom:null,coarsePointer:false,e3Blender:{ready:false,setVenues(){},setMotion(){}},e3Blender3D:new Map(),e3StageState:new Map(),E3_BLENDER_MAX_VISIBLE:6,e3StageStep:(st,target)=>{st.value=target;st.target=target;},e3StageTarget,e3VortexBlend,e3RepresentativeIndex,e3MixHex,e3BlenderScaleMeters,e3BlenderTakesOver,e3AnchorCoordinates,placezHoverMeters,PLACEZ_HOVER_METERS,e3RingText,e3CountdownText,e3NearestSameDayEvent,e3SnapTable:null,e3StageTweenActive:false,E3_CLEARANCE_RADIUS_M:120,E3_CLEARANCE_METERS_PER_STRETCH:30,E3_CLEARANCE_MAX_STRETCH:4,e3ClearanceMeters:()=>0,e3StageValue:st=>st.value,E3_SAME_DAY_VORTEX_FAR_OVERVIEW:false,E3_BLENDER_SKYLINE_HEIGHT:false,e3ZoomChangedAt:0,e3Opened:false,compressCard:(card,factor)=>factor===1?card:eventCardGeometry(card.x,(card.top+card.bottom)/2,card.scale*factor),eventBeamAnchor:(_t,_s,parent)=>({x:parent.p.x,y:parent.p.y}),EVENT_CARD_HEIGHT,eventCountdown,hologramPresence,eventArtworkScale:()=>1,screenNeighborCounts,eventNight,eventProjectionGeometry,eventProjectionHeightLimit,eventProjectionSway,eventProjectionColor,extrusionAmount:()=>1,attachedEventBeam:{draw:(_ctx,card,anchor)=>{operations.push('beam');projections.push({card,anchor});}},mizzedNotificationActive,extensionGeometry,EVENT_WAYPOINT_GAP,hitTargets:[],viewTime:Date.now(),viewTimeReceived:performance.now(),selectedKey:null,reduced:{matches:true},userLocation:null,lightFeatures:[feature],
    featureProjection:{project:feature=>map.project(feature.geometry.coordinates),invalidate:noop},updateSurfaces:()=>({buildings:[{}],reflections:[]}),waterBloom:{draw:noop},drawUserLocationGlow:noop,
    citySparkles:{update:noop},buildingGlitter:()=>[],opacityControl:{value:1},motionDelta:1/30,pulseTime:1,
    hologramLiftScale:.7,hologramArtworkScale:3.15,hologramLayouts:new WeakMap(),hologramLabelWidth:68.4,HOUSING_EVENT_HEIGHT_RATIO:1/3,
    housingIconSize:scale=>({width:70*scale,height:58*scale}),
    HOUSING_HOLOGRAM_LABELS:{LOOKING:'LOOKING TO RENT',FORMING:'BUILDING A HOÜS',OFFERING:'JOIN OUR HOÜS',MANAGED:'COMMERCIAL RENTAL HOÜS'},
    smoothRange:(a,b,v)=>Math.max(0,Math.min(1,(v-a)/(b-a))),
    groupBoardPins,drawBoardPin,clusterPlaceMarkers:()=>({byKey:new Map()}),roofLift:()=>15,
    hologramBounds:(_feature,scale)=>({halfWidth:61*scale,halfHeight:61*scale}),settleValue:(object,key,_velocity,goal)=>{object[key]=goal;},
    logoPointerOffset:()=>({x:0,y:0}),separateHolograms:noop,
    venueLogos:new Map([['logo',logo]]),logoFocus:{update:noop,active:new Map()},logoFit:()=>.2,logoMotionSeed:0,
    adultVenueColor:'#FF0000',hologramMaterials:{beams:new Map([[color,{}]])},drawProjectionBeam:()=>operations.push('beam'),
    waypointGeometry,waypointArtwork,placezHoverLift:()=>15,typeIcons:new Map(),drawWaypointFoot:()=>operations.push('waypoint-beam'),drawWaypointHead:()=>operations.push('waypoint-head'),waypointFamilyShell:()=>'place',waypointSwapGlitch:()=>0,noteSelectedWaypoint:noop,drawClusterCount:noop,
    projectorGroundScale,housingIconSize,visibleHologramLabels,
    applyBuildingOcclusion:()=>operations.push('building-mask'),buildingChrome:{draw:()=>operations.push('chrome')},
    mapHover:{update:noop},hoverTargets:[],logoPointer:{active:false},
    drawSurfaceReflections:()=>operations.push('building-reflections'),drawUserLocationAvatar:noop,tell:noop,
  });
  vm.runInContext(source,context);let labels=[];context.renderHologramLabels=rows=>{labels=rows;};vm.runInContext('drawLights(1)',context);
  assert.equal(labels.length,1);assert.equal(labels[0].name,'Musical Mondays');assert.equal(labels[0].time,'9:00 PM');assert.equal(labels[0].countdown,null,'no 2D countdown banner: a same-day event the 3D layer does not draw is a plain round logo coin');assert.equal(labels[0].hologramType,'coin');assert.ok(labels[0].logoY<700);
  assert.deepEqual(operations,['beam','building-mask','chrome','building-reflections']);
  assert.equal(labels[0].logo,'logo','stable logo is carried by the HTML card above the map');
  const anchored={...labels[0]};context.map.isMoving=()=>true;context.map.project=()=>({x:487,y:681});
  vm.runInContext('drawLights(1)',context);
  assert.ok(Math.abs(labels[0].x-anchored.x-37)<1e-8);
  assert.ok(Math.abs(labels[0].y-anchored.y+19)<1e-8);
  assert.ok(Math.abs(labels[0].logoY-anchored.logoY+19)<1e-8);
  assert.ok(Math.abs((labels[0].y-labels[0].logoY)-(anchored.y-anchored.logoY))<1e-8);

  context.map.isMoving=()=>false;
  // Overview caps must leave the full artwork/title above the beam mouth,
  // rather than moving the billboard down into the rooftop emitter.
  for(const viewport of [[900,1200],[393,740]]){
   [window.innerWidth,window.innerHeight]=viewport;
   context.map.project=()=>({x:viewport[0]/2,y:viewport[1]*.8});
  // E3 levels follow true camera distance. At these distances a compressed puck or full card is drawn.
  for(const zoom of [13.4,15.5]){
    context.map.getZoom=()=>zoom;
    for(const pitch of [0,48,75]){
      context.map.getPitch=()=>pitch;
      vm.runInContext('drawLights(1)',context);
      const label=labels[0],projection=projections.at(-1);
      assert.equal(label.top,projection.card.top);
      assert.equal(label.bottom,projection.card.bottom);
      assert.ok(projection.anchor.y-label.bottom>=60,`visible light below card at zoom ${zoom}, pitch ${pitch}`);
      assert.ok(projection.anchor.y-label.bottom<window.innerHeight*.6);
    }
  }

  }
  // Far away the event is one cached mini badge: no HTML card at all, and the level is remembered.
  context.map.project=()=>({x:450,y:300});context.map.getPitch=()=>55;
  // The distance bands now reach farther (vortex to ~30 km, mini past ~150 km); exercise a genuinely far view.
  context.map.getZoom=()=>5;vm.runInContext('drawLights(1)',context);
  assert.equal(labels.length,0,'far events draw a canvas badge, not an HTML card');
  assert.equal(context.e3LodPrevious.get('demo'),'mini');
  context.map.getZoom=()=>16.5;vm.runInContext('drawLights(1)',context);
  assert.equal(context.e3LodPrevious.get('demo'),'vortex');
  assert.equal(labels.length,1);assert.equal(labels[0].countdown,null,'the countdown lives on the 3D vortex only, never on a 2D card');
  context.map.project=()=>({x:450,y:700});context.map.getZoom=()=>15.5;
  context.lightFeatures=[{geometry:{coordinates:[-122.67,45.53]},properties:{key:'houz',kind:'housing',housingModel:'MANAGED',demoOpen:true,logo:'',phase:2,color:'#8800FF',heightScale:1,name:'Property for rent'}}];
  operations.length=0;assert.doesNotThrow(()=>vm.runInContext('drawLights(1)',context));
  assert.deepEqual(operations,['building-mask','chrome','building-reflections','waypoint-head']);
});
