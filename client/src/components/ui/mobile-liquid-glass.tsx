import { useContext, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { glassEdgeDisplacement } from "@/lib/glassEdgeRefraction";
import { readGlassRadii } from '@/lib/glassShape';
import { GlassInversionBands } from './glass-inversion-bands';
import { DockMaterialContext, dockOpticalParameters, supportsDockRefraction } from "@/lib/dockMaterial";

// 21st LiquidGlass 2759: SDF texture adapted to local edge normals.
// The rim filter samples the actual backdrop. The demo's inversion adapter
// separately mirrors its designated HTML scene so Safari can show both folds.
export function MobileLiquidGlass({ quiet }: { quiet: boolean }) {
  const material = useContext(DockMaterialContext);
  const id = `dock-liquid-${useId().replace(/:/g, "")}`;
  const ref = useRef<HTMLSpanElement>(null);
  const filterRef = useRef<SVGFilterElement>(null);
  const [map, setMap] = useState("");
  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(supportsDockRefraction()); }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el || quiet || !supported) return;
    let resizeFrame = 0, motionFrame = 0;
    let height = 82, previousY = window.scrollY, previousTime = performance.now();
    let velocity = 0, renderedAt = 0;
    const paintOptics = (speed: number) => {
      const { scale, separation, stretch } = dockOpticalParameters(height, speed, material);
      filterRef.current?.querySelectorAll("feDisplacementMap").forEach((node, index) =>
        node.setAttribute("scale", String(scale + (index - 1) * separation)));
      const green = filterRef.current?.querySelector("feFuncG");
      green?.setAttribute("slope", String(stretch));
      green?.setAttribute("intercept", String((1 - stretch) * .5));
    };
    const draw = () => {
      resizeFrame = 0;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      height = rect.height;
      const w = Math.min(288, Math.ceil(rect.width)), h = Math.max(24, Math.round(w * rect.height / rect.width));
      const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      const data = ctx.createImageData(w, h);
      const radii = readGlassRadii(getComputedStyle(el), rect.width, rect.height);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const [dx, dy] = glassEdgeDisplacement(
          ((x + .5) / w - .5) * rect.width, ((y + .5) / h - .5) * rect.height, rect.width, rect.height,
          dockOpticalParameters(rect.height, 0, material).scale, radii, material !== 'm3');
        const i = (y * w + x) * 4;
        data.data[i] = (0.5 + dx) * 255; data.data[i + 1] = (0.5 + dy) * 255;
        data.data[i + 2] = 128; data.data[i + 3] = 255;
      }
      ctx.putImageData(data, 0, 0); setMap(canvas.toDataURL()); paintOptics(velocity);
    };
    // Track geometry during the morph, not after a trailing resize debounce.
    const observer = new ResizeObserver(() => { if (!resizeFrame) resizeFrame = requestAnimationFrame(draw); });
    const tick = (now: number) => {
      if (now - renderedAt >= 32) {
        velocity *= Math.exp(-(now - renderedAt) / 130);
        paintOptics(velocity); renderedAt = now;
      }
      if (Math.abs(velocity) > .01) motionFrame = requestAnimationFrame(tick);
      else { paintOptics(0); motionFrame = 0; }
    };
    const scroll = () => {
      const now = performance.now();
      velocity = Math.max(-3, Math.min(3, (window.scrollY - previousY) / Math.max(16, now - previousTime)));
      previousY = window.scrollY; previousTime = now;
      if (!motionFrame) { renderedAt = now; motionFrame = requestAnimationFrame(tick); }
    };
    draw(); observer.observe(el); window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      observer.disconnect(); cancelAnimationFrame(resizeFrame); cancelAnimationFrame(motionFrame);
      window.removeEventListener("scroll", scroll);
    };
  }, [quiet, supported, material]);
  const refract = Boolean(map && supported && !quiet);
  return <>
    <svg width="0" height="0" className="z-filter-defs" aria-hidden="true" focusable="false"><defs>
      <filter ref={filterRef} id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        {map && <feImage href={map} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="edge-map" />}
        <feComponentTransfer in="edge-map" result="lens"><feFuncR type="identity" /><feFuncG type="linear" slope="1" intercept="0" /><feFuncB type="identity" /><feFuncA type="identity" /></feComponentTransfer>
        <feDisplacementMap in="SourceGraphic" in2="lens" scale="38.4" xChannelSelector="R" yChannelSelector="G" result="red-shift" />
        <feColorMatrix in="red-shift" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
        <feDisplacementMap in="SourceGraphic" in2="lens" scale="40" xChannelSelector="R" yChannelSelector="G" result="green-shift" />
        <feColorMatrix in="green-shift" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
        <feDisplacementMap in="SourceGraphic" in2="lens" scale="41.6" xChannelSelector="R" yChannelSelector="G" result="blue-shift" />
        <feColorMatrix in="blue-shift" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
        <feComposite in="red" in2="green" operator="arithmetic" k2="1" k3="1" result="rg" />
        <feComposite in="rg" in2="blue" operator="arithmetic" k2="1" k3="1" />
      </filter>
    </defs></svg>
    <span ref={ref} className="z-mobile-liquid__background" data-refract={refract}
      data-optics={quiet ? "reduced" : refract ? "refractive" : "translucent-fallback"}
      aria-hidden="true" style={{ "--dock-refraction": `url(#${id})` } as CSSProperties} />
    {material === 'm3' && <GlassInversionBands quiet={quiet} />}
    <span className="z-glass__tint" aria-hidden="true" />
    <span className="z-mobile-liquid__specular" aria-hidden="true" />
    <span className="z-mobile-liquid__outer" aria-hidden="true" />
    <span className="z-glass__edge" aria-hidden="true" />
    <span className="z-glass__rainbow" aria-hidden="true" />
  </>;
}

