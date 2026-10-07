import {vectorStyle} from '../home-flight/city-map.js';

export const WATER_CYAN = '#389187'; // Five percent cooler and more saturated, with the same HSL lightness.
export const BUILDING_SOLIDITY = .98;
export const BUILDING_LIGHT_OCCLUSION = .98;
export const FOREST_COLORS = ['#06140e', '#0a1b12', '#0e2418'];
export const WOOD_FILL = '#0d1610';
export const GRASS_FILL = '#101812';
export const PARK_FILL = '#0d1812';
export const BUILDING_FILL = '#223c45';
export const BUILDING_OUTLINE = '#7397a0';
// Keep developed ground in the same cool night family as the water and
// buildings. Subtle green-blue differences retain land-use depth without the
// previous brown blocks reading as a separate material.
export const NIGHT_EARTH = '#080c0c';
export const COMMERCIAL_EARTH = '#101817';
export const INDUSTRIAL_EARTH = '#121b1a';
const GREEN_OPACITY = ['interpolate',['linear'],['zoom'],10,.55,14,.72,18,.85];
const URBAN_GREEN_OPACITY = ['interpolate',['linear'],['zoom'],10,.55,14,.72,15.75,.72,16.5,.2,17,0];

function quietGreenFills() {
  const wood = ['wood','forest'];
  const leaf = ['grass','scrub','heath','meadow','grassland'];
  const layers = [];
  for (const sourceLayer of ['landcover','landuse']) {
    layers.push({
      id: `forest-${sourceLayer}`,
      type: 'fill',
      source: 'terrain',
      'source-layer': sourceLayer,
      filter: ['in', ['get', 'class'], ['literal', wood]],
      paint: {'fill-color': WOOD_FILL, 'fill-opacity': GREEN_OPACITY, 'fill-antialias': true},
    });
    layers.push({
      id: `leaf-${sourceLayer}`,
      type: 'fill',
      source: 'terrain',
      'source-layer': sourceLayer,
      filter: ['in', ['get', 'class'], ['literal', leaf]],
      paint: {'fill-color': GRASS_FILL, 'fill-opacity': URBAN_GREEN_OPACITY, 'fill-antialias': true},
    });
  }
  layers.push({
    id: 'park-areas',
    type: 'fill',
    source: 'terrain',
    'source-layer': 'park',
    paint: {'fill-color': PARK_FILL, 'fill-opacity': URBAN_GREEN_OPACITY, 'fill-antialias': true},
  });
  return layers;
}

function nightEarthFills() {
  return [{
    id:'developed-earth',type:'fill',source:'terrain','source-layer':'landuse',
    filter:['in',['get','class'],['literal',['commercial','retail','industrial']]],
    paint:{
      'fill-color':['match',['get','class'],'commercial',COMMERCIAL_EARTH,'retail',COMMERCIAL_EARTH,'industrial',INDUSTRIAL_EARTH,NIGHT_EARTH],
      'fill-opacity':['interpolate',['linear'],['zoom'],10,.42,14,.56,18,.66],
      'fill-antialias':true,
    },
  }];
}

export const naturalWater = ['all', ['in', ['get', 'class'], ['literal', ['river', 'lake', 'pond']]], ['!=', ['get', 'intermittent'], 1]];

