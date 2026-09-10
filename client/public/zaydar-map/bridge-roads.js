// Both surfaces use the same physical road widths and opaque slate material.
// The map's overall opacity still controls the entire city together.
export const roadColor = '#314451';
const roadWidths = {motorway: 9, trunk: 9, primary: 8, secondary: 7, tertiary: 6, minor: 5, service: 3.5, path: 1.2, rail: 1.4};
const widthExpression = ['match', ['get', 'class'], ...Object.entries(roadWidths).flat(), 5];
const metersAtZoom14 = 512 * 2 ** 14 / (40075016.686 * Math.cos(45.53 * Math.PI / 180));
export const roadLineWidth = ['interpolate', ['exponential', 2], ['zoom'],
  8, ['*', widthExpression, metersAtZoom14 / 64],
  22, ['*', widthExpression, metersAtZoom14 * 256]];
export const bridgeFilter = ['all', ['==', ['get', 'brunnel'], 'bridge'],
  ['!', ['in', ['get', 'class'], ['literal', ['rail', 'path']]]]];

// Tile buffers may contain overlapping pieces of the same road. Split at shared
// endpoints before deduplicating, so tile boundaries never become ramp ends.
export function bridgeNetwork(features, project) {
  const nodes = [], buckets = new Map(), segments = [];
  const bucketKey = (x, y) => `${x},${y}`;
  function nodeAt(coordinate) {
    const [x, y] = project(coordinate), bx = Math.floor(x / 32), by = Math.floor(y / 32);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      for (const i of buckets.get(bucketKey(bx + dx, by + dy)) || []) {
        if (Math.hypot(nodes[i].x - x, nodes[i].y - y) < .6) return i;
      }
    }
    const index = nodes.length;
    nodes.push({x, y, edges: [], distance: Infinity});
    const key = bucketKey(bx, by);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(index);
    return index;
  }
  for (const feature of features) {
    const {geometry, properties} = feature;
    if (properties.brunnel !== 'bridge' || ['rail', 'path'].includes(properties.class)) continue;
    const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.type === 'MultiLineString' ? geometry.coordinates : [];
    const width = roadWidths[properties.class] || 5;
    for (const line of lines) {
      const ids = line.map(nodeAt);
      for (let i = 1; i < ids.length; i++) if (ids[i - 1] !== ids[i]) segments.push({a: ids[i - 1], b: ids[i], width});
    }
  }
  const edges = [], seen = new Map();
  for (const segment of segments) {
    const a = nodes[segment.a], b = nodes[segment.b], dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
    const cuts = [{id: segment.a, t: 0}, {id: segment.b, t: 1}];
    for (let x = Math.floor((Math.min(a.x, b.x) - .6) / 32); x <= Math.floor((Math.max(a.x, b.x) + .6) / 32); x++) {
      for (let y = Math.floor((Math.min(a.y, b.y) - .6) / 32); y <= Math.floor((Math.max(a.y, b.y) + .6) / 32); y++) {
        for (const id of buckets.get(bucketKey(x, y)) || []) {
          if (id === segment.a || id === segment.b) continue;
          const p = nodes[id], t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2;
          if (t > 0 && t < 1 && Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / Math.sqrt(length2) < .6) cuts.push({id, t});
        }
      }
    }
    cuts.sort((a, b) => a.t - b.t);
    for (let i = 1; i < cuts.length; i++) {
      const u = cuts[i - 1].id, v = cuts[i].id, key = `${Math.min(u, v)}:${Math.max(u, v)}`;
      if (seen.has(key)) { seen.get(key).width = Math.max(seen.get(key).width, segment.width); continue; }
      const edge = {a: u, b: v, width: segment.width, length: Math.hypot(nodes[u].x - nodes[v].x, nodes[u].y - nodes[v].y)};
      if (edge.length < .05) continue;
      seen.set(key, edge); edges.push(edge); nodes[u].edges.push(edge); nodes[v].edges.push(edge);
    }
  }
  // Multi-source shortest paths give branches one shared elevation at junctions.
  const pending = nodes.filter(n => n.edges.length === 1);
  pending.forEach(n => { n.distance = 0; });
  for (let i = 0; i < pending.length; i++) {
    const node = pending[i];
    for (const edge of node.edges) {
      const other = nodes[edge.a] === node ? nodes[edge.b] : nodes[edge.a];
      const distance = node.distance + edge.length;
      if (distance < other.distance && distance < 160) { other.distance = distance; pending.push(other); }
    }
  }
  return {nodes, edges};
}

