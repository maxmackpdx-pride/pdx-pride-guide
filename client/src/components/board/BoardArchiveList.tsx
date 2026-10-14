import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useMutationState, useQuery } from "@tanstack/react-query";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { boardCategories, type BoardCategory } from "@/lib/allBoards";
import "./BoardArchiveList.css";

type ArchivedPost = { board: BoardCategory; postId: number; title: string; createdAt: string; archivedAt: string; purgeAt: string };

export function BoardArchiveAction({ board, postId, title }: { board: BoardCategory; postId: number; title: string }) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const archive = useMutation({
    mutationKey: ["board-archive-action", user?.id],
    mutationFn: async () => { await apiRequest("POST", `/api/board-archive/${board}/${postId}`); return { title }; },
    onSuccess: async () => {
      const category = boardCategories.find(item => item.id === board)!;
      await Promise.all([
        ...[category.endpoint, category.endpoint + "/mine", "/api/board-archive", "/api/board-collection", "/api/board-map-locations", "/api/boards/saved"].map(endpoint => queryClient.invalidateQueries({ queryKey: [endpoint] })),
        queryClient.invalidateQueries({ predicate: query => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/boards/") && query.queryKey[0].endsWith("/map-location") }),
      ]);
    },
  });
  return <div className="board-archive-action">
    {!confirming ? <button type="button" aria-label={`Archive ${title}`} onClick={() => setConfirming(true)}>Archive</button> : <div className="board-archive-action__confirm">
      <p>Archive this post? It will leave the boards and its map pin will be removed.</p>
      <button type="button" disabled={archive.isPending || archive.isSuccess} onClick={() => archive.mutate()}>{archive.isPending ? "Archiving…" : "Confirm archive"}</button>
      <button type="button" disabled={archive.isPending} onClick={() => setConfirming(false)}>Cancel</button>
    </div>}
    {archive.isError && <p role="alert">{parseApiError(archive.error, "Couldn’t archive this post. Try again.")}</p>}
  </div>;
}

export function BoardArchiveFeedback() {
  const { user } = useAuth();
  const results = useMutationState<{title:string}|undefined>({ filters: { mutationKey: ["board-archive-action", user?.id], status: "success" }, select: mutation => mutation.state.data as {title:string}|undefined });
  const latest = results.at(-1);
  return user && latest ? <p className="board-archive-feedback" role="status">“{latest.title}” archived. <Link href="/boardz?archive=1">View Archive</Link></p> : null;
}

export default function BoardArchiveList({ userId, onSignIn }: { userId?: number; onSignIn: () => void }) {
  const archive = useQuery<ArchivedPost[]>({ queryKey: ["/api/board-archive", userId], enabled: !!userId, queryFn: () => apiRequest("GET", "/api/board-archive").then(response => response.json()) });
  return <section className="board-archive" aria-labelledby="board-archive-heading">
    <h2 id="board-archive-heading">Archive</h2>
    <p className="board-archive__note">Only you can see your archive. Posts archive automatically after 90 days. Full posts are deleted one year after archiving.</p>
    {!userId ? <button type="button" className="eb-tool" onClick={onSignIn}>Sign in to view your archive</button>
      : archive.isPending ? <p role="status">Loading archive…</p>
      : archive.isError ? <p role="alert">Your archive couldn’t load. <button type="button" onClick={() => void archive.refetch()}>Try again</button></p>
      : !archive.data?.length ? <p>No archived posts yet.</p>
      : <ul className="board-archive__list">{archive.data.map(post => <li key={`${post.board}:${post.postId}`}>
        <h3 className="board-archive__title">{post.title}</h3>
        <span>{boardCategories.find(category => category.id === post.board)?.label || post.board}</span>
        <time dateTime={post.purgeAt}>Deletes {new Date(post.purgeAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>
      </li>)}</ul>}
  </section>;
}
