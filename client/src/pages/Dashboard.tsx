import { useState, createElement, Fragment } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import PageHero from "@/components/PageHero";
import ScrollReveal from "@/components/ScrollReveal";
import UserAvatar from "@/components/UserAvatar";
import DashboardDrawer, { DashboardItemRow } from "@/components/dashboard/DashboardDrawer";
import DashboardInboxPreview from "@/components/dashboard/DashboardInboxPreview";
import DashboardWidgets from "@/components/dashboard/DashboardWidgets";
import DashboardProfileEditor from "@/components/dashboard/DashboardProfileEditor";
import { DashboardEventEditForm, DashboardGigEditForm } from "@/components/dashboard/DashboardEventEditor";
import "@/components/dashboard/dashboard.css";

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarChoice, setAvatarChoice] = useState(user?.avatarChoice || 1);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState<any>(null);
  const [hostUpdate, setHostUpdate] = useState("");
  const [editingGig, setEditingGig] = useState<any>(null);
  const [gigForm, setGigForm] = useState({ title: "", description: "", skills: "", compensation: "", location: "" });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ events: true });
  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

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

  const myGigs = myGigsQuery.data ?? [];
  const myEvents = myEventsQuery.data ?? [];
  const submittedEvents = submittedEventsQuery.data ?? [];
  const myMissed = myMissedQuery.data ?? [];
  const myGifting = myGiftingQuery.data ?? [];
  const myCheckIns = myCheckInsQuery.data ?? [];

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
          ? `Visible on the event page. ${n} attendee${n === 1 ? "" : "s"} notified in inbox.`
          : "Visible on the event detail page.",
      });
      setHostUpdate("");
    },
    onError: () => toast({ title: "Error", description: "Could not post host update.", variant: "destructive" }),
  });

  const eventEditMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/events/${id}/edit`, {
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
      setEditingEvent(null);
      setEventForm(null);
    },
    onError: () => toast({ title: "Error", description: "Could not save event.", variant: "destructive" }),
  });

  const giftingActionMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch(url, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error((await res.text()) || "Update failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifting/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gifting"] });
      toast({ title: "Gifting post updated" });
    },
    onError: () => toast({ title: "Could not update gifting post", variant: "destructive" }),
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

  if (!user) {
    return (
      <div className="zine-page dash-page board-page">
        <PageHero
          kicker="YOUR HUB"
          titleLine1="SIGN IN TO"
          titleLine2="YOUR PROFILE"
          accent="cyan"
          lede="Profile, inbox, event submissions, gig posts, gifting, and missed connections — all in one place once you're logged in."
          bgImage="/motifs/hero-inbox.jpg"
          bgPosition="center 35%"
        />
        <div className="dash-inner" style={{ minHeight: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, paddingTop: 48 }}>
          <p className="dash-mono" style={{ color: "#8c8980", textTransform: "none", letterSpacing: "0.04em" }}>You need to be logged in to view your dashboard.</p>
          <AuthModal onClose={() => {}} />
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ displayName, bio, avatarChoice }),
    });
    if (res.ok) {
      await refreshUser();
      setSaveMsg("Saved!");
      setEditMode(false);
      setTimeout(() => setSaveMsg(""), 2000);
    }
    setSaving(false);
  };

  const handleDeleteGig = async (id: number) => {
    if (!confirm("Delete this gig post?")) return;
    await fetch(`/api/gigs/${id}`, { method: "DELETE", credentials: "include" });
    queryClient.invalidateQueries({ queryKey: ["/api/gigs/mine"] });
  };

  const startGigEdit = (gig: any) => {
    setEditingGig(gig);
    setGigForm({
      title: gig.title || "",
      description: gig.description || "",
      skills: gig.skills || "",
      compensation: gig.compensation || "",
      location: gig.location || "",
    });
  };

  const handleDeleteMissed = async (id: number) => {
    if (!confirm("Delete this missed connection?")) return;
    await fetch(`/api/missed-connections/${id}`, { method: "DELETE", credentials: "include" });
    queryClient.invalidateQueries({ queryKey: ["/api/missed-connections/mine"] });
  };

  const startEventEdit = (evt: any) => {
    setEditingEvent(evt);
    setHostUpdate("");
    setEventForm({
      title: evt.title || "",
      description: evt.description || "",
      venueName: evt.venueName || "",
      address: evt.address || "",
      neighborhood: evt.neighborhood || "SE Portland",
      dateStart: evt.dateStart || "",
      dateEnd: evt.dateEnd || "",
      dayOfWeek: evt.dayOfWeek || "FRI",
      ageRequirement: evt.ageRequirement || "ALL_AGES",
      admission: evt.admission || "FREE",
      ticketUrl: evt.ticketUrl || "",
      posterImageUrl: evt.posterImageUrl || "",
      isHouseParty: !!evt.isHouseParty,
      isSexPositive: !!evt.isSexPositive,
      nudityOk: !!evt.nudityOk,
      eventTypes: JSON.parse(evt.eventTypes || "[]"),
    });
  };

  const saveEventEdit = () => {
    if (!editingEvent || !eventForm) return;
    eventEditMutation.mutate({ id: editingEvent.id, data: eventForm });
  };

  const eventCount = submittedEvents.length + myEvents.length;
  const CYAN = "#19E3FF";
  const LIME = "#C8FA3C";
  const MAGENTA = "#FF1FA0";
  const ORANGE = "#FF8C00";

  return (
    <div className="zine-page dash-page board-page">
      <PageHero
        flush
        compact
        kicker="YOUR HUB · PROFILE & BOARDS"
        titleLine1="YOUR"
        titleLine2="DASHBOARD"
        accent="cyan"
        lede="Manage your profile, inbox, claimed events, gig posts, gifting listings, missed connections, and check-ins — everything you touch on PDX Pride Guide lives here."
        tagline={createElement(Fragment, null, "@", user.username, " · ", createElement("a", { href: "#profile", className: "dash-tagline-link", onClick: (e) => { e.preventDefault(); document.getElementById("profile")?.scrollIntoView({behavior:"smooth"}); } }, "profile"), " · ", createElement("a", { href: "#events", className: "dash-tagline-link", onClick: (e) => { e.preventDefault(); setOpenSections((prev) => ({...prev, events: true})); document.getElementById("events")?.scrollIntoView({behavior:"smooth"}); } }, "events"), " · ", createElement("a", { href: "#/inbox", className: "dash-tagline-link" }, "inbox"), " · ", createElement("a", { href: "#events", className: "dash-tagline-link", onClick: (e) => { e.preventDefault(); setOpenSections((prev) => ({...prev, events: true})); document.getElementById("events")?.scrollIntoView({behavior:"smooth"}); } }, "submissions"))}
        taglineAccent="cyan"
        bgImage="/motifs/hero-inbox.jpg"
        bgPosition="center 35%"
      />
      <div className="dash-inner">
        <header id="profile" className="dash-profile-header">
          <div className="dash-profile-identity">
            <div className="dash-avatar-ring">
              <UserAvatar
                photoUrl={user.photoUrl}
                avatarChoice={user.avatarChoice}
                avatarRing={user.avatarRing}
                displayName={user.displayName}
                username={user.username}
                size={80}
              />
            </div>
            <div>
              <h2 className="dash-title dash-anton">{user.displayName || user.username}</h2>
              <p className="dash-subtitle">@{user.username} · {user.email}</p>
              {user.bio && <p style={{ color: "#cbc8c0", maxWidth: 520, marginTop: 8, lineHeight: 1.5, fontSize: 14 }}>{user.bio}</p>}
            </div>
          </div>
          <div className="dash-actions">
            <button
              type="button"
              className={`dash-btn dash-btn-lime ${editMode ? "active" : ""}`}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "Cancel" : "Edit profile"}
            </button>
            <button type="button" className="dash-btn dash-btn-ghost" onClick={() => logout()}>
              Sign out
            </button>
          </div>
        </header>

        {dashboardQueryErrors.length > 0 && (
          <div
            role="alert"
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              border: "1px solid var(--dash-orange)",
              background: "rgba(255,140,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <p className="dash-mono" style={{ margin: 0, fontSize: 10.5, color: "#fff", textTransform: "none", letterSpacing: "0.04em" }}>
              Some dashboard sections could not load ({dashboardQueryErrors.join(", ")}).
            </p>
            <button type="button" className="dash-btn dash-btn-lime" onClick={retryDashboard}>
              Retry
            </button>
          </div>
        )}

        {editMode && (
          <DashboardProfileEditor
            user={user}
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
        )}

        <ScrollReveal>
        <div className="dash-top-grid">
          <DashboardInboxPreview enabled={!!user} />
          <DashboardWidgets />
        </div>
        </ScrollReveal>

        <ScrollReveal delay={60}>
        <section className="dash-connections">
          <div>
            <h2 className="dash-anton" style={{ fontSize: 18, color: "#fff", marginBottom: 4 }}>Account connections</h2>
            <p style={{ fontSize: 13, color: user.googleLinked ? LIME : "var(--dash-muted)" }}>
              Google is {user.googleLinked ? "linked to this profile." : "not linked yet."}
            </p>
          </div>
          {user.googleLinked ? (
            <span className="dash-chip" style={{ color: LIME }}>Google linked</span>
          ) : (
            <a href="/api/auth/google?link=1" className="dash-pill-btn" style={{ color: "#fff", borderColor: "#fff" }}>
              Link Google →
            </a>
          )}
        </section>
        </ScrollReveal>

        <ScrollReveal delay={120}>
        <div className="dash-drawers">
          <DashboardDrawer
            title="My events"
                    id="events"
            color={CYAN}
            countLabel={`${eventCount} total`}
            open={!!openSections.events}
            onToggle={() => toggleSection("events")}
            isEmpty={eventCount === 0}
            emptyText="No submitted or claimed events yet."
          >
            {editingEvent && eventForm && (
              <DashboardEventEditForm
                editingEvent={editingEvent}
                eventForm={eventForm}
                setEventForm={setEventForm}
                hostUpdate={hostUpdate}
                setHostUpdate={setHostUpdate}
                onCancel={() => { setEditingEvent(null); setEventForm(null); }}
                onSave={saveEventEdit}
                onPostUpdate={() => editingEvent && hostUpdateMutation.mutate({ eventId: editingEvent.id, body: hostUpdate })}
                saving={eventEditMutation.isPending}
                posting={hostUpdateMutation.isPending}
              />
            )}
            {submittedEvents.map((evt: any) => (
              <DashboardItemRow
                key={`submitted-${evt.id}`}
                color={MAGENTA}
                title={evt.title}
                meta={`${evt.dayOfWeek} · ${evt.venueName}`}
                chip={`Submitted · ${evt.status}`}
                chipColor={MAGENTA}
              />
            ))}
            {myEvents.map((evt: any) => (
              <DashboardItemRow
                key={evt.id}
                color={CYAN}
                title={evt.title}
                meta={`${evt.dayOfWeek} · ${evt.venueName}`}
                chip="Claimed"
                chipColor={CYAN}
                actions={
                  <button type="button" className="dash-mini-btn" style={{ color: CYAN }} onClick={() => startEventEdit(evt)}>
                    Edit
                  </button>
                }
              />
            ))}
          </DashboardDrawer>

          <DashboardDrawer
            title="Gig posts"
            color={ORANGE}
            countLabel={`${myGigs.length} posts`}
            open={!!openSections.gigs}
            onToggle={() => toggleSection("gigs")}
            isEmpty={myGigs.length === 0}
            emptyText="No gig posts yet."
            cta={{ label: "Post on Pride Werk board →", href: "#/pride-work" }}
          >
            {editingGig && (
              <DashboardGigEditForm
                gigForm={gigForm}
                setGigForm={setGigForm}
                onSave={() => gigEditMutation.mutate({ id: editingGig.id, data: gigForm })}
                onCancel={() => setEditingGig(null)}
              />
            )}
            {myGigs.map((gig: any) => (
              <DashboardItemRow
                key={gig.id}
                color={ORANGE}
                title={gig.title}
                meta={`${gig.postType === "LOOKING_FOR_WORK" ? "Looking for work" : "Posting a gig"}${gig.gigDate ? ` · ${gig.gigDate}` : ""}${gig.gigTime ? ` · ${gig.gigTime}` : ""}`}
                chip={gig.status}
                chipColor={gig.status === "LIVE" ? LIME : "#6f736c"}
                actions={
                  <>
                    <button type="button" className="dash-mini-btn" style={{ color: ORANGE }} onClick={() => startGigEdit(gig)}>Edit</button>
                    <button type="button" className="dash-mini-btn" style={{ color: "#FF2400" }} onClick={() => handleDeleteGig(gig.id)}>Delete</button>
                  </>
                }
              />
            ))}
          </DashboardDrawer>

          <DashboardDrawer
            title="Missed connections"
            color={MAGENTA}
            countLabel={`${myMissed.length} posts`}
            open={!!openSections.missed}
            onToggle={() => toggleSection("missed")}
            isEmpty={myMissed.length === 0}
            emptyText="No missed connections yet."
          >
            {myMissed.map((post: any) => (
              <DashboardItemRow
                key={post.id}
                color={MAGENTA}
                title={post.title}
                meta={`${post.eventTitle || post.venueHint || post.dayOfWeek || "Event"}${post.status !== "ACTIVE" ? ` · ${post.status}` : ""}`}
                chip={post.status}
                chipColor={MAGENTA}
                actions={
                  <>
                    <a href="#/spotted" className="dash-mini-btn" style={{ color: MAGENTA, textDecoration: "none" }}>Edit</a>
                    <button type="button" className="dash-mini-btn" style={{ color: "#FF2400" }} onClick={() => handleDeleteMissed(post.id)}>Delete</button>
                  </>
                }
              />
            ))}
          </DashboardDrawer>

          <DashboardDrawer
            title="Gifting"
            color={CYAN}
            countLabel={`${myGifting.length} posts`}
            open={!!openSections.gifting}
            onToggle={() => toggleSection("gifting")}
            isEmpty={myGifting.length === 0}
            emptyText="No gifting posts yet."
            cta={{ label: "Open gifting board →", href: "#/gifting" }}
          >
            {myGifting.map((post: any) => (
              <div key={post.id}>
                <DashboardItemRow
                  color={post.postType === "GIFT" ? LIME : "#B451FF"}
                  title={post.title}
                  meta={`${post.postType === "ISO" ? "In search of" : post.postType} · ${post.category} · ${post.neighborhood}`}
                  chip={post.status}
                  chipColor={CYAN}
                  actions={
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      <span className="dash-mono" style={{ fontSize: 10, color: "var(--dash-muted)", textTransform: "none" }}>
                        {post.interestCount || 0} response{(post.interestCount === 1) ? "" : "s"}
                      </span>
                      <a href="#/gifting" className="dash-mini-btn" style={{ color: CYAN, textDecoration: "none" }}>Board</a>
                      {post.postType === "GIFT" && !["GIFTED", "EXPIRED"].includes(post.status) && (
                        <button type="button" className="dash-mini-btn" style={{ color: LIME }} onClick={() => giftingActionMutation.mutate(`/api/gifting/${post.id}/mark-gifted`)}>Mark gifted</button>
                      )}
                      {post.postType === "ISO" && !["FOUND", "EXPIRED"].includes(post.status) && (
                        <button type="button" className="dash-mini-btn" style={{ color: LIME }} onClick={() => giftingActionMutation.mutate(`/api/gifting/${post.id}/mark-found`)}>Mark found</button>
                      )}
                      {!["GIFTED", "FOUND", "EXPIRED", "PENDING"].includes(post.status) && (
                        <button type="button" className="dash-mini-btn" style={{ color: CYAN }} onClick={() => giftingActionMutation.mutate(`/api/gifting/${post.id}/renew`)}>Renew</button>
                      )}
                    </div>
                  }
                />
                {(post.interests || []).filter((i: any) => i.status === "INTERESTED").slice(0, 3).map((interest: any) => (
                  <div key={interest.id} className="dash-item" style={{ marginLeft: 18, marginTop: -4, paddingTop: 0 }}>
                    <span className="dash-item-main">
                      <span className="dash-item-meta" style={{ textTransform: "none" }}>
                        {interest.displayName || interest.username}: {interest.note}
                      </span>
                    </span>
                    <div className="dash-item-actions">
                      <button
                        type="button"
                        className="dash-mini-btn"
                        style={{ color: LIME }}
                        onClick={() => giftingActionMutation.mutate(`/api/gifting/${post.id}/interests/${interest.id}/choose`)}
                      >
                        Pick
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </DashboardDrawer>

          <DashboardDrawer
            title="Check-ins"
            color={LIME}
            countLabel={`${myCheckIns.length} active`}
            open={!!openSections.checkins}
            onToggle={() => toggleSection("checkins")}
            isEmpty={myCheckIns.length === 0}
            emptyText="No active check-ins yet."
          >
            {myCheckIns.map((check: any) => (
              <DashboardItemRow
                key={check.id}
                color={LIME}
                title={check.eventTitle}
                meta={`${check.venueName} · ${new Date(check.dateStart).toLocaleString()}`}
                actions={
                  <span style={{ fontSize: 13, color: LIME, maxWidth: 200 }}>{check.message}</span>
                }
              />
            ))}
          </DashboardDrawer>
        </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
