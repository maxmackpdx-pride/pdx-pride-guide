import type React from "react";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import { PROFILE_BANNER_IMAGES, type ProfileBanner } from "@shared/profileTheme";
import type { MemberProfileData } from "./types";

function MapPinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function ProfileHero({
  data,
  actionRow,
}: {
  data: MemberProfileData;
  actionRow: React.ReactNode;
}) {
  const isPromoter = !!data.showPromoterVariant;
  const displayName = data.displayName || data.username;
  const memberYear = data.memberSince && !Number.isNaN(new Date(data.memberSince).getTime())
    ? new Date(data.memberSince).getFullYear()
    : null;
  const banner = (data.banner || "accent-gradient") as ProfileBanner;
  const bannerImageSrc = banner !== "accent-gradient" ? PROFILE_BANNER_IMAGES[banner] : null;
  const venues = data.affiliatedVenues ?? [];

  return (
    <section className={`mp-hero${isPromoter ? " mp-hero--promoter" : ""}`}>
      {bannerImageSrc ? (
        <img className="mp-hero__banner-img" src={bannerImageSrc} alt="" />
      ) : (
        <>
          <div className="mp-hero__banner-gradient" aria-hidden="true" />
          <div className="mp-hero__banner-dots" aria-hidden="true" />
        </>
      )}
      <div className="mp-hero__scrim" aria-hidden="true" />
      <div className="mp-hero__seam" aria-hidden="true" />

      <div className="mp-hero__content">
        <div className="mp-hero__identity">
          <div className="mp-hero__avatar">
            <UserAvatar
              photoUrl={data.photoUrl}
              avatarChoice={data.avatarChoice}
              avatarRing={isPromoter ? "none" : data.avatarRing}
              displayName={data.displayName}
              username={data.username}
              size={104}
            />
          </div>
          <div className="mp-hero__main">
            <div className="mp-hero__badgerow">
              {isPromoter ? (
                <>
                  <span className="mp-hero__chip mp-hero__chip--solid">Verified promoter</span>
                  <span className="mp-hero__handle">@{data.username}</span>
                </>
              ) : (
                <>
                  <span className="mp-hero__handle">@{data.username}</span>
                  {data.pronouns && <span className="mp-hero__chip mp-hero__chip--outline">{data.pronouns}</span>}
                </>
              )}
            </div>
            <h1 className="display mp-hero__name">{displayName}</h1>
            {isPromoter ? (
              <p className="mp-hero__tagline">
                {data.bio ? data.bio.slice(0, 110) : "Verified promoter"}
                {memberYear && <span className="mp-hero__tagline-accent"> · Portland, since {memberYear}.</span>}
              </p>
            ) : (
              <p className="mp-hero__location">
                <MapPinIcon />
                {[data.location, memberYear ? `Community member since ${memberYear}` : null].filter(Boolean).join(" · ")}
              </p>
            )}
            {isPromoter && venues.length > 0 && (
              <div className="mp-hero__venues">
                <span className="mp-hero__venues-label">Resident at</span>
                {venues.map(v => (
                  <Link key={v.id} href="/directory" className="mp-hero__venue-chip">
                    <span className="mp-hero__venue-dot" aria-hidden="true" />
                    {v.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {actionRow}
      </div>
    </section>
  );
}
