"use client";

const LOOP_SECONDS = 1200;
const LOOP_RADIANS = Math.PI * 2;

import { useEffect, useRef, type CSSProperties } from "react";
import * as THREE from "three";
import "./web-gl-shader.css";

const vertexShader = `
  attribute vec3 position;
  void main() { gl_Position = vec4(position, 1.0); }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform float direction;
  uniform vec3 cyan;
  uniform vec3 yellow;
  uniform vec3 magenta;
  uniform vec3 orange;
  uniform vec3 violet;
  uniform vec3 red;
  uniform vec3 green;
  uniform vec3 blue;
  uniform vec3 extraWaves[4];
  uniform sampler2D blueprint;

  float waveDistance(vec2 p, float phase, float offset, float bend) {
    float d = length(p) * 0.045;
    float x = p.x * (1.0 + d * bend);
    float curve = sin(x * 0.85 + time * direction * 10.0 + phase) * 0.48
                + sin(x * 0.34 - time * direction * 4.0 + phase) * 0.12 + offset;
    return p.y + curve;
  }

  float stream(vec2 p, float phase, float offset, float bend) {
    float distanceToStream = abs(waveDistance(p, phase, offset, bend));
    return 0.009 / (distanceToStream + 0.008)
         + 0.04 * exp(-distanceToStream * 4.0);
  }

  // Paired drafting contours follow the same wave, with a quiet pencil wobble.
  float sketch(vec2 p, float phase, float offset, float bend) {
    float distanceToWave = waveDistance(p, phase, offset, bend);
    float pixel = 2.0 / min(resolution.x, resolution.y);
    float wobble = sin(p.x * 19.0 + phase) * 0.0025
                 + sin(p.x * 37.0 - phase) * 0.0012;
    float contour = abs(abs(distanceToWave + wobble) - 0.055);
    float ink = 1.0 - smoothstep(pixel * 0.35, pixel * 1.3, contour);
    float outer = abs(abs(distanceToWave - wobble) - 0.095);
    float dash = smoothstep(0.20, 0.28, fract(p.x * 3.0 + phase));
    float guide = (1.0 - smoothstep(pixel * 0.25, pixel, outer)) * dash;
    float fineOuter = abs(abs(distanceToWave + wobble * 1.6) - 0.15);
    float fine = (1.0 - smoothstep(pixel * 0.2, pixel, fineOuter));
    float pencil = abs(abs(distanceToWave - wobble * 2.0) - 0.19);
    float loose = (1.0 - smoothstep(pixel * 0.2, pixel, pencil)) * dash;
    return ink * 0.15 + guide * 0.09 + fine * 0.065 + loose * 0.045;
  }

  float waveCenter(float x, float phase, float offset, float bend) {
    float y = 0.0;
    for (int i = 0; i < 4; i++) {
      y -= waveDistance(vec2(x, y), phase, offset, bend);
    }
    return y;
  }

  vec4 waveEdges(float x) {
    vec4 edges = vec4(waveCenter(x, 0.0, -0.65, 1.0),
                      waveCenter(x, 1.3, -0.22, -0.5),
                      waveCenter(x, 2.6, 0.22, 0.5),
                      waveCenter(x, 3.9, 0.65, -1.0));
    edges.xy = vec2(min(edges.x, edges.y), max(edges.x, edges.y));
    edges.zw = vec2(min(edges.z, edges.w), max(edges.z, edges.w));
    edges.xz = vec2(min(edges.x, edges.z), max(edges.x, edges.z));
    edges.yw = vec2(min(edges.y, edges.w), max(edges.y, edges.w));
    edges.yz = vec2(min(edges.y, edges.z), max(edges.y, edges.z));
    return edges;
  }

  float blueprintBand(vec2 p, float band) {
    // Twelve 1.35-unit cells cross the viewport in one seamless loop.
    float drift = time * direction * (16.2 / 6.28318530718);
    float cell = floor((p.x + drift + band * 0.47) / 1.35);
    float anchorX = (cell + 0.5) * 1.35 - drift - band * 0.47;
    vec4 edges = waveEdges(anchorX);
    float lower = band < 0.5 ? edges.x : (band < 1.5 ? edges.y : edges.z);
    float upper = band < 0.5 ? edges.y : (band < 1.5 ? edges.z : edges.w);
    // Ride the gap's position and tangent as one rigid sketch, keeping type intact.
    vec4 nextEdges = waveEdges(anchorX + 0.025);
    float nextLower = band < 0.5 ? nextEdges.x : (band < 1.5 ? nextEdges.y : nextEdges.z);
    float nextUpper = band < 0.5 ? nextEdges.y : (band < 1.5 ? nextEdges.z : nextEdges.w);
    float slope = ((nextLower + nextUpper) - (lower + upper)) / 0.05;
    float angle = clamp(atan(slope), -0.48, 0.48);
    vec2 delta = p - vec2(anchorX, (lower + upper) * 0.5);
    vec2 local = vec2(cos(angle) * delta.x + sin(angle) * delta.y,
                     -sin(angle) * delta.x + cos(angle) * delta.y) / 0.48 + 0.5;
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) return 0.0;
    float index = mod(cell + band * 4.0, 12.0);
    vec2 tile = vec2(mod(index, 4.0), floor(index / 4.0));
    vec2 uv = (tile + vec2(local.x, 1.0 - local.y)) / vec2(4.0, 3.0);
    uv.y = 1.0 - uv.y;
    float room = smoothstep(0.25, 0.55, upper - lower);
    float aspect = resolution.x / min(resolution.x, resolution.y);
    float outskirts = mix(0.25, 1.0, smoothstep(0.22, 0.82, abs(p.x) / aspect));
    return texture2D(blueprint, uv).a * room * outskirts;
  }

  void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution)
           / min(resolution.x, resolution.y);
    vec3 color = cyan    * stream(p, 0.0, -0.65,  1.0)
               + yellow  * stream(p, 1.3, -0.22, -0.5)
               + magenta * stream(p, 2.6,  0.22,  0.5)
               + orange  * stream(p, 3.9,  0.65, -1.0)
               + violet * stream(p, extraWaves[0].x, extraWaves[0].y, extraWaves[0].z)
               + red * stream(p, extraWaves[1].x, extraWaves[1].y, extraWaves[1].z)
               + green * stream(p, extraWaves[2].x, extraWaves[2].y, extraWaves[2].z)
               + blue * stream(p, extraWaves[3].x, extraWaves[3].y, extraWaves[3].z);
    // Keep the Prime neon threads visible without washing out text.
    color = (1.0 - exp(-color * 1.25)) * 0.7;
    float whiteInk = sketch(p, 0.0, -0.65, 1.0)
                   + sketch(p, 1.3, -0.22, -0.5)
                   + sketch(p, 2.6, 0.22, 0.5)
                   + sketch(p, 3.9, 0.65, -1.0);
    for (int i = 0; i < 4; i++) {
      whiteInk += sketch(p, extraWaves[i].x, extraWaves[i].y, extraWaves[i].z) * 0.5;
    }
    #ifdef USE_BLUEPRINT
    float drafting = blueprintBand(p, 0.0)
                 + blueprintBand(p, 1.0)
                 + blueprintBand(p, 2.0);
    #else
    float drafting = 0.0;
    #endif
    color = mix(color, vec3(1.0), min(whiteInk + drafting * 0.90, 0.78));
    gl_FragColor = vec4(color, 1.0);
  }
`;

