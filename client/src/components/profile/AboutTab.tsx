import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PlaceCard, StatPill, StickerBadge } from "@/components/ds";
import UserAvatar from "@/components/UserAvatar";
import type { PublicProfile } from "./types";

type SocialPlatform = {
  key: string;
  label: string;
  color: string;
  base: (handle: string) => string;
};

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: "instagram", label: "Instagram", color: "var(--neon-magenta)", base: h => `https://instagram.com/${h}` },
  { key: "tiktok", label: "TikTok", color: "var(--neon-cyan)", base: h => `https://www.tiktok.com/@${h}` },
  { key: "soundcloud", label: "SoundCloud", color: "var(--neon-orange)", base: h => `https://soundcloud.com/${h}` },
  { key: "spotify", label: "Spotify", color: "var(--neon-green)", base: h => `https://open.spotify.com/user/${h}` },
  { key: "website", label: "Website", color: "var(--neon-cyan)", base: h => `https://${h}` },
  { key: "linktree", label: "Linktree", color: "var(--neon-green)", base: h => `https://linktr.ee/${h}` },
  { key: "bookingEmail", label: "Booking", color: "var(--neon-yellow)", base: h => `mailto:${h}` },
];

function socialHref(platform: SocialPlatform, raw: string): string | null {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (platform.key === "bookingEmail") {
    if (/^mailto:/i.test(value)) return value;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
    return null;
  }
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  const handle = value.replace(/^@/, "").replace(/^\/+/, "").trim();
  if (!handle) return null;
  if (platform.key === "website") return handle.startsWith("http") ? handle : `https://${handle}`;
  return platform.base(encodeURI(handle));
}

