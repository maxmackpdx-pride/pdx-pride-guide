import type { BoardCategory } from "./allBoards";

/** Keep old room/post URLs working inside the combined Boards experience. */
export function boardBrowseHref(board: BoardCategory, search = ""): string {
  const params = new URLSearchParams(search);
  params.set("board", board);
  if(params.get("view") === "tools") params.set("mine","1");
  params.delete("view");
  const rawType = params.get("type")?.toUpperCase();
  const intents: Record<string,string> = board === "housing" ? {OFFERING:"offering",LOOKING:"looking",FORMING:"forming",MANAGED:"managed"} : board === "giftz" ? {GIFT:"giving",ISO:"iso",GRAB:"grab"} : {POSTING_GIG:"hiring",LOOKING_FOR_WORK:"available"};
  if(rawType && intents[rawType]) params.set("intent",intents[rawType]);
  if(params.get("filter")?.toUpperCase() === "SAVED") params.set("saved","1");
  const post = params.get("post");
  if (post && /^\d+$/.test(post)) params.set("post", `${board}:${post}`);
  return `/boards?${params.toString()}`;
}
