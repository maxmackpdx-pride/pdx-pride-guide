import AfterzPrivateLocation from "./AfterzPrivateLocation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import "./invitations.css";

import NightOptions, { defaultOptions, useEligibleAfterzEvents, type EligibleAfterzEvent } from "./NightOptions";
import AroundInvitePopup from "@/components/invites/AroundInvitePopup";

export type Role =
  | "passed"
  | "waitlisted"
  | "guest"
  | "host"
  | "pending"
  | "accepted"
  | "declined"
  | "revoked";
export type Gathering = { hostName: string; id: string; title: string; closesAt: number; role: Role };
type Details = Gathering & {
  hostName: string;
  night?: {
    capacity: number;
    poster: string | null;
    eventId: number;
    occurrence: string;
    sexPositive: number;
    nudityOk: number;
  };
  renewed?: boolean;
  requests?: {
    userId: number;
    name: string;
    status: "pending" | "accepted" | "waitlisted";
    renewed?: number;
  }[];
};
type ChatMessage = { id: number; name: string; body: string };
export const base = "/api/afterz/gatherings";
export const readableStatus: Record<Role, string> = {
  host: "Hosting",
  passed: "Not going",
  guest: "Guest",
  pending: "Requested",
  waitlisted: "On the waitlist",
  accepted: "Accepted",
  declined: "Declined",
  revoked: "Access ended",
};
export function privateRead<T>(url: string, signal: AbortSignal): Promise<T> {
  return fetch(url, {
    signal,
    credentials: "same-origin",
    cache: "no-store",
  }).then(async (response) => {
    if (!response.ok)
      throw Error(
        (await response.json().catch(() => ({}))).error ||
          "Gathering unavailable.",
      );
    return response.json();
  });
}
export function GatheringReport({ id }: { id: string }) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [receipt, setReceipt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (receipt)
    return (
      <p role="status">
        Report #{receipt} received. You can read private replies in your inbox.
      </p>
    );
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)}>
        Report this gathering
      </button>
    );
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy || !body.trim()) return;
        setBusy(true);
        setError("");
        try {
          const result = await apiRequest("POST", "/api/feedback", {
            category: "FEEDBACK",
            severity: "HIGH",
            message: "Afterz gathering report: " + body.trim(),
            pageUrl: "/map?mode=afterz&gathering=" + encodeURIComponent(id),
            inAppReplies: true,
          }).then((response) => response.json());
          setReceipt(result.receiptId);
          setBody("");
          void client.invalidateQueries({
            queryKey: ["/api/me/report-receipts"],
          });
        } catch {
          setError("Could not confirm your report. Please try again.");
        }
        setBusy(false);
      }}
    >
      <label>
        What happened?
        <textarea
          value={body}
          maxLength={1900}
          required
          disabled={busy}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <p>
        The site owner receives your note and this gathering’s link. You can
        read and reply to your report in your personal inbox.
      </p>
      <button disabled={busy || !body.trim()}>
        {busy ? "Sending…" : "Send private report"}
      </button>
      <button type="button" disabled={busy} onClick={() => setOpen(false)}>
        Cancel
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

