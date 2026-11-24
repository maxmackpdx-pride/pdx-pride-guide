import { DestinationCardRenderer } from "./components/outz/MapDestinationCommunity";
import { boardBrowseHref } from "@/lib/boardBrowseHref";
import type { BoardCategory } from "@/lib/allBoards";
import MapWorldRedirect from "@/components/MapWorldRedirect";
import { homeBootLogoHtml } from "@shared/homeBoot";
import { Switch, Route, Router, Redirect, useLocation } from "wouter";
import { Suspense, useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import BrowseScrollRestoration from "./components/BrowseScrollRestoration";
import { AuthProvider } from "./context/AuthContext";
import { InboxSheetProvider } from "./context/InboxSheetContext";
import { HubPanelProvider } from "./context/HubPanelContext";
import { ThemeProvider } from "./context/ThemeContext";
import CalmAccountSync from "./components/CalmAccountSync";
import Nav from "./components/Nav";
import MobileBottomNav from "./components/MobileBottomNav";
import ErrorBoundary from "./components/ErrorBoundary";
import { routeBoundaryKey } from "./lib/routeBoundaryKey";
import AnalyticsTracker from "./components/AnalyticsTracker";
import SpectrumLoader from "./components/SpectrumLoader";
import MapBootLoader from "./components/MapBootLoader";
import DeferredMount from "./components/DeferredMount";
import { lazyWithReload } from "./lib/lazyWithReload";

// Shell furniture diet: everything below is code-split out of the entry
// bundle. Prompts, nudges and reminders additionally mount only at browser
// idle (DeferredMount), so they never compete with first paint or the
// route's own data fetch. Gates and the toaster load immediately, just
// asynchronously. Core chrome (Nav, MobileBottomNav, providers) stays static.
const MappedDestinationCard = lazyWithReload(() => import("./pages/OutzidePlacesPage").then(module => ({ default: module.DestinationCardById })));
const PullToRefresh = lazyWithReload(() => import("./components/PullToRefresh"));
const Footer = lazyWithReload(() => import("./components/Footer"));
const SiteWallpaper = lazyWithReload(() => import("./components/wallpaper/SiteWallpaper"));
const RiverBratsIntroPopup = lazyWithReload(() => import("./components/river-brats/RiverBratsIntroPopup"));
const PushNotificationPrompt = lazyWithReload(() => import("./components/PushNotificationPrompt"));
const PrideGlowNudge = lazyWithReload(() => import("./components/PrideGlowNudge"));
const Toaster = lazyWithReload(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));
const InboxDailyReminder = lazyWithReload(() => import("./components/inbox/InboxDailyReminder").then((m) => ({ default: m.InboxDailyReminder })));
import { legacyOutzRedirect } from "@shared/outzRoutes";

import { legacyPlacezMapRedirect } from "@shared/placezMapRoutes";
function LegacyMapEntrance() {
  const target = legacyPlacezMapRedirect(window.location.pathname + window.location.search + window.location.hash);
  return target ? <Redirect to={target} replace /> : <UnifiedMap />;
}
function LegacyOutzRedirect() {
  const target = legacyOutzRedirect(window.location.pathname + window.location.search + window.location.hash);
  return <Redirect to={target || "/outzide"} replace />;
}

/** The intro explains Rooster Rock and Collins Beach specifically, so it belongs
 *  on those two routes only, not on every OUTZ destination page. */
const RIVER_BRATS_INTRO_PATHS = new Set(["/outzide/rooster-rock", "/outzide/sauvie-island"]);

/** Mount intro outside RouteBoundary so a page crash cannot kill the popup. */
function RiverBratsIntroOnBeaches() {
  const [location] = useLocation();
  const path = location.split("?")[0] || "";
  if (!RIVER_BRATS_INTRO_PATHS.has(path)) return null;
  return (
    <Suspense fallback={null}>
      <RiverBratsIntroPopup />
    </Suspense>
  );
}

function RouteBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  // Key by room. Opening an event or place must not remount the board.
  // Leaving for another room still recovers a crashed page.
  return <ErrorBoundary key={routeBoundaryKey(location)}>{children}</ErrorBoundary>;
}


