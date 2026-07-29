import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import type { AdDraft, AdServePayload } from "@/lib/adTypes";
import { trackAdClick, trackAdImpression } from "@/lib/adTracking";
import { resolveAdChrome } from "@/lib/affiliateCards";
import "@/components/AffiliatePosterCard.css";

type AdLike = AdDraft | AdServePayload;

type Props = {
  ad: AdLike;
  /** When true, skip tracking (admin live preview). */
  preview?: boolean;
  className?: string;
};

/**
 * Data-driven scene-feed ad card. Deep-glass + brand edge
 * (CockBlock red · Mr. S cyan · custom = primaryColor).
 * Layout matches FeedAffiliateAd / live hub feed.
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
  const { accent: primary, feedBrandClass, brand } = resolveAdChrome(ad);
  const brandTint = primary;
  const dismissible = ad.dismissible !== false;
  // Mr S feed (and other centered logo creatives) use logo-in-well layout
  const centerMedia =
    !isSlideshow &&
    (brand === "mrs" ||
      Boolean(ad.logoImg && ad.singleSrc && ad.logoImg === ad.singleSrc) ||
      /logo|mrs/i.test(ad.singleSrc || ad.logoImg || ""));

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

  const onCtaClick = (e: MouseEvent) => {
    if (preview) {
      e.preventDefault();
      return;
    }
    if (ad.id) trackAdClick(ad.id, "feed");
  };

  return (
    <div
      className={`feed-aff ${feedBrandClass} pdx-glass-rebind ${className}`.trim()}
      data-testid={ad.id ? `feed-ad-${ad.id}` : "feed-ad-preview"}
      data-affiliate-brand={brand}
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

      <div
        className={`feed-aff__media${centerMedia ? " feed-aff__media--center" : ""}`}
      >
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
          <span
            className={`feed-aff__pill-dot${
              brand === "mrs"
                ? " feed-aff__pill-dot--mrs"
                : brand === "cockblock"
                  ? " feed-aff__pill-dot--cb"
                  : ""
            }`}
          />
          {ad.pillLabel || "Affiliate"}
        </div>
        {isSlideshow && <div className="feed-aff__shade" />}
        {ad.logoImg && isSlideshow && (
          <img src={ad.logoImg} alt={ad.logoText || ad.business} className="feed-aff__logo" />
        )}
      </div>

      <div className="feed-aff__body">
        <div
          className={`feed-aff__title${
            brand === "mrs"
              ? " feed-aff__title--mrs"
              : brand === "cockblock"
                ? " feed-aff__title--cb"
                : ""
          }`}
        >
          {ad.title || ad.business || "Ad"}
        </div>
        {ad.body ? <div className="feed-aff__copy">{ad.body}</div> : null}
      </div>

      {preview || !ad.destUrl ? (
        <div className="feed-aff__cta" role="presentation">
          <div className="feed-aff__cta-title">{ad.ctaTitle || "Learn more"}</div>
          {ad.ctaCopy ? <div className="feed-aff__cta-copy">{ad.ctaCopy}</div> : null}
        </div>
      ) : (
        <a
          href={ad.destUrl}
          target={ad.destUrl.startsWith("http") ? "_blank" : undefined}
          rel={ad.destUrl.startsWith("http") ? "noopener noreferrer" : undefined}
          className="feed-aff__cta"
          onClick={onCtaClick}
        >
          <div className="feed-aff__cta-title">{ad.ctaTitle || "Learn more"}</div>
          {ad.ctaCopy ? <div className="feed-aff__cta-copy">{ad.ctaCopy}</div> : null}
        </a>
      )}
    </div>
  );
}
