import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { driveMinutes } from "@/lib/ridezForm";
import { haptic } from "./flipCard";
import { CardLogoMark, type CardLogo } from "./cardLogo";
import type { ActionSheetAction } from "./ActionSheetCard";
import "./ActionSheetCard.css";
import "./ExpandingActionPanel.css";

/**
 * ExpandingActionPanel (Tucker, t345u): the in-card panel a tile row opens.
 * It replaced the tile sheets (Ridez / Afterz / Directions). Tapping a tile
 * splits the divider under the tiles into two accent lines and the panel
 * opens inline between them; the content below slides down with it.
 *  - Background matches the countdown box; two large bloom orbs drift off the
 *    top corners in the tile's accent (static under reduced motion / Calm Mode).
 *  - Another tile cross-fades content, orbs and lines without closing
 *    (the host keys `panelKey`); the same tile, the X or a swipe up closes.
 *  - It fits its content (no inner scroll). Light haptic on open and close.
 * Dialog sheets opened from cards (Gigz, Mizzed, popups) stay ActionSheetCard.
 */
export type ExpandingActionPanelProps = {
  /** Which tile owns the panel; a change cross-fades content, orbs and lines. */
  panelKey: string;
  /** Accent token of the owning tile, e.g. "var(--neon-orange)". */
  accent: string;
  /** Accessible region name. */
  label: string;
  kicker?: string;
  title?: string;
  /** Right side of the header, e.g. Directions' distance and travel time. */
  meta?: ReactNode;
  logo?: CardLogo | null;
  centered?: boolean;
  actions?: ActionSheetAction[];
  /** false plays the close (collapse) and then calls onClosed. */
  open: boolean;
  onRequestClose: () => void;
  onClosed: () => void;
  children?: ReactNode;
};

const COLLAPSE_MS = 320;

export function ExpandingActionPanel({ panelKey, accent, label, kicker = "", title, meta, logo = null, centered = false, actions = [], open, onRequestClose, onClosed, children }: ExpandingActionPanelProps) {
  const [shown, setShown] = useState(false);
  const drag = useRef<{ y: number; id: number } | null>(null);
  useEffect(() => {
    if (open) {
      haptic(10);
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    haptic(10);
    setShown(false);
    const t = window.setTimeout(onClosed, COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [open]);
  return (
    <section
      className={`zxp${shown ? " is-open" : ""}${centered ? " zxp--centered" : ""}`}
      aria-label={label}
      data-panel={panelKey}
      style={{ "--tile": accent } as CSSProperties}
      onPointerDown={e => {
        if ((e.target as HTMLElement).closest("a,button,input,textarea,select,.zas-rail")) return;
        drag.current = { y: e.clientY, id: e.pointerId };
      }}
      onPointerUp={e => {
        const d = drag.current; drag.current = null;
        if (d && d.id === e.pointerId && d.y - e.clientY > 48) onRequestClose();
      }}
      onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onRequestClose(); } }}
    >
      <div className="zxp-clip">
        <div className="zxp-body" key={panelKey}>
          <span className="zxp-line zxp-line--top" aria-hidden="true" />
          <span className="zxp-orb zxp-orb--l" aria-hidden="true" />
          <span className="zxp-orb zxp-orb--r" aria-hidden="true" />
          <button type="button" className="zas-x zxp-x" aria-label={`Close ${label}`} data-action="close" onClick={onRequestClose}>✕</button>
          <div className="zxp-inner">
            {logo ? <div className="zcard-logo-row"><CardLogoMark logo={logo} /></div> : null}
            {kicker || title || meta ? (
              <header className="zas-head zxp-head">
                <p className="zas-kicker">{kicker}{title ? <span>{title}</span> : null}</p>
                {meta ? <span className="zxp-meta">{meta}</span> : null}
              </header>
            ) : null}
            {children}
            {actions.length ? (
              <div className="zas-acts">
                {actions.map(a => a.href ? (
                  <a key={a.label} data-action={a.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className={`obtn zas-act${a.primary ? " obtn--accent" : ""}`} href={a.href}
                    style={a.color ? ({ "--obtn-c": a.color } as CSSProperties) : undefined}
                    target={a.external ? "_blank" : undefined} rel={a.external ? "noreferrer" : undefined} onClick={() => a.onClick?.()}>
                    {a.label} <span>{a.external ? "↗" : "›"}</span>
                  </a>
                ) : (
                  <button key={a.label} type="button" data-action={a.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className={`obtn zas-act${a.primary ? " obtn--accent" : ""}`} disabled={a.disabled} onClick={a.onClick}>
                    {a.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <span className="zxp-line zxp-line--bottom" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

/** Straight-line distance and a rough travel time (walk under ~1.2 mi, else drive). */
export function travelEstimate(from: { lat: number; lng: number }, to: { lat: number; lng: number }): { miles: number; minutes: number; mode: "WALK" | "DRIVE" } {
  const R = 3958.8, rad = Math.PI / 180;
  const dLat = (to.lat - from.lat) * rad, dLng = (to.lng - from.lng) * rad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(to.lat * rad) * Math.sin(dLng / 2) ** 2;
  const miles = 2 * R * Math.asin(Math.sqrt(s));
  if (miles < 1.2) return { miles, minutes: Math.max(1, Math.round(miles * 1.25 * 20)), mode: "WALK" };
  return { miles, minutes: driveMinutes(miles), mode: "DRIVE" };
}

/** Distance + time to a point, only when location is already permitted (never prompts). */
export function usePermittedTravel(to: { lat: number; lng: number } | null, enabled: boolean): string | null {
  const [label, setLabel] = useState<string | null>(null);
  const lat = to?.lat, lng = to?.lng;
  useEffect(() => {
    if (!enabled || lat == null || lng == null || typeof navigator === "undefined" || !navigator.permissions || !navigator.geolocation) return;
    let live = true;
    void navigator.permissions.query({ name: "geolocation" as PermissionName }).then(p => {
      if (!live || p.state !== "granted") return;
      navigator.geolocation.getCurrentPosition(pos => {
        if (!live) return;
        const t = travelEstimate({ lat: pos.coords.latitude, lng: pos.coords.longitude }, { lat, lng });
        setLabel(`${t.miles < 10 ? t.miles.toFixed(1) : Math.round(t.miles)} MI · ~${t.minutes} MIN ${t.mode}`);
      }, () => {}, { maximumAge: 300_000, timeout: 8_000 });
    }).catch(() => {});
    return () => { live = false; };
  }, [enabled, lat, lng]);
  return label;
}

export default ExpandingActionPanel;