import { LEGACY_Z_PRODUCT_REDIRECTS } from "@shared/zNamespace";
const CommunityStandardsGate = lazyWithReload(() => import("./components/CommunityStandardsGate"));
const SuspendedAccountGate = lazyWithReload(() => import("./components/SuspendedAccountGate"));
const ResetPassword = lazyWithReload(() => import("./pages/ResetPassword"));

const Events = lazyWithReload(() => import("./pages/Events"));
const Home = lazyWithReload(() => import("./pages/Home"));
const Submit = lazyWithReload(() => import("./pages/Submit"));
const Boards = lazyWithReload(() => import("./pages/Boards"));
const About = lazyWithReload(() => import("./pages/About"));
const Resources = lazyWithReload(() => import("./pages/Resources"));
const Resume = lazyWithReload(() => import("./pages/Resume"));
const Legal = lazyWithReload(() => import("./pages/Legal"));
const Contact = lazyWithReload(() => import("./pages/Contact"));
const Sponsors = lazyWithReload(() => import("./pages/Sponsors"));
const AccessSafety = lazyWithReload(() => import("./pages/AccessSafety"));
const Admin = lazyWithReload(() => import("./pages/Admin"));
const Dashboard = lazyWithReload(() => import("./pages/Dashboard"));
const HubHelp = lazyWithReload(() => import("./pages/HubHelp"));
const HostHub = lazyWithReload(() => import("./pages/HostHub"));
const NotificationSettings = lazyWithReload(() => import("./pages/NotificationSettings"));
const PlacezBrowse = lazyWithReload(() => import("./pages/PlacezBrowse"));
const Scenez = lazyWithReload(() => import("./pages/Scenez"));
const OutzidePlacesPage = lazyWithReload(() => import("./pages/OutzidePlacesPage"));
const OutzideIndex = lazyWithReload(() => import("./pages/OutzideIndex"));
const Directory = lazyWithReload(() => import("./pages/Directory"));
const DirectoryIndex = lazyWithReload(() => import("./pages/DirectoryIndex"));
const RoosterRock = lazyWithReload(() => import("./pages/RoosterRock"));
const SauvieIsland = lazyWithReload(() => import("./pages/SauvieIsland"));
const UnifiedMap = lazyWithReload(() => import("./pages/UnifiedMap"));
const OutzPlace = lazyWithReload(() => import("./pages/OutzPlace"));
const DesignSystemSandbox = lazyWithReload(() => import("./pages/DesignSystemSandbox"));
const DesignComponentSpecimen = lazyWithReload(() => import("./pages/DesignComponentSpecimen"));
const ZIndex = lazyWithReload(() => import("./pages/ZIndex"));
const Community = lazyWithReload(() => import("./pages/Community"));
const MemberProfile = lazyWithReload(() => import("./pages/MemberProfile"));
const NotFound = lazyWithReload(() => import("./pages/not-found"));

function BoardEntrance({ board }: { board: BoardCategory }) {
 return <Redirect to={boardBrowseHref(board, window.location.search)} replace />;
}
function BoardComposeEntrance({ board }: { board: BoardCategory }) {
 const params = new URLSearchParams(window.location.search);
 params.set("compose", "1");
 return <Redirect to={boardBrowseHref(board, params.toString())} replace />;
}

function isHubPath(path: string) {
  const bare = path.split("?")[0];
  return bare === "/dashboard" || bare === "/admin";
}

function isProfilePath(path: string) {
  return path.split("?")[0].startsWith("/u/");
}

const RideCheckReminder = lazyWithReload(() => import("@/components/events/NightRideTools").then((m) => ({ default: m.RideCheckReminder })));
const NightConsent = lazyWithReload(() => import("@/components/afterz/NightConsent"));

