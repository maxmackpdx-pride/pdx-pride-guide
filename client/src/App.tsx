import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Submit from "./pages/Submit";
import PrideWork from "./pages/PrideWork";
import About from "./pages/About";
import Admin from "./pages/Admin";
import NotFound from "./pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
          <Nav />
          <main className="flex-1">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/events" component={Events} />
              <Route path="/submit" component={Submit} />
              <Route path="/pride-work" component={PrideWork} />
              <Route path="/about" component={About} />
              <Route path="/admin" component={Admin} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
        </div>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}
