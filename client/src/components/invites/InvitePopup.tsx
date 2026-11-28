import type { CSSProperties, ReactNode } from "react";
import "./invite-popup.css";

/**
 * The "You've been invited" pop-up face — one family for every invite kind.
 * Vertical glass card, hook line, face actions, and a fixed tab/slab across
 * the bottom in the invite's token color:
 *   afterz → --yellow, comp/buddy → --neon-orange, houz → --neon-magenta.
 * Presentational only; the plumbing lives in InvitePopupHost,
 * AfterzInviteFace and AroundInvitePopup.
 */
export type InviteVariant = "afterz" | "comp" | "buddy" | "houz";

const ACCENT: Record<InviteVariant, string> = {
  afterz: "var(--yellow)",
  comp: "var(--neon-orange)",
  buddy: "var(--neon-orange)",
  houz: "var(--neon-magenta)",
};

export const INVITE_TAB: Record<InviteVariant, string> = {
  afterz: "Afterz",
  comp: "You're on the list",
  buddy: "Outzide · Buddies",
  houz: "Hoüz",
};

export default function InvitePopup(props: {
  variant: InviteVariant;
  kicker?: string;
  title: string;
  fromLine?: ReactNode;
  hook?: string;
  imageUrl?: string | null;
  tabLabel?: string;
  tabNote?: string;
  onClose?: () => void;
  closeLabel?: string;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  const accent = ACCENT[props.variant];
  const style = {
    "--inv-accent": accent,
    "--c": accent,
  } as CSSProperties;
  return (
    <article className="inv-pop pdx-glass-card" style={style} aria-label={props.title}>
      {props.imageUrl ? (
        <img className="inv-pop-art" src={props.imageUrl} alt="" loading="lazy" />
      ) : null}
      {props.onClose ? (
        <button
          type="button"
          className="inv-pop-close"
          aria-label={props.closeLabel ?? "Not now"}
          onClick={props.onClose}
        >
          ✕
        </button>
      ) : null}
      <div className="inv-pop-body">
        <p className="inv-pop-kicker">{props.kicker ?? "You've been invited"}</p>
        <h3 className="inv-pop-title">{props.title}</h3>
        {props.fromLine ? <p className="inv-pop-from">{props.fromLine}</p> : null}
        {props.hook ? <p className="inv-pop-hook">{props.hook}</p> : null}
        {props.children}
      </div>
      {props.footer ? <div className="inv-pop-footer">{props.footer}</div> : null}
      <div className="inv-pop-tab">
        <span>{props.tabLabel ?? INVITE_TAB[props.variant]}</span>
        {props.tabNote ? <small>{props.tabNote}</small> : null}
      </div>
    </article>
  );
}
