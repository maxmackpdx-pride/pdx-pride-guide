import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import type { PeopleHubUser } from "@shared/peopleHub";

type Props = {
  person: PeopleHubUser;
  followPending?: boolean;
  onToggleFollow?: () => void;
  showFollow?: boolean;
};

export default function HubPersonRow({ person, followPending, onToggleFollow, showFollow = true }: Props) {
  const name = person.displayName?.trim() || person.username;
  const sub = person.subtitle || person.bio;

  return (
    <div className="hub-thread" style={{ cursor: "default" }}>
      <Link
        href={`/u/${encodeURIComponent(person.username)}`}
        style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
      >
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
            <span className="hub-thread__name">{name}</span>
            <span className="hub-thread__at">@{person.username}</span>
          </div>
          {sub && <span className="hub-thread__sub">{sub}</span>}
        </div>
      </Link>
      {showFollow && onToggleFollow && (
        <button
          type="button"
          className={`foll${person.isFollowing ? " on" : ""}`}
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