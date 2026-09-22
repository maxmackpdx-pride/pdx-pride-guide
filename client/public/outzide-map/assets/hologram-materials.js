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
    painter.save(); painter.translate(32, 32); painter.rotate(-.08);
    // Idle waypoints read as low, Saturn-like scanner disks instead of balls.
    // The ring stays wider than the core so the silhouette remains obvious at map scale.
    painter.shadowColor = color; painter.shadowBlur = 9;
    painter.globalAlpha = .22; painter.strokeStyle = color; painter.lineWidth = 6;
    painter.beginPath(); painter.ellipse(0, 0, 27, 7.5, 0, 0, Math.PI * 2); painter.stroke();
    painter.shadowBlur = 4; painter.globalAlpha = .72; painter.lineWidth = 1.4;
    painter.beginPath(); painter.ellipse(0, 0, 27, 7.5, 0, 0, Math.PI * 2); painter.stroke();
    const glow = painter.createRadialGradient(-3, -2, 1, 0, 0, 11);
    glow.addColorStop(0, color === '#FF0000' ? color : '#ffffff');
    glow.addColorStop(.3, color); glow.addColorStop(.72, shade(.82)); glow.addColorStop(1, shade(.38));
    painter.globalAlpha = 1; painter.fillStyle = glow;
    painter.beginPath(); painter.ellipse(0, 0, 10, 5.7, 0, 0, Math.PI * 2); painter.fill();
    painter.strokeStyle = color; painter.lineWidth = 1; painter.stroke();
    // Repaint the near half of the ring across the planet to create real overlap.
    painter.shadowBlur = 2; painter.globalAlpha = .95; painter.lineWidth = 1.5;
    painter.beginPath(); painter.ellipse(0, 0, 27, 7.5, 0, 0, Math.PI); painter.stroke();
    painter.restore();
    orbs.set(color, orb);
  }
  return {
    beams, orbs,
    dispose() { for (const canvas of [...beams.values(), ...orbs.values()]) canvas.width = canvas.height = 1; beams.clear(); orbs.clear(); }
  };
}

export function projectorGroundScale(zoom){
  const value=Math.max(0,Math.min(1,(zoom-12)/3));
  return .28+.72*value*value*(3-2*value);
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

// Concentric waves travel outward across the same shallow ground plane as the disk.
// The geographic anchor never follows the floating head; reduced motion stays still.
export function drawGroundRipples(ctx, anchor, radius, color, seconds, reducedMotion, phase=0) {
  ctx.save();
  ctx.translate(anchor.x, anchor.y);
  ctx.rotate(-.08);
  ctx.strokeStyle=color;
  for(let i=0;i<3;i++){
    const progress=reducedMotion?(i+.5)/3:((seconds/3.6+i/3+phase)%1+1)%1;
    const waveRadius=radius*(.55+progress*1.3);
    const opacity=Math.sin(progress*Math.PI)**2*.5;
    ctx.beginPath();ctx.ellipse(0,0,waveRadius,waveRadius*7.5/27,0,0,Math.PI*2);
    ctx.globalAlpha=opacity*.2;ctx.lineWidth=3;ctx.stroke();
    ctx.globalAlpha=opacity;ctx.lineWidth=.8;ctx.stroke();
  }
  ctx.restore();
}
