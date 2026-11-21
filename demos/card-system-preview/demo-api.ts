/** Private, offline preview. The public event is real. Every profile, ride,
 * RSVP, meeting place and message in this file is fictional. No request leaves it. */
export const DEMO_NOW = Date.parse("2026-11-29T22:00:00-08:00");
const closesAt = Date.parse("2026-11-30T06:00:00-08:00");
export const DEMO_EVENT = {
  id: 2022,
  title: "Yes Coach: 3-Year Anniversary",
  venueName: "Sanctuary Club",
  address: "33 NW 9th Ave, Portland, OR 97209",
  occurrence: "2026-11-29",
  dateStart: "2026-11-29T18:00:00",
  dateEnd: "2026-11-29T23:00:00",
  dayOfWeek: "SUN",
  description:
    "Yes Coach celebrates three years at Sanctuary Club. DJ Bro Hoe calls the plays on the dance floor. $15 presale / $25 door.",
  admission: "TICKETED",
  ageRequirement: "21_PLUS",
  ticketUrl: "https://members.pdxsanctuary.com/events/99948",
  isPublic: true,
  isPrivate: false,
  isSexPositive: true,
  status: "LIVE",
  accentColor: "#FF0000",
  posterImageUrl: "/uploads/poster-1794884597673-baxgbj3s0r9.jpg",
} as const;

export const DEMO_PERSONAS = [
  { id: "member", label: "Member · Jules Finch" },
  { id: "host", label: "Host · Rowan Vale" },
  { id: "guest", label: "Guest · signed out" },
] as const;
export type DemoPersona = (typeof DEMO_PERSONAS)[number]["id"];
const member = 901,
  host = 902,
  moss = 903,
  arden = 904,
  kit = 905,
  remy = 906;
const names: Record<number, [string, string]> = {
  [member]: ["Jules Finch", "demo-jules"],
  [host]: ["Rowan Vale", "demo-rowan"],
  [moss]: ["Moss Bell", "demo-moss"],
  [arden]: ["Arden West", "demo-arden"],
  [kit]: ["Kit Rain", "demo-kit"],
  [remy]: ["Remy Sol", "demo-remy"],
};
const gatheringBase = "/api/afterz/gatherings";
const planningBase =
  "/api/events/" + DEMO_EVENT.id + "/occurrences/" + DEMO_EVENT.occurrence + "/planning";
const storeKey = "zaylist.card-system.preview.fixtures.v1";
type Role =
  "guest" | "host" | "pending" | "accepted" | "waitlisted" | "declined" | "revoked" | "passed";
