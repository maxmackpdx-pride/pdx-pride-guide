import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import type { PeopleHubUser } from "@shared/peopleHub";

type Props = {
  person: PeopleHubUser;
  followPending?: boolean;
  onToggleFollow?: () => void;
  showFollow?: boolean;
  /** Compact right-rail layout: HOST + @handle, verified sub, solid Follow. */
  rail?: boolean;
};

function followerLabel(count: number): string {
  return count === 1 ? "1 follower" : `${count} followers`;
}

export default function HubPersonRow({
  person,
  followPending,
  onToggleFollow,
  showFollow = true,
  rail = false,
}: Props) {
  const name = person.displayName?.trim() || person.username;
  const sub = person.subtitle || person.bio;

  if (rail) {
    return (
      <div className="hub-thread hub-people-row hub-people-row--rail rowin">
        <Link href={`/u/${encodeURIComponent(person.username)}`} className="hub-thread__link hub-thread__link--rail">
          <UserAvatar
            photoUrl={person.photoUrl}
            avatarChoice={person.avatarChoice}
            avatarRing={person.avatarRing}
            displayName={person.displayName}
            username={person.username}
            size={44}
          />
          <div className="hub-thread__body">
            <div className="hub-people-row__rail-id">
              {person.verifiedHost && (
                <span className="hub-thread__badge pdx-glass-rebind" title="Verified host">
                  Host
                </span>
              )}
              <span className="hub-people-row__handle">@{person.username}</span>
            </div>
            <span className="hub-thread__sub">
              {sub || (person.verifiedHost ? "Verified host" : followerLabel(person.followers))}
            </span>
          </div>
        </Link>
        {showFollow && onToggleFollow && (
          <button
            type="button"
            className={`foll hub-people-row__foll${person.isFollowing ? " on" : ""} pdx-glass-rebind`}
            disabled={followPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFollow();
            }}
          >
            {person.isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="hub-thread hub-people-row rowin">
      <Link href={`/u/${encodeURIComponent(person.username)}`} className="hub-thread__link">
        <UserAvatar
          photoUrl={person.photoUrl}
          avatarChoice={person.avatarChoice}
          avatarRing={person.avatarRing}
          displayName={person.displayName}
          username={person.username}
          size={40}
        />
        <div className="hub-thread__body">
          <div className="hub-thread__top">
            <div className="hub-thread__id">
              <span className="hub-thread__name">{name}</span>
              {person.verifiedHost && (
                <span className="hub-thread__badge pdx-glass-rebind" title="Verified host">
                  Host
                </span>
              )}
            </div>
            <span className="hub-thread__at">@{person.username}</span>
          </div>
          {sub ? (
            <span className="hub-thread__sub">{sub}</span>
          ) : (
            <span className="hub-thread__meta">{followerLabel(person.followers)}</span>
          )}
        </div>
      </Link>
      {showFollow && onToggleFollow && (
        <button
          type="button"
          className={`foll${person.isFollowing ? " on" : ""} pdx-glass-rebind`}
          disabled={followPending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFollow();
          }}
        >
          {person.isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}
