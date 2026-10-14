// Forest-service night palette: deeper evergreen land, with legible regional relief.
// Keep this treatment local so Mapz and the home flyover retain their own shader.
export function brightenOutzideTerrain(style) {
  const layer = id => style.layers.find(entry => entry.id === id);
  layer('ground').paint['background-color'] = '#111f1a';
  Object.assign(layer('land-relief').paint, {
    'hillshade-shadow-color': '#0b1713',
    'hillshade-highlight-color': '#91ad96',
    'hillshade-accent-color': '#35563f',
  });
  for (const id of ['forest-landcover', 'forest-landuse']) layer(id).paint['fill-color'] = '#254b35';
  for (const id of ['leaf-landcover', 'leaf-landuse']) layer(id).paint['fill-color'] = '#2a4c35';
  layer('park-areas').paint['fill-color'] = '#315a40';
  layer('developed-earth').paint['fill-color'] = [
    'match', ['get', 'class'], 'commercial', '#293c34', 'retail', '#293c34',
    'industrial', '#2c4039', '#111f1a',
  ];
  layer('water').paint['fill-color'] = [
    'interpolate', ['linear'], ['zoom'], 10, '#0d2d38', 14, '#123844', 18, '#16424d',
  ];
  layer('streets').paint['line-color'] = [
    'match', ['get', 'class'], 'motorway', '#9ebaca', 'trunk', '#8eabba',
    'primary', '#829dab', 'secondary', '#738d99', 'tertiary', '#607b86',
    'minor', '#526d77', 'service', '#425e67', 'path', '#53715f',
    'rail', '#647f8c', '#526d77',
  ];
  return style;
}
