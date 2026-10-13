import type { BoardCategory } from "./allBoards";

/** Keep old room/post URLs working inside the combined Boards experience. */
export function boardBrowseHref(board: BoardCategory, search = ""): string {
  const params = new URLSearchParams(search);
  params.set("board", board);
  params.delete("view");
  const post = params.get("post");
  if (post && /^\d+$/.test(post)) params.set("post", `${board}:${post}`);
  return `/boards?${params.toString()}`;
}
