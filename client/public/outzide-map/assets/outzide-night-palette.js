// Outzide needs visible geography at regional zoom while retaining the night palette.
// Keep this treatment local so Mapz and the home flyover retain their own shader.
export function brightenOutzideTerrain(style) {
  const layer = id => style.layers.find(entry => entry.id === id);
  layer('ground').paint['background-color'] = '#17262a';
  Object.assign(layer('land-relief').paint, {
    'hillshade-shadow-color': '#142126',
    'hillshade-highlight-color': '#839b91',
    'hillshade-accent-color': '#344b43',
  });
  for (const id of ['forest-landcover', 'forest-landuse']) layer(id).paint['fill-color'] = '#254237';
  for (const id of ['leaf-landcover', 'leaf-landuse']) layer(id).paint['fill-color'] = '#2b4538';
  layer('park-areas').paint['fill-color'] = '#304b3d';
  layer('developed-earth').paint['fill-color'] = [
    'match', ['get', 'class'], 'commercial', '#243638', 'retail', '#243638',
    'industrial', '#273a3b', '#17262a',
  ];
  layer('water').paint['fill-color'] = [
    'interpolate', ['linear'], ['zoom'], 10, '#102a36', 14, '#143540', 18, '#183e49',
  ];
  layer('streets').paint['line-color'] = [
    'match', ['get', 'class'], 'motorway', '#849fad', 'trunk', '#7895a2',
    'primary', '#6b8997', 'secondary', '#5d7b88', 'tertiary', '#4f6975',
    'minor', '#3e5660', 'service', '#334b54', 'path', '#3b554c',
    'rail', '#506774', '#3e5660',
  ];
  return style;
}
