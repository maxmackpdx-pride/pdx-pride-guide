import {extrusionAmount} from './venue-roofs.js?v=20260926-placez-roofs';

export function createHologramMaterials(colors) {
  const beams = new Map(), orbs = new Map();
  for (const color of colors) {
    const width = 64, height = 256;
    const beam = document.createElement('canvas'); beam.width = width; beam.height = height;
    const context = beam.getContext('2d'), pixels = context.createImageData(width, height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4, edge = Math.abs(x / (width - 1) - .5) * 2, fade = Math.pow(1 - edge, 2.4);
      const a = Math.floor(255 * fade * (.18 + .55 * Math.pow(1 - y / (height - 1), 1.15)));
      const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
      pixels.data[i] = r; pixels.data[i + 1] = g; pixels.data[i + 2] = b; pixels.data[i + 3] = a;
    }
    context.putImageData(pixels, 0, 0); beams.set(color, beam);
    const orb = document.createElement('canvas'); orb.width = orb.height = 96;
    const octx = orb.getContext('2d');
    const glow = octx.createRadialGradient(48, 48, 4, 48, 48, 46);
    glow.addColorStop(0, color + 'ee'); glow.addColorStop(.35, color + '88'); glow.addColorStop(1, color + '00');
    octx.fillStyle = glow; octx.beginPath(); octx.arc(48, 48, 46, 0, Math.PI * 2); octx.fill();
    orbs.set(color, orb);
  }
  return {
    beams, orbs,
    dispose() { for (const canvas of [...beams.values(), ...orbs.values()]) canvas.width = canvas.height = 1; beams.clear(); orbs.clear(); }
  };
}

export function projectorGroundScale(zoom){
  const value=Math.max(0,Math.min(1,(zoom-12)/3));
  const amount=window.__mapzMap?extrusionAmount(window.__mapzMap):0;
  // No ground disks once marks sit on roofs. Flat map keeps a tight 30% spill.
  if(amount>0.18)return 0;
  return (.28+.72*value*value*(3-2*value))*0.3*(1-amount);
}

export function drawProjectionBeam(ctx, texture, anchor, logoX, top, halfWidth, flowScale) {
  const height = anchor.y - top;
  if (height <= 1) return;
  // Events pass wide halfWidth and default to 0.3 flow cut.
  // Placez pass tiny halfWidth with flowScale=1 so the shaft stays a thin needle.
  const scale = flowScale != null ? flowScale : (halfWidth >= 20 ? 0.3 : 1);
  const w = Math.max(0.75, halfWidth * scale);
  ctx.save();
  ctx.transform(1, 0, (anchor.x - logoX) / height, 1, logoX - w, top);
  ctx.drawImage(texture, 0, 0, w * 2, height);
  ctx.restore();
}
