import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import BoardLoadingState from "@/components/BoardLoadingState";
import PageHeader from "@/components/PageHeader";
import HubV2 from "@/components/hub/HubV2";
import type { HubEventsFocus } from "@/components/hub/sections/HubEvents";
import type { HubEventRow } from "@/components/hub/sections/HubEvents";
import { parseHubSection, type HubSection } from "@/components/hub/types";
import DashboardProfileEditor from "@/components/dashboard/DashboardProfileEditor";
import { DashboardEventEditForm, DashboardGigEditForm } from "@/components/dashboard/DashboardEventEditor";
import { editFormToApiPayload, eventToEditForm } from "@/lib/eventEditForm";
import {
  getLocalDemoHubUser,
  isLocalDemo,
  LOCAL_DEMO_PROFILE_PATH,
} from "@/lib/localDemo";
import "@/components/dashboard/dashboard.css";

function mapCheckInRow(check: any): HubEventRow {
  return {
    id: check.eventId ?? check.id,
    title: check.eventTitle,
    when: `${check.venueName} · ${new Date(check.dateStart).toLocaleString()}`,
    dayOfWeek: check.dayOfWeek,
    chip: "Checked in",
    dateStart: check.dateStart ?? null,
    dateEnd: check.dateEnd ?? null,
  };
}

function mapEventRow(evt: any, chip?: string): HubEventRow {
  return {
    id: evt.id,
    title: evt.title,
    when: `${evt.dayOfWeek ?? ""} · ${evt.venueName ?? ""}`.replace(/^ · /, ""),
    neighborhood: evt.neighborhood ?? undefined,
    admission: evt.admission ?? undefined,
    dayOfWeek: evt.dayOfWeek ?? undefined,
    chip,
    dateStart: evt.dateStart ?? evt.date_start ?? null,
    dateEnd: evt.dateEnd ?? evt.date_end ?? null,
  };
}

const POSTS_LEGACY_SECTIONS = ["events", "gigs", "gifting", "spotted", "checkins"] as const;

function postsFocusFromSearch(params: URLSearchParams): HubEventsFocus | null {
  const legacy = params.get("section");
  if (legacy === "events" || legacy === "checkins") return legacy;
  return null;
}

function hubSectionFromSearch(params: URLSearchParams): HubSection {
  if (params.get("view") === "posts") return "events";
  if (params.get("edit") === "profile") return "profile";
  const legacy = params.get("section");
  if (legacy && (POSTS_LEGACY_SECTIONS as readonly string[]).includes(legacy)) {
    return "events";
  }
  return parseHubSection(params.get("section"));
}

