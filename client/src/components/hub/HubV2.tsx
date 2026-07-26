import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import type { AuthUser } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PeopleHubUser } from "@shared/peopleHub";
import { isLocalDemo } from "@/lib/localDemo";
import { getLocalDemoNextMoves, getLocalDemoWhoToFollow } from "@/lib/localDemoHubFeed";
import HubPersonRow from "./sections/HubPersonRow";

import InstallAppCard from "@/components/InstallAppCard";
import HubV2Shell from "./HubV2Shell";
import HubFeed from "./sections/HubFeed";
import HubProfile from "./sections/HubProfile";
import HubEvents, { type HubEventRow, type HubEventsFocus } from "./sections/HubEvents";
import HubPeople from "./sections/HubPeople";
import HubSettings from "./sections/HubSettings";
import HubAdminOverview from "./sections/HubAdminOverview";
import HubAdminKeys from "./sections/HubAdminKeys";
import HubWeatherForecast from "./sections/HubWeatherForecast";
import HubAdminTable, { getAdminTableMeta } from "./sections/HubAdminTable";
import {
  HUB_ADMIN_TABLE_SECTIONS,
  hubSectionToAdminTab,
  type HubSection,
} from "./types";
import { isEventSchedulePast, parsePacificDateTime } from "@shared/missedConnections";

/** Upcoming nights only for the right-rail “Your next moves” list. */
function isHubNextMoveLive(row: HubEventRow, nowMs = Date.now()): boolean {
  if (row.dateStart || row.dateEnd) {
    return !isEventSchedulePast(row.dateStart, row.dateEnd, nowMs);
  }
  // No schedule → don't invent a “next” night (avoid stale demo / partial rows).
  return false;
}

function sortHubNextMoves(a: HubEventRow, b: HubEventRow): number {
  const aMs = parsePacificDateTime(a.dateStart) ?? Number.POSITIVE_INFINITY;
  const bMs = parsePacificDateTime(b.dateStart) ?? Number.POSITIVE_INFINITY;
  return aMs - bMs;
}

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
}: {
  upcoming: HubEventRow[];
  onGoEvents: () => void;
  onGoPeople: () => void;
}) {
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const demo = isLocalDemo();

  const { data: suggestions = [] } = useQuery<PeopleHubUser[]>({
    queryKey: ["/api/users/me/people", "discover", "rail", demo ? "demo" : "live"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/users/me/people/discover");
        if (!res.ok) {
          if (demo) return getLocalDemoWhoToFollow();
          return [];
        }
        const list = (await res.json()) as PeopleHubUser[];
        if (demo && list.length === 0) return getLocalDemoWhoToFollow();
        return list.slice(0, 3);
      } catch {
        if (demo) return getLocalDemoWhoToFollow();
        return [];
      }
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

  const moveRows = upcoming.length > 0 ? upcoming : demo ? getLocalDemoNextMoves() : [];

  return (
    <>
      <div className="card hub-rail-card hub-rail-card--moves">
        <div className="kick hub-rail-card__kick hub-rail-card__kick--cyan">Your next moves</div>
        {moveRows.length === 0 && (
          <div className="kick hub-rail-card__empty">
            RSVP or check in to see upcoming nights here.
          </div>
        )}
        <div className="hub-rail-card__list">
          {moveRows.map((e) => {
            const hasDay = Boolean(e.dayOfWeek);
            return (
              <div
                key={e.id}
                className={`hub-rail-move${hasDay ? " hub-rail-move--day" : " hub-rail-move--featured"}`}
              >
                {hasDay ? <span className={`dot ${dayDotClass(e.dayOfWeek)}`} /> : null}
                <div className="hub-rail-move__main">
                  <div className="hub-rail-move__title">{e.title}</div>
                  <div className="kick hub-rail-move__when">{e.when}</div>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="ico hub-rail-card__foot" onClick={onGoEvents}>
          All your events →
        </button>
      </div>
      <div className={`card hub-people-rail${suggestions.length === 0 ? " hub-people-rail--empty" : ""}`}>
        <div className="hub-people-rail__head">
          <div className={`kick hub-people-rail__kick${suggestions.length === 0 ? " hub-people-rail__kick--solo" : ""}`}>
            Who to follow
          </div>
          {suggestions.length === 0 && (
            <p className="kick hub-people-rail__empty-copy">
              You&apos;re following the scene by default. Unfollow anyone on their
              profile or from their posts - they&apos;ll show up here to re-follow.
            </p>
          )}
        </div>
        {suggestions.map((person) => (
          <HubPersonRow
            key={person.id}
            person={person}
            rail
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

  // Legacy deep-links (?section=admin / tbl-*) → real /admin page once.
  // Do not reverse-bounce from Admin back here or history.pushState will thrash.
  useEffect(() => {
    if (section !== "admin" && !HUB_ADMIN_TABLE_SECTIONS.includes(section)) return;
    const tab = section === "admin" ? "overview" : hubSectionToAdminTab(section);
    const target = tab ? `/admin?tab=${encodeURIComponent(tab)}` : "/admin?tab=overview";
    navigate(target, { replace: true });
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

  const upcoming = useMemo(() => {
    const now = Date.now();
    const seen = new Set<string>();
    const rows: HubEventRow[] = [];
    for (const row of [...goingEvents, ...hostingEvents]) {
      if (!isHubNextMoveLive(row, now)) continue;
      const key = String(row.id);
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
    return rows.sort(sortHubNextMoves).slice(0, 3);
  }, [goingEvents, hostingEvents]);

  const stats =
    profileStats ??
    [
      { value: followStats?.followers ?? "-", label: "Followers" },
      { value: followStats?.following ?? "-", label: "Following" },
      { value: hostingEvents.length + goingEvents.length, label: "Events" },
      { value: postsCount, label: "Posts" },
    ];

  const tableMeta = HUB_ADMIN_TABLE_SECTIONS.includes(section) ? getAdminTableMeta(section) : null;

  const center = (
    <>
      {errorBanner}
      {(section === "feed" || section === "post") && (
        <>
          <InstallAppCard />
          <HubWeatherForecast />
          <HubFeed key="feed" canPostToFeed={canPostToFeed} />
        </>
      )}
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
      {/* Admin overview / tables only on /admin - not mixed into member hub. */}
    </>
  );

  const keysExtra = isAdmin ? (
    <HubAdminKeys
      pendingCount={pendingCount}
      ownerCount={ownerCount}
      isPrimaryOwner={isPrimaryOwner}
    />
  ) : null;

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
      sideExtra={keysExtra}
      rightRail={
        <HubRightRail
          upcoming={upcoming}
          onGoEvents={() => handleSectionChange("events")}
          onGoPeople={() => handleSectionChange("people")}
        />
      }
    >
      {center}
    </HubV2Shell>
  );
}