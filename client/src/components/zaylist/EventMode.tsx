import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  entryName,
  stateLabel,
  zaylistApi,
  zaylistError,
  type ZaylistEventPayload,
  type ZaylistDrink,
} from "@/lib/zaylistApi";
import Scanner from "./Scanner";
import { useModalA11y } from "@/hooks/useModalA11y";

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
  const [mode, setMode] = useState<"door" | "bar">("door");
  const [currentPass, setCurrentPass] = useState<{token: string; drinks: ZaylistDrink[]} | null>(null);
  const processing = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [drinkBusy, setDrinkBusy] = useState(false);

  const dialogRef = useModalA11y({onClose});

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
    if (processing.current) return;
    processing.current = true;
    setScanning(true);
    setFeedback(null);
    setCurrentPass(null);
    try {
      if (mode === "bar") {
        const pass = await zaylistApi.inspectPass(token, eventId);
        const name = pass.guest.displayName || pass.guest.username || "Guest";
        setCurrentPass({ token, drinks: pass.drinks });
        setFeedback({ kind: "in", text: `${name} · ${pass.drinks.some(d => !d.revoked && d.remaining > 0) ? "Bar pass" : "No drinks remaining"}` });
      } else {
        const pass = await zaylistApi.scan(token, eventId);
        const name = pass.guest.displayName || pass.guest.username || "Guest";
        setCurrentPass({ token, drinks: pass.drinks });
        if (pass.result === "admitted") {
          setFeedback({ kind: "in", text: `${name} is in.` });
          setCount(c => c + 1);
        } else {
          const at = pass.firstScan?.at;
          const time = at && new Date(/^\d{4}-\d{2}-\d{2} /.test(at) ? at.replace(" ", "T") + "Z" : at).toLocaleTimeString();
          setFeedback({ kind: "already", text: `${name} already checked in by ${pass.firstScan?.by || "the door"}${time ? " at " + time : ""}.` });
        }
        await Promise.all([queryClient.invalidateQueries({ queryKey: key }), queryClient.invalidateQueries({queryKey:["/api/hub/workspace"]})]);
      }
    } catch (e) {
      setFeedback({ kind: "error", text: zaylistError(e, "That pass could not be read.") });
    } finally {
      processing.current = false;
      setScanning(false);
    }
  };

  const handleDrink = async (drink: ZaylistDrink) => {
    if (!currentPass || processing.current) return;
    processing.current = true;
    setDrinkBusy(true);
    try {
      const r = await zaylistApi.scanDrink(currentPass.token, eventId, drink.id);
      setCurrentPass({token:currentPass.token, drinks:r.drinks});
      setFeedback({kind:"in",text:`${drink.kind === "comp" ? "Comp" : drink.percent + "% discount"} redeemed. ${r.remaining} left.`});
      await Promise.all([queryClient.invalidateQueries({ queryKey: key }), queryClient.invalidateQueries({queryKey:["/api/hub/workspace"]})]);
    } catch (e) {
      setFeedback({ kind: "error", text: zaylistError(e, "That drink could not be redeemed. Scan the pass again.") });
      setCurrentPass(null);
    } finally {
      processing.current = false;
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
    <div className="zl-door" ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Event Mode for ${eventTitle}`}>
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
        {payload?.permissions.team && <>
          <div className="zl-row" role="group" aria-label="Scanner mode">
            {(["door","bar"] as const).map(value => <button key={value} className="zl-btn" type="button" aria-pressed={mode === value}
              disabled={scanning || drinkBusy} onClick={() => {setMode(value); setCurrentPass(null); setFeedback(null);}}>
              {value === "door" ? "Door check-in" : "Bar service"}
            </button>)}
          </div>
          <Scanner dark onToken={handleToken} />
        </>}
      </div>
      {feedback ? (
        <div className={`zl-scan-result zl-scan-result--${feedback.kind}`} role="status">
          {feedback.text}
          {currentPass?.drinks.filter(d => !d.revoked && d.remaining > 0).map(drink =>
            <button key={drink.id} className="zl-btn" style={{margin: "8px 8px 0 0"}} type="button"
              disabled={scanning || drinkBusy} onClick={() => void handleDrink(drink)}>
              {drink.kind === "comp" ? "Serve comp" : `Apply ${drink.percent}% discount`} · {drink.remaining} left
            </button>)}
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
