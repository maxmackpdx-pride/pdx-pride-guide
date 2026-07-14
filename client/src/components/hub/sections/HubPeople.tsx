import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BoardLoadingState from "@/components/BoardLoadingState";
import type { PeopleHubTab, PeopleHubUser } from "@shared/peopleHub";
import HubPersonRow from "./HubPersonRow";
import "../hub-home.css";

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
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Your community
      </div>
      <h1 className="h1">People</h1>
      <div style={{ display: "flex", gap: 22, borderBottom: "1px solid var(--panel-border)", margin: "20px 0 22px" }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`seg${tab === t.key ? " on" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="card" style={{ padding: 28 }}>
          <BoardLoadingState label="Loading people" />
        </div>
      )}

      {isError && (
        <div className="card hub-empty" role="alert">
          Could not load your people list. Try refreshing the page.
        </div>
      )}

      {!isLoading && !isError && people.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
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
        <div
          className="card hub-empty"
          style={{
            border: "1px solid var(--panel-border)",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <div className="kick" style={{ color: "var(--panel-cyan)", marginBottom: 10 }}>
            {emptyCopy.title}
          </div>
          <p style={{ margin: "0 0 18px", color: "var(--board-text)" }}>{emptyCopy.body}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/events" className="seg" style={{ textDecoration: "none", padding: "10px 16px", border: "1px solid var(--panel-cyan)", borderRadius: 8, color: "var(--panel-cyan)" }}>
              Browse events
            </Link>
            <Link href="/directory" className="seg" style={{ textDecoration: "none", padding: "10px 16px", border: "1px solid var(--panel-border-2)", borderRadius: 99, color: "var(--board-muted)" }}>
              Queer directory
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}