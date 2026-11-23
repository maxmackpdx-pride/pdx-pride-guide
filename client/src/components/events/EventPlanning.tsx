import { useAdultChatAck } from "@/components/AdultContentGate";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { useMyGroupChats } from "@/hooks/useMyGroupChats";
import { useEventChatHistory } from "@/hooks/useEventChatHistory";
import { lazy, Suspense, useRef, useState } from "react";
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
type RideDirection = "arriving" | "departing";
type RideNeed = { username: string; direction: RideDirection; area: string; mine: number };
type RideNeedCardT = { id: number; user: string; photoUrl: string | null; area: string; direction: "arriving" | "departing" | "now"; mine: boolean; sameEvent: boolean; sameAfterz: boolean; circle: string; distanceMi: number | null };
type WhosComingDriver = { user: string; photoUrl: string | null; ridesGiven: number; distanceMi: number | null; locatedAt: number | null; since: number; arrived: boolean };
type WhosComingNeed = { needId: number; area: string; eventId: number | null; direction: string; drivers: WhosComingDriver[] };
type Planning = {
  needs: RideNeed[] | null;
  rideNeeds: RideNeedCardT[] | null;
  attending: boolean;
  homeArea: string | null;

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

type PlanningSection = "all" | "feed" | "gigs" | "rides";

export default function EventPlanning({
  eventId,
  occurrenceDate,
  section = "all",
}: {
  eventId: number;
  occurrenceDate: string;
  section?: PlanningSection;
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
      section={section}
      date={date}
      userId={user?.id}
    />
  );
}

/** I'M COMING: tell the rider, then share a location for their ETA only if already permitted (never prompts). */
async function sayComing(needId: number) {
  const r = await fetch(`/api/ridez/needs/${needId}/coming`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" });
  if (!r.ok) throw new Error("Could not send");
  try {
    const perm = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    if (perm?.state !== "granted") return;
    navigator.geolocation.getCurrentPosition(p => {
      void fetch(`/api/ridez/needs/${needId}/coming/location`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat: p.coords.latitude, lng: p.coords.longitude }) });
    }, () => {}, { maximumAge: 60_000, timeout: 8000 });
  } catch { /* location is optional */ }
}

function MemberLink({ username }: { username: string }) {
  const href = memberProfileHref(username);
  return href ? <Link href={href}>{username}</Link> : <span>{username}</span>;
}

function Pregame({ eventId }: { eventId: number }) {
  const { user } = useAuth();
  const { openSheet } = useInboxSheet();
  const rooms = useMyGroupChats();
  const room = user && !rooms.isError ? rooms.data?.find(item => item.kind === "EVENT" && Number(item.id) === eventId) : undefined;
  const preview = useRef<HTMLDivElement>(null);
  const adult = useAdultChatAck();
  const showPreview = room?.state === "OPEN" && adult;
  const history = useEventChatHistory<{ chatOpen: boolean; messages: { id: number; body: string; displayName?: string; username?: string; isAnonymous?: boolean; isMine?: boolean }[] }>(showPreview ? eventId : null, preview);
  const messages = showPreview && history.data?.chatOpen ? history.data.messages.slice(-3) : [];
  return <section className="event-pregame" aria-label="The Pregame">
    <header><h3>The Pregame</h3><small>Group chat · Inbox</small></header>
    {room ? <button type="button" onClick={event => openSheet({ view: "chats", account: "personal", group: room }, event.currentTarget)}>Open the Pregame</button> :
      rooms.isError ? <button type="button" onClick={() => void rooms.refetch()}>Reload the Pregame</button> :
      <p>{user && rooms.isPending ? "Checking your room…" : "The group chat is for people going to this event."}</p>}
    {messages.length > 0 && <div ref={preview} className="event-pregame__messages" aria-label="Recent messages">
      {messages.map(message => <p key={message.id} data-mine={message.isMine}><strong>{message.isMine ? "You" : message.isAnonymous ? "Anonymous" : message.displayName || message.username || "Member"}</strong>{message.body}</p>)}
    </div>}
  </section>;
}

