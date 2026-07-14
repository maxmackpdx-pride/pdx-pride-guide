import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { counterpartyAvatar, senderAvatar, type InboxPartyAvatar } from "@/lib/inboxAvatar";
import { contextLabelOf, contextTypeOf } from "@/lib/inboxContext";
import { categoryFromContext, formatThreadTime } from "./mapContext";
import type { ApiMessageRow, Folder, Thread, ThreadMessage } from "./types";

const ARCHIVE_KEY = "pdx-admin-guide-archived-v1";

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

function partyForRow(row: ApiMessageRow, folder: Folder): InboxPartyAvatar {
  const tab = folder === "inbox" ? "inbox" : "sent";
  return counterpartyAvatar(row, tab);
}

function displayNameFromParty(party: InboxPartyAvatar): string {
  return party.displayName || party.username || "Someone";
}

function handleFromParty(party: InboxPartyAvatar): string {
  return party.username ? `@${party.username}` : "";
}

function buildListThread(row: ApiMessageRow, folder: Folder, archived: boolean): Thread {
  const contextType = contextTypeOf(row);
  const party = partyForRow(row, folder);
  const preview: ThreadMessage = {
    id: String(row.id),
    body: row.body,
    at: formatThreadTime(row.createdAt || row.created_at),
    self: folder === "sent",
    party,
  };

  return {
    id: threadIdOf(row),
    folder,
    archived,
    unread: folder === "inbox" && !isRead(row),
    cat: categoryFromContext(contextType),
    name: displayNameFromParty(party),
    handle: handleFromParty(party),
    subject: row.subject || "(no subject)",
    contextLabel: contextLabelOf(row) || "",
    contextType: contextType || null,
    contextId: row.contextId ?? row.context_id ?? null,
    at: formatThreadTime(row.createdAt || row.created_at),
    ring: party.avatarRing || "progress",
    anonymous: false,
    party,
    messages: [preview],
    latestMessageId: row.id,
  };
}

async function refreshAdminGuideQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["/api/admin/messages/inbox"] }),
    queryClient.invalidateQueries({ queryKey: ["/api/admin/messages/sent"] }),
    queryClient.invalidateQueries({ queryKey: ["/api/admin/messages/unread-count"] }),
    queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-count"] }),
  ]);
}

/**
 * Shared guide-admin mailbox for floating inbox → Admin → Inbox / Sent.
 * Threads are owned by the non-personal @prideguidepdx identity, not the logged-in admin.
 */
