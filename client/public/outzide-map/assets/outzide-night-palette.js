// Outzide needs visible geography at regional zoom while retaining the night palette.
// Keep this treatment local so Mapz and the home flyover retain their own shader.
export function brightenOutzideTerrain(style) {
  const layer = id => style.layers.find(entry => entry.id === id);
  layer('ground').paint['background-color'] = '#1d3034';
  Object.assign(layer('land-relief').paint, {
    'hillshade-shadow-color': '#132127',
    'hillshade-highlight-color': '#a0b9aa',
    'hillshade-accent-color': '#466457',
  });
  for (const id of ['forest-landcover', 'forest-landuse']) layer(id).paint['fill-color'] = '#365a46';
  for (const id of ['leaf-landcover', 'leaf-landuse']) layer(id).paint['fill-color'] = '#3a5947';
  layer('park-areas').paint['fill-color'] = '#426650';
  layer('developed-earth').paint['fill-color'] = [
    'match', ['get', 'class'], 'commercial', '#33494a', 'retail', '#33494a',
    'industrial', '#354b4c', '#1d3034',
  ];
  layer('water').paint['fill-color'] = [
    'interpolate', ['linear'], ['zoom'], 10, '#123847', 14, '#184351', 18, '#1c4a58',
  ];
  layer('streets').paint['line-color'] = [
    'match', ['get', 'class'], 'motorway', '#9ebaca', 'trunk', '#8eabba',
    'primary', '#829dab', 'secondary', '#738d99', 'tertiary', '#607b86',
    'minor', '#526d77', 'service', '#425e67', 'path', '#53715f',
    'rail', '#647f8c', '#526d77',
  ];
  return style;
}
