import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import InboxOverlay from "@/components/InboxOverlay";

export type InboxSheetOpenOpts = {
  view?: "inbox" | "posts" | "stats";
  account?: "personal" | "admin" | "owner";
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
  const [open, setOpen] = useState(false);
  const [openOpts, setOpenOpts] = useState<InboxSheetOpenOpts | null>(null);

  useEffect(() => {
    setOpen(false);
    setOpenOpts(null);
  }, [pathname]);

  const openSheet = useCallback((opts?: InboxSheetOpenOpts) => {
    setOpenOpts(opts ?? null);
    setOpen(true);
  }, []);
  const closeSheet = useCallback(() => {
    setOpen(false);
    setOpenOpts(null);
  }, []);
  const toggleSheet = useCallback(() => {
    setOpen((v) => {
      if (v) setOpenOpts(null);
      return !v;
    });
  }, []);

  const value = useMemo(
    () => ({ open, openOpts, openSheet, closeSheet, toggleSheet }),
    [open, openOpts, openSheet, closeSheet, toggleSheet],
  );

  const showOverlay = Boolean(user) && !isInboxRoute(location);

  return (
    <InboxSheetContext.Provider value={value}>
      {children}
      {showOverlay && (
        <div className="inbox-sheet-host" aria-hidden={!open}>
          <InboxOverlay
            open={open}
            onClose={closeSheet}
            initialView={openOpts?.view}
            initialAccount={openOpts?.account}
          />
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