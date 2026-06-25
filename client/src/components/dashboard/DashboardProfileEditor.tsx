import AvatarEditor from "@/components/AvatarEditor";
import { AVATAR_EMOJI_OPTIONS } from "@shared/avatarRings";

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-display)", fontWeight: 900,
  fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
  color: "var(--text-meta)", marginBottom: 6, marginTop: 16,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #333",
  fontSize: "0.9rem", background: "#0d0d0d", color: "#fff",
  fontFamily: "var(--font-body)", boxSizing: "border-box",
};

export default function DashboardProfileEditor({
  user,
  displayName,
  setDisplayName,
  bio,
  setBio,
  avatarChoice,
  setAvatarChoice,
  saving,
  saveMsg,
  onSave,
  onRefresh,
}: {
  user: any;
  displayName: string;
  setDisplayName: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  avatarChoice: number;
  setAvatarChoice: (v: number) => void;
  saving: boolean;
  saveMsg: string;
  onSave: () => void;
  onRefresh: () => void;
}) {
  return (
    <section className="dash-edit-panel" style={{ borderColor: "#C8FA3C", marginBottom: 24 }}>
      <h2 className="dash-anton" style={{ fontSize: "1.3rem", color: "#C8FA3C", marginBottom: 24 }}>Edit profile</h2>
      <label style={labelStyle}>Your avatar</label>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        {AVATAR_EMOJI_OPTIONS.map(a => (
          <button key={a.id} onClick={() => setAvatarChoice(a.id)} title={a.label} style={{
            width: 52, height: 52, borderRadius: "50%",
            background: a.bg, border: avatarChoice === a.id ? "3px solid #C8FA3C" : "3px solid #333",
            fontSize: "1.5rem", cursor: "pointer",
          }}>{a.emoji}</button>
        ))}
      </div>
      <label style={labelStyle}>Profile photo & ring</label>
      <AvatarEditor
        photoUrl={user.photoUrl}
        avatarRing={user.avatarRing}
        avatarCrop={user.avatarCrop}
        avatarChoice={avatarChoice}
        displayName={displayName}
        username={user.username}
        onSaved={() => void onRefresh()}
      />
      <label style={labelStyle}>Display name</label>
      <input style={inputStyle} value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={40} />
      <label style={labelStyle}>Bio <span style={{ color: "var(--text-meta)", fontWeight: 400 }}>({bio.length}/160)</span></label>
      <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
        value={bio} onChange={e => setBio(e.target.value)} maxLength={160} />
      <div style={{ display: "flex", gap: 12, marginTop: 20, alignItems: "center" }}>
        <button onClick={onSave} disabled={saving} className="dash-btn dash-btn-lime active">
          {saving ? "Saving..." : "Save profile"}
        </button>
        {saveMsg && <span style={{ color: "#C8FA3C" }}>{saveMsg}</span>}
      </div>
    </section>
  );
}

export { labelStyle, inputStyle };