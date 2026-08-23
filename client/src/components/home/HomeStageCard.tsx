/**
 * Sample post card for home-stage board slides.
 * Anatomy matches the handoff: live dot + kicker + optional DEMO sticker,
 * square thumb (or quote tile), condensed title, muted line, seam meta + CTA.
 */

import { Link } from "wouter";
import type { HomeStageCardData } from "@/lib/homeStageSamples";
import "./HomeStageCard.css";

type Props = {
  card: HomeStageCardData;
  className?: string;
  /** Force hide (e.g. mobile). Parent stage usually media-queries this. */
  hidden?: boolean;
};

export default function HomeStageCard({ card, className = "", hidden }: Props) {
  if (hidden) return null;

  const style = { ["--c" as string]: card.accent };
  /* An image earns the whole card: full-bleed behind the copy, not a 62px
     chip beside it. Quote tiles keep the side-tile layout - they are a glyph,
     not a photograph, and stretching one to full bleed reads as a mistake. */
  const hasMedia = Boolean(card.thumbUrl) && !card.quoteTile;

  return (
    <Link
      href={card.href}
      className={`home-stage-card pdx-glass-card pdx-glass-rebind${hasMedia ? " home-stage-card--media" : ""} ${className}`.trim()}
      style={style}
      data-zl-card=""
      data-board={card.key}
      data-live={card.isLive ? "1" : "0"}
    >
      <span className="pdx-refract-seam" aria-hidden="true" />
      {hasMedia ? (
        <>
          <img className="home-stage-card__bg" src={card.thumbUrl ?? undefined} alt="" aria-hidden="true" />
          <span className="home-stage-card__scrim" aria-hidden="true" />
        </>
      ) : null}
      <div className="home-stage-card__kicker-row">
        <span className="home-stage-card__dot" aria-hidden="true" />
        <span className="home-stage-card__kicker">{card.kicker}</span>
        {!card.isLive ? (
          <span className="home-stage-card__demo" aria-hidden="true">
            Demo
          </span>
        ) : null}
      </div>
      <div className="home-stage-card__body">
        {card.quoteTile ? (
          <span className="home-stage-card__quote" aria-hidden="true">
            "
          </span>
        ) : hasMedia ? null : (
          <span className="home-stage-card__thumb home-stage-card__thumb--empty" aria-hidden="true" />
        )}
        <div className="home-stage-card__copy">
          <h4 className="home-stage-card__title">{card.title}</h4>
          <p className="home-stage-card__line">{card.line}</p>
        </div>
      </div>
      <div className="home-stage-card__foot">
        <span className="home-stage-card__meta">{card.meta}</span>
        <span className="home-stage-card__cta">{card.cta}</span>
      </div>
    </Link>
  );
}
