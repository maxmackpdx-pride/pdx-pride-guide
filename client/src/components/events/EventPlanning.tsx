import { lazy, Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { pacificCalendarDate } from "@shared/missedConnections";
import { useAuth } from "@/context/AuthContext";
import { memberProfileHref } from "@/lib/avatarLinks";
import AuthModal from "@/components/AuthModal";
import { apiRequest } from "@/lib/queryClient";
import "./EventPlanning.css";
import {BuddyEvent} from "../outz/BuddyHosting";
import {
  AtEventDialog,
  VenueCheck,
  RideHologram,
  RideOfferForm,
  RideSafety,
  type RideDescriptor,
} from "./NightRideTools";

const Composer = lazy(() =>
  import("@/pages/PrideWork").then((m) => ({ default: m.GigComposer })),
);
type Ride = {
  plan: RideDescriptor | null;
  faces: { username: string; photoUrl: string | null }[];
  id: number;
  area: string;
  driver: string;
  remaining: number;
  mine: boolean;
  myRequest: 0 | 1 | null;
  requests: { id: number; username: string; accepted: number }[];
};
type Planning = {
  checked: boolean;
  onSiteWindow: boolean;
  gpsAvailable?: boolean;
  poster: string | null;
  venue: string;
  title: string;
  open: boolean;
  canPostGig: boolean;
  gigs: { id: number; title: string }[];
  rides: Ride[] | null;
};

export default function EventPlanning({
  eventId,
  occurrenceDate,
}: {
  eventId: number;
  occurrenceDate: string;
}) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate)
    ? occurrenceDate
    : pacificCalendarDate(occurrenceDate);
  const { user } = useAuth();
  if (!date || !Number.isSafeInteger(eventId) || eventId <= 0) return null;
  return (
    <PlanningPanel
      key={JSON.stringify([eventId, date, user?.id])}
      eventId={eventId}
      date={date}
      userId={user?.id}
    />
  );
}

function MemberLink({ username }: { username: string }) {
  const href = memberProfileHref(username);
  return href ? <Link href={href}>{username}</Link> : <span>{username}</span>;
}

