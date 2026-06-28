import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { resetPageScroll } from "./lib/resetPageScroll";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import FilmGrainOverlay from "./components/FilmGrainOverlay";

function ScrollToTop() {
  const [location] = useHashLocation();
  useEffect(() => {
    resetPageScroll();
    requestAnimationFrame(resetPageScroll);
  }, [location]);
  return null;
}
import Home from "./pages/Home";
import Events from "./pages/Events";
import Submit from "./pages/Submit";
import PrideWork from "./pages/PrideWork";
import Gifting from "./pages/Gifting";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import MissedConnections from "./pages/MissedConnections";
import NotFound from "./pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router hook={useHashLocation}>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col app-shell" style={{ background: "#0a0a0a" }}>
            <FilmGrainOverlay />
            <Nav />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/events" component={Events} />
                <Route path="/submit/claim/:eventId" component={Submit} />
                <Route path="/submit" component={Submit} />
                <Route path="/pride-work" component={PrideWork} />
                <Route path="/gifting" component={Gifting} />
                <Route path="/about" component={About} />
                <Route path="/admin" component={Admin} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/inbox" component={Inbox} />
                <Route path="/spotted" component={MissedConnections} />
                <Route path="/missed-connections">
                  {() => <Redirect to="/spotted" />}
                </Route>
                <Route component={NotFound} />
              </Switch>
            </main>
            <div className="rainbow-bar rainbow-bar--bleed site-pre-footer-rainbow" aria-hidden="true" />
            <Footer />
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}