/** Shared Mapz surface treatment used by Mapz and the homepage flyover. */
export function mapzSurfaceStyle({demTiles,contourTiles,terrainStrength=0}={}) {
  if(!Number.isFinite(terrainStrength)||terrainStrength<0||terrainStrength>1)throw new RangeError('Terrain strength must be between zero and one');
  const style = structuredClone(vectorStyle);
  style.sources.elevation = {
    type: 'raster-dem',
    ...(demTiles?{tiles:demTiles,maxzoom:13}:{url:'https://tiles.mapterhorn.com/tilejson.json'}),
    encoding: 'terrarium', tileSize: 512,
    attribution: '<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>',
  };
  if(contourTiles)style.sources.contours={type:'vector',tiles:contourTiles,maxzoom:15};
  // Terrain remains opt-in while road approaches and model anchors are verified.
  if(terrainStrength>0){
    style.terrain={source:'elevation',exaggeration:terrainStrength};
    // Terrain and hillshade need independent tile state in MapLibre. They can
    // share the DEM protocol/cache, but must not share a raster source instance.
    style.sources['hillshade-elevation']=structuredClone(style.sources.elevation);
  }
  style.layers.unshift(
    {id:'ground',type:'background',paint:{'background-color':NIGHT_EARTH,'background-opacity':1}},
    {id:'land-relief',type:'hillshade',source:terrainStrength>0?'hillshade-elevation':'elevation',paint:{'hillshade-exaggeration':['interpolate',['linear'],['zoom'],10,.34,14,.24,17,.16],'hillshade-shadow-color':'#07110d','hillshade-highlight-color':'#53675d','hillshade-accent-color':'#132a20'}},
    ...nightEarthFills(),
    ...quietGreenFills(),
    ...(contourTiles?[{id:'elevation-contours',type:'line',source:'contours','source-layer':'contours',minzoom:10,paint:{'line-color':'#35515a','line-opacity':['interpolate',['linear'],['zoom'],10,.08,12.5,.22,15,.14,18,.06],'line-width':['match',['get','level'],1,.85,.38]}}]:[]),
  );
  // Opaque terrain and water prevent the terrain framebuffer from exposing
  // lower surfaces. Underground transport must not be painted on top of land.
  const water = style.layers.find(layer=>layer.id==='water');
  water.paint = {'fill-color':['interpolate',['linear'],['zoom'],10,'#050e12',14,'#06171d',18,'#08222a'],'fill-opacity':1};
  const streets = style.layers.find(layer=>layer.id==='streets');
  streets.filter = ['all', streets.filter, ['!=',['get','brunnel'],'tunnel'], ['>=',['coalesce',['get','layer'],0],0]];
  streets.layout={'line-cap':'round','line-join':'round'};
  streets.paint['line-color']=['match',['get','class'],'motorway','#3c5565','trunk','#394f5e','primary','#354a58','secondary','#30434f','tertiary','#2b3b46','minor','#24333c','service','#1d2a32','path','#182329','rail','#293b45','#24333c'];
  streets.paint['line-opacity']=['match',['get','class'],'motorway',.97,'trunk',.94,'primary',.88,'secondary',.76,'tertiary',.64,'minor',.48,'service',.38,'path',.28,'rail',.54,.48];
  const streetIndex=style.layers.indexOf(streets);
  const casingWidth=structuredClone(streets.paint['line-width']);
  for(let i=4;i<casingWidth.length;i+=2)casingWidth[i]=['+',casingWidth[i],2];
  style.layers.splice(streetIndex,0,{...structuredClone(streets),id:'street-casings',paint:{'line-color':'#070a0b','line-opacity':.96,'line-width':casingWidth}});
  const highwayEdge={
    ...structuredClone(streets),id:'highway-edge-light',
    filter:['all',streets.filter,['in',['get','class'],['literal',['motorway','trunk']]]],
    paint:{'line-color':'#7993a1','line-opacity':['interpolate',['linear'],['zoom'],10,.12,15,.22,18,.17],
      'line-width':['interpolate',['linear'],['zoom'],10,.28,15,.46,18,.62],
      'line-gap-width':['interpolate',['exponential',2],['zoom'],8,0,12,.55,14,2,16,9,18,40,22,684]},
  };
  style.layers.splice(style.layers.indexOf(streets)+1,0,highwayEdge);
  const roadId=['to-number',['id'],0];
  style.layers.splice(style.layers.indexOf(streets)+1,0,{
    id:'night-street-inlays',type:'line',source:'terrain','source-layer':'transportation',minzoom:12,
    filter:['all',streets.filter,['in',['get','class'],['literal',['primary','secondary']]],['!=',['get','brunnel'],'bridge']],
    layout:{'line-cap':'round','line-join':'round'},
    paint:{
      'line-color':['case',['all',['>',roadId,0],['==',['%',roadId,11],0]],'#955285','#438b96'],
      'line-width':['interpolate',['exponential',2],['zoom'],12,.08,16,.55,18,1.25],
      'line-opacity':['interpolate',['linear'],['zoom'],12,0,14,.28,16,.42,18,.36],
    },
  });
  const banks = style.layers.find(layer=>layer.id==='banks');
  banks.filter = naturalWater;
  // Water polygons and narrow waterways use the water material alone. Vector
  // centerlines read as seams through rivers and streams at overview zooms.
  const streams = style.layers.find(layer=>layer.id==='streams');
  streams.layout = {'visibility':'none'};
  // Keep one restrained shoreline. The bloom is generated from the interior
  // water mask below, so no blurred line can leak onto land at sharp bends.
  banks.paint = {'line-color':WATER_CYAN,'line-opacity':['interpolate',['linear'],['zoom'],10,.2,15,.32,18,.26],'line-width':['interpolate',['linear'],['zoom'],10,.4,15,.6,18,.8]};
  const skyline=style.layers.find(layer=>layer.id==='skyline');
  skyline.paint['fill-extrusion-color'] = BUILDING_FILL;
  skyline.paint['fill-extrusion-opacity'] = BUILDING_SOLIDITY;
  // The flat footprint line must render below the extrusion. Above it, every
  // hidden footprint is painted across roofs and walls like transparent wire.
  const buildingOutlines=style.layers.find(layer=>layer.id==='buildings');
  buildingOutlines.paint['line-color'] = BUILDING_OUTLINE;
  style.layers.splice(style.layers.indexOf(buildingOutlines),1);
  style.layers.splice(style.layers.indexOf(skyline),0,buildingOutlines);
  return style;
}
