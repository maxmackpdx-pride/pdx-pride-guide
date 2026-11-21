import { useState, type MouseEvent } from "react";
import { rectOf } from "@/components/cards/flipCard";
import { RidezWhosComing } from "./RidezWhosComing";
import type { OriginRect } from "@/components/cards/flipCard";
import { CarpoolRailCard, type PlanRide } from "@/components/events/EventRailCards";
import { inRidezCircle, type RideCircleTag } from "@shared/ridezCircle";
import { RidezCircleToggle, useRidezCircle } from "./RidezCircleToggle";
import "./ridez.css";

/** A NEEDS A RIDE card from the planning API (`needs`) or GET /api/ridez/needs. No coordinates. */
export type RideNeed = {
  id: number; user: string; photoUrl?: string | null; area: string;
  direction: "arriving" | "departing" | "now"; mine?: boolean;
  sameEvent?: boolean; sameAfterz?: boolean; circle?: RideCircleTag; distanceMi?: number | null;
};

/** Same Afterz beats same event (owner, Nov 20). */
export function needBloom(n: RideNeed): "afterz" | "event" | undefined {
  return n.sameAfterz ? "afterz" : n.sameEvent ? "event" : undefined;
}

/**
 * NEEDS A RIDE wide-short card (owner, Nov 20): the carpool card's chrome with the
 * label NEEDS A RIDE. Shows avatar, neighborhood, and either "Going to this event"
 * or the rounded distance. Blooms --yellow (same Afterz) or --neon-orange (same event).
 */
export function RideNeedCard({ need, onOpen, coming, onComing, onWhosComing }: { need: RideNeed; onOpen?: (el: HTMLElement) => void; coming?: boolean; onComing?: () => void; onWhosComing?: (el: HTMLElement) => void }) {
  const bloom = needBloom(need);
  const where = need.sameEvent ? "Going to this event" : typeof need.distanceMi === "number" ? `${need.distanceMi < 0.1 ? "<0.1" : need.distanceMi} mi away · right now` : "Nearby · right now";
  const dir = need.direction === "departing" ? "Leaving after" : need.direction === "arriving" ? "Getting there" : null;
  return (
    <div className="orailcard orailcard--carpool orailcard--need" data-card-category="carpool-need" data-tag="NEEDS A RIDE" data-bloom={bloom}>
      <span className="orailcard-tag">NEEDS A RIDE</span>
      <button type="button" className="ocarpool" data-card-size="wide-short" data-need-id={need.id}
        aria-label={`${need.mine ? "You need" : `@${need.user} needs`} a ride from ${need.area}. ${where}.${bloom === "afterz" ? " Going to your Afterz." : ""}`}
        onClick={e => onOpen?.(e.currentTarget)}>
        <span className="ocarpool-av" aria-hidden="true">{need.photoUrl ? <img src={need.photoUrl} alt="" loading="lazy" /> : need.user.slice(0, 1).toUpperCase()}</span>
        <span className="ocarpool-t">
          <b className="ocarpool-hood">{need.area}</b>
          <span className="ocarpool-from">{need.mine ? "You" : `@${need.user}`}{dir ? ` · ${dir}` : ""}</span>
          <span className="ocarpool-meta"><span className="ocarpool-near">{where.toUpperCase()}</span></span>
        </span>
      </button>
      {need.mine ? (
        onWhosComing ? <button type="button" className="ocarpool-act" data-action="ridez-whos-coming" onClick={e => onWhosComing(e.currentTarget)}>WHO'S COMING</button> : null
      ) : onComing ? (
        <button type="button" className={`ocarpool-act${coming ? " is-on" : ""}`} data-action="ridez-coming" aria-pressed={!!coming}
          aria-label={coming ? `You told @${need.user} you're coming` : `Tell @${need.user} you're coming`} onClick={onComing} disabled={coming}>
          {coming ? "COMING ✓" : "I'M COMING"}
        </button>
      ) : null}
    </div>
  );
}

/** I'M COMING: tell the rider, then share a location for their ETA only if already permitted (never prompts). */
async function sayComing(needId: number) {
  const r = await fetch(`/api/ridez/needs/${needId}/coming`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" });
  if (!r.ok) throw new Error("Could not send");
  try {
    const perm = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    if (perm?.state !== "granted") return;
    navigator.geolocation.getCurrentPosition(p => {
      void fetch(`/api/ridez/needs/${needId}/coming/location`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat: p.coords.latitude, lng: p.coords.longitude }) });
    }, () => {}, { maximumAge: 60_000, timeout: 8000 });
  } catch { /* location is optional */ }
}

