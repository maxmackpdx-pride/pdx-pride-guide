import { useEffect, useState } from "react";

/** Exact affiliate destinations — do not alter path or query. */
export const FEED_AFFILIATE_URLS = {
  cockblock: "https://cockblocktoys.com/tucker060",
  mrs: "https://www.mr-s-leather.com/?acc=TUCKERMAX",
} as const;

const CB_FRAMES = [
  { src: "/affiliate/feed/cb-social.png", pos: "center", ms: 4000 },
  { src: "/affiliate/feed/cb-handhold.jpg", pos: "top center", ms: 2600 },
  { src: "/affiliate/feed/cb-models.png", pos: "center", ms: 2600 },
] as const;

type Brand = "cockblock" | "mrs";

type Props = {
  brand: Brand;
};

/**
 * Inline scene-feed affiliate card (not sticky). Matches Featured Ads.dc.html.
 */
export default function FeedAffiliateAd({ brand }: Props) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  if (brand === "cockblock") {
    return <CockBlockFeedAd onDismiss={() => setOpen(false)} />;
  }
  return <MrsLeatherFeedAd onDismiss={() => setOpen(false)} />;
}

function CockBlockFeedAd({ onDismiss }: { onDismiss: () => void }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const ms = CB_FRAMES[frame]?.ms ?? 2600;
    const t = window.setTimeout(() => {
      setFrame(i => (i + 1) % CB_FRAMES.length);
    }, ms);
    return () => window.clearTimeout(t);
  }, [frame]);

  return (
    <div
      className="featured-event-ad feed-aff feed-aff--cockblock"
      data-testid="feed-affiliate-cockblock"
    >
      <button type="button" className="feed-aff__dismiss" aria-label="Dismiss" onClick={onDismiss}>
        ✕
      </button>

      <div className="feed-aff__media">
        {CB_FRAMES.map((f, i) => (
          <img
            key={f.src}
            src={f.src}
            alt=""
            className={`feed-aff__slide${i === frame ? " is-active" : ""}`}
            style={{ objectPosition: f.pos }}
          />
        ))}
        <div className="feed-aff__pill">
          <span className="feed-aff__pill-dot feed-aff__pill-dot--cb" />
          Affiliate
        </div>
        <div className="feed-aff__shade" />
        <img
          src="/affiliate/feed/cb-logo-white.png"
          alt="CockBlock"
          className="feed-aff__logo"
        />
      </div>

      <div className="feed-aff__body">
        <div className="feed-aff__title feed-aff__title--cb">Meet CockBlock Stroke</div>
        <div className="feed-aff__copy">
          The only frot toy for people with a penis · new hand-held design · gay owned
        </div>
      </div>

      <a
        href={FEED_AFFILIATE_URLS.cockblock}
        target="_blank"
        rel="noopener noreferrer"
        className="feed-aff__cta"
      >
        <div className="feed-aff__cta-title">10% Off · Code: TUCKERMAX</div>
        <div className="feed-aff__cta-copy">cockblocktoys.com · free US &amp; CA shipping</div>
      </a>
    </div>
  );
}

function MrsLeatherFeedAd({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="featured-event-ad feed-aff feed-aff--mrs"
      data-testid="feed-affiliate-mrs"
    >
      <button type="button" className="feed-aff__dismiss" aria-label="Dismiss" onClick={onDismiss}>
        ✕
      </button>

      <div className="feed-aff__media feed-aff__media--center">
        <img
          src="/affiliate/feed/mrs-logo.webp"
          alt="Mr. S Leather"
          className="feed-aff__cover"
        />
        <div className="feed-aff__pill">
          <span className="feed-aff__pill-dot feed-aff__pill-dot--mrs" />
          Affiliate
        </div>
      </div>

      <div className="feed-aff__body">
        <div className="feed-aff__title feed-aff__title--mrs">Gear Up at Mr S Leather</div>
        <div className="feed-aff__copy">
          Leather · rubber · fetish gear · made in San Francisco since 1979
        </div>
      </div>

      <a
        href={FEED_AFFILIATE_URLS.mrs}
        target="_blank"
        rel="noopener noreferrer"
        className="feed-aff__cta"
      >
        <div className="feed-aff__cta-title">Get your gear for Dore &amp; Folsom</div>
        <div className="feed-aff__cta-copy">mr-s-leather.com · ships worldwide</div>
      </a>
    </div>
  );
}