function PlanningPanel({
  eventId,
  date,
  userId,
}: {
  eventId: number;
  date: string;
  userId?: number;
}) {
  const base = `/api/events/${eventId}/occurrences/${date}/planning`;
  const key = [base, userId ?? null];
  const cache = useQueryClient();
  const query = useQuery<Planning>({
    queryKey: key,
    queryFn: () => apiRequest("GET", base).then((r) => r.json()),
    refetchInterval: userId ? 30_000 : false,
  });
  const [compose, setCompose] = useState(false);
  const [auth, setAuth] = useState(false);
  const [atEvent, setAtEvent] = useState(() =>
    new URLSearchParams(location.search).has("night"),
  );
  const memoryKey = "night-tab:" + eventId + ":" + date + ":" + userId;
  const [tab, setTab] = useState(() => {
    const action = new URLSearchParams(location.search).get("night");
    if (action === "rides" || action === "safety") return "rides";
    try {
      return sessionStorage.getItem(memoryKey) || "checkin";
    } catch {
      return "checkin";
    }
  });
  const choose = (value: string) => {
    setTab(value);
    try {
      sessionStorage.setItem(memoryKey, value);
    } catch {
      /* session storage unavailable */
    }
  };
  const mutation = useMutation({
    mutationFn: ({
      method,
      path,
      data,
    }: {
      method: string;
      path: string;
      data?: unknown;
    }) => apiRequest(method, base + path, data),
    onSuccess: async (_, { path }) => {
      await cache.invalidateQueries({ queryKey: key });
    },
    onError: () => {
      void cache.invalidateQueries({ queryKey: key });
    },
  });
  const act = (method: string, path: string, data?: unknown) =>
    mutation.mutate({ method, path, data });
  if (query.isLoading) return <p role="status">Loading event plans…</p>;
  if (!query.data || query.isError)
    return (
      <p role="alert">
        Event plans are unavailable.{" "}
        <button type="button" onClick={() => query.refetch()}>
          Try again
        </button>
      </p>
    );
  const { gigs, rides, open, canPostGig, title } = query.data;
  const ridesPanel = (
    <>
      <h3>Carpools {rides && <span>({rides.length})</span>}</h3>
      {!userId || !rides ? (
        <button type="button" onClick={() => setAuth(true)}>
          Sign in to coordinate a ride
        </button>
      ) : (
        <>
          {!rides.length && <p>No ride offers for this occurrence.</p>}
          <ul>
            {rides.map((ride) => (
              <li key={ride.id}>
                {ride.plan && (
                  <RideHologram
                    plan={ride.plan}
                    remaining={ride.remaining}
                    faces={ride.faces}
                  />
                )}
                <strong>{ride.area}</strong> · {ride.remaining}{" "}
                {ride.remaining === 1 ? "seat" : "seats"} available ·{" "}
                <MemberLink username={ride.driver} />
                {ride.plan && (
                  <p>
                    {ride.plan.kind === "home"
                      ? "Ride home"
                      : ride.plan.kind === "afterz"
                        ? "Afterz ride"
                        : "Carpool"}
                    {ride.plan.meeting && " · Meet at " + ride.plan.meeting}
                    {ride.plan.oneWay && " · One way"}
                  </p>
                )}
                {ride.mine &&
                  ride.plan &&
                  !ride.plan.departed &&
                  ride.faces.length >= 2 && (
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() =>
                        act("POST", "/rides/" + ride.id + "/depart", {
                          metTogether: true,
                        })
                      }
                    >
                      We’re together · start group ride
                    </button>
                  )}
                {(ride.myRequest === 1 || ride.mine) && ride.plan && (
                  <RideSafety base={base} ride={ride.id} />
                )}
                {ride.mine ? (
                  <>
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() => act("DELETE", `/rides/${ride.id}`)}
                    >
                      Remove my offer
                    </button>
                    {ride.requests.map((r) => (
                      <div key={r.id}>
                        <MemberLink username={r.username} /> ·{" "}
                        {r.accepted ? "Confirmed" : "Requested"}
                        {!r.accepted && open && ride.remaining > 0 && (
                          <button
                            type="button"
                            disabled={mutation.isPending}
                            onClick={() =>
                              act("PUT", `/rides/${ride.id}/requests/${r.id}`)
                            }
                          >
                            Accept request
                          </button>
                        )}
                        {!r.accepted && (
                          <button
                            type="button"
                            disabled={mutation.isPending}
                            onClick={() =>
                              act(
                                "DELETE",
                                `/rides/${ride.id}/requests/${r.id}`,
                              )
                            }
                          >
                            Decline request
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                ) : ride.myRequest !== null ? (
                  <div>
                    {ride.myRequest ? "Seat confirmed" : "Seat requested"}
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() =>
                        act("DELETE", `/rides/${ride.id}/requests/me`)
                      }
                    >
                      Withdraw
                    </button>
                  </div>
                ) : (
                  open &&
                  ride.remaining > 0 && (
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() => act("POST", `/rides/${ride.id}/requests`)}
                    >
                      Request a seat
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
          {open && !rides.some((r) => r.mine) && (
            <RideOfferForm
              eventId={eventId}
              checked={!!query.data.checked}
              busy={mutation.isPending}
              send={(payload) => act("POST", "/rides", payload)}
            />
          )}
          {mutation.isPending && <p role="status">Updating ride…</p>}
          {mutation.isError && <p role="alert">{mutation.error.message}</p>}
        </>
      )}
    </>
  );
  return (
    <section className="event-planning" aria-label={`Event plans for ${date}`}>
      <h3>
        Gigz <span>({gigs.length})</span>
      </h3>
      {gigs.length ? (
        <ul>
          {gigs.map((g) => (
            <li key={g.id}>
              <Link href={`/gigz?post=${g.id}`}>{g.title}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No gigs linked to this occurrence.</p>
      )}
      {canPostGig && (
        <button type="button" onClick={() => setCompose(true)}>
          Post a gig for this event
        </button>
      )}
      {compose && canPostGig && (
        <Suspense fallback={<p role="status">Opening gig form…</p>}>
          <Composer
            eventLink={{ eventId, occurrenceDate: date }}
            prefill={{ title: `Gig at ${title}`, gigDate: date }}
            onClose={() => setCompose(false)}
            onPosted={() => {
              setCompose(false);
              void query.refetch();
            }}
          />
        </Suspense>
      )}
      <button
        type="button"
        className="at-event-launch"
        onClick={() => setAtEvent(true)}
      >
        At the event
      </button>
      <BuddyEvent id={eventId} venue={query.data.venue}/>
      {!atEvent && ridesPanel}
      {atEvent && (
        <AtEventDialog
          poster={query.data.poster}
          title={title}
          onClose={() => setAtEvent(false)}
        >
          <nav aria-label="Event actions">
            {[
              ["checkin", "At the venue"],
              ["rides", "Carpools & rides home"],
              ["afterz", "Afterz"],
            ].map(([value, label]) => (
              <button
                type="button"
                aria-pressed={tab === value}
                key={value}
                onClick={() => choose(value)}
              >
                {label}
              </button>
            ))}
          </nav>
          {tab === "checkin" &&
            (userId ? (
              query.data.gpsAvailable === false ? (
                <p>GPS check-in is unavailable for this venue.</p>
              ) : query.data.onSiteWindow ? (
                <VenueCheck
                  base={base}
                  eventId={eventId}
                  checked={query.data.checked}
                  refresh={() => void query.refetch()}
                />
              ) : (
                <p>
                  GPS check-in opens 30 minutes before the event and closes 30
                  minutes after.
                </p>
              )
            ) : (
              <button onClick={() => setAuth(true)}>Sign in to check in</button>
            ))}
          {tab === "rides" && ridesPanel}
          {tab === "afterz" && (
            <a href={"/events?invites=1"}>Open Afterz invitations</a>
          )}
        </AtEventDialog>
      )}
      <footer>Events are organized by their hosts. Zaylist is not responsible for independently hosted activities. <Link href="/legal">Read the event terms</Link>.</footer>
      {auth && (
        <AuthModal
          defaultTab="login"
          portalTargetSelector={atEvent ? ".at-event-dialog[open]" : "dialog[open]"}
          onClose={() => setAuth(false)}
        />
      )}
    </section>
  );
}
