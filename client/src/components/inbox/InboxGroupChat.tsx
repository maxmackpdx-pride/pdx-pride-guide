import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserAvatar from "@/components/UserAvatar";
import { memberProfileHref } from "@/lib/avatarLinks";
import AdultContentGate from "@/components/AdultContentGate";
import {
  formatClosesIn,
  formatOpensAtWall,
  formatOpensIn,
} from "@/lib/chatCountdown";
import { isValidBeachId, pacificTodayDate } from "@shared/riverBrats";
import type { NudeBeachTab } from "@shared/nudeBeaches";

export type InboxGroupChatTarget = {
  kind: "EVENT" | "BEACH";
  id: number | string;
  title: string;
  state?: "BEFORE" | "OPEN" | "CLOSED";
  opensAt?: string | null;
  closesAt?: string | null;
  href?: string;
  calendarDate?: string;
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
  opensAt?: string | null;
  chatOpen: boolean;
};

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
  const beachDate = target.calendarDate || pacificTodayDate();

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
  const opensAt =
    (isEvent ? eventQuery.data?.opensAt : beachQuery.data?.opensAt) ?? target.opensAt ?? null;
  const chatOpen = Boolean(data?.chatOpen);
  const windowState: "BEFORE" | "OPEN" | "CLOSED" = (() => {
    if (isEvent) {
      return eventQuery.data?.windowState
        ?? target.state
        ?? (chatOpen ? "OPEN" : "CLOSED");
    }
    if (chatOpen) return "OPEN";
    if (opensAt && Date.now() < new Date(opensAt).getTime()) return "BEFORE";
    if (target.state === "BEFORE") return "BEFORE";
    return "CLOSED";
  })();
  const pinned = isEvent ? eventQuery.data?.pinned ?? null : null;
  const isHost = isEvent ? Boolean(eventQuery.data?.isHost) : false;
  // tick forces re-render for live countdown
  void tick;
  const now = Date.now();
  const opensIn = formatOpensIn(opensAt, now);
  const closesIn = formatClosesIn(expiresAt, now);
  const opensWall = formatOpensAtWall(opensAt);

  useEffect(() => {
    // 1s while waiting to open (fun countdown); slower while open.
    const ms = windowState === "BEFORE" ? 1000 : 30_000;
    const id = window.setInterval(() => setTick((t) => t + 1), ms);
    return () => window.clearInterval(id);
  }, [windowState]);

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

  const metaLine =
    windowState === "BEFORE"
      ? opensIn
        ? opensIn
        : opensWall
          ? `Opens ${opensWall}`
          : isEvent
            ? "Opens 48h before doors"
            : "Opens 48h before beach day"
      : windowState === "OPEN"
        ? closesIn ?? (isEvent ? "Open now" : "Open until 10pm")
        : isEvent
          ? "Chat closed"
          : "Chat closed or locked";

  const emptyCopy =
    windowState === "BEFORE"
      ? isEvent
        ? `You're on the list. Room opens 48 hours before doors${opensIn ? ` · ${opensIn}` : ""}.`
        : `You're checked in. Beach chat opens 48h early${opensIn ? ` · ${opensIn}` : ""}.`
      : windowState === "OPEN"
        ? isEvent
          ? "You're checked in. Say hi. Everyone going can see this."
          : "You're checked in. Say hi. Others heading out can see this until 10pm."
        : isEvent
          ? "This chat has closed."
          : "Check in on the beach page to unlock this room (visible check-in only).";

  const badge = isEvent ? "EVENT GROUP" : "RIVER BRATS";
  const accentStyle = { "--inbox-exp-accent": isEvent ? "#19e3ff" : "#39ff14" } as CSSProperties;
  const canSend = Boolean(body.trim() && chatOpen && !postMutation.isPending);

  return (
    <div
      className={`inbox-group-chat inbox-group-chat--${isEvent ? "event" : "beach"}`}
      data-testid="inbox-group-chat"
      style={accentStyle}
    >
      <header className="inbox-group-chat__head">
        <button type="button" className="inbox-exp-icon-btn" onClick={onBack} aria-label="Back to inbox" title="Back">
          <ChevronLeft size={18} />
        </button>
        <div className="inbox-group-chat__titles">
          <div className="inbox-group-chat__title-row">
            <span className="inbox-group-chat__title">{target.title}</span>
            {windowState === "OPEN" && <span className="inbox-exp-dot inbox-exp-dot--live" aria-hidden />}
          </div>
          <div className="inbox-group-chat__meta">
            <span className={`inbox-exp-tag inbox-group-chat__badge inbox-exp-tag--${isEvent ? "cyan" : "green"}`}>
              {badge}
            </span>
            <span
              className={`inbox-group-chat__meta-line${windowState === "BEFORE" ? " inbox-group-chat__meta-line--countdown" : ""}`}
              aria-live="polite"
            >
              {metaLine}
            </span>
          </div>
        </div>
      </header>

      {windowState === "BEFORE" && (
        <div className="inbox-group-chat__countdown" role="status" aria-live="polite">
          <span className="inbox-group-chat__countdown-label">Opens in</span>
          <span className="inbox-group-chat__countdown-value">
            {(opensIn || "soon").replace(/^Opens in\s+/i, "")}
          </span>
          {opensWall ? (
            <span className="inbox-group-chat__countdown-wall">{opensWall}</span>
          ) : null}
        </div>
      )}

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
              <div
                className={`inbox-group-chat__bubble inbox-exp-bubble${
                  msg.isMine ? " inbox-exp-bubble--self" : " inbox-exp-bubble--other"
                }`}
              >
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

        <footer className="inbox-group-chat__composer inbox-exp-composer">
          <input
            className="inbox-exp-composer__input"
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
            className={`inbox-exp-composer__send${canSend ? " is-ready" : ""}`}
            disabled={!canSend}
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
