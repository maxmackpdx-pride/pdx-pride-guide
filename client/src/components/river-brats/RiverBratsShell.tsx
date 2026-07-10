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

  const setShore = useCallback(
    (tab: RiverBratsShoreTab) => {
      setShoreState(tab);
      const params = new URLSearchParams(window.location.search);
      if (beachId === "sauvie-island") params.set("tab", "sauvie-island");
      else params.delete("tab");
      if (tab === "checkin") params.delete("shore");
      else params.set("shore", tab);
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
          Checking in drops you into today's {beachChatName} group chat. It lives in your Messages and
          clears at midnight. No addresses, no drama.
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
        {shore === "checkin" && <RiverBratsCheckIn beachId={beachId} accent={accent} />}
        {shore === "carpool" && <RiverBratsCarpool beachId={beachId} accent={accent} />}
        {shore === "spotted" && <RiverBratsSpotted beachId={beachId} />}
      </div>
    </section>
  );
}