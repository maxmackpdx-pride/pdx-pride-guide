import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { counterpartyAvatar, senderAvatar, type InboxPartyAvatar } from "@/lib/inboxAvatar";
import { contextLabelOf, contextTypeOf } from "@/lib/inboxContext";
import { EVENT_TALENT_ROLE_LABELS, type EventTalentRole } from "@shared/eventTalent";
import { categoryFromContext, formatThreadTime } from "./mapContext";
import type { ApiMessageRow, Folder, LineupDecision, Thread, ThreadMessage, ThreadReveal } from "./types";
import { GUIDE_PUBLIC_HANDLE, isGuideSystemUsername } from "@shared/peopleHub";
import { trackProductEvent } from "@/lib/analytics";

const ARCHIVE_KEY = "pdx-inbox-archived-v1";

function loadArchived(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveArchived(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(Array.from(ids)));
}

function threadIdOf(row: ApiMessageRow): string {
  return String(row.threadId || row.thread_id || "").trim();
}

function isRead(row: ApiMessageRow): boolean {
  return Boolean(row.isRead ?? row.is_read);
}

function partyForRow(row: ApiMessageRow, folder: Folder, userId: number): InboxPartyAvatar {
  const tab = folder === "inbox" ? "inbox" : "sent";
  if (row.fromUserId === userId) {
    return senderAvatar(row);
  }
  return counterpartyAvatar(row, tab);
}

function displayNameFromParty(party: InboxPartyAvatar, anonymous: boolean): string {
  if (anonymous) return "Anonymous";
  return party.displayName || party.username || "Someone";
}

function handleFromParty(party: InboxPartyAvatar, anonymous: boolean): string {
  if (anonymous) return "@anonymous";
  if (!party.username) return "";
  // System mailbox may still be prideguidepdx in DB; show brand handle publicly.
  if (isGuideSystemUsername(party.username)) return `@${GUIDE_PUBLIC_HANDLE}`;
  return `@${party.username}`;
}

function previewMessage(row: ApiMessageRow, folder: Folder, userId: number): ThreadMessage {
  return {
    id: String(row.id),
    body: row.body,
    at: formatThreadTime(row.createdAt || row.created_at),
    self: folder === "sent",
    party: partyForRow(row, folder, userId),
  };
}

function buildListThread(row: ApiMessageRow, folder: Folder, userId: number, archived: boolean): Thread {
  const contextType = contextTypeOf(row);
  const anonymous = contextType === "MISSED_CONNECTION";
  const party = partyForRow(row, folder, userId);
  const name = displayNameFromParty(party, anonymous && (party.displayName === "Anonymous" || party.username === "Anonymous"));
  const preview = previewMessage(row, folder, userId);
  preview.self = folder === "sent";

  return {
    id: threadIdOf(row),
    folder,
    archived,
    unread: folder === "inbox" && !isRead(row),
    cat: categoryFromContext(contextType),
    name,
    handle: handleFromParty(party, anonymous && name === "Anonymous"),
    subject: row.subject || "(no subject)",
    contextLabel: contextLabelOf(row) || "",
    contextType: contextType || null,
    contextId: row.contextId ?? row.context_id ?? null,
    at: formatThreadTime(row.createdAt || row.created_at),
    ring: party.avatarRing || "progress",
    anonymous,
    party,
    messages: [preview],
    latestMessageId: row.id,
    lineupRequestId: contextType === "EVENT_TALENT_REQUEST" ? Number(row.contextId ?? row.context_id) || null : null,
  };
}

function threadRevealFromApi(reveal: {
  posterRevealed: boolean;
  replierRevealed: boolean;
  bothRevealed: boolean;
  iAmPoster?: boolean;
  iRevealed: boolean;
} | null): ThreadReveal | undefined {
  if (!reveal) return undefined;
  const theyRevealed = reveal.iAmPoster ? reveal.replierRevealed : reveal.posterRevealed;
  return {
    iRevealed: reveal.iRevealed,
    theyRevealed: Boolean(theyRevealed),
  };
}

async function refreshInboxQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] }),
    queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] }),
    queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] }),
  ]);
}

