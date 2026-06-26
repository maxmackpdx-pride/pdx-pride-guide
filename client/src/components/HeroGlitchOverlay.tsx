import HeroImageGlitch from "./HeroImageGlitch";

/** CRT scanlines + RGB glitch over the home hero photo. */
export default function HeroGlitchOverlay() {
  return <HeroImageGlitch intensity="hero" className="home-hero-glitch" />;
}