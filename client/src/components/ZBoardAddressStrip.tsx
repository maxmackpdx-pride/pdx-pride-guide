import { Link } from "wouter";
import { zUrl } from "@shared/zNamespace";

type ZBoardAddressStripProps = {
  path: string;
  board: string;
};

/**
 * A small continuity marker for boards whose indexed legacy URL remains
 * canonical. It makes the Z address visible without adding a second page or a
 * self-link that only redirects back to the same board.
 */
export default function ZBoardAddressStrip({ path, board }: ZBoardAddressStripProps) {
  return (
    <nav className="z-board-address" aria-label={`${board} Z address`}>
      <Link href="/z" className="z-board-address__index" aria-label="All Z addresses">
        z/
      </Link>
      <span className="z-board-address__seam" aria-hidden="true" />
      <span className="z-board-address__current" aria-current="page">
        {zUrl(path).slice(1)}
      </span>
      <span className="z-board-address__board">{board}</span>
    </nav>
  );
}
