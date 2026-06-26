/** Subtle print-grit overlay from motion handoff — pointer-events none, sitewide. */
export default function FilmGrainOverlay() {
  return (
    <div className="film-grain-overlay" aria-hidden="true">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="pdx-film-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#pdx-film-grain)" />
      </svg>
    </div>
  );
}