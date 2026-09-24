import { useState } from "react";
import { Play } from "lucide-react";
import { redgifsMedia } from "@shared/communityMedia";
import "./RedgifsMedia.css";

export default function RedgifsMedia({ url, title }: { url: string; title: string }) {
  const media = redgifsMedia(url);
  const [playing, setPlaying] = useState(false);
  if (!media) return null;
  return <div className="z-redgifs-media">
    {playing ? <iframe title={`RedGIFs media: ${title}`} src={media.embedUrl} loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/> : <button type="button" className="z-redgifs-media__play" onClick={event => { event.stopPropagation(); setPlaying(true); }}><Play size={22}/> Play photo or video</button>}
    <a href={media.watchUrl} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()}>Open on RedGIFs ↗</a>
  </div>;
}
