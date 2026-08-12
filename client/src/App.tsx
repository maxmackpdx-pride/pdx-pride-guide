import { Switch, Route, Router, Redirect, useLocation } from "wouter";
import { lazy, Suspense, useEffect, type ComponentType, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { scheduleScrollReset } from "./lib/resetPageScroll";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import { InboxSheetProvider } from "./context/InboxSheetContext";
import { ThemeProvider } from "./context/ThemeContext";
import Nav from "./components/Nav";
import MobileBottomNav from "./components/MobileBottomNav";
import PullToRefresh from "./components/PullToRefresh";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import AnalyticsTracker from "./components/AnalyticsTracker";
import PrideGlowNudge from "./components/PrideGlowNudge";
import RiverBratsIntroPopup from "./components/river-brats/RiverBratsIntroPopup";
import SpectrumLoader from "./components/SpectrumLoader";

/** Mount intro outside RouteBoundary so a page crash cannot kill the popup. */
function RiverBratsIntroOnBeaches() {
  const [location] = useLocation();
  const path = location.split("?")[0] || "";
  if (!path.startsWith("/z/out/")) return null;
  return <RiverBratsIntroPopup />;
}

function RouteBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  // Key by path so navigating away from a crashed page recovers.
  return <ErrorBoundary key={location.split("?")[0]}>{children}</ErrorBoundary>;
}

function ScrollToTop() {
  const [location] = useLocation();
  // Pathname only - query changes (filters, ?q=) must not yank scroll to top
  const pathname = location.split("?")[0] || location;
  useEffect(() => {
    scheduleScrollReset();
  }, [pathname]);
  return null;
}
import Home from "./pages/Home";
import { Z_ADDRESSES, Z_ENCODED_ALIASES, zUrl } from "@shared/zNamespace";
import { Z_CATEGORY_ADDRESSES } from "./lib/zCategoryAddresses";
import CommunityStandardsGate from "./components/CommunityStandardsGate";
import SuspendedAccountGate from "./components/SuspendedAccountGate";
import ResetPassword from "./pages/ResetPassword";