type Direction = "arriving" | "departing";
type Kind = "home" | "afterz" | "carpool";
type Pin = { address: string; lat: number | null; lng: number | null };
type Guest = { id: number; status: Role; renewed?: boolean };
type Room = {
  id: string;
  title: string;
  host: number;
  linked: boolean;
  capacity: number;
  vibe: string;
  sexPositive: boolean;
  nudityOk: boolean;
  glow: boolean;
  poster: string | null;
  guests: Guest[];
  pin: Pin | null;
  requestId?: string;
  chat: { id: number; author: number; body: string; key: string }[];
};
type Ride = {
  id: number;
  driver: number;
  area: string;
  seats: number;
  kind: Kind;
  meeting: string;
  leaveBy: number | null;
  oneWay: boolean;
  fixtureTime?: boolean;
  departed: boolean;
  gathering?: string;
  requests: { id: number; accepted: 0 | 1 }[];
};
type State = {
  version: 1;
  persona: DemoPersona;
  next: number;
  adult: number[];
  present: Record<number, string>;
  rooms: Room[];
  rides: Ride[];
  needs: { user: number; direction: Direction; area: string }[];
  watches: { ride: number; user: number; dueAt: number }[];
  consent: Record<string, boolean>;
  reports: { receiptId: number; user: number; message: string }[];
};
function fixtures(): State {
  const basic = {
    linked: true,
    sexPositive: false,
    nudityOk: false,
    glow: false,
    poster: null,
  };
  const ride = {
    fixtureTime: true,
    oneWay: false,
    departed: false,
    leaveBy: DEMO_NOW + 55 * 60000,
  };
  return {
    version: 1,
    persona: "member",
    next: 1000,
    adult: [member, host, moss, arden, kit, remy],
    present: {
      [member]: "Kerns",
      [host]: "Kerns",
      [moss]: "Kerns",
      [arden]: "Kerns",
      [kit]: "Kerns",
      [remy]: "Sellwood",
    },
    rooms: [
      {
        ...basic,
        id: "demo-lantern-room",
        title: "The Lantern Room",
        host,
        capacity: 6,
        vibe: "social",
        glow: true,
        guests: [
          { id: kit, status: "pending" },
          { id: remy, status: "accepted" },
        ],
        chat: [
          {
            id: 101,
            author: host,
            body: "Tea is on. The listening corner is yours.",
            key: "seed-lantern",
          },
        ],
        pin: {
          address: "Lantern Room · blue doorway in the fictional demo courtyard",
          lat: null,
          lng: null,
        },
      },
      {
        ...basic,
        id: "demo-side-b",
        title: "Side B Listening Club",
        host: moss,
        capacity: 4,
        vibe: "chill",
        guests: [
          { id: member, status: "accepted" },
          { id: host, status: "accepted" },
          { id: arden, status: "accepted" },
        ],
        chat: [
          {
            id: 102,
            author: moss,
            body: "Bring a favorite track. I’ll take the first side.",
            key: "seed-sideb",
          },
        ],
        pin: {
          address: "Side B · upstairs studio in the fictional demo courtyard",
          lat: null,
          lng: null,
        },
      },
      {
        ...basic,
        id: "demo-night-kitchen",
        title: "Night Kitchen",
        host: arden,
        capacity: 1,
        vibe: "social",
        guests: [
          { id: remy, status: "accepted" },
          { id: member, status: "waitlisted" },
        ],
        chat: [],
        pin: null,
      },
      {
        ...basic,
        id: "demo-private-tea",
        title: "Tea for Three",
        host: host,
        linked: false,
        capacity: 3,
        vibe: "chill",
        guests: [{ id: kit, status: "accepted" }],
        chat: [],
        pin: null,
      },
    ],
    rides: [
      {
        ...ride,
        oneWay: true,
        id: 301,
        driver: host,
        area: "Buckman",
        seats: 3,
        kind: "carpool",
        meeting: "Community noticeboard",
        requests: [
          { id: kit, accepted: 0 },
          { id: remy, accepted: 1 },
        ],
      },
      {
        ...ride,
        id: 302,
        driver: moss,
        area: "Kerns",
        seats: 3,
        kind: "home",
        meeting: "Venue entrance, by the lit sign",
        requests: [],
      },
      {
        ...ride,
        id: 303,
        driver: arden,
        area: "Side B",
        seats: 2,
        kind: "afterz",
        gathering: "demo-side-b",
        meeting: "Inside, by the coat desk",
        requests: [],
      },
      {
        ...ride,
        id: 304,
        driver: remy,
        area: "Sellwood",
        seats: 3,
        kind: "home",
        meeting: "Venue entrance",
        requests: [],
      },
    ],
    needs: [
      { user: arden, direction: "arriving", area: "Sunnyside" },
      { user: kit, direction: "departing", area: "Kerns" },
      { user: remy, direction: "departing", area: "Sellwood" },
    ],
    watches: [],
    consent: {},
    reports: [],
  };
}
const roleOf = (room: Room, actor: number): Role =>
  room.host === actor ? "host" : (room.guests.find((g) => g.id === actor)?.status ?? "guest");
const inside = (room: Room, actor: number) => ["host", "accepted"].includes(roleOf(room, actor));
const textField = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
    },
  });
const fail = (message: string, status = 400) => json({ error: message }, status);
type Options = {
  storage?: Pick<Storage, "getItem" | "setItem">;
  poster?: string;
};
type Fields = Record<string, unknown>;

