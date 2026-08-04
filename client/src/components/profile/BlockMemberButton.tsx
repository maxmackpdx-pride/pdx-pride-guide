import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BlockMemberButton({ username, blocked }: { username: string; blocked: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!blocked && !window.confirm(`Block @${username}? You will no longer be able to contact each other, and this conversation will leave your inbox.`)) {
        return null;
      }
      const res = await apiRequest(blocked ? "DELETE" : "POST", `/api/users/${encodeURIComponent(username)}/block`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: (result) => {
      if (!result) return;
      void queryClient.invalidateQueries({ queryKey: ["profile", username] });
      void queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      toast({
        title: blocked ? `@${username} unblocked` : `@${username} blocked`,
        description: blocked ? "You can contact each other again." : "Neither of you can contact the other. They were not notified.",
      });
    },
    onError: (error) => toast({ title: parseApiError(error, "Could not update block"), variant: "destructive" }),
  });
  return (
    <button
      type="button"
      className={`pp-btn pp-btn--block${blocked ? " is-on" : ""}`}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      aria-pressed={blocked}
    >
      {mutation.isPending ? "Updating…" : blocked ? "Unblock" : "Block"}
    </button>
  );
}
