/** Fixture for Outzide and Afterz drawer screenshots. APIs are mocked. Example data only. */
import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NavShell } from "@/components/ui/nav-shell";
import { MobileDockShell } from "@/components/ui/mobile-dock-shell";
import OutzideDrawer from "@/components/outz/OutzideDrawer";
import AfterzDrawer from "@/components/afterz/AfterzDrawer";
import { afterzWindowState } from "@shared/afterzWindow";
import type { InViewItem } from "@shared/drawerFilters";
import type { DrawerTopEvent } from "@shared/drawerTop";
import type { OutzideCountdownItem } from "@shared/outzideDrawer";
import "@/index.css";
import "@/components/nav.css";
import "@/components/ds/tokens/index.css";
import "@/components/ds/styles.css";
import "@/components/xerox/xerox.css";
import "@/components/board/punk/cut-type.css";

const inWindow = Date.parse("2026-11-20T22:30:00-08:00");
const offHours = Date.parse("2026-11-20T15:00:00-08:00");
const afternoon = Date.parse("2026-11-20T12:00:00-08:00");

const events: DrawerTopEvent[] = [
  { id: 10, title: "Yes Coach", dateStart: "2026-11-20T21:00:00", venueName: "Sanctuary", posterImageUrl: "/posters/tucker-archive/yes-coach-apr-2026.jpg", dayOfWeek: "FRI" },
  { id: 12, title: "Late show", dateStart: "2026-11-20T23:00:00", venueName: "Holocene", dayOfWeek: "FRI" },
  { id: 13, title: "Tomorrow brunch", dateStart: "2026-11-21T11:00:00", venueName: "Diner", dayOfWeek: "SAT" },
];

const featured: OutzideCountdownItem[] = [
  { id: 80, title: "Rooster Rock hang", dateStart: "2026-11-20T16:00:00", venueName: "Rooster Rock", posterImageUrl: "/outzide-map/assets/photos/v3/rooster-rock-640.webp", kind: "buddy", href: "/events?event=80" },
  { id: 1_000_000_009, title: "Offering a ride", dateStart: "2026-11-20T18:00:00", venueName: "Rooster Rock", kind: "carpool", href: "/outzide/rooster-rock" },
];

const leadItems: InViewItem[] = [
  {
    kind: "event",
    id: 10,
    event: {
      id: 10,
      title: "Yes Coach",
      venueName: "Sanctuary",
      dateStart: "2026-11-20T21:00:00",
      dateEnd: "2026-11-21T02:00:00",
      admission: "FREE",
      ageRequirement: "21_PLUS",
      isPublic: true,
      isHouseParty: false,
      isSexPositive: false,
      nudityOk: false,
      eventTypes: [],
      posterImageUrl: "/posters/tucker-archive/yes-coach-apr-2026.jpg",
    },
  },
  {
    kind: "place",
    id: 501,
    place: { id: 501, name: "Rooster Rock", type: "campground", lat: 45.548, lng: -122.248 },
  },
  {
    kind: "place",
    id: 502,
    place: { id: 502, name: "Sauvie Island", type: "campground", lat: 45.72, lng: -122.79 },
  },
];

const nights = [
  { id: "g1", title: "Snacks and quiet music", eventTitle: "Yes Coach", eventId: 10, hostName: "Jordan Host", vibe: "chill", poster: "/posters/tucker-archive/yes-coach-apr-2026.jpg", role: "guest" },
  { id: "g2", title: "The party continues", eventTitle: "Late show", hostName: "Riley Host", vibe: "party", poster: null, role: "guest" },
];

(window as unknown as { __mapReleaseDiagnostics: { snapshot: () => object } }).__mapReleaseDiagnostics = {
  snapshot: () => ({ mode: "outzide", center: [-122.248, 45.548], zoom: 10, pitch: 0, bearing: 0 }),
};

const scene = new URLSearchParams(location.search).get("scene") || "outzide";

const needRides = [
  { id: "need-1", name: "Alex Rider", eventId: 10, eventTitle: "Yes Coach", neighborhood: "Alberta", direction: "arriving" as const, lat: 45.559, lng: -122.675 },
  { id: "need-2", name: "Riley Guest", afterzId: "g1", afterzTitle: "Snacks and quiet music", neighborhood: "Division", direction: "arriving" as const, lat: 45.504, lng: -122.63 },
  { id: "need-3", name: "Sam Nearby", neighborhood: "Pearl", direction: "departing" as const, lat: 45.53, lng: -122.68 },
];

function MapField() {
  return (
    <div
      className="zaylist-unified-map"
      data-testid="fixture-map"
      style={{ minHeight: "100dvh", position: "relative", overflow: "hidden", background: "var(--z-black)" }}
    >
      <img
        src="/outzide-map/assets/photos/v3/rooster-rock-1280.webp"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }}
      />
    </div>
  );
}

function Fixture() {
  return (
    <>
      <NavShell>
        <div className="site-hub-mtop" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingInline: 16 }}>
          <span>Navigation fixture</span>
          <span data-testid="example-data-label" style={{ font: "700 11px/1 var(--font-mono, monospace)", letterSpacing: ".12em", textTransform: "uppercase" }}>Example data</span>
        </div>
      </NavShell>
      <MapField />
      {scene === "outzide" && (
        <OutzideDrawer now={afternoon} leadItems={leadItems} events={events} featured={featured} startOpen />
      )}
      {scene === "afterz-open" && (
        <AfterzDrawer now={inWindow} windowState={afterzWindowState(inWindow)} nights={nights} events={events} needRides={needRides} needLat={45.5231} needLng={-122.6765} startOpen />
      )}
      {scene === "afterz-off" && (
        <AfterzDrawer now={offHours} windowState={afterzWindowState(offHours)} nights={[]} events={events} startOpen startHostForm={false} />
      )}
      {scene === "afterz-host" && (
        <AfterzDrawer now={offHours} windowState={afterzWindowState(offHours)} nights={[]} events={events} startOpen startHostForm />
      )}
      <MobileDockShell activeIndex={0} location="/map">
        <button type="button">Home</button>
        <button type="button">Places</button>
        <button type="button">Profile</button>
      </MobileDockShell>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <Fixture />
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>,
);
