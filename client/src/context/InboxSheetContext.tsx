import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import FloatingInbox from "@/components/FloatingInbox";
import { isLocalDemo } from "@/lib/localDemo";

const InboxOverlay = lazy(() => import("@/components/InboxOverlay"));
const AuthModal = lazy(() => import("@/components/AuthModal"));

export type InboxSheetOpenOpts = {
  view?: "inbox" | "posts" | "stats";
  account?: "personal" | "admin" | "owner";
  threadId?: string | null;
};

type InboxSheetContextValue = {
  open: boolean;
  openOpts: InboxSheetOpenOpts | null;
  openSheet: (opts?: InboxSheetOpenOpts) => void;
  closeSheet: () => void;
  toggleSheet: () => void;
};

const InboxSheetContext = createContext<InboxSheetContextValue | null>(null);

/** Board 30: /inbox is a door, not a page. It lands on Home with the sheet open. */
function inboxDoorOpts(): InboxSheetOpenOpts {
  const threadId = new URLSearchParams(window.location.search).get("thread")?.trim() || null;
  return { view: "inbox", account: "personal", threadId };
}

// A guest's door waits here for sign-in. Session storage, because signing in
// remounts this provider.
const DOOR_KEY = "zaylist-inbox-door";
function readDoor(): InboxSheetOpenOpts | null {
  try {
    const raw = sessionStorage.getItem(DOOR_KEY);
    return raw ? (JSON.parse(raw) as InboxSheetOpenOpts) : null;
  } catch {
    return null;
  }
}
function writeDoor(opts: InboxSheetOpenOpts | null) {
  try {
    if (opts) sessionStorage.setItem(DOOR_KEY, JSON.stringify(opts));
    else sessionStorage.removeItem(DOOR_KEY);
  } catch {
    // Private mode: the guest signs in and opens the inbox themselves.
  }
}

export function InboxSheetProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const pathname = location.split("?")[0] || location;
  const [open, setOpen] = useState(false);
  const [overlayActivated, setOverlayActivated] = useState(false);
  const [openOpts, setOpenOpts] = useState<InboxSheetOpenOpts | null>(null);
  // Sheet opts carried through the /inbox door; guests hold them until they sign in.
  const arrivalRef = useRef<InboxSheetOpenOpts | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const guestRedirectRef = useRef(false);
  const lastPathRef = useRef<string | null>(null);

  const openSheet = useCallback((opts?: InboxSheetOpenOpts) => {
    setOverlayActivated(true);
    setOpenOpts(opts ?? null);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (pathname === "/inbox") {
      lastPathRef.current = pathname;
      if (authLoading) return;
      const opts = inboxDoorOpts();
      if (user || isLocalDemo()) arrivalRef.current = opts;
      else {
        writeDoor(opts);
        setAuthOpen(true);
        guestRedirectRef.current = true;
      }
      setLocation("/", { replace: true });
      return;
    }
    const prevPath = lastPathRef.current;
    if (prevPath === pathname) return;
    lastPathRef.current = pathname;
    // A guest who walks away from the door drops it; the door's own redirect keeps it.
    if (guestRedirectRef.current) guestRedirectRef.current = false;
    else if (prevPath !== null) writeDoor(null);
    const arrival = arrivalRef.current;
    arrivalRef.current = null;
    if (arrival) {
      openSheet(arrival);
      return;
    }
    setOpen(false);
    setOpenOpts(null);
  }, [pathname, authLoading, user, setLocation, openSheet]);

  useEffect(() => {
    if (!user) return;
    const door = readDoor();
    if (!door) return;
    writeDoor(null);
    setAuthOpen(false);
    openSheet(door);
  }, [user, openSheet]);

  const closeSheet = useCallback(() => {
    setOpen(false);
    setOpenOpts(null);
  }, []);
  const toggleSheet = useCallback(() => {
    setOpen((v) => {
      if (!v) setOverlayActivated(true);
      if (v) setOpenOpts(null);
      return !v;
    });
  }, []);

  const value = useMemo(
    () => ({ open, openOpts, openSheet, closeSheet, toggleSheet }),
    [open, openOpts, openSheet, closeSheet, toggleSheet],
  );

  // Members always; localhost/Vite also mounts the sheet so glass chrome can demo.
  const showOverlay = Boolean(user) || isLocalDemo();

  return (
    <InboxSheetContext.Provider value={value}>
      {children}
      <FloatingInbox />
      {showOverlay && overlayActivated && (
        <div className="inbox-sheet-host" aria-hidden={!open}>
          <Suspense fallback={null}>
            <InboxOverlay
              open={open}
              onClose={closeSheet}
              initialView={openOpts?.view}
              initialAccount={openOpts?.account}
              initialThreadId={openOpts?.threadId}
            />
          </Suspense>
        </div>
      )}
      {authOpen && !user && (
        <Suspense fallback={null}>
          <AuthModal onClose={() => setAuthOpen(false)} />
        </Suspense>
      )}
    </InboxSheetContext.Provider>
  );
}

export function useInboxSheet() {
  const ctx = useContext(InboxSheetContext);
  if (!ctx) throw new Error("useInboxSheet must be used within InboxSheetProvider");
  return ctx;
}
