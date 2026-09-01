// @ts-nocheck
import React, { useLayoutEffect, useRef } from "react";
import "./event-grid-card.css";

const DAY_BASE = {
  MON: "var(--day-mon)", TUE: "var(--day-tue)", WED: "var(--day-wed)",
  THU: "var(--day-thu)", FRI: "var(--day-fri)", SAT: "var(--day-sat)", SUN: "var(--day-sun)",
};
const DAY_CONTRAST = { MON: "#fff", TUE: "#fff", WED: "#050506", THU: "#050506", FRI: "#050506", SAT: "#050506", SUN: "#050506" };
const DAY_SECONDARY = { MON: "#ccff00", TUE: "#ff7a00", WED: "#8f5cff", THU: "#ff7a00", FRI: "#ccff00", SAT: "#ff2d3d", SUN: "#00ffff" };
const measureCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
const measureContext = measureCanvas?.getContext("2d") || null;
function measureTitle(value: string) {
  if (!measureContext) return Math.max(1, value.length * 52);
  measureContext.font = "900 100px 'Barlow Condensed', 'Arial Narrow', sans-serif";
  return Math.max(1, measureContext.measureText(value).width - (2 * value.length));
}
function solveTitle(value: string, width: number) {
  const words = String(value).trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [{ text: words[0] || "", size: width / measureTitle(words[0] || "") * 100 }];
  const candidates = Array.from({ length: words.length - 1 }, (_, index) => [words.slice(0, index + 1).join(" "), words.slice(index + 1).join(" ")]);
  let winner: { lines: string[]; sizes: number[]; score: number } | null = null;
  for (const lines of candidates) {
    const sizes = lines.map(line => width / measureTitle(line) * 100);
    const ratio = Math.max(sizes[0] / sizes[1], sizes[1] / sizes[0]);
    const score = Math.abs(Math.log(ratio)) * 18 + (lines[0].split(" ").length === 1 ? 80 : 0) + (ratio > 3 ? 60 : 0);
    if (!winner || score < winner.score) winner = { lines, sizes, score };
  }
  return winner!.lines.map((text, index) => ({ text, size: winner!.sizes[index] }));
}

function DynamicEventTitle({ title }: { title: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const fit = () => {
      const poster = node.closest(".pdxBoard__poster") as HTMLElement | null;
      if (!poster) return;
      const nodeStyles = getComputedStyle(node);
      const inset = Number.parseFloat(nodeStyles.getPropertyValue("--event-title-inset")) || 17;
      const floor = Number.parseFloat(nodeStyles.getPropertyValue("--event-title-floor")) || 24;
      const expandAt = Number.parseFloat(nodeStyles.getPropertyValue("--event-title-expand-at")) || 42;
      const compact = solveTitle(title, Math.max(1, poster.clientWidth / 2 - inset));
      const expanded = compact.some(line => line.size < expandAt);
      node.classList.toggle("is-expanded", expanded);
      const width = Math.max(1, expanded ? poster.clientWidth - (inset * 2) : poster.clientWidth / 2 - inset);
      const result = solveTitle(title, width);
      const lines = result.map(({ text, size }) => {
        const line = document.createElement("span");
        line.className = "pdxBoard__titleLine";
        line.dataset.shadowText = text;
        line.textContent = text;
        line.style.fontSize = `${Math.max(floor, Math.min(176, size)).toFixed(2)}px`;
        return line;
      });
      node.replaceChildren(...lines);
      // Canvas metrics differ slightly from the painted condensed webfont.
      // Correct against the actual glyph box so strokes/bloom never clip.
      lines.forEach((line) => {
        const paintedWidth = line.getBoundingClientRect().width;
        if (paintedWidth > width) {
          const current = Number.parseFloat(line.style.fontSize) || floor;
          // The two-column mobile override can make an unusually long row
          // wider than the poster even at the preferred floor. Containment
          // wins in that exceptional case; keep both title rows intact.
          line.style.fontSize = `${Math.max(8, current * (width / paintedWidth) * 0.975).toFixed(2)}px`;
        }
      });
      node.setAttribute("aria-label", title);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    fit();
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [title]);
  return <h3 ref={ref} className="pdxBoard__title" aria-label={title}>{title}</h3>;
}

const SHINE_STEPS = ["base", "medium", "shoulder", "mid", "high", "crest", "prepeak", "peak"];
export function EdgeLight() {
  return <>{[true, false].flatMap(bloom => SHINE_STEPS.map(step => <span key={`${bloom}-${step}`} className={`pdxBoard__shine pdxBoard__shine--${step}${bloom ? " pdxBoard__bloom" : ""}`} aria-hidden="true" />))}</>;
}

/** Approved Standard / Today-Events grid card (`event-card-grid`). */
export function PosterCard({
  title, venue, when, day = "FRI", image, types = [], admission, age,
  claimable = false, claimPending = false, onClaimClick, onOpen,
  href, venueHref, address, ticketHref, ticketLabel, going, onRsvp,
  showLink, showDetailsLink, dense,
  className = "", style = {}, ...rest
}: any) {
  const base = DAY_BASE[day] || "#fff";
  const contrast = DAY_CONTRAST[day] || "#050506";
  const secondary = DAY_SECONDARY[day] || "#00ffff";
  const visibleTypes = types.slice(0, 3);
  const stop = (event: React.SyntheticEvent) => { event.preventDefault(); event.stopPropagation(); };
  const open = (event: React.MouseEvent) => {
    stop(event);
    onOpen?.((event.currentTarget as HTMLElement).closest(".ds-listing-card"));
  };
  const claim = (event: React.MouseEvent) => { stop(event); onClaimClick?.(); };
  return (
    <article className={`pdxBoard pdxBoard--event-grid${className ? ` ${className}` : ""}`} style={{ "--day-c": base, "--c": base, "--on-c": contrast, "--opposite-neon": secondary, ...style }} {...rest}>
      <EdgeLight />
      <div className="pdxBoard__poster">
        {image ? <img className="pdxBoard__img" src={image} alt="" /> : <div className="pdxBoard__ph" aria-hidden="true" />}
        <span className="pdxBoard__scan" aria-hidden="true" />
        <DynamicEventTitle title={title} />
      </div>
      <div className="pdxBoard__meta">
        <span className="pdxBoard__divider" aria-hidden="true" />
        <div className="pdxBoard__facts">
          {venue && <div className="pdxBoard__venue">{venue}</div>}
          {when && <div className="pdxBoard__when">{when}</div>}
        </div>
        <div className="pdxBoard__tags" aria-label="Event tags">
          <span className="pdxTag pdxTag--day">{day}</span>
          {visibleTypes.map((type: string, index: number) => <span className="pdxTag pdxTag--type" key={`${type}-${index}`}>{type}</span>)}
        </div>
        <div className="pdxBoard__actions">
          <button type="button" className="pdxBoard__action pdxBoard__action--more" onClick={open}><span className="pdxBoard__actionLabel">More Info</span></button>
          {claimPending ? <span className="pdxBoard__action pdxBoard__action--pending"><span className="pdxBoard__actionLabel">Claim Pending</span></span> : <button type="button" className="pdxBoard__action pdxBoard__action--claim" onClick={claim} disabled={!claimable}><span className="pdxBoard__actionLabel">Claim Event</span></button>}
        </div>
      </div>
    </article>
  );
}
