import type React from "react";
import { useProfileAudioPlayer, formatAudioTime } from "@/hooks/useProfileAudioPlayer";
import type { MemberProfileData, ProfileMediaItem } from "../types";

function PlayIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>;
}
function PauseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" />
    </svg>
  );
}

function MediaRow({
  item,
  index,
  isNew,
  player,
}: {
  item: ProfileMediaItem;
  index: number;
  isNew: boolean;
  player: ReturnType<typeof useProfileAudioPlayer>;
}) {
  const active = player.playingId === String(item.id);
  const playing = active && player.isPlaying;
  const pct = active && player.duration ? (player.currentTime / player.duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    player.seek(frac);
  };

  return (
    <div className={`mp-media-row${active ? " mp-media-row--active" : ""}`}>
      <div className="mp-media-row__main">
        {item.isEmbed ? (
          <div className="mp-media-row__embed-badge">Embed</div>
        ) : (
          <button
            type="button"
            className="mp-media-row__play"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => player.playTrack(String(item.id), item.audioUrl)}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
        )}
        <div className="mp-media-row__text">
          <div className="mp-media-row__title">{item.label ? `${item.label}. ` : `${index + 1}. `}{item.title}</div>
          {item.meta && <div className="mp-media-row__meta">{item.meta}</div>}
        </div>
        {isNew && <span className="mp-media-row__new">New</span>}
      </div>
      {item.isEmbed ? (
        <iframe
          title={item.title}
          width="100%"
          height={166}
          frameBorder="no"
          scrolling="no"
          allow="autoplay"
          src={item.audioUrl}
          className="mp-embed-frame"
        />
      ) : active && (
        <div className="mp-media-row__scrub">
          <span className="mp-media-row__time">{formatAudioTime(player.currentTime)}</span>
          <div className="mp-media-row__track" onClick={handleSeek}>
            <div className="mp-media-row__fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="mp-media-row__time">{formatAudioTime(player.duration)}</span>
        </div>
      )}
    </div>
  );
}

export default function MediaTab({ data }: { data: MemberProfileData }) {
  const player = useProfileAudioPlayer();
  const media = data.media;
  const isPromoter = !!data.showPromoterVariant;
  const kicker = isPromoter ? "Listen in" : "On repeat";

  if (!media) {
    return (
      <div>
        <div className="mp-section-kicker">{kicker}</div>
        <h2 className="display mp-section-title">Media</h2>
        <div className="mp-empty">
          <div className="display mp-empty__title">Nothing here yet</div>
          <p>{data.isOwner ? "Add a podcast or playlist from your dashboard to feature it here." : `${data.displayName || data.username} hasn't added any media yet.`}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mp-section-kicker">{kicker}</div>
      <h2 className="display mp-section-title">Media</h2>

      <div className="mp-media-featured">
        <div className="mp-media-featured__cover">
          <span>{media.coverUrl ? <img src={media.coverUrl} alt="" /> : media.title}</span>
        </div>
        <div className="mp-media-featured__body">
          <div className="mp-media-featured__tags">
            {media.tag && <span className="mp-media-featured__tag">{media.tag}</span>}
            {media.cadence && <span className="mp-media-featured__cadence">{media.cadence}</span>}
          </div>
          <h3 className="display mp-media-featured__title">{media.title}</h3>
          {media.blurb && <p className="mp-media-featured__blurb">{media.blurb}</p>}
          {media.platformLinks.length > 0 && (
            <div className="mp-media-featured__platforms">
              {media.platformLinks.map(pl => (
                <a key={pl.label} href={pl.url} target="_blank" rel="noopener noreferrer" className="mp-media-platform">
                  <span className="mp-media-platform__dot" aria-hidden="true" />
                  {pl.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mp-media-list">
        {media.items.map((item, i) => (
          <MediaRow key={item.id} item={item} index={i} isNew={i === 0} player={player} />
        ))}
      </div>
    </div>
  );
}
