import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Lock, MapPin, MessageCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserAvatar from "@/components/UserAvatar";
import { memberProfileHref } from "@/lib/avatarLinks";
import AdultContentGate from "@/components/AdultContentGate";
import type { NudeBeachTab } from "@shared/nudeBeaches";
import { RIVER_BRATS_CHAT_CLOSES_AT, RIVER_BRATS_CHAT_OPENS_COPY } from "@shared/riverBrats";
import RiverBratsReportButton from "./RiverBratsReportButton";

/** 18+ interstitial once the viewer is in the room. */
function MaybeAdultGate({ gated, children }: { gated: boolean; children: React.ReactNode }) {
  if (!gated) return <>{children}</>;
  return <AdultContentGate>{children}</AdultContentGate>;
}

type GoingChip = {
  date: string;
  label: string;
  dayCode: string;
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
  goingDates?: string[];
  goingChips?: GoingChip[];
};

type ChatMember = {
  userId: number;
  username: string;
  displayName?: string;
  photoUrl?: string | null;
  avatarChoice?: number | null;
  goingDates: string[];
  goingChips: GoingChip[];
};

type ChatPayload = {
  messages: ChatMessage[];
  expiresAt: string | null;
  chatOpen: boolean;
  members?: ChatMember[];
  goingDates?: string[];
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

function DayChips({ chips, className = "" }: { chips?: GoingChip[]; className?: string }) {
  if (!chips?.length) return null;
  return (
    <span className={`rb-going-chips${className ? ` ${className}` : ""}`} aria-label="Days going">
      {chips.map(c => (
        <span
          key={c.date}
          className={`rb-going-chip day-${c.dayCode.toLowerCase()}`}
          title={c.date}
        >
          {c.label}
        </span>
      ))}
    </span>
  );
}

type Props = {
  beachId: NudeBeachTab;
  date: string;
  beachShortLabel: string;
  accent: "orange" | "green";
  locked: boolean;
  checkedIn: boolean;
  /** Checked in but anonymous - counted in going, never connected to the chat. */
  anonymous?: boolean;
  goingCount: number;
  /** GPS-verified on the sand right now (not the same as chat going count). */
  onLocationCount?: number;
  headerAvatars: Array<{
    key: string;
    username: string;
    displayName?: string | null;
    photoUrl?: string | null;
    avatarChoice?: number;
    masked?: boolean;
    goingChips?: GoingChip[];
  }>;
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
  onLocationCount = 0,
  headerAvatars,
}: Props) {
  const [body, setBody] = useState("");
  const [tick, setTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  // Unified beach room  -  date only stamps messages; access is multi-day.
  const chatKey = ["/api/river-brats/checkins/chat", beachId, "room"] as const;

  const { data, isLoading } = useQuery<ChatPayload>({
    queryKey: chatKey,
    queryFn: () =>
      apiRequest("GET", `/api/river-brats/checkins/chat?beach=${beachId}&date=${date}`).then(r => r.json()),
    refetchInterval: checkedIn ? 8_000 : false,
    enabled: !locked || checkedIn,
  });

  const messages = data?.messages ?? [];
  const expiresAt = data?.expiresAt ?? null;
  const chatOpen = data?.chatOpen ?? false;
  const members = data?.members ?? [];
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

  const roomCount = members.length > 0 ? members.length : goingCount;
  const chatStatus = checkedIn
    ? `${roomCount} in chat · ${countdown ?? RIVER_BRATS_CHAT_CLOSES_AT}`
    : `${roomCount} checked in · join when you say you're going`;

  return (
    <section
      className={`rb-group-chat${checkedIn ? " rb-group-chat--unlocked" : ""}`}
      aria-label="Beach group chat"
    >
      <div className="rb-group-chat__head">
        <div className="rb-group-chat__avatar-stack">
          {(members.length ? members : headerAvatars).slice(0, 4).map((row, index) => {
            const key = "userId" in row ? String((row as ChatMember).userId) : (row as { key: string }).key;
            const username = row.username;
            const displayName = row.displayName;
            const photoUrl = "masked" in row && row.masked ? null : row.photoUrl;
            const avatarChoice = "masked" in row && row.masked ? undefined : row.avatarChoice;
            const chips = row.goingChips;
            return (
              <span
                key={key}
                className="rb-group-chat__avatar-wrap"
                style={{ marginLeft: index === 0 ? 0 : -10 }}
                title={
                  chips?.length
                    ? `${displayName || username}: ${chips.map(c => c.label).join(", ")}`
                    : undefined
                }
              >
                <UserAvatar
                  username={"masked" in row && row.masked ? "anonymous" : username}
                  displayName={"masked" in row && row.masked ? undefined : displayName}
                  photoUrl={photoUrl}
                  avatarChoice={avatarChoice ?? undefined}
                  href={"masked" in row && row.masked ? null : memberProfileHref(username)}
                  size={34}
                />
              </span>
            );
          })}
        </div>
        <div className="rb-group-chat__titles">
          <div className="rb-group-chat__title-row">
            <div className="rb-group-chat__title">{beachShortLabel} · Group chat</div>
            {onLocationCount > 0 && (
              <span
                className="rb-on-site rb-on-site--chat"
                title="GPS-verified at the beach right now"
                role="status"
                aria-label={
                  onLocationCount === 1
                    ? "1 person on location"
                    : `${onLocationCount} people on location`
                }
              >
                <MapPin size={10} strokeWidth={2.5} aria-hidden />
                <span className="rb-on-site__n">{onLocationCount > 9 ? "9+" : onLocationCount}</span>
              </span>
            )}
          </div>
          <div className="rb-group-chat__status">{chatStatus}</div>
        </div>
        <span className="rb-group-chat__messages-pill">
          <MessageCircle size={11} strokeWidth={2.3} aria-hidden />
          In Messages
        </span>
      </div>

      <MaybeAdultGate gated={checkedIn}>
      <div className="rb-group-chat__thread" ref={listRef}>
        <div className="rb-group-chat__day-marker">
          Opens {RIVER_BRATS_CHAT_OPENS_COPY} · one room for every day you&apos;re going ·{" "}
          {RIVER_BRATS_CHAT_CLOSES_AT}
        </div>
        {isLoading && !locked && <p className="rb-group-chat__empty">Loading chat…</p>}
        {!isLoading && messages.length === 0 && !locked && checkedIn && (
          <p className="rb-group-chat__empty">
            You&apos;re in. Say hi  -  everyone heading to {beachShortLabel} this week is in this room.
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
                href={msg.isAnonymous ? null : memberProfileHref(msg.username)}
                size={26}
              />
            )}
            <div className="rb-group-chat__bubble">
              {!msg.isMine && (
                <span className="rb-group-chat__author-block">
                  <span className="rb-group-chat__author">
                    {msg.isAnonymous ? "Anonymous" : `@${msg.username || msg.displayName}`}
                  </span>
                  <DayChips chips={msg.goingChips} />
                </span>
              )}
              {msg.isMine && msg.goingChips && msg.goingChips.length > 0 && (
                <span className="rb-group-chat__author-block rb-group-chat__author-block--mine">
                  <span className="rb-group-chat__author">You</span>
                  <DayChips chips={msg.goingChips} />
                </span>
              )}
              <span className="rb-group-chat__body">{msg.body}</span>
              {!msg.isMine && <RiverBratsReportButton targetType="CHAT_MESSAGE" targetId={msg.id} />}
            </div>
          </div>
        ))}

        {locked && (
          <div className="rb-group-chat__lock">
            <Lock size={22} strokeWidth={2} aria-hidden />
            {anonymous ? (
              <p>
                You&apos;re checked in anonymously, so you&apos;re counted as going but stay off the
                chat. Switch to your @username to join the group.
              </p>
            ) : (
              <p>
                Check in (say you&apos;re going) to unlock the chat. Everyone going any day this week
                shares one room  -  multi-day plans keep you in longer.
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
            <span>Check in to join the group chat  -  chat starts the moment you say you&apos;re going.</span>
          </div>
        )}
      </div>
      </MaybeAdultGate>
    </section>
  );
}
