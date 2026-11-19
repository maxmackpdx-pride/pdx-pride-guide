// Three isolated artwork plates and a fourth strip with their traced crests.
vec3 wavePlate(vec2 uv,float index){
  const float rows=656.;
  float row=uv.y*864.;
  float valid=step(0.,row)*(1.-step(rows,row));
  float atlasY=(index*rows+clamp(row,.5,rows-.5))/(4.*rows);
  return texture2D(material,vec2(clamp(uv.x,.00033,.99967),atlasY)).rgb*valid;
}
float originalCrest(float x,vec3 channel){
  return dot(texture2D(material,vec2(clamp(x,.00033,.99967),.875)).rgb,channel);
}
// Each strand has its own horizontal drift, crest height, curvature and thickness.
vec2 flex(vec2 p,vec3 channel,float rest,float rate,float offset,float energy){
  float angle=rate*phase+offset;
  float x=p.x+.044*sin(angle+.7)*sin(3.14159*p.x);
  x+=.017*sin(12.*p.x-angle*2.)*sin(3.14159*p.x);
  float source=originalCrest(x,channel);
  // The original peaked silhouette opens flat, then reforms into a leaning crest.
  float shape=.30+.52*crest(angle+.8);
  float crest=rest+(source-rest)*shape;
  float broad=sin(7.8*p.x-angle+.7*sin(phase+offset));
  float local=sin(15.4*p.x+2.*angle+offset);
  float amplitude=.047+.022*energy;
  crest+=amplitude*broad+.018*local+.012*sin(3.*phase+offset);
  float stretch=.87+.22*sin(10.*p.x-angle+offset)+.09*energy;
  // This is a deformation around the strand itself, including the top of its peak.
  return vec2(x,source+(p.y-crest)/stretch);
}
void main(){
  vec2 p=coordinates();
  vec2 backUV=flex(p,vec3(1.,0.,0.),.225,1.,.15,bands.x);
  vec2 midUV=flex(p,vec3(0.,1.,0.),.298,-2.,1.7,bands.y);
  vec2 frontUV=flex(p,vec3(0.,0.,1.),.364,3.,3.1,bands.z);
  vec3 back=wavePlate(backUV,0.);
  vec3 middle=wavePlate(midUV,1.);
  vec3 front=wavePlate(frontUV,2.);
  float shared=max(max(min(luma(back),luma(middle)),min(luma(middle),luma(front))),min(luma(back),luma(front)));
  gl_FragColor=vec4(back+middle+front+vec3(.32,.39,.40)*smoothstep(.085,.45,shared),1.);
}
