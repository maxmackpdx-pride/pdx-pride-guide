/** GLSL for the Zaylist circuit wallpaper. WebGL2 only; two passes share one context. */

export const QUAD_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 p;
out vec2 uv;
void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

/** Pass 1: the map, afterglow, steady roads, sparkle and the comet layer, drawn sharp into an offscreen target. */
export const SCENE_FS = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 frag;
uniform sampler2D art, flow, afterglow, riverLines, mapPaths, sparklePoints, steadyRoads, nodeMask, comets;
uniform vec2 tilt, viewSpan;
uniform vec3 bounce[32];
uniform float time, density, texture_, scrollQ, longPage;
void main(){
  vec2 q = vec2((uv.x - .5) * viewSpan.x + .5, (.5 - uv.y) * viewSpan.y + .5);
  vec4 cm = texture(comets, vec2(uv.x, 1. - uv.y));
  // Long-page mode: scroll the surface and mirror-tile the map vertically, so the page is one seamless wallpaper.
  float mirrored = 0.;
  if (longPage > .5) {
    float qy = q.y + scrollQ;
    float tile = floor(qy);
    float fy = qy - tile;
    mirrored = mod(tile, 2.);
    q.y = mirrored > .5 ? 1. - fy : fy;
    if (q.x < 0. || q.x > 1.) { frag = vec4(cm.rgb, 1.); return; }
  } else if (q.x < 0. || q.x > 1. || q.y < 0. || q.y > 1.) { frag = vec4(cm.rgb, 1.); return; }
  vec3 col = texture(art, q).rgb;
  float hiddenRing = texture(nodeMask, q).r;
  float lum = dot(col, vec3(.2126, .7152, .0722));
  col = max(vec3(0.), mix(vec3(lum), col, 1.45)) * 1.18;
  vec2 f = texture(flow, q).rg * 2. - 1.;
  if (mirrored > .5) f.y = -f.y;
  float phase = atan(f.y, f.x) / 6.2831853;
  float trail = fract(phase - time);
  float gate = 0.;
  float lean = clamp(length(tilt), 0., 1.);
  float foilAxis = uv.x * .75 + uv.y * .48 - tilt.x * .65 + tilt.y * .55;
  float foilBand = pow(.5 + .5 * cos(foilAxis * 7.0), 8.);
  float reveal = foilBand * (.25 + lean * .75);
  float hi = max(col.r, max(col.g, col.b));
  float lo = min(col.r, min(col.g, col.b));
  float chroma = smoothstep(.07, .25, hi - lo);
  float sparkle = pow(.5 + .5 * sin(phase * 95. + time * 17. + sin(q.x * 381. + q.y * 563.) * 4.), 12.);
  float memory = texture(afterglow, q).r;
  gate = max(gate, memory * (.85 + sparkle * 1.1));
  float head = exp(-pow((trail - .025) / .018, 2.));
  float reflected = 0.;
  for (int i = 0; i < 32; i++) {
    if (bounce[i].z <= 0.) continue;
    vec2 delta = (q - bounce[i].xy) * vec2(3072., 1536.);
    reflected += exp(-dot(delta, delta) / 4200.) * bounce[i].z;
  }
  reflected = min(reflected, 1.6);
  vec3 base = vec3(dot(col, vec3(.2126, .7152, .0722))) * texture_ * reflected * (1. - chroma);
  vec3 foil = .55 + .45 * cos(6.2831853 * (foilAxis * .7 + vec3(0., .33, .67)));
  vec3 iridescent = mix(col, col * .45 + foil * hi * .85, clamp(lean * .6 + reveal * .3, 0., .8));
  vec3 light = iridescent * chroma * gate * (.65 + .65 * head) * (1. - hiddenRing);
  vec3 riverCircuit = texture(riverLines, q).rgb;
  float stream = pow(.5 + .5 * sin(q.y * 160. - time * 30. + q.x * 19.), 10.);
  vec3 riverLight = riverCircuit * (.55 + stream * .7 + memory * .9);
  vec3 mapColor = texture(mapPaths, q).rgb;
  float mapReveal = clamp(memory * .33 + reflected * .12, 0., .45);
  vec3 mapLight = mapColor * (.42 + mapReveal);
  vec3 dots = texture(sparklePoints, q).rgb;
  float twinkle = pow(.5 + .5 * sin(phase * 95. + time * 17. + sin(q.x * 381. + q.y * 563.) * 4.), 12.);
  float sparkleGroup = fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453);
  float ambientTwinkle = mix(.025, .18, step(.8, sparkleGroup));
  float highSide = sign(-tilt.x);
  float raised = smoothstep(.05, .95, (uv.x - .5) * 2. * highSide);
  float tiltShine = 1. + .30 * abs(tilt.x) * raised;
  vec3 sparkleLight = dots * (.75 + twinkle * (.5 + ambientTwinkle * 4.) + memory * 1.6) * tiltShine;
  vec3 roads = texture(steadyRoads, q).rgb;
  vec3 steadyBlue = vec3(.03, .8, 1.) * (roads.r * .08 + roads.g * .55 + roads.b * .12);
  vec3 scene = base + light + riverLight + mapLight + sparkleLight + steadyBlue;
  frag = vec4(cm.rgb + scene * (1. - cm.a), 1.);
}`;

/** Pass 2: soft focus. A variable-radius blur of the whole scene, with one quadrant snapping sharp. */
export const FOCUS_FS = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 frag;
uniform sampler2D scene;
uniform vec2 texel;
uniform float sigma;
uniform vec4 focusRect;
uniform float sharpness;
void main(){
  vec3 c0 = texture(scene, uv).rgb;
  vec3 acc = c0 * .22;
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.0471976;
    vec2 d1 = vec2(cos(a), sin(a));
    vec2 d2 = vec2(cos(a + .5235988), sin(a + .5235988));
    acc += texture(scene, uv + d1 * sigma * .9 * texel).rgb * .085;
    acc += texture(scene, uv + d2 * sigma * 1.8 * texel).rgb * .045;
  }
  vec3 soft = acc;
  soft = (soft - .5) * 1.08 + .5;
  soft = max(vec3(0.), mix(vec3(dot(soft, vec3(.2126, .7152, .0722))), soft, 1.06));
  vec2 p = vec2(uv.x, 1. - uv.y);
  float d = length((p - focusRect.xy) / focusRect.zw);
  float m = sharpness * (d < .62 ? 1. : clamp((1. - d) / .38, 0., 1.));
  frag = vec4(mix(soft, c0, m), 1.);
}`;
