// Small reusable light materials. Rendering needs only image draws, not live filters.
export function createHologramMaterials(colors) {
  const beams = new Map(), orbs = new Map();
  const width = 128, height = 320;
  const alpha = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const v = y / (height - 1), spread = Math.max(.012, 1 - v);
    const edgeIn = Math.min(1, v / .14), crownFade = edgeIn * edgeIn * (3 - 2 * edgeIn);
    const bands = .88 + .12 * Math.cos(y * Math.PI / 2);
    for (let x = 0; x < width; x++) {
      const u = Math.abs((x / (width - 1) * 2 - 1) / spread);
      if (u >= 1) continue;
      const edge = Math.min(1, (1 - u) / .28);
      const feather = edge * edge * (3 - 2 * edge);
      const core = .46 + .54 * Math.exp(-u * u * 4.8);
      const signal = .94 + .06 * Math.sin(x * 1.9 + y * .17) * Math.sin(y * .31);
      alpha[y * width + x] = Math.round(255 * crownFade * feather * core * (.55 + .43 * v ** 1.7) * bands * signal);
    }
  }
  for (const color of colors) {
    const rgb = [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16));
    const beam = document.createElement('canvas'); beam.width = width; beam.height = height;
    const context = beam.getContext('2d'), pixels = context.createImageData(width, height);
    for (let i = 0; i < alpha.length; i++) {
      pixels.data.set(rgb, i * 4); pixels.data[i * 4 + 3] = alpha[i];
    }
    context.putImageData(pixels, 0, 0); beams.set(color, beam);

    const orb = document.createElement('canvas'); orb.width = orb.height = 64;
    const painter = orb.getContext('2d');
    const shade = amount => `rgb(${rgb.map(channel => Math.round(channel * amount)).join(',')})`;
    const glow = painter.createRadialGradient(26, 23, 2, 32, 32, 28);
    glow.addColorStop(0, color); glow.addColorStop(.48, shade(.96));
    glow.addColorStop(.84, shade(.76)); glow.addColorStop(1, shade(.42));
    painter.fillStyle = glow; painter.beginPath(); painter.arc(32, 32, 27, 0, Math.PI * 2); painter.fill();
    painter.strokeStyle = color; painter.lineWidth = 1.2; painter.stroke();
    painter.fillStyle = color === '#FF0000' ? color : '#ffffff';
    painter.globalAlpha = .28; painter.beginPath(); painter.ellipse(25, 23, 4, 2.5, -.45, 0, Math.PI * 2); painter.fill();
    orbs.set(color, orb);
  }
  return {
    beams, orbs,
    dispose() { for (const canvas of [...beams.values(), ...orbs.values()]) canvas.width = canvas.height = 1; beams.clear(); orbs.clear(); }
  };
}

export function drawProjectionBeam(ctx, texture, anchor, logoX, top, halfWidth) {
  const height = anchor.y - top;
  if (height <= 1) return;
  ctx.save();
  // Shear the material toward the real address; only the hologram head can wander.
  ctx.transform(1, 0, (anchor.x - logoX) / height, 1, logoX - halfWidth, top);
  ctx.drawImage(texture, 0, 0, halfWidth * 2, height);
  ctx.restore();
}
