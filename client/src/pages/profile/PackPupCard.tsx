import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import type { MemberProfileData, PackLinkUser } from "./types";

function PackChip({ person, borderColor, onRemove }: { person: PackLinkUser; borderColor: string; onRemove?: () => void }) {
  return (
    <span className="mp-pack-chip" style={{ borderColor }}>
      <Link href={`/u/${person.username}`} className="mp-pack-chip__link">
        <UserAvatar
          photoUrl={person.photoUrl}
          avatarChoice={person.avatarChoice}
          avatarRing={person.avatarRing}
          displayName={person.displayName}
          username={person.username}
          size={30}
        />
        <span className="mp-pack-chip__text">
          <span className="mp-pack-chip__name">{person.displayName || person.username}</span>
          <span className="mp-pack-chip__handle">@{person.username}</span>
        </span>
      </Link>
      {onRemove && (
        <button type="button" className="mp-pack-chip__remove" onClick={onRemove} aria-label={`Remove @${person.username}`}>
          ✕
        </button>
      )}
    </span>
  );
}

export default function PackPupCard({
  data,
  onAddLink,
  onRemoveLink,
}: {
  data: MemberProfileData;
  onAddLink: (relation: "packmate" | "handler") => void;
  onRemoveLink: (relation: "packmate" | "handler", userId: number) => void;
}) {
  const pup = data.pup;
  const isOwner = !!data.isOwner;
  const packmates = data.packmates ?? [];
  const handlers = data.handlers ?? [];

  if (!pup && !isOwner) return null;
  if (!pup) return null;

  return (
    <div className="mp-pack-card">
      <div className="mp-section-kicker" style={{ color: "var(--neon-magenta)" }}>Pack &amp; pup life</div>
      <h3 className="display mp-pack-card__name">{pup.name}</h3>
      <div className="mp-pack-facts">
        <div><div className="mp-pack-facts__label">Pup name</div><div className="mp-pack-facts__value">{pup.name}</div></div>
        {pup.hood && <div><div className="mp-pack-facts__label">Hood</div><div className="mp-pack-facts__value">{pup.hood}</div></div>}
        {pup.role && <div><div className="mp-pack-facts__label">Role</div><div className="mp-pack-facts__value">{pup.role}</div></div>}
        {pup.lookingFor && <div><div className="mp-pack-facts__label">Looking for</div><div className="mp-pack-facts__value">{pup.lookingFor}</div></div>}
      </div>

      <div className="mp-pack-section">
        <div className="mp-pack-section__label">
          Packmates
          {isOwner && <button type="button" className="mp-pack-add-btn" onClick={() => onAddLink("packmate")}>+ Add</button>}
        </div>
        {packmates.length > 0 ? (
          <div className="mp-pack-chips">
            {packmates.map(p => (
              <PackChip key={p.id} person={p} borderColor="var(--border-strong)" onRemove={isOwner ? () => onRemoveLink("packmate", p.id) : undefined} />
            ))}
          </div>
        ) : (
          <p className="mp-pack-section__empty">No packmates tagged yet.</p>
        )}
      </div>

      <div className="mp-pack-section">
        <div className="mp-pack-section__label">
          Handlers
          {isOwner && <button type="button" className="mp-pack-add-btn" onClick={() => onAddLink("handler")}>+ Add</button>}
        </div>
        {handlers.length > 0 ? (
          <div className="mp-pack-chips">
            {handlers.map(p => (
              <PackChip key={p.id} person={p} borderColor="var(--neon-cyan)" onRemove={isOwner ? () => onRemoveLink("handler", p.id) : undefined} />
            ))}
          </div>
        ) : (
          <p className="mp-pack-section__empty">No handlers tagged yet.</p>
        )}
      </div>
    </div>
  );
}
