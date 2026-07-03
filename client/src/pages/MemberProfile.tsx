import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import UserAvatar from "@/components/UserAvatar";
import BoardLoadingState from "@/components/BoardLoadingState";
import {
  EVENT_TALENT_ROLE_COLORS,
  EVENT_TALENT_ROLE_LABELS,
  type EventTalentRole,
} from "@shared/eventTalent";
import { DAY_TEXT_COLORS } from "@shared/prideWeek";
import { eventPath } from "@shared/eventSlug";

/* ── Contract types (GET /api/users/:username) ─────────────────────────── */

type ProfileEmbed = { id: string; src: string; title: string };
type ProfilePhoto = { url: string; caption?: string };
type ProfileEvent = {
  id: number;
  title: string;
  venueName?: string | null;
  dayOfWeek?: string | null;
  dateStart?: string | null;
  admission?: string | null;
};
type ProfileGig = {
  id: number;
  title: string;
  venueText?: string | null;
  compensation?: string | null;
  status?: string | null;
  createdAt?: string | null;
  description?: string | null;
};
type ProfileGifting = {
  id: number;
  title: string;
  neighborhood?: string | null;
  createdAt?: string | null;
  description?: string | null;
};

type MemberProfileData = {
  username: string;
  displayName: string | null;
  pronouns?: string | null;
  location?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  memberSince?: string | null;
  verifiedHost?: boolean;
  roles?: string[];
  socialLinks?: Record<string, string> | string | null;
  profileEmbeds?: ProfileEmbed[];
  profilePhotos?: ProfilePhoto[];
  stats?: { events: number; gigs: number; gifting: number; checkIns: number; followers: number };
  isOwner?: boolean;
  isFollowing?: boolean;
  activity?: {
    hostedEvents?: ProfileEvent[];
    gigs?: ProfileGig[];
    gifting?: ProfileGifting[];
    goingTo?: ProfileEvent[];
  };
};

/* ── Role badge colors (talent chips + lime Party Host) ────────────────── */

const ROLE_LABEL_COLORS: Record<string, string> = {
  ...Object.fromEntries(
    (Object.keys(EVENT_TALENT_ROLE_COLORS) as EventTalentRole[]).map(role => [
      EVENT_TALENT_ROLE_LABELS[role],
      EVENT_TALENT_ROLE_COLORS[role].color,
    ]),
  ),
  "Party Host": "#CCFF00",
};

/* ── Social platforms ("FIND ME EVERYWHERE") ───────────────────────────── */

type SocialPlatform = {
  key: string;
  label: string;
  chip: string;
  color: string;
  whiteText?: boolean;
  base: (handle: string) => string;
};

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: "instagram", label: "Instagram", chip: "IG", color: "var(--neon-magenta)", base: h => `https://instagram.com/${h}` },
  { key: "tiktok", label: "TikTok", chip: "TT", color: "var(--neon-cyan)", base: h => `https://www.tiktok.com/@${h}` },
  { key: "soundcloud", label: "SoundCloud", chip: "SC", color: "var(--neon-orange)", base: h => `https://soundcloud.com/${h}` },
  { key: "spotify", label: "Spotify", chip: "SP", color: "var(--neon-green)", base: h => `https://open.spotify.com/user/${h}` },
  { key: "bluesky", label: "Bluesky", chip: "BS", color: "var(--neon-blue)", whiteText: true, base: h => `https://bsky.app/profile/${h}` },
  { key: "x", label: "X", chip: "X", color: "#ffffff", base: h => `https://x.com/${h}` },
  { key: "facebook", label: "Facebook", chip: "f", color: "var(--neon-blue)", whiteText: true, base: h => `https://facebook.com/${h}` },
  { key: "website", label: "Website", chip: "↗", color: "var(--neon-cyan)", base: h => `https://${h}` },
  { key: "linktree", label: "Linktree", chip: "LT", color: "var(--neon-green)", base: h => `https://linktr.ee/${h}` },
  { key: "venmo", label: "Venmo · Tips", chip: "$", color: "var(--neon-yellow)", base: h => `https://venmo.com/${h}` },
  { key: "onlyfans", label: "OnlyFans", chip: "OF", color: "var(--neon-cyan)", base: h => `https://onlyfans.com/${h}` },
  { key: "fetlife", label: "FetLife", chip: "FL", color: "var(--neon-red)", whiteText: true, base: h => `https://fetlife.com/${h}` },
];

