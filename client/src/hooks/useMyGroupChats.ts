import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";

export type GroupChatRow = {
  kind: "EVENT" | "BEACH" | "OUTZ" | "COMMUNITY";
  id: number | string;
  title: string;
  state: "BEFORE" | "OPEN";
  opensAt: string | null;
  closesAt: string | null;
  unreadCount?: number;
  muted?: boolean;
  href: string;
  calendarDate?: string;
};

/** The inbox and event Feed use the same server-filtered room membership. */
export function useMyGroupChats() {
  const { user } = useAuth();
  return useQuery<GroupChatRow[]>({
    queryKey: ["/api/chats/mine", user?.id],
    enabled: !!user,
    queryFn: () => apiRequest("GET", "/api/chats/mine").then(response => response.json()),
    refetchInterval: 30_000,
  });
}
