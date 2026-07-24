import "./support.css";

export const SPONSOR_CHECKS = [
  "Owned by us — or truly for us.",
  "Treats its people right. Pays them right.",
  "Does not need us to scrub anything clean first.",
] as const;

type Props = {
  className?: string;
  /** When true, wrap in a neutral glass card (Sponsors page). About embeds without shell. */
  card?: boolean;
  /** Show the lime "Pitch a sponsorship" CTA. */
  showPitch?: boolean;
  onPitch?: () => void;
  /** Optional lede under pitch (Sponsors page). */
  pitchNote?: string;
  /** Override default kicker text. */
  kicker?: string;
};

/**
 * Sponsors copy + lime-left-accent qualifier rows + lime glass pitch button.
 * Default: neutral glass outer card (design SoT). Pass `card={false}` to unwrap.
 */
export default function SponsorsPanel({
  className = "",
  card = true,
  showPitch = true,
  onPitch,
  pitchNote,
  kicker = "Sponsors",
}: Props) {
  const shell = card
    ? `support-sponsors support-sponsors--card${className ? ` ${className}` : ""}`
    : `support-sponsors${className ? ` ${className}` : ""}`;

  return (
    <div className={shell} data-testid="support-sponsors">
      {card ? <span className="pdx-glass-sheen" aria-hidden="true" /> : null}
      <div className="support-sponsors__grid about-v2-sponsors__grid">
        <div className="support-sponsors__copy about-v2-sponsors__copy">
          <h3 className="support-sponsors__title">{kicker}</h3>
          <p>
            Sponsors can buy featured posts in the scene feed and/or ads on the site. That is how this stays free
            to browse. The bar is simple: you need to be part of the community or already support what we are
            building. No scrubbing your brand first. No random corporate Pride cosplay.
          </p>
          <p>
            And it does not stop on July 19. After Pride week this becomes a{" "}
            <strong className="support-sponsors__strong about-v2-sponsors__strong">year round resource</strong> for
            the scene, so your support keeps working long after the parade.
          </p>
          {showPitch && onPitch ? (
            <>
              <button
                type="button"
                className="support-sponsors__pitch"
                onClick={onPitch}
                data-testid="support-pitch-sponsorship"
              >
                Pitch a sponsorship
              </button>
              {pitchNote ? <p className="support-sponsors__lede">{pitchNote}</p> : null}
            </>
          ) : null}
        </div>
        <div className="support-sponsors__checks about-v2-sponsors__checks">
          {SPONSOR_CHECKS.map(item => (
            <div key={item} className="support-sponsors__check about-v2-sponsors__check">
              <span className="mark" aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
