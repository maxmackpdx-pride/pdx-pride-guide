import { useState } from "react";
import AvatarEditor from "@/components/AvatarEditor";
import CoverEditor from "@/components/CoverEditor";
import { useToast } from "@/hooks/use-toast";
import { AVATAR_EMOJI_OPTIONS } from "@shared/avatarRings";
import { PROFILE_PHOTO_RULES_SUMMARY } from "@shared/boardModeration";
import { formatUsernameChangeDate, usernameChangeEligibility } from "@shared/username";

/** Kept for DashboardEventEditor - event forms still use inline dash styles. */
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
    <section className="hub-v2-profile-editor" aria-label="Profile editor">
      <div className="hub-v2-profile-editor__block">
        <label className="hub-v2-profile-editor__label">Your avatar</label>
        <div className="hub-v2-profile-editor__avatars">
          {AVATAR_EMOJI_OPTIONS.map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAvatarChoice(a.id)}
              title={a.label}
              className={`hub-v2-profile-editor__avatar-btn${a.img ? " is-image" : ""}${avatarChoice === a.id ? " is-selected" : ""}`}
              style={a.img ? undefined : { background: a.bg }}
            >
              {a.img ? <img src={a.img} alt={a.label} /> : a.emoji}
            </button>
          ))}
        </div>
      </div>

      <div id="cover" className="hub-v2-profile-editor__block">
        <label className="hub-v2-profile-editor__label">Cover image</label>
        <p className="hub-v2-profile-editor__hint">
          Upload a wide photo for the banner behind your profile picture. Drag and zoom to position it on your public profile.
        </p>
        <CoverEditor
          coverImageUrl={user.coverImageUrl}
          coverCrop={user.coverCrop}
          onSaved={() => void onRefresh()}
        />
      </div>

      <div className="hub-v2-profile-editor__block">
        <label className="hub-v2-profile-editor__label">Profile photo &amp; ring</label>
        <p className="hub-v2-profile-editor__hint">{PROFILE_PHOTO_RULES_SUMMARY}</p>
        <AvatarEditor
          photoUrl={user.photoUrl}
          avatarRing={user.avatarRing}
          avatarCrop={user.avatarCrop}
          avatarChoice={avatarChoice}
          displayName={displayName}
          username={user.username}
          onSaved={() => void onRefresh()}
        />
      </div>

      <div className="hub-v2-profile-editor__block">
        <label className="hub-v2-profile-editor__label" htmlFor="hub-profile-username">
          Username
        </label>
        <input
          id="hub-profile-username"
          className="hub-v2-profile-editor__input"
          value={username}
          onChange={e => setUsername(e.target.value.replace(/^@/, "").toLowerCase())}
          readOnly={!canChangeUsername}
          aria-readonly={!canChangeUsername}
          maxLength={32}
          placeholder="your_handle"
          autoComplete="username"
        />
        <p className="hub-v2-profile-editor__hint" style={{ marginTop: 6, marginBottom: 0, fontSize: "0.78rem" }}>
          {canChangeUsername
            ? "Your @handle powers your profile link and login. You can change it once every 6 months."
            : `You can change your username again on ${formatUsernameChangeDate(nextChangeAt)}.`}
        </p>

        <label className="hub-v2-profile-editor__label" htmlFor="hub-profile-display-name" style={{ marginTop: 16 }}>
          Display name
        </label>
        <input
          id="hub-profile-display-name"
          className="hub-v2-profile-editor__input"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          maxLength={40}
        />

        <label className="hub-v2-profile-editor__label" htmlFor="hub-profile-bio" style={{ marginTop: 16 }}>
          Bio <span>({bio.length}/160)</span>
        </label>
        <textarea
          id="hub-profile-bio"
          className="hub-v2-profile-editor__input hub-v2-profile-editor__textarea"
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={160}
        />
      </div>

      <div className="hub-v2-profile-editor__block">
        <div className="hub-v2-profile-editor__grid hub-v2-profile-editor__grid--pair">
          <div>
            <label className="hub-v2-profile-editor__label" htmlFor="hub-profile-pronouns">
              Pronouns
            </label>
            <input
              id="hub-profile-pronouns"
              className="hub-v2-profile-editor__input"
              value={pronouns}
              onChange={e => setPronouns(e.target.value)}
              maxLength={40}
              placeholder="they / she"
            />
          </div>
          <div>
            <label className="hub-v2-profile-editor__label" htmlFor="hub-profile-location">
              Location
            </label>
            <input
              id="hub-profile-location"
              className="hub-v2-profile-editor__input"
              value={location}
              onChange={e => setLocation(e.target.value)}
              maxLength={80}
              placeholder="SE Portland, OR"
            />
          </div>
        </div>
      </div>

      <div className="hub-v2-profile-editor__block">
        <label className="hub-v2-profile-editor__label">
          Social links{" "}
          <span>, shown on your public profile at /u/{username || user?.username}</span>
        </label>
        <div className="hub-v2-profile-editor__grid">
          {SOCIAL_FIELDS.map(field => (
            <div key={field.key}>
              <label
                className="hub-v2-profile-editor__label hub-v2-profile-editor__label--sub"
                htmlFor={`hub-profile-social-${field.key}`}
              >
                {field.label}
              </label>
              <input
                id={`hub-profile-social-${field.key}`}
                className="hub-v2-profile-editor__input"
                value={links[field.key] || ""}
                onChange={e => setLink(field.key, e.target.value)}
                maxLength={120}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hub-v2-profile-editor__footer">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={busy}
          className="hub-v2-profile-editor__save"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
        {saveMsg && <span className="hub-v2-profile-editor__msg">{saveMsg}</span>}
      </div>
    </section>
  );
}

export { labelStyle, inputStyle };