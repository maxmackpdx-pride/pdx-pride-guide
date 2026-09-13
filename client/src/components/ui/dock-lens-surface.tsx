import { useContext, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { encodeGlassDisplacement, glassEdgeSample, dockLensParameters } from "@/lib/dockLens";
import { DockMaterialContext, supportsDockRefraction } from "@/lib/dockMaterial";
import "./dock-lens-surface.css";

// 21st LiquidGlass 2759: SDF texture adapted to local edge normals.
// Each channel samples the actual backdrop, never a DOM clone or fake wallpaper.
export function DockLensSurface({ quiet }: { quiet: boolean }) {
  const material = useContext(DockMaterialContext);
  const id = `dock-liquid-${useId().replace(/:/g, "")}`;
  const ref = useRef<HTMLSpanElement>(null);
  const filterRef = useRef<SVGFilterElement>(null);
  const [map, setMap] = useState("");
  const [reflection, setReflection] = useState("");
  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(supportsDockRefraction()); }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let resizeFrame = 0;
    const canvas = document.createElement("canvas"), sheen = document.createElement("canvas");
    const paintOptics = (height: number) => {
      const { scale, separation } = dockLensParameters(height, 0, material);
      filterRef.current?.querySelectorAll("feDisplacementMap").forEach((node, index) =>
        node.setAttribute("scale", String(scale + (index - 1) * separation)));
    };
    const draw = () => {
      resizeFrame = 0;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const w = Math.min(864, Math.ceil(rect.width * Math.min(devicePixelRatio || 1, 1.5)));
      const h = Math.max(24, Math.round(w * rect.height / rect.width));
      canvas.width = sheen.width = w; canvas.height = sheen.height = h;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      const sheenCtx = sheen.getContext("2d"); if (!sheenCtx) return;
      const data = ctx.createImageData(w, h);
      const highlight = sheenCtx.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const { dx, dy, reflection } = glassEdgeSample(
          ((x + .5) / w - .5) * rect.width, ((y + .5) / h - .5) * rect.height, rect.width, rect.height);
        const i = (y * w + x) * 4;
        data.data[i] = encodeGlassDisplacement(dx); data.data[i + 1] = encodeGlassDisplacement(dy);
        data.data[i + 2] = 128; data.data[i + 3] = 255;
        highlight.data[i] = 190; highlight.data[i + 1] = 221; highlight.data[i + 2] = 230;
        highlight.data[i + 3] = reflection * 255;
      }
      ctx.putImageData(data, 0, 0); sheenCtx.putImageData(highlight, 0, 0);
      setMap(canvas.toDataURL()); setReflection(sheen.toDataURL()); paintOptics(rect.height);
    };
    // Track geometry during the morph, not after a trailing resize debounce.
    const observer = new ResizeObserver(() => { if (!resizeFrame) resizeFrame = requestAnimationFrame(draw); });
    draw(); observer.observe(el);
    return () => {
      observer.disconnect(); cancelAnimationFrame(resizeFrame);
    };
  }, [quiet, supported, material]);
  const refract = Boolean(map && supported && !quiet);
  return <>
    <svg width="0" height="0" className="z-filter-defs" aria-hidden="true" focusable="false"><defs>
      <filter ref={filterRef} id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        {map && <feImage href={map} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="edge-map" />}
        <feComponentTransfer in="edge-map" result="lens"><feFuncR type="linear" slope={255 / 254} intercept={-1 / 254} /><feFuncG type="linear" slope={255 / 254} intercept={-1 / 254} /><feFuncB type="identity" /><feFuncA type="identity" /></feComponentTransfer>
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
    <span className="z-glass__tint" aria-hidden="true" />
    <span className="z-mobile-liquid__specular" aria-hidden="true" style={reflection ? { "--lens-reflection": `url(${reflection})` } as CSSProperties : undefined} />
    <span className="z-mobile-liquid__outer" aria-hidden="true" />
    <span className="z-glass__edge" aria-hidden="true" />
    <span className="z-glass__rainbow" aria-hidden="true" />
  </>;
}
