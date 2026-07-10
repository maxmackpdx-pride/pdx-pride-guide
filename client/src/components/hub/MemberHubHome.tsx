import type { ReactNode } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import UserAvatar from "@/components/UserAvatar";
import { Button, StatPill } from "@/components/ds";
import { counterpartyAvatar } from "@/lib/inboxAvatar";
import { dashVarToDsAccent } from "@/lib/dsColors";
import DashboardWidgets from "@/components/dashboard/DashboardWidgets";
import "./hub-home.css";

type Counts = {
  eventCount: number;
  gigCount: number;
  giftingCount: number;
  spottedCount: number;
  checkInCount: number;
};

type UserLike = {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
};

type Props = {
  user: UserLike;
  counts: Counts;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  editMode: boolean;
  onEditProfile: () => void;
  onLogout: () => void;
  onSelectSection: (section: string) => void;
  profileEditor?: ReactNode;
  errorBanner?: ReactNode;
};

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export default function MemberHubHome({
  user,
  counts,
  isAdmin,
  isSuperAdmin,
  editMode,
  onEditProfile,
  onLogout,
  onSelectSection,
  profileEditor,
  errorBanner,
}: Props) {
  const displayName = (user.displayName || user.username || "Member").toUpperCase();

  const { data: pending = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/pending-count"],
    queryFn: () =>
      fetch("/api/admin/pending-count", { credentials: "include" }).then(r =>
        r.ok ? r.json() : { count: 0 },
      ),
    enabled: isAdmin,
    refetchInterval: 90_000,
  });

  const { data: inbox = [], isLoading: inboxLoading } = useQuery<any[]>({
    queryKey: ["/api/messages/inbox"],
    queryFn: () =>
      fetch("/api/messages/inbox", { credentials: "include" }).then(r => (r.ok ? r.json() : [])),
  });

  const threads = inbox.slice(0, 5);
  const pendingCount = pending.count || 0;

  const pills: Array<{ key: string; label: string; count: number; color: string }> = [
    { key: "events", label: "Events", count: counts.eventCount, color: "var(--dash-cyan)" },
    { key: "gigs", label: "Gigs", count: counts.gigCount, color: "var(--dash-orange)" },
    { key: "gifting", label: "Gifting", count: counts.giftingCount, color: "var(--dash-lime)" },
    { key: "spotted", label: "Spotted", count: counts.spottedCount, color: "var(--dash-magenta)" },
    { key: "checkins", label: "Check-ins", count: counts.checkInCount, color: "var(--dash-lime)" },
  ];

  return (
    <div className="hub-home">
      <section className="hub-profile" aria-label="Your profile">
        <div className="hub-profile__id">
          <UserAvatar
            photoUrl={user.photoUrl}
            avatarChoice={user.avatarChoice}
            avatarRing={user.avatarRing}
            displayName={user.displayName ?? undefined}
            username={user.username ?? undefined}
            size={64}
          />
          <div>
            <h2 className="hub-profile__name">{displayName}</h2>
            <p className="hub-profile__meta">
              @{user.username}
              {user.email ? ` · ${user.email}` : ""}
            </p>
          </div>
        </div>
        <div className="hub-profile__actions">
          <Button
            accent="lime"
            variant="solid"
            size="sm"
            onClick={onEditProfile}
          >
            {editMode ? "Cancel" : "Edit profile"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </section>

      {errorBanner}
      {profileEditor}

      <div className="hub-pills" aria-label="Your boards">
        {pills.map(pill => (
          <button key={pill.key} type="button" onClick={() => onSelectSection(pill.key)}>
            <StatPill
              count={pill.count}
              color={dashVarToDsAccent(pill.color)}
              variant="outline"
              animateCount
              size="md"
            >
              {pill.label}
            </StatPill>
          </button>
        ))}
      </div>

      {isAdmin && (
        <section className="hub-keys" aria-label="Admin access">
          <div>
            <p className="hub-keys__kicker">You hold the keys</p>
            <p className="hub-keys__copy">
              <span className="hub-keys__n">{pendingCount}</span>
              {" "}in the shared review queue
              {isSuperAdmin && (
                <>
                  <span style={{ color: "#999" }}> · </span>
                  open Owner desk for keyholder-only calls
                </>
              )}
            </p>
          </div>
          <Link href="/admin?tab=overview">
            <Button accent="pink" variant="solid" size="sm" arrow>
              Open admin
            </Button>
          </Link>
        </section>
      )}

      <div className="hub-home-grid">
        <section className="hub-card" aria-label="Inbox preview">
          <div className="hub-card__head">
            <div className="hub-card__title-row">
              <span className="hub-card__dot" aria-hidden />
              <h2 className="hub-card__title">Inbox</h2>
              <span className="hub-card__sub">private</span>
            </div>
            <Link href="/inbox">
              <Button accent="cyan" size="sm" arrow>
                Open
              </Button>
            </Link>
          </div>
          {inboxLoading ? (
            <div className="hub-empty">Loading threads…</div>
          ) : threads.length === 0 ? (
            <div className="hub-empty">
              No threads yet. Replies from Spotted, Pride Werk, event hosts, and check-ins show up here.
            </div>
          ) : (
            threads.map((msg: any) => {
              const name =
                msg.fromDisplayName ||
                msg.from_display_name ||
                msg.fromUsername ||
                msg.from_username ||
                "Community";
              const party = counterpartyAvatar(msg, "inbox");
              const unreadMsg = !msg.isRead && !msg.is_read;
              const threadId = msg.threadId || msg.thread_id;
              const href = threadId ? `/inbox?thread=${encodeURIComponent(threadId)}` : "/inbox";
              const subject =
                msg.subject || msg.preview || msg.body || msg.lastMessage || "Message";
              return (
                <Link key={msg.id} href={href} className="hub-thread">
                  <UserAvatar
                    photoUrl={party.photoUrl}
                    avatarChoice={party.avatarChoice ?? undefined}
                    avatarRing={party.avatarRing}
                    displayName={name}
                    username={party.username ?? undefined}
                    size={40}
                  />
                  <span className="hub-thread__body">
                    <span className="hub-thread__top">
                      <span className="hub-thread__name">{name}</span>
                      <span className="hub-thread__at">
                        {formatTime(msg.createdAt || msg.created_at || msg.lastMessageAt)}
                      </span>
                    </span>
                    <span className="hub-thread__sub">{subject}</span>
                  </span>
                  {unreadMsg && <span className="hub-thread__unread" aria-label="Unread" />}
                </Link>
              );
            })
          )}
        </section>

        <div className="hub-widget-stack hub-widgets-design">
          <DashboardWidgets />
        </div>
      </div>
    </div>
  );
}
