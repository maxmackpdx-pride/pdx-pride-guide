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
          label: "ft · Columbia gage",
          color:
            snapshot?.roosterRock.riverLevelFt != null && snapshot.roosterRock.riverLevelFt < 18
              ? "#19e3ff"
              : "#ff8c00",
        },
        {
          num: snapshot?.roosterRock.crossingBand || "—",
          label: "crossing band",
          color: snapshot?.roosterRock.worthCrossing === false ? "#ff8c00" : "#39ff14",
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
          label: "check portal",
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
            ? "Live river gage, crossing bands, and weather for the clothing-optional east end of Rooster Rock State Park — plus Sand Island access."
            : "Swim Guide samples, parking permits, island weather, and the links you need before a Collins Beach trip."
        }
      />
      <BoardStatsBar stats={stats} variant="band" showLive={false} />
    </>
  );
}