import { useEffect, useRef, useState } from "react";
import { SectionHeader } from "@/components/ds";
import { fmtProfileTime } from "./profileHelpers";
import type { ProfileMedia, ProfileMediaItem } from "./types";

type Props = {
  media: ProfileMedia | null;
  active: boolean;
};

export default function MediaTab({ media, active }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onTime = () => setCurTime(audio.currentTime || 0);
    const onMeta = () => setDur(audio.duration || 0);
    const onEnded = () => { setIsPlaying(false); setCurTime(0); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!active && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      setIsPlaying(false);
      setCurTime(0);
      setDur(0);
    }
  }, [active]);

  if (!media?.title || !media.items?.length) {
    return <p className="pp-empty-copy">No media shared yet.</p>;
  }

  const playTrack = (item: ProfileMediaItem) => {
    const audio = audioRef.current;
    if (!audio) return;
    const url = item.audioUrl || item.embedSrc;
    if (!url) return;

    if (playingId === item.id) {
      if (audio.paused) {
        void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }

    audio.src = url;
    try { audio.currentTime = 0; } catch { /* noop */ }
    setPlayingId(item.id);
    setIsPlaying(true);
    setCurTime(0);
    setDur(0);
    void audio.play().catch(() => setIsPlaying(false));
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    audio.currentTime = frac * audio.duration;
  };

  const pct = dur ? (curTime / dur) * 100 : 0;

  return (
    <section className="pp-media">
      <SectionHeader kicker={media.kicker || "Listen in"} title="Media" />
      <div className="pp-media__featured">
        <div className="pp-media__cover">
          <span className="display pp-media__cover-text">{media.coverText || media.title.slice(0, 12)}</span>
        </div>
        <div className="pp-media__featured-body">
          <div className="pp-media__tags">
            {media.tag && <span className="display pp-media__tag">{media.tag}</span>}
            {media.meta && <span className="pp-media__meta">{media.meta}</span>}
          </div>
          <h3 className="display pp-media__title">{media.title}</h3>
          {media.blurb && <p className="pp-media__blurb">{media.blurb}</p>}
          {media.platformLinks && media.platformLinks.length > 0 && (
            <div className="pp-media__platforms">
              {media.platformLinks.map(p => (
                <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer" className="pp-media__platform display">
                  <span className="pp-media__platform-dot" style={{ background: p.dot }} aria-hidden="true" />
                  {p.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pp-media__tracks">
        {media.items.map(item => {
          const activeRow = playingId === item.id;
          const playing = activeRow && isPlaying;
          return (
            <div key={item.id} className={`pp-media__track${activeRow ? " is-active" : ""}`}>
              <button type="button" className="pp-media__play" onClick={() => playTrack(item)} aria-label={playing ? "Pause" : "Play"}>
                {playing ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <div className="pp-media__track-main">
                <div className="pp-media__track-top">
                  <span className="display pp-media__track-label">{item.label}</span>
                  {item.latest && <span className="display pp-media__latest">Latest</span>}
                </div>
                <div className="pp-media__track-title">{item.title}</div>
                {item.meta && <div className="pp-media__track-meta">{item.meta}</div>}
                {activeRow && (item.audioUrl || item.embedSrc) && (
                  <div className="pp-media__scrub">
                    <div className="pp-media__scrub-bar" onClick={seek} role="slider" aria-valuemin={0} aria-valuemax={dur} aria-valuenow={curTime} tabIndex={0}>
                      <div className="pp-media__scrub-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="pp-media__time">{fmtProfileTime(curTime)} / {fmtProfileTime(dur)}</span>
                  </div>
                )}
                {activeRow && item.embedSrc && !item.audioUrl && (
                  <iframe
                    title={item.title}
                    src={item.embedSrc}
                    className="pp-media__embed"
                    allow="autoplay"
                    loading="lazy"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}