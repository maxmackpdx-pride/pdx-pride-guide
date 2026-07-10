import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import InboxOverlay from "@/components/InboxOverlay";

type InboxSheetContextValue = {
  open: boolean;
  openSheet: () => void;
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location]);

  const openSheet = useCallback(() => setOpen(true), []);
  const closeSheet = useCallback(() => setOpen(false), []);
  const toggleSheet = useCallback(() => setOpen((v) => !v), []);

  const value = useMemo(
    () => ({ open, openSheet, closeSheet, toggleSheet }),
    [open, openSheet, closeSheet, toggleSheet],
  );

  const showOverlay = Boolean(user) && !isInboxRoute(location);

  return (
    <InboxSheetContext.Provider value={value}>
      {children}
      {showOverlay && (
        <div className="inbox-sheet-host" aria-hidden={!open}>
          <InboxOverlay open={open} onClose={closeSheet} />
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