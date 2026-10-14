import { housingTagLabel } from "@shared/housingTags";
import type { CSSProperties } from "react";
import { Bookmark, MapPin, ArrowRight } from "lucide-react";
import { boardCategories,intentLabels,type BoardPost } from "@/lib/allBoards";
import BoardPushPin from "./BoardPushPin";
import { BoardCardMotif } from "./BoardCardMotif";
import UnifiedBoardArt from "./UnifiedBoardArt";
import BoardMapPlacement from "./BoardMapPlacement";
import "@/pages/AllBoards.css";
export default function BoardBrowseCard({post,isSaved=false,saveDisabled=false,showStatus=false,onSave,onOpen}:{post:BoardPost;isSaved?:boolean;saveDisabled?:boolean;showStatus?:boolean;onSave:()=>void;onOpen:(target:HTMLButtonElement)=>void}) {
 const cat=boardCategories.find(c=>c.id===post.category)!;
 return (
                      <div
                        key={post.key}
                        className={`ab-pinned-card pdx-glass-rebind ab-pinned-card--${post.category}`}
                        style={{ "--c": cat.color, "--ab-accent": post.category==="housing"?({managed:"var(--neon-coral)",looking:"var(--day-thu)",offering:"var(--day-fri)",forming:"var(--day-sat)"} as Record<string,string>)[post.intent]:cat.color } as CSSProperties}
                      >
                        <BoardPushPin postKey={post.key} />
                        <article className={`ab-card ab-card--${post.intent} pdx-glass-rebind`}>
                        {post.category==="housing" && post.intent!=="managed" && <div className="ab-card__intent-edge" aria-hidden="true"/>}
                        <BoardCardMotif post={post} placement="card" />
                        <div className="ab-card__glass" aria-hidden="true" />
                        <UnifiedBoardArt post={post} />
                        <div className="ab-card__body">
                          <div className="ab-card__eyebrow">
                            <p className="ab-card__type">{intentLabels[post.intent]}</p>{post.isDemo && <span className="ab-demo-badge">DEMO</span>}{showStatus && <span>{post.status}</span>}
                          </div>
                          {!!post.tags?.length && <div className="ab-card__tags" role="group" tabIndex={0} aria-label="Post tags, scroll for more">{post.tags.map(tag=><span key={tag}>{post.category==="housing"?housingTagLabel(tag):tag}</span>)}</div>}
                          <h3>
                            <button
                              type="button"
                              onClick={(e) => onOpen(e.currentTarget)}
                            >
                              {post.title}
                            </button>
                          </h3>
                          <p className="ab-card__detail">
                            {post.detail || post.description}
                          </p>
                          <div className="ab-card__bottom">
                          {post.value && (
                            <strong className="ab-card__value">
                              {post.value.trim().toLowerCase() === "free" ? "FREE" : post.value}
                            </strong>
                          )}
                          <p className="ab-card__location" aria-hidden={!post.area || undefined} title={post.area || undefined}>
                            {post.area && <><MapPin size={13} /><span>{post.area}</span></>}
                          </p>
                          <div className="ab-card__footer">
                            <button
                              type="button"
                              className="ab-save"
                              aria-label={`${isSaved ? "Unsave" : "Save"} ${post.title}`}
                              aria-pressed={isSaved}
                              disabled={saveDisabled}
                              onClick={onSave}
                            >
                              <Bookmark
                                size={16}
                                fill={isSaved ? "currentColor" : "none"}
                              />
                              {isSaved ? "Saved" : "Save"}
                            </button>
                            <button
                              type="button"
                              className="ab-open"
                              aria-label={`Open ${post.title}`}
                              onClick={(e) => onOpen(e.currentTarget)}
                            >
                              Open <ArrowRight size={16} />
                            </button>
                          </div>
                          </div>
                        </div>
                        </article>
                        {post.isMine && <BoardMapPlacement board={post.category} postId={post.id}/>}
                      </div>);
}
