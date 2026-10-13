import { CardArtworkGlass } from "../CardArtworkGlass";
import { useState } from "react";
import { boardCategories, type BoardPost } from "@/lib/allBoards";

// The original board families keep their recognizable intent motifs inside the
// shared wide card well. The artwork never shares a plane with a label or logo.
const marks = {
  gift: <path d="M8 20h32v6H8zM11 26v14h26V26M24 20v20M24 20c-2-6-9-9-11-6s2 6 11 6M24 20c2-6 9-9 11-6s-2 6-11 6" />,
  search: <><circle cx="21" cy="21" r="12" /><path d="M30 30l9 9" /></>,
  binoculars: <><circle cx="16" cy="26" r="8" /><circle cx="32" cy="26" r="8" /><path d="M24 26c0-3 2-5 4-5M24 26c0-3-2-5-4-5M16 18c0-3 2-5 5-5M32 18c0-3-2-5-5-5" /></>,
  dollar: <path d="M24 8v32M31 15c0-3-3-5-7-5s-7 2-7 5 3 4 7 5 7 2 7 5-3 5-7 5-7-2-7-5" />,
  home: <path d="M8 24 24 10l16 14M12 21v19h24V21M20 40V28h8v12" />,
};

export default function UnifiedBoardArt({ post }: { post: BoardPost }) {
  const cat = boardCategories.find((category) => category.id === post.category)!;
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const hasPhoto = !!post.photo && failedPhoto !== post.photo;
  const mark = post.intent === "giving" ? "gift"
    : post.intent === "iso" || post.intent === "looking" ? "search"
      : post.intent === "available" ? "binoculars"
        : post.intent === "selling" || post.intent === "hiring" ? "dollar" : "home";
  return <div className={`ab-art ab-art--${post.intent} ab-art--unified${hasPhoto ? " ab-art--photo" : ""}`} aria-hidden="true">
    {hasPhoto ? <img className="ab-art__photo" src={post.photo} alt="" loading="lazy" onError={() => setFailedPhoto(post.photo || null)} /> : <>
      <svg className="ab-art__space" viewBox="0 0 200 300" fill="none" preserveAspectRatio="xMidYMid slice">
        <path d="M-40 210 110 135 240 185M-40 240 110 165 240 215M-40 270 110 195 240 245M-40 300 110 225 240 275M10 330 40 170M75 340 110 135M140 340 180 160" />
        <circle cx="110" cy="165" r="2" /><circle cx="40" cy="170" r="2" /><circle cx="180" cy="160" r="2" />
      </svg>
      {post.intent === "connection" ? <span className="ab-art__quote-pair"><span>“</span><span>”</span></span>
        : post.intent !== "forming" && <svg className="ab-art__intent-mark" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">{marks[mark]}</svg>}
    </>}
    {post.intent === "forming" && <div className="ab-household ab-household--clear">
      <strong>{post.householdCount ?? 0}<span> in</span></strong>
      <small>{post.openSlots ? `${post.openSlots} ${post.openSlots === 1 ? "spot" : "spots"} to go` : "Building a Hoüz"}</small>
    </div>}
    <CardArtworkGlass />
    <img className="ab-art__brand" src={`/brand/family/${cat.logo}`} alt="" />
  </div>;
}
