import { useEffect, useRef } from "react";

const vertexSource = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// The material stays still. Only the broad, grazing light changes over time.
const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 resolution;
uniform vec2 surfaceSize;
uniform float time;
float hash(vec2 p) {
  return fract(sin(dot(mod(p, 256.0), vec2(127.1, 311.7))) * 437.5453);
}
float noise(vec2 p) {
  vec2 cell = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(cell), hash(cell + vec2(1, 0)), u.x),
             mix(hash(cell + vec2(0, 1)), hash(cell + vec2(1, 1)), u.x), u.y);
}
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = uv * surfaceSize;
  vec2 grain = p / 5.0;
  float coarse = noise(grain * 0.31);
  float fine = noise(grain * 2.4);
  float height = noise(grain + vec2(coarse * 1.8));
  float pores = smoothstep(0.23, 0.43, height);
  float edge = height - noise(grain + vec2(0.19, 0.12));
  vec2 light = vec2(0.45 + 0.24 * sin(time * 0.065),
                    0.52 + 0.18 * cos(time * 0.049));
  float wash = exp(-2.5 * dot(uv - light, uv - light));
  float cork = (0.012 + coarse * 0.022 + fine * 0.018
                + max(edge, 0.0) * 0.13) * pores;
  float shade = cork * (0.68 + wash * 0.55);
  gl_FragColor = vec4(vec3(shade), 1.0);
}
`;

/** One viewport-sized, low-resolution pass; never a page-height GPU surface. */
export default function CorkBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: false, antialias: false, depth: false, stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return; // The CSS cork texture remains underneath.
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Cork shader unavailable");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Cork shader compilation failed");
      return shader;
    };
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const release = () => {
      shaders.forEach(shader => gl.deleteShader(shader));
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
    try {
      if (!program || !buffer) throw new Error("Cork shader unavailable");
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Cork shader link failed");
    } catch {
      release();
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program!, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program!, "resolution");
    const surfaceSize = gl.getUniformLocation(program!, "surfaceSize");
    const time = gl.getUniformLocation(program!, "time");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, elapsed = 0, previous = 0, onscreen = true, lost = false;
    const still = () => reduced.matches || document.documentElement.classList.contains("calm-mode") || document.documentElement.dataset.calm === "true";
    const draw = () => {
      gl.uniform1f(time, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.ready = "true";
    };
    const tick = (now: number) => {
      if (now - previous >= 1000 / 24) {
        elapsed += Math.min((now - previous) / 1000, 0.1);
        previous = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (lost || document.hidden || !onscreen) return;
      draw();
      if (!still()) { previous = performance.now(); frame = requestAnimationFrame(tick); }
    };
    const resize = () => {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      if (!width || !height || lost) return;
      const scale = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(1_000_000 / (width * height)));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform2f(surfaceSize, width, height);
      sync();
    };
    // Leave the static fallback visible after context loss rather than retrying on a busy GPU.
    const contextLost = () => { lost = true; cancelAnimationFrame(frame); delete canvas.dataset.ready; };
    const size = new ResizeObserver(resize);
    size.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => { onscreen = entry.isIntersecting; sync(); });
    visibility.observe(canvas.parentElement!);
    const mode = new MutationObserver(sync);
    mode.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    canvas.addEventListener("webglcontextlost", contextLost);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      size.disconnect(); visibility.disconnect(); mode.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      canvas.removeEventListener("webglcontextlost", contextLost);
      delete canvas.dataset.ready;
      release();
    };
  }, []);
  return <canvas ref={ref} className="ab-cork-background" aria-hidden="true" />;
}
