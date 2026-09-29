import type { CSSProperties, MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { avatarHrefFor } from "@/lib/avatarLinks";
import { isHousingDemoAuthor } from "@/lib/housingDemo";
import type { HubFeedItem } from "@shared/hubFeed";

function stop(e: MouseEvent) {
  e.stopPropagation();
}

function ghost(item: HubFeedItem) {
  const raw = item.title || item.author.displayName || item.badge || "?";
  return raw.trim().charAt(0).toUpperCase();
}

export default function HubFeedBoardFace({
  item,
  accent,
  when,
  openLabel,
  onOpen,
}: {
  item: HubFeedItem;
  accent?: string;
  when: string;
  openLabel: string;
  onOpen: () => void;
}) {
  const demo = item.kind === "housing" && isHousingDemoAuthor(item.author);
  const style = accent
    ? ({ "--c": accent, "--hub-feed-accent": accent, "--listing-accent": accent } as CSSProperties)
    : undefined;

  return (
    <div className="hub-feed-board pdx-glass-rebind" style={style}>
      {demo ? <span className="hub-feed-card__demo hub-feed-board__demo">DEMO</span> : null}
      <div className="hub-feed-board__row">
        <div className="hub-feed-board__thumb" aria-hidden="true">
          {item.photoUrl ? (
            <img src={item.photoUrl} alt="" />
          ) : (
            <span className="hub-feed-board__ghost">{ghost(item)}</span>
          )}
        </div>
        <div className="hub-feed-board__copy">
          <div className="kick hub-feed-board__kicker">
            <span>{item.badge || item.action}</span>
            {when ? <span aria-hidden="true"> · {when}</span> : null}
          </div>
          {item.title ? <h4 className="hub-feed-board__title">{item.title}</h4> : null}
          {item.text ? <p className="hub-feed-board__text">{item.text}</p> : null}
          <div className="hub-feed-board__who">
            <UserAvatar
              photoUrl={item.author.photoUrl}
              avatarChoice={item.author.avatarChoice}
              avatarRing={item.author.avatarRing}
              displayName={item.author.displayName}
              username={item.author.username ?? undefined}
              href={avatarHrefFor(item.author)}
              onClick={stop}
              size={22}
            />
            <span>{item.author.displayName}</span>
          </div>
          <button type="button" className="hub-feed-card__open hub-feed-board__open" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            {openLabel} <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
