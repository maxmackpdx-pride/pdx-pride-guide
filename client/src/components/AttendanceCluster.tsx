import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";
import AttendanceVibeModal from "./AttendanceVibeModal";
import UserAvatar from "@/components/UserAvatar";
import { useAttendanceLive } from "@/hooks/useAttendanceLive";
import {
  attendanceBubbleGradient,
  attendanceInitials,
  attendanceSeedColor,
} from "@/lib/attendanceBubble";

const SPEECH_OPTIONS = [
  "Hey, I'll be working this one!",
  "Hey, I'll be there — come say hi!",
  "Hey, I'll have RBF but please come say hi!",
  "Hey, I'll be there — come say hi, I don't bite (unless asked)",
  "Hey, I'll be there — friendly but bad at starting conversations",
  "Hey, I'll be there — social battery's low but I'm trying",
  "Hey, I'll be there — cute and slightly feral",
  "Hey, I'll be there — let's be awkward together",
  "Hey, I'll be there — eye contact first, then we talk 👀",
  "Hey, I'll be there for the queers and the chaos",
  "Hey, I'll be there — consent is hot, let's start there",
  "Hey, I'll be floating around — tap me if you want company",
];

// First 5 are the default pill row; the rest are tucked behind "More vibes"
// so nothing from the original 12 gets dropped, per Tucker's "preserve everything" rule.
const PRIMARY_OPTIONS = SPEECH_OPTIONS.slice(0, 5);
const MORE_OPTIONS = SPEECH_OPTIONS.slice(5);

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Attendee {
  id: number;
  userId?: number;
  handle: string;
  displayName?: string | null;
  message: string;
  avatarSeed: string;
  userPhotoUrl?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  masked?: boolean;
}

interface BubbleState {
  attendee: Attendee;
  x: number;
  y: number;
  vx: number;
  vy: number;
  visible: boolean;
  size: number;
}

type AttendanceClusterProps = {
  eventId: number;
  embedded?: boolean;
  /** Per-event socket; disable on /events cards — page uses subscribe-summaries instead */
  liveSocket?: boolean;
  variant?: "default" | "card";
};

