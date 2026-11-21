import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { FormCard, type FormCardField, type FormCardValues } from "@/components/cards/FormCard";
import type { OriginRect } from "@/components/cards/flipCard";

/**
 * RidezFormCard (owner, Nov 20): the expanded Ridez form behind OFFER A RIDE
 * and I NEED A RIDE. Shared path for the event card (#115) and the Ridez
 * drawer (#117). From an event card the event is preselected (no picker);
 * mode presets offer vs need; the Arriving / Departing choice stays.
 * Existing carpool APIs only (no new endpoint):
 *  offer -> POST {planning}/rides {area, seats, kind: carpool|home, meeting, leaveBy, oneWay}
 *  need  -> POST {planning}/needs {direction, area} (a NEEDS A RIDE card), then optionally
 *           POST {planning}/rides/:ride/requests (a seat on an offered ride)
 */
import { rideDirectionOf, ridezOfferBody, ridezPlanningBase, type RidezDirection, type RidezFormRide, type RidezMode } from "@/lib/ridezForm";
export { rideDirectionOf, ridezLeaveBy, ridezOfferBody, ridezPlanningBase, type RidezDirection, type RidezFormRide, type RidezMode } from "@/lib/ridezForm";

function rideOption(r: RidezFormRide) {
  const t = typeof r.plan?.leaveBy === "number" ? new Date(r.plan.leaveBy).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" }) : "open time";
  const seats = r.remaining ?? 0;
  return { value: String(r.id), label: `${rideDirectionOf(r) === "departing" ? "DEPARTING" : "ARRIVING"} · ${r.area ?? "Ride"} · ${t} · ${seats} seat${seats === 1 ? "" : "s"}` };
}

async function send(path: string, body?: unknown) {
  const r = await fetch(path, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { error?: string }).error || "Could not send. Try again.");
  return data;
}

type Props = {
  mode: RidezMode;
  direction?: RidezDirection;
  eventId: number;
  eventTitle: string;
  /** YYYY-MM-DD (or the occurrence dateStart). */
  occurrenceDate: string;
  eventStart?: string | null;
  venueName: string;
  rides?: RidezFormRide[] | null;
  origin?: OriginRect | null;
  onClose: () => void;
  onDone?: () => void;
};

export function RidezFormCard({ mode, direction = "arriving", eventId, eventTitle, occurrenceDate, eventStart, venueName, rides, origin, onClose, onDone }: Props) {
  const { user } = useAuth();
  const [auth, setAuth] = useState(false);
  const base = ridezPlanningBase(eventId, occurrenceDate);
  const directionField: FormCardField = { name: "direction", label: "Arriving or departing", kind: "select", required: true, defaultValue: direction,
    options: [{ value: "arriving", label: `ARRIVING · to ${venueName}` }, { value: "departing", label: `DEPARTING · from ${venueName}` }] };
  const open = (rides ?? []).filter(r => !r.mine && (r.remaining ?? 0) > 0);
  const fields: FormCardField[] = mode === "offer" ? [
    directionField,
    { name: "area", label: "Neighborhood you leave from", required: true, minLength: 2, maxLength: 80, placeholder: "Alberta, Sellwood, downtown…" },
    { name: "meeting", label: "Public meeting place", required: true, minLength: 2, maxLength: 100, placeholder: "Corner of NE 15th & Alberta" },
    { name: "seats", label: "Passenger seats", kind: "select", required: true, defaultValue: "3",
      options: [2, 3, 4, 5, 6, 7, 8].map(n => ({ value: String(n), label: `${n} seats` })) },
    { name: "leaveTime", label: "Leave-by time", kind: "time", hint: "Arriving rides can skip it (one way). Rides home need one." },
  ] : [
    directionField,
    { name: "area", label: "Neighborhood you're in", required: true, minLength: 2, maxLength: 80, placeholder: "Alberta, Pearl, Sellwood…" },
    { name: "ride", label: "Ask for a seat too", kind: "select", defaultValue: "",
      options: [{ value: "", label: open.length ? "No, just post that I need a ride" : rides == null ? "Sign in to see rides" : "No rides offered yet" }, ...open.map(rideOption)] },
  ];
  const gate = !user ? (
    <div className="zform-gate">
      <p className="zform-intro">Sign in to {mode === "offer" ? "offer a ride" : "ask for a seat"}. Your answers stay right here.</p>
      <button type="button" className="obtn obtn--accent" onClick={() => setAuth(true)}>SIGN IN</button>
      {auth && <AuthModal onClose={() => setAuth(false)} />}
    </div>
  ) : undefined;
  const submit = async (v: FormCardValues) => {
    if (mode === "offer") {
      await send(base + "/rides", ridezOfferBody(v, occurrenceDate, eventStart));
    } else {
      // A NEEDS A RIDE card for this event (and anyone within 2 mi right now), then an optional seat request.
      await send(base + "/needs", { direction: v.direction === "departing" ? "departing" : "arriving", area: String(v.area || "").trim() });
      const ride = v.ride ? open.find(r => String(r.id) === String(v.ride)) : undefined;
      if (v.ride && !ride) throw new Error("That ride is no longer available. Your need is posted.");
      if (ride) {
        if (rideDirectionOf(ride) !== v.direction) throw new Error(`Your need is posted. That ride is ${rideDirectionOf(ride)}; pick a ${v.direction} ride to ask for a seat.`);
        await send(`${base}/rides/${ride.id}/requests`);
      }
    }
    onDone?.();
  };
  return (
    <FormCard key={`${mode}-${open.length}`} draftKey={`ridez-${mode}:${eventId}:${occurrenceDate.slice(0, 10)}`} logo="ridez-pending" accent="var(--neon-orange)" origin={origin}
      kicker={mode === "offer" ? "OFFER A RIDE" : "I NEED A RIDE"} title={eventTitle.toUpperCase()}
      intro={<p>{mode === "offer" ? `Drive people to or from ${venueName}. Riders request a seat; you accept who rides.` : `Post that you need a ride to or from ${venueName}. People going and drivers nearby see it in Ridez.`}</p>}
      fields={fields} submitLabel={mode === "offer" ? "POST RIDE" : "POST I NEED A RIDE"} gate={gate} onClose={onClose}
      success={mode === "offer" ? { title: "Ride posted", body: "It's on this event's carpool rail. Seat requests land in Ridez." } : { title: "Posted", body: "You're on the Ridez rail as NEEDS A RIDE. Seat requests go to the driver." }}
      onSubmit={submit} />
  );
}

export default RidezFormCard;
