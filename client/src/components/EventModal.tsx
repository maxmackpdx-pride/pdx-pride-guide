import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@shared/schema";
import AttendanceCluster from "./AttendanceCluster";

const DAY_COLORS: Record<string, string> = {
  WED: "#CCFF00", THU: "#00FFFF", FRI: "#FF00CC", SAT: "#FF6600", SUN: "#FF2400"
};

type ModerationMode = null | "claim" | "remove";

export default function EventModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const { toast } = useToast();
  const [modMode, setModMode] = useState<ModerationMode>(null);
  const [modForm, setModForm] = useState({ name: "", email: "", proof: "" });

  const types = JSON.parse(event.eventTypes || "[]") as string[];
  const dayColor = DAY_COLORS[event.dayOfWeek || ""] || "#fff";
  const startTime = new Date(event.dateStart).toLocaleString([], {
    weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
  const endTime = new Date(event.dateEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const calUrl = () => {
    const s = event.dateStart.replace(/[-:]/g, "").slice(0, 15) + "00Z";
    const e = event.dateEnd.replace(/[-:]/g, "").slice(0, 15) + "00Z";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${s}/${e}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.address || event.venueName)}`;
  };

  const modMutation = useMutation({
    mutationFn: (data: { type: string; eventId: number; eventTitle: string; requesterName: string; requesterEmail: string; proof: string }) =>
      apiRequest("POST", "/api/moderation-request", data),
    onSuccess: () => {
      toast({ title: "Request submitted", description: "An admin will review your request shortly." });
      setModMode(null);
      setModForm({ name: "", email: "", proof: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not submit request.", variant: "destructive" });
    },
  });

  const handleModSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modForm.name || !modForm.email || !modForm.proof) return;
    modMutation.mutate({
      type: modMode === "claim" ? "CLAIM" : "REMOVE",
      eventId: event.id,
      eventTitle: event.title,
      requesterName: modForm.name,
      requesterEmail: modForm.email,
      proof: modForm.proof,
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        data-testid="event-modal"
        style={{
          background: "#0d0d0d", border: "1px solid #222",
          maxWidth: 660, width: "100%", maxHeight: "90vh", overflow: "auto", position: "relative",
        }}
      >
        {/* Color bar */}
        <div style={{ height: 5, background: dayColor }} />

        {/* Poster image — full natural size, centered, no crop */}
        {event.posterImageUrl && (
          <div style={{ width: "100%", background: "#000", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "0" }}>
            <img
              src={event.posterImageUrl}
              alt={event.title}
              style={{ display: "block", maxWidth: "100%", width: "auto", height: "auto", maxHeight: "70vh", objectFit: "contain" }}
            />
          </div>
        )}

        <div style={{ padding: "24px 24px 0" }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "none", border: "1px solid #333", color: "#555",
              width: 28, height: 28, cursor: "pointer", fontSize: "0.85rem",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>

          {/* Tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            <span className="sticker" style={{ color: dayColor, borderColor: dayColor }}>{event.dayOfWeek}</span>
            <span className="sticker" style={{ color: "#888", borderColor: "#333" }}>
              {event.ageRequirement.replace("_PLUS", "+").replace("ALL_AGES", "All Ages")}
            </span>
            <span className="sticker" style={{ color: "#888", borderColor: "#333" }}>{event.admission}</span>
            {event.isSexPositive && <span className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC" }}>SEX+</span>}
            {event.nudityOk && <span className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC" }}>NUDITY OK</span>}
            {event.isHouseParty && <span className="sticker" style={{ color: "#FF6600", borderColor: "#FF6600" }}>HOUSE PARTY</span>}
            {event.isClaimable && (
              <span className="sticker" style={{ color: "#00FFFF", borderColor: "#00FFFF", cursor: "pointer" }}
                onClick={() => setModMode("claim")}>
                CLAIM THIS EVENT →
              </span>
            )}
          </div>

          <h2 className="display" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", margin: "0 0 8px", lineHeight: 1 }}>
            {event.title}
          </h2>
          <div style={{ color: "#CCFF00", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", marginBottom: 16 }}>
            {event.venueName}{event.neighborhood ? ` · ${event.neighborhood}` : ""}
          </div>

          {/* Time block */}
          <div style={{ background: "#111", padding: "14px 16px", marginBottom: 20, borderLeft: `3px solid ${dayColor}` }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>
              {startTime} – {endTime}
            </div>
            {event.address && !event.isPrivate && (
              <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>{event.address}</div>
            )}
            {event.isPrivate && (
              <div style={{ fontSize: "0.8rem", color: "#555", marginTop: 4 }}>📍 Location provided upon RSVP</div>
            )}
          </div>

          <p style={{ color: "#aaa", lineHeight: 1.7, fontSize: "0.88rem", marginBottom: 20 }}>
            {event.description}
          </p>

          {types.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
              {types.map(t => (
                <span key={t} className="sticker" style={{ color: "#555", borderColor: "#222" }}>{t}</span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div style={{
            display: "flex", gap: 10, flexWrap: "wrap",
            borderTop: "1px solid #1a1a1a", paddingTop: 20, marginBottom: 4,
          }}>
            {event.ticketUrl && (
              <a href={event.ticketUrl} target="_blank" rel="noopener"
                className="btn-neon solid" style={{ fontSize: "0.8rem", padding: "8px 16px" }}>
                Get Tickets →
              </a>
            )}
            <a href={calUrl()} target="_blank" rel="noopener"
              className="btn-neon" style={{ fontSize: "0.8rem", padding: "8px 16px" }}>
              Add to Calendar
            </a>
          </div>

          {/* Attendance cluster */}
          <AttendanceCluster eventId={event.id} />

          {/* Claim / Remove links */}
          <div style={{
            display: "flex", gap: 16, padding: "16px 0 24px",
            borderTop: "1px solid #111", marginTop: 16,
          }}>
            {event.isClaimable && modMode !== "claim" && (
              <button
                data-testid="button-claim-event"
                onClick={() => setModMode("claim")}
                style={{ background: "none", border: "none", color: "#00FFFF", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                ↗ Request to Claim This Event
              </button>
            )}
            {modMode !== "remove" && (
              <button
                data-testid="button-remove-event"
                onClick={() => setModMode("remove")}
                style={{ background: "none", border: "none", color: "#444", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                ↗ Request Removal
              </button>
            )}
          </div>

          {/* Moderation form */}
          {modMode && (
            <div
              data-testid="form-moderation"
              style={{ background: "#0a0a0a", border: `2px solid ${modMode === "claim" ? "#00FFFF" : "#333"}`, padding: "20px", marginBottom: 24 }}
            >
              <p className="display" style={{ fontSize: "1rem", color: modMode === "claim" ? "#00FFFF" : "#fff", marginBottom: 4 }}>
                {modMode === "claim" ? "REQUEST TO CLAIM THIS EVENT" : "REQUEST REMOVAL"}
              </p>
              <p style={{ fontSize: "0.78rem", color: "#555", marginBottom: 16, lineHeight: 1.5 }}>
                {modMode === "claim"
                  ? "Tell us why you're the organizer. Include a link to your website, social, or any proof. An admin will verify and transfer ownership."
                  : "Tell us why this event should be removed. If you're the organizer or have a specific reason, explain below. An admin will review."}
              </p>
              <form onSubmit={handleModSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <input
                    data-testid="input-mod-name"
                    type="text" placeholder="Your name" value={modForm.name}
                    onChange={e => setModForm(f => ({ ...f, name: e.target.value }))}
                    style={{ padding: "8px 12px", background: "#000", border: "1px solid #333", color: "#fff", fontSize: "0.82rem", outline: "none", fontFamily: "var(--font-body)" }}
                    onFocus={e => (e.target.style.borderColor = modMode === "claim" ? "#00FFFF" : "#888")}
                    onBlur={e => (e.target.style.borderColor = "#333")}
                  />
                  <input
                    data-testid="input-mod-email"
                    type="email" placeholder="Your email" value={modForm.email}
                    onChange={e => setModForm(f => ({ ...f, email: e.target.value }))}
                    style={{ padding: "8px 12px", background: "#000", border: "1px solid #333", color: "#fff", fontSize: "0.82rem", outline: "none", fontFamily: "var(--font-body)" }}
                    onFocus={e => (e.target.style.borderColor = modMode === "claim" ? "#00FFFF" : "#888")}
                    onBlur={e => (e.target.style.borderColor = "#333")}
                  />
                </div>
                <textarea
                  data-testid="input-mod-proof"
                  placeholder={modMode === "claim" ? "Proof you're the organizer (website, social link, description...)" : "Reason for removal"}
                  value={modForm.proof}
                  onChange={e => setModForm(f => ({ ...f, proof: e.target.value }))}
                  rows={3}
                  style={{ width: "100%", padding: "8px 12px", background: "#000", border: "1px solid #333", color: "#fff", fontSize: "0.82rem", outline: "none", fontFamily: "var(--font-body)", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
                  onFocus={e => (e.target.style.borderColor = modMode === "claim" ? "#00FFFF" : "#888")}
                  onBlur={e => (e.target.style.borderColor = "#333")}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="submit"
                    data-testid="button-submit-mod"
                    disabled={modMutation.isPending}
                    className="display"
                    style={{
                      padding: "8px 20px", border: "2px solid",
                      borderColor: modMode === "claim" ? "#00FFFF" : "#888",
                      background: "transparent",
                      color: modMode === "claim" ? "#00FFFF" : "#888",
                      fontSize: "0.82rem", cursor: "pointer", opacity: modMutation.isPending ? 0.5 : 1,
                      letterSpacing: "0.05em", textTransform: "uppercase",
                    }}
                  >
                    {modMutation.isPending ? "SUBMITTING..." : "SUBMIT REQUEST"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModMode(null)}
                    style={{ padding: "8px 14px", background: "none", border: "1px solid #222", color: "#444", fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
