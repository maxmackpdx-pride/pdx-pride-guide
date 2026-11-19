void main(){
  vec2 p=coordinates();
  vec3 base=original(p);
  vec4 depth=texture2D(material,p);
  // --room-outz resolves to --neon-orange in the Zaylist room tokens.
  const vec3 tokenOrange=vec3(255.,123.,0.)/255.;
  float ember=max(base.r-base.b,0.);
  float ink=luma(base);
  vec2 delta=(p-vec2(.506,.181))*vec2(1.7778,1.);
  float radialDistance=length(delta);
  float alongRidge=abs(delta.x)+max(0.,delta.y)*.57;
  float ridgeAngle=(depth.a-.5)*3.14159265;
  float alongPhase=phase-TAU*alongRidge*.92;
  float firstLight=pow(crest(alongPhase),4.);
  float incidence=.38+.62*pow(crest(alongPhase-2.*ridgeAngle),2.);
  float gain=.23+1.25*firstLight*incidence;
  float rim=ember*(.62+.38*depth.g);
  vec3 lit=base*(.87+.12*depth.g*firstLight);
  lit+=tokenOrange*(rim*gain+depth.b*depth.b*(.68+1.92*firstLight*incidence));
  // A shallow inversion layer between ranges. Three wind frequencies close
  // together at the loop seam. Foreground ridges clip the veil.
  float windA=sin(p.x*17.-phase+1.7*sin(24.*p.y+phase));
  float windB=sin(p.x*37.-2.*phase+1.2*windA+sin(p.y*68.));
  float veil=smoothstep(-1.,1.3,windA+.54*windB+.21*sin(p.x*74.-3.*phase+windB));
  float layers=.49+.51*crest(18.*p.y+1.5*windA);
  float haze=depth.r*layers*(.055+.28*veil);
  lit=mix(lit,vec3(.48,.54,.58),haze);
  // Radius is measured in isotropic source coordinates, so this wave
  // moves away from the summit both above and below the skyline.
  float echo=pow(crest(phase-TAU*radialDistance*.97),22.);
  float contour=smoothstep(.012,.13,ink)*(1.-smoothstep(.26,.62,ink))*(1.-smoothstep(.055,.28,ember));
  lit+=vec3(.32,.66,.77)*echo*contour*nightSurvey;
  gl_FragColor=vec4(lit,1.);
}
