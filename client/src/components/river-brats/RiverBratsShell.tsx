import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Z_OUT_BEACH_PATHS, type NudeBeachTab } from "@shared/nudeBeaches";
import { RIVER_BRATS_SHORE_TABS, readRiverBratsShore, type RiverBratsShoreTab } from "@shared/riverBrats";
import RiverBratsCheckIn from "./RiverBratsCheckIn";
import RiverBratsCarpool from "./RiverBratsCarpool";
import RiverBratsSpotted from "./RiverBratsSpotted";
import RiverBratsIntroPopup, { openRiverBratsIntro } from "./RiverBratsIntroPopup";
import "./RiverBrats.css";

type Props = {
  beachId: NudeBeachTab;
  embedded?: boolean;
  initialShore?: RiverBratsShoreTab;
};

export default function RiverBratsShell({ beachId, embedded = false, initialShore }: Props) {
  const [, setLocation] = useLocation();
  const accent = beachId === "rooster-rock" ? "orange" : "green";
  const [initialParams] = useState(() => new URLSearchParams(
    !embedded && typeof window !== "undefined" ? window.location.search : "",
  ));
  const [shore, setShoreState] = useState<RiverBratsShoreTab>(() =>
    initialShore ?? readRiverBratsShore(initialParams.get("shore")),
  );
  const [carpoolDate, setCarpoolDate] = useState<string | null>(() => {
    const date = initialParams.get("date");
    return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  });
  const autoVerify = initialParams.get("verify") === "1";
  const autoOpenChat = initialParams.get("chat") === "1";

  useEffect(() => {
    if (!autoVerify && !autoOpenChat) return;
    const params = new URLSearchParams(window.location.search);
    params.delete("verify");
    params.delete("chat");
    const qs = params.toString();
    const pagePath = Z_OUT_BEACH_PATHS[beachId];
    window.history.replaceState(null, "", qs ? `${pagePath}?${qs}` : pagePath);
  }, [beachId, autoOpenChat, autoVerify]);

  const setShore = useCallback(
    (tab: RiverBratsShoreTab, opts?: { date?: string | null }) => {
      setShoreState(tab);
      if (opts?.date) setCarpoolDate(opts.date);
      if (embedded) return;
      const params = new URLSearchParams(window.location.search);
      params.delete("tab");
      if (tab === "checkin") {
        params.delete("shore");
        params.delete("date");
      } else {
        params.set("shore", tab);
        if (tab === "carpool" && opts?.date) params.set("date", opts.date);
        else if (tab !== "carpool") params.delete("date");
      }
      const qs = params.toString();
      const pagePath = Z_OUT_BEACH_PATHS[beachId];
      setLocation(qs ? `${pagePath}?${qs}` : pagePath);
    },
    [beachId, embedded, setLocation],
  );

  useEffect(() => {
    if (embedded) return;
    const onPopState = () => {
      setShoreState(readRiverBratsShore(new URLSearchParams(window.location.search).get("shore")));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [embedded]);

  const beachName = beachId === "rooster-rock" ? "Rooster Rock" : "Sauvie Island";

  return (
    <section className={`river-brats river-brats--${accent} pdx-glass-rebind`}>
      {embedded && <RiverBratsIntroPopup openOnFirstVisit={false} />}
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
          Chat opens when you check in with your username — one shared room per beach. Multi-day
          plans keep you in until 12 hours after your last beach day ends. No addresses, no drama.
        </p>
        <button
          type="button"
          className={`river-brats__how-btn river-brats__how-btn--${accent}`}
          onClick={() => openRiverBratsIntro()}
          data-testid="river-brats-how-it-works"
        >
          How it works
        </button>
      </div>

      <nav className="events-tab-bar river-brats__tabs" aria-label="River Brats">
        {RIVER_BRATS_SHORE_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`events-tab${shore === tab.key ? " active" : ""}`}
            aria-pressed={shore === tab.key}
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
