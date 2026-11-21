import { type CSSProperties } from "react";
import { afterzVibeLabel } from "@shared/afterzWindow";
import "./AfterzDrawer.css";

export type AfterzNightView = {
  id: string;
  title: string;
  eventTitle?: string | null;
  hostName: string;
  vibe: string;
  poster?: string | null;
  role?: string | null;
};

/**
 * Wide, short Afterz card with a yellow bloom, the host name, the Afterz
 * type, and RSVP Yes / No buttons.
 */
export default function AfterzNightCard({
  night,
  windowOpen,
  busy = false,
  onYes,
  onNo,
}: {
  night: AfterzNightView;
  windowOpen: boolean;
  busy?: boolean;
  onYes: (id: string) => void;
  onNo: (id: string) => void;
}) {
  "use memo";
  const type = afterzVibeLabel(night.vibe);
  const going = night.role === "accepted" || night.role === "host" || night.role === "pending" || night.role === "waitlisted";
  const declined = night.role === "declined" || night.role === "revoked";
  const yesLabel = night.role === "host" ? "Hosting" : going ? (night.role === "accepted" ? "Going" : "Requested") : "Yes";
  return (
    <article
      className="afterz-wide-card pdx-glass-rebind"
      style={{ "--c": "var(--yellow)" } as CSSProperties}
      data-testid="afterz-night-card"
      data-afterz-id={night.id}
    >
      <div className="afterz-wide-card__art" aria-hidden="true">
        {night.poster ? <img src={night.poster} alt="" /> : null}
      </div>
      <div className="afterz-wide-card__body">
        <div className="afterz-wide-card__meta">
          <span className="afterz-wide-card__type">{type}</span>
          <strong className="afterz-wide-card__host">{night.hostName}</strong>
          <span className="afterz-wide-card__title">{night.title}{night.eventTitle ? ` · ${night.eventTitle}` : ""}</span>
        </div>
        {night.role === "host" ? (
          <p className="afterz-wide-card__title">You are hosting this Afterz.</p>
        ) : (
          <div className="afterz-rsvp" role="group" aria-label={`RSVP to ${night.title} hosted by ${night.hostName}`}>
            <button
              type="button"
              aria-pressed={going && !declined}
              disabled={busy || night.role === "host" || (!windowOpen && !going)}
              onClick={() => onYes(night.id)}
            >
              {yesLabel}
            </button>
            <button
              type="button"
              aria-pressed={declined}
              disabled={busy || night.role === "host" || (!windowOpen && !going)}
              onClick={() => onNo(night.id)}
            >
              No
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