export function GatheringRoom({
  id,
  signIn,
  done,
  sharePath = "/map",
}: {
  id: string;
  signIn: () => void;
  done: () => void;
  sharePath?: string;
}) {
  const { user } = useAuth(),
    client = useQueryClient(),
    path = base + "/" + encodeURIComponent(id);
  const roomKey = [base, id, user?.id],
    chatKey = [path + "/chat", user?.id];
  const room = useQuery<Details>({
    queryKey: roomKey,
    queryFn: ({ signal }) => privateRead(path, signal),
    refetchInterval: 6_000,
    retry: false,
  });
  const role = room.data?.role;
  const inside = !room.isError && (role === "accepted" || role === "host");
  const chat = useQuery<ChatMessage[]>({
    queryKey: chatKey,
    enabled: inside,
    queryFn: ({ signal }) => privateRead(path + "/chat", signal),
    refetchInterval: inside ? 5_000 : false,
    retry: false,
    gcTime: 0,
  });
  const [confirmed, setConfirmed] = useState(false),
    [message, setMessage] = useState(""),
    [messageKey, setMessageKey] = useState(() => crypto.randomUUID());
  const [working, setWorking] = useState(false),
    [failure, setFailure] = useState(""),
    [notice, setNotice] = useState(""),
    [confirmClose, setConfirmClose] = useState(false),
    [around, setAround] = useState(false);
  useEffect(() => {
    if (!inside) client.removeQueries({ queryKey: chatKey, exact: true });
  }, [inside, id, user?.id, client]);
  const action = async (suffix: string, payload: object) => {
    if (working) return;
    setWorking(true);
    setFailure("");
    setNotice("");
    try {
      await apiRequest("POST", path + suffix, payload);
      if (suffix === "/close") {
        client.removeQueries({ queryKey: [base, id] });
        done();
      }
      if (suffix === "/chat") {
        setMessage("");
        setMessageKey(crypto.randomUUID());
      }
      await Promise.all([
        client.invalidateQueries({ queryKey: [base] }),
        client.invalidateQueries({ queryKey: chatKey }),
        client.invalidateQueries({ queryKey: ["/api/afterz/nights"] }),
      ]);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Could not save. Try again.");
      void room.refetch();
    }
    setWorking(false);
  };
  const [shareLink, setShareLink] = useState("");
  const share = async () => {
    const url = new URL(sharePath, window.location.origin);
    url.search = new URLSearchParams({
      mode: "afterz",
      gathering: id,
    }).toString();
    const title = room.data?.title;
    try {
      if (navigator.share)
        await navigator.share({ title, url: url.href });
      else {
        await navigator.clipboard.writeText(url.href);
        setNotice("Invite link copied.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setShareLink(url.href);
    }
  };
  if (room.isPending) return <p role="status">Opening invitation…</p>;
  if (room.isError || !room.data)
    return (
      <p role="alert">
        {room.error?.message || "Gathering unavailable."}{" "}
        <button onClick={() => void room.refetch()}>Retry</button>
      </p>
    );
  const details = room.data;
  return (
    <section className="afterz-room">
      {details.night?.poster && (
        <img className="afterz-room-poster" src={details.night.poster} alt="" />
      )}
      <h3>{details.title}</h3>
      {details.night && (
        <p>
          {[
            details.night.sexPositive && "Sex positive",
            details.night.nudityOk && "Nudity OK",
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      {role === "waitlisted" && (
        <section>
          <p>Room full. You are on the waitlist.</p>
          <button
            disabled={working || details.renewed}
            onClick={() => void action("/second", {})}
          >
            {details.renewed ? "Second please sent" : "Second please"}
          </button>
          <button disabled={working} onClick={() => void action("/leave", {})}>
            Leave waitlist
          </button>
        </section>
      )}
      <p>
        Hosted by {details.hostName} · Closes{" "}
        {new Date(details.closesAt).toLocaleString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
          timeZone: "America/Los_Angeles",
        })}
      </p>
      {(role === "guest" || role === "passed") &&
        (user ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action("/request", { confirmed18: confirmed });
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                required
              />{" "}
              I am 18 or older. The host will see my request.
            </label>
            <button disabled={!confirmed || working}>Request an invite</button>
          </form>
        ) : (
          <button onClick={signIn}>Sign in to request an invite</button>
        ))}
      {role === "pending" && (
        <p role="status">
          Your request is waiting for the host.{" "}
          <button disabled={working} onClick={() => void action("/leave", {})}>
            Withdraw request
          </button>
        </p>
      )}
      {(role === "declined" || role === "revoked") && (
        <p role="status">
          {role === "declined"
            ? "The host declined your request."
            : "Your access to this gathering has ended."}
        </p>
      )}
      {role === "host" && (
        <>
          <button type="button" onClick={() => void share()}>
            Share invite link
          </button>
          {details.night && (
            <button type="button" onClick={() => setAround(true)}>
              Invite people around you
            </button>
          )}
          {shareLink && (
            <label>
              Invite link
              <input
                value={shareLink}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
              />
            </label>
          )}
          {details.night && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action("/capacity", {
                  capacity: Number(
                    new FormData(e.currentTarget).get("capacity"),
                  ),
                });
              }}
            >
              <label>
                Guest spots
                <input
                  key={details.night.capacity}
                  name="capacity"
                  type="number"
                  required
                  min={1}
                  max={500}
                  defaultValue={details.night.capacity}
                />
              </label>
              <button disabled={working}>Update room</button>
            </form>
          )}
          <h4>Guest requests</h4>
          {details.requests?.length ? (
            details.requests.map((guest) => (
              <div className="afterz-guest" key={guest.userId}>
                <span>
                  {guest.name} · {readableStatus[guest.status]}
                  {guest.renewed ? " · Second please" : ""}
                </span>
                {guest.status !== "accepted" && (
                  <button
                    disabled={working}
                    onClick={() =>
                      void action("/guests/" + guest.userId, {
                        status: "accepted",
                      })
                    }
                  >
                    Accept
                  </button>
                )}
                <button
                  disabled={working}
                  onClick={() =>
                    void action("/guests/" + guest.userId, {
                      status:
                        guest.status === "accepted" ? "revoked" : "declined",
                    })
                  }
                >
                  {guest.status === "accepted" ? "Remove guest" : "Decline"}
                </button>
              </div>
            ))
          ) : (
            <p>No guest requests yet.</p>
          )}
        </>
      )}
      {inside && (
        <>
          <h4>Private group chat</h4>
          <AfterzPrivateLocation path={path} host={role==="host"} userId={user!.id}/>
          <p>
            Visible to the host and accepted guests until the gathering closes.
          </p>
          {chat.isError ? (
            <p role="alert">
              Conversation unavailable.{" "}
              <button
                onClick={() => void room.refetch().then(() => chat.refetch())}
              >
                Retry
              </button>
            </p>
          ) : chat.isPending ? (
            <p role="status">Loading messages…</p>
          ) : chat.data?.length ? (
            <ol className="afterz-chat">
              {chat.data.map((m) => (
                <li key={m.id}>
                  <strong>{m.name}</strong> {m.body}
                </li>
              ))}
            </ol>
          ) : (
            <p>No messages yet.</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action("/chat", { body: message, requestId: messageKey });
            }}
          >
            <label>
              Message
              <textarea
                maxLength={1000}
                value={message}
                disabled={working}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setMessageKey(crypto.randomUUID());
                }}
                required
              />
            </label>
            <button disabled={!message.trim() || working || chat.isError}>
              Send to group
            </button>
          </form>
          {role === "accepted" && (
            <button
              disabled={working}
              onClick={() => void action("/leave", {})}
            >
              Leave gathering
            </button>
          )}
          {role === "host" &&
            (confirmClose ? (
              <div>
                <p>Close the gathering and erase its chat for everyone?</p>
                <button
                  disabled={working}
                  onClick={() => void action("/close", {})}
                >
                  Close gathering
                </button>{" "}
                <button onClick={() => setConfirmClose(false)}>
                  Keep open
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmClose(true)}>
                End gathering…
              </button>
            ))}
        </>
      )}
      {user && <GatheringReport id={id} />}
      {failure && <p role="alert">{failure.replace(/^\d+:\s*/, "")}</p>}
      {notice && <p role="status">{notice}</p>}
      {around && details.night && (
        <AroundInvitePopup
          gatheringId={id}
          eventId={details.night.eventId}
          title={details.title}
          onClose={() => setAround(false)}
        />
      )}
    </section>
  );
}
export function HostForm({ select, eventId, occurrence }: { select: (id: string) => void; eventId?: number; occurrence?: string | null }) {
  const events = useEligibleAfterzEvents();
  if (eventId && events.isPending) return <p role="status">Opening host form…</p>;
  if (eventId && events.isError) return <p role="alert">Could not check this event. <button onClick={() => void events.refetch()}>Retry</button></p>;
  const event = eventId ? events.data?.find(item => item.id === eventId && item.date === occurrence) ?? null : undefined;
  return <GatheringForm select={select} event={event}/>;
}
function GatheringForm({ select, event }: { select: (id: string) => void; event?: EligibleAfterzEvent | null }) {
  const client = useQueryClient();
  const [title, setTitle] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [options, setOptions] = useState(() => event ? { ...defaultOptions, eventId: event.id, occurrence: event.date } : defaultOptions),
    [uploading, setUploading] = useState(false);
  const [key, setKey] = useState(() => crypto.randomUUID());
  return (
        <form className="afterz-host-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              const { id } = await apiRequest("POST", base, {
                ...options,
                title,
                confirmed18: confirmed,
                requestId: key,
              }).then((r) => r.json());
              await Promise.all([client.invalidateQueries({ queryKey: [base] }), client.invalidateQueries({ queryKey: ["/api/afterz/nights"] })]);
              select(id);
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Could not create the gathering.",
              );
            }
            setBusy(false);
          }}
        >
          <label>
            Gathering title
            <input
              value={title}
              maxLength={80}
              required
              onChange={(e) => {
                setTitle(e.target.value);
                setKey(crypto.randomUUID());
              }}
            />
          </label>
          <NightOptions
            scopedTitle={event === undefined ? undefined : event?.title ?? null}
            options={options}
            onChange={setOptions}
            onUploading={setUploading}
          />
          {!options.eventId && (
            <p>
              People with your invite link can see the title and your name. Keep
              addresses out of the title. Guest requests and chat close at 6 AM
              Pacific.
            </p>
          )}
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              required
            />{" "}
            I am 18 or older.
          </label>
          <button disabled={busy || uploading || !confirmed || !title.trim()}>
            {busy ? "Creating…" : "Create invite link"}
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
  );
}
