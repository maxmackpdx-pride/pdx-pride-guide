import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserAvatar from "@/components/UserAvatar";
import { memberProfileHref } from "@/lib/avatarLinks";
import AdultContentGate from "@/components/AdultContentGate";
import { isValidBeachId, pacificTodayDate } from "@shared/riverBrats";
import type { NudeBeachTab } from "@shared/nudeBeaches";
import { C } from "./panel/sheet";

export type InboxGroupChatTarget = {
  kind: "EVENT" | "BEACH";
  id: number | string;
  title: string;
  state?: "BEFORE" | "OPEN" | "CLOSED";
  opensAt?: string | null;
  closesAt?: string | null;
  href?: string;
};

type ChatMessage = {
  id: number;
  body: string;
  createdAt: string;
  isAnonymous: boolean;
  isMine?: boolean;
  displayName?: string;
  username?: string;
  photoUrl?: string | null;
  avatarChoice?: number | null;
  avatarRing?: string | null;
};

type EventChatPayload = {
  messages: ChatMessage[];
  expiresAt: string | null;
  chatOpen: boolean;
  opensAt?: string | null;
  windowState?: "BEFORE" | "OPEN" | "CLOSED";
  isHost?: boolean;
  pinned?: { id: number; body: string } | null;
};

type BeachChatPayload = {
  messages: ChatMessage[];
  expiresAt: string | null;
  chatOpen: boolean;
};

