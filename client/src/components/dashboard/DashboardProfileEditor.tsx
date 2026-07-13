import { useState } from "react";
import AvatarEditor from "@/components/AvatarEditor";
import { useToast } from "@/hooks/use-toast";
import { AVATAR_EMOJI_OPTIONS } from "@shared/avatarRings";
import { PROFILE_PHOTO_RULES_SUMMARY } from "@shared/boardModeration";
import { formatUsernameChangeDate, usernameChangeEligibility } from "@shared/username";

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

/** Whitelisted social platforms saved as socialLinks JSON via PUT /api/users/me. */
const SOCIAL_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "@handle" },
  { key: "tiktok", label: "TikTok", placeholder: "@handle" },
  { key: "soundcloud", label: "SoundCloud", placeholder: "@name or URL" },
  { key: "spotify", label: "Spotify", placeholder: "profile URL or name" },
  { key: "bluesky", label: "Bluesky", placeholder: "@handle.bsky.social" },
  { key: "x", label: "X", placeholder: "@handle" },
  { key: "facebook", label: "Facebook", placeholder: "page name or URL" },
  { key: "website", label: "Website", placeholder: "https://yoursite.com" },
  { key: "linktree", label: "Linktree", placeholder: "@handle or URL" },
  { key: "venmo", label: "Venmo · Tips", placeholder: "@handle" },
  { key: "onlyfans", label: "OnlyFans", placeholder: "@handle or URL" },
  { key: "fetlife", label: "FetLife", placeholder: "@handle or URL" },
];

function parseSocialLinks(raw: unknown): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Record<string, string>;
  return {};
}

export default function DashboardProfileEditor({
  user,
  username,
  setUsername,
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
  username: string;
  setUsername: (v: string) => void;
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
  const [pronouns, setPronouns] = useState<string>(user?.pronouns || "");
  const [location, setLocation] = useState<string>(user?.location || "");
  const [links, setLinks] = useState<Record<string, string>>(() => parseSocialLinks(user?.socialLinks));
  const [savingExtras, setSavingExtras] = useState(false);
  const { toast } = useToast();
  const { canChange: canChangeUsername, nextChangeAt } = usernameChangeEligibility(user?.usernameChangedAt);

  const setLink = (key: string, value: string) =>
    setLinks(prev => ({ ...prev, [key]: value }));

  /** Save pronouns/location/socialLinks through the same PUT /api/users/me flow, then run the existing save. */
  const handleSave = async () => {
    setSavingExtras(true);
    try {
      const socialLinks: Record<string, string> = {};
      for (const field of SOCIAL_FIELDS) {
        const value = (links[field.key] || "").trim();
        if (value) socialLinks[field.key] = value.slice(0, 120);
      }
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          pronouns: pronouns.trim().slice(0, 40),
          location: location.trim().slice(0, 80),
          socialLinks,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.error || "Could not save profile", variant: "destructive" });
        return;
      }
    } catch {
      toast({ title: "Could not save profile", variant: "destructive" });
      return;
    } finally {
      setSavingExtras(false);
    }
    onSave();
  };

  const busy = saving || savingExtras;

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
      <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "var(--text-meta)", lineHeight: 1.5, maxWidth: 560 }}>
        {PROFILE_PHOTO_RULES_SUMMARY}
      </p>
      <AvatarEditor
        photoUrl={user.photoUrl}
        avatarRing={user.avatarRing}
        avatarCrop={user.avatarCrop}
        avatarChoice={avatarChoice}
        displayName={displayName}
        username={user.username}
        onSaved={() => void onRefresh()}
      />
      <label style={labelStyle}>Username</label>
      <input
        style={{
          ...inputStyle,
          ...(canChangeUsername ? {} : { color: "var(--text-lo)", cursor: "not-allowed" }),
        }}
        value={username}
        onChange={e => setUsername(e.target.value.replace(/^@/, "").toLowerCase())}
        readOnly={!canChangeUsername}
        aria-readonly={!canChangeUsername}
        maxLength={32}
        placeholder="your_handle"
        autoComplete="username"
      />
      <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "var(--text-lo)", lineHeight: 1.4 }}>
        {canChangeUsername
          ? "Your @handle powers your profile link and login. You can change it once every 6 months."
          : `You can change your username again on ${formatUsernameChangeDate(nextChangeAt)}.`}
      </p>
      <label style={labelStyle}>Display name</label>
      <input style={inputStyle} value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={40} />
      <label style={labelStyle}>Bio <span style={{ color: "var(--text-meta)", fontWeight: 400 }}>({bio.length}/160)</span></label>
      <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
        value={bio} onChange={e => setBio(e.target.value)} maxLength={160} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0 14px" }}>
        <div>
          <label style={labelStyle}>Pronouns</label>
          <input
            style={inputStyle}
            value={pronouns}
            onChange={e => setPronouns(e.target.value)}
            maxLength={40}
            placeholder="they / she"
          />
        </div>
        <div>
          <label style={labelStyle}>Location</label>
          <input
            style={inputStyle}
            value={location}
            onChange={e => setLocation(e.target.value)}
            maxLength={80}
            placeholder="SE Portland, OR"
          />
        </div>
      </div>

      <label style={labelStyle}>
        Social links{" "}
        <span style={{ color: "var(--text-meta)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
         , shown on your public profile at /u/{username || user?.username}
        </span>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {SOCIAL_FIELDS.map(field => (
          <div key={field.key}>
            <label style={{ ...labelStyle, marginTop: 0, marginBottom: 4, fontSize: "0.62rem" }}>{field.label}</label>
            <input
              style={inputStyle}
              value={links[field.key] || ""}
              onChange={e => setLink(field.key, e.target.value)}
              maxLength={120}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20, alignItems: "center" }}>
        <button onClick={() => void handleSave()} disabled={busy} className="dash-btn dash-btn-lime active">
          {busy ? "Saving..." : "Save profile"}
        </button>
        {saveMsg && <span style={{ color: "#C8FA3C" }}>{saveMsg}</span>}
      </div>
    </section>
  );
}

export { labelStyle, inputStyle };
