import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  stateLabel,
  zaylistApi,
  zaylistError,
  type MyZaylistEntry,
  type ZaylistPass,
} from "@/lib/zaylistApi";
import QrPass from "./QrPass";
import { useAuth } from "@/context/AuthContext";

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
    <div id={`spot-${entry.id}`} className="zl-person" style={{ alignItems: "flex-start" }}>
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
            {pass.message && <p className="zl-note">{pass.message}</p>}
            {pass.talentMessage && <p className="zl-note"><strong>Talent briefing</strong><br />{pass.talentMessage}</p>}
            <QrPass token={pass.token} label={`Entry code for ${entry.eventTitle}`} />
            <div className="zl-pass-token">{pass.token}</div>
            <div className="zl-row">
              <a className="zl-btn" href={`/api/zaylist/entries/${entry.id}/pass/pdf`} download>Download PDF</a>
              {pass.wallets.apple && <a className="zl-btn" href={`/api/zaylist/entries/${entry.id}/pass/apple`}>Add to Apple Wallet</a>}
              {pass.wallets.google && <a className="zl-btn" href={`/api/zaylist/entries/${entry.id}/pass/google`} rel="noreferrer">Add to Google Wallet</a>}
            </div>
            {pass.drinks.filter((d) => !d.revoked).length ? (
              <p className="zl-note">
                On this code:{" "}
                {pass.drinks
                  .filter((d) => !d.revoked)
                  .map((d) => (d.kind === "comp" ? `${d.remaining} drink${d.remaining === 1 ? "" : "s"}` : `${d.percent}% off · ${d.remaining} remaining`))
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
                  await zaylistApi.accept(entry.id);
                  setNotice("You are on the list. Your pass is ready.");
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
        {entry.state === "accepted" || entry.state === "redeemed" ? (
          <a className="zl-btn zl-btn--small" href={`/events/${entry.eventId}?chat=1`}>Event chat</a>
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
  const { user } = useAuth();
  const query = useQuery({ queryKey: ["/api/me/zaylist", user?.id], queryFn: zaylistApi.mine, enabled: !!user });
  const [claimNote, setClaimNote] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("guest-list-invitation") || new URLSearchParams(location.hash.slice(1)).get("invite");
    if (!token) return;
    let live = true;
    zaylistApi.claimInvites(token).then(() => {
      sessionStorage.removeItem("guest-list-invitation");
      history.replaceState(null, "", location.pathname + location.search);
      if (live) setClaimNote("Your invitation is ready. Choose your spot below.");
      void queryClient.invalidateQueries({queryKey:["/api/me/zaylist"]});
    }).catch(e => {if (live) setClaimNote(zaylistError(e, "Could not claim this invitation."));});
    return () => {live = false;};
  }, [queryClient]);
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
      {claimNote && <p className="zl-note" role="status">{claimNote}</p>}
      {claimable > 0 ? (
        <div className="zl-person" style={{ marginBottom: 10 }}>
          <div className="zl-person-main">
            <div className="zl-person-name">{claimable} invite{claimable === 1 ? "" : "s"} waiting</div>
            <div className="zl-person-meta">Spots sent to your email before you had an account</div>

          </div>
          <button
            className="zl-btn zl-btn--small zl-btn--primary"
            type="button"
            onClick={async () => {
              try {
                const r = await zaylistApi.claimInvites();
                setClaimNote(r.claimed ? `${r.claimed} spot${r.claimed === 1 ? "" : "s"} claimed.` : r.verificationRequested ? "Check your email for your private invitation link." : "No invitations waiting.");
                await queryClient.invalidateQueries({ queryKey: ["/api/me/zaylist"] });
              } catch (e) {
                setClaimNote(zaylistError(e, "Claiming did not go through."));
              }
            }}
          >
            Email my link
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