/** Prime-color waves with locally loaded drafting lines. */
export function WebGLShader({ accent, palette = "prime", direction = 1, blueprintUrl = null, waveSpeed = 1 }: { accent?: string; palette?: "prime" | "week"; direction?: -1 | 1; blueprintUrl?: string | null; waveSpeed?: number } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // The full-screen fragment pass can stall mobile GPUs, especially beside
    // ReZources' card rails. CSS paints the same soft wave surface on phones.
    if (waveSpeed < 1 && window.matchMedia("(max-width: 719px), (pointer: coarse)").matches) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      // The CSS background remains available on devices without WebGL.
      return;
    }
    const styles = getComputedStyle(canvas);
    const color = (token: string, fallback: string) => {
      const value = new THREE.Color(
        styles.getPropertyValue(token).trim() || fallback,
      );
      return value.convertLinearToSRGB();
    };
    // Start transparent while the local SVG loads; no opaque placeholder flash.
    const emptyBlueprint = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
    emptyBlueprint.needsUpdate = true;
    let blueprintTexture: THREE.Texture | undefined;
    let disposed = false;
    const beamColor = accent ? new THREE.Color(styles.color).convertLinearToSRGB() : null;
    const weekTokens: Record<string, string> = {
      "--neon-cyan": "--day-thu", "--neon-yellow": "--day-wed",
      "--neon-magenta": "--day-fri", "--neon-orange": "--day-sun",
      "--neon-violet": "--day-mon", "--neon-green": "--day-sat", "--neon-blue": "--day-tue",
    };
    const beam = (token: string, fallback: string) => {
      if (beamColor) return beamColor;
      if (palette === "week" && token === "--neon-red") return new THREE.Color(0, 0, 0);
      return color(palette === "week" ? weekTokens[token] : token, fallback);
    };
    const uniforms = {
      blueprint: { value: emptyBlueprint as THREE.Texture },
      resolution: { value: new THREE.Vector2() },
      time: { value: 0 },
      direction: { value: direction },
      cyan: { value: beam("--neon-cyan", "#00FFFF") },
      yellow: { value: beam("--neon-yellow", "#CCFF00") },
      magenta: { value: beam("--neon-magenta", "#FF00CC") },
      orange: { value: beam("--neon-orange", "#FF6600") },
      violet: { value: beam("--neon-violet", "#8800FF") },
      red: { value: beam("--neon-red", "#FF2400") },
      green: { value: beam("--neon-green", "#39FF14") },
      blue: { value: beam("--neon-blue", "#0044FF") },
      // Randomize once per mount, spreading the extra colors across the viewport.
      extraWaves: { value: [-0.8, -0.3, 0.3, 0.8]
        .map(offset => new THREE.Vector3(Math.random() * Math.PI * 2,
          offset + (Math.random() - 0.5) * 0.2, Math.random() * 2 - 1)) },
    };
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.RawShaderMaterial({
      vertexShader,
      // Most rooms use only the wave/sketch lines. Avoid the costly blueprint
      // sampling path entirely unless a room supplies an image for it.
      fragmentShader: `${blueprintUrl ? "#define USE_BLUEPRINT\n" : ""}${fragmentShader}`,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastTime = 0;
    let lastPaint = 0;
    let lost = false;
    const render = () => {
      if (!lost) renderer.render(scene, camera);
    };
    if (blueprintUrl) new THREE.TextureLoader().load(blueprintUrl, (texture) => {
      if (disposed) { texture.dispose(); return; }
      blueprintTexture = texture;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      uniforms.blueprint.value = texture;
      render();
    });
    const animate = (now: number) => {
      // Keep desktop motion smooth without redrawing on every high-refresh frame.
      if (now - lastPaint < 1000 / 30) { frame = requestAnimationFrame(animate); return; }
      lastPaint = now;
      if (lastTime)
        uniforms.time.value = (uniforms.time.value + Math.min((now - lastTime) / 1000, 0.1) * waveSpeed * LOOP_RADIANS / LOOP_SECONDS) % LOOP_RADIANS;
      lastTime = now;
      render();
      frame = requestAnimationFrame(animate);
    };
    const syncAnimation = () => {
      cancelAnimationFrame(frame);
      lastTime = 0;
      if (document.hidden || lost) return;
      if (
        motion.matches ||
        document.documentElement.classList.contains("calm-mode") ||
        document.documentElement.dataset.calm === "true"
      )
        render();
      else frame = requestAnimationFrame(animate);
    };
    const resize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, canvas.clientWidth <= 600 ? 1 : 1.25));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      renderer.getDrawingBufferSize(uniforms.resolution.value);
      render();
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      canvas.style.opacity = "0";
      syncAnimation();
    };
    const onRestored = () => {
      lost = false;
      canvas.style.opacity = "";
      resize();
      syncAnimation();
    };
    const calmObserver = new MutationObserver(syncAnimation);
    calmObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-calm"],
    });
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    document.addEventListener("visibilitychange", syncAnimation);
    motion.addEventListener("change", syncAnimation);
    resize();
    syncAnimation();
    return () => {
      disposed = true;
      blueprintTexture?.dispose();
      emptyBlueprint.dispose();
      cancelAnimationFrame(frame);
      observer.disconnect();
      calmObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      document.removeEventListener("visibilitychange", syncAnimation);
      motion.removeEventListener("change", syncAnimation);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [accent, palette, direction, blueprintUrl, waveSpeed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`rg-stream-background${waveSpeed < 1 ? " rg-stream-background--mobile-fallback" : ""}`}
      style={accent ? { color: accent, "--rg-mobile-primary": accent, "--rg-mobile-secondary": accent, "--rg-mobile-tertiary": accent } as CSSProperties : undefined}
    />
  );
}
