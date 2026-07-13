import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Lock, MessageCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserAvatar from "@/components/UserAvatar";
import AdultContentGate from "@/components/AdultContentGate";
import type { NudeBeachTab } from "@shared/nudeBeaches";
import { RIVER_BRATS_CHAT_CLOSES_AT } from "@shared/riverBrats";

/** 18+ interstitial applies once the viewer is actually in the room; the
 *  locked preview stays gate-free since content is masked anyway. */
function MaybeAdultGate({ gated, children }: { gated: boolean; children: React.ReactNode }) {
  if (!gated) return <>{children}</>;
  return <AdultContentGate>{children}</AdultContentGate>;
}


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

type AvatarPreview = {
  key: string;
  username: string;
  displayName?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  masked?: boolean;
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
  beachShortLabel: string;
  accent: "orange" | "green";
  locked: boolean;
  checkedIn: boolean;
  /** Checked in but anonymous — counted in going, never connected to the chat. */
  anonymous?: boolean;
  goingCount: number;
  headerAvatars: AvatarPreview[];
};

export default function RiverBratsGroupChat({
  beachId,
  date,
  beachShortLabel,
  accent,
  locked,
  checkedIn,
  anonymous = false,
  goingCount,
  headerAvatars,
}: Props) {
  const [body, setBody] = useState("");
  const [tick, setTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const chatKey = ["/api/river-brats/checkins/chat", beachId, date] as const;

  const { data, isLoading } = useQuery<ChatPayload>({
    queryKey: chatKey,
    queryFn: () =>
      apiRequest("GET", `/api/river-brats/checkins/chat?beach=${beachId}&date=${date}`).then(r => r.json()),
    refetchInterval: checkedIn ? 8_000 : false,
    enabled: !locked,
  });

  const messages = data?.messages ?? [];
  const expiresAt = data?.expiresAt ?? null;
  const chatOpen = data?.chatOpen ?? false;
  const countdown = useMemo(() => formatCountdown(expiresAt), [expiresAt, tick]);

  useEffect(() => {
    if (!checkedIn) return;
    const id = window.setInterval(() => setTick(t => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, [checkedIn]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, locked]);

  const postMutation = useMutation({
    mutationFn: (text: string) =>
      apiRequest("POST", "/api/river-brats/checkins/chat", { beachId, date, body: text }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: chatKey });
    },
  });

  const chatStatus = checkedIn
    ? `${goingCount} here · ${countdown ?? `open until ${RIVER_BRATS_CHAT_CLOSES_AT}`}`
    : `${goingCount} talking · locked`;

  return (
    <section
      className={`rb-group-chat${checkedIn ? " rb-group-chat--unlocked" : ""}`}
      aria-label="Today's group chat"
    >
      <div className="rb-group-chat__head">
        <div className="rb-group-chat__avatar-stack">
          {headerAvatars.slice(0, 3).map((row, index) => (
            <span
              key={row.key}
              className="rb-group-chat__avatar-wrap"
              style={{ marginLeft: index === 0 ? 0 : -10 }}
            >
              <UserAvatar
                username={row.masked ? "anonymous" : row.username}
                displayName={row.masked ? undefined : row.displayName}
                photoUrl={row.masked ? null : row.photoUrl}
                avatarChoice={row.masked ? undefined : row.avatarChoice}
                size={34}
              />
            </span>
          ))}
        </div>
        <div className="rb-group-chat__titles">
          <div className="rb-group-chat__title">{beachShortLabel} · Today</div>
          <div className="rb-group-chat__status">{chatStatus}</div>
        </div>
        <span className="rb-group-chat__messages-pill">
          <MessageCircle size={11} strokeWidth={2.3} aria-hidden />
          In Messages
        </span>
      </div>

      <MaybeAdultGate gated={checkedIn}>
      <div className="rb-group-chat__thread" ref={listRef}>
        <div className="rb-group-chat__day-marker">Opens 48h early · clears at 10pm</div>
        {isLoading && !locked && <p className="rb-group-chat__empty">Loading chat…</p>}
        {!isLoading && messages.length === 0 && !locked && (
          <p className="rb-group-chat__empty">
            You're checked in. Say hi — others heading out today can see this until 10pm.
          </p>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`rb-group-chat__row${msg.isMine ? " rb-group-chat__row--mine" : ""}`}
          >
            {!msg.isMine && (
              <UserAvatar
                username={msg.username}
                displayName={msg.isAnonymous ? undefined : msg.displayName}
                photoUrl={msg.photoUrl}
                avatarChoice={msg.avatarChoice ?? undefined}
                avatarRing={msg.avatarRing}
                size={26}
              />
            )}
            <div className="rb-group-chat__bubble">
              {!msg.isMine && (
                <span className="rb-group-chat__author">
                  {msg.isAnonymous ? "Anonymous" : `@${msg.username || msg.displayName}`}
                </span>
              )}
              <span>{msg.body}</span>
            </div>
          </div>
        ))}

        {locked && (
          <div className="rb-group-chat__lock">
            <Lock size={22} strokeWidth={2} aria-hidden />
            {anonymous ? (
              <p>
                You're checked in anonymously, so you're counted in <strong>{goingCount}</strong> going
                but stay off the chat. Switch to your @username to join.
              </p>
            ) : (
              <p>
                Check in to unlock the chat. You'll see <strong>{goingCount}</strong> people already
                talking and it'll show up in your Messages.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rb-group-chat__footer">
        {checkedIn ? (
          <div className="rb-group-chat__composer">
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (body.trim() && chatOpen) postMutation.mutate(body.trim());
                }
              }}
              placeholder={chatOpen ? "Message the group…" : "Chat closed"}
              disabled={!chatOpen || postMutation.isPending}
              maxLength={500}
            />
            <button
              type="button"
              className={`rb-group-chat__send rb-group-chat__send--${accent}`}
              disabled={!chatOpen || !body.trim() || postMutation.isPending}
              onClick={() => postMutation.mutate(body.trim())}
            >
              Send
            </button>
          </div>
        ) : (
          <div className="rb-group-chat__locked-foot">
            <Lock size={15} strokeWidth={2} aria-hidden />
            <span>Only people checked in today can read and post.</span>
          </div>
        )}
      </div>
      </MaybeAdultGate>
    </section>
  );
}