import { useEffect, type RefObject } from "react";

export type GlitchFxOptions = {
  bars?: boolean;
  text?: string | null;
  lineAlpha?: number;
  heavy?: boolean;
  ghost?: number;
  band?: number;
  freq?: number;
  pixel?: number;
};

export function useGlitchFx(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: GlitchFxOptions,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const neon = ["#E40303", "#FF8C00", "#FFED00", "#008026", "#004DFF", "#750787", "#FF1FA0", "#19E3FF", "#C8FA3C"];
    let w = 1;
    let h = 1;
    let stopped = false;
    let t = 0;
    let burst = 0;
    let rafId = 0;

    const init = () => {
      const rect = canvas.getBoundingClientRect();
      const cw = Math.max(1, rect.width | 0);
      const ch = Math.max(1, rect.height | 0);
      const px = options.pixel || 1;
      w = Math.max(1, Math.round(cw / px));
      h = Math.max(1, Math.round(ch / px));
      canvas.width = w;
      canvas.height = h;
      canvas.style.imageRendering = "pixelated";
    };

    const drawText = (txt: string, cx: number, cy: number, size: number, dx: number) => {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `400 ${size}px "Barlow Condensed", sans-serif`;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(255,31,160,0.85)";
      ctx.fillText(txt, cx - dx, cy);
      ctx.fillStyle = "rgba(25,227,255,0.85)";
      ctx.fillText(txt, cx + dx, cy);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillText(txt, cx, cy);
      ctx.globalCompositeOperation = "source-over";
    };

    const frame = () => {
      if (stopped) return;
      t++;
      ctx.clearRect(0, 0, w, h);

      if (options.bars) {
        const n = neon.length;
        const bw = w / n;
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = neon[i];
          ctx.fillRect(Math.floor(i * bw), 0, Math.ceil(bw) + 1, h);
        }
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, w, h);
      }

      if (options.text) {
        const jitter = burst > 0 ? (Math.random() - 0.5) * 7 : 0;
        const dx = burst > 0 ? 3 + Math.random() * 8 : 3;
        drawText(options.text, w / 2 + jitter, h / 2, Math.min(w * 0.23, h * 0.46), dx);
      }

      const freq = options.freq ?? (options.heavy ? 0.05 : 0.025);
      const gh = options.ghost ?? 0.16;
      if (burst <= 0 && Math.random() < freq) burst = 2 + (Math.random() * 5 | 0);
      if (burst > 0) {
        burst--;
        const count = (options.heavy ? 4 : 3) + (Math.random() * 5 | 0);
        for (let k = 0; k < count; k++) {
          const sy = (Math.random() * h) | 0;
          const sh = (3 + Math.random() * 24) | 0;
          const ox = ((Math.random() - 0.5) * (options.heavy ? 80 : 56)) | 0;
          try {
            ctx.drawImage(canvas, 0, sy, w, sh, ox, sy, w, sh);
          } catch {
            /* canvas read during draw */
          }
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = k % 2 ? `rgba(25,227,255,${gh})` : `rgba(255,31,160,${gh})`;
          ctx.fillRect(0, sy, w, sh);
          ctx.globalCompositeOperation = "source-over";
        }
      }

      ctx.fillStyle = `rgba(0,0,0,${options.lineAlpha ?? 0.25})`;
      for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);

      const bandH = Math.max(14, Math.round(h * 0.22));
      const by = ((t * 0.5) % (h + bandH * 2)) - bandH;
      const g = ctx.createLinearGradient(0, by, 0, by + bandH);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, `rgba(255,255,255,${options.band ?? (options.heavy ? 0.06 : 0.045)})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, by, w, bandH);

      rafId = requestAnimationFrame(frame);
    };

    init();
    frame();

    const onResize = () => init();
    window.addEventListener("resize", onResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        if (canvas.getBoundingClientRect().width > 0) init();
      });
      ro.observe(canvas);
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, [canvasRef, options.bars, options.text, options.lineAlpha, options.heavy, options.ghost, options.band, options.freq, options.pixel]);
}