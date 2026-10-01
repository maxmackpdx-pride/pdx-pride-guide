/** Equal category areas with luminous transitions, never cycling colors. */
export function resourceGradientStops(colors: string[]) {
  const unique = [...new Set(colors)];
  const width = 100 / unique.length;
  return unique.flatMap((color, index) => {
    const stops = [
      { color, offset: index === 0 ? 0 : index * width + width * .24 },
      { color, offset: index === unique.length - 1 ? 100 : (index + 1) * width - width * .24 },
    ];
    if (index < unique.length - 1) stops.push({
      // Perceptual hue mixing keeps contrasting neon colors from turning muddy.
      color: `color-mix(in srgb, color-mix(in oklch, ${color} 50%, ${unique[index + 1]}) 92%, var(--text-heading))`,
      offset: (index + 1) * width,
    });
    return stops;
  });
}
export function resourceGradient(colors: string[]) {
  return `linear-gradient(135deg, ${resourceGradientStops(colors).map(stop => `${stop.color} ${stop.offset}%`).join(", ")})`;
}
