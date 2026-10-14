// Reference theme: black evergreen land, luminous green relief and amber contours.
// Keep this treatment local so Mapz and the home flyover retain their own shader.
export function brightenOutzideTerrain(style) {
  const layer = id => style.layers.find(entry => entry.id === id);
  layer('ground').paint['background-color'] = '#031009';
  Object.assign(layer('land-relief').paint, {
    'hillshade-shadow-color': '#010704',
    'hillshade-highlight-color': '#65ba36',
    'hillshade-accent-color': '#163f15',
  });
  for (const id of ['forest-landcover', 'forest-landuse']) layer(id).paint['fill-color'] = '#123d16';
  for (const id of ['leaf-landcover', 'leaf-landuse']) layer(id).paint['fill-color'] = '#1c491b';
  layer('park-areas').paint['fill-color'] = '#255c20';
  layer('developed-earth').paint['fill-color'] = [
    'match', ['get', 'class'], 'commercial', '#122b19', 'retail', '#122b19',
    'industrial', '#17301e', '#031009',
  ];
  layer('water').paint['fill-color'] = [
    'interpolate', ['linear'], ['zoom'], 10, '#053329', 14, '#064437', 18, '#095244',
  ];
  layer('streets').paint['line-color'] = [
    'match', ['get', 'class'], 'motorway', '#91b834', 'trunk', '#80a632',
    'primary', '#698c29', 'secondary', '#567b25', 'tertiary', '#41651f',
    'minor', '#35551d', 'service', '#294819', 'path', '#9e8339',
    'rail', '#667d38', '#35551d',
  ];
  const contours = layer('elevation-contours');
  if (contours) Object.assign(contours.paint, {
    'line-color': '#c18a32',
    'line-opacity': ['interpolate', ['linear'], ['zoom'], 10, .25, 12.5, .65, 15, .52, 18, .2],
    'line-width': ['match', ['get', 'level'], 1, 1.15, .55],
  });
  return style;
}
