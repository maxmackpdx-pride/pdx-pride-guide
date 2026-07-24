import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserAvatar from "@/components/UserAvatar";
import { memberProfileHref } from "@/lib/avatarLinks";
import AdultContentGate from "@/components/AdultContentGate";

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

type PinnedMessage = {
  id: number;
  body: string;
  createdAt?: string;
  username?: string;
  displayName?: string | null;
};

type ChatPayload = {
  messages: ChatMessage[];
  expiresAt: string | null;
  chatOpen: boolean;
  opensAt?: string | null;
  windowState?: "BEFORE" | "OPEN" | "CLOSED";
  isHost?: boolean;
  pinned?: PinnedMessage | null;
};

function formatCountdown(expiresAt: string | null): string | null {
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
  eventId: number;
  onClose: () => void;
};

export default function EventChatPanel({ eventId, onClose }: Props) {
  const [body, setBody] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [tick, setTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<ChatPayload>({
    queryKey: ["/api/events", eventId, "chat"],
    queryFn: () => apiRequest("GET", `/api/events/${eventId}/chat`).then(r => r.json()),
    refetchInterval: 8_000,
  });

  const messages = data?.messages ?? [];
  const expiresAt = data?.expiresAt ?? null;
  const chatOpen = data?.chatOpen ?? false;
  const windowState = data?.windowState ?? (chatOpen ? "OPEN" : "CLOSED");
  const opensAtLabel = formatOpensAt(data?.opensAt);
  const isHost = Boolean(data?.isHost);
  const pinned = data?.pinned ?? null;
  const countdown = useMemo(() => formatCountdown(expiresAt), [expiresAt, tick]);

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
    mutationFn: (text: string) =>
      apiRequest("POST", `/api/events/${eventId}/chat`, { body: text }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "chat"] });
    },
  });

  const announceMutation = useMutation({
    mutationFn: (text: string) =>
      apiRequest("POST", `/api/events/${eventId}/host-messages`, { body: text }),
    onSuccess: () => {
      setAnnouncement("");
      setShowAnnounce(false);
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "chat"] });
    },
  });

  const metaLine =
    windowState === "BEFORE"
      ? opensAtLabel
        ? `Chat opens ${opensAtLabel} (48h before doors)`
        : "Chat opens 48 hours before doors"
      : windowState === "OPEN"
        ? countdown ?? "Open now"
        : "Chat closed";

  return (
    <div className="event-chat-backdrop" data-testid="event-chat-backdrop" onClick={onClose}>
      <div
        className="event-chat-panel"
        data-testid="event-chat-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Event chat"
        onClick={e => e.stopPropagation()}
      >
        <header className="event-chat-panel__head">
          <div>
            <h3 className="display event-chat-panel__title">Event chat</h3>
            <p className="event-chat-panel__meta">{metaLine}</p>
          </div>
          <button type="button" className="event-chat-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <AdultContentGate onDecline={onClose}>
        {pinned && (
          <div className="event-chat-panel__pin" data-testid="event-chat-pin">
            <span className="event-chat-panel__pin-label">Pinned · host</span>
            <p className="event-chat-panel__pin-body">{pinned.body}</p>
          </div>
        )}

        {isHost && (
          <div className="event-chat-panel__announce">
            {showAnnounce ? (
              <div className="event-chat-panel__announce-composer">
                <input
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  placeholder="Announcement - pinned + messaged to everyone going"
                  maxLength={1000}
                />
                <button
                  type="button"
                  className="display event-chat-panel__send"
                  disabled={!announcement.trim() || announceMutation.isPending}
                  onClick={() => announceMutation.mutate(announcement.trim())}
                >
                  Pin
                </button>
                <button
                  type="button"
                  className="event-chat-panel__announce-cancel"
                  onClick={() => setShowAnnounce(false)}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="event-chat-panel__announce-open"
                onClick={() => setShowAnnounce(true)}
              >
                + Post announcement
              </button>
            )}
          </div>
        )}

        <div className="event-chat-panel__messages" ref={listRef}>
          {isLoading && <p className="event-chat-panel__empty">Loading chat…</p>}
          {!isLoading && messages.length === 0 && windowState === "BEFORE" && (
            <p className="event-chat-panel__empty">
              You&apos;re on the list. The room opens 48 hours before doors. Check back then.
            </p>
          )}
          {!isLoading && messages.length === 0 && windowState === "OPEN" && (
            <p className="event-chat-panel__empty">
              You're checked in. Say hi - everyone going can see this until 4 hours after the event ends.
            </p>
          )}
          {!isLoading && messages.length === 0 && windowState === "CLOSED" && (
            <p className="event-chat-panel__empty">This chat has closed.</p>
          )}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`event-chat-panel__msg${msg.isMine ? " event-chat-panel__msg--mine" : ""}`}
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
              <div className="event-chat-panel__bubble">
                {!msg.isMine && (
                  <span className="event-chat-panel__author">
                    {msg.isAnonymous ? "Anonymous" : `@${msg.username || msg.displayName}`}
                  </span>
                )}
                <p>{msg.body}</p>
              </div>
            </div>
          ))}
        </div>

        <footer className="event-chat-panel__composer">
          <input
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={
              chatOpen
                ? "Say something to the room…"
                : windowState === "BEFORE"
                  ? "Chat hasn't opened yet"
                  : "Chat closed"
            }
            disabled={!chatOpen || postMutation.isPending}
            maxLength={500}
            data-testid="event-chat-input"
          />
          <button
            type="button"
            className="display event-chat-panel__send"
            disabled={!chatOpen || !body.trim() || postMutation.isPending}
            onClick={() => postMutation.mutate(body.trim())}
            data-testid="event-chat-send"
          >
            Send
          </button>
        </footer>
        </AdultContentGate>
      </div>
    </div>
  );
}