export function useAdminGuideThreads(activeThreadId: string | null, enabled: boolean) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => loadArchived());

  const { data: inbox = [], isLoading: inboxLoading } = useQuery<ApiMessageRow[]>({
    queryKey: ["/api/admin/messages/inbox"],
    queryFn: async () => {
      const r = await fetch("/api/admin/messages/inbox", { credentials: "include" });
      if (!r.ok) throw new Error("Could not load admin inbox");
      return r.json();
    },
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  });

  const { data: sent = [], isLoading: sentLoading } = useQuery<ApiMessageRow[]>({
    queryKey: ["/api/admin/messages/sent"],
    queryFn: async () => {
      const r = await fetch("/api/admin/messages/sent", { credentials: "include" });
      if (!r.ok) throw new Error("Could not load admin sent");
      return r.json();
    },
    enabled,
    refetchInterval: enabled ? 90_000 : false,
  });

  const { data: activePayload } = useQuery({
    queryKey: ["/api/admin/messages/thread", activeThreadId],
    queryFn: async () => {
      const r = await fetch(`/api/admin/messages/thread/${encodeURIComponent(activeThreadId!)}`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Could not load thread");
      return r.json() as Promise<{ messages: ApiMessageRow[]; guideUserId: number }>;
    },
    enabled: enabled && !!activeThreadId,
  });

  const guideUserId = activePayload?.guideUserId ?? 0;

  const baseThreads = useMemo(() => {
    const list: Thread[] = [];
    for (const row of inbox) {
      const id = threadIdOf(row);
      if (!id) continue;
      list.push(buildListThread(row, "inbox", archivedIds.has(id)));
    }
    for (const row of sent) {
      const id = threadIdOf(row);
      if (!id) continue;
      // Prefer inbox row if both sides have the same thread.
      if (list.some((t) => t.id === id)) continue;
      list.push(buildListThread(row, "sent", archivedIds.has(id)));
    }
    return list;
  }, [inbox, sent, archivedIds]);

  const threads = useMemo(() => {
    if (!activeThreadId || !activePayload?.messages?.length) return baseThreads;
    const folder =
      baseThreads.find((t) => t.id === activeThreadId)?.folder
      ?? (inbox.some((r) => threadIdOf(r) === activeThreadId) ? "inbox" : "sent");
    const counterpart = baseThreads.find((t) => t.id === activeThreadId);
    const messages: ThreadMessage[] = activePayload.messages.map((m) => {
      const self = m.fromUserId === guideUserId;
      const party = self
        ? {
            photoUrl: "/brand/pdx-pride-guide-avatar.jpg",
            avatarChoice: 1,
            avatarRing: "rainbow",
            displayName: "PDX Pride Guide",
            username: "prideguidepdx",
          }
        : senderAvatar(m);
      return {
        id: String(m.id),
        body: m.body,
        at: formatThreadTime(m.createdAt || m.created_at),
        self,
        party,
      };
    });
    const party = counterpart?.party ?? partyForRow(activePayload.messages[0], folder);
    const head = activePayload.messages[0];
    return baseThreads.map((t) =>
      t.id === activeThreadId
        ? {
            ...t,
            messages,
            party,
            name: displayNameFromParty(party),
            handle: handleFromParty(party),
            contextType: contextTypeOf(head) || t.contextType,
            contextId: head?.contextId ?? head?.context_id ?? t.contextId ?? null,
          }
        : t,
    );
  }, [activeThreadId, activePayload, baseThreads, inbox, guideUserId]);

  const sendMessage = useCallback(
    async (threadId: string, body: string) => {
      const r = await fetch(`/api/admin/messages/thread/${encodeURIComponent(threadId)}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body }),
      });
      if (!r.ok) {
        toast({ title: "Reply failed", variant: "destructive" });
        throw new Error("Reply failed");
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/messages/thread", threadId] });
      await refreshAdminGuideQueries(queryClient);
    },
    [queryClient, toast],
  );

  const setRead = useCallback(
    async (threadId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread?.latestMessageId || thread.folder !== "inbox") return;
      await fetch(`/api/admin/messages/${thread.latestMessageId}/read`, {
        method: "PUT",
        credentials: "include",
      });
      await refreshAdminGuideQueries(queryClient);
    },
    [queryClient, threads],
  );

  const archive = useCallback((threadId: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      next.add(threadId);
      saveArchived(next);
      return next;
    });
  }, []);

  const unarchive = useCallback((threadId: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      next.delete(threadId);
      saveArchived(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(async () => {
    const r = await fetch("/api/admin/messages/mark-all-read", {
      method: "POST",
      credentials: "include",
    });
    if (!r.ok) {
      toast({ title: "Could not mark all read", variant: "destructive" });
      throw new Error("mark all failed");
    }
    await refreshAdminGuideQueries(queryClient);
  }, [queryClient, toast]);

  const remove = useCallback(
    async (threadId: string) => {
      const r = await fetch(`/api/admin/messages/thread/${encodeURIComponent(threadId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        toast({ title: "Delete failed", variant: "destructive" });
        throw new Error("Delete failed");
      }
      setArchivedIds((prev) => {
        const next = new Set(prev);
        next.delete(threadId);
        saveArchived(next);
        return next;
      });
      await refreshAdminGuideQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/messages/thread", threadId] });
    },
    [queryClient, toast],
  );

  const unreadCount = useMemo(
    () => baseThreads.filter((t) => t.folder === "inbox" && t.unread && !t.archived).length,
    [baseThreads],
  );

  return {
    threads,
    loading: inboxLoading || sentLoading,
    unreadCount,
    sendMessage,
    setRead,
    archive,
    unarchive,
    markAllRead,
    remove,
  };
}
