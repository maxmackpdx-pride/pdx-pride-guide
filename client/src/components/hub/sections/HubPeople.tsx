import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BoardLoadingState from "@/components/BoardLoadingState";
import type {
  HubFollowedPlace,
  PeopleFollowingPayload,
  PeopleHubTab,
  PeopleHubUser,
} from "@shared/peopleHub";
import { placePath } from "@shared/placeSlug";
import { resolveDirectoryLogo } from "@/lib/directoryLogos";
import HubPersonRow from "./HubPersonRow";

const TABS: Array<{ key: PeopleHubTab; label: string }> = [
  { key: "following", label: "Following" },
  { key: "followers", label: "Followers" },
  { key: "discover", label: "Discover" },
];

const EMPTY_COPY: Record<PeopleHubTab, { title: string; body: string }> = {
  following: {
    title: "Your following list is empty",
    body: "Follow people from Discover or their profile, and follow venues from the Places directory — both show up here.",
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

function isFollowingPayload(data: unknown): data is PeopleFollowingPayload {
  return !!data && typeof data === "object" && Array.isArray((data as PeopleFollowingPayload).people);
}

export default function HubPeople() {
  const [tab, setTab] = useState<PeopleHubTab>("following");
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const [pendingPlaceId, setPendingPlaceId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data, isLoading, isError } = useQuery({
    queryKey: peopleQueryKey(tab),
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/me/people/${tab}`);
      return res.json();
    },
  });

  const people: PeopleHubUser[] =
    tab === "following" && isFollowingPayload(data)
      ? data.people
      : Array.isArray(data)
        ? (data as PeopleHubUser[])
        : [];

  const places: HubFollowedPlace[] =
    tab === "following" && isFollowingPayload(data) ? data.places : [];

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

  const placeFollowMutation = useMutation({
    mutationFn: async ({ placeId, isFollowing }: { placeId: number; isFollowing: boolean }) => {
      setPendingPlaceId(placeId);
      const method = isFollowing ? "DELETE" : "POST";
      await apiRequest(method, `/api/directory/${placeId}/follow`);
    },
    onSuccess: (_data, vars) => {
      toast({ title: vars.isFollowing ? "Unfollowed venue" : "Following venue", duration: 1800 });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/directory"] });
    },
    onError: () => {
      toast({ title: "Could not update venue follow", variant: "destructive" });
    },
    onSettled: () => setPendingPlaceId(null),
  });

  const empty = !isLoading && !isError && people.length === 0 && places.length === 0;
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

      {!isLoading && !isError && places.length > 0 && (
        <section className="hub-people-places" aria-label="Places you follow">
          <div className="kick hub-people-places__kick">Places you follow</div>
          <div className="card hub-people-list">
            {places.map((place) => {
              const logo = resolveDirectoryLogo(place.name, place.imageUrl);
              return (
                <div key={`place-${place.id}`} className="hub-thread hub-people-row rowin">
                  <Link href={placePath(place.id, place.name)} className="hub-thread__link">
                    {logo ? (
                      <img
                        src={logo}
                        alt=""
                        className="hub-people-place__logo"
                        width={40}
                        height={40}
                      />
                    ) : (
                      <span className="hub-people-place__mark" aria-hidden>
                        {place.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="hub-thread__body">
                      <div className="hub-thread__top">
                        <div className="hub-thread__id">
                          <span className="hub-thread__name">{place.name}</span>
                          <span className="hub-thread__badge">Place</span>
                        </div>
                      </div>
                      <span className="hub-thread__sub">
                        {[place.type, place.neighborhood].filter(Boolean).join(" · ")}
                        {place.followerCount > 0
                          ? ` · ${place.followerCount} follower${place.followerCount === 1 ? "" : "s"}`
                          : ""}
                      </span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className={`foll${place.isFollowing ? " on" : ""}`}
                    disabled={pendingPlaceId === place.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      placeFollowMutation.mutate({
                        placeId: place.id,
                        isFollowing: place.isFollowing,
                      });
                    }}
                  >
                    {place.isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!isLoading && !isError && people.length > 0 && (
        <section className={places.length > 0 ? "hub-people-people" : undefined} aria-label="People you follow">
          {places.length > 0 && tab === "following" && (
            <div className="kick hub-people-places__kick">People you follow</div>
          )}
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
        </section>
      )}

      {empty && (
        <div className="card hub-empty hub-people-empty">
          <div className="kick hub-people-empty__kick">{emptyCopy.title}</div>
          <p className="hub-people-empty__copy">{emptyCopy.body}</p>
          <div className="hub-people-empty__actions">
            {tab === "following" && (
              <Link href="/directory" className="seg hub-people-empty__cta hub-people-empty__cta--primary">
                Browse places
              </Link>
            )}
            <Link
              href="/events"
              className={`seg hub-people-empty__cta${tab === "following" ? " hub-people-empty__cta--ghost" : " hub-people-empty__cta--primary"}`}
            >
              Browse events
            </Link>
            {tab !== "following" && (
              <Link href="/directory" className="seg hub-people-empty__cta hub-people-empty__cta--ghost">
                Queer directory
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
