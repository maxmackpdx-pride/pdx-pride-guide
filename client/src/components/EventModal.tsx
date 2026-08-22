import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import UsernameAutocomplete from "@/components/UsernameAutocomplete";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useModalA11y } from "@/hooks/useModalA11y";
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
import { eventPath } from "@shared/eventSlug";
import { shareEventLink, shareToastTitle } from "@/lib/shareEvent";
import { timeAgo } from "@/lib/boardFeed";
import { Lock, Pencil, Share2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardEventEditForm } from "@/components/dashboard/DashboardEventEditor";
import {
  editFormToApiPayload,
  eventToEditForm,
  userCanEditEvent,
  type EventEditFormState,
} from "@/lib/eventEditForm";
import { admissionEventLinkLabel } from "@shared/admission";
import { resolveVenueWebsite } from "@shared/venueLinks";
import { getEventScheduleTiming } from "@shared/missedConnections";
import type { EventTalentRow } from "@shared/eventTalent";

type EventHostProfile = {
  userId: number;
  username?: string;
  displayName?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  role: string;
};

import { DAY_TEXT_COLORS } from "@shared/eventWeek";

type ModerationMode = null | "remove" | "flag" | "transfer";



const modAccent: Record<Exclude<ModerationMode, null>, string> = {
  remove: "var(--text-lo)",
  flag: "var(--neon-orange)",
  transfer: "var(--neon-yellow)",
};

/** True when updatedAt is meaningfully after createdAt (edits / re-syncs). */
function hasMeaningfulUpdate(createdAt?: string | null, updatedAt?: string | null): boolean {
  if (!createdAt || !updatedAt) return false;
  const c = Date.parse(createdAt);
  const u = Date.parse(updatedAt);
  if (!Number.isFinite(c) || !Number.isFinite(u)) return false;
  return u - c > 5 * 60_000;
}

