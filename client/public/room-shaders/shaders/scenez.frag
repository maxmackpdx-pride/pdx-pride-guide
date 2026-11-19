// A single fabric displacement. The unwarped core includes the red heart,
// its contact shadow and the small depression beneath its tip.
void main(){
  vec2 p=coordinates();
  vec2 center=vec2(.405,.306);
  float hold=length((p-center)/vec2(.043,.070));
  float mobile=smoothstep(1.0,1.83,hold);
  float nearPin=exp(-dot((p-vec2(.405,.353))/vec2(.12,.10),
                         (p-vec2(.405,.353))/vec2(.12,.10)));
  // Phase delay around the obstruction bends the travelling fold under the tip.
  float s=TAU*(1.12*p.x-.085*nearPin)-phase;
  float fold=sin(s)*(.62+.38*cos(s));
  float fabric=1.-smoothstep(.24,.45,abs(p.y-.34));
  vec2 displacement=vec2(.0055*nearPin*sin(s),.028*fold*(1.+.34*nearPin));
  gl_FragColor=vec4(original(p-mobile*fabric*displacement),1.);
}
