import { useEffect, useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { PROFILE_ACCENT_SWATCHES, DEFAULT_PROFILE_BANNER } from "@shared/profileAccents";
import type { PublicProfile } from "./types";

type Props = {
  profile: PublicProfile;
  accentHex: string;
  onFollow: () => void;
  followPending?: boolean;
  onMessage: () => void;
  onAccentChange?: (hex: string) => void;
  ticketsHref?: string | null;
};

export default function ProfileHero({
  profile,
  accentHex,
  onFollow,
  followPending,
  onMessage,
  onAccentChange,
  ticketsHref,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [accentOpen, setAccentOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);

  const isPromoter = !!(profile.isPromoter || profile.verifiedHost);
  const banner = profile.profileBanner || DEFAULT_PROFILE_BANNER;
  const name = (profile.displayName || profile.username || "Member").toUpperCase();
  const since = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString([], { month: "short", year: "numeric" })
    : null;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (shareRef.current && !shareRef.current.contains(t)) setShareOpen(false);
      if (accentRef.current && !accentRef.current.contains(t)) setAccentOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const shareNative = async () => {
    const title = `${profile.displayName || profile.username} on PDX Pride Guide`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
      } else {
        await copyLink();
      }
    } catch {
      /* abort */
    }
  };

  return (
    <section className="profile-hero">
      <img className="profile-hero__banner" src={banner} alt="" />
      <div className="profile-hero__scrim" aria-hidden="true" />
      <div className="profile-hero__seam rainbow-bar" aria-hidden="true" />

      <div className="profile-hero__inner">
        <div className="profile-hero__identity">
          <UserAvatar
            photoUrl={profile.photoUrl}
            avatarChoice={profile.avatarChoice}
            displayName={profile.displayName}
            username={profile.username}
            avatarRing={isPromoter ? "none" : profile.avatarRing}
            size={88}
            shimmer={!isPromoter}
          />
          <div className="profile-hero__text">
            <h1 className="profile-hero__name">{name}</h1>
            <p className="profile-hero__handle">@{profile.username}</p>
            <div className="profile-hero__meta">
              {isPromoter ? (
                <span className="profile-chip profile-chip--solid">Verified promoter</span>
              ) : profile.pronouns ? (
                <span className="profile-chip profile-chip--outline">{profile.pronouns}</span>
              ) : null}
              <span className="profile-hero__since">
                {[profile.location, since ? `Since ${since}` : null].filter(Boolean).join(" · ")}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-hero__actions">
          {!profile.isOwner && (
            <button
              type="button"
              className={`profile-btn profile-btn--primary${profile.isFollowing ? " is-on" : ""}`}
              onClick={onFollow}
              disabled={followPending}
            >
              {profile.isFollowing ? "✓ Following" : "Follow"}
            </button>
          )}

          <div className="profile-share" ref={shareRef}>
            <button
              type="button"
              className="profile-btn profile-btn--ghost"
              onClick={() => {
                setShareOpen(o => !o);
                setAccentOpen(false);
              }}
            >
              Share
            </button>
            {shareOpen && (
              <div className="profile-share__pop" role="menu">
                <button type="button" className="profile-share__item" onClick={copyLink}>
                  {copied ? "Copied" : "Copy link"}
                </button>
                <button type="button" className="profile-share__item" onClick={shareNative}>
                  Share sheet
                </button>
                <button type="button" className="profile-share__item" onClick={onMessage}>
                  Send in a message
                </button>
              </div>
            )}
          </div>

          {isPromoter && ticketsHref && (
            <a className="profile-btn profile-btn--ghost" href={ticketsHref} target="_blank" rel="noopener noreferrer">
              Tickets
            </a>
          )}

          {profile.isOwner && onAccentChange && (
            <div className="profile-share" ref={accentRef}>
              <button
                type="button"
                className="profile-btn profile-btn--ghost"
                aria-label="Profile accent"
                onClick={() => {
                  setAccentOpen(o => !o);
                  setShareOpen(false);
                }}
                style={{ minWidth: 42, justifyContent: "center" }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 99,
                    background: accentHex,
                    display: "inline-block",
                  }}
                />
              </button>
              {accentOpen && (
                <div className="profile-accent-pop">
                  <div className="profile-accent-pop__title">Profile accent</div>
                  <div className="profile-accent-pop__grid">
                    {PROFILE_ACCENT_SWATCHES.map(sw => (
                      <button
                        key={sw.id}
                        type="button"
                        className={`profile-accent-swatch${accentHex.toUpperCase() === sw.hex.toUpperCase() ? " is-on" : ""}`}
                        style={{ background: sw.hex }}
                        aria-label={sw.id}
                        onClick={() => {
                          onAccentChange(sw.hex);
                          setAccentOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
