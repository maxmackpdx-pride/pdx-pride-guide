import {radix,DAYS} from './radix-map.js?v=20260917-days';

export function applyMoonlight(style){
 const azimuth=315;
 style.light={anchor:'map',color:radix.cyan11,intensity:.56,position:[1.15,azimuth,48]};
 const paint=(id,values)=>Object.assign(style.layers.find(layer=>layer.id===id).paint,values);
 paint('terrain-shade',{
  'hillshade-illumination-anchor':'map',
  'hillshade-illumination-direction':azimuth,
  'hillshade-exaggeration':.62,
  'hillshade-shadow-color':radix.teal1,
  'hillshade-highlight-color':radix.teal6,
  'hillshade-accent-color':radix.teal5
 });
 paint('park-ground',{'fill-color':radix.teal4});
 paint('woodland-ground',{'fill-color':['match',['get','class'],'scrub',radix.teal3,radix.teal2]});
 paint('water',{'fill-color':['interpolate',['linear'],['zoom'],9.5,radix.cyan3,13,radix.cyan6,16,radix.cyan7]});
 paint('river-depth',{'line-color':radix.cyan6});
 paint('banks',{'line-color':DAYS.thu});
 paint('streams',{'line-color':DAYS.thu});
 paint('skyline',{'fill-extrusion-color':['interpolate',['linear'],['to-number',['coalesce',['get','render_height'],['get','height'],9]],0,DAYS.tue,18,'#0038cc',48,'#00b8d4',90,DAYS.thu,180,'#7af4ff']});
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