type Props = {
  rides: PlanRide[] | null | undefined;
  needs?: RideNeed[] | null;
  /** Section label, e.g. "CARPOOLS". */
  label?: string;
  signedOut?: boolean;
  onOffer: (e: MouseEvent<HTMLButtonElement>) => void;
  onNeed: (e: MouseEvent<HTMLButtonElement>) => void;
  /** The leading area: opens the expanded carpool card (stub until its design lands). */
  onLead?: (el: HTMLElement) => void;
  onOpenRide: (ride: PlanRide, el: HTMLElement) => void;
  onOpenNeed?: (need: RideNeed, el: HTMLElement) => void;
  /** Open Who's coming for one of my needs. Hosts that clip fixed layers (the event card panel)
   *  render <RidezWhosComing> at their root; without this the rail renders it inline. */
  onWhosComing?: (needId: number, el: HTMLElement) => void;
};

/**
 * Ridez section (owner, Nov 20), shared by the event card Ridez panel and the #117 drawer:
 * OFFER A RIDE / I NEED A RIDE, the circle toggle top-right, a divider, then one wide-short
 * rail of carpool offers and NEEDS A RIDE cards, both filtered by the circle.
 */
export function RidezRail({ rides, needs, label = "CARPOOLS", signedOut, onOffer, onNeed, onLead, onOpenRide, onOpenNeed, onWhosComing }: Props) {
  const [circle, setCircle] = useRidezCircle();
  const [coming, setComing] = useState<Set<number>>(() => new Set());
  const [who, setWho] = useState<null | { needId: number; origin: OriginRect | null }>(null);
  const comingTo = (id: number) => {
    setComing(s => new Set(s).add(id));
    void sayComing(id).catch(() => setComing(s => { const n = new Set(s); n.delete(id); return n; }));
  };
  const offers = (rides ?? []).filter(r => inRidezCircle(r.circle as RideCircleTag | undefined, circle));
  const asks = (needs ?? []).filter(n => inRidezCircle(n.circle, circle))
    .sort((a, b) => Number(!!b.sameAfterz) - Number(!!a.sameAfterz) || Number(!!b.sameEvent) - Number(!!a.sameEvent));
  const total = (rides?.length ?? 0) + (needs?.length ?? 0);
  const status = signedOut ? "SIGN IN TO SEE RIDES" : offers.length + asks.length ? "" : total ? "NONE IN THIS CIRCLE" : "BE THE FIRST";
  return (
    <div className="zridez" data-ridez-circle={circle}>
      <div className="zridez-acts">
        <button type="button" className="obtn obtn--accent" data-action="ridez-offer" onClick={onOffer}>OFFER A RIDE</button>
        <button type="button" className="obtn" data-action="ridez-need" onClick={onNeed}>I NEED A RIDE</button>
      </div>
      <div className="zrc-head">
        <p className="zas-sec">{label} <span>{status}</span></p>
        <RidezCircleToggle value={circle} onChange={setCircle} label="Show carpools from" />
      </div>
      <hr className="zridez-div" />
      <div className="zridez-rail orail--carpool" data-rail="carpool">
        {onLead ? (
          <button type="button" data-action="open-carpool" className="ocarpool-lead"
            aria-label="Open the expanded carpool card (design coming)" onClick={e => onLead(e.currentTarget)} />
        ) : null}
        {asks.map(n => <RideNeedCard key={`need-${n.id}`} need={n} onOpen={el => onOpenNeed?.(n, el)}
          coming={coming.has(n.id)} onComing={signedOut ? undefined : () => comingTo(n.id)}
          onWhosComing={el => (onWhosComing ? onWhosComing(n.id, el) : setWho({ needId: n.id, origin: rectOf(el) }))} />)}
        {offers.map(r => <CarpoolRailCard key={r.id} ride={r} onOpen={el => onOpenRide(r, el)} />)}
      </div>
      {who ? <RidezWhosComing needId={who.needId} origin={who.origin} onClose={() => setWho(null)} /> : null}
    </div>
  );
}

export default RidezRail;
