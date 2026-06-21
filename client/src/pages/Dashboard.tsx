import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AuthModal from "@/components/AuthModal";

const AVATARS = [
  { id: 1, emoji: "🐱", bg: "#00FFFF", label: "Cyan Cat" },
  { id: 2, emoji: "🦋", bg: "#FF00CC", label: "Magenta Butterfly" },
  { id: 3, emoji: "🐍", bg: "#CCFF00", label: "Neon Snake" },
  { id: 4, emoji: "🌙", bg: "#8800FF", label: "Violet Moon" },
  { id: 5, emoji: "🔥", bg: "#FF6600", label: "Orange Flame" },
  { id: 6, emoji: "⚡", bg: "#fff", label: "White Lightning" },
];

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarChoice, setAvatarChoice] = useState(user?.avatarChoice || 1);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const { data: myGigs = [] } = useQuery<any[]>({
    queryKey: ["/api/gigs/mine"],
    queryFn: () => fetch("/api/gigs/mine").then(r => r.ok ? r.json() : []),
    enabled: !!user,
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
            fontSize: "2rem",
          }}>{avatar.emoji}</div>
          <div>
            <h1 className="display" style={{ fontSize: "2.4rem", color: "#CCFF00", lineHeight: 1 }}>
              {user.displayName || user.username}
            </h1>
            <div style={{ color: "#555", fontSize: "0.85rem", marginTop: 4 }}>@{user.username} · {user.email}</div>
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

            {/* Avatar picker */}
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
              {myGigs.map((gig: any) => (
                <div key={gig.id} style={{
                  background: "#080808", border: "1px solid #1a1a1a",
                  padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                }}>
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

        {/* Quick links */}
        <section>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="#/inbox" style={{
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: "transparent", color: "#00FFFF",
              border: "2px solid #00FFFF", padding: "10px 20px", textDecoration: "none",
              display: "inline-block",
            }}>INBOX →</a>
            <a href="#/events" style={{
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: "transparent", color: "#FF00CC",
              border: "2px solid #FF00CC", padding: "10px 20px", textDecoration: "none",
              display: "inline-block",
            }}>VIEW EVENTS →</a>
            <a href="#/pride-work" style={{
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: "transparent", color: "#FF6600",
              border: "2px solid #FF6600", padding: "10px 20px", textDecoration: "none",
              display: "inline-block",
            }}>GIG BOARD →</a>
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
