// Reference theme: black evergreen land, luminous green relief and amber contours.
// Acid Green #39FF14 and Neon Orange #FF6600 match Zaylist color tokens.
// Keep this treatment local so Mapz and the home flyover retain their own shader.

// Landscape greens sit three shades down: each shade keeps hue and saturation and takes a fifth off the lightness.
export function shade(hex, steps = 3) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  const L = l * Math.pow(0.8, steps), C = (1 - Math.abs(2 * L - 1)) * sat, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = L - C / 2;
  const [R, G, B] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
  return '#' + [R, G, B].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
export function brightenOutzideTerrain(style) {
  const layer = id => style.layers.find(entry => entry.id === id);
  layer('ground').paint['background-color'] = shade('#031009');
  Object.assign(layer('land-relief').paint, {
    'hillshade-shadow-color': shade('#010704'),
    'hillshade-highlight-color': shade('#39FF14'),
    'hillshade-accent-color': shade('#163f15'),
  });
  for (const id of ['forest-landcover', 'forest-landuse']) layer(id).paint['fill-color'] = shade('#123d16');
  for (const id of ['leaf-landcover', 'leaf-landuse']) layer(id).paint['fill-color'] = shade('#1c491b');
  layer('park-areas').paint['fill-color'] = shade('#255c20');
  layer('developed-earth').paint['fill-color'] = [
    'match', ['get', 'class'], 'commercial', shade('#122b19'), 'retail', shade('#122b19'),
    'industrial', shade('#17301e'), shade('#031009'),
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
  // Contours: clay lines, with the index line (every fifth) in Zaylist orange and a soft glow under it.
  const contours = layer('elevation-contours');
  if (contours) {
    Object.assign(contours.paint, {
      'line-color': ['match', ['get', 'level'], 1, '#FF6600', '#B84710'],
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 10, .16, 12.5, .5, 15, .42, 18, .16],
      'line-width': ['match', ['get', 'level'], 1, 1.25, .5],
    });
    const at = style.layers.indexOf(contours);
    style.layers.splice(at, 0, {
      id: 'elevation-contours-glow', type: 'line', source: contours.source, 'source-layer': contours['source-layer'], minzoom: 10.5,
      filter: ['==', ['get', 'level'], 1],
      paint: {
        'line-color': '#FF6600', 'line-blur': 3, 'line-width': ['interpolate', ['linear'], ['zoom'], 10.5, 2.5, 15, 5],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 10.5, 0, 12.5, .2, 15, .16, 18, .06],
      },
    });
  }
  return style;
}

/**
 * The Zaylist map look, added to the Outzide map only: a printed dot screen over forest and parks,
 * and dashed orange HUD lines for park and wilderness boundaries. Water stays the only cyan.
 */
export const ZAY_DOTS_IMAGE = 'zay-dots';
export function zaylistDotsImage() {
  // 3 css px cell (drawn at 2x), one small dot: the same dot screen as the card photos.
  const size = 6, canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FF6600';
  ctx.beginPath(); ctx.arc(size / 2, size / 2, 1.15, 0, Math.PI * 2); ctx.fill();
  return {data: ctx.getImageData(0, 0, size, size), options: {pixelRatio: 2}};
}
export function addZaylistMapLook(style) {
  const at = style.layers.findIndex(entry => entry.id === 'park-areas') + 1 || style.layers.length;
  const dotOpacity = ['interpolate', ['linear'], ['zoom'], 6, 0, 8, .05, 11, .09, 15, .07, 18, .03];
  const dots = [];
  for (const sourceLayer of ['landcover', 'landuse']) dots.push({
    id: `zay-dots-${sourceLayer}`, type: 'fill', source: 'terrain', 'source-layer': sourceLayer,
    filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
    paint: {'fill-pattern': ZAY_DOTS_IMAGE, 'fill-opacity': dotOpacity, 'fill-antialias': false},
  });
  dots.push({id: 'zay-dots-park', type: 'fill', source: 'terrain', 'source-layer': 'park', paint: {'fill-pattern': ZAY_DOTS_IMAGE, 'fill-opacity': dotOpacity, 'fill-antialias': false}});
  // Park and wilderness boundaries: a thin dashed orange line with short survey ticks along it.
  const boundary = [
    {id: 'zay-boundary-dash', type: 'line', source: 'terrain', 'source-layer': 'park', minzoom: 7,
      layout: {'line-join': 'round'},
      paint: {'line-color': '#FF6600', 'line-width': ['interpolate', ['linear'], ['zoom'], 7, .5, 12, 1], 'line-dasharray': [4, 3],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 9, .45, 14, .55, 18, .3]}},
    {id: 'zay-boundary-ticks', type: 'line', source: 'terrain', 'source-layer': 'park', minzoom: 9,
      paint: {'line-color': '#FF6600', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 3, 14, 6], 'line-dasharray': [.25, 18],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0, 11, .5, 16, .5, 18, .25]}},
  ];
  style.layers.splice(at, 0, ...dots, ...boundary);
  return style;
}
