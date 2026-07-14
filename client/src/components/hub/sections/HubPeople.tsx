import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BoardLoadingState from "@/components/BoardLoadingState";
import type { PeopleHubTab, PeopleHubUser } from "@shared/peopleHub";
import HubPersonRow from "./HubPersonRow";

const TABS: Array<{ key: PeopleHubTab; label: string }> = [
  { key: "following", label: "Following" },
  { key: "followers", label: "Followers" },
  { key: "discover", label: "Discover" },
];

const EMPTY_COPY: Record<PeopleHubTab, { title: string; body: string }> = {
  following: {
    title: "Your following list is empty",
    body: "Find hosts and scene-makers in Discover, or follow people from their public profile at /u/username.",
  },
  followers: {
    title: "No followers yet",
    body: "Show up at events, post on the boards, and keep your profile fresh — people find each other here.",
  },
  discover: {
    title: "No suggestions right now",
    body: "Verified hosts and event organizers will show up here as more people join the guide.",
  },
};

function peopleQueryKey(tab: PeopleHubTab) {
  return ["/api/users/me/people", tab] as const;
}

export default function HubPeople() {
  const [tab, setTab] = useState<PeopleHubTab>("following");
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: people = [], isLoading, isError } = useQuery<PeopleHubUser[]>({
    queryKey: peopleQueryKey(tab),
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/me/people/${tab}`);
      return res.json();
    },
  });

  const followMutation = useMutation({
    mutationFn: async ({ username, isFollowing }: { username: string; isFollowing: boolean }) => {
      setPendingUsername(username);
      const method = isFollowing ? "DELETE" : "POST";
      await apiRequest(method, `/api/users/${encodeURIComponent(username)}/follow`);
    },
    onSuccess: (_data, vars) => {
      toast({ title: vars.isFollowing ? "Unfollowed" : "Following", duration: 2000 });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/follow-stats"] });
    },
    onError: () => {
      toast({ title: "Could not update follow", variant: "destructive" });
    },
    onSettled: () => setPendingUsername(null),
  });

  const empty = !isLoading && !isError && people.length === 0;
  const emptyCopy = EMPTY_COPY[tab];

  return (
    <div className="reveal hub-people">
      <div className="kick hub-people-hero-kick">Your community</div>
      <h1 className="h1">People</h1>
      <div className="hub-people-tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`seg${tab === t.key ? " on" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="card hub-people-list hub-people-loading">
          <BoardLoadingState label="Loading people" />
        </div>
      )}

      {isError && (
        <div className="card hub-empty hub-people-empty" role="alert">
          Could not load your people list. Try refreshing the page.
        </div>
      )}

      {!isLoading && !isError && people.length > 0 && (
        <div className="card hub-people-list">
          {people.map((person) => (
            <HubPersonRow
              key={person.id}
              person={person}
              showFollow={tab !== "followers"}
              followPending={pendingUsername === person.username}
              onToggleFollow={() =>
                followMutation.mutate({ username: person.username, isFollowing: person.isFollowing })
              }
            />
          ))}
        </div>
      )}

      {empty && (
        <div className="card hub-empty hub-people-empty">
          <div className="kick hub-people-empty__kick">{emptyCopy.title}</div>
          <p className="hub-people-empty__copy">{emptyCopy.body}</p>
          <div className="hub-people-empty__actions">
            <Link href="/events" className="seg hub-people-empty__cta hub-people-empty__cta--primary">
              Browse events
            </Link>
            <Link href="/directory" className="seg hub-people-empty__cta hub-people-empty__cta--ghost">
              Queer directory
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}