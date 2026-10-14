import { BoardArchiveAction } from "./BoardArchiveList";
import { housingTagLabel } from "@shared/housingTags";
import { useRef, type CSSProperties } from "react";
import { MapPin } from "lucide-react";
import ZLineIcon from "@/components/ZLineIcon";
import { boardCategories,intentLabels,type BoardPost } from "@/lib/allBoards";
import BoardPushPin from "./BoardPushPin";
import { BoardCardMotif } from "./BoardCardMotif";
import UnifiedBoardArt from "./UnifiedBoardArt";
import BoardMapPlacement from "./BoardMapPlacement";
import "@/pages/AllBoards.css";
export default function BoardBrowseCard({post,isSaved=false,saveDisabled=false,showStatus=false,onSave,onOpen}:{post:BoardPost;isSaved?:boolean;saveDisabled?:boolean;showStatus?:boolean;onSave:()=>void;onOpen:(target:HTMLButtonElement)=>void}) {
 const openTarget = useRef<HTMLButtonElement>(null);
 const cat=boardCategories.find(c=>c.id===post.category)!;
 return (
                      <div
                        key={post.key}
                        className={`ab-pinned-card pdx-glass-rebind ab-pinned-card--${post.category}`}
                        style={{ "--c": cat.color, "--ab-accent": post.category==="housing"?({managed:"var(--neon-coral)",looking:"var(--day-thu)",offering:"var(--day-fri)",forming:"var(--day-sat)"} as Record<string,string>)[post.intent]:cat.color } as CSSProperties}
                      >
                        <BoardPushPin postKey={post.key} />
                        <article className={`ab-card ab-card--${post.intent} pdx-glass-rebind`} onClick={event => {
                          if ((event.target as Element).closest("button,a,input,select,textarea,summary,[role=button]")) return;
                          if (openTarget.current) onOpen(openTarget.current);
                        }}>
                        {post.category==="housing" && post.intent!=="managed" && <div className="ab-card__intent-edge" aria-hidden="true"/>}
                        <BoardCardMotif post={post} placement="card" />
                        <div className="ab-card__glass" aria-hidden="true" />
                        <UnifiedBoardArt post={post} />
                        {(post.isDemo || showStatus) && <div className="ab-card__status">{post.isDemo && <span className="ab-demo-badge">DEMO</span>}{showStatus && <span>{post.status}</span>}</div>}
                        <div className="ab-card__body">
                          <div className="ab-card__eyebrow">
                            <p className="ab-card__type">{intentLabels[post.intent]}</p>
                          </div>
                          <div className="ab-card__tags" role={post.tags?.length ? "group" : undefined} tabIndex={post.tags?.length ? 0 : undefined} aria-hidden={!post.tags?.length || undefined} aria-label={post.tags?.length ? "Post tags, scroll for more" : undefined}>{post.tags?.map(tag=><span key={tag}>{post.category==="housing"?housingTagLabel(tag):tag}</span>)}</div>
                          <h3>
                            <button
                              ref={openTarget}
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
                          <strong className="ab-card__value" aria-hidden={(!post.value && !post.valueLabel) || undefined}>
                              <span className="ab-card__value-amount">{post.value?.trim().toLowerCase() === "free" ? "FREE" : post.value}</span>
                              {post.valueLabel && <small className="ab-card__value-label">{post.value ? post.valueLabel : `${post.valueLabel} not set`}</small>}
                            </strong>
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
                              <ZLineIcon name="favorite" size={18} filled={isSaved} />
                            </button>
                          </div>
                          </div>
                        </div>
                        </article>
                        {post.isMine && <div className="board-card-owner-controls"><BoardMapPlacement board={post.category} postId={post.id}/><BoardArchiveAction board={post.category} postId={post.id} title={post.title}/></div>}
                      </div>);
}
