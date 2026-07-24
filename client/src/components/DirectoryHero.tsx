import { Plus } from "lucide-react";
import BoardHero from "@/components/BoardHero";
import BoardExploreActions from "@/components/BoardExploreActions";
import BoardStatsBar from "@/components/BoardStatsBar";
import CountUpValue from "@/components/CountUpValue";
import { Button } from "@/components/ds";
import GlitchWord from "@/components/GlitchWord";

type Stat = { num: number; label: string; color: string };

type Props = {
  placeCount: number;
  stats: Stat[];
  onAddPlace: () => void;
};

export default function DirectoryHero({ placeCount, stats, onAddPlace }: Props) {
  return (
    <>
      <BoardHero
        accent="magenta"
        kicker="Ours · For us · In the scene"
        title={
          <>
            <CountUpValue
              key={placeCount > 0 ? "dir-hero-ready" : "dir-hero-pending"}
              value={placeCount}
            />{" "}
            <span className="board-hero__title-accent board-hero__title-accent--glitch">
              <GlitchWord text="Places" />
            </span>
          </>
        }
        lede="Bars, late kitchens, shops, and rooms that keep the nights going. Show up, spend money, keep them open."
        actions={
          <BoardExploreActions
            primary={
              <Button variant="solid" accent="magenta" size="lg" arrow onClick={onAddPlace}>
                <Plus size={16} aria-hidden /> Add a place
              </Button>
            }
          />
        }
      />
      <BoardStatsBar stats={stats} variant="band" showLive={false} />
    </>
  );
}