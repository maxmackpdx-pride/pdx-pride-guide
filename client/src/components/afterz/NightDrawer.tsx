import { useEffect, useId, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import DockDrawer, { type DockStop } from "@/components/dock/DockDrawer";
import { apiRequest } from "@/lib/queryClient";
import { pacificCalendarDate } from "@shared/missedConnections";
import { afterzWindowState } from "@shared/afterzWindow";
import { base, GatheringRoom, HostForm, privateRead, type Gathering } from "./AfterzInvitations";
import AfterzWordmark from "./AfterzWordmark";
import AfterzNightCard, { type AfterzListing } from "./AfterzNightCard";

export type AfterzCard = AfterzListing & {
  eventId: number; occurrence: string; eventTitle: string; venue: string; poster: string | null; vibe: string;
  glow: boolean; sexPositive: boolean; lat: number | null; lng: number | null;
};
const nightPath = "/api/afterz/nights";
const discoveryPath = "/api/afterz/discovery";
export function useAfterzNights() {
  const { user } = useAuth();
  return useQuery<AfterzCard[]>({
    queryKey: [nightPath, user?.id], queryFn: ({ signal }) => privateRead(nightPath, signal),
    enabled: !!user, retry: false, refetchInterval: 60_000, gcTime: 0,
  });
}
function useAfterzWindow(previewNow?: number) {
  const [now, setNow] = useState(Date.now);
  const clock = afterzWindowState(previewNow ?? now);
  useEffect(() => {
    if (previewNow !== undefined) return;
    const refresh = () => setNow(Date.now());
    const next = (clock.open ? clock.closesAt : clock.opensAt) - Date.now();
    const timer = window.setTimeout(refresh, Math.max(1, next));
    document.addEventListener("visibilitychange", refresh);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [clock.open, clock.opensAt, clock.closesAt, previewNow]);
  return clock.open;
}

export default function NightDrawer({ roomId, onRoomChange, eventId, occurrenceDate, previewNow, sharePath, showWordmark = true }: {
  eventId?: number; occurrenceDate?: string; showWordmark?: boolean; previewNow?: number; sharePath?: string;
  roomId?: string | null; onRoomChange?: (id: string | null) => void;
} = {}) {
  const { user } = useAuth();
  const client = useQueryClient();
  const open = useAfterzWindow(previewNow);
  const occurrence = occurrenceDate ? pacificCalendarDate(occurrenceDate) : null;
  const nights = useAfterzNights();
  const mine = useQuery<Gathering[]>({ queryKey: [base, "mine", user?.id],
    queryFn: ({ signal }) => privateRead(base, signal), enabled: !!user && !eventId, retry: false, refetchInterval: 15_000, gcTime: 0 });
  const discovery = useQuery<{ confirmed: boolean }>({ queryKey: [discoveryPath, user?.id],
    queryFn: ({ signal }) => privateRead(discoveryPath, signal), enabled: !!user, retry: false, gcTime: 0 });
  const [showAuth, setShowAuth] = useState(false);
  const [hostForm, setHostForm] = useState(false);
  const [localId, setLocalId] = useState<string | null>(null);
  const id = onRoomChange ? roomId : localId;
  const select = onRoomChange ?? setLocalId;
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const formId = useId();
  const roomTitle = useRef<HTMLHeadingElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => { if (id) roomTitle.current?.focus(); }, [id]);
  const pick = (next: string | null) => {
    setProblem("");
    setHostForm(false);
    if (next) lastTrigger.current = document.activeElement as HTMLElement;
    select(next);
    if (!next) requestAnimationFrame(() => lastTrigger.current?.focus());
  };
  const list = new Map<string, AfterzListing>();
  if (!eventId && mine.isSuccess) for (const item of mine.data) list.set(item.id, item);
  if (nights.isSuccess) for (const item of nights.data) {
    if (!eventId || (item.eventId === eventId && item.occurrence === occurrence)) list.set(item.id, item);
  }
  const refresh = () => Promise.all([eventId ? undefined : mine.refetch(), nights.refetch(), discovery.refetch()]);
  const respond = async (night: AfterzListing, yes: boolean) => {
    if (busy) return;
    if (yes && night.role !== "guest" && night.role !== "passed") { pick(night.id); return; }
    if (yes && !discovery.data?.confirmed) { pick(night.id); return; }
    setBusy(night.id); setProblem("");
    const path = `${base}/${encodeURIComponent(night.id)}`;
    const endpoint = path + (yes ? "/request" : "/leave");
    const payload = yes ? { confirmed18: true } : { pass: true };
    try {
      await apiRequest("POST", endpoint, payload);
      client.removeQueries({ queryKey: [path + "/chat"] });
      await refresh();
    } catch (e) { setProblem(e instanceof Error ? e.message : "Could not update your RSVP. Try again."); }
    setBusy(null);
  };
  return <section className="afterz-drawer" aria-label="Afterz invitations">
    {showWordmark && <AfterzWordmark/>}
    {id ? <div className="afterz-invite-sheet">
      <button type="button" onClick={() => pick(null)}>Back to Afterz</button>
      <h3 ref={roomTitle} tabIndex={-1}>Afterz invitation</h3>
      <GatheringRoom key={id + ":" + user?.id} id={id} sharePath={sharePath} signIn={() => setShowAuth(true)} done={() => pick(null)}/>
    </div> : <>
      {user ? <button type="button" className="afterz-host-button" aria-expanded={hostForm} aria-controls={formId}
        onClick={() => setHostForm(!hostForm)}>Host an Afterz</button> :
        <button type="button" className="afterz-host-button" onClick={() => setShowAuth(true)}>Sign in for Afterz</button>}
      <p className="afterz-window">Window {open ? "open" : "closed"} · 9 PM to 6 AM Pacific</p>
      {user && hostForm && <div id={formId} key={user.id}><HostForm select={pick} eventId={eventId} occurrence={occurrence}/></div>}
      {user && <>
        {(nights.isError || (!eventId && mine.isError) || discovery.isError) && <p role="alert">Could not load your invitations. <button type="button" onClick={() => void refresh()}>Retry</button></p>}
        {discovery.data?.confirmed === false && <button type="button" className="afterz-discovery" disabled={busy === "discovery"} onClick={async () => {
          setBusy("discovery"); setProblem("");
          try { await apiRequest("POST", discoveryPath, { confirmed18: true }); await refresh(); }
          catch { setProblem("Could not load invitations. Try again."); }
          setBusy(null);
        }}>I’m 18 or older · Show event invites</button>}
        {problem && <p role="alert">{problem}</p>}
        {(nights.isLoading || mine.isLoading) && <p role="status">Loading invites…</p>}
        {!list.size && (eventId || mine.isSuccess) && nights.isSuccess && <p className="afterz-empty">{eventId ? "No Afterz invites for this event yet." : "No invitations yet. Open a host’s invite link to ask to join."}</p>}
        {[...list.values()].map(night => <AfterzNightCard key={night.id} night={night} busy={busy !== null} open={open}
          select={() => pick(night.id)} respond={yes => void respond(night, yes)}/>)}
      </>}
    </>}
    {showAuth && !user && <AuthModal onClose={() => setShowAuth(false)}/>}
  </section>;
}

export function AfterzMapDrawer() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const roomId = params.get("gathering");
  const [stop, setStop] = useState<DockStop>(1);
  const change = (id: string | null) => {
    const url = new URL(window.location.href);
    url.searchParams.delete("invites");
    if (id) url.searchParams.set("gathering", id);
    else url.searchParams.delete("gathering");
    navigate(url.pathname + url.search + url.hash, { replace: true });
  };
  return <DockDrawer accent="var(--day-wed)" stop={roomId ? 1 : stop} onStopChange={value => { if (!value && roomId) change(null); setStop(value); }}
    ariaLabel="Afterz" lipLabel="Afterz" brand={<AfterzWordmark/>}><NightDrawer showWordmark={false} roomId={roomId} onRoomChange={change}/></DockDrawer>;
}
