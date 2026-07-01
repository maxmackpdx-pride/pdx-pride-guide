import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BoardLoadingState from "./BoardLoadingState";
import ScrollReveal from "./ScrollReveal";
import SpottedCard, { spottedAccent } from "./SpottedCard";
import type { LinkableMissedConnectionEvent, MissedConnectionPost } from "./MissedConnectionsPanel";

const AROUND_TOWN_KEY = "around" as const;
const CUSTOM_SPOT_KEY = "custom" as const;
const GENERAL_SPOT_COLOR = "#FF8C00";
type SpotMode = typeof AROUND_TOWN_KEY | typeof CUSTOM_SPOT_KEY | "event";

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
  canInteract?: boolean;
  onRequireAuth?: () => boolean;
};

export default function SpottedCardGrid({
  posts,
  isLoading,
  isError,
  refetch,
  linkableEvents,
  canInteract = true,
  onRequireAuth,
}: Props) {
  const { toast } = useToast();

  const [activeEventFilter, setActiveEventFilter] = useState<number | typeof AROUND_TOWN_KEY | null>(null);
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

  const groupedEvents = useMemo(() => ({
    live: linkableEvents.filter(e => e.timing === "live"),
    upcoming: linkableEvents.filter(e => e.timing === "upcoming"),
    past: linkableEvents.filter(e => e.timing === "past"),
  }), [linkableEvents]);

  const eventMeta = useMemo(() => {
    const map = new Map<number | typeof AROUND_TOWN_KEY, { name: string; color: string; count: number }>();
    for (const post of posts) {
      if (post.eventId == null) {
        const g = map.get(AROUND_TOWN_KEY) ?? { name: "Around town", color: GENERAL_SPOT_COLOR, count: 0 };
        g.count += 1;
        map.set(AROUND_TOWN_KEY, g);
        continue;
      }
      const existing = map.get(post.eventId);
      const name = post.eventTitle || existing?.name || `Event #${post.eventId}`;
      const color = spottedAccent(post.eventId);
      if (existing) { existing.count += 1; }
      else { map.set(post.eventId, { name, color, count: 1 }); }
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
    if (mode !== CUSTOM_SPOT_KEY) { setDraftCustomEventName(""); setDraftCustomLocation(""); }
    if (mode !== AROUND_TOWN_KEY) setDraftVenueHint("");
  };

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        title: deriveTitle(draftTitle, draftBody),
        body: draftBody.trim(),
        scope: "board",
      };
      if (spotMode === "event") payload.eventId = Number(draftEventId);
      else if (spotMode === CUSTOM_SPOT_KEY) { payload.eventLabel = draftCustomEventName.trim(); payload.venueHint = draftCustomLocation.trim(); }
      else payload.venueHint = draftVenueHint.trim() || "Around town";
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
      setDraftTitle(""); setDraftBody(""); setDraftVenueHint("");
      setDraftCustomEventName(""); setDraftCustomLocation(""); setDraftEventId("");
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
      setReplyingTo(null); setReplyBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      toast({ title: "Message sent", description: "Thread is private. Reveal yourself in inbox when you're ready." });
    },
    onError: () => toast({ title: "Could not send message", variant: "destructive" }),
  });

  const renderEventOptions = (items: LinkableMissedConnectionEvent[], label: string) => {
    if (!items.length) return null;
    return (
      <optgroup label={label}>
        {items.map(evt => (
          <option key={evt.id} value={String(evt.id)}>
            {evt.dayOfWeek} · {evt.title} @ {evt.venueName}
            {evt.postable ? "" : " (not started yet)"}
          </option>
        ))}
      </optgroup>
    );
  };

  const filteredPosts = posts.filter(postMatchesFilter);

  return (
    <div className="spotted-board">
      {/* Compose toggle */}
      <button
        type="button"
        className="spotted-compose-toggle"
        onClick={() => {
          if (!canInteract) { onRequireAuth?.(); return; }
          setComposeOpen(o => !o);
        }}
        aria-expanded={composeOpen}
      >
        {composeOpen ? "✕ CANCEL" : "＋ SAW SOMEONE? WRITE A NOTE"}
      </button>

      {composeOpen && (
        <div className="spotted-compose-panel">
          <input
            className="board-text-field"
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value.slice(0, 80))}
            placeholder="Title (optional)"
            maxLength={80}
          />
          <textarea
            className="board-text-field spotted-compose-panel__textarea"
            value={draftBody}
            onChange={e => setDraftBody(e.target.value.slice(0, 500))}
            placeholder="You handed me a flag near the bridge and I have thought about it ever since…"
            rows={4}
          />
          <div className="spotted-compose-panel__charcount">{draftBody.length}/500</div>

          <div className="spotted-compose-panel__label">WHERE WAS IT?</div>
          <div className="mc-draft-chips">
            <button type="button" className={`mc-draft-chip${spotMode === AROUND_TOWN_KEY ? " is-active" : ""}`} style={{ "--chip-color": GENERAL_SPOT_COLOR } as React.CSSProperties} onClick={() => resetDraftSpotFields(AROUND_TOWN_KEY)}>
              <span className="mc-draft-chip__dot" aria-hidden="true" /><span>Around town</span>
            </button>
            <button type="button" className={`mc-draft-chip${spotMode === "event" ? " is-active" : ""}`} style={{ "--chip-color": "#19E3FF" } as React.CSSProperties} onClick={() => resetDraftSpotFields("event")}>
              <span className="mc-draft-chip__dot" aria-hidden="true" /><span>Link event</span>
            </button>
            <button type="button" className={`mc-draft-chip${spotMode === CUSTOM_SPOT_KEY ? " is-active" : ""}`} style={{ "--chip-color": "#FF1FA0" } as React.CSSProperties} onClick={() => resetDraftSpotFields(CUSTOM_SPOT_KEY)}>
              <span className="mc-draft-chip__dot" aria-hidden="true" /><span>Write your own</span>
            </button>
          </div>

          {spotMode === AROUND_TOWN_KEY && (
            <input className="board-text-field" value={draftVenueHint} onChange={e => setDraftVenueHint(e.target.value.slice(0, 80))} placeholder="Optional — e.g. Waterfront Park, Hawthorne…" maxLength={80} />
          )}
          {spotMode === "event" && (
            <select className="board-select" value={draftEventId} onChange={e => setDraftEventId(e.target.value)}>
              <option value="">Select a Pride event…</option>
              {renderEventOptions(groupedEvents.live, "Live / in posting window")}
              {renderEventOptions(groupedEvents.upcoming, "Upcoming")}
              {renderEventOptions(groupedEvents.past, "Past events")}
            </select>
          )}
          {spotMode === CUSTOM_SPOT_KEY && (
            <>
              <input className="board-text-field" value={draftCustomEventName} onChange={e => setDraftCustomEventName(e.target.value.slice(0, 80))} placeholder="Event or moment name — e.g. Afterparty, Backyard pregame…" maxLength={80} />
              <input className="board-text-field" style={{ marginTop: 8 }} value={draftCustomLocation} onChange={e => setDraftCustomLocation(e.target.value.slice(0, 80))} placeholder="Where — bar, park, cross streets…" maxLength={80} />
            </>
          )}

          <button
            type="button"
            className="btn-neon solid"
            style={{ marginTop: 14 }}
            disabled={!canSubmit || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "POSTING…" : "POST ANONYMOUSLY →"}
          </button>
        </div>
      )}

      {/* Event filter chips */}
      {filterChips.length > 0 && (
        <div className="mc-filters" role="toolbar" aria-label="Filter by location">
          <button type="button" className={`mc-filters__chip${activeEventFilter == null ? " is-active" : ""}`} onClick={() => setActiveEventFilter(null)}>All</button>
          {filterChips.map(([eventId, meta]) => (
            <button key={eventId} type="button" className={`mc-filters__chip${activeEventFilter === eventId ? " is-active" : ""}`} style={{ "--chip-color": meta.color } as React.CSSProperties} onClick={() => setActiveEventFilter(activeEventFilter === eventId ? null : eventId)}>
              <span className="mc-filters__chip-dot" aria-hidden="true" />
              <span>{meta.name}</span>
              <span className="mc-filters__chip-count">{meta.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Card grid */}
      {isLoading ? (
        <BoardLoadingState label="Loading spotted notes" />
      ) : isError ? (
        <div className="board-empty board-empty--prototype">
          <p className="display section-heading">Could not load</p>
          <button type="button" className="btn-neon" style={{ marginTop: 16 }} onClick={() => refetch()}>Try again</button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="board-empty board-empty--prototype">
          <p className="display section-heading">Nothing here yet</p>
          <p className="board-copy-sm">Be the first — tie it to an event, write your own spot, or post around town.</p>
        </div>
      ) : (
        <div className="spotted-card-grid">
          {filteredPosts.map((post, i) => (
            <ScrollReveal key={post.id} delay={Math.min(i * 60, 360)}>
              <SpottedCard
                post={post}
                accentColor={spottedAccent(post.id)}
                animDelay={i * 400}
                onReply={() => setReplyingTo(post)}
              />
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* Reply modal */}
      {replyingTo && (
        <div
          onClick={() => setReplyingTo(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#090909", border: "2px solid #FF00CC", width: "100%", maxWidth: 520, padding: 24, borderRadius: 14 }}
          >
            <h3 className="display panel-heading" style={{ color: "#FF00CC", marginBottom: 8 }}>PRIVATE MESSAGE</h3>
            <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: 12, lineHeight: 1.5 }}>
              "{replyingTo.title || replyingTo.body.slice(0, 60)}" — your message stays anonymous in inbox until you both choose to reveal.
            </p>
            <textarea
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #333", fontSize: "0.9rem", background: "#000", color: "#fff", fontFamily: "var(--font-body)", boxSizing: "border-box", minHeight: 120, resize: "vertical" }}
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder="Write your message…"
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => replyMutation.mutate()}
                disabled={!replyBody.trim() || replyMutation.isPending}
                style={{ background: "#FF00CC", color: "#000", border: "none", padding: "10px 18px", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.82rem", opacity: !replyBody.trim() || replyMutation.isPending ? 0.55 : 1, borderRadius: 6 }}
              >
                {replyMutation.isPending ? "SENDING…" : "SEND →"}
              </button>
              <button type="button" onClick={() => setReplyingTo(null)} style={{ background: "transparent", color: "#666", border: "1px solid #333", padding: "10px 12px", cursor: "pointer", borderRadius: 6 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
