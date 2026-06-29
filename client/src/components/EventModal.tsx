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
import { formatPacificDateTime } from "@/lib/countdown";

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

type ModerationMode = null | "remove" | "flag" | "transfer";

const claimEvent = (eventId: number) => {
  window.location.hash = `/submit/claim/${eventId}`;
};

const modAccent: Record<Exclude<ModerationMode, null>, string> = {
  remove: "#888",
  flag: "#FF6600",
  transfer: "#CCFF00",
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
    queryFn: () => fetch(`/api/events/${event.id}/hosts`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
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
    queryFn: () => fetch(`/api/events/${event.id}/host-messages`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });
  const hasPendingClaim = Boolean((event as Event & { hasPendingClaim?: boolean }).hasPendingClaim);
  const startTime = formatPacificDateTime(event.dateStart, {
    weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const endTime = formatPacificDateTime(event.dateEnd, { hour: "2-digit", minute: "2-digit" });

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
        credentials: "include",
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
    const typeMap = { remove: "REMOVE", flag: "FLAG" } as const;
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

  const modColor = modMode ? modAccent[modMode] : "#888";

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

          {eventHosts.length > 0 && (
            <div className="event-modal__section event-hosts-panel" style={{ "--section-accent": dayColor } as React.CSSProperties}>
              <div className="event-modal__section-label event-hosts-label">
                {eventHosts.length === 1 ? "Host" : "Hosts"}
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
                <div className="event-modal__cohost">
                  {!showAddCoHost ? (
                    <button
                      type="button"
                      onClick={() => user ? setShowAddCoHost(true) : setShowAuth(true)}
                      className="event-modal__btn-outline"
                    >
                      + Add co-host ({eventHosts.length}/3)
                    </button>
                  ) : (
                    <form
                      className="event-modal__cohost-form"
                      onSubmit={e => {
                        e.preventDefault();
                        addCoHostMutation.mutate(coHostForm);
                      }}
                    >
                      <p className="event-modal__cohost-hint">
                        Add a verified organizer by username and email (max 3 hosts).
                      </p>
                      <div className="event-modal__field-row">
                        <input
                          type="text"
                          placeholder="Username"
                          value={coHostForm.username}
                          onChange={e => setCoHostForm(f => ({ ...f, username: e.target.value }))}
                          required
                          className="event-modal__input"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={coHostForm.email}
                          onChange={e => setCoHostForm(f => ({ ...f, email: e.target.value }))}
                          required
                          className="event-modal__input"
                        />
                      </div>
                      <div className="event-modal__inline-actions">
                        <button
                          type="submit"
                          disabled={addCoHostMutation.isPending || !coHostForm.username.trim() || !coHostForm.email.trim()}
                          className="event-modal__btn-outline event-modal__btn-outline--accent"
                        >
                          {addCoHostMutation.isPending ? "Adding…" : "Add co-host"}
                        </button>
                        <button type="button" onClick={() => setShowAddCoHost(false)} className="event-modal__btn-ghost">
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

          <div
            className="event-modal__section event-modal__host-updates"
            style={{ "--section-accent": hostMessages.length > 0 ? dayColor : "#222" } as React.CSSProperties}
          >
            <div className="event-modal__section-label">Latest from host</div>
            {hostMessages.length > 0 ? (
              <div className="event-modal__host-messages">
                {hostMessages.map(msg => (
                  <div key={msg.id} className="event-modal__host-message" style={{ borderLeftColor: dayColor }}>
                    <div className="event-modal__host-message-body">{msg.body}</div>
                    <div className="event-modal__host-message-meta">
                      {msg.displayName || msg.username || "Host"} · {formatPacificDateTime(msg.createdAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="event-modal__host-updates-empty">
                No host updates yet. Check back closer to the event — organizers post timing changes, door info, and last-minute notes here.
              </p>
            )}
          </div>

          <div className="event-modal__actions">
            {event.ticketUrl && (
              <a href={event.ticketUrl} target="_blank" rel="noopener" className="btn-neon solid event-modal__action-btn">
                Get Tickets →
              </a>
            )}
            <div className="event-link-choice-anchor">
              <button
                type="button"
                data-testid="button-add-to-calendar"
                onClick={() => { setShowMapsPicker(false); setShowCalPicker(v => !v); }}
                className="btn-neon event-modal__action-btn"
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
              className="btn-neon event-modal__action-btn"
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
            <div className="event-modal__drawer event-modal__drawer--compose">
              <p className="event-modal__drawer-title">Message the host</p>
              <textarea
                value={hostMessage}
                onChange={e => setHostMessage(e.target.value)}
                rows={4}
                placeholder={`Ask about ${event.title}...`}
                className="event-modal__textarea"
              />
              <div className="event-modal__inline-actions">
                <button
                  type="button"
                  onClick={() => hostMutation.mutate(hostMessage)}
                  disabled={!hostMessage.trim() || hostMutation.isPending}
                  className="event-modal__btn-solid event-modal__btn-solid--cyan"
                >
                  {hostMutation.isPending ? "Sending…" : "Send"}
                </button>
                <button type="button" onClick={() => setHostDrawer("closed")} className="event-modal__btn-ghost">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {hostDrawer === "noHost" && (
            <div className="event-modal__drawer event-modal__drawer--alert">
              <p className="event-modal__drawer-title event-modal__drawer-title--alert">No host is attached to this event yet</p>
              <p className="event-modal__drawer-copy">
                This event hasn't been claimed by an organizer. You may find contact info at the link below.
              </p>
              {event.ticketUrl && (
                <a href={event.ticketUrl} target="_blank" rel="noopener" className="btn-neon solid event-modal__action-btn">
                  Visit Event Link →
                </a>
              )}
              <button type="button" onClick={() => setHostDrawer("closed")} className="event-modal__btn-ghost">
                Close
              </button>
            </div>
          )}

          <div className="event-modal__footer">
            {hasPendingClaim && (
              <span className="event-modal__footer-pending">Claim pending admin review</span>
            )}
            {!hasPendingClaim && event.isClaimable && (
              <button
                data-testid="button-claim-event"
                onClick={() => user ? claimEvent(event.id) : setShowAuth(true)}
                className="event-modal__footer-link event-modal__footer-link--cyan"
              >
                ↗ Request to claim this event
              </button>
            )}
            {modMode !== "remove" && (
              <button
                data-testid="button-remove-event"
                onClick={() => openModMode("remove")}
                className="event-modal__footer-link"
              >
                ↗ Request removal
              </button>
            )}
            {modMode !== "flag" && (
              <button
                data-testid="button-flag-event"
                onClick={() => openModMode("flag")}
                className="event-modal__footer-link event-modal__footer-link--orange"
              >
                ↗ Flag data error
              </button>
            )}
            {isHost && modMode !== "transfer" && (
              <button
                data-testid="button-transfer-event"
                onClick={() => openModMode("transfer")}
                className="event-modal__footer-link event-modal__footer-link--lime"
              >
                ↗ Transfer host
              </button>
            )}
          </div>

          {modMode && (
            <div
              data-testid="form-moderation"
              className="event-modal__mod-form"
              style={{ borderColor: modColor, "--mod-accent": modColor } as React.CSSProperties}
            >
              <p className="event-modal__mod-title">
                {modMode === "remove" && "Request removal"}
                {modMode === "flag" && "Flag a data error"}
                {modMode === "transfer" && "Transfer host to someone else"}
              </p>
              <p className="event-modal__mod-lede">
                {modMode === "remove" && "Tell us why this event should be removed. If you're the organizer or have a specific reason, explain below. An admin will review."}
                {modMode === "flag" && "Wrong time, venue, link, or description? Tell us what's off. Admins use this to fix the listing — not to remove it."}
                {modMode === "transfer" && "Release hosting to another verified organizer. Enter their username or email. An admin confirms the handoff."}
              </p>
              <form onSubmit={handleModSubmit}>
                {modMode !== "transfer" && (
                  <div className="event-modal__field-row">
                    <input
                      data-testid="input-mod-name"
                      type="text" placeholder="Your name" value={modForm.name}
                      onChange={e => setModForm(f => ({ ...f, name: e.target.value }))}
                      className="event-modal__input"
                    />
                    <input
                      data-testid="input-mod-email"
                      type="email" placeholder="Your email" value={modForm.email}
                      onChange={e => setModForm(f => ({ ...f, email: e.target.value }))}
                      className="event-modal__input"
                    />
                  </div>
                )}
                {modMode === "transfer" && (
                  <input
                    type="text"
                    placeholder="Optional note for admin"
                    value={modForm.name}
                    onChange={e => setModForm(f => ({ ...f, name: e.target.value }))}
                    className="event-modal__input event-modal__input--full"
                  />
                )}
                <textarea
                  data-testid="input-mod-proof"
                  placeholder={
                    modMode === "flag" ? "What's wrong with this listing?"
                    : modMode === "transfer" ? "New host username or email"
                    : "Reason for removal"
                  }
                  value={modForm.proof}
                  onChange={e => setModForm(f => ({ ...f, proof: e.target.value }))}
                  rows={3}
                  className="event-modal__textarea"
                />
                <div className="event-modal__inline-actions">
                  <button
                    type="submit"
                    data-testid="button-submit-mod"
                    disabled={modMutation.isPending || transferMutation.isPending}
                    className="event-modal__btn-outline event-modal__btn-outline--mod"
                  >
                    {(modMutation.isPending || transferMutation.isPending) ? "Submitting…" : "Submit request"}
                  </button>
                  <button type="button" onClick={() => setModMode(null)} className="event-modal__btn-ghost">
                    Cancel
                  </button>
                </div>
              </form>
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
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}