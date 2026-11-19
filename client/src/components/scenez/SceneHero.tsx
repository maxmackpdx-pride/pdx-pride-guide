import PlacesPageSwitch from '@/components/places/PlacesPageSwitch';
/** Standalone identity and navigation; the page owns the room shader. */
export default function SceneHero(){
 return <section className="ns-hero ns-reference-hero ns-xerox-hero" aria-label="SceneZ">
  <div className="ns-logo"><img src="/scenez-native/scenez-approved-wordmark.png" alt="SceneZ"/></div>
  <PlacesPageSwitch active="scenez"/>
 </section>;
}
