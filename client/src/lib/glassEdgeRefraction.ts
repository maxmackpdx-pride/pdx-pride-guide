import { glassDistance, type CornerRadii } from './glassShape';
/** Background-only lens displacement, normal to the nearest rounded glass edge. */
export function glassEdgeDisplacement(
  x: number, y: number, width: number, height: number, opticalScale = 72,
  radii: CornerRadii = [28,28,28,28], invertBands = true,
): readonly [number, number] {
  // 60% wider optical band; the physical dock radius and brand edge stay fixed.
  const rim = Math.min(14, height * .22) * 1.6;
  const sdf = (px: number, py: number) => glassDistance(px, py, width, height, radii);
  const distance = sdf(x, y);
  if (distance <= -rim) return [0, 0];
  // The SDF gradient follows straight edges and turns smoothly around corners.
  const nx = sdf(x + .5, y) - sdf(x - .5, y);
  const ny = sdf(x, y + .5) - sdf(x, y - .5);
  const magnitude = Math.hypot(nx, ny);
  if (!magnitude) return [0, 0];
  const t = Math.max(0, Math.min(1, (distance + rim) / rim));
  // Rolled-lens profile from Tucker's clear-glass references: flatten the
  // inner shoulder, concentrate bending at the rim, and keep both joins C2.
  // Keep the map within RG bounds; optical strength is applied by the filter.
  const bend = t * t * t * (t * (t * 6 - 15) + 10) * .46;
  const dx = -nx / magnitude * bend;
  let dy = -ny / magnitude * bend;
  // Fold the real background vertically through the top/bottom surface band.
  // In the band core sampleY = 2 * foldLine - y, so its slope is -1.
  // Feather into the original rounded perimeter and the undistorted center.
  const depth = height / 2 - Math.abs(y);
  const smooth = (a: number, b: number, value: number) => {
    const u = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  if (invertBands && depth > 0 && depth < rim && Math.abs(ny / magnitude) > .7) {
    const band = smooth(.08, .24, depth / rim) * (1 - smooth(.65, 1, depth / rim));
    const straightEdge = smooth(.7, .98, Math.abs(ny / magnitude));
    const fold = -Math.sign(y) * 2 * (rim * .45 - depth) / opticalScale;
    dy = dy * (1 - band * straightEdge) + fold * band * straightEdge;
  }
  return [dx, dy];
}

