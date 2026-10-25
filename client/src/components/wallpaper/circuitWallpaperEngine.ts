import data from "./circuitWallpaperData.json";
import { QUAD_VS, SCENE_FS, FOCUS_FS } from "./circuitWallpaperShaders";
import artUrl from "./assets/art.jpg";
import flowUrl from "./assets/flow.png";
import riverUrl from "./assets/river-lines.png";
import pathsUrl from "./assets/map-paths.jpg";
import sparkleUrl from "./assets/sparkle-points.png";
import roadsUrl from "./assets/steady-roads.png";
import nodeMaskUrl from "./assets/node-emission-mask.png";

/**
 * Zaylist circuit wallpaper: a neon Portland map with light comets running its roads.
 * One WebGL2 context for the whole site. The comet layer is painted on a small offscreen
 * 2D canvas and sampled by the scene pass, so there is no second visible canvas.
 * Everything the frame loop touches is allocated once, up front.
 */

const MAP_W = 3072;
const MAP_H = 1536;
// Imported so the build hashes them: immutable one-year caching and automatic cache-busting on change.

const TEXTURES: ReadonlyArray<readonly [string, string]> = [
  ["art", artUrl],
  ["flow", flowUrl],
  ["riverLines", riverUrl],
  ["mapPaths", pathsUrl],
  ["sparklePoints", sparkleUrl],
  ["steadyRoads", roadsUrl],
  ["nodeMask", nodeMaskUrl],
];

const NEON: ReadonlyArray<readonly [number, number, number]> = [
  [0, 255, 255], [255, 0, 204], [255, 102, 0], [255, 95, 109], [57, 255, 20],
];
const TRANS: ReadonlyArray<readonly [number, number, number]> = [
  [91, 206, 250], [245, 169, 184], [255, 255, 255], [245, 169, 184], [91, 206, 250],
];
const HUES = [180, 312, 24, 353, 111];
const KIND_RIVER = 5;
const KIND_TRANS = 6;
const KINDS = 7;
const U_STEPS = 32;

const HEAT_W = 384;
const HEAT_H = 192;
const HEAT_LIFE = 8;
const HEAT_LUT = 1024;