function AppLayout() {
  const [location] = useLocation();
  const pathname = location.split("?")[0];
  const hub = isHubPath(location);
  // Root scope also reaches portaled account dialogs. Identity/data accents stay local.
  useEffect(() => {
    const path = pathname;
    document.documentElement.dataset.actionContext = path === "/admin" ? "admin"
      : path === "/outzide/rooster-rock" ? "rooster"
      : path === "/outzide/sauvie-island" ? "sauvie"
      : isHubPath(path) || path.startsWith("/settings/") ? "hub" : "public";
  }, [pathname]);
  const profile = isProfilePath(location);
  const routePath = pathname.replace(/\/+$/, "") || "/";
  const roomShaderRoute = ["/directory", "/events", "/scenez", "/outzide/places"].includes(routePath);
  const livingMap = ["/placez/map", "/map", "/map-demo", "/mapz"].includes(routePath);
  const unifiedMap = livingMap || routePath === "/outzide" || routePath.startsWith("/outzide/share/");
  const mapSurface = livingMap || routePath === "/outzide" || routePath.startsWith("/outzide/");
  const hideFooter = livingMap || routePath === "/outzide" || routePath.startsWith("/outzide/");
  const mobileFooter = routePath === "/" || routePath === "/about";
  return (
    <div
      data-glass-scene
      className={`min-h-screen flex flex-col app-shell${hub ? " app-shell--hub" : ""}${profile ? " app-shell--profile" : ""}${livingMap ? " app-shell--mapz-demo" : ""}${mapSurface ? " app-shell--map-surface" : ""}${mobileFooter ? "" : " app-shell--no-mobile-footer"}`}
      style={{ background: "var(--z-black, #050506)" }}
    >
      {!roomShaderRoute && (
        <Suspense fallback={null}>
          <SiteWallpaper />
        </Suspense>
      )}
      <DeferredMount>
        <Suspense fallback={null}>
          <RideCheckReminder />
        </Suspense>
      </DeferredMount>
      <DeferredMount>
        <Suspense fallback={null}>
          <NightConsent />
        </Suspense>
      </DeferredMount>
      <DeferredMount>
        <Suspense fallback={null}>
          <InboxDailyReminder />
        </Suspense>
      </DeferredMount>
      {!unifiedMap && (
        <Suspense fallback={null}>
          <PullToRefresh />
        </Suspense>
      )}
      {!unifiedMap && <Nav />}
      {!unifiedMap && location.split("?")[0] !== "/admin" && <MobileBottomNav />}
      <main className="flex-1">

        <RouteBoundary>
          <Suspense fallback={routePath === "/" ? <div dangerouslySetInnerHTML={{ __html: homeBootLogoHtml }} /> : livingMap ? <MapBootLoader map="mapz" /> : routePath === "/outzide" ? <MapBootLoader map="outz" /> : <SpectrumLoader variant="full" label="Loading page" />}>
            <Switch>
            {CardFrontPreview && <Route path="/dev/card-fronts" component={CardFrontPreview}/>}
            {/* Z/ is Communities only. Old product addresses remain redirects. */}
            <Route path="/z" component={ZIndex} />
            {Object.entries(LEGACY_Z_PRODUCT_REDIRECTS).map(([from, to]) => (
              <Route key={from} path={from}>{() => <Redirect to={to} />}</Route>
            ))}
            <Route path="/z/:communitySlug" component={Community} />
            <Route path="/" component={Home} />
            <Route path="/events/:id/:slug?" component={Events} />
            <Route path="/events" component={Events} />
            <Route path="/boardz" component={Boards} />
            <Route path="/boards">{() => <Redirect to={`/boardz${window.location.search}${window.location.hash}`} replace />}</Route>
            <Route path="/all-boards">{() => <Redirect to={`/boardz${window.location.search}${window.location.hash}`} replace />}</Route>
            <Route path="/our-boardz">{() => <Redirect to={`/boardz${window.location.search}${window.location.hash}`} replace />}</Route>
            <Route path="/placez/map" component={UnifiedMap} />
            <Route path="/map-demo" component={LegacyMapEntrance} />
            <Route path="/map" component={LegacyMapEntrance} />
            <Route path="/mapz" component={LegacyMapEntrance} />
            {/* My Schedule is the Events drawer's full-screen layer now:
                /schedule lands on Events with that stage already open. */}
            <Route path="/schedule">{() => <Redirect to="/events?schedule=1" replace />}</Route>
            <Route path="/submit/claim/:eventId" component={Submit} />
            <Route path="/submit" component={Submit} />
            <Route path="/gigz/new">{() => <BoardComposeEntrance board="gigz" />}</Route>
            <Route path="/gigz">{() => <BoardEntrance board="gigz" />}</Route>
            <Route path="/gigs">
              {() => <Redirect to="/gigz" />}
            </Route>
            {/* Old room addresses; the server 301s them too. Keep query strings (?post=). */}
            <Route path={/^\/(pride-work|gifting|spotted)(\/.*)?$/i}>
              {() => {
                const [, room, rest = ""] = window.location.pathname.match(/^\/(pride-work|gifting|spotted)(\/.*)?$/i) || [];
                const to = ({ "pride-work": "/gigz", gifting: "/giftz", spotted: "/mizzed" } as Record<string, string>)[String(room).toLowerCase()] || "/";
                return <Redirect to={`${to}${rest}${window.location.search}`} replace />;
              }}
            </Route>
            <Route path="/giftz/new">{() => <BoardComposeEntrance board="giftz" />}</Route>
            <Route path="/giftz">{() => <BoardEntrance board="giftz" />}</Route>
            <Route path="/sellz/new">{() => <BoardComposeEntrance board="sellz" />}</Route>
            <Route path="/sellz">{() => <BoardEntrance board="sellz" />}</Route>
            <Route path="/sellz/">{() => <BoardEntrance board="sellz" />}</Route>
            <Route path="/my-houz/new">{() => <BoardComposeEntrance board="housing" />}</Route>
            <Route path="/my-houz/:id">{params => {
              const search = new URLSearchParams(window.location.search);
              search.set("post", params.id);
              return <Redirect to={boardBrowseHref("housing", search.toString())} replace />;
            }}</Route>
            <Route path="/my-houz">{() => <BoardEntrance board="housing" />}</Route>
            <Route path="/houz">{() => <BoardEntrance board="housing" />}</Route>
            <Route path="/the-hauz/new">{() => <BoardComposeEntrance board="housing" />}</Route>
            <Route path="/the-hauz/:id">{params => {
              const search = new URLSearchParams(window.location.search);
              search.set("post", params.id);
              return <Redirect to={`/the-hauz?${search.toString()}`} replace />;
            }}</Route>
            <Route path="/the-hauz">{() => <BoardEntrance board="housing" />}</Route>
            <Route path="/hausing/new">
              {() => <Redirect to={`/the-hauz/new${window.location.search}`} />}
            </Route>
            <Route path="/hausing/:id">
              {(params) => <Redirect to={`/the-hauz/${params.id}${window.location.search}`} />}
            </Route>
            <Route path="/hausing">
              {() => <Redirect to={`/the-hauz${window.location.search}`} />}
            </Route>
            <Route path="/housing/new">
              {() => <Redirect to={`/the-hauz/new${window.location.search}`} />}
            </Route>
            <Route path="/housing/:id">
              {(params) => <Redirect to={`/the-hauz/${params.id}${window.location.search}`} />}
            </Route>
            <Route path="/housing">
              {() => <Redirect to={`/the-hauz${window.location.search}`} />}
            </Route>
            <Route path="/resources">{() => <Redirect to={`/needz${window.location.search}${window.location.hash}`} replace />}</Route>
            <Route path="/rezources">{() => <Redirect to={`/needz${window.location.search}${window.location.hash}`} replace />}</Route>
            <Route path="/needz" component={Resources} />
            <Route path="/about" component={About} />
            <Route path="/aboutz" component={About} />
            <Route path="/resume" component={Resume} />
            <Route path="/contact" component={Contact} />
            <Route path="/sponsors" component={Sponsors} />
            <Route path="/access" component={AccessSafety} />
            <Route path="/access-safety">
              {() => <Redirect to="/access" />}
            </Route>
            <Route path="/legal" component={Legal} />
            <Route path="/admin" component={Admin} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/hub/help" component={HubHelp} />
            <Route path="/hub" component={HostHub} />
            <Route path="/settings/notifications" component={NotificationSettings} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/inbox" component={Home} />
            <Route path="/mizzed/new">{() => <BoardComposeEntrance board="mizzed" />}</Route>
            <Route path="/mizzed">{() => <BoardEntrance board="mizzed" />}</Route>
            <Route path="/directory/new">{() => <MapWorldRedirect world="places" />}</Route>
            <Route path="/directory/a-z" component={DirectoryIndex} />
            <Route path="/directory/:id/:slug?" component={Directory} />

            <Route path="/directory" component={PlacezBrowse} />
            <Route path="/scenez" component={Scenez} />
            <Route path="/nude-beaches">
              {() => {
                const tab = new URLSearchParams(window.location.search).get("tab");
                return <Redirect to={tab === "sauvie-island" || tab === "sauvie" ? "/outzide/sauvie-island" : "/outzide/rooster-rock"} />;
              }}
            </Route>
            <Route path={/^\/outz(?:\/.*)?$/i} component={LegacyOutzRedirect} />
            <Route path="/outzide" component={UnifiedMap} />
            <Route path="/outzide/share/:placeId" component={UnifiedMap} />
            <Route path="/outzide/rooster-rock" component={RoosterRock} />
            <Route path="/outzide/sauvie-island" component={SauvieIsland} />
            <Route path="/outzide/places" component={OutzidePlacesPage} />
            <Route path="/outzide/a-z" component={OutzideIndex} />
            <Route path="/outzide/:placeSlug">{() => <OutzPlace />}</Route>
            <Route path="/next">
              {() => <Redirect to="/about" />}
            </Route>
            <Route path="/darkroom">
              {() => <Redirect to="/about" />}
            </Route>
            <Route path="/design-preview" component={DesignSystemSandbox} />
            <Route path="/u/:username" component={MemberProfile} />
            <Route path="/missed-connections">
              {() => <MapWorldRedirect world="mizzed" />}
            </Route>
            <Route component={NotFound} />
            </Switch>
          </Suspense>
        </RouteBoundary>
      </main>
      {!hideFooter && <div className="site-pre-footer-edge" aria-hidden="true" />}
      {!hideFooter && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}
    </div>
  );
}

