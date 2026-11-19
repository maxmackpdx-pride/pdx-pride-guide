// All relief samples use the same moving light position, in source-image space.
void main() {
  vec2 p=coordinates();
  vec3 base=original(p);
  vec4 field=texture2D(relief,p);
  vec2 river=texture2D(material,p).rg;
  vec3 bounce=field.rgb*field.rgb;

  float t=phase/TAU;
  float power=smoothstep(0.,.09,t)*(1.-smoothstep(.89,1.,t));
  float lightX=mix(-.34,1.34,t);
  vec2 toLight=vec2((lightX-p.x)*1.7778,-.15-.12*p.y);
  // Trace towards the light. A tall blocker crossed by a grazing ray casts a
  // long shadow; directly beneath the key the same ray climbs out of the relief.
  vec2 ray=toLight*vec2(.00185,.0033);
  float obstruction=-1.;
  for(int i=1;i<=20;i++){
    float n=float(i);
    float blocker=texture2D(relief,p+ray*n).a;
    obstruction=max(obstruction,blocker-field.a-.0125*n);
  }
  float shadow=smoothstep(.015,.043,obstruction);
  vec2 d=texel*2.25;
  vec2 slope=vec2(texture2D(relief,p+vec2(d.x,0.)).a-texture2D(relief,p-vec2(d.x,0.)).a,
                  texture2D(relief,p+vec2(0.,d.y)).a-texture2D(relief,p-vec2(0.,d.y)).a);
  vec3 normal=normalize(vec3(-slope*4.,1.));
  float face=max(0.,dot(normal,normalize(vec3(toLight,.31))));
  float envelope=.55+.45*exp(-2.4*pow(lightX-p.x,2.));
  float key=power*envelope*(.59+.75*face)*(1.-.94*shadow);

  float chroma=max(max(base.r,base.g),base.b)-min(min(base.r,base.g),base.b);
  float route=smoothstep(.075,.46,chroma);
  float spark=pow(crest(phase-TAU*(p.y*1.04+p.x*.18)),11.);
  vec3 lit=base*mix(.57+1.24*key,.92+.43*spark,route);
  lit+=bounce*(.28+1.45*spark)*(.36+.64*field.a)*(1.-.54*shadow*power);
  lit+=vec3(1.,.96,.88)*route*spark*pow(max(max(base.r,base.g),base.b),4.)*.37;

  // A fine drifting reflection inside each bank. The water mask leaves black
  // between the reflected ribbon and the emissive shore and excludes the island.
  float lateral=river.y+.026*sin(p.y*56.-phase)+.013*sin(p.y*103.-2.*phase);
  float streak=exp(-pow((lateral-.25)/.083,2.))+ .72*exp(-pow((lateral-.72)/.075,2.));
  vec3 hue=bounce/(.045+max(max(bounce.r,bounce.g),bounce.b));
  float drift=pow(crest(phase-TAU*p.y*1.18+.55),3.);
  lit+=hue*river.x*streak*(.035+.17*drift)*(1.-smoothstep(.065,.22,luma(base)));
  gl_FragColor=vec4(lit,1.);
}
