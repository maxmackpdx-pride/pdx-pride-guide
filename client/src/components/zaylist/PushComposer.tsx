import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import {
  pushAllowance,
  pushRemaining,
  pushTierFor,
  type PushAudience,
} from "@/lib/zaylistApi";

const TITLE_LIMIT = 40;
const BODY_LIMIT = 110;
const SEND_LOG_KEY = "zl-push-sends";

/**
 * The push composer at the top of the hub. It renders only for users who
 * hold push permission; for everyone else it does not exist.
 *
 * What the back end enforces today: the owner broadcast
 * (POST /api/admin/push/broadcast, primary owner only, no rate limit).
 * Follower and RSVP audiences follow Tucker's rate policy (ask 67) in
 * the allowances shown here, but no sending endpoint enforces them yet,
 * so those audiences are stated, not sendable. Nothing here fakes a send.
 */
export default function PushComposer() {
  const { user } = useAuth();
  const [audience, setAudience] = useState<PushAudience>("everyone");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(SEND_LOG_KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  const tier = useMemo(
    () =>
      pushTierFor({
        isPrimaryOwner: !!user?.isPrimaryOwner,
        // The account payload carries no paid-membership flag today, so no
        // user is silently promoted to the paid tier here.
        isPaidMember: false,
      }),
    [user],
  );

  if (!user || !(user.canPush || user.isPrimaryOwner)) return null;

  const isOwner = tier === "owner";
  const allowance = pushAllowance(tier, audience);
  const remaining = pushRemaining(tier, audience, log);
  const sendable = isOwner && audience === "everyone";
  const overTitle = title.length > TITLE_LIMIT;
  const overBody = body.length > BODY_LIMIT;

  const allowanceText = (() => {
    if (isOwner) return "Owner: no limit, every user.";
    if (audience === "everyone") return "Only the owner sends to everyone.";
    const per = allowance.limit === 1 ? "1 push" : `${allowance.limit} pushes`;
    const window = allowance.windowDays === 1 ? "per day" : `per ${allowance.windowDays} days`;
    return `${tier === "paid" ? "Paid" : "Standard"}: ${per} ${window} to ${audience}. ${remaining} left in this window on this device.`;
  })();

  const send = async () => {
    setState("sending");
    setMessage(null);
    try {
      const res = await apiRequest("POST", "/api/admin/push/broadcast", {
        title: title.trim(),
        body: body.trim(),
        url: "/events",
      });
      const data = (await res.json()) as { sent?: number; usersTargeted?: number };
      const next = [...log, new Date().toISOString()];
      setLog(next);
      try {
        localStorage.setItem(SEND_LOG_KEY, JSON.stringify(next));
      } catch {
        /* the log is a readout, not the record */
      }
      setState("sent");
      setMessage(`Sent to ${data.usersTargeted ?? 0} people (${data.sent ?? 0} devices).`);
      setTitle("");
      setBody("");
    } catch (e) {
      setState("error");
      setMessage(parseApiError(e, "The push did not send. Try again."));
    }
  };

  return (
    <section className="zl-section zl-push" aria-label="Push notification">
      <h2>Push notification</h2>
      <div className="zl-push-aud" role="group" aria-label="Audience">
        {(["everyone", "followers", "rsvps"] as PushAudience[]).map((a) => (
          <button
            key={a}
            className="zl-btn zl-btn--small"
            type="button"
            aria-pressed={audience === a}
            onClick={() => setAudience(a)}
          >
            {a === "everyone" ? "Everyone" : a === "followers" ? "Followers" : "RSVPs"}
          </button>
        ))}
      </div>
      <p className="zl-note">{allowanceText}</p>
      <label className="zl-label" htmlFor="zl-push-title">Title</label>
      <input
        id="zl-push-title"
        className="zl-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={TITLE_LIMIT + 20}
        placeholder="Push title"
        autoComplete="off"
      />
      <div className="zl-charcount" aria-live="polite">
        {title.length}/{TITLE_LIMIT}
        {overTitle ? " · over the lock-screen limit" : ""}
      </div>
      <label className="zl-label" htmlFor="zl-push-body">Message</label>
      <textarea
        id="zl-push-body"
        className="zl-textarea"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={BODY_LIMIT + 40}
        placeholder="Push message"
      />
      <div className="zl-charcount" aria-live="polite">
        {body.length}/{BODY_LIMIT}
        {overBody ? " · over the lock-screen limit" : ""}
      </div>
      {message ? (
        <p className={state === "error" ? "zl-error" : "zl-ok"} role="status">{message}</p>
      ) : null}
      {!sendable && !(isOwner && audience !== "everyone") ? (
        <p className="zl-note">
          {isOwner
            ? "The owner broadcast sends to everyone. Follower and RSVP sending is not wired in the back end yet."
            : "Sending from this account is not wired in the back end yet. The allowance above is the standing policy."}
        </p>
      ) : null}
      {isOwner && audience !== "everyone" ? (
        <p className="zl-note">The owner broadcast sends to everyone. Follower and RSVP sending is not wired in the back end yet.</p>
      ) : null}
      <div className="zl-row" style={{ marginTop: 10 }}>
        <button
          className="zl-btn zl-btn--primary"
          type="button"
          disabled={!sendable || !title.trim() || overTitle || overBody || state === "sending"}
          onClick={() => void send()}
        >
          {state === "sending" ? "Sending…" : "Send push"}
        </button>
      </div>
    </section>
  );
}
