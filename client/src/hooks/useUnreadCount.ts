import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export function useUnreadCount() {
  const { user } = useAuth();
  const { data = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count",user?.id],
    queryFn: () =>
      fetch("/api/messages/unread-count", { credentials: "include" }).then((r) =>
        {if(!r.ok)throw Error("Unread count unavailable");return r.json();},
      ),
    enabled: !!user,
    refetchInterval: 90000,
  });
  return data.count || 0;
}