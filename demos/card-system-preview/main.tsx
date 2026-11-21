import { useEffect, useState, type MouseEvent } from "react";
import { createRoot } from "react-dom/client";
import { Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, CarFront, Images, RotateCcw } from "lucide-react";
import NightDrawer from "@/components/afterz/NightDrawer";
import EventPlanning from "@/components/events/EventPlanning";
import { AuthPresentationProvider } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import "@/components/ds/tokens/colors.css";
import { createDemoApi, DEMO_EVENT, DEMO_NOW, DEMO_PERSONAS, type DemoPersona } from "./demo-api";
import { DEMO_IDENTITY_EVENT } from "./DemoAuthModal";
import "./site.css";

const media = "/demo/media/";
function browserStorage() {
  try { return window.localStorage; } catch { return undefined; }
}
const api = createDemoApi({ storage: browserStorage(), poster: media + "poster.jpg" });
const networkFetch = window.fetch.bind(window);
window.fetch = function demoFetch(input, init) {
  const url = new URL(input instanceof Request ? input.url : String(input), document.baseURI);
  if (url.origin === location.origin && url.pathname.startsWith("/api/")) return api.fetch(input, init);
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (url.origin === location.origin && /^\/demo\/(media|assets)\//.test(url.pathname) && ["GET","HEAD"].includes(method)) {
    return networkFetch(input, init);
  }
  return Promise.resolve(new Response("Unavailable in the private demo.", { status: 404 }));
};
const invite = new URL(location.href).searchParams.get("gathering");
if (invite) history.replaceState(null, "", "/demo/#/afterz/" + encodeURIComponent(invite));

const captures = [
  { file: "card", label: "Expanded event card", detail: "The Yes Coach event card open to its Info page." },
  { file: "tickets", label: "Ticket details", detail: "The Info page showing presale, door admission and the ticket source." },
  { file: "placez", label: "Events + Placez", detail: "The Events and Placez drawer at phone width." },
  { file: "outzide", label: "Outzide", detail: "The Outzide map and its discovery drawer." },
  { file: "afterz", label: "Afterz", detail: "The Afterz invitation drawer inside the event card." },
  { file: "mizzed", label: "Mizzed Connections", detail: "The Mizzed Connections panel with its event window." },
] as const;

function CaptureGallery({ selected }: { selected?: string }) {
  const item = captures.find(capture => capture.file === selected);
  if (item) return <section className="preview-view">
    <a className="preview-back" href="#/captures"><ArrowLeft size={16} /> All captures</a>
    <h2>{item.label}</h2>
    <img className="preview-capture-full" src={media + item.file + ".png"} alt={item.detail} />
    <a className="preview-back" href={media + item.file + ".png"} target="_blank" rel="noopener noreferrer">
      Open full-size image <ArrowUpRight size={16}/>
    </a>
  </section>;
  return <section className="preview-view"><h2>Screen captures</h2>
    <div className="preview-gallery">{captures.map(capture =>
      <a key={capture.file} href={"#/captures/" + capture.file}>
        <span><img src={media + capture.file + ".png"} alt={capture.detail} loading="lazy"/></span>
        <strong>{capture.label}<ArrowUpRight size={16}/></strong>
      </a>
    )}</div>
  </section>;
}

type LocalRecord = { username?: string; displayName?: string; bio?: string; location?: { address: string | null; lat: number | null; lng: number | null } };
function DetailRecord({ kind, id, persona }: { kind: "member" | "directions"; id: string; persona: DemoPersona }) {
  const roomHref = "#/afterz/" + encodeURIComponent(id);
  const path = kind === "member" ? "/api/demo/profiles/" + encodeURIComponent(id) :
    "/api/afterz/gatherings/" + encodeURIComponent(id) + "/chat/location/directions";
  const record = useQuery<LocalRecord>({ queryKey: ["demo-record", path, persona], retry: false, queryFn: async ({signal}) => {
    const response = await fetch(path, { signal });
    if (!response.ok) throw new Error("Unavailable to this demo profile.");
    return response.json();
  }});
  return <section className="preview-view preview-record">
    <a className="preview-back" href={kind === "member" ? "#/rides" : roomHref}>
      <ArrowLeft size={16} />{kind === "member" ? "Back to Ridez" : "Back to invitation"}
    </a>
    {record.isPending ? <p role="status">Opening…</p> : record.isError ? <p role="status">Unavailable to this demo profile.</p> :
      kind === "member" ? <><h2>{record.data.displayName}</h2><p>@{record.data.username}</p><p>{record.data.bio}</p></> :
      <><h2>Meeting point</h2><p>{record.data.location?.address || "Host’s demo location pin"}</p>
        {record.data.location?.lat != null && record.data.location.lng != null && <p>{record.data.location.lat}, {record.data.location.lng}</p>}
        <p>Fictional directions for this invitation.</p></>}
  </section>;
}

function decodedRouteId(raw: string | undefined) {
  if (!raw) return "";
  try { return decodeURIComponent(raw); } catch { return ""; }
}
function identity() { return { persona: api.getPersona(), user: api.getUser() }; }

