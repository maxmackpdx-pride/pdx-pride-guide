import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { trackPageView } from "@/lib/analytics";
import { trackGooglePageView } from "@/lib/googleAnalytics";

// Stop waiting on /api/auth/me after this long and record the view anyway, so a
// stalled auth request never swallows the page view outright.
const AUTH_WAIT_MS = 4000;

export default function AnalyticsTracker() {
  const [location] = useLocation();
  const { user, loading } = useAuth();
  const [authWaitedOut, setAuthWaitedOut] = useState(false);
  // Last path actually recorded, so one page load stays one page view.
  const sentPath = useRef<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setAuthWaitedOut(true), AUTH_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const path = location.split("?")[0] || location;
  const authSettled = !loading || authWaitedOut;

  useEffect(() => {
    // Hold the first view until auth settles. Sending once while loading and
    // again on the resolved user id counted every signed-in visit twice: once
    // as an anonymous visitor, once as the member.
    if (!authSettled || sentPath.current === path) return;
    sentPath.current = path;
    trackPageView(path, user?.id);
    trackGooglePageView(path);
  }, [path, authSettled, user?.id]);

  return null;
}
