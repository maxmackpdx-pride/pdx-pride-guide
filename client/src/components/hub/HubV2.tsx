import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import type { AuthUser } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PeopleHubUser } from "@shared/peopleHub";
import HubPersonRow from "./sections/HubPersonRow";

import PwaInstallBanner from "@/components/PwaInstallBanner";
import HubV2Shell from "./HubV2Shell";
import HubFeed from "./sections/HubFeed";
import HubProfile from "./sections/HubProfile";
import HubEvents, { type HubEventRow, type HubEventsFocus } from "./sections/HubEvents";
import HubPeople from "./sections/HubPeople";
import HubSettings from "./sections/HubSettings";
import HubAdminOverview from "./sections/HubAdminOverview";
import HubAdminKeys from "./sections/HubAdminKeys";
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
  ownerCount?: number;
  isPrimaryOwner?: boolean;
  postsCount?: number;
  profileStats?: Array<{ value: string | number; label: string }>;
  followStats?: { followers: number; following: number };
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
  /** Inbox Posts deep-link: `?view=posts&section=events|checkins`. */
  eventsFocusSection?: HubEventsFocus | null;
};

function dayDotClass(day?: string) {
  const key = String(day || "").trim().toUpperCase().slice(0, 3);
  const map: Record<string, string> = {
    MON: "d-mon",
    TUE: "d-tue",
    WED: "d-wed",
    THU: "d-thu",
    FRI: "d-fri",
    SAT: "d-sat",
    SUN: "d-sun",
  };
  return map[key] ?? "";
}

function HubRightRail({
  upcoming,
  onGoEvents,
  onGoPeople,
  isAdmin,
  isPrimaryOwner,
  pendingCount,
  ownerCount,
}: {
  upcoming: HubEventRow[];
  onGoEvents: () => void;
  onGoPeople: () => void;
  isAdmin?: boolean;
  isPrimaryOwner?: boolean;
  pendingCount?: number;
  ownerCount?: number;
}) {
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);

  const { data: suggestions = [] } = useQuery<PeopleHubUser[]>({
    queryKey: ["/api/users/me/people", "discover", "rail"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/me/people/discover");
      const list = (await res.json()) as PeopleHubUser[];
      return list.slice(0, 3);
    },
  });

  const followMutation = useMutation({
    mutationFn: async ({ username, isFollowing }: { username: string; isFollowing: boolean }) => {
      setPendingUsername(username);
      const method = isFollowing ? "DELETE" : "POST";
      await apiRequest(method, `/api/users/${encodeURIComponent(username)}/follow`);
    },
    onSettled: () => {
      setPendingUsername(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/follow-stats"] });
    },
  });

  return (
    <>
      {isAdmin && (
        <HubAdminKeys
          compact
          pendingCount={pendingCount ?? 0}
          ownerCount={ownerCount ?? 0}
          isPrimaryOwner={isPrimaryOwner}
        />
      )}
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
      <div className={`card hub-people-rail${suggestions.length === 0 ? " hub-people-rail--empty" : ""}`}>
        <div className="hub-people-rail__head">
          <div className={`kick hub-people-rail__kick${suggestions.length === 0 ? " hub-people-rail__kick--solo" : ""}`}>
            Who to follow
          </div>
          {suggestions.length === 0 && (
            <p className="kick" style={{ lineHeight: 1.5, margin: 0 }}>
              Hosts and scene-makers show up here as more profiles go live.
            </p>
          )}
        </div>
        {suggestions.map((person) => (
          <HubPersonRow
            key={person.id}
            person={person}
            followPending={pendingUsername === person.username}
            onToggleFollow={() =>
              followMutation.mutate({ username: person.username, isFollowing: person.isFollowing })
            }
          />
        ))}
        {suggestions.length > 0 && (
          <button type="button" className="ico hub-people-rail__foot" onClick={onGoPeople}>
            See all in People →
          </button>
        )}
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
  ownerCount = 0,
  isPrimaryOwner = false,
  postsCount = 0,
  profileStats,
  followStats,
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
  eventsFocusSection = null,
}: HubV2Props) {
  const { calmMode, toggleCalmMode } = useTheme();
  const [, navigate] = useLocation();
  const [searchQ, setSearchQ] = useState("");

  const publicProfilePath = user.username
    ? `/u/${encodeURIComponent(user.username)}`
    : null;

  // Profile rail / ?section=profile without edit → real public profile, not HubProfile stub.
  // Keep HubProfile only for edit deep-link (?edit=profile / onEditProfile).
  useEffect(() => {
    if (section === "profile" && !editMode && publicProfilePath) {
      navigate(publicProfilePath);
    }
  }, [section, editMode, publicProfilePath, navigate]);

  // Admin is a separate page (/admin) — never keep admin tools inside member hub.
  useEffect(() => {
    if (section === "admin" || HUB_ADMIN_TABLE_SECTIONS.includes(section)) {
      const tab = section === "admin" ? "overview" : hubSectionToAdminTab(section);
      navigate(tab ? `/admin?tab=${encodeURIComponent(tab)}` : "/admin?tab=overview");
    }
  }, [section, navigate]);

  const handleSectionChange = (next: HubSection) => {
    if (next === "profile" && !editMode && publicProfilePath) {
      navigate(publicProfilePath);
      return;
    }
    if (next === "admin") {
      navigate("/admin?tab=overview");
      return;
    }
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
      { value: followStats?.followers ?? "—", label: "Followers" },
      { value: followStats?.following ?? "—", label: "Following" },
      { value: hostingEvents.length + goingEvents.length, label: "Events" },
      { value: postsCount, label: "Posts" },
    ];

  const tableMeta = HUB_ADMIN_TABLE_SECTIONS.includes(section) ? getAdminTableMeta(section) : null;

  const center = (
    <>
      <PwaInstallBanner />
      {errorBanner}
      {isAdmin && (section === "feed" || section === "post") && (
        <HubAdminKeys
          pendingCount={pendingCount}
          ownerCount={ownerCount}
          isPrimaryOwner={isPrimaryOwner}
        />
      )}
      {(section === "feed" || section === "post") && <HubFeed key="feed" canPostToFeed={canPostToFeed} />}
      {section === "profile" && editMode && (
        <HubProfile
          key="profile-edit"
          user={user}
          stats={stats}
          postsCount={postsCount}
          profileEditor={profileEditor}
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
          focusSection={eventsFocusSection}
        />
      )}
      {section === "people" && <HubPeople key="people" />}
      {section === "settings" && <HubSettings key="settings" onLogout={onLogout} />}
      {/* Admin overview / tables only on /admin — not mixed into member hub. */}
    </>
  );

  return (
    <HubV2Shell
      section={section}
      onSectionChange={handleSectionChange}
      isAdmin={isAdmin}
      isPrimaryOwner={isPrimaryOwner}
      canPostToFeed={canPostToFeed}
      canManageTeam={canManageTeam}
      chromeMode="member"
      pendingCount={pendingCount}
      calmMode={calmMode}
      onToggleCalm={toggleCalmMode}
      onLogout={onLogout}
      searchValue={searchQ}
      onSearchChange={setSearchQ}
      rightRail={
        <HubRightRail
          upcoming={upcoming}
          onGoEvents={() => handleSectionChange("events")}
          onGoPeople={() => handleSectionChange("people")}
          isAdmin={isAdmin}
          isPrimaryOwner={isPrimaryOwner}
          pendingCount={pendingCount}
          ownerCount={ownerCount}
        />
      }
    >
      {center}
    </HubV2Shell>
  );
}