function Workspace() {
  const [route, navigate] = useLocation();
  const [{ persona, user }, setIdentity] = useState(identity);
  const [revision, setRevision] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState("");
  const [, section = "", rawId] = route.split("/");
  const id = decodedRouteId(rawId);
  const tab = section === "rides" || section === "u" ? "rides" : section === "captures" ? "captures" : "afterz";
  function changePersona(next: DemoPersona) {
    api.setPersona(next);
    queryClient.clear();
    setIdentity(identity());
    setConfirmReset(false);
    setNotice("");
  }
  useEffect(() => {
    function change(event: Event) {
      const next = (event as CustomEvent<DemoPersona>).detail;
      if (DEMO_PERSONAS.some(persona => persona.id === next)) changePersona(next);
    }
    window.addEventListener(DEMO_IDENTITY_EVENT, change);
    return () => window.removeEventListener(DEMO_IDENTITY_EVENT, change);
  }, []);
  function reset() {
    api.reset();
    changePersona(api.getPersona());
    setRevision(value => value + 1);
    navigate("/afterz");
    setNotice("Demo reset. The original invitations and rides are back.");
  }
  function interceptDemoLink(event: MouseEvent<HTMLElement>) {
    const node = event.target;
    const anchor = node instanceof Element && node.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const url = new URL(anchor.href);
    if (url.protocol === "tel:") {
      event.preventDefault(); event.stopPropagation();
      setNotice("Demo only. No phone call was placed.");
      return;
    }
    if (url.origin !== location.origin) return;
    const destination = url.pathname.match(/^\/api\/afterz\/gatherings\/([^/]+)\/chat\/location\/directions$/);
    const profile = url.pathname.match(/^\/u\/([^/]+)$/);
    if (destination || profile) {
      event.preventDefault(); event.stopPropagation();
      navigate(destination ? "/directions/" + destination[1] : "/u/" + profile![1]);
    }
  }
  const chooseMember = async () => { changePersona("member"); };
  return <AuthPresentationProvider value={{
    user, loading: false, login: chooseMember, register: chooseMember,
    logout: async () => changePersona("guest"), refreshUser: async () => {},
  }}>
    <div className="preview-page" onClickCapture={interceptDemoLink}>
      <header className="preview-head">
        <a href="#/afterz" aria-label="Eventz demo home"><img src={media + "eventz.png"} alt="Eventz"/></a>
        <a href="/" className="preview-original">Original demo <ArrowUpRight size={16}/></a>
      </header>
      <main className="preview-layout">
        <aside className="preview-event">
          <a href={media + "poster.jpg"} target="_blank" rel="noopener noreferrer" className="preview-poster" aria-label="Open the full Yes Coach poster">
            <img src={media + "poster.jpg"} alt="Yes Coach anniversary event poster"/>
          </a>
          <div className="preview-event__text">
            <div className="preview-dateline"><time dateTime={DEMO_EVENT.occurrence}>Sun · Nov 29, 2026</time></div>
            <h1>{DEMO_EVENT.title}</h1><p>{DEMO_EVENT.venueName} · Portland</p>
          </div>
        </aside>
        <div className="preview-workspace">
          <section className="preview-tools" aria-label="Demo settings">
            <label><span>Demo profile</span><select value={persona} onChange={event => changePersona(event.target.value as DemoPersona)}>
              {DEMO_PERSONAS.map(person => <option key={person.id} value={person.id}>{person.label}</option>)}
            </select></label>
            <button type="button" className="preview-reset" onClick={() => setConfirmReset(!confirmReset)} aria-expanded={confirmReset}>
              <RotateCcw size={15}/> Reset
            </button>
            {confirmReset && <div className="preview-reset-confirm"><p>Restore the sample invitations, messages and rides?</p>
              <button type="button" onClick={reset}>Reset demo</button>
              <button type="button" onClick={() => setConfirmReset(false)}>Keep my changes</button></div>}
            <span className="preview-note">Fictional profiles and plans. Changes stay in this browser.</span>
          </section>
          <nav className="preview-nav" aria-label="Demo sections">
            <a href="#/afterz" aria-current={tab === "afterz" ? "page" : undefined}><ArrowDownLeft size={17}/> Afterz</a>
            <a href="#/rides" aria-current={tab === "rides" ? "page" : undefined}><CarFront size={17}/> Ridez</a>
            <a href="#/captures" aria-current={tab === "captures" ? "page" : undefined}><Images size={16}/> Captures</a>
          </nav>
          {notice && <p className="preview-notice" role="status">{notice}</p>}
          <div key={persona + revision} className="preview-panel" data-tab={tab}>
            {section === "u" && id ? <DetailRecord kind="member" id={id} persona={persona}/> :
              section === "directions" && id ? <DetailRecord kind="directions" id={id} persona={persona}/> :
              tab === "captures" ? <CaptureGallery selected={id}/> :
              tab === "rides" ? <>
                <div className="preview-intro"><h2>Ridez</h2>
                  <p>Offer a seat or ask for one. Choose a carpool to the event or a ride home. Switch to the driver’s profile to handle requests.</p>
                </div>
                <EventPlanning eventId={DEMO_EVENT.id} occurrenceDate={DEMO_EVENT.dateStart} section="rides"/>
              </> : <>
                <div className="preview-intro"><h2><img src={media + "afterz.svg"} alt="Afterz"/></h2>
                  <p>Ask to join an afterparty. Switch to the host to approve a guest. Confirmed guests get the chat and the private meeting point.</p>
                </div>
                <NightDrawer eventId={DEMO_EVENT.id} occurrenceDate={DEMO_EVENT.dateStart} previewNow={DEMO_NOW}
                  showWordmark={false} sharePath="/demo/" roomId={section === "afterz" && id ? id : null}
                  onRoomChange={room => navigate(room ? "/afterz/" + encodeURIComponent(room) : "/afterz")}/>
              </>}
          </div>
        </div>
      </main>
    </div>
  </AuthPresentationProvider>;
}
createRoot(document.getElementById("root")!).render(<QueryClientProvider client={queryClient}>
  <Router hook={useHashLocation}><Workspace/></Router>
</QueryClientProvider>);
