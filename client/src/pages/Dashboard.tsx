import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import ImageUploader from "@/components/ImageUploader";

const AVATARS = [
  { id: 1, emoji: "🐱", bg: "#00FFFF", label: "Cyan Cat" },
  { id: 2, emoji: "🦋", bg: "#FF00CC", label: "Magenta Butterfly" },
  { id: 3, emoji: "🐍", bg: "#CCFF00", label: "Neon Snake" },
  { id: 4, emoji: "🌙", bg: "#8800FF", label: "Violet Moon" },
  { id: 5, emoji: "🔥", bg: "#FF6600", label: "Orange Flame" },
  { id: 6, emoji: "⚡", bg: "#fff", label: "White Lightning" },
];

const EVENT_TYPES = ["Dance Party", "Drag", "Kink", "Social", "Brunch", "Performance", "Fair", "Education", "Trans", "Nightlife", "Sex Positive", "Nudity OK", "Other"];
const NEIGHBORHOODS = ["NE Portland", "SE Portland", "N Portland", "NW Portland", "SW Portland", "Downtown", "Pearl District", "Other"];

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
  const [editingGig, setEditingGig] = useState<any>(null);
  const [gigForm, setGigForm] = useState({ title: "", description: "", skills: "", compensation: "", location: "" });

  const { data: myGigs = [] } = useQuery<any[]>({
    queryKey: ["/api/gigs/mine"],
    queryFn: () => fetch("/api/gigs/mine").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: myEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/events/mine/claimed"],
    queryFn: () => fetch("/api/events/mine/claimed").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: submittedEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/events/mine/submitted"],
    queryFn: () => fetch("/api/events/mine/submitted").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: myMissed = [] } = useQuery<any[]>({
    queryKey: ["/api/missed-connections/mine"],
    queryFn: () => fetch("/api/missed-connections/mine").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: myGifting = [] } = useQuery<any[]>({
    queryKey: ["/api/gifting/mine"],
    queryFn: () => fetch("/api/gifting/mine").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: myCheckIns = [] } = useQuery<any[]>({
    queryKey: ["/api/events/mine/check-ins"],
    queryFn: () => fetch("/api/events/mine/check-ins").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: unread = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () => fetch("/api/messages/unread-count").then(r => r.ok ? r.json() : { count: 0 }),
    enabled: !!user,
    refetchInterval: 90000,
  });

  const eventEditMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/events/${id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

  const gigEditMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/gigs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div className="display" style={{ fontSize: "2rem", color: "#fff" }}>MY DASHBOARD</div>
        <p style={{ color: "#666" }}>You need to be logged in to view your dashboard.</p>
        <AuthModal onClose={() => {}} />
      </div>
    );
  }

  const avatar = AVATARS.find(a => a.id === (user.avatarChoice || 1)) || AVATARS[0];
  const initial = (user.displayName || user.username || "?").trim().slice(0, 1).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
    await fetch(`/api/gigs/${id}`, { method: "DELETE" });
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
    await fetch(`/api/missed-connections/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["/api/missed-connections/mine"] });
  };

  const startEventEdit = (evt: any) => {
    setEditingEvent(evt);
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

  const toggleType = (t: string) => setEventForm((f: any) => ({
    ...f,
    eventTypes: f.eventTypes.includes(t) ? f.eventTypes.filter((x: string) => x !== t) : [...f.eventTypes, t],
  }));

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 48, flexWrap: "wrap" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: avatar.bg, border: "3px solid #000",
            boxShadow: `0 0 16px ${avatar.bg}66`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", overflow: "hidden", position: "relative",
          }}>
            {user.photoUrl
              ? <img src={user.photoUrl} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
              : <span className="display" style={{ color: "#CCFF00", background: "#000", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{initial}</span>
            }
          </div>
          <div>
            <h1 className="display" style={{ fontSize: "2.4rem", color: "#CCFF00", lineHeight: 1 }}>
              {user.displayName || user.username}
            </h1>
            <div style={{ color: "#555", fontSize: "0.85rem", marginTop: 4 }}>@{user.username} · {user.email}</div>
            {user.bio && <p style={{ color: "#aaa", maxWidth: 520, marginTop: 8, lineHeight: 1.5 }}>{user.bio}</p>}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button onClick={() => setEditMode(!editMode)} style={{
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.78rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: editMode ? "#CCFF00" : "transparent",
              color: editMode ? "#000" : "#CCFF00",
              border: "2px solid #CCFF00", padding: "8px 18px", cursor: "pointer",
            }}>
              {editMode ? "CANCEL" : "EDIT PROFILE"}
            </button>
            <button onClick={() => logout()} style={{
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.78rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: "transparent", color: "#555",
              border: "2px solid #333", padding: "8px 18px", cursor: "pointer",
            }}>SIGN OUT</button>
          </div>
        </div>

        {/* Edit Profile */}
        {editMode && (
          <section style={{ marginBottom: 48, background: "#0a0a0a", border: "2px solid #CCFF00", padding: "28px 32px" }}>
            <h2 className="display" style={{ fontSize: "1.3rem", color: "#CCFF00", marginBottom: 24 }}>EDIT PROFILE</h2>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>YOUR AVATAR</label>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                {AVATARS.map(a => (
                  <button key={a.id} onClick={() => setAvatarChoice(a.id)} title={a.label} style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: a.bg, border: avatarChoice === a.id ? "3px solid #CCFF00" : "3px solid #333",
                    boxShadow: avatarChoice === a.id ? `0 0 12px #CCFF00` : "none",
                    fontSize: "1.5rem", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{a.emoji}</button>
                ))}
              </div>
            </div>
            <label style={labelStyle}>PROFILE PHOTO (optional)</label>
            <ImageUploader
              endpoint="/api/upload/avatar"
              fieldName="avatar"
              currentUrl={user.photoUrl || ""}
              onUploaded={() => {}}
              label="UPLOAD PHOTO"
            />
            <label style={labelStyle}>DISPLAY NAME</label>
            <input style={inputStyle} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How you appear to others" maxLength={40} />
            <label style={labelStyle}>BIO <span style={{ color: "#555", fontWeight: 400 }}>({bio.length}/160)</span></label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
              value={bio} onChange={e => setBio(e.target.value)} placeholder="A little about yourself..." maxLength={160} />
            <div style={{ display: "flex", gap: 12, marginTop: 20, alignItems: "center" }}>
              <button onClick={handleSave} disabled={saving} style={{
                fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.9rem",
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: "#CCFF00", color: "#000",
                border: "2px solid #000", padding: "10px 24px", cursor: "pointer",
                boxShadow: "3px 3px 0 #000",
              }}>{saving ? "SAVING..." : "SAVE PROFILE"}</button>
              {saveMsg && <span style={{ color: "#CCFF00", fontFamily: "var(--font-display)", fontSize: "0.85rem" }}>{saveMsg}</span>}
            </div>
          </section>
        )}

        {/* Account Connections */}
        <section style={{ marginBottom: 48, background: "#080808", border: "1px solid #1a1a1a", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 className="display" style={{ fontSize: "1.1rem", color: "#fff", marginBottom: 4 }}>ACCOUNT CONNECTIONS</h2>
            <div style={{ color: user.googleLinked ? "#CCFF00" : "#777", fontSize: "0.86rem" }}>
              Google is {user.googleLinked ? "linked to this profile." : "not linked yet."}
            </div>
          </div>
          {user.googleLinked ? (
            <span className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00" }}>GOOGLE LINKED</span>
          ) : (
            <a href="/api/auth/google?link=1" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: "#fff", border: "2px solid #fff", padding: "10px 18px", textDecoration: "none", display: "inline-block", boxShadow: "3px 3px 0 #00FFFF" }}>
              LINK GOOGLE →
            </a>
          )}
        </section>

        {/* My Events */}
        <section style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <h2 className="display" style={{ fontSize: "1.5rem", color: "#00FFFF" }}>MY EVENTS</h2>
              <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
            </div>

            {/* Event Edit Form */}
            {editingEvent && eventForm && (
              <div style={{ background: "#0a0a0a", border: "2px solid #00FFFF", padding: "28px 32px", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 className="display" style={{ fontSize: "1.1rem", color: "#00FFFF" }}>EDITING: {editingEvent.title}</h3>
                  <button onClick={() => { setEditingEvent(null); setEventForm(null); }} style={{ background: "none", border: "1px solid #333", color: "#666", padding: "4px 12px", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "0.72rem", letterSpacing: "0.08em" }}>CANCEL</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={labelStyle}>Event Title *</label>
                      <input style={inputStyle} value={eventForm.title} onChange={e => setEventForm((f: any) => ({ ...f, title: e.target.value }))} required />
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={labelStyle}>Description *</label>
                      <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={eventForm.description} onChange={e => setEventForm((f: any) => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Venue Name *</label>
                      <input style={inputStyle} value={eventForm.venueName} onChange={e => setEventForm((f: any) => ({ ...f, venueName: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Neighborhood</label>
                      <select style={inputStyle} value={eventForm.neighborhood} onChange={e => setEventForm((f: any) => ({ ...f, neighborhood: e.target.value }))}>
                        {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={labelStyle}>Address *</label>
                      <input style={inputStyle} value={eventForm.address} onChange={e => setEventForm((f: any) => ({ ...f, address: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Day</label>
                      <select style={inputStyle} value={eventForm.dayOfWeek} onChange={e => setEventForm((f: any) => ({ ...f, dayOfWeek: e.target.value }))}>
                        <option value="THU">Thursday July 16</option>
                        <option value="FRI">Friday July 17</option>
                        <option value="SAT">Saturday July 18</option>
                        <option value="SUN">Sunday July 19</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Age Requirement</label>
                      <select style={inputStyle} value={eventForm.ageRequirement} onChange={e => setEventForm((f: any) => ({ ...f, ageRequirement: e.target.value }))}>
                        <option value="ALL_AGES">All Ages</option>
                        <option value="18_PLUS">18+</option>
                        <option value="21_PLUS">21+</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Start</label>
                      <input type="datetime-local" style={inputStyle} value={eventForm.dateStart} onChange={e => setEventForm((f: any) => ({ ...f, dateStart: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>End</label>
                      <input type="datetime-local" style={inputStyle} value={eventForm.dateEnd} onChange={e => setEventForm((f: any) => ({ ...f, dateEnd: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Admission</label>
                      <select style={inputStyle} value={eventForm.admission} onChange={e => setEventForm((f: any) => ({ ...f, admission: e.target.value }))}>
                        <option value="FREE">Free</option>
                        <option value="TICKETED">Ticketed</option>
                        <option value="SUGGESTED_DONATION">Suggested Donation</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={labelStyle}>Ticket / RSVP Link *</label>
                      <input type="url" style={inputStyle} value={eventForm.ticketUrl} onChange={e => setEventForm((f: any) => ({ ...f, ticketUrl: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={labelStyle}>Event Flyer / Poster</label>
                      <ImageUploader
                        endpoint="/api/upload/poster"
                        fieldName="poster"
                        currentUrl={eventForm.posterImageUrl}
                        onUploaded={url => setEventForm((f: any) => ({ ...f, posterImageUrl: url }))}
                        label="UPLOAD FLYER"
                      />
                    </div>
                  </div>

                  {/* Event Types */}
                  <div>
                    <label style={labelStyle}>Event Types</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {EVENT_TYPES.map(t => (
                        <button key={t} type="button" onClick={() => toggleType(t)}
                          className={`filter-tag ${eventForm.eventTypes.includes(t) ? "active" : ""}`}>{t}</button>
                      ))}
                    </div>
                  </div>

                  {/* Flags */}
                  <div>
                    <label style={labelStyle}>Flags</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
                      {[["isHouseParty", "House Party"], ["isSexPositive", "Sex Positive"], ["nudityOk", "Nudity OK"]].map(([k, lbl]) => (
                        <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "7px 12px", border: "1px solid #222", background: eventForm[k] ? "#1a1a0a" : "transparent" }}>
                          <input type="checkbox" checked={!!eventForm[k]} onChange={() => setEventForm((f: any) => ({ ...f, [k]: !f[k] }))} style={{ accentColor: "var(--neon-yellow)" }} />
                          <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: eventForm[k] ? "var(--neon-yellow)" : "#666" }}>{lbl}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button onClick={saveEventEdit} disabled={eventEditMutation.isPending} style={{
                    fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.9rem",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    background: "#00FFFF", color: "#000",
                    border: "none", padding: "12px 28px", cursor: "pointer",
                    boxShadow: "3px 3px 0 #000", alignSelf: "flex-start",
                  }}>{eventEditMutation.isPending ? "SAVING..." : "SAVE EVENT →"}</button>
                </div>
              </div>
            )}

            {/* Event list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {submittedEvents.map((evt: any) => (
                <div key={`submitted-${evt.id}`} style={{ background: "#080808", border: "1px solid #1a1a1a", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div className="display" style={{ fontSize: "0.95rem", color: "#fff" }}>{evt.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 2 }}>
                      {evt.dayOfWeek} · {evt.venueName}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: "var(--font-display)", fontSize: "0.65rem", letterSpacing: "0.1em",
                    padding: "3px 8px", border: "1px solid #FF00CC", color: "#FF00CC",
                  }}>SUBMITTED · {evt.status}</span>
                </div>
              ))}
              {myEvents.map((evt: any) => (
                <div key={evt.id} style={{ background: "#080808", border: "1px solid #1a1a1a", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div className="display" style={{ fontSize: "0.95rem", color: "#fff" }}>{evt.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 2 }}>
                      {evt.dayOfWeek} · {evt.venueName}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: "var(--font-display)", fontSize: "0.65rem", letterSpacing: "0.1em",
                    padding: "3px 8px", border: `1px solid #00FFFF`, color: "#00FFFF",
                  }}>CLAIMED</span>
                  <button onClick={() => startEventEdit(evt)} style={{
                    fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.7rem",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    background: "none", border: "1px solid #00FFFF", color: "#00FFFF",
                    padding: "4px 10px", cursor: "pointer",
                  }}>EDIT</button>
                </div>
              ))}
              {submittedEvents.length === 0 && myEvents.length === 0 && (
                <div style={{ color: "#444", fontSize: "0.9rem", padding: "10px 0" }}>No submitted or claimed events yet.</div>
              )}
            </div>
          </section>

        {/* My Gig Posts */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <h2 className="display" style={{ fontSize: "1.5rem", color: "#FF6600" }}>MY GIG POSTS</h2>
            <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
          </div>
          {myGigs.length === 0 ? (
            <div style={{ color: "#444", fontSize: "0.9rem", padding: "20px 0" }}>
              No gig posts yet.{" "}
              <a href="#/pride-work" style={{ color: "#FF6600" }}>Post one on the Pride Work board →</a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {editingGig && (
                <div style={{ background: "#0a0a0a", border: "2px solid #FF6600", padding: "20px", marginBottom: 8 }}>
                  <h3 className="display" style={{ color: "#FF6600", fontSize: "1rem", marginBottom: 12 }}>EDIT GIG POST</h3>
                  <input style={inputStyle} value={gigForm.title} onChange={e => setGigForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" />
                  <textarea style={{ ...inputStyle, marginTop: 10, minHeight: 90, resize: "vertical" }} value={gigForm.description} onChange={e => setGigForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <input style={inputStyle} value={gigForm.skills} onChange={e => setGigForm(f => ({ ...f, skills: e.target.value }))} placeholder="Skills" />
                    <input style={inputStyle} value={gigForm.compensation} onChange={e => setGigForm(f => ({ ...f, compensation: e.target.value }))} placeholder="Compensation" />
                    <input style={inputStyle} value={gigForm.location} onChange={e => setGigForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => gigEditMutation.mutate({ id: editingGig.id, data: gigForm })} style={{ background: "#FF6600", color: "#000", border: "none", padding: "8px 16px", cursor: "pointer" }}>SAVE</button>
                    <button onClick={() => setEditingGig(null)} style={{ background: "transparent", color: "#666", border: "1px solid #333", padding: "8px 12px", cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}
              {myGigs.map((gig: any) => (
                <div key={gig.id} style={{ background: "#080808", border: "1px solid #1a1a1a", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div className="display" style={{ fontSize: "0.95rem", color: "#fff" }}>{gig.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 2 }}>
                      {gig.postType === "LOOKING_FOR_WORK" ? "Looking for Work" : "Posting a Gig"}
                      {gig.gigDate && ` · ${gig.gigDate}`}
                      {gig.gigTime && ` · ${gig.gigTime}`}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: "var(--font-display)", fontSize: "0.65rem", letterSpacing: "0.1em",
                    padding: "3px 8px", border: `1px solid ${gig.status === "LIVE" ? "#CCFF00" : "#555"}`,
                    color: gig.status === "LIVE" ? "#CCFF00" : "#555",
                  }}>{gig.status}</span>
                  <button onClick={() => startGigEdit(gig)} style={{
                    fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.7rem",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    background: "none", border: "1px solid #FF6600", color: "#FF6600",
                    padding: "4px 10px", cursor: "pointer",
                  }}>EDIT</button>
                  <button onClick={() => handleDeleteGig(gig.id)} style={{
                    fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.7rem",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    background: "none", border: "1px solid #FF2400", color: "#FF2400",
                    padding: "4px 10px", cursor: "pointer",
                  }}>DELETE</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Missed Connections */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <h2 className="display" style={{ fontSize: "1.5rem", color: "#FF00CC" }}>MY MISSED CONNECTIONS</h2>
            <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
          </div>
          {myMissed.length === 0 ? (
            <div style={{ color: "#444", fontSize: "0.9rem", padding: "10px 0" }}>No missed connections yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myMissed.map((post: any) => (
                <div key={post.id} style={{ background: "#080808", border: "1px solid #1a1a1a", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div className="display" style={{ fontSize: "0.95rem", color: "#fff" }}>{post.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 2 }}>{post.dayOfWeek || "Any day"}{post.venueHint ? ` · ${post.venueHint}` : ""}</div>
                  </div>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "0.65rem", letterSpacing: "0.1em", padding: "3px 8px", border: "1px solid #FF00CC", color: "#FF00CC" }}>{post.status}</span>
                  <a href="#/missed-connections" style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", color: "#FF00CC", textDecoration: "none", border: "1px solid #FF00CC", padding: "4px 10px" }}>EDIT</a>
                  <button onClick={() => handleDeleteMissed(post.id)} style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", background: "none", border: "1px solid #FF2400", color: "#FF2400", padding: "4px 10px", cursor: "pointer" }}>DELETE</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Gifting */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <h2 className="display" style={{ fontSize: "1.5rem", color: "#00FFFF" }}>MY GIFTING</h2>
            <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
            <a href="#/gifting" style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", color: "#00FFFF", textDecoration: "none", border: "1px solid #00FFFF", padding: "4px 10px" }}>OPEN BOARD</a>
          </div>
          {myGifting.length === 0 ? (
            <div style={{ color: "#444", fontSize: "0.9rem", padding: "10px 0" }}>No gifting posts yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myGifting.map((post: any) => (
                <div key={post.id} style={{ background: "#080808", border: `1px solid ${post.postType === "GIFT" ? "#CCFF00" : "#B451FF"}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div className="display" style={{ fontSize: "0.95rem", color: "#fff" }}>{post.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 2 }}>{post.postType === "ISO" ? "IN SEARCH OF" : post.postType} · {post.category} · {post.neighborhood}</div>
                  </div>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "0.65rem", letterSpacing: "0.1em", padding: "3px 8px", border: "1px solid #00FFFF", color: "#00FFFF" }}>{post.status}</span>
                  <span style={{ color: "#666", fontSize: "0.78rem" }}>{post.interestCount || 0} response{post.interestCount === 1 ? "" : "s"}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Check-Ins */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <h2 className="display" style={{ fontSize: "1.5rem", color: "#CCFF00" }}>MY CHECK-INS</h2>
            <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
          </div>
          {myCheckIns.length === 0 ? (
            <div style={{ color: "#444", fontSize: "0.9rem", padding: "10px 0" }}>No active check-ins yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myCheckIns.map((check: any) => (
                <div key={check.id} style={{ background: "#080808", border: "1px solid #1a1a1a", padding: "16px 20px" }}>
                  <div className="display" style={{ fontSize: "0.95rem", color: "#fff" }}>{check.eventTitle}</div>
                  <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 2 }}>{check.venueName} · {new Date(check.dateStart).toLocaleString()}</div>
                  <div style={{ color: "#CCFF00", marginTop: 8, fontSize: "0.85rem" }}>{check.message}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Inbox Preview */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <h2 className="display" style={{ fontSize: "1.5rem", color: "#00FFFF" }}>INBOX PREVIEW</h2>
            <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
          </div>
          <div style={{ background: "#080808", border: "1px solid #1a1a1a", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ color: "#aaa" }}>{unread.count} unread message{unread.count === 1 ? "" : "s"}</div>
            <a href="#/inbox" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: "#00FFFF", border: "2px solid #00FFFF", padding: "10px 20px", textDecoration: "none", display: "inline-block" }}>OPEN INBOX →</a>
          </div>
        </section>

        {/* Quick links */}
        <section>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="#/inbox" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: "#00FFFF", border: "2px solid #00FFFF", padding: "10px 20px", textDecoration: "none", display: "inline-block" }}>INBOX →</a>
            <a href="#/events" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: "#FF00CC", border: "2px solid #FF00CC", padding: "10px 20px", textDecoration: "none", display: "inline-block" }}>VIEW EVENTS →</a>
            <a href="#/pride-work" style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: "#FF6600", border: "2px solid #FF6600", padding: "10px 20px", textDecoration: "none", display: "inline-block" }}>GIG BOARD →</a>
          </div>
        </section>

      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-display)", fontWeight: 900,
  fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
  color: "#666", marginBottom: 6, marginTop: 16,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #333",
  fontSize: "0.9rem", background: "#0d0d0d", color: "#fff",
  fontFamily: "var(--font-body)", boxSizing: "border-box",
};
