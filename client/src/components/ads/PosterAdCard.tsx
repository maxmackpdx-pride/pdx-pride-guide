import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import type { AdDraft, AdServePayload } from "@/lib/adTypes";
import { trackAdClick, trackAdImpression } from "@/lib/adTracking";
import {
  accentForAffiliateBrand,
  resolveAdChrome,
  type AffiliateBrand,
} from "@/lib/affiliateCards";
/** Injects base .pdxBoard layout/chrome (same as event grid cards). */
import "@/components/ds/PosterCard";
import "@/components/AffiliatePosterCard.css";

type AdLike = AdDraft | AdServePayload;

type Props = {
  ad: AdLike;
  preview?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Force brand when known (legacy scatter without payload). */
  brand?: AffiliateBrand;
};

function isCodeMeta(text: string) {
  return /code|tucker|%|\boff\b/i.test(text);
}

function Slides({ slides, ms }: { slides: string[]; ms: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = window.setInterval(() => setI((prev) => (prev + 1) % slides.length), ms);
    return () => window.clearInterval(t);
  }, [slides.length, ms]);

  return (
    <>
      <div className="pdxBoard__slides" aria-hidden="true">
        {slides.map((src, idx) => (
          <div key={`${src}-${idx}`} className={`pdxBoard__slide${idx === i ? " is-active" : ""}`}>
            <img className="pdxBoard__img" src={src} alt="" />
          </div>
        ))}
      </div>
      <div className="pdxBoard__slideDots" aria-hidden="true">
        {slides.map((src, idx) => (
          <span
            key={`${src}-dot-${idx}`}
            className={`pdxBoard__slideDot${idx === i ? " is-active" : ""}`}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Data-driven events-grid poster ad.
 * Same deep-glass chrome as event grid cards / AffiliatePosterCard.
 * Brand: CockBlock red · Mr. S cyan · custom = primaryColor.
 */
export default function PosterAdCard({
  ad,
  preview = false,
  className = "",
  style,
  brand: brandProp,
}: Props) {
  const chrome = resolveAdChrome(ad);
  const brandClass = brandProp
    ? brandProp === "mrs"
      ? "pdxBoard--affiliate-mrs"
      : "pdxBoard--affiliate-cb"
    : chrome.posterBrandClass;
  const accent = brandProp
    ? ad.primaryColor?.trim() || accentForAffiliateBrand(brandProp)
    : chrome.accent;

  const slides =
    ad.mediaMode === "slideshow" && ad.slides?.length
      ? ad.slides
      : ad.singleSrc
        ? [ad.singleSrc]
        : [];

  useEffect(() => {
    if (preview || !ad.id) return;
    trackAdImpression(ad.id, "grid");
  }, [ad.id, preview]);

  const onClick = (e: MouseEvent) => {
    if (preview) {
      e.preventDefault();
      return;
    }
    if (ad.id) trackAdClick(ad.id, "grid");
  };

  const dest = !preview && ad.destUrl ? ad.destUrl : undefined;
  const cardClass = `pdxBoard pdxBoard--affiliate pdx-glass-rebind ${brandClass} ${className}`.trim();
  const cardStyle = {
    ["--ac" as string]: accent,
    ["--c" as string]: accent,
    ["--_day" as string]: accent,
    cursor: preview || !dest ? "default" : undefined,
    ...style,
  } as CSSProperties;
  const cardProps = {
    className: cardClass,
    style: cardStyle,
    "data-testid": ad.id ? `poster-ad-${ad.id}` : "poster-ad-preview",
    "data-affiliate-brand": brandProp ?? chrome.brand,
    "aria-label": `Affiliate: ${ad.business || ad.title}. ${ad.ctaTitle || ""}`,
    onClick,
  } as const;

  const inner = (
    <>
      <span className="pdx-glass-sheen" aria-hidden="true" />
      <span className="pdx-glass-sheen--specular" aria-hidden="true" />

      <div className="pdxBoard__poster pdx-poster-well">
        <span className="pdx-poster-well__scan" aria-hidden="true" />
        {slides.length > 1 ? (
          <Slides slides={slides} ms={ad.slideMs || 3200} />
        ) : slides[0] ? (
          <img className="pdxBoard__img" src={slides[0]} alt="" />
        ) : (
          <div
            className="pdxBoard__img"
            style={{
              display: "grid",
              placeItems: "center",
              background: `radial-gradient(circle at 50% 40%, ${accent}44, #0a0a0a)`,
              color: accent,
              fontWeight: 900,
              letterSpacing: "0.12em",
              position: "relative",
              zIndex: 1,
            }}
          >
            {ad.logoText || "LOGO"}
          </div>
        )}
        <span className="pdxBoard__affChip">{ad.pillLabel || "Affiliate"}</span>
      </div>

      <div className="pdxBoard__meta">
        <div className="pdxBoard__tags">
          {ad.tag1 ? (
            <span className="pdxTag pdxTag--day pdxBoard__affTag--fill">{ad.tag1}</span>
          ) : null}
          {ad.tag2 ? <span className="pdxTag pdxTag--type">{ad.tag2}</span> : null}
        </div>

        <h3 className="pdxBoard__title">{ad.title || ad.business || "Ad"}</h3>
        {ad.body ? <div className="pdxBoard__venue">{ad.body}</div> : null}
        {ad.ctaTitle ? (
          <div
            className={`pdxBoard__affMeta${isCodeMeta(ad.ctaTitle) ? " pdxBoard__affMeta--code" : ""}`}
          >
            {ad.ctaTitle}
          </div>
        ) : null}

        <div className="pdxBoard__foot">
          <span className="pdxBoard__affAd">
            <span className="dot" aria-hidden="true" />
            Ad
          </span>
          <span className="pdxBoard__affShop pdx-glass-btn pdx-glass-btn--solid">
            {ad.ctaCopy || "Shop Now →"}
          </span>
        </div>
      </div>
    </>
  );

  if (dest) {
    return (
      <a
        {...cardProps}
        href={dest}
        target={dest.startsWith("http") ? "_blank" : undefined}
        rel={dest.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {inner}
      </a>
    );
  }

  return (
    <div {...cardProps} role="group">
      {inner}
    </div>
  );
}
