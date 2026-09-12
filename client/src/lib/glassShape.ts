export type CornerRadii = readonly [number, number, number, number];

/** Rounded rectangle SDF; coordinates are centered. Circular buttons and
 * capsules are the same surface with radii equal to half the shorter side. */
export function glassDistance(x: number, y: number, width: number, height: number, radii: CornerRadii) {
  const corner = y < 0 ? (x < 0 ? 0 : 1) : (x < 0 ? 3 : 2);
  const radius = Math.min(radii[corner], width / 2, height / 2);
  const qx = Math.abs(x) - width / 2 + radius;
  const qy = Math.abs(y) - height / 2 + radius;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - radius;
}

export function glassShapeSample(x: number, y: number, width: number, height: number, radii: CornerRadii, band: number) {
  const distance = glassDistance(x, y, width, height, radii);
  const depth = -distance;
  if (depth < 0 || depth >= band) return { dx: 0, dy: 0, alpha: 0 };
  const nx = glassDistance(x + .05, y, width, height, radii) - glassDistance(x - .05, y, width, height, radii);
  const ny = glassDistance(x, y + .05, width, height, radii) - glassDistance(x, y - .05, width, height, radii);
  const length = Math.hypot(nx, ny);
  if (!length) return { dx: 0, dy: 0, alpha: 0 };
  // Reflect across the local tangent. This makes straight top and bottom
  // bands invert with slope -1 and lets the same band curve around a circle.
  const displacement = 2 * depth;
  const t = depth / band;
  const smooth = (a: number, b: number, value: number) => {
    const u = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  // Fade in after the physical rim and feather out before the clear center.
  // The edge, rainbow seam and controls remain separate foreground layers.
  const alpha = .86 * smooth(0, .14, t) * (1 - smooth(.54, 1, t));
  return { dx: nx / length * displacement, dy: ny / length * displacement, alpha };
}

export function readGlassRadii(style: CSSStyleDeclaration, width: number, height: number): CornerRadii {
  return [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius].map(value => {
    const [horizontal, vertical = horizontal] = value.split(/\s+/);
    const size = (token: string, dimension: number) => parseFloat(token) * (token.endsWith('%') ? dimension / 100 : 1);
    return Math.max(0, Math.min(size(horizontal, width), size(vertical, height), width / 2, height / 2));
  }) as unknown as CornerRadii;
}

