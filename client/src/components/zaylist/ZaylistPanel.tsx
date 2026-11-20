import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  entryName,
  stateLabel,
  zaylistApi,
  zaylistError,
  type MemberSearchResult,
  type ZaylistEntry,
  type ZaylistEventPayload,
} from "@/lib/zaylistApi";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function PersonRow({
  entry,
  canRemove,
  canDrinks,
  onRemove,
  onDrink,
}: {
  entry: ZaylistEntry;
  canRemove: boolean;
  canDrinks: boolean;
  onRemove: () => void;
  onDrink: (kind: "comp" | "discount") => void;
}) {
  const name = entryName(entry);
  const drinks = entry.drinks.filter((d) => !d.revoked);
  return (
    <div className="zl-person">
      <div className="zl-avatar" aria-hidden="true">{initials(name)}</div>
      <div className="zl-person-main">
        <div className="zl-person-name">{name}</div>
        <div className="zl-person-meta">
          {stateLabel(entry.state)}
          {entry.important ? " · Talent" : ""}
          {entry.source === "draw" ? " · Draw" : entry.source === "invite" ? " · Invite" : ""}
          {drinks.length
            ? " · " +
              drinks
                .map((d) =>
                  d.kind === "comp"
                    ? `${d.remaining} drink${d.remaining === 1 ? "" : "s"} left`
                    : `${d.percent}% off drinks`,
                )
                .join(", ")
            : ""}
        </div>
      </div>
      {canDrinks && (entry.state === "pending" || entry.state === "accepted" || entry.state === "redeemed") ? (
        <>
          <button className="zl-btn zl-btn--small" type="button" onClick={() => onDrink("comp")}>
            Add drink
          </button>
        </>
      ) : null}
      {canRemove ? (
        <button className="zl-btn zl-btn--small zl-btn--danger" type="button" onClick={onRemove}>
          Remove
        </button>
      ) : null}
    </div>
  );
}

