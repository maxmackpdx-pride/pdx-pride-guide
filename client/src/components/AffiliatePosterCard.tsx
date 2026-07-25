import { useEffect, useState, type CSSProperties } from "react";
import type { AffiliateBrand } from "@/lib/affiliateCards";
import { accentForAffiliateBrand, AFFILIATE_LINKS } from "@/lib/affiliateCards";
import "./AffiliatePosterCard.css";

const CB_SLIDES = [
  "/affiliate/cb1.jpg",
  "/affiliate/cb2.png",
  "/affiliate/cb3.png",
] as const;

const SLIDE_MS = 3200;

type Props = {
  brand: AffiliateBrand;
  className?: string;
  style?: CSSProperties;
};

function CockBlockSlides() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setI(prev => (prev + 1) % CB_SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(t);
  }, []);

  return (
    <>
      <div className="pdxBoard__slides" aria-hidden="true">
        {CB_SLIDES.map((src, idx) => (
          <div
            key={src}
            className={`pdxBoard__slide${idx === i ? " is-active" : ""}`}
          >
            <img className="pdxBoard__img" src={src} alt="" />
          </div>
        ))}
      </div>
      <div className="pdxBoard__slideDots" aria-hidden="true">
        {CB_SLIDES.map((src, idx) => (
          <span
            key={src}
            className={`pdxBoard__slideDot${idx === i ? " is-active" : ""}`}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Affiliate placement that reuses the PosterCard / .pdxBoard visual system
 * (same glass as event grid cards). CockBlock = red · Mr. S = cyan.
 */
export default function AffiliatePosterCard({ brand, className = "", style }: Props) {
  const isMrs = brand === "mrs";
  const href = isMrs ? AFFILIATE_LINKS.mrs : AFFILIATE_LINKS.cockblock;
  const brandClass = isMrs ? "pdxBoard--affiliate-mrs" : "pdxBoard--affiliate-cb";
  const accent = accentForAffiliateBrand(brand);

  return (
    <a
      className={`pdxBoard pdxBoard--affiliate pdx-glass-rebind ${brandClass} ${className}`.trim()}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={
        {
          ["--ac" as string]: accent,
          ["--c" as string]: accent,
          ["--_day" as string]: accent,
          ...style,
        } as CSSProperties
      }
      data-testid={`affiliate-card-${brand}`}
      data-affiliate-brand={brand}
      aria-label={
        isMrs
          ? "Affiliate: Mr. S Leather. Shop the link, support Zaylist."
          : "Affiliate: CockBlock Toys. Code TUCKERMAX for 10% off."
      }
    >
      <span className="pdx-glass-sheen" aria-hidden="true" />
      <span className="pdx-glass-sheen--specular" aria-hidden="true" />

      <div className="pdxBoard__poster pdx-poster-well">
        <span className="pdx-poster-well__scan" aria-hidden="true" />
        {isMrs ? (
          <img
            className="pdxBoard__img"
            src="/affiliate/mrs.webp"
            alt=""
          />
        ) : (
          <CockBlockSlides />
        )}
        <span className="pdxBoard__affChip">Affiliate</span>
      </div>

      <div className="pdxBoard__meta">
        <div className="pdxBoard__tags">
          {isMrs ? (
            <>
              <span className="pdxTag pdxTag--day pdxBoard__affTag--fill">Leather &amp; Gear</span>
              <span className="pdxTag pdxTag--type">Ships Worldwide</span>
            </>
          ) : (
            <>
              <span className="pdxTag pdxTag--day pdxBoard__affTag--fill">Toys &amp; Play</span>
              <span className="pdxTag pdxTag--type">Gay-Owned</span>
            </>
          )}
        </div>

        <h3 className="pdxBoard__title">
          {isMrs ? "Mr. S Leather" : "CockBlock Toys"}
        </h3>

        <div className="pdxBoard__venue">
          {isMrs
            ? "Harnesses, restraints & fetish gear, made in SF"
            : "The original frot toy, made for two"}
        </div>

        {isMrs ? (
          <div className="pdxBoard__affMeta">Shop the link, support Zaylist</div>
        ) : (
          <div className="pdxBoard__affMeta pdxBoard__affMeta--code">
            Code TUCKERMAX for 10% off
          </div>
        )}

        <div className="pdxBoard__foot">
          <span className="pdxBoard__affAd">
            <span className="dot" aria-hidden="true" />
            Ad
          </span>
          <span className="pdxBoard__affShop pdx-glass-btn pdx-glass-btn--solid">Shop Now →</span>
        </div>
      </div>
    </a>
  );
}
