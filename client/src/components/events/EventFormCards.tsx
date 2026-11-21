import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FAMILY_LOGOS, type CardLogo } from "@/components/cards/cardLogo";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AuthModal from "@/components/AuthModal";
import { FormCard, type FormCardField, type FormCardValues } from "@/components/cards/FormCard";

/**
 * The open event card's forms (Tucker, t311u), all on the shared FormCard and
 * all on endpoints the site already uses (no new API):
 *  claim   -> POST /api/submit {type:"CLAIM"}           (Submit.tsx claim flow)
 *  mizz    -> POST /api/missed-connections              (MissedConnectionsPanel)
 *  gig     -> POST /api/gigs (event-linked, hosts only) (PrideWork GigComposer)
 *  message -> POST /api/events/:id/message-host         (NO_CONTACT -> invite)
 *  report  -> POST /api/feedback {category:"EVENT_CORRECTION"}
 *  afterz-invite -> POST /api/users/:username/message (one friend, edited text)
 */
export type EventFormKind = "claim" | "mizz" | "gig" | "message" | "report" | "afterz-invite";

type Props = {
  kind: EventFormKind;
  eventId: number;
  eventTitle: string;
  occurrenceDate: string;
  venueName: string;
  pageUrl: string;
  accent: string;
  gigTitle?: string;
  onClose: () => void;
  /** After a successful post (refetch rails). */
  onDone?: () => void;
  /** message: the server has no host or venue owner to deliver to. */
  onNoContact?: () => void;
  /** The one follow-up on the thank-you face (gig: share it; afterz: invite another). */
  onNext?: (kind: EventFormKind) => void;
};

async function post(path: string, body: unknown, headers?: Record<string, string>) {
  const r = await fetch(path, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error((data as { message?: string; error?: string }).message || (data as { error?: string }).error || "Could not send. Try again.");
    (err as Error & { code?: string }).code = (data as { error?: string }).error;
    throw err;
  }
  return data;
}

