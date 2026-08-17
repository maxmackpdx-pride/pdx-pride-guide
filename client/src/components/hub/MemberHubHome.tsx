import type { ReactNode } from "react";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import { Button, StatPill } from "@/components/ds";
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
  isPrimaryOwner: boolean;
  pendingCount: number;
  ownerCount?: number;
  editMode: boolean;
  onEditProfile: () => void;
  onLogout: () => void;
  onSelectSection: (section: string) => void;
  profileEditor?: ReactNode;
  errorBanner?: ReactNode;
};

export default function MemberHubHome({
  user,
  counts,
  isAdmin,
  isPrimaryOwner,
  pendingCount,
  ownerCount = 0,
  editMode,
  onEditProfile,
  onLogout,
  onSelectSection,
  profileEditor,
  errorBanner,
}: Props) {
  const displayName = (user.displayName || user.username || "Member").toUpperCase();

  const pills: Array<{ key: string; label: string; count: number; color: string }> = [
    { key: "events", label: "Events", count: counts.eventCount, color: "var(--dash-cyan)" },
    { key: "gigs", label: "Gigz", count: counts.gigCount, color: "var(--dash-orange)" },
    { key: "gifting", label: "GiftZ", count: counts.giftingCount, color: "var(--dash-lime)" },
    { key: "spotted", label: "Mizzed Connection", count: counts.spottedCount, color: "var(--dash-magenta)" },
    { key: "checkins", label: "Check-ins", count: counts.checkInCount, color: "var(--dash-lime)" },
  ];

  return (
    <div className="hub-home">
      <section className="hub-profile" aria-label="Your profile">
        <div className="hub-profile__id">
          <Link href="/dashboard?edit=profile" className="hub-profile__avatar-link" aria-label="Edit profile">
            <UserAvatar
              photoUrl={user.photoUrl}
              avatarChoice={user.avatarChoice}
              avatarRing={user.avatarRing}
              displayName={user.displayName ?? undefined}
              username={user.username ?? undefined}
              size={64}
            />
          </Link>
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
        <section
          className="hub-keys pdx-glass-rebind"
          aria-label="Admin access"
          style={{ ["--c" as string]: "var(--panel-magenta, #ff1fa0)" }}
        >
          <div>
            <p className="hub-keys__kicker">You hold the keys</p>
            <p className="hub-keys__copy">
              <span className="hub-keys__n">{pendingCount}</span>
              {" "}in the shared review queue
              {isPrimaryOwner && (
                <>
                  <span style={{ color: "#999" }}> · </span>
                  <span className="hub-keys__n hub-keys__n--purple">{ownerCount}</span>
                  {" "}on your owner desk
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
        <div className="hub-widget-stack hub-widgets-design">
          <DashboardWidgets />
        </div>
      </div>
    </div>
  );
}
