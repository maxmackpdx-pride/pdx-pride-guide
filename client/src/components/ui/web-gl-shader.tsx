"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  attribute vec3 position;
  void main() { gl_Position = vec4(position, 1.0); }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform vec3 cyan;
  uniform vec3 yellow;
  uniform vec3 magenta;
  uniform vec3 orange;

  float stream(vec2 p, float phase, float offset, float bend) {
    float d = length(p) * 0.045;
    float x = p.x * (1.0 + d * bend);
    float curve = sin(x * 0.85 + time + phase) * 0.48
                + sin(x * 0.34 - time * 0.4 + phase) * 0.12 + offset;
    float distanceToStream = abs(p.y + curve);
    return 0.009 / (distanceToStream + 0.008)
         + 0.04 * exp(-distanceToStream * 4.0);
  }

  void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution)
           / min(resolution.x, resolution.y);
    vec3 color = cyan    * stream(p, 0.0, -0.65,  1.0)
               + yellow  * stream(p, 1.3, -0.22, -0.5)
               + magenta * stream(p, 2.6,  0.22,  0.5)
               + orange  * stream(p, 3.9,  0.65, -1.0);
    // Keep the four distinct neon threads visible without washing out text.
    color = (1.0 - exp(-color * 1.25)) * 0.7;
    gl_FragColor = vec4(color, 1.0);
  }
`;

/** Decorative four-stream background; no data, assets, or providers required. */
export function WebGLShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
    const uniforms = {
      resolution: { value: new THREE.Vector2() },
      time: { value: 0 },
      cyan: { value: color("--neon-cyan", "#00FFFF") },
      yellow: { value: color("--neon-yellow", "#CCFF00") },
      magenta: { value: color("--neon-magenta", "#FF00CC") },
      orange: { value: color("--neon-orange", "#FF6600") },
    };
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
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
    let lost = false;
    const render = () => {
      if (!lost) renderer.render(scene, camera);
    };
    const animate = (now: number) => {
      if (lastTime)
        uniforms.time.value += Math.min((now - lastTime) / 1000, 0.1) * 0.3;
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="rg-stream-background"
    />
  );
}
