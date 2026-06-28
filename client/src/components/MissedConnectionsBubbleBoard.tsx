import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BoardLoadingState from "./BoardLoadingState";
import type { LinkableMissedConnectionEvent, MissedConnectionPost } from "./MissedConnectionsPanel";

const BUBBLE_COLORS = ["#FF1FA0", "#19E3FF", "#C8FA3C", "#A24BFF", "#FF8C00", "#E40303"];
const AROUND_TOWN_KEY = "around";
const CUSTOM_SPOT_KEY = "custom";
const GENERAL_SPOT_COLOR = "#FF8C00";

type Phys = { x: number; y: number; vx: number; vy: number; size: number };
type SpotMode = typeof AROUND_TOWN_KEY | typeof CUSTOM_SPOT_KEY | "event";

function eventColor(eventId: number | null | undefined, fallbackKey: string): string {
  const key = eventId != null ? String(eventId) : fallbackKey;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return BUBBLE_COLORS[hash % BUBBLE_COLORS.length];
}

function bubbleSize(id: number): number {
  const s = (id * 9301 + 49297) % 233280;
  return 64 + (Math.abs(s) / 233280) * 38;
}

function postGlyph(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return title.trim().slice(0, 2).toUpperCase() || "?";
}

function deriveTitle(title: string, body: string): string {
  const trimmed = title.trim();
  if (trimmed) return trimmed.slice(0, 80);
  const line = body.trim().split(/\n/)[0] || body.trim();
  return line.slice(0, 80) || "Spotted";
}

