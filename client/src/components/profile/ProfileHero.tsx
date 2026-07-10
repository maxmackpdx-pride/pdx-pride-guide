import { useRef } from "react";
import UserAvatar from "@/components/UserAvatar";
import AccentPicker from "./AccentPicker";
import SharePopover from "./SharePopover";
import { promoterHeroLine, promoterMonogram } from "./profileHelpers";
import type { PublicProfileData } from "./types";

type Props = {
  data: PublicProfileData;
  accent: string;
  banner: string | null;
  isOwner: boolean;
  isFollowing: boolean;
  followPending: boolean;
  accentOpen: boolean;
  shareOpen: boolean;
  copied: boolean;
  profileUrl: string;
  onFollow: () => void;
  onShareToggle: () => void;
  onCopy: () => void;
  onMessage?: () => void;
  onAccentToggle: () => void;
  onAccent: (hex: string) => void;
  onBanner: (path: string | null) => void;
};

export default function ProfileHero({
  data, accent, banner, isOwner, isFollowing, followPending,
  accentOpen, shareOpen, copied, profileUrl,
  onFollow, onShareToggle, onCopy, onMessage,
  onAccentToggle, onAccent, onBanner,
}: Props) {
  const accentRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const isPromoter = !!data.isPromoter;
  const displayName = data.displayName || data.username;
  const promoLine = promoterHeroLine(data);
  const venues = data.affiliatedVenues?.length ? data.affiliatedVenues : (data.linkedVenues || []);
  const memberYear = data.memberSince && !Number.isNaN(new Date(data.memberSince).getTime())
    ? new Date(data.memberSince).getFullYear()
    : null;

  return (
    <section className={`pp-hero${isPromoter ? " pp-hero--promoter" : " pp-hero--member"}`}>
      {banner
        ? <img className="pp-hero__banner" src={banner} alt="" />
        : (
          <div className="pp-hero__banner-fallback" aria-hidden="true">
            <div className="pp-hero__banner-dots" />
          </div>
        )}
      <div className="pp-hero__scrim" aria-hidden="true" />
      <div className="pp-hero__rainbow" aria-hidden="true" />

      <div className="pp-hero__content">
        <div className="pp-hero__identity">
          <div className={`pp-hero__avatar${isPromoter ? " pp-hero__avatar--promo" : ""}`}>
            {isPromoter && !data.photoUrl ? (
              <div className="pp-hero__monogram display" aria-label={displayName}>
                {promoterMonogram(data.displayName, data.username)}
              </div>
            ) : (
              <UserAvatar
                photoUrl={data.photoUrl}
                avatarChoice={data.avatarChoice}
                avatarRing={isPromoter ? "none" : data.avatarRing}
                displayName={data.displayName}
                username={data.username}
                size={104}
              />
            )}
          </div>
          <div className="pp-hero__meta">
            <div className="pp-hero__chips">
              {isPromoter ? (
                <span className="pp-hero__chip pp-hero__chip--verified display">Verified promoter</span>
              ) : data.pronouns ? (
                <span className="pp-hero__chip pp-hero__chip--pronouns display">{data.pronouns}</span>
              ) : null}
              <span className="pp-hero__handle">@{data.username}</span>
            </div>
            <h1 className="display pp-hero__name">{displayName}</h1>
            {isPromoter ? (
              (promoLine.lead || promoLine.accent) ? (
                <p className="display pp-hero__tagline">
                  {promoLine.lead}
                  {promoLine.accent ? <> <span className="pp-hero__tagline-acc">{promoLine.accent}</span></> : null}
                </p>
              ) : null
            ) : (
              <p className="pp-hero__location">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {data.location || "Portland"}{memberYear ? ` · Community member since ${memberYear}` : ""}
              </p>
            )}
            {isPromoter && venues.length > 0 && (
              <div className="pp-hero__venues">
                <span className="display pp-hero__venues-label">Resident at</span>
                {venues.map(v => (
                  <a key={v.id} href={`/directory?place=${v.id}`} className="pp-hero__venue-chip">
                    <span className="pp-hero__venue-dot" aria-hidden="true" />
                    {v.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pp-hero__actions">
          {!isOwner && (
            <button
              type="button"
              className={`pp-btn pp-btn--follow${isFollowing ? " is-on" : ""}`}
              onClick={onFollow}
              disabled={followPending}
              data-testid="profile-follow"
            >
              {isFollowing && (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}

          {isOwner && (
            <div className="pp-hero__picker-wrap" ref={accentRef}>
              <button type="button" className="pp-btn pp-btn--accent-swatch" onClick={onAccentToggle} aria-label="Profile accent">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="13.5" cy="6.5" r="1.3" /><circle cx="17" cy="10" r="1.3" /><circle cx="8" cy="7" r="1.3" /><circle cx="6.5" cy="12" r="1.3" />
                  <path d="M12 2a10 10 0 1 0 0 20 2 2 0 0 0 2-2 2 2 0 0 1 2-2h2a4 4 0 0 0 4-4 10 10 0 0 0-10-10z" />
                </svg>
              </button>
              <AccentPicker
                open={accentOpen}
                accent={accent}
                banner={banner}
                isOwner={isOwner}
                onClose={onAccentToggle}
                onAccent={onAccent}
                onBanner={onBanner}
              />
            </div>
          )}

          <div className="pp-hero__picker-wrap" ref={shareRef}>
            <button type="button" className="pp-btn pp-btn--outline" onClick={onShareToggle} data-testid="profile-share">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" />
              </svg>
              Share
            </button>
            <SharePopover
              open={shareOpen}
              copied={copied}
              onClose={onShareToggle}
              onCopy={onCopy}
              onMessage={!isOwner ? onMessage : undefined}
              profileUrl={profileUrl}
              displayName={displayName}
            />
          </div>

          {isPromoter && data.ticketUrl && (
            <a className="pp-btn pp-btn--tickets display" href={data.ticketUrl} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
              </svg>
              Tickets
            </a>
          )}
        </div>
      </div>
    </section>
  );
}