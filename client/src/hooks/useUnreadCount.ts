import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export function useUnreadCount() {
  const { user } = useAuth();
  const { data = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () =>
      fetch("/api/messages/unread-count", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : { count: 0 },
      ),
    enabled: !!user,
    refetchInterval: 90000,
  });
  return data.count || 0;
}