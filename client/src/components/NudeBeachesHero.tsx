import type { ReactNode } from "react";
import BoardHero from "@/components/BoardHero";
import BoardStatsBar from "@/components/BoardStatsBar";
import type { NudeBeachTab, NudeBeachesSnapshot } from "@shared/nudeBeaches";
import { formatWindStat, normalizeSwimStatusLabel } from "@shared/nudeBeaches";

type Props = {
  activeTab: NudeBeachTab;
  snapshot?: NudeBeachesSnapshot | null;
  statsKey?: string;
  tabs: ReactNode;
};

export default function NudeBeachesHero({ activeTab, snapshot, statsKey, tabs }: Props) {
  const isRooster = activeTab === "rooster-rock";
  const roosterWind = formatWindStat(snapshot?.roosterRock.wind);
  const sauvieWind = formatWindStat(snapshot?.sauvieIsland.wind);

  const stats = isRooster
    ? [
        {
          num: snapshot?.roosterRock.airTempF != null ? `${snapshot.roosterRock.airTempF}°` : "—",
          label: "air temp",
          color: "var(--neon-orange, #ff6600)",
        },
        {
          num:
            snapshot?.roosterRock.waterTempF != null
              ? `${Math.round(snapshot.roosterRock.waterTempF)}°`
              : "—",
          label: "water temp",
          color: "#19e3ff",
        },
        {
          num: roosterWind.value,
          label: roosterWind.label,
          color: "var(--neon-orange, #ff6600)",
        },
      ]
    : [
        {
          num:
            normalizeSwimStatusLabel(
              snapshot?.sauvieIsland.swimStatusLabel,
              snapshot?.sauvieIsland.swimStatus,
            ) || "—",
          label: "Collins swim",
          color: "var(--neon-green, #00EE44)",
        },
        {
          num: snapshot?.sauvieIsland.airTempF != null ? `${snapshot.sauvieIsland.airTempF}°` : "—",
          label: "air temp",
          color: "var(--neon-green, #00EE44)",
        },
        {
          num: sauvieWind.value,
          label: sauvieWind.label,
          color: "var(--neon-green, #00EE44)",
        },
      ];

  return (
    <>
      <div className="nude-beaches-hero-row">
        <BoardHero
          accent={isRooster ? "orange" : "green"}
          kicker={isRooster ? "Columbia River · Corbett" : "Sauvie Island · Collins Beach"}
          title={
            isRooster ? (
              <>
                Rooster <span className="board-hero__title-accent">Rock</span>
              </>
            ) : (
              <>
                Sauvie <span className="board-hero__title-accent">Island</span>
              </>
            )
          }
          lede={
            isRooster
              ? "River level, air and water temps, forecast, directions, and day-use parking pass info — nothing else."
              : "Swim Guide water quality, Sauvie Island Parking permits, island weather, and the links Collins Beach travelers use."
          }
        />
        {tabs}
      </div>
      <BoardStatsBar key={statsKey ?? activeTab} stats={stats} variant="band" showLive={false} />
    </>
  );
}