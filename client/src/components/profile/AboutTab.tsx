import { useState } from "react";
import { Link } from "wouter";
import { PlaceCard, SectionHeader, StatPill, StickerBadge } from "@/components/ds";
import UserAvatar from "@/components/UserAvatar";
import { directoryFallbackLogo, resolveDirectoryLogo } from "@/lib/directoryLogos";
import { PROFILE_SOCIAL_PLATFORMS, parseSocialLinks, socialHref } from "./profileHelpers";
import type { PublicProfileData } from "./types";

type Props = {
  data: PublicProfileData;
  isOwner: boolean;
  onBook?: () => void;
};

export default function AboutTab({ data, isOwner, onBook }: Props) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const isPromoter = !!data.isPromoter;
  const socialLinks = parseSocialLinks(data.socialLinks);
  const socials = PROFILE_SOCIAL_PLATFORMS
    .map(p => {
      const raw = socialLinks[p.key];
      const href = raw ? socialHref(p, raw) : null;
      return href ? { ...p, href, raw } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const memberYear = data.memberSince && !Number.isNaN(new Date(data.memberSince).getTime())
    ? new Date(data.memberSince).getFullYear()
    : null;
  const bioLong = (data.bio || "").length > 220;
  const bioText = bioLong && !bioExpanded ? `${(data.bio || "").slice(0, 220).trim()}…` : (data.bio || "");

  const showPack = data.pup && (data.packmates?.length || data.handlers?.length || data.pup.name);

  return (
    <div className="pp-about">
      <section>
        <SectionHeader kicker="In their words" title="About" />
        {data.bio ? (
          <>
            <p className="pp-about__bio">{bioText}</p>
            {bioLong && (
              <button type="button" className="pp-expand display" onClick={() => setBioExpanded(v => !v)}>
                {bioExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </>
        ) : (
          <p className="pp-empty-copy">{isOwner ? "Add a bio from your dashboard." : "No bio yet."}</p>
        )}
      </section>

      {(data.talents?.length ?? 0) > 0 && (
        <section>
          <SectionHeader kicker="Skills on offer" title="Talents" />
          <div className="pp-chip-row">
            {data.talents!.map(t => (
              <span key={t} className="pp-talent display">{t}</span>
            ))}
          </div>
        </section>
      )}

      {isPromoter && (data.standFor?.length ?? 0) > 0 && (
        <section>
          <SectionHeader kicker="Values" title="What we stand for" />
          <ul className="pp-stand-for">
            {data.standFor!.map(item => (
              <li key={item}><span className="pp-stand-for__check" aria-hidden="true">✓</span>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {isPromoter && data.businessPlace && (
        <section>
          <SectionHeader kicker="Directory" title="Business card" />
          <PlaceCard
            name={data.businessPlace.name}
            category={data.businessPlace.type || "venue"}
            description={data.businessPlace.description || ""}
            address={data.businessPlace.address || undefined}
            website={data.businessPlace.website || undefined}
            instagram={data.businessPlace.instagram || undefined}
            logoUrl={resolveDirectoryLogo(data.businessPlace.name, data.businessPlace.imageUrl) || undefined}
            fallbackLogoUrl={directoryFallbackLogo(data.businessPlace.type || "venue")}
            hours={data.businessPlace.hours || undefined}
            phone={data.businessPlace.phone || undefined}
          />
          <Link href={`/directory?place=${data.businessPlace.id}`} className="pp-directory-link display">
            See in Places directory →
          </Link>
        </section>
      )}

      {isPromoter && socials.length > 0 && (
        <section>
          <SectionHeader kicker="Reach out" title="Find us" />
          <div className="pp-social-links">
            {socials.map(s => (
              <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className="pp-social-link display">
                {s.label}
              </a>
            ))}
          </div>
          {socialLinks.bookingEmail && onBook && (
            <button type="button" className="pp-btn pp-btn--follow" onClick={onBook}>Book us</button>
          )}
        </section>
      )}

      {!isPromoter && (
        <>
          <section>
            <SectionHeader kicker="The basics" title="Identity" />
            <div className="pp-info-list">
              {data.pronouns && <div><span className="display pp-info-label">Pronouns</span> {data.pronouns}</div>}
              {data.location && <div><span className="display pp-info-label">Neighborhood</span> {data.location}</div>}
              {memberYear && <div><span className="display pp-info-label">Member since</span> {memberYear}</div>}
            </div>
          </section>

          {socials.length > 0 && (
            <section>
              <SectionHeader kicker="Elsewhere" title="Find me" />
              <div className="pp-social-links">
                {socials.map(s => (
                  <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className="pp-social-link display">
                    {s.label}
                  </a>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHeader kicker="Community" title="Badges" />
            <div className="pp-badges">
              <StickerBadge color="pink">Parade 2025</StickerBadge>
              <StatPill count={data.stats?.checkIns ?? 0} color="green">Check-ins</StatPill>
              <StatPill count={data.stats?.saved ?? 0} color="cyan">Saved</StatPill>
              {(data.stats?.gifting ?? 0) > 0 && (
                <StickerBadge color="lime">GIFTZ Hero</StickerBadge>
              )}
            </div>
          </section>

          {showPack && data.pup && (
            <section className="pp-pack">
              <SectionHeader kicker="Optional" title="Pack & pup life" />
              <div className="pp-pack__card">
                {data.pup.name && <div className="pp-pack__field"><span className="display">Pup name</span> {data.pup.name}</div>}
                {data.pup.hood && <div className="pp-pack__field"><span className="display">Hood colors</span> {data.pup.hood}</div>}
                {data.pup.role && <div className="pp-pack__field"><span className="display">Role</span> {data.pup.role}</div>}
                {data.pup.lookingFor && <div className="pp-pack__field"><span className="display">Looking for</span> {data.pup.lookingFor}</div>}
                {(data.packmates?.length ?? 0) > 0 && (
                  <div className="pp-pack__group">
                    <span className="display pp-pack__group-label">Packmates</span>
                    <div className="pp-pack__chips">
                      {data.packmates!.map(p => (
                        <Link key={p.id} href={`/u/${p.username}`} className="pp-pack__chip">
                          <UserAvatar photoUrl={p.photoUrl} avatarChoice={p.avatarChoice} avatarRing={p.avatarRing} displayName={p.displayName} username={p.username} size={36} />
                          <span>{p.displayName || p.username}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {(data.handlers?.length ?? 0) > 0 && (
                  <div className="pp-pack__group">
                    <span className="display pp-pack__group-label">Handlers</span>
                    <div className="pp-pack__chips">
                      {data.handlers!.map(p => (
                        <Link key={p.id} href={`/u/${p.username}`} className="pp-pack__chip">
                          <UserAvatar photoUrl={p.photoUrl} avatarChoice={p.avatarChoice} avatarRing={p.avatarRing} displayName={p.displayName} username={p.username} size={36} />
                          <span>{p.displayName || p.username}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}