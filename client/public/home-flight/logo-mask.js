// Render the venue's actual artwork as a white hologram. Different source files
// need different ink extraction; treating dark lettering as light loses the logo.
export function logoCoverage(r, g, b, alpha, mode = 'light') {
  const opacity = alpha / 255;
  if (mode === 'alpha' || mode === 'grayscale') return opacity;
  const maximum = Math.max(r, g, b) / 255;
  const minimum = Math.min(r, g, b) / 255;
  let ink = maximum * opacity, floor = .16, range = .64;
  if (mode === 'dark') { ink = 1 - (.2126 * r + .7152 * g + .0722 * b) / 255; floor = .12; range = .65; }
  if (mode === 'chroma') { ink = maximum - minimum; floor = .22; range = .35; }
  if (mode === 'light-clean') { ink = maximum; floor = .55; range = .35; }
  if (mode === 'light-faint') { ink = maximum; floor = .06; range = .27; }
  if (mode === 'white-ink') { ink = minimum; floor = .55; range = .35; }
  const edge = Math.max(0, Math.min(1, (ink - floor) / range));
  return (mode === 'light' ? 1 : opacity) * edge * edge * (3 - 2 * edge);
}
