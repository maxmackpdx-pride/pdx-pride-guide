import { useRef } from "react";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import AccentPicker from "./AccentPicker";
import SharePopover from "./SharePopover";
import RoleStickers from "./RoleStickers";
import AdminProfilePhotoReject from "@/components/admin/AdminProfilePhotoReject";
import AdminProfileModeration from "@/components/admin/AdminProfileModeration";
import ReportAccount from "@/components/profile/ReportAccount";
import BlockMemberButton from "@/components/profile/BlockMemberButton";
import { useAuth } from "@/context/AuthContext";
import { coverCropToImgStyle } from "@/lib/coverCrop";
import type { PublicProfileData } from "./types";
import "./ProfileHero.css";

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
  /** Solid day-flyer banner: sets accent + accent-gradient, clears custom cover. */
  onSolidBanner: (hex: string) => void;
};

function buildMetaLine(data: PublicProfileData, memberYear: number | null): string {
  const parts: string[] = [];
  if (data.location) parts.push(data.location);
  else if (memberYear) parts.push("Portland");

  // Affiliation: first talent, business name, or first venue
  const affiliation =
    data.talents?.[0] ||
    data.businessPlace?.name ||
    data.affiliatedVenues?.[0]?.name ||
    data.linkedVenues?.[0]?.name;
  if (affiliation) parts.push(affiliation);

  const secondVenue =
    data.affiliatedVenues?.[1]?.name ||
    (data.affiliatedVenues?.[0]?.name && data.linkedVenues?.[0]?.name !== data.affiliatedVenues?.[0]?.name
      ? data.linkedVenues?.[0]?.name
      : null);
  if (secondVenue && secondVenue !== affiliation) parts.push(secondVenue);

  if (memberYear) parts.push(`Since ${memberYear}`);
  return parts.join(" · ");
}