function PlanningPanel({
  eventId,
  date,
  userId,
  section,
}: {
  eventId: number;
  date: string;
  userId?: number;
  section: PlanningSection;
}) {
  const base = `/api/events/${eventId}/occurrences/${date}/planning`;
  const key = [base, userId ?? null];
  const cache = useQueryClient();
  const query = useQuery<Planning>({
    queryKey: key,
    queryFn: () => apiRequest("GET", base).then((r) => r.json()),
    refetchInterval: userId ? 30_000 : false,
  });
  const [coming, setComing] = useState<ReadonlySet<number>>(() => new Set());
  const [whoOpen, setWhoOpen] = useState(false);
  const [intent, setIntent] = useState<"offer" | "need">("offer");
  const [direction, setDirection] = useState<RideDirection>("arriving");
  const [suggestedArea, setSuggestedArea] = useState("");
  const [compose, setCompose] = useState(false);
  const [auth, setAuth] = useState(false);
  const [atEvent, setAtEvent] = useState(() =>
    new URLSearchParams(location.search).has("night"),
  );
  const memoryKey = "night-tab:" + eventId + ":" + date + ":" + userId;
  const [tab, setTab] = useState(() => {
    const action = new URLSearchParams(location.search).get("night");
    if (action === "rides" || action === "safety") return "rides";
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(memoryKey); } catch { /* storage unavailable */ }
    return saved || "checkin";
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
  const myLaneNeeds = (query.data?.rideNeeds || []).filter(n => n.mine);
  const whoQuery = useQuery<{ needs: WhosComingNeed[] }>({
    queryKey: ["/api/ridez/needs/mine/coming", userId ?? null],
    queryFn: () => apiRequest("GET", "/api/ridez/needs/mine/coming").then((r) => r.json()),
    enabled: !!userId && whoOpen && myLaneNeeds.length > 0,
  });
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
  const matches = (rides || []).filter(ride => (ride.plan && ride.plan.kind !== "carpool" ? "departing" : "arriving") === direction);
  const needs = (query.data.needs || []).filter(need => need.direction === direction);
  const laneNeeds = (query.data.rideNeeds || []).filter(n => n.direction === "now" || n.direction === direction);
  const mine = needs.find(need => need.mine);
  const mayMatch = direction === "arriving" || (!!query.data.checked && query.data.attending && (intent === "offer" || !!query.data.homeArea));
  const ridesPanel = (
    <>
      <h3>Ridez · {query.data.venue}</h3>
      {!userId || !rides ? (
        <button type="button" onClick={() => setAuth(true)}>
          Sign in to coordinate a ride
        </button>
      ) : (
        <>
          <div className="ridez-choices" role="group" aria-label="Ride action">
            <button type="button" aria-pressed={intent === "offer"} onClick={() => setIntent("offer")}>Offer a ride</button>
            <button type="button" aria-pressed={intent === "need"} onClick={() => setIntent("need")}>I need a ride</button>
          </div>
          <div className="ridez-choices" role="group" aria-label="Ride direction">
            <button type="button" aria-pressed={direction === "arriving"} onClick={() => { setSuggestedArea(""); setDirection("arriving"); }}>Going</button>
            <button type="button" aria-pressed={direction === "departing"} onClick={() => { setSuggestedArea(""); setDirection("departing"); }}>Departing</button>
          </div>
          {!mayMatch && <>
            <p>Leaving the event? Ride matching opens for attendees checked in at the venue.</p>
            {query.data.attending && query.data.onSiteWindow && <VenueCheck base={base} eventId={eventId} checked={query.data.checked} visible refresh={() => void query.refetch()}/>}
          </>}
          {intent === "need" && (mine ? <div><p>You need a ride · {mine.area}</p>
            <button type="button" disabled={mutation.isPending} onClick={() => act("DELETE", `/needs/${direction}`)}>Withdraw my ride need</button></div> :
            open && mayMatch && <form key={direction} onSubmit={e => { e.preventDefault(); act("PUT", `/needs/${direction}`, { area: new FormData(e.currentTarget).get("area") }); }}>
              {direction === "arriving" ? <label>Pickup neighborhood<input name="area" minLength={2} maxLength={80} required/></label> : <p>Heading to {query.data.homeArea || "your neighborhood"}</p>}
              <button disabled={mutation.isPending}>Post my ride need</button>
            </form>)}
          {intent === "offer" && needs.filter(need => !need.mine).map(need => <div key={need.username} className="ridez-need-row">
            <p><MemberLink username={need.username}/> needs a ride · {need.area}</p>
            {open && mayMatch && !rides.some(r => r.mine) && <button type="button" onClick={() => { setSuggestedArea(need.area); requestAnimationFrame(() => document.getElementById(`ride-offer-${eventId}-${date}`)?.querySelector<HTMLInputElement>('input[name="area"]')?.focus()); }}>Offer a ride {direction === "arriving" ? "from" : "to"} {need.area}</button>}
          </div>)}
          {laneNeeds.length > 0 && (
            <div className="ridez-need-rail" aria-label="Needs a ride">
              {laneNeeds.map((n) => (
                <div key={n.id} className="ridez-need-card" data-bloom={n.sameAfterz ? "afterz" : n.sameEvent ? "event" : undefined}>
                  <span className="ridez-need-card__tag">NEEDS A RIDE</span>
                  <span className="ridez-need-card__av" aria-hidden="true">{n.photoUrl ? <img src={n.photoUrl} alt="" loading="lazy" /> : n.user.slice(0, 1).toUpperCase()}</span>
                  <span className="ridez-need-card__body">
                    <b>{n.area}</b>
                    <span>{n.mine ? "You" : `@${n.user}`}{n.direction === "departing" ? " · Leaving after" : n.direction === "arriving" ? " · Getting there" : ""}</span>
                    <span className="ridez-need-card__meta">{n.sameEvent ? "GOING TO THIS EVENT" : typeof n.distanceMi === "number" ? `${n.distanceMi < 0.1 ? "<0.1" : n.distanceMi} MI AWAY · RIGHT NOW` : "NEARBY · RIGHT NOW"}</span>
                  </span>
                  {n.mine ? (
                    <button type="button" onClick={() => setWhoOpen(v => !v)} aria-expanded={whoOpen}>WHO'S COMING</button>
                  ) : (
                    <button type="button" disabled={coming.has(n.id)} aria-pressed={coming.has(n.id)} onClick={() => { setComing(s => new Set(s).add(n.id)); void sayComing(n.id).catch(() => setComing(s => { const next = new Set(s); next.delete(n.id); return next; })); }}>{coming.has(n.id) ? "COMING ✓" : "I'M COMING"}</button>
                  )}
                </div>
              ))}
              {whoOpen && myLaneNeeds.length > 0 && (
                <div className="ridez-whos" aria-label="Who's coming for your ride needs">
                  {whoQuery.isLoading ? <p role="status">Checking who's coming…</p> : (whoQuery.data?.needs || []).map(w => (
                    <div key={w.needId} className="ridez-whos__need">
                      <p><b>{w.area}</b> · {w.drivers.length ? `${w.drivers.length} coming` : "No one yet"}</p>
                      {w.drivers.map(d => (
                        <p key={d.user} className="ridez-whos__driver">
                          <span className="ridez-need-card__av" aria-hidden="true">{d.photoUrl ? <img src={d.photoUrl} alt="" loading="lazy" /> : d.user.slice(0, 1).toUpperCase()}</span>
                          @{d.user} · {d.ridesGiven} {d.ridesGiven === 1 ? "ride" : "rides"} given{d.distanceMi != null ? ` · ${d.distanceMi} mi away` : ""}{d.arrived ? " · ARRIVED" : ""}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!matches.length && <p>No {direction === "arriving" ? "arriving" : "departing"} ride offers yet.</p>}
          <ul>
            {matches.map((ride) => (
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
          {open && mayMatch && intent === "offer" && !rides.some((r) => r.mine) && (
            <div id={`ride-offer-${eventId}-${date}`}><RideOfferForm
              key={direction + suggestedArea}
              direction={direction}
              initialArea={suggestedArea || (direction === "departing" ? query.data.homeArea || "" : "")}
              eventId={eventId}
              checked={!!query.data.checked}
              busy={mutation.isPending}
              send={(payload) => act("POST", "/rides", payload)}
            /></div>
          )}
          {mutation.isPending && <p role="status">Updating ride…</p>}
          {mutation.isError && <p role="alert">{mutation.error.message}</p>}
        </>
      )}
    </>
  );
  return (
    <section className="event-planning" aria-label={`Event plans for ${date}`}>
      {(section === "all" || section === "gigs") && <>
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
      </>}
      {(section === "all" || section === "feed") && <>
      <Pregame eventId={eventId}/>
      <button
        type="button"
        className="at-event-launch"
        onClick={() => setAtEvent(true)}
      >
        At the event
      </button>
      <BuddyEvent id={eventId} venue={query.data.venue}/>
      </>}
      {(section === "all" || section === "rides") && !atEvent && ridesPanel}
      {(section === "all" || section === "feed") && atEvent && (
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
          {userId && query.data.onSiteWindow && query.data.gpsAvailable !== false ? (
            <VenueCheck base={base} eventId={eventId} checked={query.data.checked} visible={tab === "checkin"} refresh={() => void query.refetch()} />
          ) : tab === "checkin" && (
            !userId ? <button onClick={() => setAuth(true)}>Sign in to check in</button> :
            <p>{query.data.gpsAvailable === false ? "GPS check-in is unavailable for this venue." :
              "GPS check-in opens 30 minutes before the event and closes 30 minutes after."}</p>
          )}
          {tab === "rides" && ridesPanel}
          {tab === "afterz" && (
            <a href={"/events?invites=1"}>Open Afterz invitations</a>
          )}
        </AtEventDialog>
      )}
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
