import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { flipIn, flipOut, growIn, growOut, type OriginRect } from "./flipCard";
import { CardLogoMark, type CardLogo } from "./cardLogo";
import "./ActionSheetCard.css";

/**
 * ActionSheetCard: the card type opened FROM a card (Tucker, t305u).
 * Maps, Rideshare, Gigz and Mizzed items, share / invite / message popups and
 * the share join prompt all use it. It renders inside its host card (the host
 * must be position:relative), blurs that card, and shows one deep-glass box in
 * the opener's accent. Two motions:
 *  - "grow" (tiles, t306u): no flip; the box expands from the tile and the
 *    tile's icon travels into the header icon, then shrinks back on dismiss.
 *  - "flip" (cards: Gigz, Mizzed, popups opened from a card): flip-and-grow
 *    from `origin`, flip-and-shrink back.
 * Dismiss = close, scrim tap, Escape, swipe down. Reduced motion / Calm Mode
 * fade instead.
 */
export type ActionSheetAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  /** Opens in a new tab with ↗. */
  external?: boolean;
  /** Accent rim (the one primary action). */
  primary?: boolean;
  disabled?: boolean;
};

export type ActionSheetCardProps = {
  /** Accent token, e.g. "var(--neon-magenta)"; drives edge, glow and buttons. */
  accent: string;
  /** Small kicker above the title, e.g. "DIRECTIONS". */
  kicker: string;
  title?: string;
  icon?: ReactNode;
  /** Family logo above the kicker (Afterz, Mizzed, Gigz, Ridez placeholder). */
  logo?: CardLogo | null;
  /** Accessible dialog name. */
  label: string;
  /** Rect of the tapped tile or card: the box grows from / shrinks to it. */
  origin?: OriginRect | null;
  /** "grow" for tiles (icon morph, no flip), "flip" for cards. */
  motion?: "grow" | "flip";
  /** Rect of the tile's icon: the header icon travels from / back to it. */
  iconOrigin?: OriginRect | null;
  /** Called after the shrink animation finishes. */
  onDismiss: () => void;
  actions?: ActionSheetAction[];
  /** "sheet" docks to the bottom (option lists); "card" centers (items, popups). */
  placement?: "sheet" | "card";
  wide?: boolean;
  children?: ReactNode;
};

export function ActionSheetCard({ accent, kicker, title, icon, logo = null, label, origin = null, motion = "flip", iconOrigin = null, onDismiss, actions = [], placement = "card", wide = false, children }: ActionSheetCardProps) {
  const box = useRef<HTMLDivElement | null>(null);
  const iconEl = useRef<HTMLSpanElement | null>(null);
  const closing = useRef(false);
  const drag = useRef<{ y: number; dy: number; id: number } | null>(null);
  const dismiss = (fromY = 0) => {
    if (closing.current) return;
    closing.current = true;
    const out = motion === "grow" ? growOut(box.current, origin, iconEl.current, iconOrigin, fromY) : flipOut(box.current, origin, fromY);
    void out.then(onDismiss);
  };
  useLayoutEffect(() => {
    if (motion === "grow") growIn(box.current, origin, iconEl.current, iconOrigin);
    else flipIn(box.current, origin);
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); dismiss(); } };
    window.addEventListener("keydown", k, true);
    box.current?.querySelector<HTMLElement>("button, a[href], textarea")?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", k, true);
  }, []);
  return (
    <div className={`zas-scrim zas-scrim--${placement}`} onClick={e => { if (e.target === e.currentTarget) dismiss(); }}>
      <div ref={box} className={`zas zas--${placement}${wide ? " zas--wide" : ""}`} role="dialog" aria-modal="true" aria-label={label}
        style={{ "--tile": accent } as CSSProperties}
        onPointerDown={e => {
          if ((e.target as HTMLElement).closest("a,button,input,textarea,select,.zas-scroll")) return;
          drag.current = { y: e.clientY, dy: 0, id: e.pointerId };
        }}
        onPointerMove={e => {
          const d = drag.current; if (!d || d.id !== e.pointerId) return;
          d.dy = Math.max(0, e.clientY - d.y);
          if (box.current) box.current.style.translate = `0 ${d.dy}px`;
        }}
        onPointerUp={e => {
          const d = drag.current; drag.current = null; if (!d || d.id !== e.pointerId) return;
          if (d.dy > 90) dismiss(d.dy);
          else if (box.current) { box.current.style.transition = "translate .2s"; box.current.style.translate = ""; window.setTimeout(() => { if (box.current) box.current.style.transition = ""; }, 220); }
        }}>
        {placement === "sheet" ? <span className="zas-grab" aria-hidden="true" /> : null}
        <button type="button" className="zas-x" aria-label="Close" data-action="close" onClick={() => dismiss()}>✕</button>
        {logo ? <div className="zcard-logo-row"><CardLogoMark logo={logo} /></div> : null}
        <header className="zas-head">
          {icon ? <span ref={iconEl} className="zas-icon" aria-hidden="true">{icon}</span> : null}
          <p className="zas-kicker">{kicker}{title ? <span>{title}</span> : null}</p>
        </header>
        {children}
        {actions.length ? (
          <div className="zas-acts">
            {actions.map(a => a.href ? (
              <a key={a.label} data-action={a.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className={`obtn zas-act${a.primary ? " obtn--accent" : ""}`} href={a.href}
                target={a.external ? "_blank" : undefined} rel={a.external ? "noreferrer" : undefined}
                onClick={() => { a.onClick?.(); if (!a.external) return; window.setTimeout(() => dismiss(), 0); }}>
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
    </div>
  );
}

export default ActionSheetCard;
