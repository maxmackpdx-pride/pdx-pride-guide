import { useEffect, useState, type CSSProperties } from "react";

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

const rowLabel: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 800,
  fontSize: 24,
  letterSpacing: ".01em",
  textTransform: "uppercase",
  lineHeight: 1,
};

const rowCopy: CSSProperties = {
  marginTop: 6,
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "var(--board-muted)",
  lineHeight: 1.5,
};

const dismissBtn: CSSProperties = {
  position: "absolute",
  top: 10,
  right: 10,
  zIndex: 3,
  width: 28,
  height: 28,
  borderRadius: 999,
  border: "none",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  fontSize: 15,
  lineHeight: 1,
  cursor: "pointer",
};

const affiliatePill: CSSProperties = {
  position: "absolute",
  top: 12,
  left: 12,
  zIndex: 2,
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  color: "#fff",
  background: "rgba(0,0,0,.55)",
  padding: "5px 9px",
  borderRadius: 3,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

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
      className="featured-event-ad"
      data-testid="feed-affiliate-cockblock"
      style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        border: "2px solid #FF1F1F",
        boxShadow: "0 0 40px -14px #FF1F1F",
        background: "#0d0d0d",
      }}
    >
      <button type="button" aria-label="Dismiss" onClick={onDismiss} style={dismissBtn}>
        ✕
      </button>

      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          overflow: "hidden",
          background: "#000",
        }}
      >
        {CB_FRAMES.map((f, i) => (
          <img
            key={f.src}
            src={f.src}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: f.pos,
              opacity: i === frame ? 1 : 0,
              transition: "opacity .6s ease",
            }}
          />
        ))}
        <div style={affiliatePill}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "#FF1F1F",
              boxShadow: "0 0 8px #FF1F1F",
            }}
          />
          Affiliate
        </div>
        <div
          style={{
            position: "absolute",
            inset: "auto 0 0 0",
            zIndex: 2,
            height: "46%",
            background: "linear-gradient(to top, rgba(0,0,0,.82), transparent)",
            pointerEvents: "none",
          }}
        />
        <img
          src="/affiliate/feed/cb-logo-white.png"
          alt="CockBlock"
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 2,
            width: 132,
            height: "auto",
          }}
        />
      </div>

      <div style={{ padding: "16px 18px 14px" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: ".01em",
            textTransform: "uppercase",
            lineHeight: 1,
            color: "#FF3B3B",
            textShadow: "0 0 16px #FF1F1F80",
          }}
        >
          Meet CockBlock Stroke
        </div>
        <div
          style={{
            marginTop: 7,
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "var(--board-muted)",
            lineHeight: 1.5,
          }}
        >
          The only frot toy for gay men · new hand-held design · gay owned
        </div>
      </div>

      <a
        href={FEED_AFFILIATE_URLS.cockblock}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "15px 18px",
          background: "transparent",
          border: "none",
          borderTop: "1px solid #1c1c22",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            ...rowLabel,
            color: "#fff",
            textShadow: "0 0 16px rgba(255,255,255,.4)",
          }}
        >
          10% Off · Code: TUCKERMAX
        </div>
        <div style={rowCopy}>cockblocktoys.com · free US &amp; CA shipping</div>
      </a>
    </div>
  );
}

function MrsLeatherFeedAd({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="featured-event-ad"
      data-testid="feed-affiliate-mrs"
      style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        border: "2px solid #19E3FF",
        boxShadow: "0 0 40px -14px #19E3FF",
        background: "#0d0d0d",
      }}
    >
      <button type="button" aria-label="Dismiss" onClick={onDismiss} style={dismissBtn}>
        ✕
      </button>

      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          overflow: "hidden",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/affiliate/feed/mrs-logo.webp"
          alt="Mr. S Leather"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        <div style={affiliatePill}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "#19E3FF",
              boxShadow: "0 0 8px #19E3FF",
            }}
          />
          Affiliate
        </div>
      </div>

      <div style={{ padding: "16px 18px 14px" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: ".01em",
            textTransform: "uppercase",
            lineHeight: 1,
            color: "#19E3FF",
            textShadow: "0 0 16px #19E3FF80",
          }}
        >
          Gear Up at Mr S Leather
        </div>
        <div
          style={{
            marginTop: 7,
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "var(--board-muted)",
            lineHeight: 1.5,
          }}
        >
          Leather · rubber · fetish gear · made in San Francisco since 1979
        </div>
      </div>

      <a
        href={FEED_AFFILIATE_URLS.mrs}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "15px 18px",
          background: "transparent",
          border: "none",
          borderTop: "1px solid #1c1c22",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            ...rowLabel,
            color: "#fff",
            textShadow: "0 0 16px rgba(255,255,255,.4)",
          }}
        >
          Get your gear for Dore &amp; Folsom
        </div>
        <div style={rowCopy}>mr-s-leather.com · ships worldwide</div>
      </a>
    </div>
  );
}