export function createDemoApi({ storage, poster }: Options = {}) {
  let state = fixtures();
  const openedAt = Date.now();
  const leases = new Map<number, { id: string; area: string; expiresAt: number }>();
  try {
    const saved = storage?.getItem(storeKey);
    if (saved) {
      const data = JSON.parse(saved) as State;
      if (
        data.version === 1 &&
        DEMO_PERSONAS.some((p) => p.id === data.persona) &&
        Array.isArray(data.rooms) &&
        Array.isArray(data.rides) &&
        Array.isArray(data.needs) &&
        Array.isArray(data.reports) &&
        Array.isArray(data.watches) &&
        data.present &&
        data.consent &&
        Array.isArray(data.adult)
      )
        state = data;
    }
  } catch {
    /* A fresh, usable session also works without storage. */
  }
  const current = () => (state.persona === "guest" ? 0 : state.persona === "host" ? host : member);
  const save = () => {
    try {
      storage?.setItem(storeKey, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  };
  const setPersona = (value: DemoPersona) => {
    if (!DEMO_PERSONAS.some((p) => p.id === value)) throw Error("Unknown demo persona.");
    state.persona = value;
    save();
  };
  const getUser = () => {
    const id = current();
    return id
      ? {
          id,
          username: names[id][1],
          displayName: names[id][0],
          email: names[id][1] + "@example.invalid",
          avatarChoice: 1,
          photoUrl: null,
          bio: "Fictional preview member.",
          googleLinked: false,
          isAdmin: false,
          isPrimaryOwner: false,
          accountStatus: "active",
        }
      : null;
  };
  const success = (value: unknown = { ok: true }, status = 200) => {
    save();
    return json(value, status);
  };
  const auth = () => fail("Choose a signed-in demo member.", 401);
  const hidden = () => fail("This item is unavailable to this member.", 404);
  const acceptedCount = (room: Room) => room.guests.filter((g) => g.status === "accepted").length;
  const listing = (room: Room, actor: number) => ({
    id: room.id,
    title: room.title,
    hostName: names[room.host][0],
    closesAt,
    role: roleOf(room, actor),
  });
  const night = (room: Room) => ({
    eventId: DEMO_EVENT.id,
    occurrence: DEMO_EVENT.occurrence,
    capacity: room.capacity,
    poster: room.poster ?? (room.id === "demo-lantern-room" ? poster ?? null : null),
    sexPositive: Number(room.sexPositive),
    nudityOk: Number(room.nudityOk),
    vibe: room.vibe,
    glow: room.glow,
  });
  function roomApi(path: string, method: string, body: Fields, actor: number): Response {
    if (path === gatheringBase) {
      if (!actor) return auth();
      if (method === "GET")
        return json(
          state.rooms
            .filter((r) => !["guest", "declined", "revoked"].includes(roleOf(r, actor)))
            .map((r) => listing(r, actor)),
        );
      if (method !== "POST") return hidden();
      const title = textField(body.title),
        key = textField(body.requestId);
      if (!title || title.length > 80 || !key || body.confirmed18 !== true)
        return fail("Confirm you're 18 or older and enter a gathering title.");
      const previous = state.rooms.find((r) => r.host === actor && r.requestId === key);
      if (previous) return json({ id: previous.id });
      const linked = body.eventId != null,
        capacity = linked ? Number(body.capacity) : 8;
      if (
        linked &&
        (body.eventId !== DEMO_EVENT.id ||
          body.occurrence !== DEMO_EVENT.occurrence ||
          !["chill", "social", "party"].includes(String(body.vibe)) ||
          !Number.isInteger(capacity) ||
          capacity < 1 ||
          capacity > 500)
      )
        return fail("Choose the demo event, a vibe, and 1–500 guest spots.");
      const id = "demo-room-" + ++state.next;
      state.rooms.unshift({
        id,
        title,
        host: actor,
        linked,
        capacity,
        vibe: linked ? String(body.vibe) : "social",
        sexPositive: body.sexPositive === true,
        nudityOk: body.nudityOk === true,
        glow: body.glow === true,
        poster: textField(body.poster) || null,
        guests: [],
        pin: null,
        chat: [],
        requestId: key,
      });
      if (!state.adult.includes(actor)) state.adult.push(actor);
      return success({ id }, 201);
    }
    const [roomId, ...segments] = path.slice(gatheringBase.length + 1).split("/");
    const room = state.rooms.find((r) => r.id === roomId);
    if (!room) return hidden();
    const role = roleOf(room, actor),
      action = segments.join("/");
    if (["revoked", "declined"].includes(role)) return hidden();
    if (!action && method === "GET")
      return json({
        ...listing(room, actor),
        ...(room.linked && state.adult.includes(actor)
          ? {
              night: night(room),
              renewed: !!room.guests.find((g) => g.id === actor)?.renewed,
            }
          : {}),
        ...(role === "host"
          ? {
              requests: room.guests
                .filter((g) => ["accepted", "waitlisted", "pending"].includes(g.status))
                .map((g) => ({
                  userId: g.id,
                  name: names[g.id][0],
                  status: g.status,
                  renewed: Number(!!g.renewed),
                })),
            }
          : {}),
      });
    if (!actor) return auth();
    const guest = room.guests.find((g) => g.id === actor);
    if (method === "POST" && action === "request") {
      if (body.confirmed18 !== true) return fail("Confirm you're 18 or older.");
      if (role === "host") return fail("You host this gathering.", 409);
      if (!state.adult.includes(actor)) state.adult.push(actor);
      if (!guest || guest.status === "passed") {
        const status = acceptedCount(room) >= room.capacity ? "waitlisted" : "pending";
        if (guest) Object.assign(guest, { status, renewed: false });
        else room.guests.push({ id: actor, status });
      }
      return success({ status: roleOf(room, actor) });
    }
    if (action === "leave" && method === "POST") {
      if (role === "host") return fail("Close the gathering from the host controls.", 409);
      if (body.pass === true) {
        if (guest) guest.status = "passed";
        else room.guests.push({ id: actor, status: "passed" });
      } else room.guests = room.guests.filter((g) => g.id !== actor);
      return success({ left: true });
    }
    if (action === "second" && method === "POST") {
      if (!guest || guest.status !== "waitlisted")
        return fail("Only waitlisted guests can renew a request.", 409);
      guest.renewed = true;
      return success({ renewed: true });
    }
    if (action === "chat" || action.startsWith("chat/location")) {
      if (!inside(room, actor))
        return fail("Only the host and accepted guests can open this room.", 403);
      if (action === "chat" && method === "GET")
        return json(
          room.chat.map((m) => ({
            id: m.id,
            name: names[m.author][0],
            body: m.body,
          })),
        );
      if (action === "chat" && method === "POST") {
        const bodyText = textField(body.body),
          key = textField(body.requestId);
        if (!bodyText || bodyText.length > 1000 || !key)
          return fail("Enter a message of up to 1,000 characters.");
        if (!room.chat.some((m) => m.author === actor && m.key === key))
          room.chat.push({
            id: ++state.next,
            author: actor,
            key,
            body: bodyText,
          });
        return success({ saved: true });
      }
      if (action === "chat/location" && method === "GET")
        return json({
          location: room.pin,
          expiresAt: Date.now() + (closesAt - DEMO_NOW),
        });
      if (action === "chat/location/directions" && method === "GET")
        return room.pin ? json({ demo: true, location: room.pin }) : hidden();
      if (role !== "host") return fail("Only the host can change the private location.", 403);
      if (action === "chat/location" && method === "DELETE") {
        room.pin = null;
        return success({ removed: true });
      }
      if (action === "chat/location" && method === "PUT") {
        const address = textField(body.address);
        const lat = body.lat,
          lng = body.lng;
        const hasPin =
          typeof lat === "number" &&
          Number.isFinite(lat) &&
          Math.abs(lat) <= 90 &&
          typeof lng === "number" &&
          Number.isFinite(lng) &&
          Math.abs(lng) <= 180;
        if (body.confirm !== true || (!address && !hasPin) || address.length > 240)
          return fail("Confirm a private address or pin.");
        room.pin = {
          address,
          lat: hasPin ? Number(lat) : null,
          lng: hasPin ? Number(lng) : null,
        };
        return success({ saved: true });
      }
      return hidden();
    }
    if (role !== "host") return fail("Only the host can manage this gathering.", 403);
    if (action === "close" && method === "POST") {
      state.rooms = state.rooms.filter((r) => r !== room);
      state.rides = state.rides.filter((r) => r.gathering !== room.id);
      return success({ closed: true });
    }
    if (action === "capacity" && method === "POST") {
      const capacity = Number(body.capacity);
      if (
        !Number.isInteger(capacity) ||
        capacity < 1 ||
        capacity > 500 ||
        capacity < acceptedCount(room)
      )
        return fail("Capacity must include confirmed guests.");
      room.capacity = capacity;
      return success({ capacity });
    }
    if (segments[0] === "guests" && method === "POST") {
      const target = room.guests.find((g) => g.id === Number(segments[1]));
      const status = String(body.status);
      if (
        !target ||
        !["pending", "waitlisted", "accepted"].includes(target.status) ||
        !["accepted", "declined", "revoked"].includes(status)
      )
        return hidden();
      if (
        status === "accepted" &&
        target.status !== "accepted" &&
        acceptedCount(room) >= room.capacity
      ) {
        target.status = "waitlisted";
        save();
        return fail("Room full. This guest is on the waitlist.", 409);
      }
      if (
        (target.status === "accepted" && status === "declined") ||
        (target.status !== "accepted" && status === "revoked")
      )
        return fail("Choose a valid guest action.", 409);
      target.status = status as Role;
      return success({ status });
    }
    return hidden();
  }
  const seatsLeft = (ride: Ride) =>
    ride.seats - ride.requests.filter((r) => r.accepted === 1).length;
  const accepted = (ride: Ride, id: number) =>
    ride.driver === id || ride.requests.some((r) => r.id === id && r.accepted === 1);
  function visibleRide(ride: Ride, actor: number) {
    if (!actor) return false;
    if (ride.kind === "carpool" || ride.driver === actor) return true;
    if (
      ride.kind === "afterz" &&
      !state.rooms.some((r) => r.id === ride.gathering && inside(r, actor))
    )
      return false;
    if (accepted(ride, actor)) return true;
    return (
      !!state.present[actor] &&
      (ride.kind === "afterz" || state.present[actor].toLowerCase() === ride.area.toLowerCase())
    );
  }
  function rideApi(path: string, method: string, body: Fields, actor: number): Response {
    const parts = path.slice(planningBase.length).split("/").filter(Boolean);
    if (!parts.length && method === "GET") {
      const rides = actor
        ? state.rides
            .filter((r) => visibleRide(r, actor))
            .map((r) => ({
              id: r.id,
              area: r.area,
              driver: names[r.driver][1],
              remaining: seatsLeft(r),
              mine: r.driver === actor,
              myRequest: r.requests.find((q) => q.id === actor)?.accepted ?? null,
              requests:
                r.driver === actor
                  ? r.requests.map((q) => ({ ...q, username: names[q.id][1] }))
                  : [],
              faces: accepted(r, actor)
                ? [r.driver, ...r.requests.filter((q) => q.accepted).map((q) => q.id)]
                    .filter((id) => id !== actor)
                    .map((id) => ({ username: names[id][1], photoUrl: null }))
                : [],
              plan: {
                kind: r.kind,
                meeting: r.meeting,
                oneWay: r.oneWay,
                // Seed rides leave in 55 minutes whenever a new preview opens.
                leaveBy:
                  r.fixtureTime && r.leaveBy !== null
                    ? openedAt + (r.leaveBy - DEMO_NOW)
                    : r.leaveBy,
                departed: r.departed,
              },
            }))
        : null;
      const needs = actor
        ? state.needs
            .filter(
              (n) =>
                n.user === actor ||
                n.direction === "arriving" ||
                (!!state.present[actor] &&
                  n.area.toLowerCase() === state.present[actor].toLowerCase() &&
                  state.present[n.user]?.toLowerCase() === n.area.toLowerCase()),
            )
            .map((n) => ({
              username: names[n.user][1],
              direction: n.direction,
              area: n.area,
              mine: Number(n.user === actor),
            }))
        : null;
      return json({
        rides,
        needs,
        attending: !!actor,
        homeArea: state.present[actor] ?? null,
        checked: !!state.present[actor],
        onSiteWindow: true,
        gpsAvailable: false,
        poster: poster ?? null,
        venue: DEMO_EVENT.venueName,
        title: DEMO_EVENT.title,
        open: true,
        canPostGig: false,
        gigs: [],
      });
    }
    if (!actor) return auth();
    const [resource, id, action, who] = parts;
    if (resource === "needs" && (id === "arriving" || id === "departing")) {
      if (method === "DELETE") {
        state.needs = state.needs.filter((n) => n.user !== actor || n.direction !== id);
        return success();
      }
      if (method !== "PUT") return hidden();
      const area = id === "departing" ? state.present[actor] : textField(body.area);
      if (!area || area.length < 2 || area.length > 80)
        return fail("Choose a pickup area or check in for departing rides.");
      state.needs = state.needs.filter((n) => n.user !== actor || n.direction !== id);
      state.needs.unshift({ user: actor, direction: id, area });
      return success();
    }
    if (resource === "presence") {
      const activeLease = leases.get(actor);
      if (id === "foreground") {
        if (method === "DELETE") {
          if (activeLease?.id === action) leases.delete(actor);
          return success();
        }
        if (method !== "POST" || body.consent !== true)
          return fail("Confirm automatic demo check-in.");
        const area = textField(body.area);
        if (area.length > 80) return fail("Choose a demo neighborhood.");
        const lease = { id: "demo-lease-" + ++state.next, area, expiresAt: Date.now() + 3600000 };
        leases.set(actor, lease);
        return success({ lease: lease.id, expiresAt: lease.expiresAt });
      }
      if (method === "DELETE") {
        delete state.present[actor];
        leases.delete(actor);
        return success();
      }
      if (method === "POST") {
        if (body.lease !== undefined) {
          if (!activeLease || activeLease.id !== body.lease || activeLease.expiresAt <= Date.now())
            return fail("Automatic check-in ended.", 410);
          state.present[actor] = activeLease.area;
        } else {
          const area = textField(body.area);
          if (area.length > 80) return fail("Choose a demo neighborhood.");
          state.present[actor] = area;
        }
        return success({ near: true, validUntil: Date.now() + 1800000 });
      }
    }
    if (resource !== "rides") return hidden();
    if (!id && method === "POST") {
      if (state.rides.some((r) => r.driver === actor))
        return fail("You already have a ride offer here.", 409);
      const seats = Number(body.seats),
        kind = String(body.kind || "carpool") as Kind,
        area = textField(body.area),
        meeting = textField(body.meeting);
      if (
        !["carpool", "home", "afterz"].includes(kind) ||
        area.length < 2 ||
        area.length > 80 ||
        (kind !== "afterz" && meeting.length < 2) ||
        meeting.length > 100 ||
        !Number.isInteger(seats) ||
        seats < 2 ||
        seats > 8
      )
        return fail("Enter a neighborhood, meeting point, and 2–8 available seats.");
      if (kind !== "carpool" && !state.present[actor])
        return fail("Check in at the venue first.", 403);
      const gathering = textField(body.gathering);
      if (kind === "afterz" && !state.rooms.some((r) => r.id === gathering && inside(r, actor)))
        return hidden();
      const leaveBy =
        typeof body.leaveBy === "number" && Number.isFinite(body.leaveBy) ? body.leaveBy : null;
      state.rides.push({
        id: ++state.next,
        driver: actor,
        area,
        seats,
        kind,
        meeting,
        leaveBy,
        gathering,
        oneWay: kind === "carpool" && body.oneWay === true,
        departed: false,
        requests: [],
      });
      return success({ ok: true }, 201);
    }
    const ride = state.rides.find((r) => r.id === Number(id));
    if (!ride || !visibleRide(ride, actor)) return hidden();
    if (!action && method === "DELETE") {
      if (ride.driver !== actor) return fail("Only the driver can remove this offer.", 403);
      state.rides = state.rides.filter((r) => r !== ride);
      state.watches = state.watches.filter((w) => w.ride !== ride.id);
      return success();
    }
    if (action === "requests") {
      if (!who && method === "POST") {
        if (ride.driver === actor || ride.departed || seatsLeft(ride) < 1)
          return fail("This ride cannot accept a seat request.", 409);
        if (!ride.requests.some((q) => q.id === actor))
          ride.requests.push({ id: actor, accepted: 0 });
        return success({ ok: true }, 201);
      }
      if (who === "me" && method === "DELETE") {
        ride.requests = ride.requests.filter((q) => q.id !== actor);
        state.watches = state.watches.filter((w) => w.ride !== ride.id || w.user !== actor);
        return success();
      }
      if (ride.driver !== actor) return fail("Only the driver can manage requests.", 403);
      const request = ride.requests.find((q) => q.id === Number(who));
      if (!request) return hidden();
      if (method === "DELETE" && !request.accepted) {
        ride.requests = ride.requests.filter((q) => q !== request);
        return success();
      }
      if (method === "PUT" && !request.accepted && !ride.departed && seatsLeft(ride) > 0) {
        request.accepted = 1;
        return success();
      }
      return fail("This request cannot be changed.", 409);
    }
    if (action === "depart" && method === "POST") {
      if (ride.driver !== actor) return fail("Only the driver can start this ride.", 403);
      if (
        ride.departed ||
        body.metTogether !== true ||
        ride.requests.filter((q) => q.accepted).length < 2
      )
        return fail("Meet with two confirmed passengers before leaving.", 409);
      ride.departed = true;
      return success({ departed: true });
    }
    if (action === "watch" && method === "POST") {
      if (!accepted(ride, actor)) return hidden();
      const contacts = textField(body.contact)
        .split(",")
        .map((v) => v.trim().replace(/^@/, ""));
      const minutes = Number(body.minutes);
      if (
        body.consent !== true ||
        !Number.isInteger(minutes) ||
        minutes < 1 ||
        minutes > 180 ||
        contacts.length > 3 ||
        contacts.some(
          (name) => !Object.entries(names).some(([k, v]) => Number(k) !== actor && v[1] === name),
        )
      )
        return fail("Choose a demo contact such as demo-kit and a check-in time.");
      const dueAt = Date.now() + minutes * 60000;
      state.watches = state.watches.filter((w) => w.ride !== ride.id || w.user !== actor);
      state.watches.push({ ride: ride.id, user: actor, dueAt });
      return success({ dueAt });
    }
    return hidden();
  }

  async function handle(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
    const request = input instanceof Request ? input : null;
    const url = new URL(request?.url ?? String(input), "https://demo.invalid");
    const path = url.pathname.replace(/\/$/, ""),
      method = (init?.method ?? request?.method ?? "GET").toUpperCase(),
      actor = current();
    if ((init?.signal ?? request?.signal)?.aborted) throw new DOMException("Aborted", "AbortError");
    if (!path.startsWith("/api/")) return null;
    if (path === "/api/upload/poster" && method === "POST") {
      if (!actor) return auth();
      const form =
        init?.body instanceof FormData
          ? init.body
          : await request?.formData().catch(() => undefined);
      const image = form?.get("file") ?? form?.get("poster");
      if (
        !(image instanceof Blob) ||
        !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(image.type) ||
        image.size > 8 * 1024 * 1024
      )
        return fail("Choose a JPG, PNG, GIF or WebP under 8 MB.");
      const data = await image.arrayBuffer(),
        bytes = new Uint8Array(data);
      let binary = "";
      for (let n = 0; n < bytes.length; n += 8192)
        binary += String.fromCharCode(...bytes.subarray(n, n + 8192));
      return json({ url: "data:" + image.type + ";base64," + btoa(binary) });
    }
    let body: Fields = {};
    if (method !== "GET" && method !== "HEAD") {
      const raw =
        typeof init?.body === "string" ? init.body : request ? await request.clone().text() : "";
      if (raw)
        try {
          const parsed = JSON.parse(raw);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
            return fail("Expected a JSON object.");
          body = parsed;
        } catch {
          return fail("Invalid JSON.");
        }
    }
    if (path.startsWith("/api/demo/profiles/") && method === "GET") {
      if (!actor) return auth();
      const profile = Object.values(names).find(
        ([, username]) => username === path.slice("/api/demo/profiles/".length),
      );
      return profile
        ? json({
            username: profile[1],
            displayName: profile[0],
            bio: "Fictional member of the Yes Coach preview.",
          })
        : hidden();
    }
    if (path === "/api/auth/session" && method === "GET") return json(getUser());
    if (path === "/api/auth/logout" && method === "POST") {
      setPersona("guest");
      return json({ ok: true });
    }
    if (path === "/api/auth/login" || path === "/api/auth/register")
      return fail(
        "Choose Member or Host in the demo persona switcher. No account details are needed.",
      );
    if (path === gatheringBase || path.startsWith(gatheringBase + "/"))
      return roomApi(path, method, body, actor);
    if (path === planningBase || path.startsWith(planningBase + "/"))
      return rideApi(path, method, body, actor);
    if (path.startsWith("/api/afterz/")) {
      if (!actor) return auth();
      if (path === "/api/afterz/discovery") {
        if (method === "POST") {
          if (body.confirmed18 !== true) return fail("Confirm you're 18 or older.");
          if (!state.adult.includes(actor)) state.adult.push(actor);
          save();
        }
        if (method === "POST" || method === "GET")
          return json({ confirmed: state.adult.includes(actor) });
      }
      if (path === "/api/afterz/eligible-events" && method === "GET")
        return json([
          {
            id: DEMO_EVENT.id,
            title: DEMO_EVENT.title,
            date: DEMO_EVENT.occurrence,
          },
        ]);
      if (path === "/api/afterz/nights" && method === "GET")
        return json(
          !state.adult.includes(actor)
            ? []
            : state.rooms
                .filter((r) => r.linked && !["declined", "revoked"].includes(roleOf(r, actor)))
                .map((r) => ({
                  ...listing(r, actor),
                  ...night(r),
                  venue: DEMO_EVENT.venueName,
                  eventTitle: DEMO_EVENT.title,
                  lat: null,
                  lng: null,
                })),
        );
      if (path === "/api/afterz/consent/" + DEMO_EVENT.id && method === "PUT") {
        if (!["checkin", "rsvp"].includes(String(body.source)) || typeof body.enabled !== "boolean")
          return fail("Choose a valid preference.");
        state.consent[actor + ":" + body.source] = body.enabled;
        return success({ enabled: body.enabled });
      }
      return hidden();
    }
    if (path === "/api/night/ride-checks" && method === "GET")
      return actor
        ? json(
            state.watches
              .filter((w) => w.user === actor)
              .map((w) => ({
                ride: w.ride,
                dueAt: w.dueAt,
                stage: 0,
                shareLocation: 0,
              })),
          )
        : auth();
    if (path.startsWith("/api/night/ride-checks/")) {
      if (!actor) return auth();
      const id = Number(path.split("/")[4]),
        watch = state.watches.find((w) => w.user === actor && w.ride === id);
      if (!watch) return hidden();
      if (method === "DELETE") {
        state.watches = state.watches.filter((w) => w !== watch);
        return success();
      }
      if (method === "PUT" && path.endsWith("/location")) return json({ ok: true });
      return hidden();
    }
    if (path === "/api/night/ride-waypoints" && method === "GET") return actor ? json([]) : auth();
    if (path === "/api/feedback" && method === "POST") {
      if (!actor) return auth();
      const message = textField(body.message);
      if (!message) return fail("Enter a report.");
      const receiptId = ++state.next;
      state.reports.push({ receiptId, user: actor, message });
      return success({ receiptId }, 201);
    }
    if (path === "/api/me/report-receipts" && method === "GET")
      return actor
        ? json(state.reports.filter((r) => r.user === actor).map((r) => ({ id: r.receiptId })))
        : auth();
    if (path === "/api/events" && method === "GET")
      return json([{ ...DEMO_EVENT, posterImageUrl: poster ?? DEMO_EVENT.posterImageUrl }]);
    if (path === "/api/events/" + DEMO_EVENT.id && method === "GET")
      return json({
        ...DEMO_EVENT,
        posterImageUrl: poster ?? DEMO_EVENT.posterImageUrl,
      });
    if (path === "/api/outz/buddies/event/" + DEMO_EVENT.id && method === "GET") return json(null);
    if (path === "/api/chats/mine" && method === "GET") return actor ? json([]) : auth();
    return null;
  }
  return {
    handle,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) =>
      (await handle(input, init)) ?? hidden(),
    getPersona: () => state.persona,
    getUser,
    setPersona,
    save,
    reset: () => {
      leases.clear();
      state = fixtures();
      save();
    },
  };
}