export default function Dashboard() {
  usePageSeo("Your Hub | Zaylist", "Your Zaylist hub: events, feed, people, and more.");
  const { user, logout, refreshUser, loading } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const readSearch = () => new URLSearchParams(window.location.search);
  const [hubSection, setHubSection] = useState<HubSection>(() =>
    typeof window === "undefined" ? "feed" : hubSectionFromSearch(readSearch()),
  );
  const [editMode, setEditMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return readSearch().get("edit") === "profile";
  });
  const [pendingEditEventId, setPendingEditEventId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : readSearch().get("editEvent"),
  );
  const [pendingEditGigId, setPendingEditGigId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : readSearch().get("editGig"),
  );
  const [postsFocus, setPostsFocus] = useState<HubEventsFocus | null>(() =>
    typeof window === "undefined" ? null : postsFocusFromSearch(readSearch()),
  );

  const applySearchParams = (params: URLSearchParams) => {
    setHubSection(hubSectionFromSearch(params));
    setEditMode(params.get("edit") === "profile");
    setPendingEditEventId(params.get("editEvent"));
    setPendingEditGigId(params.get("editGig"));
    setPostsFocus(postsFocusFromSearch(params));
  };

  useEffect(() => {
    applySearchParams(readSearch());
  }, [location]);

  useEffect(() => {
    const onPopState = () => applySearchParams(readSearch());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarChoice, setAvatarChoice] = useState(user?.avatarChoice || 1);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || "");
    setUsername(user.username || "");
    setBio(user.bio || "");
    setAvatarChoice(user.avatarChoice || 1);
  }, [user?.id, user?.displayName, user?.username, user?.bio, user?.avatarChoice]);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState<any>(null);
  const [hostUpdate, setHostUpdate] = useState("");
  const [editingGig, setEditingGig] = useState<any>(null);
  const [gigForm, setGigForm] = useState({ title: "", description: "", skills: "", compensation: "", location: "" });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (hubSection === "events") {
      url.searchParams.set("view", "posts");
      if (postsFocus) url.searchParams.set("section", postsFocus);
      else if (!(POSTS_LEGACY_SECTIONS as readonly string[]).includes(url.searchParams.get("section") ?? "")) {
        url.searchParams.set("section", "events");
      }
    } else {
      url.searchParams.delete("view");
      if (hubSection !== "feed") url.searchParams.set("section", hubSection);
      else url.searchParams.delete("section");
    }
    if (editMode) url.searchParams.set("edit", "profile");
    else url.searchParams.delete("edit");
    if (editingEvent) url.searchParams.set("editEvent", String(editingEvent.id));
    else if (!pendingEditEventId) url.searchParams.delete("editEvent");
    if (editingGig) url.searchParams.set("editGig", String(editingGig.id));
    else if (!pendingEditGigId) url.searchParams.delete("editGig");
    window.history.replaceState({}, "", url.toString());
  }, [hubSection, editMode, editingEvent, editingGig, pendingEditEventId, pendingEditGigId, postsFocus]);

  const fetchMine = async (url: string) => {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) throw new Error(`Could not load ${url}`);
    return r.json();
  };

  const myGigsQuery = useQuery<any[]>({
    queryKey: ["/api/gigs/mine"],
    queryFn: () => fetchMine("/api/gigs/mine"),
    enabled: !!user,
  });
  const myEventsQuery = useQuery<any[]>({
    queryKey: ["/api/events/mine/claimed"],
    queryFn: () => fetchMine("/api/events/mine/claimed"),
    enabled: !!user,
  });
  const submittedEventsQuery = useQuery<any[]>({
    queryKey: ["/api/events/mine/submitted"],
    queryFn: () => fetchMine("/api/events/mine/submitted"),
    enabled: !!user,
  });
  const myMissedQuery = useQuery<any[]>({
    queryKey: ["/api/missed-connections/mine"],
    queryFn: () => fetchMine("/api/missed-connections/mine"),
    enabled: !!user,
  });
  const myGiftingQuery = useQuery<any[]>({
    queryKey: ["/api/gifting/mine"],
    queryFn: () => fetchMine("/api/gifting/mine"),
    enabled: !!user,
  });
  const myCheckInsQuery = useQuery<any[]>({
    queryKey: ["/api/events/mine/check-ins"],
    queryFn: () => fetchMine("/api/events/mine/check-ins"),
    enabled: !!user,
  });
  const followStatsQuery = useQuery<{ followers: number; following: number }>({
    queryKey: ["/api/users/me/follow-stats"],
    queryFn: () => fetchMine("/api/users/me/follow-stats"),
    enabled: !!user,
  });

  const myGigs = myGigsQuery.data ?? [];
  const myEvents = myEventsQuery.data ?? [];
  const submittedEvents = submittedEventsQuery.data ?? [];
  const myMissed = myMissedQuery.data ?? [];
  const myGifting = myGiftingQuery.data ?? [];
  const myCheckIns = myCheckInsQuery.data ?? [];

  const { data: adminSession } = useQuery<{ isAdmin?: boolean; isSuperAdmin?: boolean; isPrimaryOwner?: boolean; canManageTeam?: boolean } | null>({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const r = await fetch("/api/admin/me", { credentials: "include" });
      return r.ok ? r.json() : null;
    },
    enabled: !!user,
    retry: false,
  });

  const isAdmin = Boolean(user?.isAdmin || adminSession?.isAdmin);
  // Soft-launch: every signed-in member can post (server still enforces active status).
  const canPostToFeed = Boolean(user);
  const isSuperAdmin = Boolean(user?.isSuperAdmin || adminSession?.isSuperAdmin);
  // Owner + owner peers only (do NOT grant via isSuperAdmin alone).
  const canManageTeam = Boolean(user?.canManageTeam || adminSession?.canManageTeam);

  const { data: pendingAdmin = { count: 0, ownerCount: 0 } } = useQuery<{ count: number; ownerCount?: number }>({
    queryKey: ["/api/admin/pending-count"],
    queryFn: () =>
      fetch("/api/admin/pending-count", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : { count: 0, ownerCount: 0 },
      ),
    enabled: isAdmin,
    refetchInterval: 90_000,
  });
  const pendingCount = pendingAdmin.count || 0;
  const isPrimaryOwner = Boolean(user?.isPrimaryOwner);
  const ownerCount = isPrimaryOwner ? (pendingAdmin.ownerCount || 0) : 0;

  const dashboardQueryErrors = [
    myGigsQuery.isError && "gigs",
    myEventsQuery.isError && "claimed events",
    submittedEventsQuery.isError && "submitted events",
    myMissedQuery.isError && "missed connections",
    myGiftingQuery.isError && "gifting posts",
    myCheckInsQuery.isError && "check-ins",
  ].filter(Boolean) as string[];

  const retryDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/gigs/mine"] });
    queryClient.invalidateQueries({ queryKey: ["/api/events/mine/claimed"] });
    queryClient.invalidateQueries({ queryKey: ["/api/events/mine/submitted"] });
    queryClient.invalidateQueries({ queryKey: ["/api/missed-connections/mine"] });
    queryClient.invalidateQueries({ queryKey: ["/api/gifting/mine"] });
    queryClient.invalidateQueries({ queryKey: ["/api/events/mine/check-ins"] });
  };

  const hostUpdateMutation = useMutation({
    mutationFn: async ({ eventId, body }: { eventId: number; body: string }) => {
      const res = await fetch(`/api/events/${eventId}/host-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not post update");
      return res.json();
    },
    onSuccess: (data: { notified?: number }) => {
      const n = data?.notified ?? 0;
      toast({
        title: "Host update posted",
        description: n > 0
          ? `Visible on the event page. ${n} attendee${n === 1 ? "" : "s"} notified.`
          : "Visible on the event detail page.",
      });
      setHostUpdate("");
    },
    onError: () => toast({ title: "Error", description: "Could not post host update.", variant: "destructive" }),
  });

  const eventEditMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const path = isAdmin ? `/api/admin/events/${id}` : `/api/events/${id}/edit`;
      const res = await fetch(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Event updated!", description: "Your changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/events/mine/claimed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setEditingEvent(null);
      setEventForm(null);
    },
    onError: () => toast({ title: "Error", description: "Could not save event.", variant: "destructive" }),
  });

  const eventDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Delete failed");
      return payload;
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "Hidden from the public site. Restore anytime in Admin → Events.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events/mine/claimed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setEditingEvent(null);
      setEventForm(null);
    },
    onError: (err: Error) =>
      toast({ title: "Could not delete event", description: err.message, variant: "destructive" }),
  });

  const gigEditMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/gigs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs/mine"] });
      setEditingGig(null);
      toast({ title: "Gig post updated" });
    },
    onError: () => toast({ title: "Error", description: "Could not update gig post.", variant: "destructive" }),
  });

  useEffect(() => {
    if (!pendingEditEventId || !user) return;
    if (myEventsQuery.isLoading) return;
    const evt = myEvents.find((e) => String(e.id) === pendingEditEventId);
    if (!evt) {
      setPendingEditEventId(null);
      return;
    }
    setHubSection("events");
    setEditingEvent(evt);
    setHostUpdate("");
    setEventForm(eventToEditForm(evt));
    setPendingEditEventId(null);
  }, [pendingEditEventId, user, myEvents, myEventsQuery.isLoading]);

  useEffect(() => {
    if (!pendingEditGigId || !user) return;
    if (myGigsQuery.isLoading) return;
    const gig = myGigs.find((g) => String(g.id) === pendingEditGigId);
    if (!gig) {
      setPendingEditGigId(null);
      return;
    }
    setHubSection("events");
    setEditingGig(gig);
    setGigForm({
      title: gig.title || "",
      description: gig.description || "",
      skills: gig.skills || "",
      compensation: gig.compensation || "",
      location: gig.location || "",
    });
    setPendingEditGigId(null);
  }, [pendingEditGigId, user, myGigs, myGigsQuery.isLoading]);

  if (loading) {
    return (
      <div className="zine-page dash-page board-page">
        <div className="dash-inner" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BoardLoadingState label="Loading your hub" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Local demo: unlock Hub chrome with a shell user so layout can be reviewed.
    // Mutations still require a real session.
    if (isLocalDemo()) {
      const demoUser = getLocalDemoHubUser();
      return (
        <div className="dash-page hub-nested">
          <HubV2
            user={demoUser}
            isAdmin
            canPostToFeed={false}
            canManageTeam={false}
            pendingCount={0}
            ownerCount={0}
            isPrimaryOwner
            postsCount={0}
            followStats={{ followers: 0, following: 0 }}
            /* Empty → HubRightRail falls back to local demo next-moves / who-to-follow */
            goingEvents={[]}
            hostingEvents={[]}
            savedEvents={[]}
            eventsLoading={false}
            onLogout={() => setShowAuth(true)}
            errorBanner={
              <div
                role="status"
                style={{
                  marginBottom: 18,
                  padding: "14px 16px",
                  border: "1px solid color-mix(in srgb, #19e3ff 45%, #1c1c22)",
                  background: "rgba(25, 227, 255, 0.08)",
                  borderRadius: 12,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <p
                  className="dash-mono"
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "#e6e3da",
                    textTransform: "none",
                    letterSpacing: "0.04em",
                    lineHeight: 1.45,
                  }}
                >
                  <strong style={{ color: "#19e3ff" }}>Local demo hub</strong>
                  {" - "}
                  chrome only. Feed, posts, and admin tools need a real login.{" "}
                  <Link href={LOCAL_DEMO_PROFILE_PATH} style={{ color: "#ccff00" }}>
                    Open @{demoUser.username} profile →
                  </Link>
                </p>
                <button type="button" className="dash-btn dash-btn-lime" onClick={() => setShowAuth(true)}>
                  Log in for real hub
                </button>
              </div>
            }
            section={hubSection}
            onSectionChange={setHubSection}
            onEditProfile={() => setShowAuth(true)}
            eventsFocusSection={hubSection === "events" ? postsFocus : null}
          />
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        </div>
      );
    }

    return (
      <div className="zine-page dash-page board-page">
        <PageHeader
          section="Account"
          title="Your Hub"
          titleAccent="cyan"
          lede="Free, community-run. Log in to manage submissions, boards, and your feed."
        />
        <div className="dash-inner" style={{ minHeight: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, paddingTop: 48 }}>
          <p className="dash-mono" style={{ color: "#8c8980", textTransform: "none", letterSpacing: "0.04em" }}>You need to be logged in to view your dashboard.</p>
          <button type="button" className="dash-btn dash-btn-lime" onClick={() => setShowAuth(true)}>
            Log in / Join
          </button>
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const priorUsername = user?.username || "";
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ displayName, bio, avatarChoice, username: username.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      await refreshUser();
      setSaveMsg("Saved!");
      setEditMode(false);
      setTimeout(() => setSaveMsg(""), 2000);
      if (data.username && data.username !== priorUsername) {
        setLocation(`/u/${encodeURIComponent(data.username)}`);
      }
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: err.error || "Could not save profile", variant: "destructive" });
    }
    setSaving(false);
  };

  const saveEventEdit = () => {
    if (!editingEvent || !eventForm) return;
    eventEditMutation.mutate({ id: editingEvent.id, data: editFormToApiPayload(eventForm) });
  };

  const eventCount = submittedEvents.length + myEvents.length;
  const postsCount = eventCount + myGigs.length + myMissed.length + myGifting.length + myCheckIns.length;

  const goingEvents = myCheckIns.map(mapCheckInRow);
  const hostingEvents = [
    ...submittedEvents.map((evt: any) => mapEventRow(evt, `Submitted · ${evt.status}`)),
    ...myEvents.map((evt: any) => mapEventRow(evt, "Claimed")),
  ];

  const errorBanner =
    dashboardQueryErrors.length > 0 ? (
      <div
        role="alert"
        style={{
          marginBottom: 18,
          padding: "14px 16px",
          border: "1px solid var(--dash-orange)",
          background: "rgba(255,140,0,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          borderRadius: 12,
        }}
      >
        <p className="dash-mono" style={{ margin: 0, fontSize: 10.5, color: "#fff", textTransform: "none", letterSpacing: "0.04em" }}>
          Some hub sections could not load ({dashboardQueryErrors.join(", ")}).
        </p>
        <button type="button" className="dash-btn dash-btn-lime" onClick={retryDashboard}>
          Retry
        </button>
      </div>
    ) : null;

  const profileEditor = editMode ? (
    <DashboardProfileEditor
      user={user}
      username={username}
      setUsername={setUsername}
      displayName={displayName}
      setDisplayName={setDisplayName}
      bio={bio}
      setBio={setBio}
      avatarChoice={avatarChoice}
      setAvatarChoice={setAvatarChoice}
      saving={saving}
      saveMsg={saveMsg}
      onSave={handleSave}
      onRefresh={refreshUser}
    />
  ) : null;

  const eventsEditorSlot = (
    <>
      {editingEvent && eventForm && (
        <div style={{ marginBottom: 20 }}>
          <DashboardEventEditForm
            editingEvent={editingEvent}
            eventForm={eventForm}
            setEventForm={(fn) => setEventForm((prev: any) => (prev ? fn(prev) : prev))}
            hostUpdate={hostUpdate}
            setHostUpdate={setHostUpdate}
            onCancel={() => {
              setEditingEvent(null);
              setEventForm(null);
            }}
            onSave={saveEventEdit}
            onPostUpdate={() => editingEvent && hostUpdateMutation.mutate({ eventId: editingEvent.id, body: hostUpdate })}
            onDelete={
              isAdmin
                ? () => {
                    if (!editingEvent) return;
                    const ok = window.confirm(
                      `Delete “${editingEvent.title}”?\n\nThis hides it from the public site (status → HIDDEN). You can restore it from Admin → Events.`,
                    );
                    if (!ok) return;
                    eventDeleteMutation.mutate(editingEvent.id);
                  }
                : undefined
            }
            saving={eventEditMutation.isPending}
            posting={hostUpdateMutation.isPending}
            deleting={eventDeleteMutation.isPending}
          />
        </div>
      )}
      {editingGig && (
        <div style={{ marginBottom: 20 }}>
          <DashboardGigEditForm
            gigForm={gigForm}
            setGigForm={setGigForm}
            onSave={() => gigEditMutation.mutate({ id: editingGig.id, data: gigForm })}
            onCancel={() => setEditingGig(null)}
          />
        </div>
      )}
    </>
  );

  return (
    <div className="dash-page hub-nested">
      <HubV2
        user={user}
        isAdmin={isAdmin}
        canPostToFeed={canPostToFeed}
        canManageTeam={canManageTeam}
        pendingCount={pendingCount}
        ownerCount={ownerCount}
        isPrimaryOwner={isPrimaryOwner}
        postsCount={postsCount}
        followStats={followStatsQuery.data}
        goingEvents={goingEvents}
        hostingEvents={hostingEvents}
        savedEvents={[]}
        eventsLoading={myEventsQuery.isLoading || submittedEventsQuery.isLoading || myCheckInsQuery.isLoading}
        eventsEditorSlot={eventsEditorSlot}
        profileEditor={profileEditor}
        editMode={editMode}
        onEditProfile={() => {
          setHubSection("profile");
          setEditMode(true);
        }}
        onLogout={() => logout()}
        errorBanner={errorBanner}
        section={hubSection}
        onSectionChange={setHubSection}
        eventsFocusSection={hubSection === "events" ? postsFocus : null}
      />
    </div>
  );
}