const CardFrontPreview = import.meta.env.DEV ? lazyWithReload(() => import("./pages/CardFrontPreview")) : null;
const CardSystemPreview = import.meta.env.DEV ? lazyWithReload(() => import("./pages/CardSystemPreview")) : null;

const OutzideTerrainPreview = import.meta.env.DEV ? lazyWithReload(() => import("./pages/dev/OutzideTerrainPreview")) : null;

export default function App() {
  if (OutzideTerrainPreview && window.location.pathname === "/dev/outzide-terrain") {
    return <Suspense fallback={<SpectrumLoader label="Opening Outzide terrain" />}><OutzideTerrainPreview /></Suspense>;
  }
  if (CardSystemPreview && window.location.pathname === "/dev/card-system") {
    return <Suspense fallback={<SpectrumLoader label="Opening preview"/>}><CardSystemPreview/></Suspense>;
  }
  // The Design Guide embeds this route as a production component specimen.
  // Keep the component inside the real product theme/router/query contexts, but
  // do not mount product chrome, account gates, analytics, prompts, or nudges in
  // the guide iframe.
  if (window.location.pathname.replace(/\/+$/, "") === "/design-system/specimen") {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Router>
            <ErrorBoundary>
              <Suspense fallback={<SpectrumLoader variant="full" label="Loading component" />}>
                <DestinationCardRenderer.Provider value={MappedDestinationCard}>
                  <DesignComponentSpecimen />
                </DestinationCardRenderer.Provider>
              </Suspense>
            </ErrorBoundary>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CalmAccountSync />
          <DeferredMount>
            <Suspense fallback={null}>
              <PushNotificationPrompt />
            </Suspense>
          </DeferredMount>
          <Suspense fallback={null}>
            <SuspendedAccountGate />
          </Suspense>
          <Suspense fallback={null}>
            <CommunityStandardsGate />
          </Suspense>
          <Router>
            <InboxSheetProvider>
              <HubPanelProvider>
              <BrowseScrollRestoration />
              <AnalyticsTracker />
              <DeferredMount>
                <Suspense fallback={null}>
                  <PrideGlowNudge />
                </Suspense>
              </DeferredMount>
              <RiverBratsIntroOnBeaches />
              <DestinationCardRenderer.Provider value={MappedDestinationCard}>
                <AppLayout />
              </DestinationCardRenderer.Provider>
              <Suspense fallback={null}>
                <Toaster />
              </Suspense>
              </HubPanelProvider>
            </InboxSheetProvider>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