function formatCountdown(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Chat closed";
  const totalMin = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function formatOpensAt(opensAt: string | null | undefined): string | null {
  if (!opensAt) return null;
  const d = new Date(opensAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
}

type Props = {
  target: InboxGroupChatTarget;
  onBack: () => void;
};

/**
 * Event / beach day-room chat rendered inside the floating inbox sheet
 * (same chrome as ThreadDetail — no full-page navigation, no off-screen drawer).
 */
export default function InboxGroupChat({ target, onBack }: Props) {
  const [body, setBody] = useState("");
  const [tick, setTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const isEvent = target.kind === "EVENT";
  const eventId = isEvent ? Number(target.id) : null;
  const beachId = !isEvent && isValidBeachId(String(target.id)) ? (String(target.id) as NudeBeachTab) : null;
  const beachDate = pacificTodayDate();

  const eventQuery = useQuery<EventChatPayload>({
    queryKey: ["/api/events", eventId, "chat"],
    queryFn: () => apiRequest("GET", `/api/events/${eventId}/chat`).then(r => r.json()),
    refetchInterval: 8_000,
    enabled: isEvent && eventId != null && Number.isFinite(eventId),
  });

  const beachQuery = useQuery<BeachChatPayload>({
    queryKey: ["/api/river-brats/checkins/chat", beachId, beachDate],
    queryFn: () =>
      apiRequest("GET", `/api/river-brats/checkins/chat?beach=${beachId}&date=${beachDate}`).then(r => r.json()),
    refetchInterval: 8_000,
    enabled: Boolean(beachId),
  });

  const data = isEvent ? eventQuery.data : beachQuery.data;
  const isLoading = isEvent ? eventQuery.isLoading : beachQuery.isLoading;
  const messages = data?.messages ?? [];
  const expiresAt = data?.expiresAt ?? target.closesAt ?? null;
  const chatOpen = Boolean(data?.chatOpen);
  const windowState =
    isEvent
      ? (eventQuery.data?.windowState ?? (chatOpen ? "OPEN" : "CLOSED"))
      : chatOpen
        ? "OPEN"
        : "CLOSED";
  const pinned = isEvent ? eventQuery.data?.pinned ?? null : null;
  const isHost = isEvent ? Boolean(eventQuery.data?.isHost) : false;
  const countdown = useMemo(() => formatCountdown(expiresAt), [expiresAt, tick]);
  const opensAtLabel = formatOpensAt(isEvent ? eventQuery.data?.opensAt ?? target.opensAt : null);

  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const postMutation = useMutation({
    mutationFn: (text: string) => {
      if (isEvent && eventId != null) {
        return apiRequest("POST", `/api/events/${eventId}/chat`, { body: text });
      }
      return apiRequest("POST", "/api/river-brats/checkins/chat", {
        beachId,
        date: beachDate,
        body: text,
      });
    },
    onSuccess: () => {
      setBody("");
      if (isEvent && eventId != null) {
        queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "chat"] });
      } else if (beachId) {
        queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins/chat", beachId, beachDate] });
      }
    },
  });

  const metaLine = isEvent
    ? windowState === "BEFORE"
      ? opensAtLabel
        ? `Opens ${opensAtLabel}`
        : "Opens 48h before doors"
      : windowState === "OPEN"
        ? countdown ?? "Open now"
        : "Chat closed"
    : countdown ?? (chatOpen ? "Open until 10pm" : "Chat closed or locked");

  const emptyCopy = isEvent
    ? windowState === "BEFORE"
      ? "You're on the list. The room opens 48 hours before doors."
      : windowState === "OPEN"
        ? "You're checked in. Say hi. Everyone going can see this."
        : "This chat has closed."
    : chatOpen
      ? "You're checked in. Say hi. Others heading out can see this until 10pm."
      : "Check in on the beach page to unlock this room (visible check-in only).";

  const badge = isEvent ? "EVENT GROUP" : "RIVER BRATS";
  const badgeColor = isEvent ? C.cyan : C.green;

  return (
    <div className="inbox-group-chat" data-testid="inbox-group-chat">
      <header className="inbox-group-chat__head">
        <button type="button" className="inbox-group-chat__back" onClick={onBack} aria-label="Back to inbox">
          <ChevronLeft size={20} />
        </button>
        <div className="inbox-group-chat__titles">
          <div className="inbox-group-chat__title-row">
            <span className="inbox-group-chat__title">{target.title}</span>
            {windowState === "OPEN" && <span className="inbox-group-chat__live-dot" aria-hidden />}
          </div>
          <div className="inbox-group-chat__meta">
            <span className="inbox-group-chat__badge" style={{ background: badgeColor }}>
              {badge}
            </span>
            <span>{metaLine}</span>
          </div>
        </div>
      </header>

      <AdultContentGate onDecline={onBack}>
        {pinned && (
          <div className="inbox-group-chat__pin">
            <span className="inbox-group-chat__pin-label">Pinned · host</span>
            <p className="inbox-group-chat__pin-body">{pinned.body}</p>
          </div>
        )}

        {isHost && (
          <p className="inbox-group-chat__host-hint">Host tools live on the event page. Chat with the room here.</p>
        )}

        <div className="inbox-group-chat__messages" ref={listRef}>
          {isLoading && <p className="inbox-group-chat__empty">Loading chat…</p>}
          {!isLoading && messages.length === 0 && <p className="inbox-group-chat__empty">{emptyCopy}</p>}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`inbox-group-chat__msg${msg.isMine ? " inbox-group-chat__msg--mine" : ""}`}
            >
              {!msg.isMine && (
                <UserAvatar
                  username={msg.username}
                  displayName={msg.isAnonymous ? undefined : msg.displayName}
                  photoUrl={msg.photoUrl}
                  avatarChoice={msg.avatarChoice ?? undefined}
                  avatarRing={msg.avatarRing}
                  href={msg.isAnonymous ? null : memberProfileHref(msg.username)}
                  size={28}
                />
              )}
              <div className="inbox-group-chat__bubble">
                {!msg.isMine && (
                  <span className="inbox-group-chat__author">
                    {msg.isAnonymous ? "Anonymous" : `@${msg.username || msg.displayName}`}
                  </span>
                )}
                <p>{msg.body}</p>
              </div>
            </div>
          ))}
        </div>

        <footer className="inbox-group-chat__composer">
          <input
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (body.trim() && chatOpen) postMutation.mutate(body.trim());
              }
            }}
            placeholder={
              chatOpen
                ? "Message the group…"
                : windowState === "BEFORE"
                  ? "Chat hasn't opened yet"
                  : "Chat closed or locked"
            }
            disabled={!chatOpen || postMutation.isPending}
            maxLength={500}
            data-testid="inbox-group-chat-input"
          />
          <button
            type="button"
            className="inbox-group-chat__send"
            disabled={!chatOpen || !body.trim() || postMutation.isPending}
            onClick={() => postMutation.mutate(body.trim())}
            data-testid="inbox-group-chat-send"
          >
            Send
          </button>
        </footer>
      </AdultContentGate>
    </div>
  );
}
