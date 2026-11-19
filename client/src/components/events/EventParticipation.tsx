import { useState } from "react";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { useSavedEvents } from "@/hooks/useSavedEvents";

type ReadQuery = { isPending: boolean; isError: boolean; error: unknown; refetch: () => Promise<unknown> };

export function EventReadStatus({ label, query }: { label: string; query: ReadQuery }) {
  if (query.isPending) return <p role="status">Loading {label.toLowerCase()}…</p>;
  const restricted = query.error instanceof Error && /^(401|403):/.test(query.error.message);
  return <p role="status">{restricted ? `${label} are restricted for this account.` : `${label} are unavailable.`}{" "}
    {!restricted && <button type="button" onClick={() => void query.refetch()}>Try again</button>}
  </p>;
}

export function EventPrivateSaveButton({ eventId, poster = false }: { eventId: number; poster?: boolean }) {
  const { user } = useAuth();
  const saves = useSavedEvents();
  const [auth, setAuth] = useState(false);
  const saved = saves.savedIds.has(eventId);
  return <>
    <button type="button" className={poster ? "osave" : "evz-x__savet"} aria-pressed={saved}
      disabled={saves.loading || saves.pending} onClick={() => !user ? setAuth(true) : saves.error ? void saves.retry() : saves.toggleSave(eventId)}>
      {saves.pending ? "Saving…" : saves.error ? "Retry private saves" : saved ? "Saved privately · Remove" : "Save privately to My Schedule"}
    </button>
    {auth && <AuthModal onClose={() => setAuth(false)} />}
  </>;
}

export function EventGoingButton({ eventId, past, poster = false }: { eventId: number; past: boolean; poster?: boolean }) {
  const rsvp = useEventRsvp();
  const going = rsvp.myEventIds.has(eventId);
  const pending = rsvp.isRsvpPending(eventId);
  if (eventId <= 0) return null;
  return <>
    <button type="button" className={poster ? "ointerested" : "evz-x__act"} aria-pressed={going}
      disabled={pending || rsvp.loading} onClick={() => rsvp.error ? void rsvp.retry() : rsvp.toggleRsvp(eventId)}>
      <span className="evz-x__act-main">
        <strong className="evz-x__act-t">{pending ? "Updating…" : rsvp.error ? "Retry attendance" : going ? "Remove my attendance" : past ? "I went · Public" : "Going · Public"}</strong>
        <small className="evz-x__act-s">{going ? "Removing attendance keeps your event follow." : "Shows your name and follows event updates."}</small>
      </span>
    </button>
    {rsvp.showAuth && <AuthModal onClose={() => rsvp.setShowAuth(false)} />}
  </>;
}
