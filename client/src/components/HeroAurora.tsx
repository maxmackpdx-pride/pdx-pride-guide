/** Ambient aurora orbs behind the home hero (motion guide hero atmosphere). */
export default function HeroAurora() {
  return (
    <div className="hero-aurora" aria-hidden="true">
      <div className="hero-aurora__orb hero-aurora__orb--a" />
      <div className="hero-aurora__orb hero-aurora__orb--b" />
      <div className="hero-aurora__orb hero-aurora__orb--c" />
    </div>
  );
}