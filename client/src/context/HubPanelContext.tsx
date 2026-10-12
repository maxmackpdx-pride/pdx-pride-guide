import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { MOBILE_NAV_DISMISS, dismissMobileNavOverlays, type MobileNavDismissDetail } from "@/lib/mobileNavDismiss";
import type { HubFeedResponse } from "@shared/hubFeed";
import { useLocation } from "wouter";

const HubPanel = lazy(() => import("@/components/hub/HubPanel"));
const Context = createContext<{
  isOpen: boolean;
  hasNewActivity: boolean;
  openHub: (trigger?: HTMLElement) => void;
  toggleHub: (trigger?: HTMLElement) => void;
  closeHub: () => void;
  markHubSeen: () => void;
  latestActivityKey: string;
} | null>(null);

export function useHubPanel() {
  const context = useContext(Context);
  if (!context) throw new Error("HubPanelProvider is required");
  return context;
}

export function HubPanelProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const cache = useQueryClient();
  const [isOpen, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const openedRoute = useRef("");
  const [seen, setSeen] = useState("");
  const seenKey = `zaylist-hub-seen:${user?.id ?? "guest"}`;
  useEffect(() => {
    setSeen("");
    try { setSeen(localStorage.getItem(seenKey) || ""); } catch { /* Storage is optional. */ }
  }, [seenKey]);
  const head = useQuery<HubFeedResponse>({
    queryKey: ["/api/hub/feed/head", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch("/api/hub/feed?tab=all&limit=1", { credentials: "include" });
      if (!response.ok) throw new Error("Could not check Hub activity");
      return response.json();
    },
    staleTime: 60_000,
    refetchInterval: 90_000,
    refetchIntervalInBackground: false,
  });
  const newest = head.data?.items[0];
  const latest = newest ? `${newest.id}|${newest.createdAt}` : "";
  const latestRef = useRef(latest);
  latestRef.current = latest;
  const markHubSeen = useCallback(() => {
    const value = latestRef.current;
    if (!value) return;
    setSeen(value);
    try { localStorage.setItem(seenKey, value); } catch { /* Storage is optional. */ }
  }, [seenKey]);
  const closeHub = useCallback(() => setOpen(false), []);
  const openHub = useCallback((element?: HTMLElement) => {
    if (element) trigger.current = element;
    openedRoute.current = window.location.pathname;
    dismissMobileNavOverlays("hub-panel");
    void cache.invalidateQueries({ queryKey: ["/api/hub/feed/head"] });
    setHasOpened(true);
    setOpen(true);
  }, [cache]);
  useEffect(() => {
    if (isOpen && openedRoute.current !== window.location.pathname) setOpen(false);
  }, [location, isOpen]);
  const toggleHub = useCallback((element?: HTMLElement) => {
    if (isOpen) closeHub();
    else openHub(element);
  }, [isOpen, closeHub, openHub]);
  useEffect(() => {
    const dismiss = (event: Event) => {
      if ((event as CustomEvent<MobileNavDismissDetail>).detail?.except !== "hub-panel") setOpen(false);
    };
    window.addEventListener(MOBILE_NAV_DISMISS, dismiss);
    return () => window.removeEventListener(MOBILE_NAV_DISMISS, dismiss);
  }, []);
  return <Context.Provider value={{ isOpen, openHub, toggleHub, closeHub, markHubSeen, latestActivityKey: latest, hasNewActivity: !!latest && latest !== seen }}>
    {children}
    {hasOpened && <Suspense fallback={null}><HubPanel key={user?.id ?? "guest"} open={isOpen} onOpenChange={setOpen} trigger={trigger} /></Suspense>}
  </Context.Provider>;
}
