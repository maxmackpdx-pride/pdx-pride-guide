import { useMemo, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { zaylistApi, type MyZaylistEntry } from "@/lib/zaylistApi";
import InvitePopup from "./InvitePopup";

/**
 * Global host for the "You've been invited" pop-up.
 *
 * Surfaces the decisions that are already waiting on the signed-in user in
 * the real invite systems, one pop-up at a time:
 *   - comp spots:      GET /api/me/zaylist (entries still "pending")
 *   - Hoüz asks:       GET /api/housing/mine -> GET /api/housing/:id/requests
 *                      (JOIN / CHAT / WAITLIST asks on houses I lead)
 *   - buddy co-hosts:  GET /api/hub/workspace -> GET /api/outz/buddies/event/:id
 *                      (pending co-host asks on outings I host)
 * Actions call the same endpoints the Hub / inbox / event surfaces use.
 * "Later" (the ✕) snoozes that one invite for this session only.
 * Afterz invites surface in the Afterz drawer itself (AfterzInviteFace),
 * where the night and its 18+ gate already live.
 */

type HousingPost = {
  id: number;
  displayName: string;
  headline: string;
  photos: string[];
  status: string;
};
type HousingRequest = {
  id: number;
  kind: string;
  note: string | null;
  person: { displayName: string; username: string; photoUrl: string | null };
};
type BuddyDetails = {
  host: boolean;
  ended: boolean;
  requests: { id: number; username: string }[];
} | null;

type Item =
  | { kind: "comp"; key: string; entry: MyZaylistEntry }
  | { kind: "houz"; key: string; post: HousingPost; request: HousingRequest }
  | {
      kind: "buddy";
      key: string;
      eventId: number;
      eventTitle: string;
      request: { id: number; username: string };
    };

const SNOOZE_KEY = "invpop-snoozed";
function readSnoozed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SNOOZE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function read<T>(url: string) {
  return apiRequest("GET", url).then((r) => r.json() as Promise<T>);
}

export default function InvitePopupHost() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [snoozed, setSnoozed] = useState<Set<string>>(readSnoozed);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const mine = useQuery({
    queryKey: ["/api/me/zaylist", user?.id],
    queryFn: () => zaylistApi.mine(),
    enabled: !!user,
    staleTime: 30_000,
  });
  const housingMine = useQuery({
    queryKey: ["/api/housing/mine", user?.id],
    queryFn: () => read<{ posts: HousingPost[] }>("/api/housing/mine"),
    enabled: !!user,
    staleTime: 30_000,
  });
  const posts = useMemo(
    () => (housingMine.data?.posts ?? []).filter((p) => p.status === "ACTIVE").slice(0, 10),
    [housingMine.data],
  );
  const housingReqs = useQueries({
    queries: posts.map((post) => ({
      queryKey: ["/api/housing/requests", post.id],
      queryFn: () =>
        read<{ requests: HousingRequest[] }>(`/api/housing/${post.id}/requests`),
      enabled: !!user,
      staleTime: 30_000,
    })),
  });
  const workspace = useQuery({
    queryKey: ["/api/hub/workspace", user?.id],
    queryFn: () => read<{ events: { id: number; title: string }[] }>("/api/hub/workspace"),
    enabled: !!user,
    staleTime: 30_000,
  });
  const hostedEvents = useMemo(
    () => (workspace.data?.events ?? []).slice(0, 12),
    [workspace.data],
  );
  const buddyDetails = useQueries({
    queries: hostedEvents.map((event) => ({
      queryKey: ["/api/outz/buddies/event", event.id],
      queryFn: () => read<BuddyDetails>(`/api/outz/buddies/event/${event.id}`),
      enabled: !!user,
      staleTime: 30_000,
    })),
  });

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const entry of mine.data?.entries ?? []) {
      if (entry.state === "pending")
        out.push({ kind: "comp", key: `comp-${entry.id}`, entry });
    }
    posts.forEach((post, i) => {
      for (const request of housingReqs[i]?.data?.requests ?? [])
        out.push({ kind: "houz", key: `houz-${request.id}`, post, request });
    });
    hostedEvents.forEach((event, i) => {
      const details = buddyDetails[i]?.data;
      if (details?.host && !details.ended)
        for (const request of details.requests)
          out.push({
            kind: "buddy",
            key: `buddy-${event.id}-${request.id}`,
            eventId: event.id,
            eventTitle: event.title,
            request,
          });
    });
    return out;
  }, [mine.data, posts, housingReqs, hostedEvents, buddyDetails]);

  const visible = items.filter((i) => !snoozed.has(i.key) && !done.has(i.key));
  const current = visible[0];

  if (!user || !current) return null;

  const snooze = (key: string) => {
    setError("");
    setSnoozed((prev) => {
      const next = new Set(prev).add(key);
      try {
        sessionStorage.setItem(SNOOZE_KEY, JSON.stringify([...next]));
      } catch {
        /* session only */
      }
      return next;
    });
  };
  const finish = (key: string) => {
    setDone((prev) => new Set(prev).add(key));
    setError("");
  };
  const act = async (fn: () => Promise<unknown>, after: () => void) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      after();
      finish(current.key);
    } catch (e) {
      setError(parseApiError(e, "That didn't go through. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const actions = (primary: string, onPrimary: () => void, secondary: string, onSecondary: () => void) => (
    <>
      {error ? <p className="inv-pop-error" role="alert">{error}</p> : null}
      <div className="inv-pop-actions">
        <button type="button" className="inv-pop-btn inv-pop-btn-primary" disabled={busy} onClick={onPrimary}>
          {primary}
        </button>
        <button type="button" className="inv-pop-btn inv-pop-btn-ghost" disabled={busy} onClick={onSecondary}>
          {secondary}
        </button>
      </div>
    </>
  );

  let face: React.ReactNode = null;
  if (current.kind === "comp") {
    const entry = current.entry;
    const from =
      entry.source === "draw"
        ? "Your name came up in the draw."
        : entry.source === "invite"
          ? "Someone put your name on the list."
          : "A host put your name on the list.";
    face = (
      <InvitePopup
        variant="comp"
        title={entry.eventTitle}
        fromLine={from}
        hook="Your spot is held while it's pending. Accept to get your pass."
        onClose={() => snooze(current.key)}
        closeLabel="Later"
      >
        {actions(
          "Accept spot",
          () =>
            void act(
              () => zaylistApi.accept(entry.id),
              () => void client.invalidateQueries({ queryKey: ["/api/me/zaylist"] }),
            ),
          "Pass",
          () =>
            void act(
              () => zaylistApi.decline(entry.id),
              () => void client.invalidateQueries({ queryKey: ["/api/me/zaylist"] }),
            ),
        )}
      </InvitePopup>
    );
  } else if (current.kind === "houz") {
    const { post, request } = current;
    const kicker =
      request.kind === "JOIN"
        ? "Wants to join your house"
        : request.kind === "WAITLIST"
          ? "Asking for the waitlist"
          : "Wants to chat";
    const hook =
      request.note ||
      (request.kind === "JOIN"
        ? "They asked to join your house. Saying yes adds them as a member."
        : request.kind === "WAITLIST"
          ? "They asked for a place on the waitlist."
          : "They asked to chat about your place.");
    face = (
      <InvitePopup
        variant="houz"
        kicker={kicker}
        title={post.displayName || post.headline || "Your house"}
        imageUrl={post.photos?.[0] ?? null}
        fromLine={
          <>
            <strong>{request.person.displayName}</strong> @{request.person.username}
          </>
        }
        hook={hook}
        onClose={() => snooze(current.key)}
        closeLabel="Later"
      >
        {actions(
          request.kind === "CHAT" ? "Start the chat" : "Say yes",
          () =>
            void act(
              () => apiRequest("POST", `/api/housing/requests/${request.id}/accept`, {}),
              () =>
                void client.invalidateQueries({
                  queryKey: ["/api/housing/requests", post.id],
                }),
            ),
          "Not this time",
          () =>
            void act(
              () => apiRequest("POST", `/api/housing/requests/${request.id}/decline`, {}),
              () =>
                void client.invalidateQueries({
                  queryKey: ["/api/housing/requests", post.id],
                }),
            ),
        )}
      </InvitePopup>
    );
  } else {
    const { eventId, eventTitle, request } = current;
    face = (
      <InvitePopup
        variant="buddy"
        kicker="Co-host request"
        title={eventTitle}
        fromLine={
          <>
            <strong>@{request.username}</strong> asked to co-host this outing.
          </>
        }
        hook="Approve and they'll help run it."
        onClose={() => snooze(current.key)}
        closeLabel="Later"
      >
        {actions(
          "Approve",
          () =>
            void act(
              () =>
                apiRequest("POST", `/api/outz/buddies/event/${eventId}/cohost`, {
                  action: "approve",
                  userId: request.id,
                }),
              () =>
                void client.invalidateQueries({
                  queryKey: ["/api/outz/buddies/event", eventId],
                }),
            ),
          "Decline",
          () =>
            void act(
              () =>
                apiRequest("POST", `/api/outz/buddies/event/${eventId}/cohost`, {
                  action: "decline",
                  userId: request.id,
                }),
              () =>
                void client.invalidateQueries({
                  queryKey: ["/api/outz/buddies/event", eventId],
                }),
            ),
        )}
      </InvitePopup>
    );
  }

  return (
    <div className="inv-host" role="dialog" aria-label="Invitations waiting for you">
      <div className="inv-host-stack">
        {face}
        {visible.length > 1 ? (
          <span className="inv-host-count">
            Invite 1 of {visible.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
