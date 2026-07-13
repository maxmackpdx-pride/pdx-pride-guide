import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Props = {
  businessId: number;
  initialFollowing?: boolean;
  /** Compact for PlaceCard corner; full for PlaceModal */
  variant?: "card" | "modal";
  accent?: string;
  onRequireAuth?: () => void;
};

/**
 * Follow a directory venue (business_follows). Visible on every place card/modal.
 */
export default function VenueFollowButton({
  businessId,
  initialFollowing = false,
  variant = "card",
  accent = "var(--cyan)",
  onRequireAuth,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState(initialFollowing);

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      const r = await fetch(`/api/directory/${businessId}/follow`, {
        method: next ? "POST" : "DELETE",
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Could not update follow");
      return data as { isFollowing: boolean; followerCount: number };
    },
    onSuccess: (data) => {
      setFollowing(data.isFollowing);
      queryClient.invalidateQueries({ queryKey: ["/api/directory"] });
      toast({ title: data.isFollowing ? "Following venue" : "Unfollowed", duration: 1800 });
    },
    onError: (err: Error) => {
      toast({ title: "Could not follow", description: err.message, variant: "destructive" });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      onRequireAuth?.();
      if (!onRequireAuth) {
        toast({ title: "Log in to follow venues", duration: 2200 });
      }
      return;
    }
    mutation.mutate(!following);
  };

  const isCard = variant === "card";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={mutation.isPending}
      aria-pressed={following}
      aria-label={following ? "Unfollow venue" : "Follow venue"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: isCard ? 28 : 34,
        padding: isCard ? "0 10px" : "0 14px",
        borderRadius: 999,
        border: `1.5px solid ${following ? accent : "color-mix(in srgb, " + accent + " 55%, #444)"}`,
        background: following ? `color-mix(in srgb, ${accent} 18%, transparent)` : "rgba(0,0,0,.55)",
        color: following ? "#fff" : accent,
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: isCard ? 10 : 12,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        cursor: mutation.isPending ? "default" : "pointer",
        opacity: mutation.isPending ? 0.7 : 1,
        zIndex: 4,
      }}
    >
      {following ? "Following" : "Follow me"}
    </button>
  );
}
