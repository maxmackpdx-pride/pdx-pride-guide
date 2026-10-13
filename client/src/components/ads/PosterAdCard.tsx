import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import type { AdDraft, AdServePayload } from "@/lib/adTypes";
import { trackAdClick, trackAdImpression } from "@/lib/adTracking";
import {
  accentForAffiliateBrand,
  resolveAdChrome,
  type AffiliateBrand,
} from "@/lib/affiliateCards";
import { ArrowRight } from "lucide-react";
import "./PosterAdCard.css";

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

function Slides({ slides, ms, auto }: { slides: string[]; ms: number; auto: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2 || !auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.matches(".calm-mode, [data-calm=\"true\"]")) return;
    const t = window.setInterval(() => setI((prev) => (prev + 1) % slides.length), ms);
    return () => window.clearInterval(t);
  }, [slides.length, ms, auto]);

  return (
    <>
      <div className="poster-ad__slides" aria-hidden="true">
        {slides.map((src, idx) => (
          <div key={`${src}-${idx}`} className={`poster-ad__slide${idx === i ? " is-active" : ""}`}>
            <img className="poster-ad__image" src={src} alt="" />
          </div>
        ))}
      </div>
      <div className="poster-ad__dots" aria-hidden="true">
        {slides.map((src, idx) => (
          <span
            key={`${src}-dot-${idx}`}
            className={`poster-ad__dot${idx === i ? " is-active" : ""}`}
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
  const cardClass = `poster-ad pdx-glass-card pdx-glass-rebind ${brandClass} ${className}`.trim();
  const cardStyle = {
    ["--ac" as string]: accent,
    ["--c" as string]: accent,
    ["--_day" as string]: accent,
    ["--day-c" as string]: accent,
    ["--on-c" as string]: "#050506",
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

      <div className="poster-ad__media">
        <span className="poster-ad__scan" aria-hidden="true" />
        {slides.length > 1 ? (
          <Slides slides={slides} ms={ad.slideMs || 3200} auto={ad.slideAuto !== false} />
        ) : slides[0] ? (
          <img className="poster-ad__image" src={slides[0]} alt="" />
        ) : (
          <div
            className="poster-ad__image"
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
        <span className="poster-ad__label">{ad.pillLabel || "Affiliate"}</span>
        <h3 className="poster-ad__title">
          {ad.title || ad.business || "Ad"}
        </h3>
      </div>

      <div className="poster-ad__body">
        <div className="poster-ad__facts">
          {ad.body ? <div className="poster-ad__description">{ad.body}</div> : null}
          {ad.ctaTitle ? (
            <div
              className={`poster-ad__offer${isCodeMeta(ad.ctaTitle) ? " poster-ad__offer--code" : ""}`}
            >
              {ad.ctaTitle}
            </div>
          ) : null}
        </div>
        <div className="poster-ad__tags">
          {ad.tag1 ? (
            <span className="poster-ad__tag">{ad.tag1}</span>
          ) : null}
          {ad.tag2 ? <span className="poster-ad__tag">{ad.tag2}</span> : null}
        </div>

        <div className="poster-ad__footer">
          <span className="poster-ad__disclosure">
            <span className="dot" aria-hidden="true" />
            Ad
          </span>
          <span className="poster-ad__shop pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind">
            {ad.ctaCopy || "Shop Now"}<ArrowRight size={14} aria-hidden="true" />
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
