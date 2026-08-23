import type { QueryClient } from "@tanstack/react-query";

export const RSVP_CHECKINS_KEY = ["/api/events/mine/check-ins"] as const;
export const RSVP_SUMMARIES_KEY = ["/api/events/attendance-summaries"] as const;
export const HOUSING_KEY = ["/api/housing"] as const;
export const GIFTING_KEY = ["/api/gifting"] as const;
export const SELLZ_SAVED_KEY = ["/api/sellz/saved/ids"] as const;

export type CheckInRow = { eventId: number };
export type AttendanceSummaries = Record<string, { count: number } & Record<string, unknown>>;
export type QuerySnapshot = Array<[readonly unknown[], unknown]>;

export function beginInFlight(ids: Set<number>, id: number): boolean {
  if (ids.has(id)) return false;
  ids.add(id);
  return true;
}

export function endInFlight(ids: Set<number>, id: number): void {
  ids.delete(id);
}

export function applyRsvpToCaches(
  checkIns: CheckInRow[] | undefined,
  summaries: AttendanceSummaries | undefined,
  eventId: number,
  nextGoing: boolean,
): { checkIns: CheckInRow[]; summaries: AttendanceSummaries } {
  const current = Array.isArray(checkIns) ? checkIns : [];
  const wasGoing = current.some((row) => row.eventId === eventId);
  let nextCheckIns = current;
  if (nextGoing && !wasGoing) nextCheckIns = [...current, { eventId }];
  if (!nextGoing && wasGoing) nextCheckIns = current.filter((row) => row.eventId !== eventId);

  const key = String(eventId);
  const summariesNext: AttendanceSummaries = { ...(summaries ?? {}) };
  const prevCount = Number(summariesNext[key]?.count ?? 0);
  let delta = 0;
  if (nextGoing && !wasGoing) delta = 1;
  if (!nextGoing && wasGoing) delta = -1;
  summariesNext[key] = { ...summariesNext[key], count: Math.max(0, prevCount + delta) };
  return { checkIns: nextCheckIns, summaries: summariesNext };
}

export async function snapshotQueries(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
): Promise<QuerySnapshot> {
  await queryClient.cancelQueries({ queryKey: [...queryKey] });
  return queryClient.getQueriesData({ queryKey: [...queryKey] });
}

export function restoreQueries(queryClient: QueryClient, snapshot: QuerySnapshot | undefined): void {
  if (!snapshot) return;
  for (const [key, data] of snapshot) {
    queryClient.setQueryData(key, data);
  }
}

export type RsvpSnapshot = {
  checkIns: QuerySnapshot;
  summaries: QuerySnapshot;
};

export async function snapshotRsvp(queryClient: QueryClient): Promise<RsvpSnapshot> {
  const checkIns = await snapshotQueries(queryClient, RSVP_CHECKINS_KEY);
  const summaries = await snapshotQueries(queryClient, RSVP_SUMMARIES_KEY);
  return { checkIns, summaries };
}

export function applyRsvpQueryData(
  queryClient: QueryClient,
  eventId: number,
  nextGoing: boolean,
): void {
  const checkIns = queryClient.getQueryData<CheckInRow[]>([...RSVP_CHECKINS_KEY]);
  const summaries = queryClient.getQueryData<AttendanceSummaries>([...RSVP_SUMMARIES_KEY]);
  const next = applyRsvpToCaches(checkIns, summaries, eventId, nextGoing);
  queryClient.setQueryData([...RSVP_CHECKINS_KEY], next.checkIns);
  queryClient.setQueryData([...RSVP_SUMMARIES_KEY], next.summaries);
}

export function restoreRsvp(queryClient: QueryClient, snap: RsvpSnapshot | undefined): void {
  if (!snap) return;
  restoreQueries(queryClient, snap.checkIns);
  restoreQueries(queryClient, snap.summaries);
}

type HousingLike = {
  id?: number;
  saved?: boolean;
  lastChangeLabel?: string | null;
  myRequest?: { id: number; kind: string; status: string } | null;
  posts?: HousingLike[];
};

export function patchHousingSaved(data: unknown, postId: number): unknown {
  if (!data || typeof data !== "object") return data;
  const row = data as HousingLike;
  if (Array.isArray(row.posts)) {
    return {
      ...row,
      posts: row.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              saved: !post.saved,
              lastChangeLabel: post.saved ? null : post.lastChangeLabel,
            }
          : post,
      ),
    };
  }
  if (row.id === postId && typeof row.saved === "boolean") {
    return {
      ...row,
      saved: !row.saved,
      lastChangeLabel: row.saved ? null : row.lastChangeLabel,
    };
  }
  return data;
}

export function applyHousingSavedToggle(queryClient: QueryClient, postId: number): void {
  const entries = queryClient.getQueriesData({ queryKey: [...HOUSING_KEY] });
  for (const [key, data] of entries) {
    queryClient.setQueryData(key, patchHousingSaved(data, postId));
  }
}

export function patchHousingRequest(
  data: unknown,
  postId: number,
  request: { id: number; kind: string; status: string },
): unknown {
  if (!data || typeof data !== "object") return data;
  const row = data as HousingLike;
  if (Array.isArray(row.posts)) {
    return {
      ...row,
      posts: row.posts.map((post) => (post.id === postId ? { ...post, myRequest: request } : post)),
    };
  }
  if (row.id === postId) {
    return { ...row, myRequest: request };
  }
  return data;
}

export function applyHousingRequest(
  queryClient: QueryClient,
  postId: number,
  request: { id: number; kind: string; status: string },
): void {
  const entries = queryClient.getQueriesData({ queryKey: [...HOUSING_KEY] });
  for (const [key, data] of entries) {
    queryClient.setQueryData(key, patchHousingRequest(data, postId, request));
  }
}

type GiftLike = {
  id?: number;
  viewerSelected?: boolean;
  interestCount?: number;
};

export function patchGiftingRaise(data: unknown, postId: number): unknown {
  if (!Array.isArray(data)) return data;
  return data.map((post: GiftLike) => {
    if (post?.id !== postId) return post;
    if (post.viewerSelected) return post;
    return {
      ...post,
      viewerSelected: true,
      interestCount: Number(post.interestCount ?? 0) + 1,
    };
  });
}

export function applyGiftingRaise(queryClient: QueryClient, postId: number): void {
  const entries = queryClient.getQueriesData({ queryKey: [...GIFTING_KEY] });
  for (const [key, data] of entries) {
    queryClient.setQueryData(key, patchGiftingRaise(data, postId));
  }
}

export function patchSellzSavedIds(data: unknown, postId: number): unknown {
  const ids = Array.isArray(data) ? data.map(Number) : [];
  if (ids.includes(postId)) return ids.filter((id) => id !== postId);
  return [...ids, postId];
}

export function applySellzSavedToggle(queryClient: QueryClient, postId: number): void {
  const entries = queryClient.getQueriesData({ queryKey: [...SELLZ_SAVED_KEY] });
  for (const [key, data] of entries) {
    queryClient.setQueryData(key, patchSellzSavedIds(data, postId));
  }
}
