// One geographically fixed northwest moon. Building light and terrain shading
// share an azimuth, so rotating the camera never moves the light source.
export function applyMoonlight(style){
 const azimuth=315;
 style.light={anchor:'map',color:'#bceff5',intensity:.768,position:[1.15,azimuth,55]};
 const paint=(id,values)=>Object.assign(style.layers.find(layer=>layer.id===id).paint,values);
 paint('terrain-shade',{
  'hillshade-illumination-anchor':'map',
  'hillshade-illumination-direction':azimuth,
  'hillshade-exaggeration':.75,
  'hillshade-shadow-color':'#010609',
  'hillshade-highlight-color':'#5aaeb6',
  'hillshade-accent-color':'#1b4b49'
 });
 // Saturated material colors, not another glow overlay or rendering pass.
 paint('park-ground',{'fill-color':'#0b392b'});
 paint('woodland-ground',{'fill-color':['match',['get','class'],'scrub','#124b35','#0b382c']});
 paint('water',{'fill-color':['interpolate',['linear'],['zoom'],9.5,'#073a46',13,'#0c5564',16,'#147888']});
 paint('river-depth',{'line-color':'#145d6b'});
 paint('banks',{'line-color':'#7af4ff'});
 paint('streams',{'line-color':'#19e3ff'});
 paint('skyline',{'fill-extrusion-color':['interpolate',['linear'],['to-number',['coalesce',['get','render_height'],['get','height'],9]],0,'#0b1822',18,'#122433',60,'#1c3548',160,'#27485c']});
 style.sky={
  'sky-color':'#050c18',
  'sky-horizon-blend':.42,
  'horizon-color':'#0d3a4a',
  'horizon-fog-blend':.72,
  'fog-color':'#07161e',
  'fog-ground-blend':.22,
  'atmosphere-blend':.18
 };
}
