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
        Post a MIZZED CONNECTION
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
        title={
          <img
            className="board-hero__brand-logo board-hero__brand-logo--mizzed"
            src="/brand/family/mizzed-connection.svg"
            alt="MIZZED CONNECTION"
          />
        }
        lede="MIZZED CONNECTION posts from Portland Pride. Caught a glance across the dance floor, shared a moment at the parade, or clocked someone cute around town? Post it. You stay anonymous. Replies open a private thread."
      />
    </CommunityBoardHeroRow>
  );
}
