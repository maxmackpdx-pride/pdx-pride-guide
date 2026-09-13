/** Shallow rounded-rectangle lens. Coordinates are CSS pixels from its center. */
export function glassEdgeSample(
  x: number, y: number, width: number, height: number,
) {
  const radius = Math.min(28, width / 2, height / 2);
  const rim = Math.min(12, height * .18, width * .18);
  const qx = Math.abs(x) - width / 2 + radius;
  const qy = Math.abs(y) - height / 2 + radius;
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
  const cornerDistance = Math.hypot(ox, oy);
  const distance = Math.min(Math.max(qx, qy), 0) + cornerDistance - radius;
  if (rim <= 0 || distance <= -rim || distance > 0) return { dx:0, dy:0, reflection:0 };
  // Analytic SDF gradient: no center-directed radial warp or vertical scroll skew.
  const nx = cornerDistance ? ox / cornerDistance * Math.sign(x) : qx > qy ? Math.sign(x) : 0;
  const ny = cornerDistance ? oy / cornerDistance * Math.sign(y) : qx > qy ? 0 : Math.sign(y);
  const t = Math.max(0, Math.min(1, (distance + rim) / rim));
  // Quintic shoulder reaches exactly zero with zero first/second derivatives.
  const shoulder = t * t * t * (t * (t * 6 - 15) + 10);
  const bend = shoulder * .38;
  const light = Math.max(0, nx * -.6 + ny * -.8);
  const returnLight = Math.max(0, nx * .8 + ny * .6);
  const reflection = shoulder * (.012 + .14 * light ** 8 + .045 * returnLight ** 10);
  return { dx:-nx * bend, dy:-ny * bend, reflection };
}

export function glassEdgeDisplacement(x: number, y: number, width: number, height: number): readonly [number, number] {
  const { dx, dy } = glassEdgeSample(x, y, width, height);
  return [dx, dy];
}

// 128 is the exact neutral byte. SVG transfer decodes it to exactly .5,
// avoiding the old 128/255 bias that moved even the supposedly flat center.
export const encodeGlassDisplacement = (value: number) => Math.round(128 + value * 254);

// Mobile-bottom dock only; the existing header optics remain unchanged.
export function dockLensParameters(height: number, speed: number, material: "m3" | "hybrid") {
  void speed;
  return { scale: Math.min(material === "m3" ? 24 : 32, height * .45), separation: material === "m3" ? .45 : .8, stretch: 1 };
}
