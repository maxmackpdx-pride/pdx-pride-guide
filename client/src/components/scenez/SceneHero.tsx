import PlacesPageSwitch from '@/components/places/PlacesPageSwitch';
export function SceneWordmark() {
  return <img src="/scenez-native/scenez-approved-wordmark.png" alt="SceneZ"/>;
}

/** Standalone identity and navigation; the page owns the room shader. */
export default function SceneHero(){
 return <section className="ns-hero ns-reference-hero ns-xerox-hero" aria-label="SceneZ">
  <div className="ns-logo"><SceneWordmark/></div>
  <PlacesPageSwitch active="scenez"/>
 </section>;
}
