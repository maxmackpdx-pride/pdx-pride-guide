import { Switch, Route, Router, Redirect, useLocation } from "wouter";
import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { resetPageScroll } from "./lib/resetPageScroll";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Nav from "./components/Nav";
import MobileBottomNav from "./components/MobileBottomNav";
import Footer from "./components/Footer";
import FilmGrainOverlay from "./components/FilmGrainOverlay";
import ErrorBoundary from "./components/ErrorBoundary";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import AnalyticsTracker from "./components/AnalyticsTracker";

function RouteBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  // Key by path so navigating away from a crashed page recovers.
  return <ErrorBoundary key={location.split("?")[0]}>{children}</ErrorBoundary>;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    resetPageScroll();
    requestAnimationFrame(resetPageScroll);
  }, [location]);
  return null;
}
import Home from "./pages/Home";
import Events from "./pages/Events";
import Schedule from "./pages/Schedule";
import Submit from "./pages/Submit";
import PrideWork from "./pages/PrideWork";
import Gifting from "./pages/Gifting";
import About from "./pages/About";
import Resume from "./pages/Resume";
import Legal from "./pages/Legal";
import Contact from "./pages/Contact";
import Sponsors from "./pages/Sponsors";
import AccessSafety from "./pages/AccessSafety";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import NotificationSettings from "./pages/NotificationSettings";
import Inbox from "./pages/Inbox";
import MissedConnections from "./pages/MissedConnections";
import Directory from "./pages/Directory";
import NudeBeaches from "./pages/NudeBeaches";
import DesignSystemSandbox from "./pages/DesignSystemSandbox";
import MemberProfile from "./pages/MemberProfile";
import NotFound from "./pages/not-found";

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

  return (
    <div
      className={`min-h-screen flex flex-col app-shell${hub ? " app-shell--hub" : ""}${profile ? " app-shell--profile" : ""}`}
      style={{ background: "#0a0a0a" }}
    >
      <FilmGrainOverlay />
      {!profile && <Nav />}
      {!profile && <MobileBottomNav />}
      <main className="flex-1">
        <RouteBoundary>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/events/:id/:slug?" component={Events} />
            <Route path="/events" component={Events} />
            <Route path="/schedule">{() => <Schedule />}</Route>
            <Route path="/submit/claim/:eventId" component={Submit} />
            <Route path="/submit" component={Submit} />
            <Route path="/pride-work" component={PrideWork} />
            <Route path="/gifting" component={Gifting} />
            <Route path="/about" component={About} />
            <Route path="/resume" component={Resume} />
            <Route path="/contact" component={Contact} />
            <Route path="/sponsors" component={Sponsors} />
            <Route path="/access" component={AccessSafety} />
            <Route path="/legal" component={Legal} />
            <Route path="/admin" component={Admin} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/settings/notifications" component={NotificationSettings} />
            <Route path="/inbox" component={Inbox} />
            <Route path="/spotted" component={MissedConnections} />
            <Route path="/directory" component={Directory} />
            <Route path="/nude-beaches" component={NudeBeaches} />
            <Route path="/design-preview" component={DesignSystemSandbox} />
            <Route path="/u/:username" component={MemberProfile} />
            <Route path="/missed-connections">
              {() => <Redirect to="/spotted" />}
            </Route>
            <Route component={NotFound} />
          </Switch>
        </RouteBoundary>
      </main>
      {!profile && <div className="rainbow-bar rainbow-bar--bleed site-pre-footer-rainbow" aria-hidden="true" />}
      {!profile && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PushNotificationPrompt />
          <Router>
            <ScrollToTop />
            <AnalyticsTracker />
            <AppLayout />
            <Toaster />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}