type Rgb = readonly [number, number, number];
const mix = (a: Rgb, b: Rgb, t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function rainbow(t: number): [number, number, number] {
  const h = (((t % 1) + 1) % 1) * 6, c = 255, x = c * (1 - Math.abs((h % 2) - 1));
  return h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
}
function kindColor(kind: number, behind: number): [number, number, number] {
  const u = Math.max(0, Math.min(1, behind));
  if (kind === KIND_RIVER) return mix([0, 255, 255], rainbow(u * 0.65 + 0.4), 0.12 + u * 0.12);
  if (kind === KIND_TRANS) {
    const t = u * 4, i = Math.min(3, Math.floor(t));
    return mix(TRANS[i], TRANS[i + 1], t - i);
  }
  const token = NEON[kind];
  if (u <= 0.3) return [token[0], token[1], token[2]];
  const progress = (u - 0.3) / 0.7, t = Math.min(1, progress / 0.16);
  return mix(token, rainbow(progress), t * t * (3 - 2 * t));
}
const rgb = (c: ArrayLike<number>, white = 0) =>
  `rgb(${Math.round(c[0] + (255 - c[0]) * white)},${Math.round(c[1] + (255 - c[1]) * white)},${Math.round(c[2] + (255 - c[2]) * white)})`;

type Comet = {
  path: number; // index into routes, -1 when idle
  start: number;
  speed: number;
  previousHead: number;
  retry: number;
  kind: number; // 0..4 neon token, 5 river, 6 trans
  river: boolean;
  road: boolean;
  extraLong: boolean;
};

export type WallpaperOptions = {
  /** Phones and tablets: lower DPR, 30 fps, smaller comet layer. */
  touch: boolean;
};

export class CircuitWallpaperEngine {
  onLost: (() => void) | null = null;
  onRestored: (() => void) | null = null;

  private gl: WebGL2RenderingContext | null = null;
  private sceneProg!: WebGLProgram;
  private focusProg!: WebGLProgram;
  private quad!: WebGLBuffer;
  private vao!: WebGLVertexArrayObject;
  private textures: WebGLTexture[] = [];
  private heatTex!: WebGLTexture;
  private cometTex!: WebGLTexture;
  private sceneTex!: WebGLTexture;
  private fbo!: WebGLFramebuffer;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private fu: Record<string, WebGLUniformLocation | null> = {};

  private cometCanvas: HTMLCanvasElement;
  private cc: CanvasRenderingContext2D;
  private cometW = 0;
  private cometH = 0;
  private cssW = 0;
  private cssH = 0;
  private pxW = 0;
  private pxH = 0;
  private cometScale = 1;

  // Route geometry, flattened once.
  private routeCount = data.routes.length;
  private rx: Float64Array[] = [];
  private ry: Float64Array[] = [];
  private rlen: Float64Array[] = [];
  private rtotal: Float64Array;
  private rbounds: Float64Array; // 4 per route
  private conflict: Uint8Array;
  private lockActive: Uint8Array;
  private lockUntil: Float64Array;
  private nodeX: Float64Array;
  private nodeY: Float64Array;
  private nodeR: Float64Array;
  private nodeHit: Float64Array;
  private nodeKind: Uint8Array;
  private crossings: Array<{ node: number; along: number }[] | null> = [];
  private candidates: Int32Array;
  private desktopSide: Uint8Array;
  private dedicatedRoad: Uint8Array;
  private roadBlocked: Uint8Array; // route conflicts with a dedicated road
  private kinds: string[] = [];
  private headStr: string[] = [];
  private headLight: string[] = [];
  private ringStr: string[] = [];
  private glowSprites: HTMLCanvasElement[] = [];

  private comets: Comet[] = [];
  private roster: Comet[] = [];
  private visible: Comet[] = [];
  private launchCursor = 0;
  private nextLaunch = 0;
  private cometTime = 0;
  private cometLast = 0;

  private heatHits = new Float64Array(HEAT_W * HEAT_H).fill(-100);
  private heatBytes = new Uint8Array(HEAT_W * HEAT_H);
  private heatLut = new Uint8Array(HEAT_LUT);
  private heatNext = 0;
  private bounce = new Float32Array(32 * 3);
  private tmpA = new Float64Array(2);
  private tmpB = new Float64Array(2);
  private tmpP = new Float64Array(2);

  private time = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  private still = false;
  private disposed = false;
  private loaded = false;
  private nextFrameAt = 0;
  private readonly frameInterval: number;
  private readonly cometCount = 18;

  // Pointer parallax (mouse only), eased.
  private tilt = { x: 0, y: 0 };
  private tiltTarget = { x: 0, y: 0 };
  private readonly onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    this.tiltTarget.x = (e.clientX / Math.max(1, innerWidth) - 0.5) * 2;
    this.tiltTarget.y = (e.clientY / Math.max(1, innerHeight) - 0.5) * 2;
  };

  // Soft focus: slow aperture hunt between f/3.5 and f/6, one quadrant snaps sharp a fifth of the time.
  private focusClock = 0;
  private aperture = 4.6;
  private apFrom = 4.6;
  private apTo = 5.4;
  private apStart = 0;
  private apDur = 14;
  private qOrder = new Int8Array(4);
  private qIndex = 4;
  private qWindow = -1;
  private quad_ = 0;
  private sharp = 0;
  private static readonly QUADS = [
    [0, 0, 0.62, 0.62],
    [0.38, 0, 0.62, 0.62],
    [0, 0.38, 0.62, 0.62],
    [0.38, 0.38, 0.62, 0.62],
  ] as const;

  private readonly onContextLost = (e: Event) => {
    e.preventDefault();
    this.stopLoop();
    this.onLost?.();
  };
  private readonly onContextRestored = () => {
    if (this.disposed) return;
    try {
      this.initGl();
      this.uploadStatic();
      this.onRestored?.();
    } catch {
      this.onLost?.();
    }
  };

  constructor(private canvas: HTMLCanvasElement, private opts: WallpaperOptions) {
    this.frameInterval = opts.touch ? 1000 / 30 : 1000 / 60;
    this.cometCanvas = document.createElement("canvas");
    const cc = this.cometCanvas.getContext("2d");
    if (!cc) throw new Error("2d context unavailable");
    this.cc = cc;

    const n = this.routeCount;
    this.rtotal = new Float64Array(n);
    this.rbounds = new Float64Array(n * 4);
    for (let i = 0; i < n; i++) {
      const r = data.routes[i];
      const xs = new Float64Array(r.length), ys = new Float64Array(r.length), ls = new Float64Array(r.length);
      let total = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let j = 0; j < r.length; j++) {
        xs[j] = r[j][0]; ys[j] = r[j][1];
        if (j) { total += Math.hypot(xs[j] - xs[j - 1], ys[j] - ys[j - 1]); }
        ls[j] = total;
        x0 = Math.min(x0, xs[j]); x1 = Math.max(x1, xs[j]); y0 = Math.min(y0, ys[j]); y1 = Math.max(y1, ys[j]);
      }
      this.rx.push(xs); this.ry.push(ys); this.rlen.push(ls);
      this.rtotal[i] = total;
      this.rbounds.set([x0, y0, x1, y1], i * 4);
      this.crossings.push(null);
    }
    this.conflict = new Uint8Array(n * n);
    data.conflicts.forEach((row, i) => row.forEach((j) => { this.conflict[i * n + j] = 1; }));
    this.lockActive = new Uint8Array(n);
    this.lockUntil = new Float64Array(n);
    this.candidates = new Int32Array(n);
    this.desktopSide = new Uint8Array(n);
    data.desktopSideIds.forEach((i) => { this.desktopSide[i] = 1; });
    this.dedicatedRoad = new Uint8Array(n);
    data.dedicatedRoadIds.forEach((i) => { this.dedicatedRoad[i] = 1; });
    this.roadBlocked = new Uint8Array(n);
    for (let i = 0; i < n; i++) for (const j of data.dedicatedRoadIds) if (this.conflict[i * n + j]) this.roadBlocked[i] = 1;

    const m = data.nodes.length;
    this.nodeX = new Float64Array(m); this.nodeY = new Float64Array(m); this.nodeR = new Float64Array(m);
    this.nodeHit = new Float64Array(m).fill(-100);
    this.nodeKind = new Uint8Array(m);
    data.nodes.forEach((nd, i) => { this.nodeX[i] = nd[0]; this.nodeY[i] = nd[1]; this.nodeR[i] = nd[2]; });

    for (let k = 0; k < KINDS; k++) {
      for (let s = 0; s <= U_STEPS; s++) this.kinds.push(rgb(kindColor(k, s / U_STEPS)));
      const head = kindColor(k, 0);
      this.headStr.push(rgb(head));
      this.headLight.push(rgb(head, 0.65));
      this.ringStr.push(rgb(head, 0.45));
    }
    const mk = (kind: number, extra: Partial<Comet> = {}): Comet => ({
      path: -1, start: 0, speed: 80, previousHead: -1, retry: 0, kind, river: false, road: false, extraLong: false, ...extra,
    });
    for (let k = 0; k < 24; k++) this.comets.push(mk(k < 2 ? KIND_TRANS : k % 5, { extraLong: k < 2 }));
    const rivers = [0, 1, 2].map(() => mk(KIND_RIVER, { river: true }));
    const roads = [0, 1, 2, 3].map((k) => mk(k % 5, { road: true }));
    this.roster = [...this.comets.slice(0, this.cometCount), ...rivers, ...roads];
    this.visible = [...this.roster];
    for (let i = 0; i < HEAT_LUT; i++) this.heatLut[i] = Math.round(255 * Math.pow(1 - i / (HEAT_LUT - 1), 1.8));
    this.buildGlowSprites();
    for (let i = 0; i < 4; i++) this.qOrder[i] = i;

    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    this.initGl();
  }

  // ---- setup -------------------------------------------------------------------------------

  private buildGlowSprites() {
    for (let k = 0; k < KINDS; k++) {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d")!;
      const head = kindColor(k, 0);
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, `rgba(${Math.round(head[0] + (255 - head[0]) * 0.55)},${Math.round(head[1] + (255 - head[1]) * 0.55)},${Math.round(head[2] + (255 - head[2]) * 0.55)},0.9)`);
      grad.addColorStop(0.42, `rgba(${Math.round(head[0])},${Math.round(head[1])},${Math.round(head[2])},0.6)`);
      grad.addColorStop(1, `rgba(${Math.round(head[0])},${Math.round(head[1])},${Math.round(head[2])},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      this.glowSprites.push(c);
    }
  }

  private compile(type: number, src: string) {
    const gl = this.gl!;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader compile failed");
    return s;
  }

  private link(fs: string) {
    const gl = this.gl!;
    const p = gl.createProgram()!;
    gl.attachShader(p, this.compile(gl.VERTEX_SHADER, QUAD_VS));
    gl.attachShader(p, this.compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link failed");
    return p;
  }

  private initGl() {
    const gl = this.canvas.getContext("webgl2", {
      alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: "low-power",
    });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    this.sceneProg = this.link(SCENE_FS);
    this.focusProg = this.link(FOCUS_FS);
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const n of ["tilt", "viewSpan", "time", "density", "texture_", "bounce[0]", "scrollQ", "longPage"]) this.u[n] = gl.getUniformLocation(this.sceneProg, n);
    for (const n of ["texel", "sigma", "focusRect", "sharpness", "scene"]) this.fu[n] = gl.getUniformLocation(this.focusProg, n);
    this.textures = [];
    this.pxW = this.pxH = 0; // force target realloc
  }

  /** Fetch and upload the static textures. Resolves once the wallpaper can paint. */
  async load(signal?: AbortSignal): Promise<void> {
    const imgs = await Promise.all(TEXTURES.map(async ([, url]) => {
      const im = new Image();
      im.decoding = "async";
      im.src = url;
      await im.decode();
      return im;
    }));
    if (signal?.aborted || this.disposed) return;
    this.images = imgs;
    this.uploadStatic();
    this.loaded = true;
    this.sync();
  }
  private images: HTMLImageElement[] = [];

  private makeTex(unit: number, linear = true) {
    const gl = this.gl!;
    const t = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  private uploadStatic() {
    const gl = this.gl;
    if (!gl || !this.images.length) return;
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    this.textures = [];
    gl.useProgram(this.sceneProg);
    TEXTURES.forEach(([name], i) => {
      const t = this.makeTex(i);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, this.images[i]);
      this.textures.push(t);
      gl.uniform1i(gl.getUniformLocation(this.sceneProg, name), i);
    });
    this.heatTex = this.makeTex(7);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, HEAT_W, HEAT_H, 0, gl.RED, gl.UNSIGNED_BYTE, this.heatBytes);
    gl.uniform1i(gl.getUniformLocation(this.sceneProg, "afterglow"), 7);
    this.cometTex = this.makeTex(8);
    gl.uniform1i(gl.getUniformLocation(this.sceneProg, "comets"), 8);
    this.sceneTex = this.makeTex(9);
    this.fbo = gl.createFramebuffer()!;
    gl.useProgram(this.focusProg);
    gl.uniform1i(this.fu.scene, 9);
    this.pxW = this.pxH = 0;
    this.cometW = this.cometH = 0;
  }

  // ---- sizing ------------------------------------------------------------------------------

  /** Call on resize. Backing sizes only change when the viewport meaningfully changes. */
  resize() {
    const w = Math.max(2, innerWidth), h = Math.max(2, innerHeight);
    if (w === this.cssW && Math.abs(h - this.cssH) < 140) return;
    this.cssW = w; this.cssH = h;
    this.applySize();
    if (this.still && !this.running && this.active) this.renderFrame(performance.now(), true);
  }

  private applySize() {
    const gl = this.gl;
    if (!gl || !this.loaded) return;
    const dpr = Math.min(devicePixelRatio || 1, this.opts.touch ? 1 : 1.25);
    const budget = this.opts.touch ? 1_000_000 : 1_800_000;
    const scale = Math.min(dpr, Math.sqrt(budget / (this.cssW * this.cssH)));
    const pw = Math.max(2, Math.round(this.cssW * scale)), ph = Math.max(2, Math.round(this.cssH * scale));
    if (pw !== this.pxW || ph !== this.pxH) {
      this.pxW = pw; this.pxH = ph;
      this.canvas.width = pw; this.canvas.height = ph;
      gl.activeTexture(gl.TEXTURE9);
      gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, pw, ph, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sceneTex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    this.cometScale = this.opts.touch ? 0.5 : 0.6;
    const cw = Math.max(2, Math.round(this.cssW * this.cometScale)), ch = Math.max(2, Math.round(this.cssH * this.cometScale));
    if (cw !== this.cometW || ch !== this.cometH) {
      this.cometW = cw; this.cometH = ch;
      this.cometCanvas.width = cw; this.cometCanvas.height = ch;
      gl.activeTexture(gl.TEXTURE8);
      gl.bindTexture(gl.TEXTURE_2D, this.cometTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, cw, ch, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
  }

  private get viewScale() {
    // Cover the viewport with the map; phones show a tall slice, desktops the width.
    return Math.max(this.cssW / MAP_W, this.cssH / MAP_H) / 0.98;
  }

  // ---- loop --------------------------------------------------------------------------------

  private active = true;

  // Long-page mode: the wallpaper is one surface as tall as the page. The viewport is a window onto the same
  // 3072x1536 map, mirror-tiled vertically (no seam, no distortion) and scrolled 1:1 with the page. One canvas the
  // size of the viewport, one WebGL context: nothing page-sized is ever allocated.
  private longPage = false;
  private scrollY = 0;
  private scrollRaf = 0;
  private readonly onScroll = () => {
    this.scrollY = Math.max(0, window.scrollY || 0);
    // Live mode redraws every frame anyway; a held still frame must repaint on scroll or the board would slide over it.
    if (this.still && !this.running && this.active && !this.scrollRaf) {
      this.scrollRaf = requestAnimationFrame(() => { this.scrollRaf = 0; if (!this.disposed) this.renderFrame(performance.now(), true); });
    }
  };
  /** Turn on the scroll-attached long surface (board pages). Off everywhere else. */
  setLongPage(on: boolean) {
    if (on === this.longPage) return;
    this.longPage = on;
    if (on) { window.addEventListener("scroll", this.onScroll, { passive: true }); this.onScroll(); }
    else { window.removeEventListener("scroll", this.onScroll); this.scrollY = 0; }
    if (this.still && !this.running && this.active && this.loaded) this.renderFrame(performance.now(), true);
  }
  /** Tiles of the mirrored surface that intersect the viewport: screen y of the tile's map origin and its y direction. */
  private tiles(scale: number, oy: number): Array<{ fy: number; sg: number }> {
    if (!this.longPage) return [{ fy: oy, sg: 1 }];
    const hm = MAP_H * scale, h = this.cssH, top = this.scrollY - oy;
    const out: Array<{ fy: number; sg: number }> = [];
    for (let n = Math.floor(top / hm); n <= Math.floor((top + h) / hm); n++) {
      const t = n * hm - this.scrollY + oy;
      out.push(n % 2 === 0 ? { fy: t, sg: 1 } : { fy: t + hm, sg: -1 });
    }
    return out;
  }

  /** Animate (default) or hold a single still frame (reduced motion, calm mode). */
  setStill(still: boolean) {
    this.still = still;
    this.sync();
  }

  /** Inactive means no frames at all (for example behind a full-bleed map). */
  setActive(active: boolean) {
    this.active = active;
    this.sync();
  }

  private sync() {
    this.stopLoop();
    if (this.active && this.loaded && !this.disposed) this.start();
  }

  start() {
    if (this.running || this.disposed || !this.loaded) return;
    this.resize();
    this.applySize();
    if (this.still) {
      this.renderFrame(performance.now(), true);
      return;
    }
    this.running = true;
    this.last = 0;
    this.cometLast = performance.now();
    document.addEventListener("visibilitychange", this.onVisibility);
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.stopLoop();
  }

  private stopLoop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  private readonly onVisibility = () => {
    if (document.hidden) { cancelAnimationFrame(this.raf); this.raf = 0; return; }
    if (this.running && !this.raf) { this.last = 0; this.cometLast = performance.now(); this.raf = requestAnimationFrame(this.tick); }
  };

  private readonly tick = (now: number) => {
    this.raf = 0;
    if (!this.running || document.hidden) return;
    this.raf = requestAnimationFrame(this.tick);
    if (now < this.nextFrameAt - 2) return;
    this.nextFrameAt = Math.max(now - this.frameInterval, this.nextFrameAt + this.frameInterval) ;
    this.renderFrame(now, false);
  };

  // ---- focus -------------------------------------------------------------------------------

  private missAperture() {
    this.apFrom = this.aperture;
    const dir = this.apTo >= this.apFrom ? -1 : 1;
    let next = this.apFrom + dir * (0.7 + Math.random() * 1.4);
    if (next < 3.5 || next > 6) next = this.apFrom - dir * (0.7 + Math.random() * 1.2);
    this.apTo = Math.max(3.5, Math.min(6, next));
    this.apStart = this.focusClock;
    this.apDur = 11 + Math.random() * 9;
  }

  private nextQuadrant() {
    if (this.qIndex >= 4) {
      const o = this.qOrder;
      for (let i = 0; i < 4; i++) o[i] = i;
      for (let i = 3; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const s = o[i]; o[i] = o[j]; o[j] = s; }
      if (o[0] === this.quad_) { const f = o[0]; o[0] = o[1]; o[1] = o[2]; o[2] = o[3]; o[3] = f; }
      this.qIndex = 0;
    }
    this.quad_ = this.qOrder[this.qIndex++];
  }

  private updateFocus(dt: number) {
    const period = 9, span = period * 0.2, fade = 0.4;
    this.focusClock += dt;
    const u = Math.max(0, Math.min(1, (this.focusClock - this.apStart) / this.apDur));
    this.aperture = this.apFrom + (this.apTo - this.apFrom) * (u * u * (3 - 2 * u));
    if (u > 0.82) this.missAperture();
    const local = ((this.focusClock % period) + period) % period;
    const id = Math.floor(this.focusClock / period);
    let amount = 0;
    if (local < span) {
      if (id !== this.qWindow) { this.qWindow = id; this.nextQuadrant(); }
      amount = local < fade ? local / fade : local > span - fade ? Math.max(0, (span - local) / fade) : 1;
    }
    this.sharp = amount;
  }

  // ---- route helpers (no allocation) ---------------------------------------------------------

  private pointAt(id: number, d: number, out: Float64Array) {
    const ls = this.rlen[id], xs = this.rx[id], ys = this.ry[id];
    const dd = Math.max(0, Math.min(this.rtotal[id], d));
    let lo = 1, hi = ls.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (ls[mid] < dd) lo = mid + 1; else hi = mid; }
    const span = ls[lo] - ls[lo - 1], f = span ? (dd - ls[lo - 1]) / span : 0;
    out[0] = xs[lo - 1] + (xs[lo] - xs[lo - 1]) * f;
    out[1] = ys[lo - 1] + (ys[lo] - ys[lo - 1]) * f;
  }

  private markPassage(id: number, from: number, to: number, now: number) {
    const hits = this.heatHits, p = this.tmpP;
    const end = Math.min(this.rtotal[id], to);
    for (let d = Math.max(0, from); d <= end; d += 16) {
      this.pointAt(id, d, p);
      const x = p[0] / 8, y = p[1] / 8;
      const y0 = Math.max(0, Math.floor(y - 7)), y1 = Math.min(HEAT_H - 1, Math.floor(y + 7));
      const x0 = Math.max(0, Math.floor(x - 7)), x1 = Math.min(HEAT_W - 1, Math.floor(x + 7));
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const dx = xx - x, dy = yy - y;
        if (dx * dx + dy * dy <= 49) hits[yy * HEAT_W + xx] = now;
      }
    }
  }

  private nodeCrossings(id: number) {
    const cached = this.crossings[id];
    if (cached) return cached;
    const hits: { node: number; along: number }[] = [];
    const xs = this.rx[id], ys = this.ry[id], ls = this.rlen[id];
    for (let n = 0; n < this.nodeX.length; n++) {
      let previous = -Infinity;
      for (let i = 1; i < xs.length; i++) {
        const dx = xs[i] - xs[i - 1], dy = ys[i] - ys[i - 1], l2 = dx * dx + dy * dy;
        if (!l2) continue;
        const u = Math.max(0, Math.min(1, ((this.nodeX[n] - xs[i - 1]) * dx + (this.nodeY[n] - ys[i - 1]) * dy) / l2));
        const px = this.nodeX[n] - xs[i - 1] - u * dx, py = this.nodeY[n] - ys[i - 1] - u * dy;
        if (px * px + py * py > 1.5625) continue;
        const along = ls[i - 1] + u * Math.sqrt(l2);
        if (Math.abs(along - previous) > 0.01) hits.push({ node: n, along });
        previous = along;
      }
    }
    hits.sort((a, b) => a.along - b.along);
    this.crossings[id] = hits;
    return hits;
  }

  private hitNodes(c: Comet, head: number, now: number) {
    const list = this.nodeCrossings(c.path);
    for (let i = 0; i < list.length; i++) {
      const h = list[i];
      if (h.along > c.previousHead && h.along <= head) { this.nodeHit[h.node] = now; this.nodeKind[h.node] = c.kind; }
    }
    c.previousHead = head;
  }

  private release(c: Comet, now: number) {
    if (c.path < 0) return;
    this.lockActive[c.path] = 0;
    this.lockUntil[c.path] = now + 20;
    c.path = -1;
  }

  private relaunch(c: Comet, now: number): boolean {
    if (now < c.retry || this.cometTime < this.nextLaunch) return false;
    const n = this.routeCount, cand = this.candidates;
    const visibleHalf = this.cssW / this.viewScale / 2;
    const lo = MAP_W / 2 - visibleHalf, hi = MAP_W / 2 + visibleHalf;
    let count = 0;
    for (let i = 0; i < n; i++) {
      if (c.river) { if (!data.dedicatedRiverIds.includes(i)) continue; }
      else if (c.road) { if (!this.dedicatedRoad[i]) continue; }
      else if (!((i < data.firstRiverRoute || this.desktopSide[i]) && !this.roadBlocked[i])) continue;
      if (!(this.rbounds[i * 4 + 2] >= lo && this.rbounds[i * 4] <= hi)) continue;
      let blocked = false;
      for (let j = 0; j < n; j++) {
        if (!(this.lockActive[j] || this.lockUntil[j] > now)) continue;
        if ((c.river || c.road) ? i === j : this.conflict[i * n + j] === 1) { blocked = true; break; }
      }
      if (!blocked) cand[count++] = i;
    }
    if (!count) { c.retry = now + 0.3; return false; }
    const id = cand[Math.floor(Math.random() * count)];
    c.path = id;
    this.lockActive[id] = 1;
    c.speed = c.river ? 170 + Math.random() * 130 : (Math.random() < 0.4 ? 480 : 65 + Math.random() * 40) * (2 + Math.random() * 2);
    if (!c.river && c.kind !== KIND_TRANS) c.kind = Math.floor(Math.random() * NEON.length);
    c.start = this.cometTime;
    c.previousHead = -1;
    this.nextLaunch = this.cometTime + 0.18 + Math.random() * 0.37;
    return true;
  }

  private launchFair(now: number) {
    if (this.cometTime < this.nextLaunch) return;
    const roster = this.roster;
    for (let n = 0; n < roster.length; n++) {
      const i = (this.launchCursor + n) % roster.length;
      if (roster[i].path < 0 && this.relaunch(roster[i], now)) { this.launchCursor = (i + 1) % roster.length; return; }
    }
  }

  // ---- drawing -----------------------------------------------------------------------------

  private drawComets(now: number, animate: boolean) {
    const cc = this.cc, k = this.cometScale, w = this.cssW, h = this.cssH, nowS = now / 1000;
    cc.setTransform(1, 0, 0, 1, 0, 0);
    cc.globalAlpha = 1;
    cc.globalCompositeOperation = "source-over";
    cc.shadowBlur = 0;
    cc.clearRect(0, 0, this.cometW, this.cometH);
    this.bounce.fill(0);
    if (!animate) return;

    this.cometTime += Math.min((now - this.cometLast) / 1000, 0.066);
    this.cometLast = now;
    const scale = this.viewScale;
    const ox = (w - MAP_W * scale) / 2, oy = (h - MAP_H * scale) / 2;
    const tiles = this.tiles(scale, oy);
    const cull = this.longPage;
    for (let i = this.cometCount; i < this.comets.length; i++) if (this.comets[i].path >= 0) this.release(this.comets[i], nowS);
    this.launchFair(nowS);

    cc.globalCompositeOperation = "lighter";
    let bi = 0;
    const a = this.tmpA, b = this.tmpB, p = this.tmpP;
    const vis = this.visible;
    for (let idx = 0; idx < vis.length; idx++) {
      const c = vis[idx];
      const tail = (idx % 2 === 0 ? 1560 : 1050) * (c.extraLong ? 5 : 1);
      if (c.path >= 0 && (this.cometTime - c.start) * c.speed > this.rtotal[c.path] + tail) this.release(c, nowS);
      if (c.path < 0) continue;
      const id = c.path, total = this.rtotal[id], head = (this.cometTime - c.start) * c.speed;
      this.markPassage(id, c.previousHead, head, nowS);
      this.hitNodes(c, head, nowS);
      for (let s = 0; s < 3; s++) {
        const d = head - s * 100;
        if (d < 0 || d > total) continue;
        this.pointAt(id, d, p);
        const sx = ox + p[0] * scale;
        let seen = false;
        for (let t = 0; t < tiles.length && !seen; t++) { const sy = tiles[t].fy + tiles[t].sg * p[1] * scale; seen = !(sx < -120 || sx > w + 120 || sy < -120 || sy > h + 120); }
        if (!seen) continue;
        if (s === 0 && bi < 32) { this.bounce[bi * 3] = p[0] / MAP_W; this.bounce[bi * 3 + 1] = p[1] / MAP_H; this.bounce[bi * 3 + 2] = 0.9; bi++; }
        else if (bi < 32) { this.bounce[bi * 3] = p[0] / MAP_W; this.bounce[bi * 3 + 1] = p[1] / MAP_H; this.bounce[bi * 3 + 2] = 0.45; bi++; }
      }
      const from = Math.max(0, head - tail), to = Math.min(total, head);
      if (!(to > from)) continue;
      const kind = c.kind, base = kind * (U_STEPS + 1);
      const bx0 = this.rbounds[id * 4], by0 = this.rbounds[id * 4 + 1], bx1 = this.rbounds[id * 4 + 2], by1 = this.rbounds[id * 4 + 3];
      for (let ti = 0; ti < tiles.length; ti++) {
        const tl = tiles[ti];
        if (cull) {
          const ya = tl.fy + tl.sg * by0 * scale, yb = tl.fy + tl.sg * by1 * scale;
          if (Math.max(ya, yb) < -60 || Math.min(ya, yb) > h + 60 || ox + bx1 * scale < -60 || ox + bx0 * scale > w + 60) continue;
        }
      cc.setTransform(k * scale, 0, 0, k * scale * tl.sg, k * ox, k * tl.fy);
      const xs = this.rx[id], ys = this.ry[id], ls = this.rlen[id];
      // One bloom pass.
      cc.beginPath();
      this.pointAt(id, from, a);
      cc.moveTo(a[0], a[1]);
      for (let i = 1; i < ls.length; i++) if (ls[i] > from && ls[i] < to) cc.lineTo(xs[i], ys[i]);
      this.pointAt(id, to, b);
      cc.lineTo(b[0], b[1]);
      cc.globalAlpha = 0.36;
      cc.strokeStyle = this.kinds[base + Math.round(0.3 * U_STEPS)];
      cc.lineWidth = 12.8;
      cc.shadowColor = this.headStr[kind];
      cc.shadowBlur = 22.4 * k;
      cc.stroke();
      cc.shadowBlur = 0;
      // Tail segments, brightest at the head.
      let tv = 1;
      while (tv < ls.length && ls[tv] <= from) tv++;
      const visibleLength = Math.max(0, to - from);
      const steps = Math.min(200, Math.ceil((visibleLength * scale) / 4));
      cc.lineCap = "round";
      for (let j = 0; j < steps; j++) {
        const d = from + (j * visibleLength) / steps, next = from + ((j + 1) * visibleLength) / steps;
        const progress = Math.max(0, Math.min(1, 1 - (head - (d + next) / 2) / tail));
        this.pointAt(id, d, a);
        this.pointAt(id, next, b);
        cc.globalAlpha = Math.pow(progress, 2.6);
        cc.strokeStyle = this.kinds[base + Math.round((1 - progress) * U_STEPS)];
        cc.lineWidth = 4.5 + 9 * Math.pow(progress, 1.5);
        cc.beginPath();
        cc.moveTo(a[0], a[1]);
        while (tv < ls.length && ls[tv] < next) { if (ls[tv] > d) cc.lineTo(xs[tv], ys[tv]); tv++; }
        cc.lineTo(b[0], b[1]);
        cc.stroke();
      }
      if (head >= 0 && head <= total) {
        this.pointAt(id, head, p);
        cc.globalAlpha = 1;
        cc.shadowBlur = 6.4 * k;
        cc.shadowColor = this.headStr[kind];
        cc.fillStyle = this.headLight[kind];
        cc.beginPath();
        cc.arc(p[0], p[1], 7.5, 0, Math.PI * 2);
        cc.fill();
        cc.shadowBlur = 0;
      }
      }
    }
    // Node flares left by passing comets.
    for (let ti = 0; ti < tiles.length; ti++) for (let n = 0; n < this.nodeX.length; n++) {
      const tl = tiles[ti];
      const age = nowS - this.nodeHit[n];
      if (age < 0 || age > 8) continue;
      const strength = Math.pow(Math.max(0, 1 - age / 8), 1.8), r = this.nodeR[n], kind = this.nodeKind[n];
      cc.setTransform(k * scale, 0, 0, k * scale * tl.sg, k * ox, k * tl.fy);
      cc.globalAlpha = strength;
      cc.drawImage(this.glowSprites[kind], this.nodeX[n] - r * 2.1, this.nodeY[n] - r * 2.1, r * 4.2, r * 4.2);
      cc.strokeStyle = this.ringStr[kind];
      cc.lineWidth = 2.2;
      cc.shadowColor = this.headStr[kind];
      cc.shadowBlur = 16 * k;
      cc.beginPath();
      cc.arc(this.nodeX[n], this.nodeY[n], r, 0, Math.PI * 2);
      cc.stroke();
      cc.shadowBlur = 0;
    }
    cc.setTransform(1, 0, 0, 1, 0, 0);
    cc.globalAlpha = 1;
  }

  private updateHeat(now: number) {
    const lut = this.heatLut, hits = this.heatHits, bytes = this.heatBytes, nowS = now / 1000;
    const scale = (HEAT_LUT - 1) / HEAT_LIFE;
    for (let i = 0; i < bytes.length; i++) {
      const age = nowS - hits[i];
      bytes[i] = age >= HEAT_LIFE ? 0 : lut[age <= 0 ? 0 : (age * scale) | 0];
    }
  }

  private renderFrame(now: number, still: boolean) {
    const gl = this.gl;
    if (!gl || gl.isContextLost() || !this.loaded || !this.pxW) return;
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0;
    this.last = now;
    if (!still) {
      this.time += dt * 0.1;
      this.updateFocus(dt);
      this.tilt.x += (this.tiltTarget.x - this.tilt.x) * (1 - Math.exp(-dt * 4));
      this.tilt.y += (this.tiltTarget.y - this.tilt.y) * (1 - Math.exp(-dt * 4));
    }
    this.drawComets(now, !still);

    gl.bindVertexArray(this.vao);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.activeTexture(gl.TEXTURE8);
    gl.bindTexture(gl.TEXTURE_2D, this.cometTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.cometCanvas);
    if (!still && now >= this.heatNext) {
      this.heatNext = now + 50;
      this.updateHeat(now);
      gl.activeTexture(gl.TEXTURE7);
      gl.bindTexture(gl.TEXTURE_2D, this.heatTex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, HEAT_W, HEAT_H, gl.RED, gl.UNSIGNED_BYTE, this.heatBytes);
    }

    // Pass 1: scene into the offscreen target.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.pxW, this.pxH);
    gl.useProgram(this.sceneProg);
    for (let i = 0; i < this.textures.length; i++) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.textures[i]); }
    gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, this.heatTex);
    gl.activeTexture(gl.TEXTURE8); gl.bindTexture(gl.TEXTURE_2D, this.cometTex);
    const scale = this.viewScale;
    gl.uniform2f(this.u.viewSpan, this.cssW / (MAP_W * scale), this.cssH / (MAP_H * scale));
    gl.uniform1f(this.u.scrollQ, this.longPage ? this.scrollY / (MAP_H * scale) : 0);
    gl.uniform1f(this.u.longPage, this.longPage ? 1 : 0);
    gl.uniform2f(this.u.tilt, this.tilt.x, this.tilt.y);
    gl.uniform1f(this.u.time, still ? 3.2 : this.time);
    gl.uniform1f(this.u.density, 0.22);
    gl.uniform1f(this.u.texture_, 0.55);
    gl.uniform3fv(this.u["bounce[0]"], this.bounce);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Pass 2: soft focus to the screen.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.pxW, this.pxH);
    gl.useProgram(this.focusProg);
    gl.activeTexture(gl.TEXTURE9); gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
    const pxPerCss = this.pxW / this.cssW;
    gl.uniform2f(this.fu.texel, 1 / this.pxW, 1 / this.pxH);
    gl.uniform1f(this.fu.sigma, (9.5 / this.aperture) * pxPerCss);
    const q = CircuitWallpaperEngine.QUADS[this.quad_];
    gl.uniform4f(this.fu.focusRect, q[0] + q[2] / 2, q[1] + q[3] / 2, q[2] * 0.5, q[3] * 0.5);
    gl.uniform1f(this.fu.sharpness, still ? 0 : this.sharp);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    this.disposed = true;
    this.stopLoop();
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("scroll", this.onScroll);
    cancelAnimationFrame(this.scrollRaf);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    const gl = this.gl;
    if (gl && !gl.isContextLost()) {
      for (const t of [...this.textures, this.heatTex, this.cometTex, this.sceneTex]) if (t) gl.deleteTexture(t);
      if (this.fbo) gl.deleteFramebuffer(this.fbo);
      gl.deleteProgram(this.sceneProg);
      gl.deleteProgram(this.focusProg);
      gl.deleteBuffer(this.quad);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    this.gl = null;
    this.images = [];
    this.cometCanvas.width = this.cometCanvas.height = 1;
  }
}
