import type { MouseEvent, ReactNode } from "react";
import UserAvatar from "@/components/UserAvatar";
import { avatarHrefFor } from "@/lib/avatarLinks";
import { demoListingCover, isDemoListingAuthor } from "@/lib/demoListingCover";
import type { HubFeedItem } from "@shared/hubFeed";

function stopCardNav(e: MouseEvent) {
  e.stopPropagation();
}

const KIND_KICKER: Record<string, string> = {
  housing: "HAÜSING",
  gig: "GIGZ",
  gifting: "GIFTZ",
  sellz: "SELLZ",
};

type Props = {
  item: HubFeedItem;
  when: string;
  openLabel: string;
  openControl: ReactNode;
};

export default function HubFeedBoardFace({ item, when, openLabel, openControl }: Props) {
  const isDemo = isDemoListingAuthor(item.author);
  const kicker = [
    KIND_KICKER[item.kind] || item.badge,
    isDemo ? "DEMO" : null,
    !isDemo && item.badge && item.badge !== KIND_KICKER[item.kind] ? item.badge : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const title = item.title || item.action;
  const initial = (item.author.displayName || "?").trim().charAt(0).toUpperCase();
  const cover = demoListingCover(title, item.photoUrl);

  return (
    <div className="hub-feed-board">
      {isDemo ? (
        <span className="kick hub-feed-card__demo hub-feed-board__demo" aria-label="Demo listing">
          DEMO
        </span>
      ) : null}

      <div className="hub-feed-board__well">
        {cover ? (
          <img
            src={cover}
            alt={title ? `${title} photo` : `Photo shared by ${item.author.displayName}`}
            loading="lazy"
          />
        ) : (
          <div className="hub-feed-board__ghost" aria-hidden="true">
            {initial}
          </div>
        )}
        <div className="hub-feed-board__well-shade" aria-hidden="true" />
        <h3 className="hub-feed-board__well-title">{title}</h3>
      </div>

      <div className="kick hub-feed-board__kicker">{kicker}{!isDemo && when ? ` · ${when}` : ""}</div>

      {item.text ? <p className="hub-feed-board__text">{item.text}</p> : null}

      {item.place ? <div className="kick hub-feed-board__place">{item.place}</div> : null}

      <div className="hub-feed-board__who">
        <UserAvatar
          photoUrl={item.author.photoUrl}
          avatarChoice={item.author.avatarChoice}
          avatarRing={item.author.avatarRing}
          displayName={item.author.displayName}
          username={item.author.username ?? undefined}
          logoFit={item.author.venueLogo}
          href={avatarHrefFor(item.author)}
          onClick={stopCardNav}
          size={28}
        />
        <span>{item.author.displayName}</span>
      </div>

      <div className="hub-feed-board__act">
        {openControl ?? (
          <span className="hub-feed-board__open">{openLabel}</span>
        )}
      </div>
    </div>
  );
}