/** @handles map to canonical platform URLs; raw URLs must be http(s). */
function socialHref(platform: SocialPlatform, raw: string): string | null {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  // Reject any other scheme-looking value (javascript:, data:, etc.)
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  const handle = value.replace(/^@/, "").replace(/^\/+/, "").trim();
  if (!handle) return null;
  return platform.base(encodeURI(handle));
}

function parseSocialLinks(raw: MemberProfileData["socialLinks"]): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return raw;
}

/* ── SoundCloud embed parsing (from design handoff) ────────────────────── */

function parseEmbed(raw: string): string | null {
  const m = raw.match(/src\s*=\s*["']([^"']+)["']/i);
  if (m && /soundcloud/i.test(m[1])) return m[1].replace(/^http:/, "https:");
  if (/w\.soundcloud\.com\/player/i.test(raw)) return raw.trim().replace(/^http:/, "https:");
  const u = raw.match(/https?:\/\/(?:www\.|m\.)?soundcloud\.com\/[^\s"'<>]+/i);
  if (u) {
    const enc = encodeURIComponent(u[0]);
    return "https://w.soundcloud.com/player/?url=" + enc + "&color=%23FF00CC&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true";
  }
  return null;
}

function embedTitleFrom(raw: string): string {
  const u = raw.match(/https?:\/\/(?:www\.|m\.)?soundcloud\.com\/([^\s"'<>?#]+)/i);
  if (u) {
    const segment = u[1].split("/").filter(Boolean).pop() || "";
    const pretty = segment.replace(/[-_]+/g, " ").trim();
    if (pretty) return pretty.slice(0, 80);
  }
  return "Embedded set";
}

/* ── Small helpers ─────────────────────────────────────────────────────── */

function fmtEventWhen(dateStart?: string | null): string {
  if (!dateStart) return "";
  const d = new Date(dateStart);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

const TABS = ["about", "music", "photos", "activity"] as const;
type ProfileTab = (typeof TABS)[number];

const STAT_PILLS: { key: keyof NonNullable<MemberProfileData["stats"]>; label: string; color: string }[] = [
  { key: "events", label: "Events", color: "var(--neon-cyan)" },
  { key: "gigs", label: "Gigs", color: "var(--neon-orange)" },
  { key: "gifting", label: "Gifting", color: "var(--neon-yellow)" },
  { key: "checkIns", label: "Check-ins", color: "var(--neon-green)" },
  { key: "followers", label: "Followers", color: "#B451FF" },
];

const CheckIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CloseIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/* ══════════════════════════ PAGE ══════════════════════════ */

export default function MemberProfile() {
  const [, params] = useRoute("/u/:username");
  const username = params?.username ? decodeURIComponent(params.username) : "";
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<ProfileTab>("about");
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [msgSending, setMsgSending] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [embedDraft, setEmbedDraft] = useState("");
  const [savingOwnerEdit, setSavingOwnerEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading, isError, error } = useQuery<MemberProfileData>({
    queryKey: ["/api/users", username],
    queryFn: () => apiRequest("GET", `/api/users/${encodeURIComponent(username)}`).then(r => r.json()),
    enabled: !!username,
  });

  usePageSeo(
    data
      ? `${data.displayName || data.username} (@${data.username}) — PDX Pride Guide`
      : "Member Profile — PDX Pride Guide",
    (data?.bio || "PDX Pride Guide member profile.").replace(/\s+/g, " ").slice(0, 160),
  );

  // Esc closes lightbox + message modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxSrc(null);
        setMsgOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ── Follow ── */
  const followMutation = useMutation({
    mutationFn: (next: boolean) =>
      apiRequest(next ? "POST" : "DELETE", `/api/users/${encodeURIComponent(username)}/follow`).then(r => r.json()),
    onSuccess: (result: { followers: number; isFollowing: boolean }) => {
      queryClient.setQueryData<MemberProfileData | undefined>(["/api/users", username], prev =>
        prev
          ? {
              ...prev,
              isFollowing: result.isFollowing,
              stats: prev.stats ? { ...prev.stats, followers: result.followers } : prev.stats,
            }
          : prev,
      );
    },
    onError: (err: unknown) =>
      toast({ title: parseApiError(err, "Could not update follow"), variant: "destructive" }),
  });

  const handleFollowClick = () => {
    if (!authUser) {
      toast({ title: "Sign in to follow members" });
      return;
    }
    followMutation.mutate(!data?.isFollowing);
  };

  /* ── Share ── */
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${data?.displayName || username} on PDX Pride Guide`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        toast({ title: "Shared" });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied to clipboard" });
      }
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        toast({ title: "Could not share link", variant: "destructive" });
      }
    }
  };

  /* ── Message ── */
  const openMessage = () => {
    if (!authUser) {
      toast({ title: "Sign in to send messages" });
      return;
    }
    setMsgText("");
    setMsgSent(false);
    setMsgOpen(true);
  };

  const sendMessage = async () => {
    const body = msgText.trim();
    if (!body || msgSending) return;
    setMsgSending(true);
    try {
      await apiRequest("POST", `/api/users/${encodeURIComponent(username)}/message`, { body });
      setMsgSent(true);
    } catch (err) {
      toast({ title: parseApiError(err, "Could not send message"), variant: "destructive" });
    } finally {
      setMsgSending(false);
    }
  };

  /* ── Owner profile patches (embeds / photos) ── */
  const saveProfilePatch = useCallback(
    async (patch: Record<string, unknown>, successTitle: string) => {
      setSavingOwnerEdit(true);
      try {
        await apiRequest("PUT", "/api/users/me", patch);
        await queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
        toast({ title: successTitle });
        return true;
      } catch (err) {
        toast({ title: parseApiError(err, "Could not save profile"), variant: "destructive" });
        return false;
      } finally {
        setSavingOwnerEdit(false);
      }
    },
    [toast, username],
  );

  const embeds = data?.profileEmbeds ?? [];
  const photos = data?.profilePhotos ?? [];

  const addEmbed = async () => {
    const raw = embedDraft.trim();
    if (!raw) return;
    const src = parseEmbed(raw);
    if (!src) {
      toast({ title: "Paste a SoundCloud link or embed", variant: "destructive" });
      return;
    }
    if (embeds.length >= 12) {
      toast({ title: "Max 12 embedded sets", variant: "destructive" });
      return;
    }
    const next: ProfileEmbed[] = [
      { id: `u${Date.now()}`, src, title: embedTitleFrom(raw) },
      ...embeds,
    ];
    if (await saveProfilePatch({ profileEmbeds: next }, "Set embedded")) setEmbedDraft("");
  };

  const removeEmbed = (id: string) => {
    void saveProfilePatch({ profileEmbeds: embeds.filter(e => e.id !== id) }, "Set removed");
  };

  const handlePhotoFile = async (file: File) => {
    if (photos.length >= 6) {
      toast({ title: "Max 6 photos", variant: "destructive" });
      return;
    }
    setSavingOwnerEdit(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file, file.name || "photo.jpg");
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = (await res.json()) as { url: string };
      await apiRequest("PUT", "/api/users/me", { profilePhotos: [...photos, { url, caption: "" }] });
      await queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
      toast({ title: "Photo added" });
    } catch (err) {
      toast({ title: parseApiError(err, "Could not upload photo"), variant: "destructive" });
    } finally {
      setSavingOwnerEdit(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    void saveProfilePatch({ profilePhotos: photos.filter((_, i) => i !== index) }, "Photo removed");
  };

  const editCaption = (index: number) => {
    const current = photos[index]?.caption || "";
    const next = window.prompt("Caption for this photo (60 chars max)", current);
    if (next === null) return;
    const updated = photos.map((p, i) => (i === index ? { ...p, caption: next.trim().slice(0, 60) } : p));
    void saveProfilePatch({ profilePhotos: updated }, "Caption saved");
  };

  /* ── Loading / not found ── */
  if (isLoading) {
    return (
      <div className="zine-page board-page member-profile">
        <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BoardLoadingState label="Loading profile" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const notFound = error instanceof Error && error.message.startsWith("404");
    return (
      <div className="zine-page board-page member-profile">
        <div className="mp-notfound">
          <p className="display mp-notfound__title">{notFound ? "MEMBER NOT FOUND" : "COULD NOT LOAD PROFILE"}</p>
          <p className="mp-notfound__copy">
            {notFound
              ? `No active member named @${username} on the Pride Guide.`
              : "The profile API is unavailable right now. Try again in a moment."}
          </p>
          <Link href="/" className="btn-neon solid">BACK HOME</Link>
        </div>
      </div>
    );
  }

  const isOwner = !!data.isOwner;
  const isFollowing = !!data.isFollowing;
  const displayName = data.displayName || data.username;
  const roles = data.roles ?? [];
  const socialLinks = parseSocialLinks(data.socialLinks);
  const socialCards = SOCIAL_PLATFORMS
    .map(platform => {
      const raw = socialLinks[platform.key];
      const href = raw ? socialHref(platform, raw) : null;
      return href ? { platform, href, handle: String(raw).trim() } : null;
    })
    .filter((c): c is { platform: SocialPlatform; href: string; handle: string } => c !== null);
  const stats = data.stats ?? { events: 0, gigs: 0, gifting: 0, checkIns: 0, followers: 0 };
  const memberYear = data.memberSince && !Number.isNaN(new Date(data.memberSince).getTime())
    ? new Date(data.memberSince).getFullYear()
    : null;
  const activity = data.activity ?? {};
  const hostedEvents = activity.hostedEvents ?? [];
  const goingTo = activity.goingTo ?? [];
  const gigs = activity.gigs ?? [];
  const gifting = activity.gifting ?? [];
  const featuredEmbed = embeds[0];
  const restEmbeds = embeds.slice(1);
  const coverMarker = `${data.location ? `${data.location} · ` : ""}PDX Pride Guide member`;

  return (
    <div className="zine-page board-page member-profile">
      {/* ── Cover ── */}
      <div className="mp-cover" style={{ backgroundImage: 'url("/home-hero-collage.jpg")' }}>
        <div className="mp-cover__scrim" aria-hidden="true" />
        <span className="mp-cover__marker">{coverMarker}</span>
      </div>

      <div className="mp-shell">
        {/* ── Identity row ── */}
        <div className="mp-identity">
          <div className="mp-avatar-pad">
            <UserAvatar
              photoUrl={data.photoUrl}
              avatarChoice={data.avatarChoice}
              avatarRing={data.avatarRing}
              displayName={data.displayName}
              username={data.username}
              size={132}
            />
          </div>
          <div className="mp-identity__main">
            <div className="mp-name-row">
              <h1 className="display mp-name">{displayName}</h1>
              {data.verifiedHost && (
                <span className="mp-verified">
                  <CheckIcon />
                  Verified Host
                </span>
              )}
            </div>
            <div className="mp-handle">
              @{data.username}
              {data.pronouns ? ` · ${data.pronouns}` : ""}
            </div>
            {roles.length > 0 && (
              <div className="mp-roles">
                {roles.map(role => (
                  <span
                    key={role}
                    className="mp-role-chip"
                    style={{ color: ROLE_LABEL_COLORS[role] || "#fff", borderColor: ROLE_LABEL_COLORS[role] || "#555" }}
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Action row ── */}
          <div className="mp-actions">
            {!isOwner && (
              <button
                type="button"
                className={`btn-neon cyan mp-follow-btn${isFollowing ? " mp-follow-btn--on" : ""}`}
                onClick={handleFollowClick}
                disabled={followMutation.isPending}
                data-testid="profile-follow"
              >
                {isFollowing ? <><CheckIcon size={14} /> Following</> : "+ Follow"}
              </button>
            )}
            {!isOwner && (
              <button type="button" className="btn-neon solid" onClick={openMessage} data-testid="profile-message">
                Message Them
              </button>
            )}
            {isOwner && (
              <Link href="/dashboard" className="btn-neon" data-testid="profile-edit">
                Edit Profile
              </Link>
            )}
            <button type="button" className="mp-share-btn" onClick={handleShare} title="Share profile" aria-label="Share profile">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Stat pills ── */}
        <div className="mp-stats">
          {STAT_PILLS.map(pill => (
            <span key={pill.key} className="mp-stat-pill" style={{ "--mp-stat-color": pill.color } as React.CSSProperties}>
              <span className="mp-stat-pill__count">{stats[pill.key] ?? 0}</span>
              <span className="mp-stat-pill__label">{pill.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Sticky tabs ── */}
      <div className="mp-tabs">
        <div className="mp-tabs__inner">
          {TABS.map(t => (
            <button
              key={t}
              type="button"
              className={`mp-tab${tab === t ? " active" : ""}`}
              onClick={() => setTab(t)}
              data-testid={`profile-tab-${t}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mp-shell mp-panel">
        {/* ══ ABOUT ══ */}
        {tab === "about" && (
          <div className="mp-about-grid">
            <div>
              <div className="mp-section-label" style={{ color: "var(--neon-magenta)" }}>About</div>
              {data.bio ? (
                <p className="mp-bio">{data.bio}</p>
              ) : (
                <div className="mp-empty">
                  <div className="display mp-empty__title">No bio yet</div>
                  {isOwner && <p>Add one from your dashboard so people know who you are.</p>}
                </div>
              )}
              <div className="mp-info-chips">
                {data.pronouns && (
                  <span className="mp-info-chip"><span className="mp-info-chip__dot" style={{ background: "var(--neon-cyan)" }} />{data.pronouns}</span>
                )}
                {data.location && (
                  <span className="mp-info-chip"><span className="mp-info-chip__dot" style={{ background: "var(--neon-magenta)" }} />{data.location}</span>
                )}
                {memberYear && (
                  <span className="mp-info-chip"><span className="mp-info-chip__dot" style={{ background: "var(--neon-orange)" }} />Member since {memberYear}</span>
                )}
              </div>
            </div>
            <div>
              <div className="mp-section-label" style={{ color: "var(--neon-cyan)" }}>Find me everywhere</div>
              {socialCards.length > 0 ? (
                <div className="mp-social-grid">
                  {socialCards.map(({ platform, href, handle }) => (
                    <a
                      key={platform.key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mp-social-card"
                      style={{ "--mp-social-accent": platform.color } as React.CSSProperties}
                    >
                      <span
                        className="mp-social-card__chip"
                        style={{ background: platform.color, color: platform.whiteText ? "#fff" : "#000" }}
                      >
                        {platform.chip}
                      </span>
                      <span className="mp-social-card__text">
                        <span className="mp-social-card__name">{platform.label}</span>
                        <span className="mp-social-card__handle">{handle}</span>
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mp-empty">
                  <div className="display mp-empty__title">No links yet</div>
                  {isOwner && <p>Add your socials from Edit Profile on your dashboard.</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ MUSIC ══ */}
        {tab === "music" && (
          <div className="mp-music">
            <div className="mp-section-label" style={{ color: "var(--neon-magenta)" }}>Sets &amp; Mixes</div>

            {featuredEmbed ? (
              <div className="mp-embed-card mp-embed-card--featured">
                <div className="mp-embed-card__head">
                  <div className="mp-embed-card__titles">
                    <span className="mp-nowspinning">
                      <span className="mp-nowspinning__dot" aria-hidden="true" />
                      Now Spinning
                    </span>
                    <div className="display mp-embed-card__title">{featuredEmbed.title}</div>
                  </div>
                  {isOwner && (
                    <button type="button" className="mp-embed-remove" onClick={() => removeEmbed(featuredEmbed.id)} title="Remove set" aria-label="Remove set" disabled={savingOwnerEdit}>
                      <CloseIcon />
                    </button>
                  )}
                </div>
                <iframe
                  title={featuredEmbed.title || "SoundCloud player"}
                  width="100%"
                  height={300}
                  frameBorder="no"
                  scrolling="no"
                  allow="autoplay"
                  src={featuredEmbed.src}
                  className="mp-embed-frame"
                />
              </div>
            ) : (
              <div className="mp-empty">
                <div className="display mp-empty__title">No sets embedded yet</div>
                <p>{isOwner ? "Paste a SoundCloud link below to load your first player." : `${displayName} hasn't embedded any sets yet.`}</p>
              </div>
            )}

            {restEmbeds.length > 0 && (
              <div className="mp-embed-grid">
                {restEmbeds.map(embed => (
                  <div key={embed.id} className="mp-embed-card">
                    <div className="mp-embed-card__head">
                      <div className="display mp-embed-card__title mp-embed-card__title--sm">{embed.title}</div>
                      {isOwner && (
                        <button type="button" className="mp-embed-remove" onClick={() => removeEmbed(embed.id)} title="Remove set" aria-label="Remove set" disabled={savingOwnerEdit}>
                          <CloseIcon size={13} />
                        </button>
                      )}
                    </div>
                    <iframe
                      title={embed.title || "SoundCloud player"}
                      width="100%"
                      height={166}
                      frameBorder="no"
                      scrolling="no"
                      allow="autoplay"
                      src={embed.src}
                      className="mp-embed-frame"
                    />
                  </div>
                ))}
              </div>
            )}

            {isOwner && (
              <div className="mp-composer">
                <div className="mp-composer__head">
                  <span className="mp-composer__title">Embed a set</span>
                  <span className="mp-composer__you">You</span>
                </div>
                <p className="mp-composer__hint">
                  Paste a SoundCloud track or playlist URL, or a full &lt;iframe&gt; embed. It loads as a live player at the top.
                </p>
                <textarea
                  value={embedDraft}
                  onChange={e => setEmbedDraft(e.target.value)}
                  rows={3}
                  placeholder="https://soundcloud.com/your-name/your-set  ·  or  ·  <iframe ... soundcloud.com ...>"
                  className="mp-composer__input"
                />
                <div className="mp-composer__actions">
                  <button
                    type="button"
                    className="btn-neon solid"
                    onClick={() => void addEmbed()}
                    disabled={!embedDraft.trim() || savingOwnerEdit}
                  >
                    {savingOwnerEdit ? "Saving…" : "Add Player"}
                  </button>
                  <span className="mp-composer__note">Saved to this profile automatically.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ PHOTOS ══ */}
        {tab === "photos" && (
          <div>
            <div className="mp-photos-head">
              <div className="mp-section-label" style={{ color: "var(--neon-magenta)", marginBottom: 0 }}>Photos</div>
              {isOwner && <span className="mp-photos-hint">Up to 6 photos · click ⤢ to enlarge.</span>}
            </div>
            {photos.length === 0 && !isOwner ? (
              <div className="mp-empty">
                <div className="display mp-empty__title">No photos yet</div>
                <p>{displayName} hasn't added any photos.</p>
              </div>
            ) : (
              <div className="mp-photo-grid">
                {photos.map((photo, i) => (
                  <figure key={`${photo.url}-${i}`} className="mp-photo-tile">
                    <img src={photo.url} alt={photo.caption || `Photo ${i + 1}`} loading="lazy" />
                    {photo.caption && <span className="mp-photo-caption">{photo.caption}</span>}
                    <button
                      type="button"
                      className="mp-photo-btn mp-photo-btn--enlarge"
                      onClick={() => setLightboxSrc(photo.url)}
                      title="Enlarge"
                      aria-label="Enlarge photo"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                      </svg>
                    </button>
                    {isOwner && (
                      <div className="mp-photo-owner-actions">
                        <button type="button" className="mp-photo-btn" onClick={() => editCaption(i)} disabled={savingOwnerEdit}>
                          Caption
                        </button>
                        <button type="button" className="mp-photo-btn mp-photo-btn--remove" onClick={() => removePhoto(i)} disabled={savingOwnerEdit}>
                          Remove
                        </button>
                      </div>
                    )}
                  </figure>
                ))}
                {isOwner && photos.length < 6 && (
                  <button
                    type="button"
                    className="mp-photo-upload-tile"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={savingOwnerEdit}
                  >
                    <span className="mp-photo-upload-tile__plus" aria-hidden="true">+</span>
                    <span>{savingOwnerEdit ? "Uploading…" : "Add photo"}</span>
                  </button>
                )}
              </div>
            )}
            {isOwner && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void handlePhotoFile(file);
                }}
              />
            )}
          </div>
        )}

        {/* ══ ACTIVITY ══ */}
        {tab === "activity" && (
          <div className="mp-activity">
            {/* Hosting */}
            <section>
              <div className="mp-section-label" style={{ color: "var(--neon-cyan)" }}>
                Hosting · {hostedEvents.length} event{hostedEvents.length === 1 ? "" : "s"}
              </div>
              {hostedEvents.length > 0 ? (
                <div className="mp-event-rows">
                  {hostedEvents.map(evt => (
                    <Link
                      key={evt.id}
                      href={eventPath(evt.id, evt.title, evt.dayOfWeek)}
                      className="mp-event-row"
                      style={{ borderLeftColor: DAY_TEXT_COLORS[evt.dayOfWeek || ""] || "#fff" }}
                    >
                      {evt.dayOfWeek && (
                        <span className="mp-day-tag" style={{ color: DAY_TEXT_COLORS[evt.dayOfWeek] || "#fff", borderColor: DAY_TEXT_COLORS[evt.dayOfWeek] || "#555" }}>
                          {evt.dayOfWeek}
                        </span>
                      )}
                      <span className="mp-event-row__main">
                        <span className="display mp-event-row__title">{evt.title}</span>
                        <span className="mp-event-row__meta">
                          {[evt.venueName, fmtEventWhen(evt.dateStart)].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {evt.admission && <span className="mp-event-row__chip">{evt.admission.replace(/_/g, " ")}</span>}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mp-empty"><p>Not hosting any live events yet.</p></div>
              )}
            </section>

            {/* Going to — owner only (private RSVPs) */}
            {isOwner && (
              <section>
                <div className="mp-section-label" style={{ color: "var(--neon-yellow)" }}>
                  Going to · {goingTo.length} event{goingTo.length === 1 ? "" : "s"}
                  <span className="mp-private-tag">Only you can see this</span>
                </div>
                {goingTo.length > 0 ? (
                  <div className="mp-event-rows">
                    {goingTo.map(evt => (
                      <Link
                        key={evt.id}
                        href={eventPath(evt.id, evt.title, evt.dayOfWeek)}
                        className="mp-event-row"
                        style={{ borderLeftColor: DAY_TEXT_COLORS[evt.dayOfWeek || ""] || "#fff" }}
                      >
                        {evt.dayOfWeek && (
                          <span className="mp-day-tag" style={{ color: DAY_TEXT_COLORS[evt.dayOfWeek] || "#fff", borderColor: DAY_TEXT_COLORS[evt.dayOfWeek] || "#555" }}>
                            {evt.dayOfWeek}
                          </span>
                        )}
                        <span className="mp-event-row__main">
                          <span className="display mp-event-row__title">{evt.title}</span>
                          <span className="mp-event-row__meta">
                            {[evt.venueName, fmtEventWhen(evt.dateStart)].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mp-empty"><p>No RSVPs yet — browse the <Link href="/events">events board</Link>.</p></div>
                )}
              </section>
            )}

            {/* Gigs posted */}
            <section>
              <div className="mp-section-label" style={{ color: "var(--neon-orange)" }}>
                Gigs posted · {gigs.length}
              </div>
              {gigs.length > 0 ? (
                <div className="mp-post-grid">
                  {gigs.map(gig => (
                    <article key={gig.id} className="mp-post-card" style={{ borderLeftColor: "var(--neon-magenta)" }}>
                      <div className="mp-post-card__chips">
                        {gig.compensation && <span className="mp-chip-solid">{gig.compensation.replace(/_/g, " ")}</span>}
                        {gig.status && <span className="mp-chip-outline" style={{ color: "var(--neon-green)", borderColor: "var(--neon-green)" }}>{gig.status}</span>}
                        {gig.createdAt && <span className="mp-post-card__ago">Posted {timeAgo(gig.createdAt)}</span>}
                      </div>
                      <div className="display mp-post-card__title">{gig.title}</div>
                      {gig.venueText && <div className="mp-post-card__meta">{gig.venueText}</div>}
                      {gig.description && <p className="mp-post-card__copy">{gig.description}</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mp-empty"><p>No gig posts on the Pride Werk board.</p></div>
              )}
            </section>

            {/* Gifting */}
            <section>
              <div className="mp-section-label" style={{ color: "var(--neon-yellow)" }}>
                Gifting · {gifting.length} post{gifting.length === 1 ? "" : "s"}
              </div>
              {gifting.length > 0 ? (
                <div className="mp-post-grid">
                  {gifting.map(post => (
                    <article key={post.id} className="mp-post-card" style={{ borderLeftColor: "var(--neon-yellow)" }}>
                      <div className="mp-post-card__chips">
                        <span className="mp-chip-solid">Free</span>
                        {post.neighborhood && <span className="mp-post-card__ago">{post.neighborhood}</span>}
                      </div>
                      <div className="display mp-post-card__title">{post.title}</div>
                      {post.description && <p className="mp-post-card__copy">{post.description}</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mp-empty"><p>Nothing on the gifting board right now.</p></div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* ── Message modal ── */}
      {msgOpen && (
        <div className="mp-modal-overlay" onClick={() => setMsgOpen(false)} role="dialog" aria-modal="true" aria-label={`Message ${displayName}`}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <div className="mp-modal__head">
              <UserAvatar
                photoUrl={data.photoUrl}
                avatarChoice={data.avatarChoice}
                avatarRing={data.avatarRing}
                displayName={data.displayName}
                username={data.username}
                size={52}
              />
              <div className="mp-modal__titles">
                <div className="display mp-modal__title">Message {displayName}</div>
                <div className="mp-modal__sub">Replies land in your Hub inbox.</div>
              </div>
              <button type="button" className="mp-embed-remove" onClick={() => setMsgOpen(false)} aria-label="Close">
                <CloseIcon size={16} />
              </button>
            </div>

            {!msgSent ? (
              <div>
                <textarea
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  rows={5}
                  placeholder={`Say hi to ${displayName}…`}
                  className="mp-modal__input"
                  data-testid="profile-message-input"
                />
                <div className="mp-modal__actions">
                  <button type="button" className="mp-modal__cancel" onClick={() => setMsgOpen(false)}>Cancel</button>
                  <button
                    type="button"
                    className="btn-neon solid"
                    onClick={() => void sendMessage()}
                    disabled={!msgText.trim() || msgSending}
                    data-testid="profile-message-send"
                  >
                    {msgSending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mp-modal__sent">
                <div className="mp-sent-check" aria-hidden="true">
                  <CheckIcon size={30} />
                </div>
                <div className="display mp-modal__sent-title">Message sent</div>
                <p>{displayName} will get back to you in the Hub inbox. Take care of each other.</p>
                <button type="button" className="btn-neon cyan" onClick={() => setMsgOpen(false)}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxSrc && (
        <div className="mp-lightbox" onClick={() => setLightboxSrc(null)} role="dialog" aria-modal="true" aria-label="Photo">
          <img src={lightboxSrc} alt="" onClick={e => e.stopPropagation()} />
          <button type="button" className="mp-lightbox__close" onClick={() => setLightboxSrc(null)} aria-label="Close">
            <CloseIcon size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
