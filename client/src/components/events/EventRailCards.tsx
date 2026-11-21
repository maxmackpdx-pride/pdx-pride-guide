import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import BoardBrowseCard from "@/components/board/BoardBrowseCard";
import { toBoardPosts, type BoardPost } from "@/lib/allBoards";
import { outzWallToBoardPost } from "@/lib/outzBoardPost";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import PlaceDiscoveryCard from "@/components/discovery/PlaceDiscoveryCard";
import type { Business } from "@/pages/Directory";
import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";

/* Event rails (Mizzed, Gigz, Ridez carpools) use the site's standard small card:
   the Boardz zine small card (PunkBoardCard / ZineSmallCard) with its existing
   torn-paper rim in the category accent. The data comes from the real APIs:
   - Mizzed: GET /api/events/:id/detail -> missedConnections (the Mizzed board rows)
   - Gigz:   GET /api/events/:id/occurrences/:date/planning -> gigs
   - Carpool: the same planning payload -> rides (signed-in members only)
   Saving uses the Boardz save API (PUT/DELETE /api/boards/:category/posts/:id/save). */

export type PlanGig = { id: number; title: string; description?: string | null };
export type PlanRide = { id: number; area?: string; driver?: string; plan?: { kind?: string; meeting?: string | null; oneWay?: boolean } | null };

export function mizzBoardPosts(rows: MissedConnectionPost[]): BoardPost[] {
  return toBoardPosts("mizzed", rows as never, true);
}

export function gigBoardPost(g: PlanGig, venue: string): BoardPost {
  return { key: `gigz:${g.id}`, id: g.id, category: "gigz", intent: "hiring", title: g.title, description: g.description || "", area: venue, value: "", detail: "", createdAt: "" };
}

/** Arriving = carpool to the venue; Departing = a ride home (or on to Afterz) from it. */
export function rideDirection(r: PlanRide): "ARRIVING" | "DEPARTING" {
  return r.plan?.kind === "home" || r.plan?.kind === "afterz" ? "DEPARTING" : "ARRIVING";
}

export function rideBoardPost(r: PlanRide, venue: string): BoardPost | null {
  const kind = r.plan?.kind === "home" ? "Ride home" : r.plan?.kind === "afterz" ? "Afterz ride" : "Carpool";
  return outzWallToBoardPost({ id: r.id, postKind: "CARPOOL_OFFER", title: r.area ? `${kind} · ${r.area}` : kind, body: r.plan?.meeting ? `Meet at ${r.plan.meeting}` : "", placeName: venue });
}

/** Saved state for board-backed rail cards (Mizzed, Gigz). */
export function useBoardRailSaves(onAuth: () => void) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const saved = useQuery<string[]>({ queryKey: ["/api/boards/saved", user?.id], queryFn: () => apiRequest("GET", "/api/boards/saved").then(r => r.json()), enabled: !!user });
  const list = Array.isArray(saved.data) ? saved.data : [];
  const save = useMutation({
    mutationFn: (post: BoardPost) => apiRequest(list.includes(post.key) ? "DELETE" : "PUT", `/api/boards/${post.category}/posts/${post.id}/save`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["/api/boards/saved"] }); },
  });
  return {
    isSaved: (post: BoardPost) => list.includes(post.key),
    pending: save.isPending,
    toggle: (post: BoardPost) => { if (!user) { onAuth(); return; } save.mutate(post); },
  };
}

export function EventRailCard({ post, saved, saveDisabled, onSave, onOpen, tag }: { post: BoardPost; saved?: boolean; saveDisabled?: boolean; onSave?: () => void; onOpen: (el: HTMLElement) => void; tag?: string }) {
  return (
    <div className="orailcard" data-card-category={post.category} data-tag={tag || undefined}>
      {tag ? <span className="orailcard-tag">{tag}</span> : null}
      <BoardBrowseCard post={post} size="small" isSaved={saved} saveDisabled={saveDisabled || !onSave} onSave={onSave ?? (() => {})} onOpen={el => onOpen(el)} />
    </div>
  );
}

/** Nearby restaurants use the standard Placez small card (lead review, v8): its artwork, else the
 *  directory logo, else the place-mark fallback (ServiceNameMark). Never an empty box. */
export function EventNearbyPlaceCard({ place, onOpen }: { place: Pick<Business, "id" | "name" | "type"> & Partial<Business>; onOpen: () => void }) {
  return (
    <div className="orailcard orailcard--place" data-card-category="placez">
      <PlaceDiscoveryCard place={place} size="small" onOpen={() => onOpen()} />
    </div>
  );
}
