import BoardHero from "@/components/BoardHero";
import BoardStatsBar from "@/components/BoardStatsBar";
import type { NudeBeachTab, NudeBeachesSnapshot } from "@shared/nudeBeaches";

type Props = {
  activeTab: NudeBeachTab;
  snapshot?: NudeBeachesSnapshot | null;
};

export default function NudeBeachesHero({ activeTab, snapshot }: Props) {
  const isRooster = activeTab === "rooster-rock";

  const stats = isRooster
    ? [
        {
          num: snapshot?.roosterRock.riverLevelFt != null
            ? Number(snapshot.roosterRock.riverLevelFt.toFixed(1))
            : "—",
          label: snapshot?.roosterRock.crossingBand || "ft · Columbia gage",
          color:
            snapshot?.roosterRock.worthCrossing === false
              ? "#ff8c00"
              : snapshot?.roosterRock.riverLevelFt != null && snapshot.roosterRock.riverLevelFt < 15
                ? "#19e3ff"
                : snapshot?.roosterRock.riverLevelFt != null
                  ? "#ffb347"
                  : "#19e3ff",
        },
        {
          num:
            snapshot?.roosterRock.todayLowFt != null
              ? Number(snapshot.roosterRock.todayLowFt.toFixed(1))
              : "—",
          label: "ft · today's low",
          color: "#39ff14",
        },
        {
          num: snapshot?.roosterRock.airTempF != null ? `${snapshot.roosterRock.airTempF}°` : "—",
          label: "air temp",
          color: "#ff00cc",
        },
      ]
    : [
        {
          num: snapshot?.sauvieIsland.swimStatusLabel || "—",
          label: "Collins swim",
          color: snapshot?.sauvieIsland.swimStatus === "pass" ? "#39ff14" : "#ff8c00",
        },
        {
          num: "Permits",
          label: "SauvieIslandParking.com",
          color: "#19e3ff",
        },
        {
          num: snapshot?.sauvieIsland.airTempF != null ? `${snapshot.sauvieIsland.airTempF}°` : "—",
          label: "air temp",
          color: "#ff00cc",
        },
      ];

  return (
    <>
      <BoardHero
        accent={isRooster ? "cyan" : "magenta"}
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
      <BoardStatsBar stats={stats} variant="band" showLive={false} />
    </>
  );
}