// Local geographic bins avoid rescanning the entire city for each venue light.
export function createSpatialIndex(items, coordinates, cellSize = .0015) {
  const cells = new Map();
  const cell = point => [Math.floor(point[0] * .7 / cellSize), Math.floor(point[1] / cellSize)];
  for (const item of items) {
    const key = cell(coordinates(item)).join(':');
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(item);
  }
  return point => {
    const [x, y] = cell(point), result = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const neighbors = cells.get(`${x + dx}:${y + dy}`);
      if (neighbors) result.push(...neighbors);
    }
    return result;
  };
}
