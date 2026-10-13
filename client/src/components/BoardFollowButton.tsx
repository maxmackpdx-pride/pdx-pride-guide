import { useMapzActive } from './MapzActivity';
import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import "./BoardShareButton.css";
import AuthModal from "@/components/AuthModal";

export type FollowableRoom = "gigz" | "giftz" | "sellz" | "mizzed" | "houz" | "eventz" | "outz" | "rezources";

const BOARD_NAMES:Record<FollowableRoom,string> = { gigz: "Gigz", giftz: "Giftz", sellz: "Sellz", mizzed: "Mizzed", houz: "My Hoüz", eventz: "Eventz", outz: "OutZide", rezources: "NEEDZ" };
type FollowAction = {follow:boolean;board:FollowableRoom;viewerId:number};

export default function BoardFollowButton({ board }: { board: FollowableRoom }) {
  const active = useMapzActive();
  const { user } = useAuth();
  const { toast } = useToast();
  const identity=useRef(user?.id);identity.current=user?.id;
  const [showAuth, setShowAuth] = useState(false);
  const queryKey = ["/api/boards/follow", board, user?.id ?? "guest"];
  const status = useQuery<{ isFollowing: boolean }>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/boards/${board}/follow`, { credentials: "include" });
      if (!response.ok) throw new Error("Could not load follow status");
      return response.json();
    },
    enabled: active && !!user,
  });
  const following = !!status.data?.isFollowing;
  const boardName = BOARD_NAMES[board];
  const mutation = useMutation({
    mutationFn: async ({follow,board:target}: FollowAction) => {
      const response = await fetch(`/api/boards/${target}/follow`, {
        method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow }),
      });
      if (!response.ok) throw new Error("Could not update board follow");
      return response.json() as Promise<{ isFollowing: boolean }>;
    },
    onSuccess: (data,action) => {
      if(identity.current!==action.viewerId)return;
      queryClient.setQueryData(["/api/boards/follow",action.board,action.viewerId], data);
      const updatedBoardName=BOARD_NAMES[action.board];
      queryClient.invalidateQueries({ queryKey: ["/api/hub/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hub/feed/head"] });
      toast({ title: data.isFollowing ? `Following ${updatedBoardName}` : `Unfollowed ${updatedBoardName}`, description: data.isFollowing ? "New updates appear in your Hub’s Following feed." : undefined });
    },
    onError: (_error,action) => {if(identity.current===action.viewerId)toast({ title: "Could not update follow", description: "Try again in a moment.", variant: "destructive" });},
  });
  return <>
    <button type="button" className="board-follow-button pdx-glass-rebind" data-board={board} aria-pressed={following} aria-label={status.isError ? `Retry ${boardName} follow status` : following ? `Following ${boardName}` : `Follow ${boardName}`} disabled={!!user && (status.isPending || mutation.isPending)} onClick={() => !user ? setShowAuth(true) : status.isError ? void status.refetch() : mutation.mutate({follow:!following,board,viewerId:user.id})}>
      {following ? <BellOff size={17} aria-hidden="true" /> : <Bell size={17} aria-hidden="true" />}
      {status.isError ? "Retry follow status" : following ? "Following" : "Follow"}
    </button>
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
  </>;
}
