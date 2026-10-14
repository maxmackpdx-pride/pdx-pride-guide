import { BoardCardMotif } from "./BoardCardMotif";
import { CardArtworkGlass } from "../CardArtworkGlass";
import { useState } from "react";
import { boardCategories, type BoardPost } from "@/lib/allBoards";

export default function UnifiedBoardArt({ post }: { post: BoardPost }) {
  const cat = boardCategories.find((category) => category.id === post.category)!;
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const hasPhoto = !!post.photo && failedPhoto !== post.photo;
  return <div className={`ab-art ab-art--${post.intent} ab-art--unified${hasPhoto ? " ab-art--photo" : ""}`} aria-hidden="true">
    {hasPhoto ? <img className="ab-art__photo" src={post.photo} alt="" loading="lazy" onError={() => setFailedPhoto(post.photo || null)} /> : <BoardCardMotif post={post} />}
    {post.intent === "forming" && <div className="ab-household ab-household--clear">
      <strong>{post.householdCount ?? 0}<span> in</span></strong>
      <small>{post.openSlots ? `${post.openSlots} ${post.openSlots === 1 ? "spot" : "spots"} to go` : "Building a Hoüz"}</small>
    </div>}
    <CardArtworkGlass />
    <img className="ab-art__brand" src={`/brand/family/${cat.logo}`} alt="" />
  </div>;
}
