import PlacesPageSwitch from '@/components/places/PlacesPageSwitch';
/** Responsive collage layers, not a screenshot: the logo and navigation remain independent. */
export default function SceneHero(){
 return <section className="ns-hero ns-reference-hero" aria-label="SceneZ">
  <div className="ns-collage" aria-hidden="true">
   <svg className="ns-circuit" viewBox="0 0 1000 700" preserveAspectRatio="none"><g fill="none" strokeWidth="3"><path stroke="var(--neon-cyan)" d="M340 230H490L550 170H690L750 110H1000M0 540H75L145 610H330"/><path stroke="var(--neon-magenta)" d="M340 190H440L480 150H630L690 85H1000M0 515H100L170 580H300"/><path stroke="var(--neon-violet)" d="M270 620L300 590M290 620L320 590M310 620L340 590"/></g></svg>
   <svg className="ns-speaker" viewBox="0 0 360 360"><defs><pattern id="scene-speaker-dots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#eee8da"/></pattern></defs><circle cx="180" cy="180" r="172" fill="#eee8da"/><circle cx="180" cy="180" r="160" fill="#080808"/><circle cx="180" cy="180" r="146" stroke="#eee8da" strokeWidth="3"/><circle cx="180" cy="180" r="136" fill="url(#scene-speaker-dots)"/>{[35,125,215,305].map(a=><circle key={a} cx={180+165*Math.cos(a*Math.PI/180)} cy={180+165*Math.sin(a*Math.PI/180)} r="7" fill="#080808"/>)}</svg>
   <div className="ns-flag-paper"><img src="/scenez-native/pup-pride.webp" alt=""/></div>
   <div className="ns-wave-paper"><svg viewBox="0 0 500 120" preserveAspectRatio="none"><path d="M0 60H500" stroke="#080808" strokeWidth="2"/>{Array.from({length:125},(_,i)=>{const h=8+Math.abs(Math.sin(i*1.7)*Math.cos(i*.29))*95;return <path key={i} d={`M${i*4} ${60-h/2}v${h}`} stroke="#080808" strokeWidth="2.5"/>;})}</svg></div>
   <div className="ns-record"/>
   <div className="ns-paper-grain"/>
  </div>
  <div className="ns-logo"><img src="/scenez-native/scenez-approved-wordmark.png" alt="SceneZ"/></div>
  <PlacesPageSwitch active="scenez"/>
 </section>;
}