export default function AboutTab({
  profile,
  onBook,
}: {
  profile: PublicProfile;
  onBook?: () => void;
}) {
  const isPromoter = !!(profile.isPromoter || profile.verifiedHost);
  const bio = profile.bio?.trim() || "";
  const [expanded, setExpanded] = useState(false);
  const long = bio.length > 280;
  const shown = !long || expanded ? bio : `${bio.slice(0, 280).trim()}…`;

  const socials = profile.socialLinks || {};
  const socialLinks = useMemo(() => {
    return SOCIAL_PLATFORMS.map(p => {
      const raw = socials[p.key];
      if (!raw) return null;
      const href = socialHref(p, raw);
      if (!href) return null;
      return { ...p, href };
    }).filter(Boolean) as Array<SocialPlatform & { href: string }>;
  }, [socials]);

  const talents = profile.talents || [];
  const standFor = profile.standFor || [];
  const venues = profile.linkedVenues || [];
  const pup = profile.pup;
  const packmates = profile.packmates || [];
  const handlers = profile.handlers || [];
  const showPack = !!(pup && pup.name);

  const since = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString([], { month: "long", year: "numeric" })
    : null;

  return (
    <div className="profile-about-grid">
      <section>
        <h2 className="profile-section-title">About</h2>
        {bio ? (
          <>
            <p className="profile-bio">{shown}</p>
            {long && (
              <button type="button" className="profile-link-btn" onClick={() => setExpanded(e => !e)}>
                {expanded ? "Read less" : "Read more"}
              </button>
            )}
          </>
        ) : (
          <p className="profile-empty">No bio yet.</p>
        )}
      </section>

      {talents.length > 0 && (
        <section>
          <h2 className="profile-section-title">Talents</h2>
          <div className="profile-chips">
            {talents.map(t => (
              <span key={t} className="profile-talent">
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {isPromoter && (
        <>
          {standFor.length > 0 && (
            <section>
              <h2 className="profile-section-title">What we stand for</h2>
              <ul className="profile-stand">
                {standFor.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {venues.length > 0 && (
            <section>
              <h2 className="profile-section-title">Resident at</h2>
              <div className="profile-chips">
                {venues.map(v => (
                  <Link key={v.id} href={`/directory?place=${v.id}`} className="profile-talent">
                    {v.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {profile.businessPlace && (
            <section>
              <h2 className="profile-section-title">Business</h2>
              <div
                role="link"
                tabIndex={0}
                onClick={() => {
                  window.location.href = `/directory?place=${profile.businessPlace!.id}`;
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") window.location.href = `/directory?place=${profile.businessPlace!.id}`;
                }}
              >
                <PlaceCard
                  name={profile.businessPlace.name}
                  category={profile.businessPlace.type || "bars"}
                  address={profile.businessPlace.address || undefined}
                  logoUrl={profile.businessPlace.logoUrl || undefined}
                />
              </div>
              <Link href={`/directory?place=${profile.businessPlace.id}`} className="profile-link-btn">
                See in Places directory →
              </Link>
            </section>
          )}

          <section>
            <h2 className="profile-section-title">Find us</h2>
            <div className="profile-socials">
              {socialLinks.map(s => (
                <a key={s.key} href={s.href} className="profile-social" style={{ background: s.color }} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
            </div>
            {onBook && (
              <button type="button" className="profile-btn profile-btn--primary" style={{ marginTop: 14 }} onClick={onBook}>
                Book us
              </button>
            )}
          </section>
        </>
      )}

      {!isPromoter && (
        <>
          <section>
            <h2 className="profile-section-title">Identity</h2>
            <div className="profile-chips">
              {profile.pronouns && <span className="profile-talent">{profile.pronouns}</span>}
              {profile.location && <span className="profile-talent">{profile.location}</span>}
              {since && <span className="profile-talent">Member since {since}</span>}
            </div>
          </section>

          {socialLinks.length > 0 && (
            <section>
              <h2 className="profile-section-title">Find me</h2>
              <div className="profile-socials">
                {socialLinks.map(s => (
                  <a key={s.key} href={s.href} className="profile-social" style={{ background: s.color }} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="profile-section-title">Badges</h2>
            <div className="profile-chips">
              <StatPill count={profile.stats?.checkIns ?? 0} color="lime" size="sm">
                Check-ins
              </StatPill>
              <StatPill count={profile.stats?.going ?? 0} color="cyan" size="sm">
                Going
              </StatPill>
              <StatPill count={profile.stats?.gifting ?? 0} color="amber" size="sm">
                Gifting
              </StatPill>
              {(profile.stats?.checkIns || 0) >= 5 && (
                <StickerBadge color="pink" rotate={-2} size="sm">
                  Scene regular
                </StickerBadge>
              )}
            </div>
          </section>

          {showPack && (
            <section className="profile-pack">
              <h2 className="profile-section-title">Pack and pup life</h2>
              <p className="profile-bio" style={{ marginBottom: 8 }}>
                <strong>{pup!.name}</strong>
                {pup!.hood ? ` · ${pup!.hood}` : ""}
                {pup!.role ? ` · ${pup!.role}` : ""}
              </p>
              {pup!.lookingFor && (
                <p className="profile-bio" style={{ marginTop: 0 }}>
                  Looking for: {pup!.lookingFor}
                </p>
              )}
              {(packmates.length > 0 || handlers.length > 0) && (
                <div className="profile-pack__people">
                  {handlers.map(h => (
                    <Link key={`h-${h.id}`} href={`/u/${encodeURIComponent(h.username)}`} className="profile-pack__person">
                      <UserAvatar
                        photoUrl={h.photoUrl}
                        avatarChoice={h.avatarChoice}
                        displayName={h.displayName}
                        username={h.username}
                        avatarRing={h.avatarRing}
                        size={48}
                      />
                      <span>Handler</span>
                      <span>{h.displayName || h.username}</span>
                    </Link>
                  ))}
                  {packmates.map(p => (
                    <Link key={`p-${p.id}`} href={`/u/${encodeURIComponent(p.username)}`} className="profile-pack__person">
                      <UserAvatar
                        photoUrl={p.photoUrl}
                        avatarChoice={p.avatarChoice}
                        displayName={p.displayName}
                        username={p.username}
                        avatarRing={p.avatarRing}
                        size={48}
                      />
                      <span>Pack</span>
                      <span>{p.displayName || p.username}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
