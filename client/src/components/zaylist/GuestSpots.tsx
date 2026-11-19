import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  stateLabel,
  zaylistApi,
  zaylistError,
  type MyZaylistEntry,
  type ZaylistPass,
} from "@/lib/zaylistApi";
import QrPass from "./QrPass";

function SpotCard({ entry }: { entry: MyZaylistEntry }) {
  const queryClient = useQueryClient();
  const [pass, setPass] = useState<ZaylistPass | null>(null);
  const [giftContact, setGiftContact] = useState("");
  const [showGift, setShowGift] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/me/zaylist"] });
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (ok) setNotice(ok);
      await refresh();
    } catch (e) {
      setError(zaylistError(e, "That did not go through. Try again."));
    }
  };

  const live = entry.state === "pending" || entry.state === "accepted";
  return (
    <div className="zl-person" style={{ alignItems: "flex-start" }}>
      <div className="zl-person-main">
        <div className="zl-person-name">{entry.eventTitle}</div>
        <div className="zl-person-meta">
          {stateLabel(entry.state)}
          {entry.source === "draw" ? " · Won in the draw" : ""}
        </div>
        {error ? <p className="zl-error" role="alert">{error}</p> : null}
        {notice ? <p className="zl-ok" role="status">{notice}</p> : null}
        {pass?.token ? (
          <div className="zl-pass" style={{ marginTop: 10 }}>
            <QrPass token={pass.token} label={`Entry code for ${entry.eventTitle}`} />
            <div className="zl-pass-token">{pass.token}</div>
            {pass.drinks.filter((d) => !d.revoked).length ? (
              <p className="zl-note">
                On this code:{" "}
                {pass.drinks
                  .filter((d) => !d.revoked)
                  .map((d) => (d.kind === "comp" ? `${d.remaining} drink${d.remaining === 1 ? "" : "s"}` : `${d.percent}% off drinks`))
                  .join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
        {showGift ? (
          <form
            className="zl-row"
            style={{ marginTop: 10 }}
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await zaylistApi.gift(entry.id, { contact: giftContact.trim() });
                setShowGift(false);
                setGiftContact("");
                setPass(null);
              }, "Gifted. The spot is theirs now; if they already hold a ticket, no refund applies.");
            }}
          >
            <input
              className="zl-input"
              value={giftContact}
              onChange={(e) => setGiftContact(e.target.value)}
              placeholder="Their email or phone"
              aria-label="Gift recipient email or phone"
              autoComplete="off"
            />
            <button className="zl-btn zl-btn--primary" type="submit" disabled={!giftContact.trim()}>
              Send gift
            </button>
          </form>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entry.state === "pending" ? (
          <>
            <button
              className="zl-btn zl-btn--small zl-btn--primary"
              type="button"
              onClick={() =>
                void run(async () => {
                  const r = await zaylistApi.accept(entry.id);
                  setNotice(
                    r.message
                      ? `You are on the list. ${r.message}`
                      : "You are on the list. Accepting also joins the event chat.",
                  );
                  const p = await zaylistApi.getPass(entry.id);
                  setPass(p);
                })
              }
            >
              Accept
            </button>
            <button
              className="zl-btn zl-btn--small"
              type="button"
              onClick={() => void run(() => zaylistApi.decline(entry.id), "Declined. The spot returns to the pool.")}
            >
              Decline
            </button>
          </>
        ) : null}
        {entry.state === "accepted" || entry.state === "redeemed" ? (
          <button
            className="zl-btn zl-btn--small"
            type="button"
            onClick={() =>
              void run(async () => {
                const p = await zaylistApi.getPass(entry.id);
                setPass(p);
              })
            }
          >
            {pass ? "Refresh pass" : "View pass"}
          </button>
        ) : null}
        {live ? (
          <button className="zl-btn zl-btn--small" type="button" onClick={() => setShowGift((v) => !v)}>
            Gift this spot
          </button>
        ) : null}
        {entry.state === "accepted" ? (
          <button
            className="zl-btn zl-btn--small"
            type="button"
            onClick={() =>
              void run(async () => {
                await zaylistApi.regenerate(entry.id);
                const p = await zaylistApi.getPass(entry.id);
                setPass(p);
              }, "New code issued. The old code no longer works.")
            }
          >
            New code
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** The guest side of Zay'list: spots held by the signed-in member. */
export default function GuestSpots() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["/api/me/zaylist"], queryFn: () => zaylistApi.mine() });
  const [claimNote, setClaimNote] = useState<string | null>(null);

  if (query.isLoading) return <p className="zl-note">Loading your spots…</p>;
  if (query.isError)
    return (
      <p className="zl-error" role="alert">
        Your spots are unavailable.{" "}
        <button className="zl-btn zl-btn--small" type="button" onClick={() => query.refetch()}>
          Try again
        </button>
      </p>
    );
  const entries = query.data?.entries ?? [];
  const claimable = query.data?.claimable ?? 0;
  return (
    <div>
      {claimable > 0 ? (
        <div className="zl-person" style={{ marginBottom: 10 }}>
          <div className="zl-person-main">
            <div className="zl-person-name">{claimable} invite{claimable === 1 ? "" : "s"} waiting</div>
            <div className="zl-person-meta">Spots sent to your email before you had an account</div>
            {claimNote ? <p className="zl-ok" role="status">{claimNote}</p> : null}
          </div>
          <button
            className="zl-btn zl-btn--small zl-btn--primary"
            type="button"
            onClick={async () => {
              try {
                const r = await zaylistApi.claimInvites();
                setClaimNote(r.claimed ? `${r.claimed} spot${r.claimed === 1 ? "" : "s"} claimed.` : "Nothing left to claim.");
                await queryClient.invalidateQueries({ queryKey: ["/api/me/zaylist"] });
              } catch (e) {
                setClaimNote(zaylistError(e, "Claiming did not go through."));
              }
            }}
          >
            Claim
          </button>
        </div>
      ) : null}
      {entries.length ? (
        <div className="zl-list">
          {entries.map((entry) => (
            <SpotCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="zl-note">No Zay'list spots yet. When a host adds you or the draw picks you, the spot lands here.</p>
      )}
    </div>
  );
}
