import { useEffect, useState, type CSSProperties } from "react";
import type { AdDraft, AdServePayload } from "@/lib/adTypes";
import { trackAdClick, trackAdImpression } from "@/lib/adTracking";
import "@/components/AffiliatePosterCard.css";

const ACCENT_CB = "#ff1f1f";
const ACCENT_MRS = "#19e3ff";

type AdLike = AdDraft | AdServePayload;

type Props = {
  ad: AdLike;
  /** When true, skip tracking (admin live preview). */
  preview?: boolean;
  className?: string;
};

function brandAccent(ad: AdLike): { accent: string; brandClass: string } {
  const raw = `${ad.business || ""} ${ad.title || ""} ${ad.pillLabel || ""}`.toLowerCase();
  if (/\bmr\.?\s*s\b|mr-s|mrs leather/.test(raw)) {
    return { accent: ACCENT_MRS, brandClass: "feed-aff--mrs" };
  }
  if (/cockblock|cock block/.test(raw)) {
    return { accent: ACCENT_CB, brandClass: "feed-aff--cockblock" };
  }
  // Prefer explicit primary when present; default red for generic feed slots
  const primary = (ad.primaryColor || "").toLowerCase();
  if (primary.includes("19e3") || primary.includes("00ffff") || primary.includes("cyan")) {
    return { accent: ad.primaryColor || ACCENT_MRS, brandClass: "feed-aff--mrs" };
  }
  return { accent: ad.primaryColor || ACCENT_CB, brandClass: "feed-aff--cockblock" };
}

/**
 * Data-driven scene-feed ad card. Deep-glass + brand edge
 * (CockBlock red · Mr. S cyan). Layout / 3 rows preserved.
 */
export default function FeedAdCard({ ad, preview = false, className = "" }: Props) {
  const [open, setOpen] = useState(true);
  const [frame, setFrame] = useState(0);
  const slides =
    ad.mediaMode === "slideshow" && ad.slides?.length
      ? ad.slides
      : ad.singleSrc
        ? [ad.singleSrc]
        : ad.logoImg
          ? [ad.logoImg]
          : [];
  const isSlideshow = slides.length > 1;
  const { accent: primary, brandClass } = brandAccent(ad);
  const brandTint = ad.primaryColor || primary;
  const dismissible = ad.dismissible !== false;

  useEffect(() => {
    if (preview || !ad.id) return;
    trackAdImpression(ad.id, "feed");
  }, [ad.id, preview]);

  useEffect(() => {
    if (!isSlideshow || ad.slideAuto === false) return;
    const ms = ad.slideMs || 2600;
    const t = window.setTimeout(() => {
      setFrame((i) => (i + 1) % slides.length);
    }, ms);
    return () => window.clearTimeout(t);
  }, [frame, isSlideshow, slides.length, ad.slideAuto, ad.slideMs]);

  if (!open) return null;

  const onCtaClick = () => {
    if (!preview && ad.id) trackAdClick(ad.id, "feed");
  };

  return (
    <div
      className={`feed-aff ${brandClass} pdx-glass-rebind ${className}`.trim()}
      data-testid={ad.id ? `feed-ad-${ad.id}` : "feed-ad-preview"}
      style={
        {
          ["--feed-aff-primary" as string]: primary,
          ["--feed-aff-secondary" as string]: ad.secondaryColor || "#fff",
          ["--c" as string]: primary,
        } as CSSProperties
      }
    >
      <span className="pdx-glass-sheen" aria-hidden="true" />
      <span className="pdx-glass-sheen--specular" aria-hidden="true" />

      {dismissible && (
        <button
          type="button"
          className="feed-aff__dismiss"
          aria-label="Dismiss"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
      )}

      <div className={`feed-aff__media${isSlideshow ? "" : " feed-aff__media--center"}`}>
        <span className="pdx-poster-well__scan" aria-hidden="true" />
        {isSlideshow ? (
          slides.map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt=""
              className={`feed-aff__slide${i === frame ? " is-active" : ""}`}
            />
          ))
        ) : slides[0] ? (
          <img src={slides[0]} alt={ad.business || ""} className="feed-aff__cover" />
        ) : (
          <div
            className="feed-aff__cover"
            style={{
              display: "grid",
              placeItems: "center",
              background: `radial-gradient(circle at 50% 40%, ${brandTint}33, #0a0a0a)`,
              color: brandTint,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {ad.logoText || ad.business || "AD"}
          </div>
        )}
        <div className="feed-aff__pill">
          <span className="feed-aff__pill-dot" />
          {ad.pillLabel || "Affiliate"}
        </div>
        {isSlideshow && <div className="feed-aff__shade" />}
        {ad.logoImg && isSlideshow && (
          <img src={ad.logoImg} alt={ad.logoText || ad.business} className="feed-aff__logo" />
        )}
      </div>

      <div className="feed-aff__body">
        <div className="feed-aff__title">{ad.title || ad.business || "Ad"}</div>
        {ad.body ? <div className="feed-aff__copy">{ad.body}</div> : null}
      </div>

      <a
        href={ad.destUrl || "#"}
        target={ad.destUrl?.startsWith("http") ? "_blank" : undefined}
        rel={ad.destUrl?.startsWith("http") ? "noopener noreferrer" : undefined}
        className="feed-aff__cta"
        onClick={onCtaClick}
      >
        <div className="feed-aff__cta-title">{ad.ctaTitle || "Learn more"}</div>
        {ad.ctaCopy ? <div className="feed-aff__cta-copy">{ad.ctaCopy}</div> : null}
      </a>
    </div>
  );
}
