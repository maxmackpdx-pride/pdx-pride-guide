import { useEffect, useState, type CSSProperties } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DockDrawer, { type DockStop } from "@/components/dock/DockDrawer";
import { DrawerTop } from "@/components/drawers";
import AuthModal from "@/components/AuthModal";
import AfterzHostForm from "@/components/afterz/AfterzHostForm";
import AfterzNightCard, { type AfterzNightView } from "@/components/afterz/AfterzNightCard";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { rsvpAfterzNo, rsvpAfterzYes } from "@/lib/afterzDrawerApi";
import { AFTERZ_OFF_HOURS_COPY, afterzWindowState, type AfterzWindowState } from "@shared/afterzWindow";
import { EMPTY_DRAWER_FILTERS, type DrawerFilterState } from "@shared/drawerFilters";
import type { DrawerTopEvent } from "@shared/drawerTop";
import "./AfterzDrawer.css";

/**
 * Afterz map drawer. Shared DrawerTop stays in place. A wide Host an Afterz
 * button sits above yellow-bloom Afterz cards with RSVP Yes / No, the host
 * name, and the Afterz type. During off hours the map blurs, this drawer
 * opens, and the host form is offered in advance.
 */
export default function AfterzDrawer({
  now,
  nights,
  windowState,
  events,
  startOpen,
  startHostForm,
}: {
  now?: number;
  nights?: AfterzNightView[];
  windowState?: AfterzWindowState;
  events?: DrawerTopEvent[];
  startOpen?: boolean;
  startHostForm?: boolean;
} = {}) {
  "use memo";
  const { user } = useAuth();
  const client = useQueryClient();
  const at = now ?? Date.now();
  const windowQuery = useQuery<AfterzWindowState>({
    queryKey: ["/api/afterz/window"],
    queryFn: () => apiRequest("GET", "/api/afterz/window").then(r => r.json()),
    enabled: windowState == null,
    refetchInterval: 60_000,
  });
  const clock = windowState ?? windowQuery.data ?? afterzWindowState(at);
  const open = clock.open;
  const [stop, setStop] = useState<DockStop>(() => (startOpen ?? !open) ? 1 : 0);
  useEffect(() => {
    if (startOpen ?? !open) setStop(current => (current === 0 ? 1 : current));
  }, [open, startOpen]);
  const [filters, setFilters] = useState<DrawerFilterState>(EMPTY_DRAWER_FILTERS);
  const [hostOpen, setHostOpen] = useState(() => startHostForm ?? !open);
  const [auth, setAuth] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const eventQuery = useQuery<DrawerTopEvent[]>({
    queryKey: ["/api/events", "afterz-drawer-countdown"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    enabled: events == null,
  });
  const nightsQuery = useQuery<AfterzNightView[]>({
    queryKey: ["/api/afterz/nights", user?.id],
    queryFn: () => apiRequest("GET", "/api/afterz/nights").then(r => r.json()),
    enabled: nights == null && !!user,
    retry: false,
    refetchInterval: 60_000,
  });
  const list = nights ?? nightsQuery.data ?? [];

  const rsvp = async (id: string, yes: boolean) => {
    if (!user) {
      setAuth(true);
      return;
    }
    if (!open && yes) {
      setError("People in the area can request to join only once the window opens at 9 PM Pacific.");
      return;
    }
    setBusyId(id);
    setError("");
    try {
      if (yes) await rsvpAfterzYes(id, true);
      else await rsvpAfterzNo(id);
      void client.invalidateQueries({ queryKey: ["/api/afterz/nights"] });
      void client.invalidateQueries({ queryKey: ["/api/afterz/gatherings"] });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update your RSVP.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {!open && (
        <div className="afterz-map-blur" data-testid="afterz-map-blur" aria-hidden="false">
          <p className="afterz-map-blur__copy">{AFTERZ_OFF_HOURS_COPY}</p>
        </div>
      )}
      <DockDrawer
        accent="var(--yellow)"
        ariaLabel="Afterz host form, gatherings, and filters"
        lipLabel="Afterz · Host · Filters"
        stop={stop}
        onStopChange={setStop}
        maxStops={1}
      >
        <div className="afterz-drawer pdx-glass-rebind" style={{ "--c": "var(--yellow)" } as CSSProperties} data-testid="afterz-drawer" data-afterz-window={open ? "open" : "off-hours"}>
          <DrawerTop
            events={events ?? eventQuery.data ?? []}
            filters={filters}
            onFiltersChange={setFilters}
            now={at}
          />
          {!hostOpen && (
            <button
              type="button"
              className="afterz-host-btn"
              aria-expanded={false}
              data-testid="afterz-host-button"
              onClick={() => {
                if (!user) { setAuth(true); return; }
                setHostOpen(true);
              }}
            >
              {open ? "Host an Afterz" : "Host an Afterz in advance"}
            </button>
          )}
          {hostOpen && (
            <AfterzHostForm
              inAdvance={!open}
              signedIn={!!user}
              onRequireAuth={() => setAuth(true)}
              onCancel={() => setHostOpen(false)}
            />
          )}
          {nightsQuery.isError && nights == null && (
            <p className="afterz-drawer-status" role="alert">
              Afterz could not load.{" "}
              <button type="button" onClick={() => void nightsQuery.refetch()}>Retry</button>
            </p>
          )}
          {error && <p className="afterz-drawer-status" role="alert">{error}</p>}
          {!!user && nightsQuery.isPending && nights == null && (
            <p className="afterz-drawer-status" role="status">Loading Afterz…</p>
          )}
          {!user && (
            <p className="afterz-drawer-status">
              Sign in to see Afterz in the area and to host one.{" "}
              <button type="button" onClick={() => setAuth(true)}>Sign in</button>
            </p>
          )}
          {list.map(night => (
            <AfterzNightCard
              key={night.id}
              night={night}
              windowOpen={open}
              busy={busyId === night.id}
              onYes={id => void rsvp(id, true)}
              onNo={id => void rsvp(id, false)}
            />
          ))}
        </div>
      </DockDrawer>
      {auth && !user && <AuthModal onClose={() => setAuth(false)} />}
    </>
  );
}
