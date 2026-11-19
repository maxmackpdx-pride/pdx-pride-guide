precision highp float;
varying vec2 vScreen;
uniform sampler2D art;
uniform sampler2D relief;
uniform sampler2D material;
uniform vec2 uvScale;
uniform vec2 focalPoint;
uniform float phase;
uniform vec3 bands;
uniform float nightSurvey;
const float TAU = 6.28318530718;
const vec2 texel = vec2(1.0/1536.0,1.0/864.0);

vec3 original(vec2 p) { return texture2D(art, clamp(p, 0.0, 1.0)).rgb; }
float luma(vec3 c) { return dot(c, vec3(.2126,.7152,.0722)); }
float crest(float x) { return .5 + .5 * cos(x); }
vec2 coordinates() { return (vScreen - .5) * uvScale + focalPoint; }
