import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActionSheetCard } from "@/components/cards/ActionSheetCard";
import type { OriginRect } from "@/components/cards/flipCard";
import { driverEtaLabel, fuelEstimate } from "@/lib/ridezForm";
import "./ridez.css";

/** GET /api/ridez/needs/mine/coming (rider only; rounded distances, never coordinates). */
export type WhosComingNeed = {
  needId: number; area: string; eventId: number | null; direction: "arriving" | "departing" | "now";
  drivers: { user: string; photoUrl: string | null; ridesGiven: number; distanceMi: number | null; locatedAt: number | null; since: number; arrived: boolean }[];
};
type Fuel = { pricePerGallon: number; mpg: number; label: string };

async function call(method: string, path: string, body?: unknown) {
  const r = await fetch(path, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { error?: string }).error || "Something went wrong. Try again.");
  return data;
}

/**
 * Who's coming (owner, Nov 20), rider side of a NEEDS A RIDE post: each driver who
 * tapped I'M COMING with their avatar, completed rides given (a personal track record),
 * an ETA from their shared location (the Directions drive estimate), an estimated fuel
 * cost for their drive to you, and the existing safety check-in (/api/night/ride-checks).
 */
export function RidezWhosComing({ needId, origin, onClose }: { needId: number; origin?: OriginRect | null; onClose: () => void }) {
  const q = useQuery<{ needs: WhosComingNeed[] }>({
    queryKey: ["/api/ridez/needs/mine/coming"],
    queryFn: () => call("GET", "/api/ridez/needs/mine/coming"),
    refetchInterval: 20_000,
  });
  const fuel = useQuery<Fuel>({ queryKey: ["/api/ridez/fuel"], queryFn: () => call("GET", "/api/ridez/fuel"), staleTime: 3600_000 });
  const need = q.data?.needs?.find(n => n.needId === needId);
  const drivers = need?.drivers ?? [];
  const [check, setCheck] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const startCheck = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setErr(null);
    void call("POST", `/api/ridez/needs/${needId}/watch`, { contact: String(f.get("contact") || ""), minutes: Number(f.get("minutes")), consent: f.get("consent") === "on" })
      .then((r: { dueAt: number }) => { setSent(new Date(r.dueAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" })); setCheck(false); })
      .catch((x: Error) => setErr(x.message));
  };
  return (
    <ActionSheetCard label="Who's coming" accent="var(--neon-orange)" kicker="WHO'S COMING" title={need ? `RIDE FROM ${need.area.toUpperCase()}` : "YOUR RIDE"}
      logo="ridez-pending" origin={origin} onDismiss={onClose}
      actions={drivers.length ? [{ label: check ? "CANCEL CHECK-IN" : sent ? "CHANGE CHECK-IN" : "SAFETY CHECK-IN", primary: !check, onClick: () => setCheck(c => !c) }] : []}>
      <div className="zridez zwho" data-who-need={needId}>
        {q.isLoading ? <p className="zridez-empty">LOADING…</p> : drivers.length ? (
          <ul className="zwho-list">
            {drivers.map(d => {
              const eta = driverEtaLabel(d.distanceMi, d.arrived);
              const gas = fuelEstimate(d.distanceMi, fuel.data);
              return (
                <li key={d.user} className="zwho-row" data-driver={d.user}>
                  <span className="ocarpool-av" aria-hidden="true">{d.photoUrl ? <img src={d.photoUrl} alt="" loading="lazy" /> : d.user.slice(0, 1).toUpperCase()}</span>
                  <span className="zwho-t">
                    <b>@{d.user}</b>
                    <span className="zwho-rides">{d.ridesGiven} RIDE{d.ridesGiven === 1 ? "" : "S"} GIVEN</span>
                    <span className="zwho-eta">{eta ?? "ETA when they share location"}</span>
                    {gas != null && !d.arrived ? <span className="zwho-fuel">Fuel for their drive to you: ${gas.toFixed(2)} {fuel.data?.label ?? "est."}</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : <p className="zridez-empty">NO ONE YET. YOU'LL GET A NOTE WHEN A DRIVER TAPS I'M COMING.</p>}
        {sent ? <p className="zwho-ok" role="status">Safety check-in set. We'll ask you to confirm by {sent}; your trusted contacts hear if you don't.</p> : null}
        {check ? (
          <form className="zwho-check" onSubmit={startCheck} aria-label="Safety check-in">
            <label>Trusted members (1–3 you mutually follow)<input name="contact" required placeholder="@friend, @other" /></label>
            <label>Check in within<select name="minutes" defaultValue="45">{[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}</select></label>
            <label className="zwho-consent"><input type="checkbox" name="consent" required /> If I miss the check-in, message these members with my last shared location.</label>
            {err ? <p className="zwho-err" role="alert">{err}</p> : null}
            <button type="submit" className="obtn obtn--accent">START CHECK-IN</button>
          </form>
        ) : null}
      </div>
    </ActionSheetCard>
  );
}

export default RidezWhosComing;
