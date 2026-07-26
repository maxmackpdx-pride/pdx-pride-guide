import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import type { NudeBeachTab } from "@shared/nudeBeaches";
import { RIVER_BRATS_SHORE_TABS, readRiverBratsShore, type RiverBratsShoreTab } from "@shared/riverBrats";
import RiverBratsCheckIn from "./RiverBratsCheckIn";
import RiverBratsCarpool from "./RiverBratsCarpool";
import RiverBratsSpotted from "./RiverBratsSpotted";
import "./RiverBrats.css";

type Props = {
  beachId: NudeBeachTab;
};

export default function RiverBratsShell({ beachId }: Props) {
  const [, setLocation] = useLocation();
  const accent = beachId === "rooster-rock" ? "orange" : "green";
  const [shore, setShoreState] = useState<RiverBratsShoreTab>(() =>
    readRiverBratsShore(typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("shore") : null),
  );
  // Carpool day deep-link from plan-ahead check-in CTA (?date=YYYY-MM-DD).
  const [carpoolDate, setCarpoolDate] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const d = new URLSearchParams(window.location.search).get("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  });
  // Deep links: ?verify=1 (arrival push → GPS confirm) and ?chat=1 (Inbox
  // GROUP row → open beach chat). Captured once, then stripped from the URL.
  const [autoVerify] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("verify") === "1",
  );
  const [autoOpenChat] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("chat") === "1",
  );

  useEffect(() => {
    if (!autoVerify && !autoOpenChat) return;
    const params = new URLSearchParams(window.location.search);
    params.delete("verify");
    params.delete("chat");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/nude-beaches?${qs}` : "/nude-beaches");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setShore = useCallback(
    (tab: RiverBratsShoreTab, opts?: { date?: string | null }) => {
      setShoreState(tab);
      if (opts?.date) setCarpoolDate(opts.date);
      const params = new URLSearchParams(window.location.search);
      if (beachId === "sauvie-island") params.set("tab", "sauvie-island");
      else params.delete("tab");
      if (tab === "checkin") {
        params.delete("shore");
        params.delete("date");
      } else {
        params.set("shore", tab);
        if (tab === "carpool" && opts?.date) params.set("date", opts.date);
        else if (tab !== "carpool") params.delete("date");
      }
      const qs = params.toString();
      setLocation(qs ? `/nude-beaches?${qs}` : "/nude-beaches");
    },
    [beachId, setLocation],
  );

  useEffect(() => {
    const onPopState = () => {
      setShoreState(readRiverBratsShore(new URLSearchParams(window.location.search).get("shore")));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const beachName = beachId === "rooster-rock" ? "Rooster Rock" : "Sauvie Island";
  const beachChatName = beachId === "rooster-rock" ? "Rooster Rock" : "Collins Beach";

  return (
    <section className={`river-brats river-brats--${accent}`}>
      <div className="river-brats__head">
        <div className={`river-brats__kicker river-brats__kicker--${accent}`}>
          River Brats · {beachName}
        </div>
        <h2 className="display river-brats__hero-title">
          Check in.{" "}
          <span className={`river-brats__hero-accent river-brats__hero-accent--${accent}`}>
            You're in the chat.
          </span>
        </h2>
        <p className="river-brats__hero-lede">
          Check in up to 7 days ahead, say how long you&apos;ll stay, and add it to your calendar.
          Chat opens the moment you check in — one room for every day you&apos;re going. Multi-day
          plans keep you in until 12 hours after your last beach day ends. No addresses, no drama.
        </p>
      </div>

      <nav className="events-tab-bar river-brats__tabs" aria-label="River Brats">
        {RIVER_BRATS_SHORE_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`events-tab${shore === tab.key ? " active" : ""}`}
            onClick={() => setShore(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="river-brats__body">
        {shore === "checkin" && (
          <RiverBratsCheckIn
            beachId={beachId}
            accent={accent}
            autoVerify={autoVerify}
            autoOpenChat={autoOpenChat}
            onGoToCarpool={date => setShore("carpool", { date })}
          />
        )}
        {shore === "carpool" && (
          <RiverBratsCarpool beachId={beachId} accent={accent} initialDate={carpoolDate} />
        )}
        {shore === "spotted" && <RiverBratsSpotted beachId={beachId} />}
      </div>
    </section>
  );
}