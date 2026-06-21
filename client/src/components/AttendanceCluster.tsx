import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

const SPEECH_OPTIONS = [
  "Hey, I'll be there!",
  "Hey, come say hi!",
  "Hey, I just have RBF but really come say hi!",
  "Hey, come say hi — I don't bite (unless asked)",
  "Hey, I'm friendly but bad at starting conversations",
  "Hey, my social battery is low but I'm trying",
  "Hey, I'm cute and slightly feral",
  "Hey, let's be awkward together",
  "Hey, eye contact first, then we talk 👀",
  "Hey, here for the queers and the chaos",
  "Hey, consent is hot — let's start there",
  "Hey, I'm floating around — tap me if you want company",
];

// Generate a deterministic neon color from a seed string
function seedColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const colors = ["#CCFF00", "#00FFFF", "#FF00CC", "#FF6600", "#8800FF", "#FF2400", "#00EE44"];
  return colors[h % colors.length];
}

// Generate initials from handle
function initials(handle: string): string {
  return handle.slice(0, 2).toUpperCase();
}

interface Attendee {
  id: number;
  handle: string;
  message: string;
  avatarSeed: string;
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

export default function AttendanceCluster({ eventId }: { eventId: number }) {
  const [showForm, setShowForm] = useState(false);
  const [handle, setHandle] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(SPEECH_OPTIONS[0]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastRandomizeRef = useRef<number>(Date.now());

  const { data: attendees = [] } = useQuery<Attendee[]>({
    queryKey: ["/api/events", eventId, "attendance"],
    queryFn: () => apiRequest("GET", `/api/events/${eventId}/attendance`).then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: { handle: string; message: string }) =>
      apiRequest("POST", `/api/events/${eventId}/attendance`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendance"] });
      setShowForm(false);
      setHandle("");
    },
  });

  // Initialize bubbles when attendees load
  useEffect(() => {
    if (!containerRef.current || attendees.length === 0) return;
    const W = containerRef.current.offsetWidth || 600;
    const H = 220;
    const RADIUS = 36;

    setBubbles(
      attendees.map((att, i) => ({
        attendee: att,
        x: RADIUS + (Math.random() * (W - RADIUS * 2)),
        y: RADIUS + (Math.random() * (H - RADIUS * 2)),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        visible: true,
        size: 36 + Math.random() * 12,
      }))
    );
  }, [attendees]);

  // Animate bubbles: slow drift + random show/hide
  useEffect(() => {
    if (bubbles.length === 0) return;

    const animate = () => {
      const W = containerRef.current?.offsetWidth || 600;
      const H = 220;
      const now = Date.now();

      setBubbles(prev => {
        // Every 3–5 seconds, toggle 1–3 random bubbles
        let newBubbles = prev;
        if (now - lastRandomizeRef.current > 3000 + Math.random() * 2000) {
          lastRandomizeRef.current = now;
          const count = 1 + Math.floor(Math.random() * 3);
          const indices = [...Array(prev.length).keys()].sort(() => Math.random() - 0.5).slice(0, count);
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
          if (ny < b.size / 2) { ny = b.size / 2; nvy = Math.abs(nvy); }
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
  }, [bubbles.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;
    mutation.mutate({ handle: handle.trim(), message: selectedMessage });
  };

  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "2px solid #1a1a1a",
        padding: "24px",
        marginTop: 32,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <span className="sticker" style={{ color: "#CCFF00", borderColor: "#CCFF00", fontSize: "0.6rem" }}>
            {attendees.length} GOING
          </span>
          <h3 className="display" style={{ fontSize: "1.4rem", color: "#fff", margin: "6px 0 0" }}>
            HEY, I'LL BE THERE
          </h3>
        </div>
        {!showForm && (
          <button
            data-testid="button-ill-be-there"
            onClick={() => setShowForm(true)}
            className="display"
            style={{
              background: "transparent",
              border: "2px solid #CCFF00",
              color: "#CCFF00",
              padding: "8px 18px",
              fontSize: "0.85rem",
              cursor: "pointer",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition: "all 0.1s",
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.background = "#CCFF00";
              (e.target as HTMLButtonElement).style.color = "#000";
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.background = "transparent";
              (e.target as HTMLButtonElement).style.color = "#CCFF00";
            }}
          >
            + I'LL BE THERE
          </button>
        )}
      </div>

      {/* Animated bubble cluster */}
      {bubbles.length > 0 && (
        <div
          ref={containerRef}
          style={{
            position: "relative",
            height: 220,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {bubbles.map((b, i) => {
            const color = seedColor(b.attendee.avatarSeed);
            const isHovered = hoveredId === b.attendee.id;
            return (
              <div
                key={b.attendee.id}
                data-testid={`bubble-attendee-${b.attendee.id}`}
                onMouseEnter={() => setHoveredId(b.attendee.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setHoveredId(isHovered ? null : b.attendee.id)}
                style={{
                  position: "absolute",
                  left: b.x - b.size / 2,
                  top: b.y - b.size / 2,
                  width: b.size,
                  height: b.size,
                  borderRadius: "50%",
                  background: color,
                  border: `2.5px solid ${isHovered ? "#fff" : "#000"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: Math.max(10, b.size * 0.33),
                  color: "#000",
                  cursor: "pointer",
                  userSelect: "none",
                  opacity: b.visible ? 1 : 0,
                  transition: "opacity 0.6s, border-color 0.15s, transform 0.15s",
                  transform: `scale(${b.visible ? (isHovered ? 1.15 : 1) : 0.6})`,
                  zIndex: isHovered ? 20 : 10,
                  boxShadow: isHovered ? `0 0 12px ${color}88` : `0 0 4px ${color}44`,
                }}
              >
                {initials(b.attendee.handle)}

                {/* Speech bubble on hover */}
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
                      borderRadius: 0,
                      border: "2px solid #000",
                      whiteSpace: "nowrap",
                      maxWidth: 220,
                      whiteSpace: "normal",
                      textAlign: "center",
                      lineHeight: 1.3,
                      zIndex: 30,
                      pointerEvents: "none",
                      boxShadow: "3px 3px 0 #000",
                    }}
                  >
                    <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "0.65rem", marginBottom: 2, color: "#555" }}>
                      {b.attendee.handle}
                    </span>
                    {b.attendee.message}
                    {/* Tail */}
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
      )}

      {attendees.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#444" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>BE THE FIRST TO SAY YOU'RE GOING</p>
        </div>
      )}

      {/* Sign-up form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          data-testid="form-attendance"
          style={{
            background: "#111",
            border: "1px solid #222",
            padding: "16px",
            marginTop: 12,
          }}
        >
          <p className="display" style={{ fontSize: "0.85rem", color: "#CCFF00", marginBottom: 12 }}>
            PICK YOUR VIBE
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, maxHeight: 200, overflowY: "auto" }}>
            {SPEECH_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                data-testid={`option-${opt.slice(0, 20)}`}
                onClick={() => setSelectedMessage(opt)}
                style={{
                  textAlign: "left",
                  padding: "7px 12px",
                  background: selectedMessage === opt ? "#CCFF00" : "transparent",
                  border: `1px solid ${selectedMessage === opt ? "#CCFF00" : "#333"}`,
                  color: selectedMessage === opt ? "#000" : "#aaa",
                  fontSize: "0.8rem",
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                  transition: "all 0.1s",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              data-testid="input-handle"
              placeholder="Your handle or name"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              maxLength={30}
              style={{
                flex: "1 1 160px",
                padding: "8px 12px",
                background: "#000",
                border: "1px solid #333",
                color: "#fff",
                fontSize: "0.85rem",
                fontFamily: "var(--font-body)",
                outline: "none",
              }}
              onFocus={e => (e.target.style.borderColor = "#CCFF00")}
              onBlur={e => (e.target.style.borderColor = "#333")}
            />
            <button
              type="submit"
              data-testid="button-submit-attendance"
              disabled={mutation.isPending || !handle.trim()}
              className="display"
              style={{
                padding: "9px 20px",
                background: "#CCFF00",
                border: "none",
                color: "#000",
                fontSize: "0.85rem",
                cursor: "pointer",
                opacity: mutation.isPending || !handle.trim() ? 0.5 : 1,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {mutation.isPending ? "ADDING..." : "I'M IN"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: "9px 14px",
                background: "transparent",
                border: "1px solid #333",
                color: "#666",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
