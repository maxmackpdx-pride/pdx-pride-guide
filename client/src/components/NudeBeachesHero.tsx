import BoardHero from "@/components/BoardHero";
import BoardStatsBar from "@/components/BoardStatsBar";
import type { NudeBeachesSnapshot } from "@shared/nudeBeaches";

type Props = {
  snapshot?: NudeBeachesSnapshot | null;
};

export default function NudeBeachesHero({ snapshot }: Props) {
  const river = snapshot?.roosterRock.riverLevelFt;
  const swim = snapshot?.sauvieIsland.swimStatusLabel;

  const stats = [
    {
      num: river != null ? Number(river.toFixed(1)) : "—",
      label: "ft · Columbia gage",
      color: river != null && river < 18 ? "#19e3ff" : "#ff8c00",
    },
    {
      num: swim || "—",
      label: "Collins swim status",
      color: snapshot?.sauvieIsland.swimStatus === "pass" ? "#39ff14" : "#ff8c00",
    },
    {
      num: 2,
      label: "beach guides",
      color: "#ff00cc",
    },
  ];

  return (
    <>
      <BoardHero
        accent="magenta"
        kicker="Portland day trips · Columbia River"
        title={
          <>
            Nude <span className="board-hero__title-accent">beaches</span>
          </>
        }
        lede="Live traveler logistics for Rooster Rock and Collins Beach on Sauvie Island — river levels, water quality, parking permits, and the links you actually need before you drive out."
      />
      <BoardStatsBar stats={stats} variant="band" showLive={false} />
    </>
  );
}