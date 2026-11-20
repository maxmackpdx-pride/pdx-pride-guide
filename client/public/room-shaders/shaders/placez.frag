// Animate the colored lights in this photograph without moving its city geometry.
// Work from the image itself, not the relief/river masks from the previous art.
void main() {
  vec2 p=coordinates();
  vec3 base=original(p);
  float hi=max(max(base.r,base.g),base.b);
  float lo=min(min(base.r,base.g),base.b);
  float emissive=smoothstep(.23,.78,hi)*smoothstep(.12,.44,hi-lo);
  float sweep=pow(crest(phase-TAU*(p.x*.86+p.y*.38)),6.);
  float glint=pow(crest(2.*phase+TAU*(p.y*.74-p.x*.33)),10.);
  float fade=1.-smoothstep(.53,.69,p.y);
  // This gain follows existing emitters only and retains each light's palette.
  vec3 lit=base*(1.+emissive*fade*(.12*sweep+.055*glint));
  gl_FragColor=vec4(lit,1.);
}
