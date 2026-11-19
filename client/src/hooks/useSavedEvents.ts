import { useEffect, useMemo, useRef } from "react";
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
  const viewer = useRef(user?.id);
  useEffect(()=>{viewer.current=user?.id;},[user?.id]);
  const mutation = useMutation({
    mutationFn: async ({ id, saved }: { id: number; saved: boolean; actor: number }) => {
      await apiRequest(saved ? "PUT" : "DELETE", `/api/events/${id}/save`);
    },
    onSuccess: (_, {id,saved,actor}) => {
      const originKey=["/api/events/mine/saved",actor];
      if (client.getQueryData(originKey)!==undefined) {
        client.setQueryData<number[]>(originKey, (previous=[]) => saved ? [...new Set([...previous,id])] : previous.filter(value=>value!==id));
      }
      void client.invalidateQueries({queryKey:originKey});
      if(viewer.current===actor) toast({title:saved?"Saved to My Schedule":"Removed saved event", description:saved?"Only you can see this save.":undefined});
    },
    onError: (_, {actor}) => {
      if(viewer.current===actor)toast({title:"Could not update your saved event",description:"Please try again.",variant:"destructive"});
    },
  });
  function toggleSave(id:number) {
    if (!user || mutation.isPending || query.isPending) return;
    if (query.isError) {void query.refetch(); return;}
    mutation.mutate({id, saved:!savedIds.has(id),actor:user.id});
  }
  return {savedIds,error:!!user&&query.isError,retry:query.refetch,loading:!!user&&query.isPending,pending:mutation.isPending,toggleSave};
}