export function useInboxThreads(activeThreadId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id ?? 0;

  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => loadArchived());
  const [forcedUnread, setForcedUnread] = useState<Record<string, boolean>>({});
  const [threadOverrides, setThreadOverrides] = useState<Record<string, Partial<Thread>>>({});

  const blockMember = useCallback(async (username: string) => {
    if (!username || username === "Anonymous") return false;
    if (!window.confirm(`Block @${username}? You will no longer be able to contact each other, and this conversation will leave your inbox.`)) return false;
    const response = await fetch(`/api/users/${encodeURIComponent(username)}/block`, {
      method: "POST", credentials: "include",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast({ title: body.error || "Could not block member", variant: "destructive" });
      return false;
    }
    await refreshInboxQueries(queryClient);
    toast({ title: `@${username} blocked`, description: "Neither of you can contact the other. They were not notified." });
    return true;
  }, [queryClient, toast]);

  const {
    data: inbox = [],
    isLoading: inboxLoading,
    isError: inboxError,
    refetch: refetchInbox,
  } = useQuery<ApiMessageRow[]>({
    queryKey: ["/api/messages/inbox"],
    queryFn: async () => {
      const r = await fetch("/api/messages/inbox", { credentials: "include" });
      if (!r.ok) throw new Error("Could not load inbox");
      return r.json();
    },
    enabled: !!user,
  });

  const {
    data: sent = [],
    isLoading: sentLoading,
    isError: sentError,
    refetch: refetchSent,
  } = useQuery<ApiMessageRow[]>({
    queryKey: ["/api/messages/sent"],
    queryFn: async () => {
      const r = await fetch("/api/messages/sent", { credentials: "include" });
      if (!r.ok) throw new Error("Could not load sent");
      return r.json();
    },
    enabled: !!user,
  });

  const {
    data: activePayload,
    isLoading: activeLoading,
    isError: activeError,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ["/api/messages/thread", activeThreadId],
    queryFn: async () => {
      const r = await fetch(`/api/messages/thread/${encodeURIComponent(activeThreadId!)}`, { credentials: "include" });
      if (!r.ok) throw new Error("Could not load thread");
      return r.json() as Promise<{
        messages: ApiMessageRow[];
        reveal: {
          posterRevealed: boolean;
          replierRevealed: boolean;
          bothRevealed: boolean;
          iRevealed: boolean;
        } | null;
      }>;
    },
    enabled: !!user && !!activeThreadId,
  });

  const talentRequestId = useMemo(() => {
    if (!activeThreadId) return null;
    const row = [...inbox, ...sent].find(r => threadIdOf(r) === activeThreadId);
    if (contextTypeOf(row) !== "EVENT_TALENT_REQUEST") return null;
    return Number(row?.contextId ?? row?.context_id) || null;
  }, [activeThreadId, inbox, sent]);

  const { data: talentRequest } = useQuery({
    queryKey: ["/api/talent-request", talentRequestId],
    queryFn: () => fetch(`/api/talent-request/${talentRequestId}`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
    enabled: !!talentRequestId && !!user,
  });

  const baseThreads = useMemo(() => {
    if (!user) return [] as Thread[];
    const list: Thread[] = [];
    for (const row of inbox) {
      const id = threadIdOf(row);
      if (!id) continue;
      list.push({
        ...buildListThread(row, "inbox", userId, archivedIds.has(id)),
        unread: forcedUnread[id] ?? (!isRead(row)),
      });
    }
    for (const row of sent) {
      const id = threadIdOf(row);
      if (!id) continue;
      list.push(buildListThread(row, "sent", userId, archivedIds.has(id)));
    }
    return list.map(t => ({ ...t, ...threadOverrides[t.id] }));
  }, [inbox, sent, user, userId, archivedIds, forcedUnread, threadOverrides]);

  const threads = useMemo(() => {
    if (!activeThreadId || !activePayload?.messages?.length || !user) return baseThreads;
    const folder = baseThreads.find(t => t.id === activeThreadId)?.folder
      ?? (inbox.some(r => threadIdOf(r) === activeThreadId) ? "inbox" : "sent");
    const contextType = contextTypeOf(activePayload.messages[0]);
    const anonymous = contextType === "MISSED_CONNECTION";
    const counterpart = baseThreads.find(t => t.id === activeThreadId);
    const messages: ThreadMessage[] = activePayload.messages.map(m => {
      const self = m.fromUserId === userId;
      const party = self
        ? {
            photoUrl: user.photoUrl,
            avatarChoice: user.avatarChoice,
            avatarRing: user.avatarRing,
            displayName: user.displayName,
            username: user.username,
          }
        : senderAvatar(m);
      return {
        id: String(m.id),
        body: m.body,
        at: formatThreadTime(m.createdAt || m.created_at),
        self,
        party,
        reactions: Array.isArray(m.reactions) ? m.reactions : [],
      };
    });
    const party = counterpart?.party ?? partyForRow(activePayload.messages[0], folder, userId);
    const bothRevealed = activePayload.reveal?.bothRevealed;
    const masked = anonymous && !bothRevealed;
    const reveal = threadRevealFromApi(activePayload.reveal);
    const lineup = talentRequest
      ? {
          status: String(talentRequest.status || "PENDING").toUpperCase() as "PENDING" | "APPROVED" | "DENIED",
          role: EVENT_TALENT_ROLE_LABELS[talentRequest.role as EventTalentRole] || talentRequest.role || "Talent",
          eventTitle: talentRequest.eventTitle || "Event",
        }
      : counterpart?.lineup;

    const head = activePayload.messages[0];
    return baseThreads.map(t => t.id === activeThreadId
      ? {
          ...t,
          messages,
          party,
          name: displayNameFromParty(party, masked),
          handle: handleFromParty(party, masked),
          reveal,
          lineup,
          lineupRequestId: talentRequestId,
          contextType: contextType || t.contextType,
          contextId: head?.contextId ?? head?.context_id ?? t.contextId ?? null,
        }
      : t);
  }, [activeThreadId, activePayload, baseThreads, inbox, sent, talentRequest, talentRequestId, user, userId]);

  const sendMessage = useCallback(async (threadId: string, body: string) => {
    trackProductEvent("contact_attempt", "inbox_reply");
    const r = await fetch(`/api/messages/thread/${encodeURIComponent(threadId)}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body }),
    });
    if (!r.ok) {
      toast({ title: "Reply failed", variant: "destructive" });
      throw new Error("Reply failed");
    }
    trackProductEvent("contact_completed", "inbox_reply");
    await queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", threadId] });
    await refreshInboxQueries(queryClient);
  }, [queryClient, toast]);

  const toggleReaction = useCallback(
    async (threadId: string, messageId: string | number, emoji: string) => {
      const r = await fetch(`/api/messages/${encodeURIComponent(String(messageId))}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emoji }),
      });
      if (!r.ok) {
        toast({ title: "Could not react", variant: "destructive" });
        throw new Error("Reaction failed");
      }
      const data = (await r.json()) as { reactions?: ThreadMessage["reactions"] };
      // Optimistic: patch active thread cache so chips update immediately.
      queryClient.setQueryData(
        ["/api/messages/thread", threadId],
        (prev: { messages?: ApiMessageRow[] } | undefined) => {
          if (!prev?.messages) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              String(m.id) === String(messageId)
                ? { ...m, reactions: data.reactions || [] }
                : m,
            ),
          };
        },
      );
      return data.reactions || [];
    },
    [queryClient, toast],
  );

  const setRead = useCallback(async (threadId: string, unread: boolean) => {
    const thread = threads.find(t => t.id === threadId);
    if (!unread && thread?.latestMessageId && thread.folder === "inbox") {
      await fetch(`/api/messages/${thread.latestMessageId}/read`, { method: "PUT", credentials: "include" });
      setForcedUnread(prev => {
        const next = { ...prev };
        delete next[threadId];
        return next;
      });
      await refreshInboxQueries(queryClient);
      return;
    }
    setForcedUnread(prev => ({ ...prev, [threadId]: unread }));
  }, [queryClient, threads]);

  const archive = useCallback((threadId: string) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.add(threadId);
      saveArchived(next);
      return next;
    });
  }, []);

  const unarchive = useCallback((threadId: string) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.delete(threadId);
      saveArchived(next);
      return next;
    });
  }, []);

  const remove = useCallback(async (threadId: string) => {
    const r = await fetch(`/api/messages/thread/${encodeURIComponent(threadId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!r.ok) {
      toast({ title: "Delete failed", variant: "destructive" });
      throw new Error("Delete failed");
    }
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.delete(threadId);
      saveArchived(next);
      return next;
    });
    await refreshInboxQueries(queryClient);
    await queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", threadId] });
  }, [queryClient, toast]);

  const revealSelf = useCallback(async (threadId: string) => {
    const r = await fetch(`/api/messages/thread/${encodeURIComponent(threadId)}/reveal`, {
      method: "POST",
      credentials: "include",
    });
    if (!r.ok) {
      toast({ title: "Could not reveal", variant: "destructive" });
      throw new Error("Reveal failed");
    }
    await queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", threadId] });
    await refreshInboxQueries(queryClient);
    toast({ title: "Identity shared" });
  }, [queryClient, toast]);

  const resolveLineup = useCallback(async (threadId: string, decision: LineupDecision) => {
    const thread = threads.find(t => t.id === threadId);
    const requestId = thread?.lineupRequestId ?? talentRequestId;
    if (!requestId) return;
    const path = decision === "APPROVED" ? "approve" : "reject";
    const r = await fetch(`/api/talent-request/${requestId}/${path}`, { method: "POST", credentials: "include" });
    if (!r.ok) {
      toast({ title: "Could not update lineup", variant: "destructive" });
      throw new Error("Lineup update failed");
    }
    await queryClient.invalidateQueries({ queryKey: ["/api/talent-request", requestId] });
    await queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", threadId] });
    await refreshInboxQueries(queryClient);
    toast({ title: decision === "APPROVED" ? "Lineup approved" : "Lineup declined" });
  }, [queryClient, talentRequestId, threads, toast]);

  const deletedCount = useMemo(
    () => baseThreads.filter((t) => t.archived).length,
    [baseThreads],
  );

  return {
    threads,
    loading: inboxLoading || sentLoading,
    listError: inboxError || sentError,
    activeLoading,
    activeError,
    retryList: async () => {
      await Promise.all([refetchInbox(), refetchSent()]);
    },
    retryActive: async () => {
      await refetchActive();
    },
    deletedCount,
    sendMessage,
    toggleReaction,
    setRead,
    archive,
    unarchive,
    remove,
    revealSelf,
    resolveLineup,
    blockMember,
  };
}
