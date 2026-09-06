import { useState } from "react";
import { MessageCircle, UserRound } from "lucide-react";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import MessageModal from "@/pages/profile/MessageModal";
import { placePath } from "@shared/placeSlug";
import type { ProfileTop8Entry } from "@/pages/profile/types";

type Props = {
  entries: ProfileTop8Entry[];
  isOwner: boolean;
  displayName: string;
  onEdit?: () => void;
  onRequireAuth?: () => void;
  /** Open directory PlaceModal in-place (stay on profile when closed). */
  onPlaceClick?: (place: Extract<ProfileTop8Entry, { kind: "place" }>, originEl: HTMLElement | null) => void;
};

/** MySpace-style Top 8: ranked grid of favorite people + venues.
 *  People navigate to profiles; venues open the directory card modal on this page. */
export default function ProfileTop8({ entries, isOwner, displayName, onEdit, onRequireAuth, onPlaceClick }: Props) {
  const { user } = useAuth();
  const [messageTarget, setMessageTarget] = useState<Extract<ProfileTop8Entry, { kind: "user" }> | null>(null);
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
              const isSelf = user?.id === e.id;
              return (
                <article
                  key={`u-${e.id}`}
                  className="pp-top8__tile"
                >
                  <span className="pp-top8__rank display">{rank}</span>
                  <Link href={`/u/${encodeURIComponent(e.username)}`} className="pp-top8__avatar" aria-label={`View ${e.displayName}'s profile`}>
                    <UserAvatar
                      photoUrl={e.photoUrl}
                      avatarChoice={e.avatarChoice}
                      avatarRing={e.avatarRing}
                      displayName={e.displayName}
                      username={e.username}
                      size={64}
                    />
                  </Link>
                  <Link href={`/u/${encodeURIComponent(e.username)}`} className="pp-top8__name display">{e.displayName}</Link>
                  <span className="pp-top8__meta">@{e.username}</span>
                  <div className="pp-top8__actions">
                    <Link href={`/u/${encodeURIComponent(e.username)}`} className="pp-top8__action"><UserRound size={13} aria-hidden="true" />PROFILE</Link>
                    {!isSelf ? <button type="button" className="pp-top8__action" onClick={() => user ? setMessageTarget(e) : onRequireAuth?.()}><MessageCircle size={13} aria-hidden="true" />MESSAGE</button> : null}
                  </div>
                </article>
              );
            }
            const placeInner = (
              <>
                <span className="pp-top8__rank display">{rank}</span>
                <span className="pp-top8__avatar pp-top8__avatar--logo">
                  {e.logoUrl ? (
                    <img src={e.logoUrl} alt="" loading="lazy" />
                  ) : (
                    <span className="pp-top8__logo-fallback display">{e.name.slice(0, 1)}</span>
                  )}
                </span>
                <span className="pp-top8__name display">{e.name}</span>
                <span className="pp-top8__meta">Venue</span>
              </>
            );
            // Prefer in-page PlaceModal so closing stays on the profile.
            if (onPlaceClick) {
              return (
                <button
                  key={`b-${e.id}`}
                  type="button"
                  className="pp-top8__tile pp-top8__tile--place"
                  aria-label={`Open ${e.name} directory card`}
                  onClick={(ev) => onPlaceClick(e, ev.currentTarget)}
                >
                  {placeInner}
                </button>
              );
            }
            return (
              <Link
                key={`b-${e.id}`}
                href={placePath(e.id, e.name)}
                className="pp-top8__tile pp-top8__tile--place"
              >
                {placeInner}
              </Link>
            );
          })}
        </div>
      )}
      {isOwner && entries.length > 0 && (
        <p className="pp-top8__owner-hint">{firstName}&apos;s crew. Tap Edit to reorder.</p>
      )}
      {messageTarget ? <MessageModal data={messageTarget} username={messageTarget.username} onClose={() => setMessageTarget(null)} /> : null}
    </section>
  );
}
