import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import "./invite-popup.css";

/**
 * Sender-side pop-ups in the same family as the recipient invite face.
 * A host invites the people around the night, two ways:
 *
 *   ASK    — "Invite those around me to ASK to be invited": share the
 *            gathering's invite link (anyone with it lands on the ask
 *            face), and/or message people the event invite — accepting
 *            the night still goes through the host, as Afterz works.
 *   DIRECT — "Just invite those around me": add picked people straight
 *            onto the event's Zay'list (POST /api/zaylist/events/:id/entries).
 *            Their spot lands as a pending comp invite — the recipient
 *            pop-up in this same family.
 *
 * The invite-friends option rides on BOTH modes: the friends list
 * (people you follow) is pickable in each, next to the people around
 * the event.
 *
 * "Around me" is built only from surfaces that exist today: the event's
 * attendance list (people going to this event) and your friends.
 * Production has no live nearby-people feed; nothing here invents one.
 */

type Person = {
  username: string;
  displayName: string;
  userId?: number;
  source: "event" | "friend";
};
type Attendee = {
  userId?: number;
  handle: string;
  displayName?: string | null;
  masked?: boolean;
};
type Friend = { username: string; displayName?: string | null };

function read<T>(url: string) {
  return apiRequest("GET", url).then((r) => r.json() as Promise<T>);
}

export default function AroundInvitePopup({
  gatheringId,
  eventId,
  title,
  onClose,
}: {
  gatheringId: string;
  eventId: number;
  title: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"ask" | "direct">("ask");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const attendees = useQuery({
    queryKey: ["/api/events", eventId, "attendance", "around-invite"],
    queryFn: () => read<Attendee[]>(`/api/events/${eventId}/attendance`),
    staleTime: 30_000,
  });
  const friends = useQuery({
    queryKey: ["/api/users/me/people/following", "around-invite"],
    queryFn: () => read<{ people: Friend[] }>("/api/users/me/people/following"),
    staleTime: 30_000,
  });

  const people = useMemo(() => {
    const self = user?.username?.toLowerCase();
    const seen = new Set<string>();
    const out: Person[] = [];
    const push = (p: Person) => {
      const key = p.username.toLowerCase();
      if (!p.username || key === self || seen.has(key)) return;
      seen.add(key);
      out.push(p);
    };
    for (const a of attendees.data ?? [])
      if (!a.masked)
        push({
          username: a.handle,
          displayName: a.displayName || a.handle,
          userId: a.userId,
          source: "event",
        });
    for (const f of friends.data?.people ?? [])
      push({
        username: f.username,
        displayName: f.displayName || f.username,
        source: "friend",
      });
    return out;
  }, [attendees.data, friends.data, user?.username]);
  const atEvent = people.filter((p) => p.source === "event");
  const friendList = people.filter((p) => p.source === "friend");

  const toggle = (username: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });

  const shareLink = async () => {
    const url = new URL("/map", window.location.origin);
    url.search = new URLSearchParams({ mode: "afterz", gathering: gatheringId }).toString();
    try {
      if (navigator.share) await navigator.share({ title, url: url.href });
      else {
        await navigator.clipboard.writeText(url.href);
        setNotice("Invite link copied. Anyone with it can ask to be invited.");
      }
    } catch {
      setLink(url.href);
    }
  };

  const send = async () => {
    const targets = people.filter((p) => picked.has(p.username));
    if (!targets.length || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    let sent = 0;
    let firstError = "";
    for (const person of targets) {
      try {
        if (mode === "ask") {
          await apiRequest("POST", `/api/users/${encodeURIComponent(person.username)}/message`, {
            eventId,
          });
        } else if (person.userId) {
          await apiRequest("POST", `/api/zaylist/events/${eventId}/entries`, {
            userId: person.userId,
          });
        } else {
          await apiRequest("POST", `/api/zaylist/events/${eventId}/entries`, {
            contact: person.username,
          });
        }
        sent += 1;
      } catch (e) {
        if (!firstError) firstError = parseApiError(e, "Could not invite " + person.username);
      }
    }
    setBusy(false);
    if (sent) {
      setNotice(
        mode === "ask"
          ? `Sent to ${sent} ${sent === 1 ? "person" : "people"}. They can ask to be invited from there.`
          : `Added ${sent} ${sent === 1 ? "person" : "people"} to the list. Their invite is waiting in their pop-ups.`,
      );
      setPicked(new Set());
    }
    if (firstError) setError(firstError);
  };

  const personRow = (p: Person) => (
    <label key={p.username} className="inv-around-person">
      <input
        type="checkbox"
        checked={picked.has(p.username)}
        onChange={() => toggle(p.username)}
      />
      <span>
        {p.displayName} <small>@{p.username}</small>
      </span>
    </label>
  );

  const style = {
    "--inv-accent": "var(--yellow)",
    "--c": "var(--yellow)",
  } as CSSProperties;

  return (
    <div
      className="inv-around-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="inv-around pdx-glass-card" style={style} role="dialog" aria-label="Invite people around you">
        <div className="inv-around-body">
          <p className="inv-pop-kicker">Afterz · {title}</p>
          <h3 className="inv-pop-title" style={{ fontSize: 24 }}>
            Invite people around you
          </h3>
          <div className="inv-around-modes" role="group" aria-label="How to invite">
            <button type="button" aria-pressed={mode === "ask"} onClick={() => setMode("ask")}>
              Ask to be invited
            </button>
            <button type="button" aria-pressed={mode === "direct"} onClick={() => setMode("direct")}>
              Just invite
            </button>
          </div>
          <p className="inv-pop-note">
            {mode === "ask"
              ? "They get the invite and ask. You still say yes or no, like every Afterz."
              : "They go straight onto the event's list. No asking — their spot waits for them to accept."}
          </p>
          {mode === "ask" ? (
            <div className="inv-around-share">
              <span>Anyone with the invite link can ask to be invited.</span>
              <button type="button" onClick={() => void shareLink()}>
                Share link
              </button>
            </div>
          ) : null}
          {link ? <p className="inv-pop-note">{link}</p> : null}
          {atEvent.length ? (
            <>
              <h4>Around you at this event</h4>
              <div className="inv-around-people">{atEvent.map(personRow)}</div>
            </>
          ) : null}
          {friendList.length ? (
            <>
              <h4>Invite friends</h4>
              <div className="inv-around-people">{friendList.map(personRow)}</div>
            </>
          ) : null}
          {!atEvent.length && !friendList.length ? (
            <p className="inv-pop-note">
              {attendees.isPending || friends.isPending
                ? "Loading people…"
                : "No one to show yet — no one is on this event's list and your friends list is empty."}
            </p>
          ) : null}
          {error ? <p className="inv-pop-error" role="alert">{error}</p> : null}
          {notice ? <p className="inv-pop-note" role="status">{notice}</p> : null}
          <div className="inv-pop-actions">
            <button
              type="button"
              className="inv-pop-btn inv-pop-btn-primary"
              disabled={busy || !picked.size}
              onClick={() => void send()}
            >
              {mode === "ask"
                ? `Send invites${picked.size ? ` (${picked.size})` : ""}`
                : `Add to the list${picked.size ? ` (${picked.size})` : ""}`}
            </button>
            <button type="button" className="inv-pop-btn inv-pop-btn-ghost" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
        <div className="inv-pop-tab">
          <span>Afterz</span>
          <small>{mode === "ask" ? "Ask to be invited" : "Just invite"}</small>
        </div>
      </div>
    </div>
  );
}
