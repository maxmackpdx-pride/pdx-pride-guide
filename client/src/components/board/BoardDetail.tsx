import BoardPostOverlay from './BoardPostOverlay';
import HousingPostOverlay from '@/components/housing/HousingPostOverlay';
import SpottedDetailModal from '@/components/SpottedDetailModal';
import BrowseStatus from '@/components/BrowseStatus';
import {useAuth} from '@/context/AuthContext';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {apiRequest} from '@/lib/queryClient';
import {parseBoardPostKey,boardCategories} from '@/lib/allBoards';
import {mizzedSource} from '@/lib/mizzedSource';
import {outzBoardIntent,outzMissedSource,type OutzBoardPost} from '@/lib/outzBoardPost';
import type {HousingPostView,HousingBoardResponse} from '@shared/housing';
import type {MissedConnectionPost} from '@/components/MissedConnectionsPanel';
export default function BoardDetail({
  postKey,
  onClose,
  onRequireAuth,
  onSelect,
}: {
  postKey: string;
  onClose: () => void;
  onRequireAuth: () => void;
  onSelect: (key: string) => void;
}) {
  const selected = parseBoardPostKey(postKey)!;
  const { user } = useAuth();
  const cat = boardCategories.find((c) => c.id === selected.category)!;
  const ownQuery =
    selected.category === "housing" || selected.category === "mizzed";
  const client = useQueryClient();
  const detail = useQuery<HousingPostView | MissedConnectionPost>({
    queryKey: [cat.endpoint, selected.id, user?.id],
    queryFn: () =>
      apiRequest("GET", `${cat.endpoint}/${selected.id}`).then((r) => r.json()),
    enabled: ownQuery,
    placeholderData: () => {
      const feed = client.getQueryData<HousingBoardResponse | MissedConnectionPost[]>([cat.endpoint, "all-boards", user?.id]);
      return (Array.isArray(feed) ? feed : feed?.posts)?.find(post => post.id === selected.id);
    },
    retry: 1,
  });
  // OutZide wall posts have no per-post endpoint; the detail renders from
  // the same board feed Boards.tsx already fetched (same query key, so it
  // dedupes and deep links fetch it on their own).
  const outzFeed = useQuery<OutzBoardPost[]>({
    queryKey: [cat.endpoint, "all-boards", user?.id],
    queryFn: () => apiRequest("GET", cat.endpoint).then((r) => r.json()),
    enabled: selected.category === "outz",
    retry: 1,
  });
  if (selected.category === "outz") {
    const row = outzFeed.data?.find(post => post.id === selected.id);
    if (!row)
      return (
        <div className="ab-detail-status" role="status">
          <BrowseStatus
            title={outzFeed.isError ? "This post could not load" : "Loading post…"}
            description={
              outzFeed.isError
                ? "It may have closed, or the connection may be interrupted."
                : "Your board is still here."
            }
            actionLabel={outzFeed.isError ? "Try again" : undefined}
            onAction={outzFeed.isError ? () => void outzFeed.refetch() : undefined}
          />
          <button type="button" className="eb-tool" onClick={onClose}>
            Back to Our BoardZ
          </button>
        </div>
      );
    if (outzBoardIntent(row.postKind) === "missed")
      return (
        <SpottedDetailModal
          key={postKey}
          presentation="eventz"
          postId={row.id}
          title="Missed connection"
          body={row.body}
          place={row.placeName || ""}
          kindLabel="Missed connections"
          kindColor={cat.color}
          isMine={row.isMine}
          isDemo={row.isDemo}
          external
          source={outzMissedSource(row.placeId, row.placeName)}
          onClose={onClose}
        />
      );
    // Buddy and ride posts keep the place-first behavior handled by Boards.
  }
  if (!ownQuery)
    return (
      <BoardPostOverlay
        key={postKey}
        presentation="eventz"
        kind={
          selected.category === "gigz"
            ? "gig"
            : selected.category === "giftz"
              ? "gifting"
              : "sellz"
        }
        postId={selected.id}
        onClose={onClose}
      />
    );
  if (!detail.data)
    return (
      <div className="ab-detail-status" role="status">
        <BrowseStatus
          title={detail.isError ? "This post could not load" : "Loading post…"}
          description={
            detail.isError
              ? "It may have closed, or the connection may be interrupted."
              : "Your board is still here."
          }
          actionLabel={detail.isError ? "Try again" : undefined}
          onAction={detail.isError ? () => void detail.refetch() : undefined}
        />
        <button type="button" className="eb-tool" onClick={onClose}>
          Back to Our BoardZ
        </button>
      </div>
    );
  if (selected.category === "housing")
    return (
      <HousingPostOverlay
        key={postKey}
        presentation="eventz"
        post={detail.data as HousingPostView}
        userId={user?.id}
        initialDetail
        initialIntent={new URLSearchParams(window.location.search).get("build") === "1" ? "BUILD" : new URLSearchParams(window.location.search).get("join") === "1" ? "JOIN" : new URLSearchParams(window.location.search).get("waitlist") === "1" ? "WAITLIST" : new URLSearchParams(window.location.search).get("chat") === "1" ? "CHAT" : null}
        onClose={onClose}
        onRequireAuth={onRequireAuth}
        onSelectPost={(id) => onSelect(`housing:${id}`)}
        sharePath={(id) => `/boardz?board=housing&post=housing:${id}`}
      />
    );
  const p = detail.data as MissedConnectionPost;
  return (
    <SpottedDetailModal
      key={postKey}
      presentation="eventz"
      postId={p.id}
      title={p.title}
      body={p.body}
      place={p.placeName || p.venueHint || ""}
      kindLabel={p.dayOfWeek || "Missed connections"}
      kindColor={cat.color}
      isMine={p.isMine}
      status={p.status}
      isDemo={p.isDemo}
      source={mizzedSource(p)}
      onClose={onClose}
    />
  );
}
