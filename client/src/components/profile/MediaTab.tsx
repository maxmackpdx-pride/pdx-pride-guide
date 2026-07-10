import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicProfile } from "./types";

function parseEmbed(raw: string): string | null {
  const m = raw.match(/src\s*=\s*["']([^"']+)["']/i);
  if (m && /soundcloud|spotify/i.test(m[1])) return m[1].replace(/^http:/, "https:");
  if (/w\.soundcloud\.com\/player/i.test(raw)) return raw.trim().replace(/^http:/, "https:");
  const u = raw.match(/https?:\/\/(?:www\.|m\.)?soundcloud\.com\/[^\s"'<>]+/i);
  if (u) {
    const enc = encodeURIComponent(u[0]);
    return (
      "https://w.soundcloud.com/player/?url=" +
      enc +
      "&color=%23FF00CC&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true"
    );
  }
  return null;
}

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MediaTab({ profile }: { profile: PublicProfile }) {
  const media = profile.profileMedia;
  const embeds = profile.profileEmbeds || [];
  const tracks = media?.items || [];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const activeTrack = useMemo(
    () => tracks.find(t => t.id === activeId) || null,
    [tracks, activeId],
  );

  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.removeAttribute("src");
      }
    };
  }, []);

  // Stop when profile identity changes
  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      setPlaying(false);
      setActiveId(null);
    }
  }, [profile.username]);

  const playTrack = async (id: string) => {
    const track = tracks.find(t => t.id === id);
    if (!track?.audioUrl) return;
    const a = audioRef.current;
    if (!a) return;
    if (activeId === id) {
      if (playing) {
        a.pause();
        setPlaying(false);
      } else {
        await a.play();
        setPlaying(true);
      }
      return;
    }
    setActiveId(id);
    a.src = track.audioUrl;
    a.load();
    try {
      await a.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const seek = (ratio: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration)) return;
    a.currentTime = Math.max(0, Math.min(a.duration, ratio * a.duration));
  };

  const platforms = media?.platformLinks || {};
  const hasAudio = tracks.some(t => t.audioUrl);
  const embedSrc =
    !hasAudio && embeds[0]
      ? parseEmbed(embeds[0].src || "") || (embeds[0].src.startsWith("http") ? embeds[0].src : null)
      : null;

  if (!media && embeds.length === 0) {
    return <p className="profile-empty">No media yet. Sets, mixtapes, and podcasts will show up here.</p>;
  }

  return (
    <div>
      <h2 className="profile-section-title">Media</h2>

      {media && (
        <div className="profile-media-featured">
          <div className="profile-media-cover">{media.coverText || media.tag || "Media"}</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 11, color: "var(--profile-accent-text)" }}>
              {media.tag}
            </div>
            <h3 style={{ margin: "6px 0", fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", fontSize: "1.35rem" }}>
              {media.title}
            </h3>
            {media.blurb && <p style={{ margin: 0, color: "var(--text-mid)", lineHeight: 1.5 }}>{media.blurb}</p>}
            <div className="profile-media-platforms">
              {Object.entries(platforms).map(([key, href]) =>
                href ? (
                  <a key={key} className="profile-btn profile-btn--ghost" href={href} target="_blank" rel="noopener noreferrer">
                    {key}
                  </a>
                ) : null,
              )}
            </div>
          </div>
        </div>
      )}

      {hasAudio && (
        <>
          <audio
            ref={audioRef}
            onTimeUpdate={e => setElapsed((e.target as HTMLAudioElement).currentTime)}
            onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)}
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          />
          {tracks.map(t => {
            const isActive = activeId === t.id;
            return (
              <div key={t.id} className="profile-track">
                <button
                  type="button"
                  className={`profile-track__play${isActive && playing ? " is-on" : ""}`}
                  onClick={() => playTrack(t.id)}
                  disabled={!t.audioUrl}
                  aria-label={isActive && playing ? "Pause" : "Play"}
                >
                  {isActive && playing ? "❚❚" : "▶"}
                </button>
                <div>
                  <div className="profile-track__title">{t.title}</div>
                  <div className="profile-track__meta">
                    {t.label}
                    {t.meta ? ` · ${t.meta}` : ""}
                    {isActive ? ` · ${fmtTime(elapsed)} / ${fmtTime(duration)}` : ""}
                  </div>
                </div>
                {isActive && (
                  <input
                    className="profile-track__scrub"
                    type="range"
                    min={0}
                    max={1000}
                    value={duration > 0 ? Math.round((elapsed / duration) * 1000) : 0}
                    onChange={e => seek(Number(e.target.value) / 1000)}
                    aria-label="Seek"
                  />
                )}
              </div>
            );
          })}
        </>
      )}

      {embedSrc && (
        <iframe
          className="profile-embed"
          src={embedSrc}
          title={embeds[0]?.title || "Embedded media"}
          allow="autoplay"
          loading="lazy"
        />
      )}

      {!hasAudio && !embedSrc && media && (
        <p className="profile-empty">Add track audio or a SoundCloud embed to play media here.</p>
      )}
    </div>
  );
}
