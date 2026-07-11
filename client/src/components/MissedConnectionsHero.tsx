import CommunityBoardHeroRow from "./CommunityBoardHeroRow";
import BoardHero from "./BoardHero";
import { Button } from "@/components/ds";

type Props = {
  onPost?: () => void;
};

export default function MissedConnectionsHero({ onPost }: Props) {
  const actions = (
    <>
      <Button
        variant="solid"
        accent="magenta"
        size="lg"
        arrow
        onClick={() => {
          if (onPost) onPost();
          else document.getElementById("spotted-compose")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        Post a missed connection
      </Button>
      <Button variant="neon" accent="cyan" size="lg" as="a" href="#feed">
        Browse the board
      </Button>
    </>
  );

  return (
    <CommunityBoardHeroRow active="spotted" actions={actions}>
      <BoardHero
        accent="magenta"
        kicker="Anonymous board · Pride season 2026"
        title={<>Missed a <span className="board-hero__title-accent">connection?</span></>}
        lede="Missed connections from Portland Pride. Caught a glance across the dance floor, shared a moment at the parade, or clocked someone cute around town? Post it. You stay anonymous. Replies open a private thread."
      />
    </CommunityBoardHeroRow>
  );
}