export default function ProfileHero({
  data,
  accent,
  banner,
  isOwner,
  isFollowing,
  followPending,
  accentOpen,
  shareOpen,
  copied,
  profileUrl,
  onFollow,
  onShareToggle,
  onCopy,
  onMessage,
  onAccentToggle,
  onAccent,
  onSolidBanner,
}: Props) {
  const { user: viewer } = useAuth();
  const accentRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const hasCustomCover = !!data.coverImageUrl;
  const isPromoter = !!(data.isPromoter || data.verifiedHost);
  const displayName = data.displayName || data.username;
  const canDeleteAccount = !!viewer?.isPrimaryOwner;
  const blockStatus = data.blockStatus ?? { blockedByViewer: false, blockedViewer: false, interactionBlocked: false };
  const memberYear =
    data.memberSince && !Number.isNaN(new Date(data.memberSince).getTime())
      ? new Date(data.memberSince).getFullYear()
      : null;
  const metaLine = buildMetaLine(data, memberYear);

  const avatar = (
    <UserAvatar
      photoUrl={data.photoUrl}
      avatarChoice={data.avatarChoice}
      avatarRing={data.avatarRing}
      displayName={data.displayName}
      username={data.username}
      size={88}
      className="pp-hero__avatar-el"
    />
  );

  return (
    <section className="pp-hero pp-hero--reimagined">
      {data.coverImageUrl ? (
        <div className="pp-hero__banner pp-hero__banner--custom">
          <img
            className="pp-hero__banner-img"
            src={data.coverImageUrl}
            alt=""
            style={coverCropToImgStyle(data.coverCrop)}
          />
        </div>
      ) : banner ? (
        <img className="pp-hero__banner" src={banner} alt="" />
      ) : (
        <div className="pp-hero__banner-fallback" aria-hidden="true">
          <div className="pp-hero__banner-dots" />
        </div>
      )}
      <div className="pp-hero__scrim" aria-hidden="true" />
      <div className="pp-hero__rainbow" aria-hidden="true" />

      <div className="pp-hero__content">
        <div className="pp-hero__identity">
          <div className="pp-hero__avatar">
            {isOwner ? (
              <Link href="/dashboard?edit=profile" className="pp-hero__avatar-link" aria-label="Edit profile">
                {avatar}
              </Link>
            ) : (
              avatar
            )}
            {data.viewerIsAdmin && !isOwner && data.photoUrl ? (
              <AdminProfilePhotoReject username={data.username} />
            ) : null}
            {data.viewerIsAdmin && !isOwner ? (
              <AdminProfileModeration
                username={data.username}
                accountStatus={(data as any).accountStatus}
                shadowBanned={!!(data as any).shadowBanned}
                canDeleteAccount={canDeleteAccount}
              />
            ) : null}
            {!isOwner && viewer && !data.viewerIsAdmin ? (
              <ReportAccount username={data.username} />
            ) : null}
          </div>

          <div className="pp-hero__meta">
            <div className="pp-hero__name-row">
              <h1 className="display pp-hero__name">{displayName}</h1>
              <RoleStickers
                isPromoter={isPromoter}
                isAdmin={data.isAdmin}
                isSiteOwner={data.isSiteOwner}
              />
            </div>

            <div className="pp-hero__subrow">
              <span className="pp-hero__handle">@{data.username}</span>
              {data.pronouns ? (
                <span className="pp-hero__chip pp-hero__chip--pronouns display">{data.pronouns}</span>
              ) : null}
              {metaLine ? <span className="pp-hero__meta-line display">{metaLine}</span> : null}
            </div>
          </div>

          {/* Single action row - no second copy under the avatar/bio */}
          <div className="pp-hero__actions">
            {!isOwner && (
              <>
                <button
                  type="button"
                  className={`pp-btn pp-btn--follow${isFollowing ? " is-on" : ""}`}
                  onClick={onFollow}
                  disabled={followPending || blockStatus.interactionBlocked}
                  data-testid="profile-follow"
                >
                  {isFollowing && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                  {isFollowing ? "Following" : "Follow"}
                </button>
                {onMessage && !blockStatus.interactionBlocked && (
                  <button type="button" className="pp-btn pp-btn--message" onClick={onMessage} data-testid="profile-message">
                    Message
                  </button>
                )}
                {viewer && !data.viewerIsAdmin && (
                  <BlockMemberButton username={data.username} blocked={blockStatus.blockedByViewer} />
                )}
                {blockStatus.blockedViewer && !blockStatus.blockedByViewer && (
                  <span className="pp-hero__blocked-note">Contact unavailable</span>
                )}
              </>
            )}

            {isOwner && (
              <Link href="/dashboard?edit=profile" className="pp-btn pp-btn--outline display">
                Edit profile
              </Link>
            )}

            {isOwner && (
              <div className="pp-hero__picker-wrap" ref={accentRef}>
                <button type="button" className="pp-btn pp-btn--accent-swatch" onClick={onAccentToggle} aria-label="Profile accent" aria-expanded={accentOpen}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="13.5" cy="6.5" r="1.3" /><circle cx="17" cy="10" r="1.3" /><circle cx="8" cy="7" r="1.3" /><circle cx="6.5" cy="12" r="1.3" />
                    <path d="M12 2a10 10 0 1 0 0 20 2 2 0 0 0 2-2 2 2 0 0 1 2-2h2a4 4 0 0 0 4-4 10 10 0 0 0-10-10z" />
                  </svg>
                </button>
                <AccentPicker
                  open={accentOpen}
                  accent={accent}
                  banner={banner}
                  hasCustomCover={hasCustomCover}
                  isOwner={isOwner}
                  onClose={() => { if (accentOpen) onAccentToggle(); }}
                  onAccent={onAccent}
                  onSolidBanner={onSolidBanner}
                  anchorRef={accentRef}
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
                anchorRef={shareRef}
              />
            </div>
          </div>
        </div>

        {data.bio ? <p className="pp-hero__bio">{data.bio}</p> : null}
      </div>
    </section>
  );
}