export function EventFormCard({ kind, eventId, eventTitle, occurrenceDate, venueName, pageUrl, accent, gigTitle = "", onClose, onDone, onNoContact, onNext }: Props) {
  const { user } = useAuth();
  const [auth, setAuth] = useState(false);
  const [idem] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())));
  const needsAuth = kind !== "report" && !user;
  const friends = useQuery<{ people?: { username: string; displayName?: string | null }[] }>({
    queryKey: ["/api/users/me/people", "following"],
    queryFn: () => apiRequest("GET", "/api/users/me/people/following").then(r => r.json()),
    enabled: kind === "afterz-invite" && Boolean(user),
    staleTime: 60_000,
  });
  const friendList = (friends.data?.people ?? []).filter(p => p.username);
  const gate = needsAuth ? (
    <div className="zform-gate">
      <p className="zform-intro">Sign in to continue. Your words stay right here until you do.</p>
      <button type="button" className="obtn obtn--accent" onClick={() => setAuth(true)}>SIGN IN</button>
      {auth && <AuthModal onClose={() => setAuth(false)} />}
    </div>
  ) : undefined;
  const logo: CardLogo | null = kind === "mizz" ? FAMILY_LOGOS.mizzed : kind === "gig" || kind === "message" ? FAMILY_LOGOS.gigz : kind === "afterz-invite" ? FAMILY_LOGOS.afterz : null;
  const conf: { kicker: string; title: string; intro?: string; fields: FormCardField[]; submitLabel: string; success: { title: string; body: string }; submit: (v: FormCardValues) => Promise<unknown> } = (() => {
    switch (kind) {
      case "claim": return {
        kicker: "CLAIM THIS EVENT", title: eventTitle,
        intro: "Are you the host or promoter? Tell us your connection. An admin reviews claims, then you can manage the listing.",
        fields: [
          { name: "claimReason", label: "Your connection to this event", kind: "textarea", required: true, minLength: 10, maxLength: 1000, placeholder: "I'm the promoter. You can confirm on our Instagram @…" },
          { name: "submitterOrg", label: "Collective or company", placeholder: "Who you're hosting with" },
        ],
        submitLabel: "SUBMIT CLAIM",
        success: { title: "Claim sent", body: "Thanks. An admin will review it and you'll hear back in your inbox." },
        submit: v => post("/api/submit", { type: "CLAIM", eventId: String(eventId), claimReason: v.claimReason, submitterOrg: v.submitterOrg || undefined }, { "Idempotency-Key": idem }),
      };
      case "mizz": return {
        kicker: "MIZZED CONNECTION", title: eventTitle,
        intro: "Saw someone and didn't say hi? Post anonymously. You stay anonymous until you both reveal in inbox.",
        fields: [
          { name: "title", label: "Headline", maxLength: 80, placeholder: "Green jacket by the DJ booth" },
          { name: "body", label: "What happened", kind: "textarea", required: true, minLength: 10, maxLength: 1000, placeholder: "You were…, I was…" },
        ],
        submitLabel: "POST ANONYMOUSLY",
        success: { title: "Posted", body: "Your note is live on this event. Replies land in your inbox." },
        submit: v => {
          const body = String(v.body).trim();
          const title = String(v.title).trim() || (body.split(/\n/)[0] || "Missed connection").slice(0, 80);
          return post("/api/missed-connections", { title, body, eventId }).then(r => { void queryClient.invalidateQueries({ queryKey: ["/api/missed-connections"] }); return r; });
        },
      };
      case "gig": return {
        kicker: "POST A GIG", title: eventTitle,
        intro: "Need hands, performers or crew for this night? Your gig shows on this event and on GIGZ.",
        fields: [
          { name: "title", label: "Gig title", required: true, minLength: 3, maxLength: 80, defaultValue: `Gig at ${eventTitle}`.slice(0, 80) },
          { name: "description", label: "What you need", kind: "textarea", required: true, minLength: 20, maxLength: 1500, placeholder: "Door help 9pm to 1am, …" },
          { name: "compensation", label: "Pay or trade", placeholder: "$100 + guest list" },
          { name: "name", label: "Your name", required: true, defaultValue: (user as { displayName?: string } | null)?.displayName || user?.username || "" },
          { name: "contactEmail", label: "Contact email", kind: "email", required: true, defaultValue: (user as { email?: string } | null)?.email || "" },
          { name: "acceptRules", label: "I agree to the GIGZ board rules (real work, no personals).", kind: "checkbox", required: true },
        ],
        submitLabel: "POST GIG",
        success: { title: "Gig posted", body: "Thanks. It's on this event's Gigz rail." },
        submit: v => apiRequest("POST", "/api/gigs", {
          postType: "POSTING_GIG", title: v.title, description: v.description, compensation: v.compensation || null, name: v.name, contactEmail: v.contactEmail,
          skills: "", location: venueName, isRemote: false, gigDate: occurrenceDate.slice(0, 10), eventId, occurrenceDate, acceptRules: v.acceptRules === true,
        }).then(r => r.json()),
      };
      case "message": return {
        kicker: "MESSAGE THE HOST", title: gigTitle || eventTitle,
        intro: "Edit before sending. Nothing goes out until you tap SEND.",
        fields: [{ name: "body", label: "Your message", kind: "textarea", required: true, maxLength: 1000, rows: 6,
          defaultValue: `Hi! I saw "${gigTitle}" for ${eventTitle} on Zaylist. I can help with this. Let me know if you still need someone.` }],
        submitLabel: "SEND MESSAGE",
        success: { title: "Sent", body: "They can reply in your inbox." },
        submit: v => post(`/api/events/${eventId}/message-host`, { body: v.body }).catch((e: Error & { code?: string }) => {
          if (e.code === "NO_CONTACT") { onNoContact?.(); throw new Error("This host isn't on Zaylist yet. Invite them instead."); }
          throw e;
        }),
      };
      case "afterz-invite": return {
        kicker: "INVITE FRIENDS TO AFTERZ", title: eventTitle,
        intro: "Invite a friend now. They get a message from you in their inbox. Nothing sends until you tap SEND.",
        fields: [
          { name: "friend", label: "Friend", kind: "select", required: true, defaultValue: friendList[0]?.username ?? "",
            options: friendList.length ? friendList.map(p => ({ value: p.username, label: p.displayName ? `${p.displayName} (@${p.username})` : `@${p.username}` })) : [{ value: "", label: friends.isLoading ? "Loading friends…" : "Follow people to invite them" }] },
          { name: "body", label: "Message", kind: "textarea", required: true, maxLength: 1000, rows: 4,
            defaultValue: `Afterz after ${eventTitle}? I'm going. Come with: ${pageUrl}` },
        ],
        submitLabel: "SEND INVITE",
        success: { title: "Invite sent", body: "They'll see it in their inbox." },
        submit: v => {
          if (!v.friend) throw new Error("Pick a friend first.");
          return apiRequest("POST", `/api/users/${encodeURIComponent(String(v.friend))}/message`, { subject: `Afterz: ${eventTitle}`.slice(0, 120), body: v.body });
        },
      };
      case "report": return {
        kicker: "REPORT / REQUEST A CHANGE", title: eventTitle,
        intro: "Wrong time, moved venue, cancelled, or something unsafe? Tell us what to fix.",
        fields: [
          { name: "what", label: "What's wrong", kind: "select", required: true, defaultValue: "DETAILS", options: [
            { value: "DETAILS", label: "Time, date or venue is wrong" }, { value: "CANCELLED", label: "Event is cancelled" },
            { value: "TICKETS", label: "Ticket link is wrong" }, { value: "CONTENT", label: "Inappropriate or unsafe" }, { value: "OTHER", label: "Something else" }] },
          { name: "message", label: "Details", kind: "textarea", required: true, maxLength: 2000, placeholder: "Doors are 10pm, not 9pm (per the venue's Instagram)." },
          ...(user ? [] : [{ name: "email", label: "Email for a reply", kind: "email" as const }]),
        ],
        submitLabel: "SEND REPORT",
        success: { title: "Thank you", body: "We read every report and fix listings fast." },
        submit: v => post("/api/feedback", {
          category: "EVENT_CORRECTION", severity: v.what === "CONTENT" ? "HIGH" : "MEDIUM",
          message: `[Event ${eventId} · ${eventTitle} · ${occurrenceDate.slice(0, 10)}] ${v.what}: ${v.message}`,
          email: v.email || undefined, pageUrl, inAppReplies: Boolean(user),
        }),
      };
    }
  })();
  const nextLabel = kind === "gig" ? "SHARE YOUR GIGZ POST" : kind === "afterz-invite" ? "INVITE ANOTHER FRIEND" : kind === "mizz" ? "SHARE THIS EVENT" : null;
  const success = nextLabel && onNext ? { ...conf.success, next: { label: nextLabel, onClick: () => onNext(kind) } } : conf.success;
  return (
    <FormCard draftKey={`${kind}:${eventId}:${occurrenceDate.slice(0, 10)}${gigTitle ? ":" + gigTitle.slice(0, 40) : ""}`} key={kind === "afterz-invite" ? `af-${friendList.length}` : kind} logo={logo} accent={accent} kicker={conf.kicker} title={conf.title.toUpperCase()} intro={conf.intro ? <p>{conf.intro}</p> : undefined}
      fields={conf.fields} submitLabel={conf.submitLabel} success={success} gate={gate} onClose={onClose}
      onSubmit={async v => { await conf.submit(v); onDone?.(); }} />
  );
}

export default EventFormCard;
