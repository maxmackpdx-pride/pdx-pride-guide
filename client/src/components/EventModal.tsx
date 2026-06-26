import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import type { Event } from "@shared/schema";
import EventTagsRow from "./EventTagsRow";
import AttendanceCluster from "./AttendanceCluster";
import MissedConnectionsPanel from "./MissedConnectionsPanel";
import EventLinkChoiceMenu from "./EventLinkChoiceMenu";
import AuthModal from "./AuthModal";
import UserAvatar from "./UserAvatar";
import EventTalentPanel from "./EventTalentPanel";
import { appleMapsUrl, downloadIcsFile, googleCalendarUrl, googleMapsUrl } from "@/lib/eventLinks";

type EventHostProfile = {
  userId: number;
  username?: string;
  displayName?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  role: string;
};

const DAY_COLORS: Record<string, string> = {
  WED: "#CCFF00", THU: "#00FFFF", FRI: "#FF00CC", SAT: "#FF6600", SUN: "#FF2400"
};

type ModerationMode = null | "claim" | "remove" | "flag" | "transfer";

const claimEvent = (eventId: number) => {
  window.location.hash = `/submit/claim/${eventId}`;
};

export default function EventModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [modMode, setModMode] = useState<ModerationMode>(null);
  const [modForm, setModForm] = useState({ name: "", email: "", proof: "" });
  const [showAuth, setShowAuth] = useState(false);
  const [hostDrawer, setHostDrawer] = useState<"closed" | "compose" | "noHost">("closed");
  const [hostMessage, setHostMessage] = useState("");
  const [coHostForm, setCoHostForm] = useState({ username: "", email: "" });
  const [showAddCoHost, setShowAddCoHost] = useState(false);
  const [showCalPicker, setShowCalPicker] = useState(false);
  const [showMapsPicker, setShowMapsPicker] = useState(false);
  const [socialTab, setSocialTab] = useState<"attendance" | "missed">("attendance");

  const { data: eventHosts = [], refetch: refetchHosts } = useQuery<EventHostProfile[]>({
    queryKey: ["/api/events", event.id, "hosts"],
    queryFn: () => fetch(`/api/events/${event.id}/hosts`).then(r => r.ok ? r.json() : []),
  });

  const posterUrl = resolveEventPosterUrl(event.id, event.posterImageUrl);
  const dayColor = DAY_COLORS[event.dayOfWeek || ""] || "#fff";

  const { data: hostMessages = [] } = useQuery<Array<{
    id: number;
    body: string;
    createdAt: string;
    displayName?: string;
    username?: string;
  }>>({
    queryKey: ["/api/events", event.id, "host-messages"],
    queryFn: () => fetch(`/api/events/${event.id}/host-messages`).then(r => r.ok ? r.json() : []),
  });
  const hasPendingClaim = Boolean((event as Event & { hasPendingClaim?: boolean }).hasPendingClaim);
  const startTime = new Date(event.dateStart).toLocaleString([], {
    weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
  const endTime = new Date(event.dateEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

  const hostMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/events/${event.id}/message-host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(payload.error || "Could not send message") as Error & { code?: string };
        err.code = payload.error;
        throw err;
      }
      return payload;
    },
    onSuccess: () => {
      toast({ title: "Message sent", description: "The host can reply in your inbox." });
      setHostMessage("");
      setHostDrawer("closed");
    },
    onError: (err: Error & { code?: string }) => {
      if (err.code === "NO_HOST") {
        setHostDrawer("noHost");
        return;
      }
      toast({ title: "Error", description: err.message || "Could not send message.", variant: "destructive" });
    },
  });

  const transferMutation = useMutation({
    mutationFn: (data: { target: string; notes: string }) =>
      apiRequest("POST", `/api/events/${event.id}/transfer`, data),
    onSuccess: () => {
      toast({ title: "Transfer requested", description: "An admin will verify the new host." });
      setModMode(null);
      setModForm({ name: "", email: "", proof: "" });
    },
    onError: () => toast({ title: "Could not request transfer", variant: "destructive" }),
  });

  const isHost = Boolean(user && eventHosts.some(h => h.userId === user.id));
  const canAddCoHost = isHost && eventHosts.length < 3;

  const addCoHostMutation = useMutation({
    mutationFn: async (data: { username: string; email: string }) => {
      const res = await fetch(`/api/events/${event.id}/hosts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not add co-host");
      return payload;
    },
    onSuccess: () => {
      toast({ title: "Co-host added", description: "They can help manage this event from their dashboard." });
      setCoHostForm({ username: "", email: "" });
      setShowAddCoHost(false);
      refetchHosts();
    },
    onError: (err: Error) => {
      toast({ title: "Could not add co-host", description: err.message, variant: "destructive" });
    },
  });

  const openModMode = (mode: ModerationMode) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setModForm({
      name: user.displayName || user.username,
      email: user.email || "",
      proof: "",
    });
    setModMode(mode);
  };

  const handleModSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modMode === "transfer") {
      if (!modForm.proof.trim()) return;
      transferMutation.mutate({ target: modForm.proof.trim(), notes: modForm.name });
      return;
    }
    if (!modForm.name || !modForm.email || !modForm.proof) return;
    const typeMap = { claim: "CLAIM", remove: "REMOVE", flag: "FLAG" } as const;
    const modType = modMode && modMode in typeMap ? typeMap[modMode as keyof typeof typeMap] : "REMOVE";
    modMutation.mutate({
      type: modType,
      eventId: event.id,
      eventTitle: event.title,
      requesterName: modForm.name,
      requesterEmail: modForm.email,
      proof: modForm.proof,
    });
  };

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={e => e.stopPropagation()} data-testid="event-modal">
        <div className="event-modal__bar" style={{ background: dayColor }} />

        <div className="event-modal__poster">
          <img src={posterUrl} alt={event.title} className="event-modal__poster-img" />
        </div>

        <button type="button" className="event-modal__close" onClick={onClose} aria-label="Close event">✕</button>

        <div className="event-modal__body">
          <h2 className="display event-modal__title">{event.title}</h2>

          <div className="event-modal__meta" style={{ borderLeftColor: dayColor }}>
            <div className="event-modal__datetime">
              {startTime} – {endTime}
            </div>
            <div className="event-modal__venue">
              {event.venueName}{event.neighborhood ? ` · ${event.neighborhood}` : ""}
            </div>
            {!event.isPrivate && (event.address || event.venueName) && (
              <div className="event-modal__address-wrap">
                <button
                  type="button"
                  onClick={() => { setShowCalPicker(false); setShowMapsPicker(v => !v); }}
                  data-testid="button-open-maps"
                  className="event-modal__address"
                >
                  {event.address || event.venueName} ↗
                </button>
                <EventLinkChoiceMenu
                  open={showMapsPicker}
                  onClose={() => setShowMapsPicker(false)}
                  title="Open in maps"
                  options={[
                    { label: "Google Maps", hint: "Works on all devices", onClick: () => window.open(googleMapsUrl(event), "_blank", "noopener,noreferrer") },
                    { label: "Apple Maps", hint: "Best on iPhone / Mac", onClick: () => window.open(appleMapsUrl(event), "_blank", "noopener,noreferrer") },
                  ]}
                />
              </div>
            )}
            {event.isPrivate && (
              <div className="event-modal__private-note">Location provided upon RSVP</div>
            )}
          </div>

          <EventTagsRow
            event={event}
            size="sm"
            showJsonTypes
            onClaimClick={() => (user ? claimEvent(event.id) : setShowAuth(true))}
            className="event-modal__tags"
          />

          {event.description && (
            <p className="event-modal__description">{event.description}</p>
          )}

          {/* Hosts */}
          {eventHosts.length > 0 && (
            <div className="event-hosts-panel" style={{ marginBottom: 20 }}>
              <div className="display event-hosts-label" style={{ fontSize: "0.72rem", color: dayColor, letterSpacing: "0.1em", marginBottom: 12 }}>
                {eventHosts.length === 1 ? "HOST" : "HOSTS"}
              </div>
              <div className="event-hosts-row">
                {eventHosts.map(host => (
                  <div key={host.userId} className="event-host-card">
                    <UserAvatar
                      photoUrl={host.photoUrl}
                      avatarChoice={host.avatarChoice}
                      avatarRing={host.avatarRing}
                      displayName={host.displayName}
                      username={host.username}
                      size={56}
                    />
                    <div className="event-host-meta">
                      <span className="event-host-name">{host.displayName || host.username}</span>
                      {host.role === "PRIMARY" && (
                        <span className="event-host-role">Primary</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {canAddCoHost && (
                <div className="event-cohost-add" style={{ marginTop: 14 }}>
                  {!showAddCoHost ? (
                    <button
                      type="button"
                      onClick={() => user ? setShowAddCoHost(true) : setShowAuth(true)}
                      className="display"
                      style={{
                        background: "none", border: "1px solid rgba(204,255,0,0.45)", color: "#CCFF00",
                        fontSize: "0.68rem", padding: "6px 12px", cursor: "pointer", letterSpacing: "0.08em",
                      }}
                    >
                      + ADD CO-HOST ({eventHosts.length}/3)
                    </button>
                  ) : (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        addCoHostMutation.mutate(coHostForm);
                      }}
                      style={{ display: "flex", flexDirection: "column", gap: 8 }}
                    >
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-meta)" }}>
                        Add a verified organizer by username and email (max 3 hosts).
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <input
                          type="text"
                          placeholder="Username"
                          value={coHostForm.username}
                          onChange={e => setCoHostForm(f => ({ ...f, username: e.target.value }))}
                          required
                          style={{ padding: "8px 10px", background: "#000", border: "1px solid #333", color: "#fff", fontSize: "0.82rem" }}
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={coHostForm.email}
                          onChange={e => setCoHostForm(f => ({ ...f, email: e.target.value }))}
                          required
                          style={{ padding: "8px 10px", background: "#000", border: "1px solid #333", color: "#fff", fontSize: "0.82rem" }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="submit"
                          disabled={addCoHostMutation.isPending || !coHostForm.username.trim() || !coHostForm.email.trim()}
                          className="display"
                          style={{
                            padding: "6px 14px", border: "1px solid #CCFF00", background: "transparent",
                            color: "#CCFF00", fontSize: "0.68rem", cursor: "pointer",
                            opacity: addCoHostMutation.isPending ? 0.5 : 1,
                          }}
                        >
                          {addCoHostMutation.isPending ? "ADDING..." : "ADD CO-HOST"}
                        </button>
                        <button type="button" onClick={() => setShowAddCoHost(false)} style={{ background: "none", border: "none", color: "var(--text-meta)", fontSize: "0.75rem", cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          <EventTalentPanel
            eventId={event.id}
            eventTitle={event.title}
            dayColor={dayColor}
            mode="view"
            isClaimable={event.isClaimable}
          />

          {/* Latest from host */}
          <div style={{
            marginBottom: 20,
            border: `2px solid ${hostMessages.length > 0 ? dayColor : "#222"}`,
            background: "#080808",
            padding: "14px 16px",
          }}>
            <div className="display" style={{ fontSize: "0.78rem", color: hostMessages.length > 0 ? dayColor : "#555", letterSpacing: "0.08em", marginBottom: 10 }}>
              LATEST FROM HOST
            </div>
            {hostMessages.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {hostMessages.map(msg => (
                  <div key={msg.id} style={{ borderLeft: `3px solid ${dayColor}`, paddingLeft: 12 }}>
                    <div style={{ fontSize: "0.88rem", color: "#ddd", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.body}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-meta)", marginTop: 6 }}>
                      {msg.displayName || msg.username || "Host"} · {new Date(msg.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "0.82rem", color: "var(--text-meta)", lineHeight: 1.5 }}>
                No host updates yet. Check back closer to the event — organizers post timing changes, door info, and last-minute notes here.
              </div>
            )}
          </div>

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
            <div className="event-link-choice-anchor">
              <button
                type="button"
                data-testid="button-add-to-calendar"
                onClick={() => { setShowMapsPicker(false); setShowCalPicker(v => !v); }}
                className="btn-neon"
                style={{ fontSize: "0.8rem", padding: "8px 16px" }}
              >
                Add to Calendar
              </button>
              <EventLinkChoiceMenu
                floating
                open={showCalPicker}
                onClose={() => setShowCalPicker(false)}
                title="Add to calendar"
                options={[
                  {
                    label: "Google Calendar",
                    hint: "Opens in browser",
                    onClick: () => window.open(googleCalendarUrl(event), "_blank", "noopener,noreferrer"),
                  },
                  {
                    label: "Apple Calendar / iCal",
                    hint: "Downloads .ics file",
                    onClick: () => downloadIcsFile(event),
                  },
                ]}
              />
            </div>
            <button
              type="button"
              onClick={() => user ? setHostDrawer("compose") : setShowAuth(true)}
              className="btn-neon"
              style={{ fontSize: "0.8rem", padding: "8px 16px" }}
            >
              Message the Host
            </button>
          </div>

          <div className="event-modal__tabs" role="tablist" aria-label="Event social">
            <button
              type="button"
              role="tab"
              aria-selected={socialTab === "attendance"}
              className={`event-modal__tab${socialTab === "attendance" ? " active" : ""}`}
              onClick={() => setSocialTab("attendance")}
            >
              I'll Be There
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={socialTab === "missed"}
              className={`event-modal__tab${socialTab === "missed" ? " active" : ""}`}
              onClick={() => setSocialTab("missed")}
            >
              Missed Connections
            </button>
          </div>

          <section
            className="event-modal__tab-panel"
            role="tabpanel"
            data-testid={socialTab === "attendance" ? "event-modal-attendance" : "event-modal-missed"}
          >
            {socialTab === "attendance" ? (
              <AttendanceCluster eventId={event.id} embedded />
            ) : (
              <MissedConnectionsPanel mode="event" eventId={event.id} compact />
            )}
          </section>

          {hostDrawer === "compose" && (
            <div style={{ background: "#080808", border: "2px solid #00FFFF", padding: 16, marginTop: 16 }}>
              <p className="display" style={{ color: "#00FFFF", fontSize: "0.95rem", marginBottom: 8 }}>
                MESSAGE THE HOST
              </p>
              <textarea
                value={hostMessage}
                onChange={e => setHostMessage(e.target.value)}
                rows={4}
                placeholder={`Ask about ${event.title}...`}
                style={{ width: "100%", boxSizing: "border-box", background: "#000", color: "#fff", border: "1px solid #333", padding: 10, fontFamily: "var(--font-body)", resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => hostMutation.mutate(hostMessage)}
                  disabled={!hostMessage.trim() || hostMutation.isPending}
                  className="display"
                  style={{ background: "#00FFFF", color: "#000", border: "none", padding: "8px 16px", cursor: "pointer", opacity: !hostMessage.trim() || hostMutation.isPending ? 0.55 : 1 }}
                >
                  {hostMutation.isPending ? "SENDING..." : "SEND"}
                </button>
                <button type="button" onClick={() => setHostDrawer("closed")} style={{ background: "transparent", color: "var(--text-meta)", border: "1px solid #333", padding: "8px 12px", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {hostDrawer === "noHost" && (
            <div style={{ background: "#080808", border: "2px solid #FF2400", padding: 16, marginTop: 16 }}>
              <p className="display" style={{ color: "#FF2400", fontSize: "1rem", marginBottom: 8 }}>
                NO HOST IS ATTACHED TO THIS EVENT YET
              </p>
              <p style={{ color: "#888", fontSize: "0.82rem", lineHeight: 1.5, marginBottom: 12 }}>
                This event hasn't been claimed by an organizer. You may find contact info at the link below.
              </p>
              {event.ticketUrl && (
                <a href={event.ticketUrl} target="_blank" rel="noopener" className="btn-neon solid" style={{ fontSize: "0.78rem", padding: "8px 14px" }}>
                  Visit Event Link →
                </a>
              )}
              <button type="button" onClick={() => setHostDrawer("closed")} style={{ marginLeft: 8, background: "transparent", color: "var(--text-meta)", border: "1px solid #333", padding: "8px 12px", cursor: "pointer" }}>
                Close
              </button>
            </div>
          )}

          {event.isClaimable && (
            <div className="event-modal__warning">
              <span className="event-modal__warning-label">Warning</span>
              <p className="event-modal__warning-text">
                This event has not been claimed by its organizer. Details were sourced from public listings — please confirm time, venue, and ticketing directly before attending.
                {hasPendingClaim ? " A claim is pending admin review." : ""}
              </p>
            </div>
          )}

          {/* Claim / Remove links */}
          <div style={{
            display: "flex", gap: 16, padding: "16px 0 24px",
            borderTop: "1px solid #111", marginTop: 16,
          }}>
            {hasPendingClaim && (
              <span style={{ color: "#FF00CC", fontSize: "0.75rem", fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Claim pending admin review
              </span>
            )}
            {!hasPendingClaim && event.isClaimable && (
              <button
                data-testid="button-claim-event"
                onClick={() => user ? claimEvent(event.id) : setShowAuth(true)}
                style={{ background: "none", border: "none", color: "#00FFFF", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                ↗ Request to Claim This Event
              </button>
            )}
            {modMode !== "remove" && (
              <button
                data-testid="button-remove-event"
                onClick={() => openModMode("remove")}
                style={{ background: "none", border: "none", color: "var(--text-meta)", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                ↗ Request Removal
              </button>
            )}
            {modMode !== "flag" && (
              <button
                data-testid="button-flag-event"
                onClick={() => openModMode("flag")}
                style={{ background: "none", border: "none", color: "#FF6600", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                ↗ Flag Data Error
              </button>
            )}
            {isHost && modMode !== "transfer" && (
              <button
                data-testid="button-transfer-event"
                onClick={() => openModMode("transfer")}
                style={{ background: "none", border: "none", color: "#CCFF00", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                ↗ Transfer Host
              </button>
            )}
          </div>

          {/* Moderation form */}
          {modMode && (
            <div
              data-testid="form-moderation"
              style={{ background: "#0a0a0a", border: `2px solid ${modMode === "claim" ? "#00FFFF" : "#333"}`, padding: "20px", marginBottom: 24 }}
            >
              <p className="display" style={{ fontSize: "1rem", color: modMode === "claim" ? "#00FFFF" : modMode === "flag" ? "#FF6600" : modMode === "transfer" ? "#CCFF00" : "#fff", marginBottom: 4 }}>
                {modMode === "claim" && "REQUEST TO CLAIM THIS EVENT"}
                {modMode === "remove" && "REQUEST REMOVAL"}
                {modMode === "flag" && "FLAG A DATA ERROR"}
                {modMode === "transfer" && "TRANSFER HOST TO SOMEONE ELSE"}
              </p>
              <p style={{ fontSize: "0.78rem", color: "var(--text-meta)", marginBottom: 16, lineHeight: 1.5 }}>
                {modMode === "claim" && "Tell us why you're the organizer. Include a link to your website, social, or any proof. An admin will verify and transfer ownership."}
                {modMode === "remove" && "Tell us why this event should be removed. If you're the organizer or have a specific reason, explain below. An admin will review."}
                {modMode === "flag" && "Wrong time, venue, link, or description? Tell us what's off. Admins use this to fix the listing — not to remove it."}
                {modMode === "transfer" && "Release hosting to another verified organizer. Enter their username or email. An admin confirms the handoff."}
              </p>
              <form onSubmit={handleModSubmit}>
                {modMode !== "transfer" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <input
                      data-testid="input-mod-name"
                      type="text" placeholder="Your name" value={modForm.name}
                      onChange={e => setModForm(f => ({ ...f, name: e.target.value }))}
                      style={{ padding: "8px 12px", background: "#000", border: "1px solid #333", color: "#fff", fontSize: "0.82rem", outline: "none", fontFamily: "var(--font-body)" }}
                    />
                    <input
                      data-testid="input-mod-email"
                      type="email" placeholder="Your email" value={modForm.email}
                      onChange={e => setModForm(f => ({ ...f, email: e.target.value }))}
                      style={{ padding: "8px 12px", background: "#000", border: "1px solid #333", color: "#fff", fontSize: "0.82rem", outline: "none", fontFamily: "var(--font-body)" }}
                    />
                  </div>
                )}
                {modMode === "transfer" && (
                  <input
                    type="text"
                    placeholder="Optional note for admin"
                    value={modForm.name}
                    onChange={e => setModForm(f => ({ ...f, name: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", background: "#000", border: "1px solid #333", color: "#fff", fontSize: "0.82rem", marginBottom: 10, boxSizing: "border-box" }}
                  />
                )}
                <textarea
                  data-testid="input-mod-proof"
                  placeholder={
                    modMode === "claim" ? "Proof you're the organizer (website, social link, description...)"
                    : modMode === "flag" ? "What's wrong with this listing?"
                    : modMode === "transfer" ? "New host username or email"
                    : "Reason for removal"
                  }
                  value={modForm.proof}
                  onChange={e => setModForm(f => ({ ...f, proof: e.target.value }))}
                  rows={3}
                  style={{ width: "100%", padding: "8px 12px", background: "#000", border: "1px solid #333", color: "#fff", fontSize: "0.82rem", outline: "none", fontFamily: "var(--font-body)", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="submit"
                    data-testid="button-submit-mod"
                    disabled={modMutation.isPending || transferMutation.isPending}
                    className="display"
                    style={{
                      padding: "8px 20px", border: "2px solid",
                      borderColor: modMode === "claim" ? "#00FFFF" : modMode === "flag" ? "#FF6600" : modMode === "transfer" ? "#CCFF00" : "#888",
                      background: "transparent",
                      color: modMode === "claim" ? "#00FFFF" : modMode === "flag" ? "#FF6600" : modMode === "transfer" ? "#CCFF00" : "#888",
                      fontSize: "0.82rem", cursor: "pointer", opacity: modMutation.isPending || transferMutation.isPending ? 0.5 : 1,
                      letterSpacing: "0.05em", textTransform: "uppercase",
                    }}
                  >
                    {(modMutation.isPending || transferMutation.isPending) ? "SUBMITTING..." : "SUBMIT REQUEST"}
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
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
