import PlacesPageSwitch from '@/components/places/PlacesPageSwitch';
/** Decorative reference-based collage only; logo and all navigation remain real UI. */
export default function SceneHero(){
 return <section className="ns-hero ns-reference-hero ns-xerox-hero" aria-label="SceneZ">
  <div className="ns-collage" aria-hidden="true"><img className="ns-xerox-art" src="/scenez-native/scenez-xerox-hero.png" alt=""/></div>
  <div className="ns-logo"><img src="/scenez-native/scenez-approved-wordmark.png" alt="SceneZ"/></div>
  <PlacesPageSwitch active="scenez"/>
 </section>;
}
