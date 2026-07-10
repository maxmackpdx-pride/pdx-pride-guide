import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import BoardLoadingState from "@/components/BoardLoadingState";
import type { MemberProfileData, ProfileTabKey } from "./profile/types";
import type { ProfileMarquee as ProfileMarqueeType } from "./profile/types";
import ProfileHero from "./profile/ProfileHero";
import ProfileActionRow from "./profile/ProfileActionRow";
import ProfileStatStrip from "./profile/ProfileStatStrip";
import ProfileMarquee from "./profile/ProfileMarquee";
import ProfileTabs from "./profile/ProfileTabs";
import ProfileFooter from "./profile/ProfileFooter";
import EventsTab from "./profile/tabs/EventsTab";
import MediaTab from "./profile/tabs/MediaTab";
import BoardTab from "./profile/tabs/BoardTab";
import AboutTab from "./profile/tabs/AboutTab";
import MessageModal from "./profile/MessageModal";

export default function MemberProfile() {
  const [routeMatch, routeParams] = useRoute("/u/:username");
  const username = routeParams?.username || "";
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  usePageSeo(`@${username} - Profile`, `Profile of ${username}`);

  const [activeTab, setActiveTab] = useState<ProfileTabKey>("about");
  const [msgOpen, setMsgOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${username}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<MemberProfileData>;
    },
    enabled: !!username && routeMatch,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const method = data?.isFollowing ? "DELETE" : "POST";
      const res = await apiRequest(method, `/api/users/${username}/follow`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      const newState = data?.isFollowing;
      toast({ title: newState ? "Unfollowed" : "Following", duration: 2000 });
    },
    onError: (err) => {
      const msg = parseApiError(err, "An error occurred");
      toast({ title: msg, variant: "destructive" });
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await apiRequest("PUT", "/api/users/me", patch);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      toast({ title: "Saved", duration: 1500 });
    },
    onError: (err) => {
      const msg = parseApiError(err, "An error occurred");
      toast({ title: msg, variant: "destructive" });
    },
  });

  const addPackLinkMutation = useMutation({
    mutationFn: async (relation: "packmate" | "handler") => {
      const targetUsername = window.prompt(`Enter @username to add as ${relation}:`);
      if (!targetUsername) return true;
      const res = await apiRequest("POST", `/api/users/me/pack/${relation}`, { username: targetUsername });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      toast({ title: "Added", duration: 1500 });
    },
    onError: (err) => {
      const msg = parseApiError(err, "An error occurred");
      toast({ title: msg, variant: "destructive" });
    },
  });

  const removePackLinkMutation = useMutation({
    mutationFn: async ({ relation, userId }: { relation: "packmate" | "handler"; userId: number }) => {
      const res = await apiRequest("DELETE", `/api/users/me/pack/${relation}/${userId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      toast({ title: "Removed", duration: 1500 });
    },
    onError: (err) => {
      const msg = parseApiError(err, "An error occurred");
      toast({ title: msg, variant: "destructive" });
    },
  });

  if (!routeMatch || isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BoardLoadingState />
      </div>
    );
  }

  if (error || !data) {
    const notFound = error && (error as any)?.status === 404;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="mp-notfound">
          <p className="display mp-notfound__title">{notFound ? "MEMBER NOT FOUND" : "COULD NOT LOAD PROFILE"}</p>
          <p className="mp-notfound__copy">
            {notFound
              ? `No active member named @${username} on the Pride Guide.`
              : "The profile API is unavailable right now. Try again in a moment."}
          </p>
          <a href="/" className="btn-neon solid">BACK HOME</a>
        </div>
      </div>
    );
  }

  const isOwner = !!data.isOwner;
  const accentColor = data.accentColor || "var(--neon-magenta)";

  return (
    <div className="mp-page" style={{ "--acc": accentColor } as React.CSSProperties}>
      <ProfileHero
        data={data}
        actionRow={
          <ProfileActionRow
            data={data}
            username={username}
            isOwner={isOwner}
            following={!!data.isFollowing}
            followPending={followMutation.isPending}
            onFollow={() => followMutation.mutate()}
            onSavePatch={async (patch) => {
              await patchMutation.mutateAsync(patch);
              return true;
            }}
            onSwitchToEvents={() => setActiveTab("events")}
            onOpenMessage={() => setMsgOpen(true)}
            ticketHref={undefined}
          />
        }
      />

      <div className="mp-container">
        <ProfileStatStrip data={data} accent={accentColor} />

        {data.marquee && (
          <ProfileMarquee
            marquee={data.marquee}
            isOwner={isOwner}
            onSave={(next: ProfileMarqueeType) => patchMutation.mutate({ marquee: next })}
          />
        )}

        <ProfileTabs active={activeTab} onChange={setActiveTab} />

        <div className="mp-tab-content">
          {activeTab === "events" && <EventsTab data={data} />}
          {activeTab === "media" && <MediaTab data={data} />}
          {activeTab === "board" && <BoardTab data={data} />}
          {activeTab === "about" && (
            <AboutTab
              data={data}
              onSavePatch={async (patch) => {
                await patchMutation.mutateAsync(patch);
                return true;
              }}
              onOpenMessage={() => setMsgOpen(true)}
              onAddLink={(relation) => addPackLinkMutation.mutate(relation)}
              onRemoveLink={(relation, userId) => removePackLinkMutation.mutate({ relation, userId })}
            />
          )}
        </div>

        <ProfileFooter username={username} />
      </div>

      {msgOpen && (
        <MessageModal
          data={data}
          username={username}
          onClose={() => setMsgOpen(false)}
        />
      )}
    </div>
  );
}
