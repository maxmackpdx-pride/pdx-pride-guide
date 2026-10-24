import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";

export type HeartKind = "event" | "place" | "resource" | "outz" | "board";
export type HeartSnapshot = { title: string; subtitle?: string | null; image?: string | null; href: string; accent?: string | null };
export type Heart = HeartSnapshot & { kind: HeartKind; ref: string; createdAt: string };

export const HEARTS_KEY = ["/api/hearts"] as const;

/** The signed-in member's hearted cards, shared by every heart button on the page. */
export function useHearts() {
  const { user } = useAuth();
  return useQuery<Heart[]>({
    queryKey: [...HEARTS_KEY, user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: () => apiRequest("GET", "/api/hearts").then(r => r.json()),
  });
}

export function useHeart(kind: HeartKind, ref: string, snapshot: HeartSnapshot) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const hearts = useHearts();
  const key = [...HEARTS_KEY, user?.id];
  const hearted = !!hearts.data?.some(h => h.kind === kind && h.ref === ref);
  const toggle = useMutation({
    mutationFn: () => hearted
      ? apiRequest("DELETE", "/api/hearts", { kind, ref }).then(r => r.json())
      : apiRequest("POST", "/api/hearts", { kind, ref, ...snapshot }).then(r => r.json()),
    onMutate: async () => {
      await cache.cancelQueries({ queryKey: key });
      const before = cache.getQueryData<Heart[]>(key) ?? [];
      cache.setQueryData<Heart[]>(key, hearted
        ? before.filter(h => !(h.kind === kind && h.ref === ref))
        : [{ ...snapshot, kind, ref, createdAt: new Date().toISOString() }, ...before]);
      return { before };
    },
    onError: (_error, _vars, context) => { if (context) cache.setQueryData(key, context.before); },
    onSettled: () => { void cache.invalidateQueries({ queryKey: key }); void cache.invalidateQueries({ queryKey: ["/api/outz/follow"] }); },
  });
  return { hearted, signedIn: !!user, loading: hearts.isLoading, pending: toggle.isPending, toggle: () => toggle.mutate() };
}
