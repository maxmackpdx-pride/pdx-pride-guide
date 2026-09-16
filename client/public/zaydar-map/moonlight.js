// One geographically fixed northwest moon. Building light and terrain shading
// share an azimuth, so rotating the camera never moves the light source.
export function applyMoonlight(style){
 const azimuth=315;
 style.light={anchor:'map',color:'#bceff5',intensity:.64,position:[1.15,azimuth,55]};
 const paint=(id,values)=>Object.assign(style.layers.find(layer=>layer.id===id).paint,values);
 paint('terrain-shade',{
  'hillshade-illumination-anchor':'map',
  'hillshade-illumination-direction':azimuth,
  'hillshade-exaggeration':.75,
  'hillshade-shadow-color':'#010609',
  'hillshade-highlight-color':'#4b9198',
  'hillshade-accent-color':'#1b4b49'
 });
 // Saturated material colors, not another glow overlay or rendering pass.
 paint('park-ground',{'fill-color':'#0b392b'});
 paint('woodland-ground',{'fill-color':['match',['get','class'],'scrub','#124b35','#0b382c']});
 paint('water',{'fill-color':['interpolate',['linear'],['zoom'],9.5,'#04232e',13,'#06323e',16,'#094352']});
 paint('river-depth',{'line-color':'#145d6b'});
 paint('banks',{'line-color':'#46b6bd'});
 paint('streams',{'line-color':'#359d9e'});
 paint('skyline',{'fill-extrusion-color':['interpolate',['linear'],['to-number',['coalesce',['get','render_height'],['get','height'],9]],0,'#142e3a',18,'#1d3d4a',60,'#305968',160,'#427887']});
}
