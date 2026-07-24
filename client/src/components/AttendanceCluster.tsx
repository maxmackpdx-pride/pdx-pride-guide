import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";
import AttendanceVibeModal, { type AttendanceVisibility } from "./AttendanceVibeModal";
import EventChatPanel from "./EventChatPanel";
import UserAvatar from "@/components/UserAvatar";
import { memberProfileHref } from "@/lib/avatarLinks";
import { spawnRsvpSparks } from "@/components/RsvpSparks";
import LiveWave from "@/components/LiveWave";
import { useAttendanceLive } from "@/hooks/useAttendanceLive";
import {
  ATTENDANCE_PHRASES,
  DEFAULT_ATTENDANCE_PHRASE_KEY,
  PAST_EVENT_ATTENDANCE_PHRASE_KEY,
  attendancePhraseLabel,
  resolveAttendancePhrase,
  type AttendancePhraseKey,
} from "@shared/attendancePhrases";

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
  isAnonymous?: boolean;
  expiresAt?: string | null;
}

interface ExtraPerson {
  userId: number;
  username?: string;
  displayName?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  roleChip: string;
  roleColor?: string;
}

export default function AttendanceCluster({
  eventId,
  embedded = false,
  extraPeople = [],
  liveSocket = true,
  pastEvent = false,
}: {
  eventId: number;
  embedded?: boolean;
  extraPeople?: ExtraPerson[];
  /** Open attendance websocket for live updates (disable on dense board cards). */
  liveSocket?: boolean;
  /** Past events: one-tap "I was here" for profile, no RSVP chat or invites. */
  pastEvent?: boolean;
}) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedPhraseKey, setSelectedPhraseKey] = useState<AttendancePhraseKey>(DEFAULT_ATTENDANCE_PHRASE_KEY);
  const [visibility, setVisibility] = useState<AttendanceVisibility>("visible");
  const [showChat, setShowChat] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Attendee | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useAttendanceLive(eventId, liveSocket && !pastEvent);

  const { data: attendees = [] } = useQuery<Attendee[]>({
    queryKey: ["/api/events", eventId, "attendance"],
    queryFn: () => apiRequest("GET", `/api/events/${eventId}/attendance`).then(r => r.json()),
    refetchInterval: 120_000,
  });

  const mutation = useMutation({
    mutationFn: (data: { message: string; isAnonymous: boolean }) =>
      apiRequest("POST", `/api/events/${eventId}/attendance`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/attendance-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/mine/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setShowForm(false);
      if (!pastEvent) {
        setShowChat(true);
        if (variables.isAnonymous) setVisibility("anonymous");
        else setVisibility("visible");
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/events/${eventId}/attendance`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/attendance-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/mine/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const messageMutation = useMutation({
    mutationFn: ({ attendanceId, body }: { attendanceId: number; body: string }) =>
      apiRequest("POST", `/api/events/${eventId}/attendance/${attendanceId}/message`, { body }),
    onSuccess: () => {
      setMessageTarget(null);
      setMessageBody("");
    },
  });


  const myAttendance = attendees.find(a => a.userId === user?.id);
  const myPhrase = myAttendance ? resolveAttendancePhrase(myAttendance.message) : null;

  const submitVibe = (btnEl?: HTMLElement | null) => {
    const wasGoing = Boolean(myAttendance);
    if (!wasGoing && btnEl && !pastEvent) spawnRsvpSparks(btnEl);
    mutation.mutate({
      message: pastEvent
        ? attendancePhraseLabel(PAST_EVENT_ATTENDANCE_PHRASE_KEY)
        : attendancePhraseLabel(selectedPhraseKey),
      isAnonymous: pastEvent ? false : visibility === "anonymous",
    });
  };

  const markWasHere = (btnEl?: HTMLElement | null) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (myAttendance) return;
    submitVibe(btnEl);
  };

  useEffect(() => {
    if (!showForm || !myAttendance) return;
    setSelectedPhraseKey(resolveAttendancePhrase(myAttendance.message).key);
    setVisibility(myAttendance.isAnonymous ? "anonymous" : "visible");
  }, [showForm, myAttendance]);

  // ?chat=1 deep link (Inbox GROUP row / group-chat push): auto-open the
  // event chat once for the modal instance, then strip the param.
  const autoChatRan = useRef(false);
  useEffect(() => {
    if (!embedded || autoChatRan.current || !myAttendance) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("chat") !== "1") return;
    autoChatRan.current = true;
    setShowChat(true);
    params.delete("chat");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [embedded, myAttendance]);

  const phrasePicker = (
    <div className="attendance-phrase-list">
      {ATTENDANCE_PHRASES.map(phrase => (
        <button
          key={phrase.key}
          type="button"
          data-testid={`option-${phrase.key}`}
          className={`attendance-phrase-option${selectedPhraseKey === phrase.key ? " attendance-phrase-option--active" : ""}`}
          onClick={() => setSelectedPhraseKey(phrase.key)}
          style={{ "--phrase-color": phrase.color } as CSSProperties}
        >
          <span className="attendance-phrase-option__dot" aria-hidden="true" />
          <span>{phrase.label}</span>
        </button>
      ))}
    </div>
  );

  // Merged grid: extraPeople (hosts/talent) first, then attendees
  const gridPeople: Array<{
    key: string;
    userId?: number;
    handle: string;
    displayName?: string | null;
    photoUrl?: string | null;
    avatarChoice?: number;
    avatarRing?: string | null;
    masked?: boolean;
    chip?: string;
    chipColor?: string;
    subText?: string;
    attendeeRef?: Attendee;
  }> = [
    ...extraPeople.map(p => ({
      key: `extra-${p.userId}`,
      userId: p.userId,
      handle: p.username || p.displayName || String(p.userId),
      displayName: p.displayName,
      photoUrl: p.photoUrl,
      avatarChoice: p.avatarChoice,
      avatarRing: p.avatarRing,
      chip: p.roleChip,
      chipColor: p.roleColor,
    })),
    ...attendees
      .filter(a => !extraPeople.some(p => p.userId === a.userId))
      .map(a => {
        const phrase = resolveAttendancePhrase(a.message);
        return {
          key: `att-${a.id}`,
          userId: a.userId,
          handle: a.handle,
          displayName: a.displayName,
          photoUrl: a.userPhotoUrl || a.photoUrl,
          avatarChoice: a.avatarChoice,
          avatarRing: a.avatarRing,
          masked: a.masked,
          subText: `"${phrase.label}"`,
          attendeeRef: a,
        };
      }),
  ];

  return (
    <div className={`attendance-cluster-panel${embedded ? " attendance-cluster--embedded" : ""}`}>
      <div className="attendance-cluster-head">
        <div className="attendance-cluster-head__title">
          <h3 className="display attendance-cluster-headline">
            {pastEvent ? (
              <>
                <span>Who was</span> <span className="attendance-cluster-headline__accent">there</span>
              </>
            ) : (
              <>
                <span>I'll be</span> <span className="attendance-cluster-headline__accent">there</span>
              </>
            )}
          </h3>
          <span className={`attendance-going-pill${prefersReducedMotion() || pastEvent ? "" : " attendance-badge-pulse"}`}>
            <span className="attendance-going-pill__dot" aria-hidden="true" />
            {attendees.length} {pastEvent ? "WERE THERE" : "GOING"}
            {!pastEvent && <LiveWave />}
          </span>
        </div>
      </div>

      {!showForm && (
        <div className="attendance-cluster-cta">
          {pastEvent ? (
            <>
              {!myAttendance && (
                <button
                  data-testid="button-i-was-here"
                  type="button"
                  onClick={e => markWasHere(e.currentTarget)}
                  disabled={mutation.isPending}
                  className="display attendance-cluster-cta__btn"
                >
                  {mutation.isPending ? "Saving…" : "I was here →"}
                </button>
              )}
              {myAttendance && (
                <>
                  <span className="attendance-cluster-cta__status">
                    ✓ On your profile
                  </span>
                  <button
                    type="button"
                    data-testid="button-remove-was-here"
                    onClick={() => removeMutation.mutate()}
                    disabled={removeMutation.isPending}
                    className="attendance-cluster-cta__withdraw"
                  >
                    {removeMutation.isPending ? "Removing…" : "Remove from profile"}
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button
                data-testid="button-ill-be-there"
                onClick={() => user ? setShowForm(true) : setShowAuth(true)}
                className="display attendance-cluster-cta__btn"
              >
                {myAttendance ? "Change phrase →" : "I'll be there →"}
              </button>
              {myAttendance && myPhrase && (
                <span className="attendance-cluster-cta__status">
                  ✓ You're going as "{myPhrase.label}"
                </span>
              )}
              {myAttendance && (
                <>
                  <button
                    type="button"
                    data-testid="button-open-event-chat"
                    onClick={() => setShowChat(true)}
                    className="attendance-cluster-cta__chat"
                  >
                    Open event chat →
                  </button>
                  <button
                    type="button"
                    data-testid="button-withdraw-rsvp"
                    onClick={() => {
                      setShowChat(false);
                      removeMutation.mutate();
                    }}
                    disabled={removeMutation.isPending}
                    className="attendance-cluster-cta__withdraw"
                  >
                    {removeMutation.isPending ? "Removing…" : "Withdraw RSVP"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Avatar grid - hosts, talent, and attendees */}
      {gridPeople.length > 0 && (
        <div className="attendance-avatar-grid">
          {gridPeople.map(p => {
            const isSelf = !!user && p.userId === user?.id;
            const canMessage = !pastEvent && user && myAttendance && p.userId && p.userId !== user.id && !p.masked;
            const profileHref = !p.masked ? memberProfileHref(p.handle) : null;
            return (
              <div
                key={p.key}
                className="attendance-avatar-cell"
                onClick={() => {
                  if (canMessage && p.attendeeRef) setMessageTarget(p.attendeeRef);
                }}
                style={{ cursor: canMessage || profileHref ? "pointer" : "default" }}
                data-testid={`grid-attendee-${p.key}`}
              >
                <div style={{ position: "relative", display: "inline-block" }}>
                  <UserAvatar
                    photoUrl={p.photoUrl}
                    avatarChoice={p.avatarChoice}
                    avatarRing={p.avatarRing}
                    displayName={p.masked ? undefined : (p.displayName || p.handle)}
                    username={p.masked ? undefined : p.handle}
                    href={profileHref}
                    onClick={e => e.stopPropagation()}
                    size={52}
                  />
                  {isSelf && (
                    <span data-testid="self-marker" style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#CCFF00", border: "2px solid #0d0d0d", zIndex: 5 }} />
                  )}
                </div>
                {!p.masked && (
                  <span className="attendance-avatar-cell__name">
                    @{p.handle}
                  </span>
                )}
                {p.chip && (
                  <span className="attendance-avatar-cell__chip" style={{ color: p.chipColor || "#fff", borderColor: p.chipColor || "#fff" }}>
                    {p.chip}
                  </span>
                )}
                {p.subText && !p.chip && (
                  <span className="attendance-avatar-cell__sub">{p.subText}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {attendees.length === 0 && extraPeople.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-faint)" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>
            {pastEvent ? "BE THE FIRST TO SAY YOU WERE THERE" : "BE THE FIRST TO SAY YOU'LL BE THERE"}
          </p>
        </div>
      )}

      {!pastEvent && (
      <AttendanceVibeModal
        open={showForm}
        isMobile={isMobile}
        isPending={mutation.isPending}
        hasAttendance={!!myAttendance}
        title="Say something"
        visibility={visibility}
        onVisibilityChange={setVisibility}
        onClose={() => setShowForm(false)}
        onSubmit={submitVibe}
        onRemove={() => {
          setShowChat(false);
          removeMutation.mutate();
        }}
      >
        {phrasePicker}
      </AttendanceVibeModal>
      )}
      {!pastEvent && showChat && myAttendance && (
        <EventChatPanel eventId={eventId} onClose={() => setShowChat(false)} />
      )}
      {!pastEvent && messageTarget && (
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
                "{resolveAttendancePhrase(messageTarget.message).label}". See you there?
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