type Props = {
  posts: MissedConnectionPost[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  linkableEvents: LinkableMissedConnectionEvent[];
};

export default function MissedConnectionsBubbleBoard({
  posts,
  isLoading,
  isError,
  refetch,
  linkableEvents,
}: Props) {
  const { toast } = useToast();
  const fieldRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<Record<number, Phys>>({});
  const [, setFrame] = useState(0);

  const [activeEventFilter, setActiveEventFilter] = useState<number | typeof AROUND_TOWN_KEY | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<MissedConnectionPost | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const [spotMode, setSpotMode] = useState<SpotMode>(AROUND_TOWN_KEY);
  const [draftEventId, setDraftEventId] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftVenueHint, setDraftVenueHint] = useState("");
  const [draftCustomEventName, setDraftCustomEventName] = useState("");
  const [draftCustomLocation, setDraftCustomLocation] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);

  const prefersReducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const groupedEvents = useMemo(() => ({
    live: linkableEvents.filter(evt => evt.timing === "live"),
    upcoming: linkableEvents.filter(evt => evt.timing === "upcoming"),
    past: linkableEvents.filter(evt => evt.timing === "past"),
  }), [linkableEvents]);

  const eventMeta = useMemo(() => {
    const map = new Map<number | typeof AROUND_TOWN_KEY, { name: string; color: string; count: number }>();
    for (const post of posts) {
      if (post.eventId == null) {
        const general = map.get(AROUND_TOWN_KEY) ?? { name: "Around town", color: GENERAL_SPOT_COLOR, count: 0 };
        general.count += 1;
        map.set(AROUND_TOWN_KEY, general);
        continue;
      }
      const existing = map.get(post.eventId);
      const color = eventColor(post.eventId, post.eventTitle || String(post.eventId));
      const name = post.eventTitle || existing?.name || `Event #${post.eventId}`;
      if (existing) {
        existing.count += 1;
      } else {
        map.set(post.eventId, { name, color, count: 1 });
      }
    }
    return map;
  }, [posts]);

  const filterChips = useMemo(
    () => Array.from(eventMeta.entries()).filter(([, v]) => v.count > 0),
    [eventMeta],
  );

  const postMatchesFilter = (post: MissedConnectionPost) => {
    if (activeEventFilter == null) return true;
    if (activeEventFilter === AROUND_TOWN_KEY) return post.eventId == null;
    return post.eventId === activeEventFilter;
  };

  const canSubmit = useMemo(() => {
    if (!draftBody.trim()) return false;
    if (spotMode === "event") return !!draftEventId;
    if (spotMode === CUSTOM_SPOT_KEY) return !!draftCustomEventName.trim() || !!draftCustomLocation.trim();
    return true;
  }, [draftBody, spotMode, draftEventId, draftCustomEventName, draftCustomLocation]);

  const resetDraftSpotFields = (mode: SpotMode) => {
    setSpotMode(mode);
    if (mode !== "event") setDraftEventId("");
    if (mode !== CUSTOM_SPOT_KEY) {
      setDraftCustomEventName("");
      setDraftCustomLocation("");
    }
    if (mode !== AROUND_TOWN_KEY) setDraftVenueHint("");
  };

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        title: deriveTitle(draftTitle, draftBody),
        body: draftBody.trim(),
        scope: "board",
      };
      if (spotMode === "event") {
        payload.eventId = Number(draftEventId);
      } else if (spotMode === CUSTOM_SPOT_KEY) {
        payload.eventLabel = draftCustomEventName.trim();
        payload.venueHint = draftCustomLocation.trim();
      } else {
        payload.venueHint = draftVenueHint.trim() || "Around town";
      }
      return fetch("/api/missed-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not post");
        return data;
      });
    },
    onSuccess: () => {
      setDraftTitle("");
      setDraftBody("");
      setDraftVenueHint("");
      setDraftCustomEventName("");
      setDraftCustomLocation("");
      setDraftEventId("");
      setSpotMode(AROUND_TOWN_KEY);
      setComposeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections/mine"] });
      toast({ title: "Posted", description: "Your note is live — you stay anonymous until you both reveal in inbox." });
    },
    onError: (err: Error) => toast({ title: "Could not post", description: err.message, variant: "destructive" }),
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/missed-connections/${replyingTo!.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: replyBody }),
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not send reply");
        return data;
      }),
    onSuccess: () => {
      setReplyingTo(null);
      setReplyBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      toast({ title: "Reply sent", description: "Thread is private. Reveal yourself in inbox when you're ready." });
    },
    onError: () => toast({ title: "Could not send reply", variant: "destructive" }),
  });

  const initPhysics = useCallback((postId: number, W: number, H: number) => {
    const size = bubbleSize(postId);
    physicsRef.current[postId] = {
      x: 40 + Math.random() * Math.max(W - size - 80, 40),
      y: 56 + Math.random() * Math.max(H - size - 80, 40),
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      size,
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    let raf = 0;
    const step = () => {
      const field = fieldRef.current;
      if (field) {
        const W = field.clientWidth;
        const H = field.clientHeight;
        for (const post of posts) {
          let phys = physicsRef.current[post.id];
          if (!phys) {
            initPhysics(post.id, W, H);
            phys = physicsRef.current[post.id];
          }
          const dim = !postMatchesFilter(post);
          const mul = dim ? 0.35 : 1;
          const sz = phys.size;

          phys.x += phys.vx * mul;
          phys.y += phys.vy * mul;

          if (phys.x < 24) { phys.x = 24; phys.vx = Math.abs(phys.vx); }
          if (phys.x > W - sz - 24) { phys.x = W - sz - 24; phys.vx = -Math.abs(phys.vx); }
          if (phys.y < 48) { phys.y = 48; phys.vy = Math.abs(phys.vy); }
          if (phys.y > H - sz - 24) { phys.y = H - sz - 24; phys.vy = -Math.abs(phys.vy); }

          phys.vx *= 0.98;
          phys.vy *= 0.98;
          phys.vx += (Math.random() - 0.5) * 0.35;
          phys.vy += (Math.random() - 0.5) * 0.35;
        }
        setFrame(f => f + 1);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [posts, activeEventFilter, prefersReducedMotion, initPhysics]);

  useEffect(() => {
    const ids = new Set(posts.map(p => p.id));
    for (const id of Object.keys(physicsRef.current).map(Number)) {
      if (!ids.has(id)) delete physicsRef.current[id];
    }
  }, [posts]);

  const staticPos = (id: number) => {
    const rand = (n: number) => {
      const s = (id * 9301 + n * 49297 + 13) % 233280;
      return Math.abs(s) / 233280;
    };
    return { left: 6 + rand(1) * 84, top: 8 + rand(2) * 70, size: bubbleSize(id) };
  };

  const fieldHint =
    activeEventFilter == null
      ? "Hover a bubble · tap Reply for a private thread"
      : `Showing · ${eventMeta.get(activeEventFilter)?.name || "filter"}`;

  const renderEventOptions = (items: LinkableMissedConnectionEvent[], label: string) => {
    if (!items.length) return null;
    return (
      <optgroup label={label}>
        {items.map(evt => (
          <option key={evt.id} value={String(evt.id)}>
            {evt.dayOfWeek} · {evt.title} @ {evt.venueName}
            {evt.postable ? "" : " (early link)"}
          </option>
        ))}
      </optgroup>
    );
  };

  return (
    <div className="mc-board">
      <section className="mc-compose">
        <button
          type="button"
          className="mc-compose__toggle"
          onClick={() => setComposeOpen(o => !o)}
          aria-expanded={composeOpen}
        >
          <span className="mc-compose__badge">Saw someone?</span>
          <span className="mc-compose__toggle-title">Post a missed connection</span>
          <span className="mc-compose__toggle-meta">Anonymous · no photo · no name</span>
        </button>

        {composeOpen && (
          <div className="mc-compose__panel">
            <input
              className="board-text-field mc-compose__title"
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value.slice(0, 80))}
              placeholder="Title (optional)"
              maxLength={80}
            />
            <textarea
              className="mc-compose__textarea board-text-field"
              value={draftBody}
              onChange={e => setDraftBody(e.target.value.slice(0, 500))}
              placeholder="You handed me a flag near the bridge and I have thought about it ever since…"
              rows={4}
            />
            <div className="mc-compose__footer">
              <div>
                <div className="mc-compose__label">Where was it?</div>
                <div className="mc-draft-chips">
                  <button
                    type="button"
                    className={`mc-draft-chip${spotMode === AROUND_TOWN_KEY ? " is-active" : ""}`}
                    style={{ "--chip-color": GENERAL_SPOT_COLOR } as React.CSSProperties}
                    onClick={() => resetDraftSpotFields(AROUND_TOWN_KEY)}
                  >
                    <span className="mc-draft-chip__dot" aria-hidden="true" />
                    <span>Around town</span>
                  </button>
                  <button
                    type="button"
                    className={`mc-draft-chip${spotMode === "event" ? " is-active" : ""}`}
                    style={{ "--chip-color": "#19E3FF" } as React.CSSProperties}
                    onClick={() => resetDraftSpotFields("event")}
                  >
                    <span className="mc-draft-chip__dot" aria-hidden="true" />
                    <span>Link event</span>
                  </button>
                  <button
                    type="button"
                    className={`mc-draft-chip${spotMode === CUSTOM_SPOT_KEY ? " is-active" : ""}`}
                    style={{ "--chip-color": "#FF1FA0" } as React.CSSProperties}
                    onClick={() => resetDraftSpotFields(CUSTOM_SPOT_KEY)}
                  >
                    <span className="mc-draft-chip__dot" aria-hidden="true" />
                    <span>Write your own</span>
                  </button>
                </div>

                {spotMode === AROUND_TOWN_KEY && (
                  <input
                    className="board-text-field mc-compose__venue"
                    value={draftVenueHint}
                    onChange={e => setDraftVenueHint(e.target.value.slice(0, 80))}
                    placeholder="Optional — e.g. Waterfront Park, Hawthorne, parade route…"
                    maxLength={80}
                  />
                )}

                {spotMode === "event" && (
                  <select
                    className="board-select mc-compose__select"
                    value={draftEventId}
                    onChange={e => setDraftEventId(e.target.value)}
                  >
                    <option value="">Select a Pride event…</option>
                    {renderEventOptions(groupedEvents.live, "Live / in posting window")}
                    {renderEventOptions(groupedEvents.upcoming, "Upcoming")}
                    {renderEventOptions(groupedEvents.past, "Past events")}
                  </select>
                )}

                {spotMode === CUSTOM_SPOT_KEY && (
                  <div className="mc-compose__custom-fields">
                    <input
                      className="board-text-field mc-compose__venue"
                      value={draftCustomEventName}
                      onChange={e => setDraftCustomEventName(e.target.value.slice(0, 80))}
                      placeholder="Event or moment name — e.g. Backyard pregame, Afterparty…"
                      maxLength={80}
                    />
                    <input
                      className="board-text-field mc-compose__venue"
                      value={draftCustomLocation}
                      onChange={e => setDraftCustomLocation(e.target.value.slice(0, 80))}
                      placeholder="Where — bar, park, neighborhood, cross streets…"
                      maxLength={80}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                className="mc-compose__submit btn-neon solid"
                disabled={!canSubmit || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Posting…" : "Post it →"}
              </button>
            </div>
            <div className="mc-compose__count">{draftBody.length}/500</div>
          </div>
        )}
      </section>

      {filterChips.length > 0 && (
        <div className="mc-filters" role="toolbar" aria-label="Filter by event">
          <button
            type="button"
            className={`mc-filters__chip${activeEventFilter == null ? " is-active" : ""}`}
            onClick={() => setActiveEventFilter(null)}
          >
            All
          </button>
          {filterChips.map(([eventId, meta]) => (
            <button
              key={eventId}
              type="button"
              className={`mc-filters__chip${activeEventFilter === eventId ? " is-active" : ""}`}
              style={{ "--chip-color": meta.color } as React.CSSProperties}
              onClick={() => setActiveEventFilter(activeEventFilter === eventId ? null : eventId)}
            >
              <span className="mc-filters__chip-dot" aria-hidden="true" />
              <span>{meta.name}</span>
              <span className="mc-filters__chip-count">{meta.count}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <BoardLoadingState label="Loading missed connections" />
      ) : isError ? (
        <div className="board-empty board-empty--prototype">
          <p className="display section-heading">Could not load</p>
          <button type="button" className="btn-neon" style={{ marginTop: 16 }} onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="mc-pulse-field mc-pulse-field--empty">
          <p className="display section-heading">Nothing here yet</p>
          <p className="board-copy-sm">Be the first — tie it to an event, write your own spot, or post around town.</p>
        </div>
      ) : (
        <div ref={fieldRef} className="mc-pulse-field">
          <div className="mc-pulse-field__hint">{fieldHint}</div>
          {posts.map(post => {
            const color = post.eventId == null
              ? GENERAL_SPOT_COLOR
              : eventColor(post.eventId, post.eventTitle || String(post.id));
            const dim = !postMatchesFilter(post);
            const glyph = postGlyph(post.title);
            const phys = physicsRef.current[post.id];
            const staticP = staticPos(post.id);
            const size = phys?.size ?? staticP.size;
            const style: React.CSSProperties = prefersReducedMotion
              ? { left: `${staticP.left}%`, top: `${staticP.top}%`, width: size, height: size, "--bubble-color": color }
              : {
                  transform: `translate(${phys?.x ?? 100}px, ${phys?.y ?? 100}px)`,
                  width: size,
                  height: size,
                  "--bubble-color": color,
                };

            return (
              <div
                key={post.id}
                className={`mc-bubble mc-bubble--physics${dim ? " is-dim" : ""}${hoveredId === post.id ? " is-hovered" : ""}`}
                style={style}
                onMouseEnter={() => setHoveredId(post.id)}
                onMouseLeave={() => setHoveredId(h => (h === post.id ? null : h))}
              >
                <div className="mc-bubble__orb">
                  <span className="mc-bubble__glyph">{glyph}</span>
                  {post.isMine && <span className="mc-bubble__self" title="Your post" />}
                </div>
                {hoveredId === post.id && (
                  <div className="mc-bubble__pop" onClick={e => e.stopPropagation()}>
                    <div className="mc-bubble__pop-head">
                      <span className="mc-bubble__pop-name">{post.isMine ? "Your post" : "Anonymous"}</span>
                      {(post.eventDay || post.dayOfWeek) && (
                        <span className="mc-bubble__pop-day">{post.eventDay || post.dayOfWeek}</span>
                      )}
                    </div>
                    {(post.eventTitle || post.venueHint) && (
                      <div className="mc-bubble__pop-event">{post.eventTitle ?? post.venueHint}</div>
                    )}
                    <h4 className="mc-bubble__pop-title">{post.title}</h4>
                    <p className="mc-bubble__pop-text">{post.body}</p>
                    {!post.isMine && (
                      <button
                        type="button"
                        className="mc-bubble__reply btn-neon solid"
                        onClick={() => {
                          setReplyingTo(post);
                          setHoveredId(null);
                        }}
                      >
                        Reply →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {replyingTo && (
        <>
          <button
            type="button"
            className="mc-reply-drawer__backdrop"
            aria-label="Close reply panel"
            onClick={() => setReplyingTo(null)}
          />
          <aside className="mc-reply-drawer" role="dialog" aria-labelledby="mc-reply-title">
            <button type="button" className="mc-reply-drawer__close" onClick={() => setReplyingTo(null)} aria-label="Close">
              ×
            </button>
            <p className="mc-reply-drawer__kicker">Private reply</p>
            <h2 id="mc-reply-title" className="display panel-heading mc-reply-drawer__title">
              {replyingTo.title}
            </h2>
            <p className="mc-reply-drawer__lede">
              Stays anonymous in inbox until you both choose to reveal.
            </p>
            <p className="mc-bubble__pop-text" style={{ marginBottom: 16 }}>{replyingTo.body}</p>
            <textarea
              className="board-text-field mc-reply-drawer__input"
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder="Say hi…"
              rows={5}
            />
            <button
              type="button"
              className="btn-neon solid mc-reply-drawer__send"
              disabled={!replyBody.trim() || replyMutation.isPending}
              onClick={() => replyMutation.mutate()}
            >
              {replyMutation.isPending ? "Sending…" : "Send →"}
            </button>
          </aside>
        </>
      )}
    </div>
  );
}