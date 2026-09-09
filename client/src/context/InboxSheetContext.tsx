import { lazy, Suspense, createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import FloatingInbox from "@/components/FloatingInbox";
import { isLocalDemo } from "@/lib/localDemo";

const InboxOverlay = lazy(() => import("@/components/InboxOverlay"));

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

function isInboxRoute(location: string) {
  return location === "/inbox" || location.startsWith("/inbox?");
}

export function InboxSheetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const pathname = location.split("?")[0] || location;
  const [hasOpened, setHasOpened] = useState(false);
  const [open, setOpen] = useState(false);
  const [openOpts, setOpenOpts] = useState<InboxSheetOpenOpts | null>(null);

  useEffect(() => {
    setOpen(false);
    setOpenOpts(null);
  }, [pathname]);

  const openSheet = useCallback((opts?: InboxSheetOpenOpts) => {
    setHasOpened(true);
    setOpenOpts(opts ?? null);
    setOpen(true);
  }, []);
  const closeSheet = useCallback(() => {
    setOpen(false);
    setOpenOpts(null);
  }, []);
  const toggleSheet = useCallback(() => {
    setHasOpened(true);
    setOpen((v) => {
      if (v) setOpenOpts(null);
      return !v;
    });
  }, []);

  const value = useMemo(
    () => ({ open, openOpts, openSheet, closeSheet, toggleSheet }),
    [open, openOpts, openSheet, closeSheet, toggleSheet],
  );

  // Members always; localhost/Vite also mounts the sheet so glass chrome can demo.
  const showOverlay = !isInboxRoute(location) && (Boolean(user) || isLocalDemo());

  return (
    <InboxSheetContext.Provider value={value}>
      {children}
      <FloatingInbox />
      {showOverlay && hasOpened && (
        <div className="inbox-sheet-host" aria-hidden={!open}>
          <Suspense fallback={<div role="status">Loading inbox…</div>}>
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
    </InboxSheetContext.Provider>
  );
}

export function useInboxSheet() {
  const ctx = useContext(InboxSheetContext);
  if (!ctx) throw new Error("useInboxSheet must be used within InboxSheetProvider");
  return ctx;
}