function deckHeight(distance) {
  const t = Math.min(1, distance / 150);
  return .05 + 16 * t * t * (3 - 2 * t);
}
export function bridgeMesh(network) {
  const {nodes, edges} = network, vertices = [];
  const triangle = (a, b, c, shade, edgeA, edgeB, edgeC) => {
    vertices.push(...a, shade, edgeA, ...b, shade, edgeB, ...c, shade, edgeC);
  };
  function section(edge, node, height) {
    const other = nodes[edge.a] === node ? nodes[edge.b] : nodes[edge.a];
    const dx = (other.x - node.x) / edge.length, dy = (other.y - node.y) / edge.length;
    let nx = -dy, ny = dx, half = edge.width / 2;
    if (node.edges.length === 2) {
      const next = node.edges.find(e => e !== edge), p = nodes[next.a] === node ? nodes[next.b] : nodes[next.a];
      const tx = (node.x - p.x) / next.length, ty = (node.y - p.y) / next.length;
      const mx = nx - ty, my = ny + tx, magnitude = Math.hypot(mx, my);
      if (magnitude > .1) {
        nx = mx / magnitude; ny = my / magnitude;
        half = (edge.width + next.width) / 4 / Math.max(.65, nx * -dy + ny * dx);
      }
    }
    return [[node.x + nx * half, node.y + ny * half, height], [node.x - nx * half, node.y - ny * half, height]];
  }
  for (const edge of edges) {
    const a = nodes[edge.a], b = nodes[edge.b], steps = Math.max(1, Math.ceil(edge.length / 8));
    const start = section(edge, a, 0), end = section(edge, b, 0).reverse();
    let previous;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, distance = Math.min(a.distance + edge.length * t, b.distance + edge.length * (1 - t));
      const z = deckHeight(distance);
      const current = start.map((p, side) => [p[0] + (end[side][0] - p[0]) * t, p[1] + (end[side][1] - p[1]) * t, z]);
      if (previous) {
        const [l0, r0] = previous, [l1, r1] = current;
        triangle(l0, r0, l1, 1, -1, 1, -1); triangle(r0, r1, l1, 1, 1, 1, -1);
        for (const [p, q] of [[l0, l1], [r1, r0]]) {
          const lowP = [p[0], p[1], Math.max(.02, p[2] - 1)], lowQ = [q[0], q[1], Math.max(.02, q[2] - 1)];
          triangle(p, lowP, q, .67, 0, 0, 0); triangle(lowP, lowQ, q, .67, 0, 0, 0);
        }
      }
      previous = current;
    }
  }
  return new Float32Array(vertices);
}

export function createBridgeLayer(maplibre) {
  const origin = maplibre.MercatorCoordinate.fromLngLat([-122.67, 45.53]);
  const unit = origin.meterInMercatorCoordinateUnits();
  const project = coordinate => { const p = maplibre.MercatorCoordinate.fromLngLat(coordinate); return [(p.x - origin.x) / unit, (p.y - origin.y) / unit]; };
  return {
    id: 'bridge-decks', type: 'custom', renderingMode: '3d', dirty: false, count: 0, signature: '',
    update(features) {
      const signature = JSON.stringify(features.map(f => [f.properties.class, f.geometry.coordinates]));
      if (signature === this.signature) return;
      this.signature = signature; this.vertices = bridgeMesh(bridgeNetwork(features, project)); this.dirty = true;
    },
    onAdd(map, gl) {
      this.map = map;
      const compile = (type, source) => {
        const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const vertex = compile(gl.VERTEX_SHADER, `#version 300 es
        in vec3 a_position; in float a_shade; in float a_edge;
        uniform mat4 u_matrix; out float v_shade; out float v_edge;
        void main(){gl_Position=u_matrix*vec4(a_position,1.0);v_shade=a_shade;v_edge=a_edge;}`);
      const fragment = compile(gl.FRAGMENT_SHADER, `#version 300 es
        precision highp float; in float v_shade; in float v_edge; out vec4 color;
        void main(){float aa=max(fwidth(v_edge),0.001);float alpha=1.0-smoothstep(1.0-aa,1.0,abs(v_edge));
        color=vec4(vec3(49.0,68.0,81.0)/255.0*v_shade*alpha,alpha);}`);
      this.program = gl.createProgram(); gl.attachShader(this.program, vertex); gl.attachShader(this.program, fragment); gl.linkProgram(this.program);
      gl.deleteShader(vertex); gl.deleteShader(fragment);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(this.program));
      this.matrix = gl.getUniformLocation(this.program, 'u_matrix');
      this.buffer = gl.createBuffer(); this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      for (const [name, size, offset] of [['a_position', 3, 0], ['a_shade', 1, 12], ['a_edge', 1, 16]]) {
        const location = gl.getAttribLocation(this.program, name); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 20, offset);
      }
      gl.bindVertexArray(null);
    },
    render(gl, input) {
      if (this.dirty) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        this.count = this.vertices.length / 5; this.vertices = null; this.dirty = false;
      }
      if (!this.count) return;
      // Multiply in JS double precision, then send local-meter coordinates to GL.
      // MapLibre 5.6.2 exposes the Mercator matrix in defaultProjectionData.
      const matrix = input.defaultProjectionData.mainMatrix, local = new Float32Array(16);
      for (let row = 0; row < 4; row++) {
        local[row] = matrix[row] * unit; local[4 + row] = matrix[4 + row] * unit; local[8 + row] = matrix[8 + row] * unit;
        local[12 + row] = matrix[row] * origin.x + matrix[4 + row] * origin.y + matrix[12 + row];
      }
      gl.useProgram(this.program); gl.bindVertexArray(this.vao); gl.uniformMatrix4fv(this.matrix, false, local);
      gl.disable(gl.CULL_FACE); gl.drawArrays(gl.TRIANGLES, 0, this.count); gl.bindVertexArray(null);
    },
    onRemove(map, gl) { gl.deleteBuffer(this.buffer); gl.deleteVertexArray(this.vao); gl.deleteProgram(this.program); this.vertices = null; this.signature = ''; }
  };
}
