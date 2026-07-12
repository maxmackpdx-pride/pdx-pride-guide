import { useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import type { AuthUser } from "@/context/AuthContext";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import HubV2Shell from "./HubV2Shell";
import HubFeed from "./sections/HubFeed";
import HubProfile from "./sections/HubProfile";
import HubEvents, { type HubEventRow } from "./sections/HubEvents";
import HubPeople from "./sections/HubPeople";
import HubSettings from "./sections/HubSettings";
import HubAdminOverview from "./sections/HubAdminOverview";
import HubAdminTable, { getAdminTableMeta } from "./sections/HubAdminTable";
import {
  HUB_ADMIN_TABLE_SECTIONS,
  hubSectionToAdminTab,
  type HubSection,
} from "./types";

export type HubV2Props = {
  user: AuthUser;
  isAdmin: boolean;
  canPostToFeed?: boolean;
  canManageTeam?: boolean;
  pendingCount?: number;
  postsCount?: number;
  profileStats?: Array<{ value: string | number; label: string }>;
  goingEvents?: HubEventRow[];
  hostingEvents?: HubEventRow[];
  savedEvents?: HubEventRow[];
  eventsLoading?: boolean;
  eventsEditorSlot?: ReactNode;
  profileEditor?: ReactNode;
  editMode?: boolean;
  onEditProfile?: () => void;
  onLogout: () => void;
  errorBanner?: ReactNode;
  section: HubSection;
  onSectionChange: (section: HubSection) => void;
  initialPostType?: "text" | "photo";
};

function dayDotClass(day?: string) {
  const map: Record<string, string> = {
    THU: "d-thu",
    FRI: "d-fri",
    SAT: "d-sat",
    SUN: "d-sun",
    Thu: "d-thu",
    Fri: "d-fri",
    Sat: "d-sat",
    Sun: "d-sun",
  };
  return day ? map[day] ?? "" : "";
}

function HubRightRail({
  upcoming,
  onGoEvents,
}: {
  upcoming: HubEventRow[];
  onGoEvents: () => void;
}) {
  return (
    <>
      <div className="card" style={{ padding: 16 }}>
        <div className="kick" style={{ letterSpacing: ".16em", color: "var(--panel-cyan)", marginBottom: 14 }}>
          Your next moves
        </div>
        {upcoming.length === 0 && (
          <div className="kick" style={{ marginBottom: 13 }}>
            RSVP or check in to see upcoming nights here.
          </div>
        )}
        {upcoming.map((e) => (
          <div
            key={e.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              paddingBottom: 13,
              marginBottom: 13,
              borderBottom: "1px solid var(--panel-border)",
            }}
          >
            <span className={`dot ${dayDotClass(e.dayOfWeek)}`} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#fff", lineHeight: 1.1, textTransform: "uppercase" }}>
                {e.title}
              </div>
              <div className="kick" style={{ letterSpacing: ".05em", marginTop: 4 }}>
                {e.when}
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="ico" style={{ color: "var(--panel-cyan)" }} onClick={onGoEvents}>
          All your events →
        </button>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <div className="kick" style={{ letterSpacing: ".16em", marginBottom: 14 }}>
          Who to follow
        </div>
        <p className="kick" style={{ lineHeight: 1.5 }}>
          Scene-makers and venues you might know. Full follow graph ships soon.
        </p>
      </div>
    </>
  );
}

export default function HubV2({
  user,
  isAdmin,
  canPostToFeed = false,
  canManageTeam = false,
  pendingCount = 0,
  postsCount = 0,
  profileStats,
  goingEvents = [],
  hostingEvents = [],
  savedEvents = [],
  eventsLoading,
  eventsEditorSlot,
  profileEditor,
  editMode,
  onEditProfile,
  onLogout,
  errorBanner,
  section,
  onSectionChange,
  initialPostType,
}: HubV2Props) {
  const { calmMode, toggleCalmMode } = useTheme();
  const [, navigate] = useLocation();
  const [searchQ, setSearchQ] = useState("");

  const handleSectionChange = (next: HubSection) => {
    if (HUB_ADMIN_TABLE_SECTIONS.includes(next)) {
      const tab = hubSectionToAdminTab(next);
      if (tab) {
        navigate(`/admin?tab=${tab}`);
        return;
      }
    }
    onSectionChange(next);
  };

  const upcoming = useMemo(
    () => [...goingEvents, ...hostingEvents].slice(0, 3),
    [goingEvents, hostingEvents],
  );

  const stats =
    profileStats ??
    [
      { value: "—", label: "Followers" },
      { value: "—", label: "Following" },
      { value: hostingEvents.length + goingEvents.length, label: "Events" },
      { value: postsCount, label: "Posts" },
    ];

  const tableMeta = HUB_ADMIN_TABLE_SECTIONS.includes(section) ? getAdminTableMeta(section) : null;

  const center = (
    <>
      <PwaInstallBanner />
      {errorBanner}
      {(section === "feed" || section === "post") && <HubFeed key="feed" canPostToFeed={canPostToFeed} />}
      {section === "profile" && (
        <HubProfile
          key={`profile-${editMode ? "edit" : "view"}`}
          user={user}
          stats={stats}
          postsCount={postsCount}
          profileEditor={editMode ? profileEditor : undefined}
          onEditProfile={onEditProfile}
        />
      )}
      {section === "events" && (
        <HubEvents
          key="events"
          going={goingEvents}
          hosting={hostingEvents}
          saved={savedEvents}
          loading={eventsLoading}
          editorSlot={eventsEditorSlot}
        />
      )}
      {section === "people" && <HubPeople key="people" />}
      {section === "settings" && <HubSettings key="settings" onLogout={onLogout} />}
      {section === "admin" && isAdmin && (
        <HubAdminOverview key="admin" pendingCount={pendingCount} />
      )}
      {tableMeta && isAdmin && (
        <HubAdminTable key={section} section={section} {...tableMeta} />
      )}
    </>
  );

  return (
    <HubV2Shell
      section={section}
      onSectionChange={handleSectionChange}
      isAdmin={isAdmin}
      canPostToFeed={canPostToFeed}
      canManageTeam={canManageTeam}
      calmMode={calmMode}
      onToggleCalm={toggleCalmMode}
      onLogout={onLogout}
      searchValue={searchQ}
      onSearchChange={setSearchQ}
      rightRail={<HubRightRail upcoming={upcoming} onGoEvents={() => handleSectionChange("events")} />}
    >
      {center}
    </HubV2Shell>
  );
}