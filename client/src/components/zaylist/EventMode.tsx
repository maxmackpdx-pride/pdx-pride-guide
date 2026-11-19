import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  entryName,
  stateLabel,
  zaylistApi,
  zaylistError,
  type ZaylistEventPayload,
} from "@/lib/zaylistApi";
import Scanner from "./Scanner";

type ScanFeedback =
  | { kind: "in"; text: string }
  | { kind: "already"; text: string }
  | { kind: "error"; text: string }
  | null;

/**
 * Event Mode: the full-screen door view of one event's Zay'list.
 * Important people (talent) pinned at top, the list below, an optional
 * tap counter, and team-wide scanning with redeem-once feedback.
 */
export default function EventMode({
  eventId,
  eventTitle,
  onClose,
}: {
  eventId: number;
  eventTitle: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const key = ["zaylist", eventId] as const;
  const query = useQuery({ queryKey: key, queryFn: () => zaylistApi.getEvent(eventId) });
  const payload = query.data && !("guest" in query.data) ? (query.data as ZaylistEventPayload) : null;

  const [counterOn, setCounterOn] = useState(false);
  const [count, setCount] = useState(0);
  const [feedback, setFeedback] = useState<ScanFeedback>(null);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [drinkBusy, setDrinkBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { pinned, rest } = useMemo(() => {
    const entries = (payload?.entries ?? []).filter(
      (e) => e.state === "pending" || e.state === "accepted" || e.state === "redeemed",
    );
    return {
      pinned: entries.filter((e) => e.important),
      rest: entries.filter((e) => !e.important),
    };
  }, [payload]);

  const handleToken = async (token: string) => {
    setFeedback(null);
    try {
      const r = await zaylistApi.scan(token);
      setLastToken(token);
      const name = r.guest.displayName || r.guest.username || "Guest";
      if (r.result === "admitted") {
        setFeedback({ kind: "in", text: `${name} is in.` });
        setCount((c) => c + 1);
      } else {
        setFeedback({
          kind: "already",
          text: `${name} already checked in by ${r.firstScan?.by ?? "the door"} at ${
            r.firstScan ? new Date(r.firstScan.at).toLocaleTimeString() : ""
          }.`,
        });
      }
      await queryClient.invalidateQueries({ queryKey: key });
    } catch (e) {
      setLastToken(null);
      setFeedback({ kind: "error", text: zaylistError(e, "That code did not check in.") });
    }
  };

  const handleDrink = async () => {
    if (!lastToken) return;
    setDrinkBusy(true);
    try {
      const r = await zaylistApi.scanDrink(lastToken);
      setFeedback({
        kind: "in",
        text: r.remaining != null ? `Drink served. ${r.remaining} left on the code.` : "Drink served.",
      });
      await queryClient.invalidateQueries({ queryKey: key });
    } catch (e) {
      setFeedback({ kind: "error", text: zaylistError(e, "No drinks left on this code.") });
    } finally {
      setDrinkBusy(false);
    }
  };

  const row = (e: ZaylistEventPayload["entries"][number]) => (
    <div className="zl-person" key={e.id}>
      <div className="zl-avatar" aria-hidden="true">
        {(entryName(e)[0] ?? "?").toUpperCase()}
      </div>
      <div className="zl-person-main">
        <div className="zl-person-name">{entryName(e)}</div>
        <div className="zl-person-meta">
          {stateLabel(e.state)}
          {e.important ? " · Talent" : ""}
          {e.drinks.some((d) => !d.revoked && d.remaining > 0)
            ? " · " +
              e.drinks
                .filter((d) => !d.revoked)
                .map((d) => (d.kind === "comp" ? `${d.remaining} drinks` : `${d.percent}% off`))
                .join(", ")
            : ""}
        </div>
      </div>
      <span className={`zl-chip${e.state === "redeemed" ? " zl-chip--in" : ""}`}>
        {e.state === "redeemed" ? "In" : e.state === "accepted" ? "Expected" : "Pending"}
      </span>
    </div>
  );

  return (
    <div className="zl-door" role="dialog" aria-modal="true" aria-label={`Event Mode for ${eventTitle}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>{eventTitle}</h2>
          <p className="zl-person-meta" style={{ margin: 0 }}>
            {payload ? `${payload.counts.arrived} in · ${payload.counts.accepted} expected · ${payload.counts.pending} pending` : "Loading the list…"}
          </p>
        </div>
        <button className="zl-btn" type="button" onClick={() => setCounterOn((v) => !v)} aria-pressed={counterOn}>
          Counter {counterOn ? "on" : "off"}
        </button>
        <button className="zl-btn" type="button" onClick={onClose} aria-label="Close Event Mode">
          Close
        </button>
      </div>

      {counterOn ? (
        <div className="zl-counter">
          <button className="zl-counter-btn zl-counter-btn--minus" type="button" onClick={() => setCount((c) => Math.max(0, c - 1))} aria-label="Count down">
            −
          </button>
          <div className="zl-counter-display" aria-live="polite">{count}</div>
          <button className="zl-counter-btn" type="button" onClick={() => setCount((c) => c + 1)} aria-label="Count up">
            +
          </button>
        </div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <Scanner dark onToken={(t) => void handleToken(t)} />
      </div>
      {feedback ? (
        <div className={`zl-scan-result zl-scan-result--${feedback.kind}`} role="status">
          {feedback.text}
          {feedback.kind === "in" && lastToken ? (
            <div style={{ marginTop: 10 }}>
              <button className="zl-btn" type="button" disabled={drinkBusy} onClick={() => void handleDrink()}>
                Serve a drink on this code
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="zl-door-list">
        {pinned.length ? (
          <>
            <p className="zl-person-meta" style={{ margin: "4px 0 0" }}>Important</p>
            {pinned.map(row)}
          </>
        ) : null}
        {rest.map(row)}
        {query.isLoading ? <p className="zl-person-meta">Loading the list…</p> : null}
        {query.isError ? (
          <p className="zl-person-meta" role="alert">
            The list is unavailable.{" "}
            <button className="zl-btn zl-btn--small" type="button" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        ) : null}
        {payload && !pinned.length && !rest.length ? (
          <p className="zl-person-meta">Nobody is on the list yet.</p>
        ) : null}
      </div>
    </div>
  );
}
