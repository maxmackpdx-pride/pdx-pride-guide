import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import { placePath } from "@shared/placeSlug";
import type { ProfileTop8Entry } from "@/pages/profile/types";

type Props = {
  entries: ProfileTop8Entry[];
  isOwner: boolean;
  displayName: string;
  onEdit?: () => void;
};

/** MySpace-style Top 8: ranked grid of favorite people + venues, each tile
 *  links into that profile or directory listing. */
export default function ProfileTop8({ entries, isOwner, displayName, onEdit }: Props) {
  // Nothing to show and not the owner → hide the section entirely.
  if (entries.length === 0 && !isOwner) return null;

  const firstName = (displayName || "their").split(/\s+/)[0];

  return (
    <section className="pp-top8" aria-label="Top 8">
      <div className="pp-top8__head">
        <span className="pp-top8__kick display">
          <span className="pp-top8__dot" aria-hidden="true" />
          Top 8
        </span>
        {isOwner && (
          <button type="button" className="pp-top8__edit display" onClick={onEdit}>
            {entries.length ? "Edit" : "Set your Top 8"}
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <button type="button" className="pp-top8__empty" onClick={onEdit}>
          <span className="display">Pick your people + spots</span>
          <span className="pp-top8__empty-hint">Your 8 favorites, ranked. Tap to add.</span>
        </button>
      ) : (
        <div className="pp-top8__grid">
          {entries.slice(0, 8).map((e, i) => {
            const rank = i + 1;
            if (e.kind === "user") {
              return (
                <Link
                  key={`u-${e.id}`}
                  href={`/u/${encodeURIComponent(e.username)}`}
                  className="pp-top8__tile"
                >
                  <span className="pp-top8__rank display">{rank}</span>
                  <span className="pp-top8__avatar">
                    <UserAvatar
                      photoUrl={e.photoUrl}
                      avatarChoice={e.avatarChoice}
                      avatarRing={e.avatarRing}
                      displayName={e.displayName}
                      username={e.username}
                      size={64}
                    />
                  </span>
                  <span className="pp-top8__name display">{e.displayName}</span>
                  <span className="pp-top8__meta">@{e.username}</span>
                </Link>
              );
            }
            return (
              <Link
                key={`b-${e.id}`}
                href={placePath(e.id, e.name)}
                className="pp-top8__tile pp-top8__tile--place"
              >
                <span className="pp-top8__rank display">{rank}</span>
                <span className="pp-top8__avatar pp-top8__avatar--logo">
                  {e.logoUrl ? (
                    <img src={e.logoUrl} alt={e.name} loading="lazy" />
                  ) : (
                    <span className="pp-top8__logo-fallback display">{e.name.slice(0, 1)}</span>
                  )}
                </span>
                <span className="pp-top8__name display">{e.name}</span>
                <span className="pp-top8__meta">Venue</span>
              </Link>
            );
          })}
        </div>
      )}
      {isOwner && entries.length > 0 && (
        <p className="pp-top8__owner-hint">{firstName}&apos;s crew. Tap Edit to reorder.</p>
      )}
    </section>
  );
}
