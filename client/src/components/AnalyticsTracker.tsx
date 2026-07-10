import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { trackPageView } from "@/lib/analytics";

export default function AnalyticsTracker() {
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    trackPageView(location, user?.id);
  }, [location, user?.id]);

  return null;
}