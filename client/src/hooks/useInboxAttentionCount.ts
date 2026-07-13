import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useUnreadCount } from "@/hooks/useUnreadCount";

type PendingAdmin = { count: number; ownerCount?: number };

/**
 * Combined inbox attention: personal unread + shared admin queue + owner desk.
 * Used by the floating FAB and mobile Messages tab so backlog is not invisible.
 */
export function useInboxAttentionCount() {
  const { user } = useAuth();
  const unread = useUnreadCount();
  const isAdmin = Boolean(user?.isAdmin || user?.isSuperAdmin);
  const isPrimaryOwner = Boolean(user?.isPrimaryOwner);

  const { data: pendingAdmin = { count: 0, ownerCount: 0 } } = useQuery<PendingAdmin>({
    queryKey: ["/api/admin/pending-count"],
    queryFn: () =>
      fetch("/api/admin/pending-count", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : { count: 0, ownerCount: 0 },
      ),
    enabled: !!user && isAdmin,
    refetchInterval: 90_000,
  });

  const adminQueue = isAdmin ? pendingAdmin.count || 0 : 0;
  const ownerDesk = isPrimaryOwner ? pendingAdmin.ownerCount || 0 : 0;
  const actionQueue = adminQueue + ownerDesk;
  const total = unread + actionQueue;

  return {
    unread,
    adminQueue,
    ownerDesk,
    actionQueue,
    total,
    hasActionQueue: actionQueue > 0,
  };
}