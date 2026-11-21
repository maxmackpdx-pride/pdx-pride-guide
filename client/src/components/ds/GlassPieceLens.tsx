import { useEffect, useId, useRef, useState } from "react";
import { glassDistance, readGlassRadii } from "@/lib/glassShape";

/** Refract only the backdrop along the mounted shell's convex rim. The
 * displacement map is geometry, so it never needs to redraw during motion. */
export function GlassPieceLens() {
  const id = useId().replace(/[^a-z0-9-]/gi, "");
  const svg = useRef<SVGSVGElement>(null);
  const [map, setMap] = useState<{ href: string; scale: number }>();
  useEffect(() => {
    const host = svg.current?.closest<HTMLElement>("[data-glass-piece]");
    if (!host || !CSS.supports("backdrop-filter", "url(#lens)")) return;
    let frame = 0;
    let last = "";
    function update() {
      if (!host) return;
      const width = host.offsetWidth, height = host.offsetHeight;
      if (!width || !height) return;
      const style = getComputedStyle(host);
      const radii = readGlassRadii(style, width, height);
      const bevel = parseFloat(style.getPropertyValue("--glass-bevel"));
      const strength = parseFloat(style.getPropertyValue("--glass-refraction"));
      const key = [width, height, ...radii, bevel, strength].join(",");
      if (key === last || !bevel || !strength) return;
      last = key;
      const ratio = Math.min(1, 360 / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(2, Math.round(width * ratio));
      canvas.height = Math.max(2, Math.round(height * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pixels = ctx.createImageData(canvas.width, canvas.height);
      const distance = (x: number, y: number) => glassDistance(x, y, width, height, radii);
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        const px = (x + 0.5) / ratio - width / 2, py = (y + 0.5) / ratio - height / 2;
        const depth = -distance(px, py);
        const index = 4 * (y * canvas.width + x);
        let dx = 0, dy = 0;
        if (depth >= 0 && depth < bevel) {
          const gx = distance(px + 1, py) - distance(px - 1, py);
          const gy = distance(px, py + 1) - distance(px, py - 1);
          const weight = Math.cos(depth / bevel * Math.PI / 2) / (Math.hypot(gx, gy) || 1);
          dx = -gx * weight;
          dy = -gy * weight;
        }
        pixels.data[index] = 128 + 127 * dx;
        pixels.data[index + 1] = 128 + 127 * dy;
        pixels.data[index + 2] = 128;
        pixels.data[index + 3] = 255;
      }
      ctx.putImageData(pixels, 0, 0);
      setMap({ href: canvas.toDataURL(), scale: strength });
    }
    // A ResizeObserver fires on mount inside the opening animation. Leave the
    // compositor its frame budget and build the texture after the grow settles.
    const schedule = () => {
      cancelAnimationFrame(frame);
      if (host.dataset.cardEntering !== "true") frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(host);
    host.addEventListener("zaylist:card-settled", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("zaylist:card-settled", schedule);
    };
  }, []);
  useEffect(() => {
    const host = svg.current?.closest<HTMLElement>("[data-glass-piece]");
    if (!host || !map) return;
    host.style.setProperty("--glass-lens", `url(#piece-lens-${id})`);
    return () => { host.style.removeProperty("--glass-lens"); };
  }, [id, map]);
  return <svg ref={svg} width="0" height="0" aria-hidden="true" focusable="false" className="z-filter-defs">
    <defs><filter id={`piece-lens-${id}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      {map && <><feImage href={map.href} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="rim" />
        <feDisplacementMap in="SourceGraphic" in2="rim" scale={map.scale} xChannelSelector="R" yChannelSelector="G" /></>}
    </filter></defs>
  </svg>;
}
