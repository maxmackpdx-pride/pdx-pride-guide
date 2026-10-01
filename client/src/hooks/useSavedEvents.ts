import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useSavedEvents() {
  const { user } = useAuth();
  const client = useQueryClient();
  const { toast } = useToast();
  const key = ["/api/events/mine/saved", user?.id];
  const query = useQuery<number[]>({ queryKey: key, enabled: !!user, queryFn: () => apiRequest("GET", "/api/events/mine/saved").then(r => r.json()) });
  const savedIds = useMemo(() => new Set(user ? query.data ?? [] : []), [query.data, user?.id]);
  const mutation = useMutation({
    mutationFn: async ({ id, saved }: { id: number; saved: boolean }) => {
      await apiRequest(saved ? "PUT" : "DELETE", `/api/events/${id}/save`);
      return { id, saved };
    },
    onSuccess: ({ id, saved }) => {
      client.setQueryData<number[]>(key, previous => saved ? [...new Set([...(previous ?? []), id])] : (previous ?? []).filter(value => value !== id));
      void client.invalidateQueries({ queryKey: key });
      toast({ title: saved ? "Saved to My Schedule" : "Removed saved event", description: saved ? "Only you can see this save." : undefined });
    },
    onError: () => toast({ title: "Could not update your saved event", description: "Please try again.", variant: "destructive" }),
  });
  return { savedIds, loading: !!user && query.isPending, pending: mutation.isPending, toggleSave: (id: number) => { if (user && !mutation.isPending && !query.isPending) mutation.mutate({ id, saved: !savedIds.has(id) }); } };
}
