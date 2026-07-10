import type { ReactNode } from "react";
import { BoardCommunityNav, type BoardKey } from "./BoardRunningHead";

type Props = {
  active: BoardKey;
  children: ReactNode;
  actions?: ReactNode;
};

export default function CommunityBoardHeroRow({ active, children, actions }: Props) {
  return (
    <>
      <div className="community-board-hero-row">
        {children}
        <BoardCommunityNav active={active} />
      </div>
      {actions ? (
        <div className="community-board-hero-actions">
          <div className="board-hero__actions">{actions}</div>
        </div>
      ) : null}
    </>
  );
}