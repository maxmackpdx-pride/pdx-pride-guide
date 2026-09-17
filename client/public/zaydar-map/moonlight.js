import {radix} from './radix-map.js';

export function applyMoonlight(style){
 const azimuth=315;
 style.light={anchor:'map',color:'#eafcff',intensity:.86,position:[1.15,azimuth,58]};
 const paint=(id,values)=>Object.assign(style.layers.find(layer=>layer.id===id).paint,values);
 paint('terrain-shade',{
  'hillshade-illumination-anchor':'map',
  'hillshade-illumination-direction':azimuth,
  'hillshade-exaggeration':.92,
  'hillshade-shadow-color':radix.cyan1,
  'hillshade-highlight-color':'#eafcff',
  'hillshade-accent-color':radix.cyan12
 });
 paint('park-ground',{'fill-color':radix.teal4});
 paint('woodland-ground',{'fill-color':['match',['get','class'],'scrub',radix.teal3,radix.teal2]});
 paint('water',{'fill-color':['interpolate',['linear'],['zoom'],9.5,radix.cyan3,13,radix.cyan6,16,radix.cyan7]});
 paint('river-depth',{'line-color':radix.cyan6});
 paint('banks',{'line-color':'#00FFFF'});
 paint('streams',{'line-color':'#00FFFF'});
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
