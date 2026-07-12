import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BoardLoadingState from "./BoardLoadingState";
import BoardActiveSection, { BoardFilterChip, BoardSelectField, BoardTextField } from "./BoardActiveSection";
import ScrollReveal from "./ScrollReveal";
import SpottedCard, { spottedKind, spottedPlace } from "./SpottedCard";
import SpottedDetailModal from "./SpottedDetailModal";
import { Button } from "@/components/ds";
import type { LinkableMissedConnectionEvent, MissedConnectionPost } from "./MissedConnectionsPanel";

const AROUND_TOWN_KEY = "around" as const;
const CUSTOM_SPOT_KEY = "custom" as const;
type SpotMode = typeof AROUND_TOWN_KEY | typeof CUSTOM_SPOT_KEY | "event";
type BoardFilter = "ALL" | "EVENT" | "TOWN" | "ROOSTER" | "SAUVIE";

function deriveTitle(title: string, body: string): string {
  const trimmed = title.trim();
  if (trimmed) return trimmed.slice(0, 80);
  const line = body.trim().split(/\n/)[0] || body.trim();
  return line.slice(0, 80) || "Missed connection";
}

type Props = {
  posts: MissedConnectionPost[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  linkableEvents: LinkableMissedConnectionEvent[];
  canInteract?: boolean;
  onRequireAuth?: () => boolean;
  makeover?: boolean;
  onRequestCompose?: () => void;
  composeOpen?: boolean;
  onComposeOpenChange?: (open: boolean) => void;
};

export default function SpottedCardGrid({
  posts,
  isLoading,
  isError,
  refetch,
  linkableEvents,
  canInteract = true,
  onRequireAuth,
  makeover = false,
  onRequestCompose,
  composeOpen: composeOpenProp,
  onComposeOpenChange,
}: Props) {
  const { toast } = useToast();

  const [filter, setFilter] = useState<BoardFilter>("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("RECENT");
  const [replyingTo, setReplyingTo] = useState<MissedConnectionPost | null>(null);

  const [spotMode, setSpotMode] = useState<SpotMode>(AROUND_TOWN_KEY);
  const [draftEventId, setDraftEventId] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftVenueHint, setDraftVenueHint] = useState("");
  const [draftCustomEventName, setDraftCustomEventName] = useState("");
  const [draftCustomLocation, setDraftCustomLocation] = useState("");
  const [composeOpenLocal, setComposeOpenLocal] = useState(false);
  const composeOpen = composeOpenProp ?? composeOpenLocal;
  const setComposeOpen = (open: boolean) => {
    onComposeOpenChange?.(open);
    if (composeOpenProp === undefined) setComposeOpenLocal(open);
  };
  const [acceptRules, setAcceptRules] = useState(false);

  const groupedEvents = useMemo(() => ({
    live: linkableEvents.filter(e => e.timing === "live"),
    upcoming: linkableEvents.filter(e => e.timing === "upcoming"),
    past: linkableEvents.filter(e => e.timing === "past"),
  }), [linkableEvents]);

  const filterCounts = useMemo(() => ({
    ALL: posts.length,
    EVENT: posts.filter(p => p.eventId != null).length,
    TOWN: posts.filter(p => p.eventId == null && !p.beachId).length,
    ROOSTER: posts.filter(p => p.beachId === "rooster-rock").length,
    SAUVIE: posts.filter(p => p.beachId === "sauvie-island").length,
  }), [posts]);

  const filteredPosts = useMemo(() => {
    let rows = posts.slice();
    if (filter === "EVENT") rows = rows.filter(p => p.eventId != null);
    else if (filter === "TOWN") rows = rows.filter(p => p.eventId == null && !p.beachId);
    else if (filter === "ROOSTER") rows = rows.filter(p => p.beachId === "rooster-rock");
    else if (filter === "SAUVIE") rows = rows.filter(p => p.beachId === "sauvie-island");
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(p =>
        [p.title, p.body, spottedPlace(p)].filter(Boolean).some(v => String(v).toLowerCase().includes(q)),
      );
    }
    rows.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === "CLOSING" ? ta - tb : tb - ta;
    });
    return rows;
  }, [posts, filter, search, sort]);

  const canSubmit = useMemo(() => {
    if (!draftBody.trim() || !acceptRules) return false;
    if (spotMode === "event") return !!draftEventId;
    if (spotMode === CUSTOM_SPOT_KEY) return !!draftCustomEventName.trim() || !!draftCustomLocation.trim();
    return true;
  }, [draftBody, acceptRules, spotMode, draftEventId, draftCustomEventName, draftCustomLocation]);

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
      else if (spotMode === CUSTOM_SPOT_KEY) {
        payload.eventLabel = draftCustomEventName.trim();
        payload.venueHint = draftCustomLocation.trim();
      } else payload.venueHint = draftVenueHint.trim() || "Around town";
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
      setAcceptRules(false);
      setComposeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missed-connections/mine"] });
      toast({ title: "Posted", description: "Your note is live. You stay anonymous until you both reveal in inbox." });
    },
    onError: (err: Error) => toast({ title: "Could not post", description: err.message, variant: "destructive" }),
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

  const clearFilters = () => {
    setFilter("ALL");
    setSearch("");
    setSort("RECENT");
  };

  const handleReply = (post: MissedConnectionPost) => {
    if (!canInteract) {
      onRequireAuth?.();
      return;
    }
    setReplyingTo(post);
  };

  const composeFields = (
    <>
      <div className="gifting-form-grid">
        <label>
          Where did you see them
          <select
            className="board-text-field"
            value={spotMode === "event" ? "EVENT" : spotMode === AROUND_TOWN_KEY ? "TOWN" : "TOWN"}
            onChange={e => resetDraftSpotFields(e.target.value === "EVENT" ? "event" : AROUND_TOWN_KEY)}
          >
            <option value="EVENT">At a Pride event</option>
            <option value="TOWN">Around town</option>
          </select>
        </label>
        {spotMode === "event" ? (
          <label>
            Which event
            <select className="board-text-field" value={draftEventId} onChange={e => setDraftEventId(e.target.value)}>
              <option value="">Select a Pride event…</option>
              {renderEventOptions(groupedEvents.live, "Live / in posting window")}
              {renderEventOptions(groupedEvents.upcoming, "Upcoming")}
              {renderEventOptions(groupedEvents.past, "Past events")}
            </select>
          </label>
        ) : (
          <label>
            Where around town (optional)
            <input
              className="board-text-field"
              value={draftVenueHint}
              onChange={e => setDraftVenueHint(e.target.value.slice(0, 80))}
              placeholder="e.g. Powell's queer lit aisle, the MAX Blue Line"
              maxLength={80}
            />
          </label>
        )}
        <label className="span">
          Title
          <input
            className="board-text-field"
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value.slice(0, 80))}
            placeholder="e.g. Mesh top, killer moves by the left speaker"
            maxLength={80}
          />
        </label>
        <label className="span">
          Your message
          <textarea
            className="board-text-field"
            value={draftBody}
            onChange={e => setDraftBody(e.target.value.slice(0, 500))}
            placeholder="What happened, what you'd say if you had the nerve. Specific and kind."
            rows={4}
            maxLength={500}
          />
          <span className="board-copy-sm" style={{ marginTop: 6, display: "block", color: "#6a675f" }}>
            {500 - draftBody.length} left
          </span>
        </label>
      </div>
      <label className="gifting-rules" style={{ marginTop: 16 }}>
        <input type="checkbox" checked={acceptRules} onChange={e => setAcceptRules(e.target.checked)} />
        I agree: kind, specific, PG-13, no full names or outing. I understand I stay anonymous until I choose to reveal.
      </label>
      <Button
        variant="solid"
        accent="magenta"
        size="lg"
        arrow
        style={{ marginTop: 16 }}
        disabled={!canSubmit || createMutation.isPending}
        onClick={() => createMutation.mutate()}
      >
        {createMutation.isPending ? "Posting…" : "Post it"}
      </Button>
    </>
  );

  const composePanel = composeOpen && !makeover && (
    <div className="spotted-compose-panel">{composeFields}</div>
  );

  const composeSection = makeover && composeOpen && (
    <ScrollReveal>
      <section id="spotted-form" className="gifting-form-panel gifting-form-panel--makeover" style={{ borderColor: "#ff1fa0", boxShadow: "0 0 30px -14px #ff1fa0" }}>
        <button type="button" className="gifting-close" onClick={() => setComposeOpen(false)} aria-label="Close form">
          <X size={18} />
        </button>
        <div className="board-section-kicker board-section-kicker--magenta">New missed connections</div>
        <h2 className="display section-heading">Post a missed connection</h2>
        <p className="board-copy-sm">
          Keep it kind and specific. No full names, no outing anyone, PG-13. You stay anonymous. This posts to the public board, but every reply is private.
        </p>
        {composeFields}
      </section>
    </ScrollReveal>
  );

  const feedBody = (
    <>
      {!makeover && (
        <button
          type="button"
          className="spotted-compose-toggle"
          id="spotted-compose-toggle"
          onClick={() => {
            if (!canInteract) { onRequireAuth?.(); return; }
            setComposeOpen(!composeOpen);
          }}
          aria-expanded={composeOpen}
        >
          {composeOpen ? "✕ Cancel" : "＋ Saw someone? Write a note"}
        </button>
      )}

      {composePanel}

      {isLoading ? (
        <BoardLoadingState label="Loading missed connections" />
      ) : isError ? (
        <div className="board-empty board-empty--makeover">
          <p className="display section-heading">Could not load</p>
          <Button variant="neon" accent="cyan" style={{ marginTop: 16 }} onClick={() => refetch()}>Try again</Button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className={`board-empty ${makeover ? "board-empty--makeover board-empty--spotted" : "board-empty--prototype"}`}>
          {makeover && <div className="board-empty--spotted__quote" aria-hidden="true">&rdquo;</div>}
          <p className="display section-heading">{makeover ? "No sightings yet" : "Nothing here yet"}</p>
          <p className="board-copy-sm">
            {makeover
              ? "Loosen the filter, or be the one to break the ice. Someone out there is hoping you post first."
              : "Be the first. Tie it to an event, write your own spot, or post around town."}
          </p>
          {makeover && (
            <div className="board-empty__actions">
              <Button variant="solid" accent="magenta" onClick={() => onRequestCompose?.()}>
                Post a missed connection
              </Button>
              <Button variant="neon" accent="cyan" onClick={clearFilters}>Clear filters</Button>
            </div>
          )}
        </div>
      ) : (
        <div className={makeover ? "board-spotted-grid" : "spotted-card-grid"}>
          {filteredPosts.map((post, i) => (
            <ScrollReveal key={post.id} delay={Math.min(i * 60, 360)}>
              <SpottedCard
                post={post}
                accentColor={spottedKind(post).color}
                animDelay={i * 400}
                makeover={makeover}
                onReply={() => handleReply(post)}
              />
            </ScrollReveal>
          ))}
        </div>
      )}
    </>
  );

  const replyModal = replyingTo && (
    <SpottedDetailModal
      postId={replyingTo.id}
      title={replyingTo.title || replyingTo.body.slice(0, 80)}
      body={replyingTo.body}
      place={spottedPlace(replyingTo)}
      kindLabel={spottedKind(replyingTo).label}
      kindColor={spottedKind(replyingTo).color}
      onClose={() => setReplyingTo(null)}
    />
  );

  if (makeover) {
    return (
      <div className="spotted-board spotted-board--makeover" id="spotted-compose">
        {composeSection}
        <BoardActiveSection
          className="diag"
          sticker="Active board"
          stickerTone="magenta"
          stickerStyle="mono"
          title="Who you saw"
          resultCount={`${filteredPosts.length} showing`}
          filters={
            <>
              <BoardFilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")} accent="pink" count={filterCounts.ALL}>
                All
              </BoardFilterChip>
              <BoardFilterChip active={filter === "EVENT"} onClick={() => setFilter("EVENT")} accent="cyan" count={filterCounts.EVENT}>
                At events
              </BoardFilterChip>
              <BoardFilterChip active={filter === "TOWN"} onClick={() => setFilter("TOWN")} accent="orange" count={filterCounts.TOWN}>
                Around town
              </BoardFilterChip>
              <BoardFilterChip active={filter === "ROOSTER"} onClick={() => setFilter("ROOSTER")} accent="cyan" count={filterCounts.ROOSTER}>
                Rooster
              </BoardFilterChip>
              <BoardFilterChip active={filter === "SAUVIE"} onClick={() => setFilter("SAUVIE")} accent="orange" count={filterCounts.SAUVIE}>
                Sauvie
              </BoardFilterChip>
            </>
          }
          filterRow2={
            <>
              <BoardTextField value={search} onChange={setSearch} placeholder="Search spots, events, details" />
              <BoardSelectField value={sort} onChange={setSort}>
                <option value="RECENT">Most recent</option>
                <option value="CLOSING">Closing soon</option>
              </BoardSelectField>
            </>
          }
        >
          {feedBody}
        </BoardActiveSection>
        {replyModal}
      </div>
    );
  }

  return (
    <div className="spotted-board">
      {feedBody}
      {replyModal}
    </div>
  );
}