export default function AttendanceCluster({
  eventId,
  embedded = false,
  liveSocket = true,
  variant = "default",
}: AttendanceClusterProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showMoreVibes, setShowMoreVibes] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(SPEECH_OPTIONS[0]);
  const [customMessage, setCustomMessage] = useState("");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Attendee | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [newAttendeeIds, setNewAttendeeIds] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastRandomizeRef = useRef<number>(Date.now());
  const seenIdsRef = useRef<Set<number> | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);
  const [viewTab, setViewTab] = useState<"field" | "strip">(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches ? "strip" : "field",
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      setViewTab(mobile ? "strip" : "field");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useAttendanceLive(eventId, liveSocket);

  const { data: attendees = [] } = useQuery<Attendee[]>({
    queryKey: ["/api/events", eventId, "attendance"],
    queryFn: () => apiRequest("GET", `/api/events/${eventId}/attendance`).then(r => r.json()),
    refetchInterval: 120_000,
  });

  // Track which attendees are newly arrived (vs. already seen) so their bubble
  // can pop in instead of just appearing. First load seeds the "seen" set with
  // no animation; every load after that, anyone not previously seen gets the pop.
  useEffect(() => {
    const currentIds = new Set(attendees.map(a => a.id));
    if (seenIdsRef.current === null) {
      seenIdsRef.current = currentIds;
      return;
    }
    const freshIds = new Set<number>();
    currentIds.forEach(id => {
      if (!seenIdsRef.current!.has(id)) freshIds.add(id);
    });
    seenIdsRef.current = currentIds;
    if (freshIds.size > 0) {
      setNewAttendeeIds(freshIds);
      const t = setTimeout(() => setNewAttendeeIds(new Set()), 900);
      return () => clearTimeout(t);
    }
  }, [attendees]);

  const mutation = useMutation({
    mutationFn: (data: { message: string }) =>
      apiRequest("POST", `/api/events/${eventId}/attendance`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendance"] });
      setShowForm(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/events/${eventId}/attendance`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendance"] }),
  });

  const messageMutation = useMutation({
    mutationFn: ({ attendanceId, body }: { attendanceId: number; body: string }) =>
      apiRequest("POST", `/api/events/${eventId}/attendance/${attendanceId}/message`, { body }),
    onSuccess: () => {
      setMessageTarget(null);
      setMessageBody("");
    },
  });

  const BUBBLE_STAGE_H = variant === "card" ? 200 : 220;
  const BUBBLE_TOP_MARGIN = 56;

  // Initialize bubbles when attendees load
  useEffect(() => {
    if (attendees.length === 0) {
      setBubbles([]);
      return;
    }
    const W = containerRef.current?.offsetWidth || 600;
    const H = BUBBLE_STAGE_H;
    const RADIUS = 36;
    const yMin = RADIUS + BUBBLE_TOP_MARGIN;
    const yMax = H - RADIUS;

    setBubbles(
      attendees.map((att, i) => ({
        attendee: att,
        x: RADIUS + (Math.random() * (W - RADIUS * 2)),
        y: yMin + (Math.random() * Math.max(yMax - yMin, RADIUS)),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        visible: true,
        size: 36 + Math.random() * 12,
      }))
    );
  }, [attendees, viewTab]);

  // Animate bubbles: slow drift + random show/hide
  useEffect(() => {
    if (bubbles.length === 0) return;
    if (viewTab !== "field") return;

    const animate = () => {
      const W = containerRef.current?.offsetWidth || 600;
      const H = BUBBLE_STAGE_H;
      const yMin = 18 + BUBBLE_TOP_MARGIN;
      const now = Date.now();

      setBubbles(prev => {
        // Every 3–5 seconds, toggle 1–3 random bubbles
        let newBubbles = prev;
        if (now - lastRandomizeRef.current > 3000 + Math.random() * 2000) {
          lastRandomizeRef.current = now;
          const count = 1 + Math.floor(Math.random() * 3);
          const indices = Array.from({ length: prev.length }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, count);
          newBubbles = prev.map((b, i) =>
            indices.includes(i) ? { ...b, visible: !b.visible } : b
          );
        }

        return newBubbles.map(b => {
          let nx = b.x + b.vx;
          let ny = b.y + b.vy;
          let nvx = b.vx;
          let nvy = b.vy;
          // Bounce off walls
          if (nx < b.size / 2) { nx = b.size / 2; nvx = Math.abs(nvx); }
          if (nx > W - b.size / 2) { nx = W - b.size / 2; nvx = -Math.abs(nvx); }
          if (ny < Math.max(b.size / 2, yMin)) { ny = Math.max(b.size / 2, yMin); nvy = Math.abs(nvy); }
          if (ny > H - b.size / 2) { ny = H - b.size / 2; nvy = -Math.abs(nvy); }
          // Tiny random nudge for organic feel
          nvx += (Math.random() - 0.5) * 0.04;
          nvy += (Math.random() - 0.5) * 0.04;
          // Clamp speed
          const speed = Math.sqrt(nvx * nvx + nvy * nvy);
          if (speed > 0.6) { nvx *= 0.6 / speed; nvy *= 0.6 / speed; }
          if (speed < 0.1) { nvx *= 1.5; nvy *= 1.5; }
          return { ...b, x: nx, y: ny, vx: nvx, vy: nvy };
        });
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [bubbles.length, viewTab]);

  const submitVibe = () => {
    const message = customMessage.trim() || selectedMessage;
    mutation.mutate({ message });
  };

  const myAttendance = attendees.find(a => a.userId === user?.id);

  useEffect(() => {
    if (!showForm || !myAttendance) return;
    if (SPEECH_OPTIONS.includes(myAttendance.message)) {
      setSelectedMessage(myAttendance.message);
      setCustomMessage("");
    } else {
      setCustomMessage(myAttendance.message);
    }
  }, [showForm, myAttendance]);

  const phrasePicker = (
    <>
      <p className="display attendance-vibe-label">PICK YOUR VIBE</p>
      <div className="attendance-vibe-pills">
        {PRIMARY_OPTIONS.map(opt => (
          <button
            key={opt}
            type="button"
            data-testid={`option-${opt.slice(0, 20)}`}
            onClick={() => setSelectedMessage(opt)}
            className={`attendance-vibe-pill${selectedMessage === opt && !customMessage.trim() ? " attendance-vibe-pill--active" : ""}`}
          >
            {opt}
          </button>
        ))}
      </div>
      {showMoreVibes && (
        <div className="attendance-vibe-pills">
          {MORE_OPTIONS.map(opt => (
            <button
              key={opt}
              type="button"
              data-testid={`option-${opt.slice(0, 20)}`}
              onClick={() => setSelectedMessage(opt)}
              className={`attendance-vibe-pill${selectedMessage === opt && !customMessage.trim() ? " attendance-vibe-pill--active" : ""}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="attendance-vibe-more"
        onClick={() => setShowMoreVibes(s => !s)}
      >
        {showMoreVibes ? "Fewer vibes" : "More vibes"}
      </button>
      <label className="attendance-vibe-custom-label">
        Say something (optional)
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Your own line — shows on your bubble instead of a preset"
          rows={3}
          className="attendance-vibe-custom"
          data-testid="input-custom-vibe"
        />
      </label>
    </>
  );

  const showBubbleField = viewTab === "field" && bubbles.length > 0;
  const showBubbleStrip = viewTab === "strip" && bubbles.length > 0;

  return (
    <div className={`attendance-cluster-panel${embedded ? " attendance-cluster--embedded" : ""}${variant === "card" ? " attendance-cluster-panel--card" : ""}`}>
      <div className="attendance-cluster-head">
        <div className="attendance-cluster-head__title">
          <h3 className="display attendance-cluster-headline">
            <span>I'll be</span> <span className="attendance-cluster-headline__accent">there</span>
          </h3>
          <span className={`attendance-going-pill${prefersReducedMotion() ? "" : " attendance-badge-pulse"}`}>
            <span className="attendance-going-pill__dot" aria-hidden="true" />
            {attendees.length} GOING
          </span>
        </div>
        <div className="attendance-view-tabs" role="tablist" aria-label="Attendance view">
          <button
            type="button"
            role="tab"
            aria-selected={viewTab === "field"}
            className={`attendance-view-tab${viewTab === "field" ? " attendance-view-tab--active" : ""}`}
            onClick={() => setViewTab("field")}
          >
            Bubble field
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewTab === "strip"}
            className={`attendance-view-tab${viewTab === "strip" ? " attendance-view-tab--active" : ""}`}
            onClick={() => setViewTab("strip")}
          >
            Mobile strip
          </button>
        </div>
      </div>

      {!showForm && (
        <div className="attendance-cluster-cta">
          <button
            data-testid="button-ill-be-there"
            onClick={() => user ? setShowForm(true) : setShowAuth(true)}
            className="display attendance-cluster-cta__btn"
          >
            {myAttendance ? "Change phrase →" : "I'll be there →"}
          </button>
          {myAttendance && (
            <span className="attendance-cluster-cta__status">
              You're going as “{myAttendance.message.length > 42 ? `${myAttendance.message.slice(0, 42)}…` : myAttendance.message}”
            </span>
          )}
        </div>
      )}

      {/* Animated bubble cluster */}
      {showBubbleField && (
        <div
          ref={containerRef}
          className="attendance-bubble-stage"
          style={{ position: "relative", height: BUBBLE_STAGE_H, marginBottom: 16 }}
        >
          <div className="attendance-bubble-stage__hint">Hover a bubble</div>
          {bubbles.map((b) => {
            const accent = attendanceSeedColor(b.attendee.avatarSeed);
            const isHovered = hoveredId === b.attendee.id;
            const bubbleSize = Math.max(48, b.size);
            const isNew = newAttendeeIds.has(b.attendee.id) && !prefersReducedMotion();
            const isSelf = !!user && b.attendee.userId === user.id;
            const label = b.attendee.masked ? attendanceInitials(b.attendee.handle) : (b.attendee.displayName || b.attendee.handle);
            return (
              <div
                key={b.attendee.id}
                data-testid={`bubble-attendee-${b.attendee.id}`}
                className={`attendance-bubble${isNew ? " attendance-pop-in" : ""}`}
                onMouseEnter={() => setHoveredId(b.attendee.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setHoveredId(isHovered ? null : b.attendee.id)}
                style={{
                  left: b.x - bubbleSize / 2,
                  top: b.y - bubbleSize / 2,
                  width: bubbleSize,
                  height: bubbleSize,
                  opacity: b.visible ? 1 : 0,
                  transform: `scale(${b.visible ? (isHovered ? 1.12 : 1) : 0.6})`,
                  zIndex: isHovered ? 20 : 10,
                  ["--speech-accent" as string]: accent,
                }}
              >
                <div
                  className="attendance-bubble__avatar"
                  style={{
                    width: bubbleSize,
                    height: bubbleSize,
                    background: attendanceBubbleGradient(b.attendee.avatarSeed),
                    fontSize: bubbleSize * 0.34,
                  }}
                >
                  {attendanceInitials(b.attendee.handle)}
                  {isSelf && <span className="attendance-bubble__self-dot" data-testid="self-marker" />}
                </div>
                <div className={`attendance-speech-pop${isHovered ? " attendance-speech-pop--visible" : ""}`}>
                  {!b.attendee.masked && (
                    <div className="attendance-speech-pop__name">{label}</div>
                  )}
                  <div className="attendance-speech-pop__phrase">“{b.attendee.message}”</div>
                  {user && myAttendance && b.attendee.userId && b.attendee.userId !== user.id && !b.attendee.masked && (
                    <button
                      type="button"
                      className="attendance-speech-pop__msg-btn"
                      onClick={(e) => { e.stopPropagation(); setMessageTarget(b.attendee); }}
                    >
                      Message →
                    </button>
                  )}
                  <span className="attendance-speech-pop__tail" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile / strip view */}
      {showBubbleStrip && (
        <>
        <p className="attendance-mobile-hint">Swipe · tap a face</p>
        <div className="attendance-mobile-strip">
          {bubbles.map((b, i) => {
            const isHovered = hoveredId === b.attendee.id;
            const isNew = newAttendeeIds.has(b.attendee.id) && !prefersReducedMotion();
            const isSelf = !!user && b.attendee.userId === user.id;
            return (
              <div
                key={b.attendee.id}
                data-testid={`bubble-strip-attendee-${b.attendee.id}`}
                className={`attendance-mobile-strip__item${isNew ? " attendance-pop-in" : ""}`}
                onClick={() => setHoveredId(isHovered ? null : b.attendee.id)}
              >
                <span
                  className="attendance-mobile-strip__avatar"
                  style={{ background: attendanceBubbleGradient(b.attendee.avatarSeed) }}
                >
                  {attendanceInitials(b.attendee.handle)}
                </span>
                {isSelf && (
                  <span
                    data-testid="self-marker-strip"
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "#CCFF00",
                      border: "2px solid #0d0d0d",
                      zIndex: 5,
                    }}
                  />
                )}
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#fff",
                      color: "#000",
                      fontSize: "0.7rem",
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      padding: "6px 10px",
                      border: "2px solid #000",
                      maxWidth: 220,
                      whiteSpace: "normal",
                      textAlign: "center",
                      lineHeight: 1.3,
                      zIndex: 30,
                      pointerEvents: "auto",
                      boxShadow: "3px 3px 0 #000",
                    }}
                  >
                    {!b.attendee.masked && (
                      <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "0.65rem", marginBottom: 2, color: "var(--text-meta)" }}>
                        {b.attendee.handle}
                      </span>
                    )}
                    {b.attendee.message}
                    {user && myAttendance && b.attendee.userId && b.attendee.userId !== user.id && !b.attendee.masked && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMessageTarget(b.attendee); }}
                        style={{
                          display: "block",
                          margin: "6px auto 0",
                          border: "1px solid #000",
                          background: "#CCFF00",
                          color: "#000",
                          fontFamily: "var(--font-display)",
                          fontWeight: 900,
                          fontSize: "0.62rem",
                          cursor: "pointer",
                        }}
                      >
                        MESSAGE
                      </button>
                    )}
                    <div style={{
                      position: "absolute",
                      bottom: -8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 0,
                      height: 0,
                      borderLeft: "7px solid transparent",
                      borderRight: "7px solid transparent",
                      borderTop: "8px solid #fff",
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
      )}

      {attendees.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-faint)" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>BE THE FIRST TO SAY YOU'LL BE THERE</p>
        </div>
      )}

      <AttendanceVibeModal
        open={showForm}
        isMobile={isMobile}
        isPending={mutation.isPending}
        hasAttendance={!!myAttendance}
        title={myAttendance ? "CHANGE YOUR VIBE" : "I'LL BE THERE"}
        onClose={() => setShowForm(false)}
        onSubmit={submitVibe}
        onRemove={() => removeMutation.mutate()}
      >
        {phrasePicker}
      </AttendanceVibeModal>
      {messageTarget && (
        <div
          data-testid="message-panel-backdrop"
          onClick={() => setMessageTarget(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 70 }}
        >
          <div
            data-testid="message-panel"
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(100%, 380px)",
              background: "#0a0a0a",
              borderLeft: "2px solid #CCFF00",
              display: "flex",
              flexDirection: "column",
              zIndex: 71,
              animation: prefersReducedMotion() ? undefined : "attendance-panel-in 0.25s cubic-bezier(0.2,0.8,0.2,1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid #222" }}>
              <UserAvatar
                photoUrl={messageTarget.userPhotoUrl || messageTarget.photoUrl}
                avatarChoice={messageTarget.avatarChoice}
                avatarRing={messageTarget.avatarRing}
                displayName={messageTarget.handle}
                size={42}
              />
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontSize: "1rem", color: "#fff" }}>
                  {messageTarget.handle}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "#00FFFF", marginTop: 2 }}>
                  ✓ Both going
                </div>
              </div>
              <button
                onClick={() => setMessageTarget(null)}
                aria-label="Close"
                style={{ background: "none", border: "none", color: "var(--text-meta)", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10, overflowY: "auto" }}>
              <div style={{ alignSelf: "center", fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-faint)" }}>
                New thread
              </div>
              <div
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "82%",
                  background: "#15151a",
                  border: "1px solid #222",
                  borderRadius: "4px",
                  padding: "10px 13px",
                  fontSize: "0.85rem",
                  color: "#e6e3da",
                }}
              >
                "{messageTarget.message}" — see you there?
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, padding: "14px 16px", borderTop: "1px solid #222" }}>
              <input
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                placeholder="Say hi…"
                style={{ flex: 1, background: "#000", color: "#fff", border: "1px solid #333", borderRadius: 999, padding: "10px 14px", fontFamily: "var(--font-body)", fontSize: "0.85rem", boxSizing: "border-box" }}
              />
              <button
                onClick={() => messageTarget && messageMutation.mutate({ attendanceId: messageTarget.id, body: messageBody })}
                disabled={!messageBody.trim() || messageMutation.isPending}
                className="display"
                style={{ background: "#CCFF00", color: "#000", border: "none", borderRadius: 999, padding: "0 20px", cursor: "pointer", opacity: !messageBody.trim() || messageMutation.isPending ? 0.5 : 1 }}
              >
                SEND
              </button>
            </div>
          </div>
        </div>
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