/** "Updated 2h ago" for recent, "Updated Jul 12" when older than ~2 days. */
function formatUpdatedTrustLine(iso: string): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  if (diff < 48 * 60 * 60_000) {
    const rel = timeAgo(iso);
    return rel ? `Updated ${rel}` : "";
  }
  const d = new Date(iso);
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Updated ${label}`;
}

/** url_ingest / trusted:* / qsearch* sources are scrape or connector provenance. */
function isIngestSource(source?: string | null): boolean {
  if (!source) return false;
  const s = source.toLowerCase();
  return (
    s === "url_ingest" ||
    s.startsWith("trusted:") ||
    s.startsWith("qsearch") ||
    s.includes("ingest")
  );
}

export default function EventModal({
  event,
  onClose,
  onEventUpdated,
}: {
  event: Event;
  onClose: () => void;
  onEventUpdated?: (event: Event) => void;
}) {
  if (!event || typeof event.id !== "number") return null;
  return <EventModalInner event={event} onClose={onClose} onEventUpdated={onEventUpdated} />;
}

function EventModalInner({
  event,
  onClose,
  onEventUpdated,
}: {
  event: Event;
  onClose: () => void;
  onEventUpdated?: (event: Event) => void;
}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const claimEvent = (eventId: number) => setLocation(`/submit/claim/${eventId}`);
  const [modMode, setModMode] = useState<ModerationMode>(null);
  const [modForm, setModForm] = useState({ name: "", email: "", proof: "" });
  const [showAuth, setShowAuth] = useState(false);
  const [hostDrawer, setHostDrawer] = useState<"closed" | "compose" | "noHost">("closed");
  const [hostMessage, setHostMessage] = useState("");
  const [noContactUrl, setNoContactUrl] = useState<string | null>(null);
  const [coHostUsername, setCoHostUsername] = useState("");
  const [showAddCoHost, setShowAddCoHost] = useState(false);
  const [showCalPicker, setShowCalPicker] = useState(false);
  const [showMapsPicker, setShowMapsPicker] = useState(false);
  const [socialTab, setSocialTab] = useState<"attendance" | "missed">("attendance");
  const [editing, setEditing] = useState(false);
  const [eventForm, setEventForm] = useState<EventEditFormState | null>(null);
  const [editHostUpdate, setEditHostUpdate] = useState("");
  const [invitePast, setInvitePast] = useState(true);
  const [inviteFollowers, setInviteFollowers] = useState(true);
  const [inviteNote, setInviteNote] = useState("");
  const socialTabsRef = useRef<HTMLDivElement>(null);
  const handleClose = useCallback(() => onClose(), [onClose]);
  const dialogRef = useModalA11y({ onClose: handleClose });

  useEffect(() => {
    setEditing(false);
    setEventForm(null);
    setEditHostUpdate("");
    setInvitePast(true);
    setInviteFollowers(true);
    setInviteNote("");
  }, [event.id]);

  const jumpToAttendance = () => {
    setSocialTab("attendance");
    requestAnimationFrame(() => {
      socialTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const { data: eventHosts = [], refetch: refetchHosts } = useQuery<EventHostProfile[]>({
    queryKey: ["/api/events", event.id, "hosts"],
    queryFn: () => fetch(`/api/events/${event.id}/hosts`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: talentRows = [] } = useQuery<EventTalentRow[]>({
    queryKey: ["/api/events", event.id, "talent"],
    queryFn: () => fetch(`/api/events/${event.id}/talent`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const eventTiming = getEventScheduleTiming(event.dateStart, event.dateEnd);
  const isPastEvent = eventTiming === "past";
  const posterUrl = resolveEventPosterUrl(event.id, event.posterImageUrl, event.dayOfWeek);
  const dayColor = DAY_TEXT_COLORS[event.dayOfWeek as keyof typeof DAY_TEXT_COLORS] || "var(--text-hi)";
  // Border + glow accent: the day color, or a neutral neon for events with no
  // weekday (so they don't get a stark white frame).
  const accentColor = DAY_TEXT_COLORS[event.dayOfWeek as keyof typeof DAY_TEXT_COLORS] || "#19E3FF";

  const extraPeople = [
    ...eventHosts.map(h => ({
      userId: h.userId,
      username: h.username,
      displayName: h.displayName,
      photoUrl: h.photoUrl,
      avatarChoice: h.avatarChoice,
      avatarRing: h.avatarRing,
      roleChip: h.role || "HOST",
      roleColor: dayColor,
    })),
    ...talentRows
      .filter(t => t.status === "LIVE")
      .filter(t => !eventHosts.some(h => h.userId === t.userId))
      .map(t => ({
        userId: t.userId,
        username: t.username,
        displayName: t.displayName,
        photoUrl: t.photoUrl,
        avatarChoice: t.avatarChoice,
        avatarRing: t.avatarRing,
        roleChip: t.role,
        roleColor: "var(--flag-orange)",
      })),
  ];

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
        const err = new Error(payload.error || "Could not send message") as Error & {
          code?: string;
          ticketUrl?: string | null;
          venueWebsite?: string | null;
        };
        err.code = payload.error;
        err.ticketUrl = payload.ticketUrl;
        err.venueWebsite = payload.venueWebsite;
        throw err;
      }
      return payload as { recipientType?: "host" | "venue_owner"; venueName?: string | null };
    },
    onSuccess: (data) => {
      const isVenueOwner = data?.recipientType === "venue_owner";
      toast({
        title: "Message sent",
        description: isVenueOwner
          ? `The venue owner${data.venueName ? ` at ${data.venueName}` : ""} can reply in your inbox.`
          : "The host can reply in your inbox.",
      });
      setHostMessage("");
      setHostDrawer("closed");
      setNoContactUrl(null);
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
    onError: (err: Error & { code?: string; ticketUrl?: string | null; venueWebsite?: string | null }) => {
      if (err.code === "NO_CONTACT" || err.code === "NO_HOST") {
        const fallbackUrl =
          err.ticketUrl
          || err.venueWebsite
          || event.ticketUrl
          || (event as Event & { venueWebsite?: string | null }).venueWebsite
          || resolveVenueWebsite(event.venueName)
          || null;
        setNoContactUrl(fallbackUrl);
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

  const hostUserIds = eventHosts.map(h => h.userId);
  const isHost = Boolean(user && hostUserIds.includes(user.id));
  const canEditEvent = userCanEditEvent(event, user, hostUserIds);
  const canAddCoHost = isHost && eventHosts.length < 3 && !isPastEvent;

  const editEventMutation = useMutation({
    mutationFn: async (data: EventEditFormState) => {
      // Admins use the admin endpoint (full field access); hosts use the host edit route.
      const path = user?.isAdmin
        ? `/api/admin/events/${event.id}`
        : `/api/events/${event.id}/edit`;
      const res = await fetch(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editFormToApiPayload(data)),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Save failed");
      return payload as Event;
    },
    onSuccess: (updated) => {
      toast({ title: "Event updated", description: "Your changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/mine/claimed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      onEventUpdated?.(updated);
      setEditing(false);
      setEventForm(null);
    },
    onError: (err: Error) => {
      toast({ title: "Could not save event", description: err.message, variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Delete failed");
      return payload as { ok: boolean; id: number; status: string };
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "Hidden from the public site. Restore anytime in Admin → Events.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/mine/claimed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setEditing(false);
      setEventForm(null);
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Could not delete event", description: err.message, variant: "destructive" });
    },
  });

  const startEditing = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setEventForm(eventToEditForm(event));
    setEditing(true);
  };

  const handleAdminDelete = () => {
    if (!user?.isAdmin) return;
    const ok = window.confirm(
      `Delete “${event.title}”?\n\nThis hides it from the public site (status → HIDDEN). You can restore it from Admin → Events.`,
    );
    if (!ok) return;
    deleteEventMutation.mutate();
  };

  const hostUpdateMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/events/${event.id}/host-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not post update");
      return payload as { notified?: number };
    },
    onSuccess: (data) => {
      const n = data?.notified ?? 0;
      toast({
        title: "Host update posted",
        description: n > 0
          ? `Visible on the event page. ${n} attendee${n === 1 ? "" : "s"} notified.`
          : "Visible on the event detail page.",
      });
      setEditHostUpdate("");
      queryClient.invalidateQueries({ queryKey: ["/api/events", event.id, "host-messages"] });
    },
    onError: (err: Error) => {
      toast({ title: "Could not post update", description: err.message, variant: "destructive" });
    },
  });

  const { data: invitePreview } = useQuery<{ pastAttendees: number; followers: number; total: number }>({
    queryKey: ["/api/events", event.id, "invite-audience"],
    queryFn: async () => {
      const r = await fetch(`/api/events/${event.id}/invite-audience`, { credentials: "include" });
      if (!r.ok) throw new Error("Could not load invite audience");
      return r.json();
    },
    enabled: Boolean(user && canEditEvent && !isPastEvent),
    staleTime: 30_000,
  });

  const inviteAudienceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${event.id}/invite-audience`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          includePastAttendees: invitePast,
          includeFollowers: inviteFollowers,
          message: inviteNote.trim() || undefined,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not send invites");
      return payload as { sent: number; pastAttendees: number; followers: number; skipped: number };
    },
    onSuccess: (data) => {
      toast({
        title: data.sent > 0 ? "Invites sent" : "No one new to invite",
        description: data.sent > 0
          ? `${data.sent} people got an inbox invite to open this event.`
          : "Everyone eligible already RSVP'd or your lists are empty.",
      });
      setInviteNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/events", event.id, "invite-audience"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
    },
    onError: (err: Error) => {
      toast({ title: "Could not send invites", description: err.message, variant: "destructive" });
    },
  });

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
      setCoHostUsername("");
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

  const modColor = modMode ? modAccent[modMode] : "var(--text-lo)";

  const eventSocialRoom = (
    <div className="event-modal__social-room">
      <div
        ref={socialTabsRef}
        className="event-modal__tabs"
        role="tablist"
        aria-label="Event social"
      >
        <button
          type="button"
          role="tab"
          aria-selected={socialTab === "attendance"}
          className={`event-modal__tab${socialTab === "attendance" ? " active" : ""}`}
          onClick={() => setSocialTab("attendance")}
        >
          {isPastEvent ? "Who Was There" : "I'll Be There"}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={socialTab === "missed"}
          className={`event-modal__tab${socialTab === "missed" ? " active" : ""}`}
          onClick={() => setSocialTab("missed")}
        >
          MIZZED CONNECTION
        </button>
      </div>

      <section
        className="event-modal__tab-panel"
        role="tabpanel"
        data-testid={socialTab === "attendance" ? "event-modal-attendance" : "event-modal-missed"}
      >
        {socialTab === "attendance" ? (
          <AttendanceCluster eventId={event.id} embedded extraPeople={extraPeople} pastEvent={isPastEvent} />
        ) : eventTiming === "upcoming" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 20px", color: "var(--text-faint)", textAlign: "center" }}>
            <Lock size={28} style={{ opacity: 0.5 }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", margin: 0 }}>
              Missed connections unlock when this event starts
            </p>
          </div>
        ) : (
          <MissedConnectionsPanel mode="event" eventId={event.id} compact />
        )}
      </section>
    </div>
  );

  return createPortal(
    <div className="event-modal-overlay" onClick={handleClose}>
      <div
        ref={dialogRef}
        className="event-modal"
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        data-testid="event-modal"
        style={{
          "--event-accent": accentColor,
          "--c": accentColor,
        } as React.CSSProperties}
      >
        {/* Shared animated rainbow top seam (§6: pdx-rainbow-rule, not a second engine) */}
        <div className="event-modal__bar pdx-rainbow-rule" aria-hidden="true" />
        {/* Deep-glass corner sheen (tokens: --glass-sheen / --glass-sheen-specular) */}
        <span className="event-modal__sheen pdx-glass-sheen" aria-hidden="true" />
        <span className="event-modal__sheen event-modal__sheen--specular pdx-glass-sheen--specular" aria-hidden="true" />

        <button type="button" className="event-modal__close" onClick={onClose} aria-label="Close event">✕</button>
        <button
          type="button"
          className="event-modal__close event-modal__share"
          aria-label="Share this event"
          title="Share this event"
          onClick={async () => {
            try {
              const result = await shareEventLink(eventPath(event.id, event.title, event.dayOfWeek), event.title);
              toast({ title: shareToastTitle(result, "event") });
            } catch (err) {
              if ((err as DOMException)?.name !== "AbortError") {
                toast({ title: "Could not share event", variant: "destructive" });
              }
            }
          }}
        >
          <Share2 size={18} strokeWidth={2.3} aria-hidden />
        </button>

        <div className="event-modal__scroll">
        <div className="event-modal__poster pdx-poster-well">
          <img src={posterUrl} alt={event.title} className="event-modal__poster-img" />
          <span className="pdx-poster-well__scan" aria-hidden="true" />
        </div>

        <div className="event-modal__body">
          {/\bsold\s*out\b/i.test(`${event.title} ${event.description || ""}`) && (
            <div className="event-sold-out-badge event-sold-out-badge--modal" role="status">SOLD OUT</div>
          )}
          <h2 className="display event-modal__title">
            {event.title.replace(/^\s*SOLD\s*OUT\s*[·\-:|]*\s*/i, "").trim() || event.title}
          </h2>

          {editing && eventForm ? (
            <DashboardEventEditForm
              embedded
              showExtras={false}
              editingEvent={event}
              eventForm={eventForm}
              setEventForm={(fn) => setEventForm((prev) => (prev ? fn(prev) : prev))}
              hostUpdate={editHostUpdate}
              setHostUpdate={setEditHostUpdate}
              onCancel={() => { setEditing(false); setEventForm(null); }}
              onSave={() => editEventMutation.mutate(eventForm)}
              onPostUpdate={() => editHostUpdate.trim() && hostUpdateMutation.mutate(editHostUpdate.trim())}
              onDelete={user?.isAdmin ? handleAdminDelete : undefined}
              saving={editEventMutation.isPending}
              posting={hostUpdateMutation.isPending}
              deleting={deleteEventMutation.isPending}
            />
          ) : (
          <>
          <div className="event-modal__meta" style={{ borderLeftColor: dayColor }}>
            <div className="event-modal__datetime">
              {startTime} – {endTime}
            </div>
            <div className="event-modal__venue">
              {(() => {
                const venueHref =
                  (event as any).venueWebsite
                  || resolveVenueWebsite(event.venueName)
                  || null;
                const label = `${event.venueName || "Venue"}${event.neighborhood ? ` · ${event.neighborhood}` : ""}`;
                return venueHref ? (
                  <a
                    href={venueHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-modal__venue-link"
                    data-testid="link-venue-website"
                  >
                    {label} ↗
                  </a>
                ) : (
                  label
                );
              })()}
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
            {(() => {
              const createdAt = event.createdAt || "";
              const updatedAt = (event as Event & { updatedAt?: string }).updatedAt || "";
              const lines: string[] = [];
              if (hasMeaningfulUpdate(createdAt, updatedAt)) {
                const updatedLine = formatUpdatedTrustLine(updatedAt);
                if (updatedLine) lines.push(updatedLine);
              }
              // Scrape / connector provenance. No dedicated last_seen column on events
              // (housing has lastSeenAt). Prefer "First listed" from createdAt.
              if (isIngestSource(event.source) && createdAt) {
                const first = timeAgo(createdAt);
                if (first) lines.push(`First listed ${first}`);
              }
              if (lines.length === 0) return null;
              return (
                <div className="event-modal__trust" data-testid="event-modal-trust">
                  {lines.map((line) => (
                    <div key={line} className="event-modal__trust-line">{line}</div>
                  ))}
                </div>
              );
            })()}
          </div>

          {eventSocialRoom}

          {/* Flags = day + policy chips; Tags = JSON types - open-event SoT */}
          {(() => {
            const flagsRow = (
              <EventTagsRow
                event={event}
                size="md"
                showFlags
                showJsonTypes={false}
                onClaimClick={() => (user ? claimEvent(event.id) : setShowAuth(true))}
                className="event-modal__tags"
              />
            );
            // Always show Flags when day or policy tags exist (row nulls if empty)
            if (!event.dayOfWeek && !event.admission && !event.ageRequirement && !event.isHouseParty && !event.isSexPositive && !event.nudityOk && !event.isClaimable) {
              return null;
            }
            return (
              <div className="event-modal__block">
                <div className="event-modal__kicker">Flags</div>
                {flagsRow}
              </div>
            );
          })()}

          {(() => {
            let types: string[] = [];
            try {
              const parsed = JSON.parse(event.eventTypes || "[]");
              types = Array.isArray(parsed) ? parsed.map(String) : [];
            } catch {
              types = [];
            }
            if (types.length === 0) return null;
            return (
              <div className="event-modal__block">
                <div className="event-modal__kicker">Tags</div>
                <EventTagsRow
                  event={event}
                  size="md"
                  showFlags={false}
                  showJsonTypes
                  showClaim={false}
                  className="event-modal__tags event-modal__tags--types"
                />
              </div>
            );
          })()}

          {event.description && (
            <div className="event-modal__block">
              <div className="event-modal__kicker">About</div>
              <p className="event-modal__description">{event.description}</p>
            </div>
          )}

          {event.ticketUrl && !isPastEvent && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="event-modal__tickets-mid pdx-glass-btn pdx-glass-btn--solid"
              data-testid="button-event-tickets-mid"
            >
              {admissionEventLinkLabel(event.admission)}
            </a>
          )}

          {eventHosts.length > 0 && (
            <div className="event-modal__section event-modal__glass-panel event-hosts-panel" style={{ "--section-accent": dayColor } as React.CSSProperties}>
              <div className="event-modal__section-label event-hosts-label">
                {eventHosts.length === 1 ? "Host" : "Hosts"}
              </div>
              <div className="event-hosts-row">
                {eventHosts.map(host => {
                  const hostHref = host.username
                    ? `/u/${encodeURIComponent(host.username)}`
                    : null;
                  const inner = (
                    <>
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
                    </>
                  );
                  if (hostHref) {
                    return (
                      <Link
                        key={host.userId}
                        href={hostHref}
                        className="event-host-card event-host-card--link"
                        aria-label={`View profile of ${host.displayName || host.username}`}
                      >
                        {inner}
                      </Link>
                    );
                  }
                  return (
                    <div key={host.userId} className="event-host-card">
                      {inner}
                    </div>
                  );
                })}
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
                        addCoHostMutation.mutate({ username: coHostUsername, email: "" });
                      }}
                    >
                      <p className="event-modal__cohost-hint">
                        Add a co-host by their @username (max 3 hosts).
                      </p>
                      <div className="event-modal__field-row">
                        <UsernameAutocomplete
                          value={coHostUsername}
                          onChange={setCoHostUsername}
                          style={{ flex: 1 }}
                          inputStyle={{ width: "100%", padding: "8px 10px", background: "var(--ink-900)", border: "1px solid var(--ink-border-strong)", color: "var(--text-hi)", fontSize: "0.82rem" }}
                        />
                      </div>
                      <div className="event-modal__inline-actions">
                        <button
                          type="submit"
                          disabled={addCoHostMutation.isPending || !coHostUsername.trim()}
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
            mode={!isPastEvent && (isHost || user?.isAdmin) ? "manage" : "view"}
            isClaimable={event.isClaimable}
            hideSelfTag={isPastEvent}
          />

          {canEditEvent && !isPastEvent && (
            <div
              className="event-modal__section"
              style={{ "--section-accent": dayColor } as React.CSSProperties}
            >
              <div className="event-modal__section-label">Invite your scene</div>
              <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: "var(--text-lo)", lineHeight: 1.45 }}>
                Inbox invite for people who&apos;ve attended your past events and everyone who follows you.
                They get a message with a button to open this event card and RSVP.
              </p>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: "0.85rem", color: "var(--text-hi)", cursor: "pointer" }}>
                <input type="checkbox" checked={invitePast} onChange={e => setInvitePast(e.target.checked)} />
                Past attendees of your events
                {invitePreview != null && (
                  <span style={{ color: "var(--text-faint)", fontSize: "0.78rem" }}>({invitePreview.pastAttendees})</span>
                )}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: "0.85rem", color: "var(--text-hi)", cursor: "pointer" }}>
                <input type="checkbox" checked={inviteFollowers} onChange={e => setInviteFollowers(e.target.checked)} />
                Your followers
                {invitePreview != null && (
                  <span style={{ color: "var(--text-faint)", fontSize: "0.78rem" }}>({invitePreview.followers})</span>
                )}
              </label>
              <textarea
                value={inviteNote}
                onChange={e => setInviteNote(e.target.value)}
                maxLength={800}
                rows={2}
                placeholder="Optional note (door time, vibe, ticket link…)"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  marginBottom: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #2b2b2b",
                  background: "#151518",
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.9rem",
                  resize: "vertical",
                }}
              />
              <button
                type="button"
                className="event-modal__btn-outline event-modal__btn-outline--accent"
                disabled={inviteAudienceMutation.isPending || (!invitePast && !inviteFollowers)}
                onClick={() => inviteAudienceMutation.mutate()}
              >
                {inviteAudienceMutation.isPending
                  ? "Sending…"
                  : `Send invites${invitePreview != null ? ` (~${invitePreview.total})` : ""} →`}
              </button>
            </div>
          )}

          <div
            className="event-modal__section event-modal__glass-panel event-modal__host-updates"
            style={{ "--section-accent": hostMessages.length > 0 ? dayColor : "var(--ink-border)" } as React.CSSProperties}
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
                No host updates yet. Check back closer to the event. Organizers post timing changes, door info, and last-minute notes here.
              </p>
            )}
          </div>

          <div className="event-modal__actions">
            {canEditEvent && (
              <button
                type="button"
                data-testid="button-edit-event"
                onClick={startEditing}
                className="pdx-glass-btn pdx-glass-btn--outline event-modal__action-btn event-modal__action-btn--edit"
              >
                <Pencil size={16} aria-hidden="true" />
                Edit event
              </button>
            )}
            {!isPastEvent && (
              <div className="event-link-choice-anchor">
                <button
                  type="button"
                  data-testid="button-add-to-calendar"
                  onClick={() => { setShowMapsPicker(false); setShowCalPicker(v => !v); }}
                  className="pdx-glass-btn pdx-glass-btn--outline event-modal__action-btn"
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
            )}
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  setShowAuth(true);
                  return;
                }
                setNoContactUrl(null);
                setHostDrawer("compose");
              }}
              className="pdx-glass-btn pdx-glass-btn--outline event-modal__action-btn"
            >
              Message the Host
            </button>
          </div>

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
                  className="pdx-glass-btn pdx-glass-btn--solid event-modal__btn-solid pdx-glass-rebind"
                  style={{ "--c": "var(--neon-cyan, #19e3ff)" } as React.CSSProperties}
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
              <p className="event-modal__drawer-title event-modal__drawer-title--alert">No one to message here yet</p>
              <p className="event-modal__drawer-copy">
                No organizer has claimed this event, and we don&apos;t have a venue owner on file for{" "}
                {event.venueName || "this listing"}. For the latest info, check the event website.
              </p>
              {noContactUrl ? (
                <a href={noContactUrl} target="_blank" rel="noopener" className="pdx-glass-btn event-modal__action-btn">
                  Visit event website →
                </a>
              ) : (
                <p className="event-modal__drawer-copy" style={{ marginTop: 0 }}>
                  We couldn&apos;t find an event link for this one yet. Try the venue&apos;s site or socials directly.
                </p>
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
                {modMode === "flag" && "Wrong time, venue, link, or description? Tell us what's off. Admins use this to fix the listing, not to remove it."}
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
                This event has not been claimed by its organizer. Details were sourced from public listings. Please confirm time, venue, and ticketing directly before attending.
                {hasPendingClaim ? " A claim is pending admin review." : ""}
              </p>
            </div>
          )}
          </>
          )}
        </div>
        </div>

        {!editing && (
          <div className="event-modal__sticky-cta" data-testid="event-modal-sticky-cta">
            {event.ticketUrl ? (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener"
                className="pdx-glass-btn pdx-glass-btn--solid event-modal__action-btn event-modal__sticky-cta-btn event-modal__cta--primary"
                data-testid="button-event-tickets-sticky"
              >
                {admissionEventLinkLabel(event.admission)} →
              </a>
            ) : null}
            <button
              type="button"
              className="pdx-glass-btn pdx-glass-btn--outline event-modal__action-btn event-modal__sticky-cta-btn event-modal__cta--secondary"
              data-testid="button-ill-be-there-sticky"
              onClick={jumpToAttendance}
            >
              {isPastEvent ? "I Was Here" : "I'll Be There"}
            </button>
          </div>
        )}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>,
    document.body,
  );
}
