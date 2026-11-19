import type { Folder, Thread } from "./types";

/** Counts and lists use identical folder, category and search criteria. */
export function visibleThreads(
  threads: Thread[],
  folder: Folder,
  category: string,
  query: string,
) {
  const needle = query.trim().toLowerCase();
  return threads.filter((thread) => {
    const inFolder =
      folder === "deleted"
        ? thread.archived
        : !thread.archived && thread.folder === folder;
    return (
      inFolder &&
      (folder === "deleted" || category === "all" || thread.cat === category) &&
      (!needle ||
        thread.name.toLowerCase().includes(needle) ||
        thread.subject.toLowerCase().includes(needle))
    );
  });
}
