import { useLayoutEffect, useRef, type RefObject } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";

type Page = { messages: Array<{id:number}>; chatOpen:boolean; nextBeforeId?:number|null };

export function useEventChatHistory<T extends Page>(eventId: number | null, listRef: RefObject<HTMLDivElement | null>) {
  const { user } = useAuth();
  const query = useInfiniteQuery({
    queryKey:["/api/events", eventId, "chat", "history", user?.id],
    enabled:Boolean(eventId && user),
    initialPageParam:null as number | null,
    queryFn:async ({pageParam}) => {
      const suffix = pageParam ? "?before=" + pageParam : "";
      return (await apiRequest("GET", "/api/events/" + eventId + "/chat" + suffix)).json() as Promise<T>;
    },
    getNextPageParam:(page:T) => page.nextBeforeId ?? undefined,
    refetchInterval:8_000,
  });
  // After access is lost or the room closes, retained older pages must not remain visible.
  const pages = user && (!query.isError || query.isFetchNextPageError) ? query.data?.pages : undefined;
  const latest = pages?.[0];
  const messages = latest?.chatOpen ? [...(pages || [])].reverse().flatMap(page => page.messages) : [];
  const pinnedToBottom = useRef(true);
  const anchor = useRef<{id:string;top:number} | null>(null);
  const first = messages[0]?.id;
  const last = messages[messages.length-1]?.id;
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || !eventId) return;
    const previous = anchor.current;
    const node = previous && el.querySelector<HTMLElement>('[data-chat-id="' + previous.id + '"]');
    if (previous && node) {
      el.scrollTop += node.getBoundingClientRect().top - previous.top;
      anchor.current = null;
    } else if (pinnedToBottom.current) el.scrollTop = el.scrollHeight;
  }, [first,last,eventId,listRef]);
  const earlier = () => {
    const node = listRef.current?.querySelector<HTMLElement>("[data-chat-id]");
    if (node?.dataset.chatId) anchor.current = {id:node.dataset.chatId,top:node.getBoundingClientRect().top};
    void query.fetchNextPage({cancelRefetch:false});
  };
  const onScroll = () => {
    const el = listRef.current;
    if (el) pinnedToBottom.current = el.scrollHeight - el.clientHeight - el.scrollTop < 40;
  };
  return { data:latest && {...latest,messages:messages as T["messages"]}, isLoading:query.isLoading, isError:query.isError && !query.isFetchNextPageError, retry:query.refetch, earlier, canLoadEarlier:latest?.chatOpen && query.hasNextPage, loadingEarlier:query.isFetchingNextPage, earlierFailed:query.isFetchNextPageError, onScroll };
}
