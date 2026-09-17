import {radix} from './radix-map.js';

export function applyMoonlight(style){
 const azimuth=315;
 style.light={anchor:'map',color:radix.cyan12,intensity:.768,position:[1.15,azimuth,55]};
 const paint=(id,values)=>Object.assign(style.layers.find(layer=>layer.id===id).paint,values);
 paint('terrain-shade',{
  'hillshade-illumination-anchor':'map',
  'hillshade-illumination-direction':azimuth,
  'hillshade-exaggeration':.75,
  'hillshade-shadow-color':radix.cyan1,
  'hillshade-highlight-color':radix.cyan11,
  'hillshade-accent-color':radix.teal5
 });
 paint('park-ground',{'fill-color':radix.teal4});
 paint('woodland-ground',{'fill-color':['match',['get','class'],'scrub',radix.teal3,radix.teal2]});
 paint('water',{'fill-color':['interpolate',['linear'],['zoom'],9.5,radix.cyan3,13,radix.cyan6,16,radix.cyan7]});
 paint('river-depth',{'line-color':radix.cyan6});
 paint('banks',{'line-color':radix.sky9});
 paint('streams',{'line-color':radix.cyan11});
 paint('skyline',{'fill-extrusion-color':['interpolate',['linear'],['to-number',['coalesce',['get','render_height'],['get','height'],9]],0,radix.sky1,18,radix.sky2,60,radix.sky4,160,radix.sky5]});
 style.sky={
  'sky-color':radix.sky1,
  'sky-horizon-blend':.42,
  'horizon-color':radix.cyan4,
  'horizon-fog-blend':.72,
  'fog-color':radix.cyan1,
  'fog-ground-blend':.22,
  'atmosphere-blend':.18
 };
}
