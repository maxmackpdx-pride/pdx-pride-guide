import type { ReactNode } from "react";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import type { AuthUser } from "@/context/AuthContext";

type Props = {
  user: AuthUser;
  stats: Array<{ value: string | number; label: string }>;
  postsCount: number;
  profileEditor?: ReactNode;
  onEditProfile?: () => void;
};

export default function HubProfile({ user, stats, postsCount, profileEditor, onEditProfile }: Props) {
  const displayName = user.displayName || user.username;
  const isPromoter = user.promoterStatus === "approved";

  return (
    <div className="reveal hub-v2-profile">
      <div className="kick hub-v2-profile__kicker">Behind the scenes</div>
      <h1 className="h1">Edit profile</h1>

      {profileEditor}

      <div className="hub-v2-profile__preview">
        <div className="kick hub-v2-profile__preview-kicker">At a glance</div>

        <div className="hub-v2-profile__header">
          <UserAvatar
            photoUrl={user.photoUrl}
            avatarChoice={user.avatarChoice}
            avatarRing={user.avatarRing}
            displayName={displayName}
            username={user.username}
            size={72}
          />
          <div>
            <div className="hub-v2-profile__title-row">
              <h2 className="h1 hub-v2-profile__preview-name">{displayName}</h2>
              {(user.isAdmin || isPromoter) && (
                <span className="kick hub-v2-profile__badge">
                  {user.isAdmin ? "Verified" : "Promoter"}
                </span>
              )}
            </div>
            <div className="kick hub-v2-profile__handle">@{user.username}</div>
          </div>
        </div>

        {user.bio && <p className="hub-v2-profile__bio">{user.bio}</p>}

        <div className="hub-v2-profile__actions">
          <Link
            href={`/u/${encodeURIComponent(user.username)}`}
            className="hub-v2-profile__btn hub-v2-profile__btn--cyan"
          >
            View public profile
          </Link>
          {!profileEditor && onEditProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="hub-v2-profile__btn hub-v2-profile__btn--ghost"
            >
              Edit on your profile page
            </button>
          )}
        </div>

        <div className="statwrap hub-v2-profile__stats">
          {stats.map(st => (
            <div key={st.label} className="hub-v2-profile__stat">
              <div className="statnum hub-v2-profile__stat-num">{st.value}</div>
              <div className="kick hub-v2-profile__stat-label">{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Posts live on the public profile; hub Profile is edit-only now. */}
      {!profileEditor && (
        <>
          <div className="kick" style={{ marginBottom: 16 }}>
            Your posts
          </div>
          <div className="card hub-v2-profile__empty">
            <p>
              {postsCount > 0
                ? "Your posts will show here."
                : "You haven't posted yet. Share a photo, update, or check-in from your feed."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}