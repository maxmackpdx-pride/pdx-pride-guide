import { afterzVibeLabel } from "@shared/afterzWindow";
import { readableStatus, type Gathering } from "./AfterzInvitations";

export type AfterzListing = Gathering & { eventTitle?: string; vibe?: string; poster?: string | null };

export default function AfterzNightCard({ night, busy, open, respond, select }: {
  night: AfterzListing;
  busy: boolean;
  open: boolean;
  respond: (yes: boolean) => void;
  select: () => void;
}) {
  const { role } = night;
  const yes = role === "accepted" || role === "pending" || role === "waitlisted";
  const canRespond = role !== "host" && role !== "declined" && role !== "revoked";
  return <article className="afterz-night" aria-label={night.title}>
    {night.poster && <img className="afterz-night__poster" src={night.poster} loading="lazy" alt=""/>}
    <button type="button" className="afterz-night__details" onClick={select} aria-label={`Open ${night.title}`}>
      <span className="afterz-night__label">
        <small>{night.vibe ? afterzVibeLabel(night.vibe) : "Private invite"}</small>
        <strong>Hosted by {night.hostName}</strong>
        <span>{night.title}{night.eventTitle && ` · After ${night.eventTitle}`}</span>
      </span>
    </button>
    <div className="afterz-night__response">
      {role !== "guest" && <span>{readableStatus[role]}</span>}
      {canRespond && <div role="group" aria-label={`RSVP to ${night.title}`}>
        <button type="button" aria-pressed={yes} disabled={busy || (!open && !yes)} onClick={() => respond(true)}>Yes</button>
        <button type="button" aria-pressed={role === "passed"} disabled={busy} onClick={() => respond(false)}>No</button>
      </div>}
    </div>
  </article>;
}
