// Event-only optical material. Placez needles keep their existing renderer.
export const EVENT_PROJECTION_COLOR = '#bba0ff';
export const EVENT_PROJECTION_CLOCK = '#bcff75';

export function eventProjectionSway(seconds, phase, scale = 1, reduced = false) {
  return reduced ? 0 : scale * (5 * Math.sin(seconds * .29 + phase) + 1.5 * Math.sin(seconds * .17 + phase * 1.7));
}

export function eventProjectionGeometry(anchor, center, scale = 1) {
  const top = center.y - 32 * scale;
  const height = anchor.y - top;
  // The available vertical space limits the fan, even after collision avoidance.
  const halfWidth = Math.max(0, Math.min(48 * scale, height / 5.6));
  return {anchor, x: center.x, top, height, halfWidth};
}

export function createEventProjection() {
  const texture = document.createElement('canvas');
  texture.width = 192; texture.height = 768;
  const painter = texture.getContext('2d');
  const pixels = painter.createImageData(texture.width, texture.height);
  for (let y = 0; y < texture.height; y++) {
    const t = y / (texture.height - 1), taper = Math.max(.002, 1 - t);
    for (let x = 0; x < texture.width; x++) {
      const across = Math.abs(x / (texture.width - 1) * 2 - 1) / taper;
      if (across > 1) continue;
      const i = (y * texture.width + x) * 4;
      const edge = Math.exp(-Math.pow((across - .96) / .045, 2));
      const scan = .92 + .08 * Math.cos(y * Math.PI / 2);
      const filament = .92 + .08 * Math.cos(across * 150);
      const crownFade = Math.min(1, t * 18);
      const alpha = crownFade * scan * filament * (.065 + .12 * t + .3 * edge + .3 * Math.pow(t, 9));
      pixels.data[i] = 184 + 55 * Math.pow(t, 5);
      pixels.data[i + 1] = 147 + 81 * Math.pow(t, 5);
      pixels.data[i + 2] = 255;
      pixels.data[i + 3] = Math.round(255 * alpha);
    }
  }
  painter.putImageData(pixels, 0, 0);
  return {
    draw(ctx, geometry, seconds, phase, reduced = false) {
      const {anchor, x, top, height, halfWidth} = geometry;
      if (height <= 1 || halfWidth <= 0) return;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      // Shear around the fixed apex. All of the image's light is inside its triangle.
      ctx.transform(1, 0, (anchor.x - x) / height, 1, x - halfWidth, top);
      ctx.drawImage(texture, 0, 0, halfWidth * 2, height);
      ctx.restore();
      ctx.save();ctx.globalCompositeOperation = 'screen';
      const breath = reduced ? 1 : .94 + .06 * Math.sin(seconds * .7 + phase);
      const radius = Math.max(3, Math.min(12, halfWidth * .2));
      const glow = ctx.createRadialGradient(anchor.x, anchor.y, 0, anchor.x, anchor.y, radius);
      glow.addColorStop(0, '#ffffff');glow.addColorStop(.12, '#f0ddff');
      glow.addColorStop(.38, '#bb91ff99');glow.addColorStop(1, '#bba0ff00');
      ctx.globalAlpha *= breath;ctx.fillStyle = glow;
      ctx.fillRect(anchor.x - radius, anchor.y - radius, radius * 2, radius * 2);
      ctx.fillStyle = '#f8efff';ctx.beginPath();ctx.arc(anchor.x, anchor.y, Math.max(.8, radius * .11), 0, Math.PI * 2);ctx.fill();
      ctx.restore();
    },
    dispose() { texture.width = texture.height = 1; }
  };
}