const Events = lazy(() => import("./pages/Events"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Submit = lazy(() => import("./pages/Submit"));
const PrideWork = lazy(() => import("./pages/PrideWork"));
const Gifting = lazy(() => import("./pages/Gifting"));
const Housing = lazy(() => import("./pages/Housing"));
const HousingNew = lazy(() => import("./pages/HousingNew"));
const HousingPost = lazy(() => import("./pages/HousingPost"));
const About = lazy(() => import("./pages/About"));
const Resume = lazy(() => import("./pages/Resume"));
const Legal = lazy(() => import("./pages/Legal"));
const Contact = lazy(() => import("./pages/Contact"));
const Sponsors = lazy(() => import("./pages/Sponsors"));
const AccessSafety = lazy(() => import("./pages/AccessSafety"));
const Admin = lazy(() => import("./pages/Admin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const Inbox = lazy(() => import("./pages/Inbox"));
const MissedConnections = lazy(() => import("./pages/MissedConnections"));
const Directory = lazy(() => import("./pages/Directory"));
const RoosterRock = lazy(() => import("./pages/RoosterRock"));
const SauvieIsland = lazy(() => import("./pages/SauvieIsland"));
const Darkroom = lazy(() => import("./pages/Darkroom"));
const DesignSystemSandbox = lazy(() => import("./pages/DesignSystemSandbox"));
const ZAddressPending = lazy(() => import("./pages/ZAddressPending"));
const ZIndex = lazy(() => import("./pages/ZIndex"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const NotFound = lazy(() => import("./pages/not-found"));

/**
 * Board page for each existing route, so the `z/` address table drives routing
 * instead of a second hand-maintained list that can drift from it.
 */
const PAGE_FOR_ROUTE: Record<string, ComponentType<any>> = {
  "/events": Events,
  "/the-hauz": Housing,
  "/gifting": Gifting,
  "/pride-work": PrideWork,
  "/spotted": MissedConnections,
  "/directory": Directory,
  "/z/out/rooster-rock": RoosterRock,
  "/z/out/sauvie-island": SauvieIsland,
};

function isHubPath(path: string) {
  const bare = path.split("?")[0];
  return bare === "/dashboard" || bare === "/admin" || bare === "/inbox";
}

function isProfilePath(path: string) {
  return path.split("?")[0].startsWith("/u/");
}

function AppLayout() {
  const [location] = useLocation();
  const hub = isHubPath(location);
  const profile = isProfilePath(location);
  // /admin keeps HubShell's own bottom bar. Member hub (/dashboard, /inbox)
  // uses the global MobileBottomNav only (HubShell member bar removed).
  const adminShell = location.split("?")[0] === "/admin";

  return (
    <div
      className={`min-h-screen flex flex-col app-shell${hub ? " app-shell--hub" : ""}${profile ? " app-shell--profile" : ""}`}
      style={{ background: "var(--ink-800, #0a0a0a)" }}
    >
      <PullToRefresh />
      <Nav />
      {!adminShell && <MobileBottomNav />}
      <main className="flex-1">
        <RouteBoundary>
          <Suspense fallback={<SpectrumLoader variant="full" label="Loading page" />}>
            <Switch>
            {/*
              z/ address system. Additive on purpose: each address resolves to
              the board that already exists, and the existing path stays live
              and canonical. Flipping canonical to z/ means 301ing indexed URLs,
              which is the one step here that browsers cache and that cannot be
              quietly undone, so it is held for an explicit decision.
              Longest path first so Z/OUT destinations are never shadowed.
            */}
            <Route path="/z" component={ZIndex} />
            {Object.entries(Z_ENCODED_ALIASES).map(([from, to]) => (
              <Route key={from} path={from}>{() => <Redirect to={to} />}</Route>
            ))}
            {Z_CATEGORY_ADDRESSES.map(categoryAddress => (
              <Route key={categoryAddress.path} path={zUrl(categoryAddress.path)}>
                {() => <Redirect to={categoryAddress.route} />}
              </Route>
            ))}
            <Route path="/z/spaces">{() => <Redirect to="/directory?type=group" />}</Route>
            {[...Z_ADDRESSES]
              .sort((a, b) => b.path.length - a.path.length)
              .map(address => (
                <Route
                  key={address.path}
                  path={zUrl(address.path)}
                  component={
                    (address.route && PAGE_FOR_ROUTE[address.route]) || ZAddressPending
                  }
                />
              ))}
            <Route path="/" component={Home} />
            <Route path="/events/:id/:slug?" component={Events} />
            <Route path="/events" component={Events} />
            <Route path="/schedule">{() => <Schedule />}</Route>
            <Route path="/submit/claim/:eventId" component={Submit} />
            <Route path="/submit" component={Submit} />
            <Route path="/pride-work" component={PrideWork} />
            <Route path="/gigs">
              {() => <Redirect to="/pride-work" />}
            </Route>
            <Route path="/gifting" component={Gifting} />
            <Route path="/the-hauz/new" component={HousingNew} />
            <Route path="/the-hauz/:id" component={HousingPost} />
            <Route path="/the-hauz" component={Housing} />
            <Route path="/hausing/new">
              {() => <Redirect to="/the-hauz/new" />}
            </Route>
            <Route path="/hausing/:id">
              {(params) => <Redirect to={`/the-hauz/${params.id}`} />}
            </Route>
            <Route path="/hausing">
              {() => <Redirect to="/the-hauz" />}
            </Route>
            <Route path="/housing/new">
              {() => <Redirect to="/the-hauz/new" />}
            </Route>
            <Route path="/housing/:id">
              {(params) => <Redirect to={`/the-hauz/${params.id}`} />}
            </Route>
            <Route path="/housing">
              {() => <Redirect to="/the-hauz" />}
            </Route>
            <Route path="/about" component={About} />
            <Route path="/resume" component={Resume} />
            <Route path="/contact" component={Contact} />
            <Route path="/sponsors" component={Sponsors} />
            <Route path="/access" component={AccessSafety} />
            <Route path="/legal" component={Legal} />
            <Route path="/admin" component={Admin} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/settings/notifications" component={NotificationSettings} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/inbox" component={Inbox} />
            <Route path="/spotted" component={MissedConnections} />
            <Route path="/directory/:id/:slug?" component={Directory} />
            <Route path="/directory" component={Directory} />
            <Route path="/nude-beaches">
              {() => {
                const tab = new URLSearchParams(window.location.search).get("tab");
                return <Redirect to={tab === "sauvie-island" || tab === "sauvie" ? "/z/out/sauvie-island" : "/z/out/rooster-rock"} />;
              }}
            </Route>
            <Route path="/next" component={Darkroom} />
            <Route path="/darkroom">
              {() => <Redirect to="/next" />}
            </Route>
            <Route path="/design-preview" component={DesignSystemSandbox} />
            <Route path="/u/:username" component={MemberProfile} />
            <Route path="/missed-connections">
              {() => <Redirect to="/spotted" />}
            </Route>
            <Route component={NotFound} />
            </Switch>
          </Suspense>
        </RouteBoundary>
      </main>
      <div className="rainbow-bar rainbow-bar--bleed site-pre-footer-rainbow" aria-hidden="true" />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PushNotificationPrompt />
          <SuspendedAccountGate />
          <CommunityStandardsGate />
          <Router>
            <InboxSheetProvider>
              <ScrollToTop />
              <AnalyticsTracker />
              <PrideGlowNudge />
              <RiverBratsIntroOnBeaches />
              <AppLayout />
              <Toaster />
            </InboxSheetProvider>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
