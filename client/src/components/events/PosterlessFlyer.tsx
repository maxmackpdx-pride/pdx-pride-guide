import "./PosterlessFlyer.css";

/**
 * Designed fallback flyer for posterless events (Tucker, Nov 19, 2026):
 * the place image centered and slightly blurred on a black treatment,
 * with the logo dead center, sized to look good. FetLife-sourced events
 * carry the FetLife mark instead of the venue's logo (passed in as
 * `wordmark` — the repo has no FetLife logo asset file; see BUILD-REPORT).
 * With neither an image nor a logo available this renders nothing and the
 * card keeps its existing typographic face. Display treatment only: it
 * never writes a poster URL or fabricates a poster asset. Made-by: Muse
 */
export function PosterlessFlyer({
  placeImageUrl,
  logoUrl,
  wordmark,
}: {
  placeImageUrl?: string | null;
  logoUrl?: string | null;
  wordmark?: string | null;
}) {
  if (!placeImageUrl && !logoUrl && !wordmark) return null;
  return (
    <div className="plf" aria-hidden="true">
      {placeImageUrl ? <img className="plf__img" src={placeImageUrl} alt="" decoding="async" /> : null}
      <span className="plf__scrim" />
      {logoUrl
        ? <img className="plf__logo" src={logoUrl} alt="" decoding="async" />
        : wordmark
          ? <span className="plf__word">{wordmark}</span>
          : null}
    </div>
  );
}
