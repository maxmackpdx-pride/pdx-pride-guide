import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import {
  base,
  privateRead,
  type Gathering,
} from "@/components/afterz/AfterzInvitations";
import InvitePopup from "./InvitePopup";

type Details = Gathering & {
  night?: {
    capacity: number;
    poster: string | null;
    eventId: number;
    occurrence: string;
    sexPositive: number;
    nudityOk: number;
  };
  renewed?: boolean;
};

/**
 * The Afterz "You've been invited" pop-up face, rendered in the Afterz
 * drawer sheet in place of the room while the invite is still a decision
 * (guest / passed / pending / waitlisted / declined / revoked / accepted).
 * Hosts and accepted guests who open the room get GatheringRoom as before.
 * Every action is the room's own endpoint:
 *   I want to come -> POST /api/afterz/gatherings/:id/request {confirmed18}
 *   Pass           -> POST /api/afterz/gatherings/:id/leave {pass:true}
 *   Withdraw/Leave -> POST /api/afterz/gatherings/:id/leave {}
 *   Second please  -> POST /api/afterz/gatherings/:id/second {}
 *   Remind me      -> PUT  /api/afterz/consent/:eventId {source:"rsvp", enabled:true}
 *                     (the same opt-in NightConsent uses; it is what makes
 *                     the server message you when the night starts)
 */
export default function AfterzInviteFace({
  id,
  onOpenRoom,
  onChanged,
}: {
  id: string;
  onOpenRoom: () => void;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const client = useQueryClient();
  const path = base + "/" + encodeURIComponent(id);
  const room = useQuery<Details>({
    queryKey: [base, id, user?.id],
    queryFn: ({ signal }) => privateRead(path, signal),
    refetchInterval: 6_000,
    retry: false,
  });
  const [confirmed, setConfirmed] = useState(false);
  const [reminded, setReminded] = useState(false);
  const [working, setWorking] = useState(false);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");

  if (room.isPending) return <p role="status">Opening invitation…</p>;
  if (room.isError || !room.data)
    return (
      <p role="alert">
        {room.error?.message || "Gathering unavailable."}{" "}
        <button onClick={() => void room.refetch()}>Retry</button>
      </p>
    );
  const details = room.data;
  const role = details.role;

  const act = async (suffix: string, payload: object) => {
    if (working) return;
    setWorking(true);
    setFailure("");
    setNotice("");
    try {
      await apiRequest("POST", path + suffix, payload);
      await Promise.all([
        client.invalidateQueries({ queryKey: [base] }),
        client.invalidateQueries({ queryKey: ["/api/afterz/nights"] }),
      ]);
      onChanged();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Could not save. Try again.");
      void room.refetch();
    }
    setWorking(false);
  };
  const remind = async () => {
    if (working || !details.night) return;
    setWorking(true);
    setFailure("");
    try {
      await apiRequest("PUT", "/api/afterz/consent/" + details.night.eventId, {
        source: "rsvp",
        enabled: true,
      });
      setReminded(true);
      setNotice("We'll remind you when the night starts.");
    } catch {
      setFailure("Could not save the reminder. Try again.");
    }
    setWorking(false);
  };

  const closes = new Date(details.closesAt).toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: "America/Los_Angeles",
  });
  const fromLine = (
    <>
      Hosted by <strong>{details.hostName}</strong> · Closes {closes}
    </>
  );
  const notes = (
    <>
      {failure ? (
        <p className="inv-pop-error" role="alert">
          {failure.replace(/^\d+:\s*/, "")}
        </p>
      ) : null}
      {notice ? <p className="inv-pop-note" role="status">{notice}</p> : null}
    </>
  );
  const remindButton = details.night ? (
    <button
      type="button"
      className="inv-pop-btn"
      disabled={working || reminded}
      onClick={() => void remind()}
    >
      {reminded ? "Reminder set" : "Remind me"}
    </button>
  ) : null;

  if (role === "accepted") {
    return (
      <InvitePopup
        variant="afterz"
        kicker="You're in"
        title={details.title}
        imageUrl={details.night?.poster}
        fromLine={fromLine}
        hook="Meeting point is shared in the room."
      >
        {notes}
        <div className="inv-pop-actions">
          <button type="button" className="inv-pop-btn inv-pop-btn-primary" onClick={onOpenRoom}>
            Open the room
          </button>
        </div>
      </InvitePopup>
    );
  }
  if (role === "pending") {
    return (
      <InvitePopup variant="afterz" title={details.title} imageUrl={details.night?.poster} fromLine={fromLine} hook="Your request is waiting for the host.">
        {notes}
        <div className="inv-pop-actions">
          {remindButton}
          <button type="button" className="inv-pop-btn inv-pop-btn-ghost" disabled={working} onClick={() => void act("/leave", {})}>
            Withdraw request
          </button>
        </div>
      </InvitePopup>
    );
  }
  if (role === "waitlisted") {
    return (
      <InvitePopup variant="afterz" title={details.title} imageUrl={details.night?.poster} fromLine={fromLine} hook="Room full. You are on the waitlist.">
        {notes}
        <div className="inv-pop-actions">
          <button
            type="button"
            className="inv-pop-btn inv-pop-btn-primary"
            disabled={working || details.renewed}
            onClick={() => void act("/second", {})}
          >
            {details.renewed ? "Second please sent" : "Second please"}
          </button>
          <button type="button" className="inv-pop-btn inv-pop-btn-ghost" disabled={working} onClick={() => void act("/leave", {})}>
            Leave waitlist
          </button>
        </div>
      </InvitePopup>
    );
  }
  if (role === "declined" || role === "revoked") {
    return (
      <InvitePopup variant="afterz" title={details.title} imageUrl={details.night?.poster} fromLine={fromLine}>
        {notes}
        <p className="inv-pop-note" role="status">
          {role === "declined"
            ? "The host declined your request."
            : "Your access to this gathering has ended."}
        </p>
      </InvitePopup>
    );
  }
  // guest or passed: the ask state, with the design's three Yes states in
  // reach — Remind me, I want to come, and (after the host says yes) You're in.
  return (
    <InvitePopup
      variant="afterz"
      title={details.title}
      imageUrl={details.night?.poster}
      fromLine={fromLine}
      hook="Meeting point shared once you're in."
    >
      {role === "passed" ? <p className="inv-pop-note">You passed on this one. You can still ask.</p> : null}
      {notes}
      <label className="inv-pop-confirm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          required
        />
        <span>I am 18 or older. The host will see my request.</span>
      </label>
      <div className="inv-pop-actions">
        <button
          type="button"
          className="inv-pop-btn inv-pop-btn-primary"
          disabled={!confirmed || working}
          onClick={() => void act("/request", { confirmed18: true })}
        >
          I want to come
        </button>
        {remindButton}
        {role === "guest" ? (
          <button type="button" className="inv-pop-btn inv-pop-btn-ghost" disabled={working} onClick={() => void act("/leave", { pass: true })}>
            Pass
          </button>
        ) : null}
      </div>
    </InvitePopup>
  );
}
