import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserAvatar from "@/components/UserAvatar";
import type { NudeBeachTab } from "@shared/nudeBeaches";
import { RIVER_BRATS_CHAT_CLOSES_AT } from "@shared/riverBrats";

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

type ChatPayload = {
  messages: ChatMessage[];
  expiresAt: string | null;
  chatOpen: boolean;
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

type Props = {
  beachId: NudeBeachTab;
  date: string;
  beachLabel: string;
  onClose: () => void;
};

export default function RiverBratsChatPanel({ beachId, date, beachLabel, onClose }: Props) {
  const [body, setBody] = useState("");
  const [tick, setTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const chatKey = ["/api/river-brats/checkins/chat", beachId, date] as const;

  const { data, isLoading } = useQuery<ChatPayload>({
    queryKey: chatKey,
    queryFn: () =>
      apiRequest("GET", `/api/river-brats/checkins/chat?beach=${beachId}&date=${date}`).then(r => r.json()),
    refetchInterval: 8_000,
  });

  const messages = data?.messages ?? [];
  const expiresAt = data?.expiresAt ?? null;
  const chatOpen = data?.chatOpen ?? false;
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
      apiRequest("POST", "/api/river-brats/checkins/chat", { beachId, date, body: text }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: chatKey });
    },
  });

  return (
    <div className="event-chat-backdrop rb-chat-backdrop" onClick={onClose}>
      <div
        className="event-chat-panel rb-chat-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Beach chat"
        onClick={e => e.stopPropagation()}
      >
        <header className="event-chat-panel__head">
          <div>
            <h3 className="display event-chat-panel__title">Beach chat</h3>
            <p className="event-chat-panel__meta">
              {beachLabel} · {chatOpen ? countdown ?? `open until ${RIVER_BRATS_CHAT_CLOSES_AT}` : countdown ?? "Chat closed"}
            </p>
          </div>
          <button type="button" className="event-chat-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="event-chat-panel__messages" ref={listRef}>
          {isLoading && <p className="event-chat-panel__empty">Loading chat…</p>}
          {!isLoading && messages.length === 0 && (
            <p className="event-chat-panel__empty">
              You're checked in. Say hi — others heading out today can see this until midnight.
            </p>
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
            placeholder={chatOpen ? "Say something to the room…" : "Chat closed"}
            disabled={!chatOpen || postMutation.isPending}
            maxLength={500}
          />
          <button
            type="button"
            className="display event-chat-panel__send"
            disabled={!chatOpen || !body.trim() || postMutation.isPending}
            onClick={() => postMutation.mutate(body.trim())}
          >
            Send
          </button>
        </footer>
      </div>
    </div>
  );
}