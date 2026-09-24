import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";

export default function BoardFollowButton({ board }: { board: "gigz" | "giftz" | "sellz" }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const queryKey = ["/api/boards/follow", board, user?.id ?? "guest"];
  const status = useQuery<{ isFollowing: boolean }>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/boards/${board}/follow`, { credentials: "include" });
      if (!response.ok) throw new Error("Could not load follow status");
      return response.json();
    },
    enabled: !!user,
  });
  const following = !!status.data?.isFollowing;
  const boardName = board === "gigz" ? "Gigz" : board === "giftz" ? "Giftz" : "Sellz";
  const mutation = useMutation({
    mutationFn: async (follow: boolean) => {
      const response = await fetch(`/api/boards/${board}/follow`, {
        method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow }),
      });
      if (!response.ok) throw new Error("Could not update board follow");
      return response.json() as Promise<{ isFollowing: boolean }>;
    },
    onSuccess: data => {
      queryClient.setQueryData(queryKey, data);
      queryClient.invalidateQueries({ queryKey: ["/api/hub/feed"] });
      toast({ title: data.isFollowing ? `Following ${board.toUpperCase()}` : `Unfollowed ${board.toUpperCase()}`, description: data.isFollowing ? "New posts appear in your Hub’s Following boards feed." : undefined });
    },
    onError: () => toast({ title: "Could not update follow", description: "Try again in a moment.", variant: "destructive" }),
  });
  return <>
    <button type="button" className="board-follow-button" data-board={board} aria-pressed={following} disabled={!!user && (status.isPending || mutation.isPending)} onClick={() => !user ? setShowAuth(true) : status.isError ? void status.refetch() : mutation.mutate(!following)}>
      {following ? <BellOff size={17} aria-hidden="true" /> : <Bell size={17} aria-hidden="true" />}
      {status.isError ? "Retry follow status" : following ? `Following ${boardName}` : `Follow ${boardName}`}
    </button>
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
  </>;
}
