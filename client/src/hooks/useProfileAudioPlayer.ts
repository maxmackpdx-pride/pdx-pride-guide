import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One shared <audio> element per hook instance - naturally enforces "only one
 * track plays at a time" since a single Audio object can't play two sources.
 * Used by the profile Media tab; stops on unmount (tab switch away from Media).
 */
export function useProfileAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime || 0));
      audio.addEventListener("loadedmetadata", () => setDuration(audio.duration || 0));
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const playTrack = useCallback((id: string, url: string) => {
    const audio = ensureAudio();
    if (playingId === id) {
      if (audio.paused) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }
    audio.src = url;
    try { audio.currentTime = 0; } catch { /* not seekable yet */ }
    setPlayingId(id);
    setCurrentTime(0);
    setDuration(0);
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [ensureAudio, playingId]);

  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = Math.min(1, Math.max(0, fraction)) * audio.duration;
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setPlayingId(null);
  }, []);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  return { playingId, isPlaying, currentTime, duration, playTrack, seek, stop };
}

export function formatAudioTime(seconds: number): string {
  const total = Math.floor(seconds || 0);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}