export default function ZaylistPanel({ eventId }: { eventId: number }) {
  const queryClient = useQueryClient();
  const key = ["zaylist", eventId] as const;
  const query = useQuery({
    queryKey: key,
    queryFn: () => zaylistApi.getEvent(eventId),
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (ok) setNotice(ok);
      await invalidate();
    } catch (e) {
      setError(zaylistError(e, "That did not go through. Try again."));
    }
  };
  const payload = query.data && !("guest" in query.data) ? (query.data as ZaylistEventPayload) : null;

  const [config, setConfig] = useState<{ poolSize: string; maxCap: string; drawDaysBefore: string; dripPerDay: string } | null>(null);
  const [drawCount, setDrawCount] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [contact, setContact] = useState("");
  const [allowUser, setAllowUser] = useState<MemberSearchResult | null>(null);
  const [allowRole, setAllowRole] = useState("staff");
  const [allowSpots, setAllowSpots] = useState("2");
  const [generalBody, setGeneralBody] = useState<string | null>(null);
  const [talentPick, setTalentPick] = useState<string>("");
  const [savedLabel, setSavedLabel] = useState("");
  const [savedBody, setSavedBody] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");

  const messagesQuery = useQuery({
    queryKey: ["zaylist-messages", eventId],
    queryFn: () => zaylistApi.getMessages(eventId),
    enabled: !!payload?.permissions.editor,
  });
  const broadcastsQuery = useQuery({
    queryKey: ["zaylist-broadcasts", eventId],
    queryFn: () => zaylistApi.getBroadcasts(eventId),
    enabled: !!payload?.permissions.editor,
  });

  const grouped = useMemo(() => {
    const entries = payload?.entries ?? [];
    return {
      pending: entries.filter((e) => e.state === "pending"),
      live: entries.filter((e) => e.state === "accepted"),
      arrived: entries.filter((e) => e.state === "redeemed"),
      settled: entries.filter((e) => ["declined", "expired", "removed", "gifted"].includes(e.state)),
    };
  }, [payload]);

  if (query.isLoading) return <p className="zl-note">Loading the list…</p>;
  if (query.isError)
    return (
      <p className="zl-error" role="alert">
        The list is unavailable.{" "}
        <button className="zl-btn zl-btn--small" type="button" onClick={() => query.refetch()}>
          Try again
        </button>
      </p>
    );
  if (!payload) return <p className="zl-note">You are not on this event team.</p>;

  const perms = payload.permissions;
  const cfg = payload.config;
  const cfgForm = config ?? {
    poolSize: String(cfg?.poolSize ?? 0),
    maxCap: String(cfg?.maxCap ?? 0),
    drawDaysBefore: cfg?.drawDaysBefore != null ? String(cfg.drawDaysBefore) : "",
    dripPerDay: cfg?.dripPerDay != null ? String(cfg.dripPerDay) : "",
  };
  const canAdd = perms.editor || !!perms.allowance;

  const doSearch = async (q: string) => {
    setSearchQ(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      const r = await zaylistApi.search(eventId, q.trim());
      setResults(r.results);
    } catch (e) {
      setError(zaylistError(e, "Search did not go through."));
    }
  };

  const listSection = (title: string, entries: ZaylistEntry[]) =>
    entries.length ? (
      <>
        <h3>
          {title} · {entries.length}
        </h3>
        <div className="zl-list">
          {entries.map((entry) => (
            <PersonRow
              key={entry.id}
              entry={entry}
              canRemove={perms.editor}
              canDrinks={perms.canGrantDrinks}
              onRemove={() => void run(() => zaylistApi.removeEntry(eventId, entry.id), "Removed from the list.")}
              onDrink={() =>
                void run(
                  () => zaylistApi.addDrink(entry.id, { kind: "comp", total: 1 }),
                  "Drink comp added to their code.",
                )
              }
            />
          ))}
        </div>
      </>
    ) : null;

  return (
    <div>
      <div className="zl-counts" aria-label="List counts">
        <div className="zl-count"><b>{payload.counts.pending}</b><span>Pending</span></div>
        <div className="zl-count"><b>{payload.counts.accepted}</b><span>On the list</span></div>
        <div className="zl-count"><b>{payload.counts.arrived}</b><span>Arrived</span></div>
        <div className="zl-count"><b>{payload.counts.poolSize}</b><span>Pool</span></div>
        <div className="zl-count"><b>{payload.counts.drinksOutstanding}</b><span>Drinks out</span></div>
      </div>
      {perms.allowance ? (
        <p className="zl-note">
          Your allowance: {perms.allowance.used} of {perms.allowance.spots} used ({perms.allowance.role}).
        </p>
      ) : null}
      {error ? <p className="zl-error" role="alert">{error}</p> : null}
      {notice ? <p className="zl-ok" role="status">{notice}</p> : null}

      {listSection("Pending", grouped.pending)}
      {listSection("On the list", grouped.live)}
      {listSection("Arrived", grouped.arrived)}
      {grouped.settled.length ? (
        <details>
          <summary className="zl-note" style={{ cursor: "pointer", marginTop: 14 }}>
            Settled · {grouped.settled.length}
          </summary>
          <div className="zl-list">
            {grouped.settled.map((entry) => (
              <PersonRow
                key={entry.id}
                entry={entry}
                canRemove={false}
                canDrinks={false}
                onRemove={() => undefined}
                onDrink={() => undefined}
              />
            ))}
          </div>
        </details>
      ) : null}

      {canAdd ? (
        <>
          <h3>Add to the list</h3>
          <label className="zl-label" htmlFor={`zl-search-${eventId}`}>Find a member</label>
          <input
            id={`zl-search-${eventId}`}
            className="zl-input"
            value={searchQ}
            onChange={(e) => void doSearch(e.target.value)}
            placeholder="Name, username, or email"
            autoComplete="off"
          />
          {results.length ? (
            <div className="zl-list">
              {results.map((r) => (
                <div className="zl-person" key={r.id}>
                  <div className="zl-avatar" aria-hidden="true">{initials(r.displayName || r.username)}</div>
                  <div className="zl-person-main">
                    <div className="zl-person-name">{r.displayName || r.username}</div>
                    <div className="zl-person-meta">{r.username}</div>
                  </div>
                  <button
                    className="zl-btn zl-btn--small"
                    type="button"
                    onClick={() => void run(() => zaylistApi.addEntry(eventId, { userId: r.id }), "Added to the list.")}
                  >
                    Add
                  </button>
                  {perms.allocator ? (
                    <button
                      className="zl-btn zl-btn--small"
                      type="button"
                      onClick={() => setAllowUser(r)}
                    >
                      Allowance
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          <label className="zl-label" htmlFor={`zl-contact-${eventId}`}>Or add by email or phone</label>
          <div className="zl-row">
            <input
              id={`zl-contact-${eventId}`}
              className="zl-input"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="email@example.com or phone"
              autoComplete="off"
            />
            <button
              className="zl-btn"
              type="button"
              disabled={!contact.trim()}
              onClick={() =>
                void run(async () => {
                  await zaylistApi.addEntry(eventId, { contact: contact.trim() });
                  setContact("");
                }, "Added. If they have no account yet, the spot waits on their invite.")
              }
            >
              Add
            </button>
          </div>
          <p className="zl-note">No account on file sends an invite instead. The spot confirms at the end of their sign-up.</p>
        </>
      ) : null}

      {allowUser && perms.allocator ? (
        <>
          <h3>Allowance for {allowUser.displayName || allowUser.username}</h3>
          <div className="zl-row">
            <div>
              <label className="zl-label" htmlFor="zl-allow-role">Role</label>
              <select id="zl-allow-role" className="zl-select" value={allowRole} onChange={(e) => setAllowRole(e.target.value)}>
                <option value="staff">Staff</option>
                <option value="promoter">Promoter</option>
                <option value="talent">Talent</option>
              </select>
            </div>
            <div>
              <label className="zl-label" htmlFor="zl-allow-spots">Spots they can add</label>
              <input
                id="zl-allow-spots"
                className="zl-input"
                type="number"
                min={0}
                value={allowSpots}
                onChange={(e) => setAllowSpots(e.target.value)}
              />
            </div>
            <button
              className="zl-btn zl-btn--primary"
              type="button"
              onClick={() =>
                void run(async () => {
                  await zaylistApi.putAllowance(eventId, allowUser.id, allowRole, Number(allowSpots) || 0);
                  setAllowUser(null);
                }, "Allowance saved.")
              }
            >
              Save allowance
            </button>
            {perms.isOwner && <button
              className="zl-btn"
              type="button"
              onClick={() =>
                void run(async () => {
                  await zaylistApi.putGrant(eventId, allowUser.id);
                  setAllowUser(null);
                }, "Full access granted. Only the event owner can grant or remove it.")
              }
            >
              Grant full access
            </button>}
          </div>
        </>
      ) : null}

      {perms.allocator && payload.allowances ? (
        <>
          <h3>Allowances</h3>
          {payload.allowances.length ? (
            <div className="zl-list">
              {payload.allowances.map((a) => (
                <div className="zl-person" key={a.userId}>
                  <div className="zl-avatar" aria-hidden="true">{initials(a.displayName || a.username)}</div>
                  <div className="zl-person-main">
                    <div className="zl-person-name">{a.displayName || a.username}</div>
                    <div className="zl-person-meta">{a.role} · {a.spots} spots</div>
                  </div>
                  <button
                    className="zl-btn zl-btn--small"
                    type="button"
                    aria-pressed={!!a.drinkPrivilege}
                    onClick={() =>
                      void run(async () => {
                        if (a.drinkPrivilege) {
                          await zaylistApi.deletePrivilege(eventId, a.userId);
                        } else {
                          await zaylistApi.putPrivilege(eventId, a.userId);
                        }
                      }, a.drinkPrivilege ? "Drink privilege removed." : "Drink privilege granted.")
                    }
                  >
                    {a.drinkPrivilege ? "Drinks: on" : "Drinks: off"}
                  </button>
                  <button
                    className="zl-btn zl-btn--small zl-btn--danger"
                    type="button"
                    onClick={() => void run(() => zaylistApi.deleteAllowance(eventId, a.userId), "Allowance removed.")}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="zl-note">No allowances yet. Search a member above and choose Allowance.</p>
          )}
        </>
      ) : null}

      {perms.isOwner && payload.grants ? (
        <>
          <h3>Full access</h3>
          {payload.grants.length ? (
            <div className="zl-list">
              {payload.grants.map((g) => (
                <div className="zl-person" key={g.userId}>
                  <div className="zl-avatar" aria-hidden="true">{initials(g.displayName || g.username)}</div>
                  <div className="zl-person-main">
                    <div className="zl-person-name">{g.displayName || g.username}</div>
                    <div className="zl-person-meta">Can set the pool, allowances, and caps</div>
                  </div>
                  <button
                    className="zl-btn zl-btn--small zl-btn--danger"
                    type="button"
                    onClick={() => void run(() => zaylistApi.deleteGrant(eventId, g.userId), "Full access removed.")}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="zl-note">No full-access grants yet.</p>
          )}
          <p className="zl-note">Grant from a member search result by choosing Allowance first, or set allowances above. Only the event owner can grant or remove full access.</p>
        </>
      ) : null}

      {perms.allocator ? (
        <>
          <h3>Pool and draw</h3>
          <div className="zl-row">
            <div>
              <label className="zl-label" htmlFor="zl-pool">Pool size</label>
              <input id="zl-pool" className="zl-input" type="number" min={0} value={cfgForm.poolSize}
                onChange={(e) => setConfig({ ...cfgForm, poolSize: e.target.value })} />
            </div>
            <div>
              <label className="zl-label" htmlFor="zl-cap">Max covers</label>
              <input id="zl-cap" className="zl-input" type="number" min={0} value={cfgForm.maxCap}
                onChange={(e) => setConfig({ ...cfgForm, maxCap: e.target.value })} />
            </div>
            <div>
              <label className="zl-label" htmlFor="zl-days">Draw days before</label>
              <input id="zl-days" className="zl-input" type="number" min={0} value={cfgForm.drawDaysBefore}
                onChange={(e) => setConfig({ ...cfgForm, drawDaysBefore: e.target.value })} />
            </div>
            <div>
              <label className="zl-label" htmlFor="zl-drip">Per day leading up</label>
              <input id="zl-drip" className="zl-input" type="number" min={0} value={cfgForm.dripPerDay}
                onChange={(e) => setConfig({ ...cfgForm, dripPerDay: e.target.value })} />
            </div>
          </div>
          <p className="zl-note">Allocating in advance encourages sales. The pool cannot exceed the max covers.</p>
          <div className="zl-row" style={{ marginTop: 10 }}>
            <button
              className="zl-btn zl-btn--primary"
              type="button"
              onClick={() =>
                void run(
                  () =>
                    zaylistApi.putConfig(eventId, {
                      poolSize: Number(cfgForm.poolSize) || 0,
                      maxCap: Number(cfgForm.maxCap) || 0,
                      drawDaysBefore: cfgForm.drawDaysBefore === "" ? null : Number(cfgForm.drawDaysBefore),
                      dripPerDay: cfgForm.dripPerDay === "" ? null : Number(cfgForm.dripPerDay),
                    }),
                  "Pool saved.",
                )
              }
            >
              Save pool
            </button>
            <div>
              <label className="zl-label" htmlFor="zl-draw-count">Draw count (optional)</label>
              <input id="zl-draw-count" className="zl-input" type="number" min={1} value={drawCount}
                onChange={(e) => setDrawCount(e.target.value)} placeholder="Whole pool" />
            </div>
            <button
              className="zl-btn"
              type="button"
              onClick={() =>
                void run(
                  () => zaylistApi.runDraw(eventId, drawCount ? Number(drawCount) : undefined),
                  "Draw complete. Winners are pending until they accept.",
                )
              }
            >
              Run draw
            </button>
            <button
              className="zl-btn"
              type="button"
              onClick={() => void run(() => zaylistApi.expire(eventId), "Unconfirmed spots returned to the pool.")}
            >
              Expire unconfirmed
            </button>
          </div>
          {payload.draws?.length ? (
            <div className="zl-list">
              {payload.draws.slice(0, 5).map((d) => (
                <div className="zl-person" key={d.id}>
                  <div className="zl-person-main">
                    <div className="zl-person-name">Draw of {new Date(d.createdAt).toLocaleString()}</div>
                    <div className="zl-person-meta">{d.awarded} awarded from {d.eligible} eligible RSVPs</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {perms.editor ? (
        <>
          <h3>Messages</h3>
          <label className="zl-label" htmlFor="zl-general">Message everyone who accepts sees</label>
          <textarea
            id="zl-general"
            className="zl-textarea"
            value={generalBody ?? messagesQuery.data?.generalBody ?? ""}
            onChange={(e) => setGeneralBody(e.target.value)}
            maxLength={2000}
          />
          <label className="zl-label" htmlFor="zl-talent-pick">Talent message</label>
          <select
            id="zl-talent-pick"
            className="zl-select"
            value={talentPick || (messagesQuery.data?.talentMessageId ? String(messagesQuery.data.talentMessageId) : "")}
            onChange={(e) => setTalentPick(e.target.value)}
          >
            <option value="">None</option>
            {(messagesQuery.data?.savedMessages ?? []).map((m) => (
              <option key={m.id} value={m.id}>{m.label || m.body.slice(0, 40)}</option>
            ))}
          </select>
          <div className="zl-row" style={{ marginTop: 10 }}>
            <button
              className="zl-btn zl-btn--primary"
              type="button"
              onClick={() =>
                void run(async () => {
                  await zaylistApi.putMessages(eventId, {
                    generalBody: generalBody ?? messagesQuery.data?.generalBody ?? "",
                    talentMessageId: talentPick === "" ? null : Number(talentPick),
                  });
                  await queryClient.invalidateQueries({ queryKey: ["zaylist-messages", eventId] });
                }, "Messages saved.")
              }
            >
              Save messages
            </button>
          </div>
          <label className="zl-label" htmlFor="zl-saved-label">New saved talent message</label>
          <input id="zl-saved-label" className="zl-input" value={savedLabel} onChange={(e) => setSavedLabel(e.target.value)} placeholder="Label" maxLength={80} />
          <textarea className="zl-textarea" value={savedBody} onChange={(e) => setSavedBody(e.target.value)} placeholder="What talent needs to know" maxLength={2000} style={{ marginTop: 8 }} />
          <div className="zl-row" style={{ marginTop: 8 }}>
            <button
              className="zl-btn"
              type="button"
              disabled={!savedBody.trim()}
              onClick={() =>
                void run(async () => {
                  await zaylistApi.addSavedMessage(eventId, savedLabel.trim(), savedBody.trim());
                  setSavedLabel("");
                  setSavedBody("");
                  await queryClient.invalidateQueries({ queryKey: ["zaylist-messages", eventId] });
                }, "Saved message added.")
              }
            >
              Save talent message
            </button>
          </div>

          <h3>Message the list</h3>
          <textarea
            className="zl-textarea"
            value={broadcastBody}
            onChange={(e) => setBroadcastBody(e.target.value)}
            placeholder="Message to everyone on the list"
            maxLength={2000}
          />
          <div className="zl-row" style={{ marginTop: 8 }}>
            <button
              className="zl-btn"
              type="button"
              disabled={!broadcastBody.trim()}
              onClick={() =>
                void run(async () => {
                  await zaylistApi.broadcast(eventId, broadcastBody.trim());
                  setBroadcastBody("");
                  await queryClient.invalidateQueries({ queryKey: ["zaylist-broadcasts", eventId] });
                }, "Message delivered to guest inboxes.")
              }
            >
              Send to the list
            </button>
          </div>
          {(broadcastsQuery.data?.broadcasts ?? []).slice(0, 3).map((b) => (
            <p className="zl-note" key={b.id}>
              {new Date(b.createdAt).toLocaleString()} · {b.recipientCount} on the list · {b.body}
            </p>
          ))}
        </>
      ) : null}
    </div>
  );
}
