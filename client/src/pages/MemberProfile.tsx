import { useCallback, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import BoardLoadingState from "@/components/BoardLoadingState";
import EventModal from "@/components/EventModal";
import AuthModal from "@/components/AuthModal";
import type { Event } from "@shared/schema";
import type { MemberProfileData } from "./profile/types";
import {
  normalizePublicProfile,
  pickTheBigOne,
} from "@/components/profile/normalizePublicProfile";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileStatStrip from "@/components/profile/ProfileStatStrip";
import MarqueeBand from "@/components/profile/MarqueeBand";
import HostingPanel from "@/components/profile/HostingPanel";
import TheBigOne from "@/components/profile/TheBigOne";
import GoingRail from "@/components/profile/GoingRail";
import FlyerStash from "@/components/profile/FlyerStash";
import UpdatesPanel from "@/components/profile/UpdatesPanel";
import ProfileFooter from "@/components/profile/ProfileFooter";
import {
  chipsForEvent,
  summaryForEvent,
  type AttendanceSummaryMap,
} from "@/components/profile/mapAttendancePreviewToChips";
import MessageModal from "./profile/MessageModal";
import { profileCssVars } from "@/components/profile/profileHelpers";
import { copyTextToClipboard } from "@/lib/copyText";
import "./MemberProfile.css";

export default function MemberProfile() {
  const [routeMatch, routeParams] = useRoute("/u/:username");
  const username = routeParams?.username || "";
  const { toast } = useToast();
  usePageSeo(
    username ? `@${username} · Profile | PDX Pride Guide` : "Profile | PDX Pride Guide",
    username
      ? `Pride Guide member profile for @${username}.`
      : "Pride Guide member profile.",
    username
      ? {
          url: `https://www.prideguidepdx.com/u/${encodeURIComponent(username)}`,
          image: `https://www.prideguidepdx.com/api/og/profile/${encodeURIComponent(username)}?v=2`,
          imageAlt: `@${username} on PDX Pride Guide`,
          type: "article",
        }
      : undefined,
  );

  const [msgOpen, setMsgOpen] = useState(false);
  const [accentOpen, setAccentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { myEventIds, toggleRsvp, showAuth, setShowAuth } = useEventRsvp();

  const { data: apiData, isLoading, error } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${username}`);
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`) as Error & { status?: number };
        err.status = res.status;
        throw err;
      }
      return res.json() as Promise<MemberProfileData>;
    },
    enabled: !!username && routeMatch,
  });

  const { data: attendanceSummaries } = useQuery({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/events/attendance-summaries");
      if (!res.ok) return {} as AttendanceSummaryMap;
      return res.json() as Promise<AttendanceSummaryMap>;
    },
    staleTime: 30_000,
  });

  const data = useMemo(() => {
    if (!apiData) return null;
    return normalizePublicProfile(apiData, { goingCounts: attendanceSummaries });
  }, [apiData, attendanceSummaries]);

  const followMutation = useMutation({
    mutationFn: async () => {
      const method = data?.isFollowing ? "DELETE" : "POST";
      const res = await apiRequest(method, `/api/users/${username}/follow`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      toast({
        title: data?.isFollowing ? "Unfollowed" : "Following",
        duration: 2000,
      });
    },
    onError: (err) => {
      toast({ title: parseApiError(err, "Could not update follow"), variant: "destructive" });
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await apiRequest("PUT", "/api/users/me", patch);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
      }
      return true;
    },
    onMutate: async (patch) => {
      // Optimistic accent / banner so the picker + hero update immediately
      await queryClient.cancelQueries({ queryKey: ["profile", username] });
      const prev = queryClient.getQueryData<MemberProfileData>(["profile", username]);
      if (prev) {
        queryClient.setQueryData<MemberProfileData>(["profile", username], {
          ...prev,
          ...(typeof patch.accentColor === "string" ? { accentColor: patch.accentColor } : {}),
          ...(typeof patch.banner === "string" ? { banner: patch.banner as MemberProfileData["banner"] } : {}),
          ...(patch.coverImageUrl === null ? { coverImageUrl: null, coverCrop: null } : {}),
        });
      }
      return { prev };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      toast({ title: "Saved", duration: 1500 });
    },
    onError: (err, _patch, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["profile", username], ctx.prev);
      }
      toast({ title: parseApiError(err, "Could not save"), variant: "destructive" });
    },
  });

  const openEvent = useCallback(async (eventId: number) => {
    try {
      const res = await apiRequest("GET", `/api/events/${eventId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const full = (await res.json()) as Event;
      setSelectedEvent(full);
    } catch (err) {
      toast({ title: parseApiError(err, "Could not open event"), variant: "destructive" });
    }
  }, [toast]);

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/u/${username}`
      : `https://prideguidepdx.com/u/${username}`;

  const onCopy = useCallback(async () => {
    const ok = await copyTextToClipboard(profileUrl);
    if (ok) {
      setCopied(true);
      toast({ title: "Link copied" });
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  }, [profileUrl, toast]);

  if (!routeMatch || isLoading) {
    return (
      <div className="pp-page pp-page--loading">
        <BoardLoadingState />
      </div>
    );
  }

  if (error || !data || !apiData) {
    const notFound = !!(error && (error as Error & { status?: number }).status === 404);
    return (
      <div className="pp-page pp-page--error">
        <div className="mp-notfound">
          <p className="display mp-notfound__title">
            {notFound ? "MEMBER NOT FOUND" : "COULD NOT LOAD PROFILE"}
          </p>
          <p className="mp-notfound__copy">
            {notFound
              ? `No active member named @${username} on the Pride Guide.`
              : "The profile API is unavailable right now. Try again in a moment."}
          </p>
          <a href="/" className="btn-neon solid">
            BACK HOME
          </a>
        </div>
      </div>
    );
  }

  const isOwner = !!data.isOwner;
  const accent = data.accentColor || "#FF00CC";
  const banner = data.profileBanner ?? null;
  const hosting = data.events?.hosting ?? { upcoming: [], past: [] };
  const going = data.events?.going ?? { upcoming: [], past: [] };
  const bigOne = pickTheBigOne(data);
  const posts = data.boardPosts ?? [];
  // Plain compute (not useMemo) so hooks order can never break after early returns.
  // Hosted past → HOST/MC; attended-only → WENT; host wins on shared ids.
  const stashById = new Map<number, (typeof going.past)[0] & { stashRole: "MC" | "WENT" }>();
  for (const e of going.past) stashById.set(e.id, { ...e, stashRole: "WENT" });
  for (const e of hosting.past) stashById.set(e.id, { ...e, stashRole: "MC" });
  const stashEvents = Array.from(stashById.values());

  return (
    <div
      className="pp-page pp-page--reimagined profile-page"
      style={profileCssVars(accent)}
    >
      <div className="pp-shell">
        <ProfileHero
          data={data}
          accent={accent}
          banner={banner}
          isOwner={isOwner}
          isFollowing={!!data.isFollowing}
          followPending={followMutation.isPending}
          accentOpen={accentOpen}
          shareOpen={shareOpen}
          copied={copied}
          profileUrl={profileUrl}
          onFollow={() => followMutation.mutate()}
          onShareToggle={() => setShareOpen(v => !v)}
          onCopy={onCopy}
          onMessage={!isOwner ? () => setMsgOpen(true) : undefined}
          onAccentToggle={() => setAccentOpen(v => !v)}
          onAccent={(hex) => patchMutation.mutate({ accentColor: hex })}
          onSolidBanner={(hex) =>
            patchMutation.mutate({
              accentColor: hex,
              banner: "accent-gradient",
              // Solid theme replaces custom cover so the day-flyer gradient shows
              coverImageUrl: null,
              coverCrop: null,
            })
          }
        />

        <ProfileStatStrip data={data} />

        <MarqueeBand
          marquee={data.marquee ?? { items: [], speed: 30, color: "rainbow" }}
          isOwner={isOwner}
          isPromoter={!!data.isPromoter}
          onSave={(m) => patchMutation.mutate({ marquee: JSON.stringify(m) })}
        />

        <HostingPanel
          upcoming={hosting.upcoming}
          past={hosting.past}
          displayName={data.displayName}
          onEventClick={(e) => openEvent(e.id)}
        />

        <div className="pp-split">
          <div className="pp-split__left">
            {bigOne && (
              <TheBigOne
                event={bigOne}
                goingCount={
                  summaryForEvent(attendanceSummaries, bigOne.id)?.count ?? bigOne.goingCount
                }
                goingAvatars={chipsForEvent(attendanceSummaries, bigOne.id, 4)}
                isGoing={myEventIds.has(bigOne.id)}
                onRsvp={() => toggleRsvp(bigOne.id)}
                onOpen={() => openEvent(bigOne.id)}
              />
            )}
          </div>
          <div className="pp-split__right">
            <GoingRail
              events={going.upcoming}
              attendanceSummaries={attendanceSummaries}
              onEventClick={(e) => openEvent(e.id)}
            />
            <UpdatesPanel
              posts={posts}
              author={{
                photoUrl: data.photoUrl,
                displayName: data.displayName,
                avatarRing: data.avatarRing,
                avatarChoice: data.avatarChoice,
                username: data.username,
              }}
            />
          </div>
        </div>

        {/* Full shell width (not locked in the left split column) */}
        <FlyerStash
          events={stashEvents}
          onEventClick={(e) => openEvent(e.id)}
        />

        <ProfileFooter username={data.username} />
      </div>

      {msgOpen && (
        <MessageModal
          data={apiData}
          username={username}
          onClose={() => setMsgOpen(false)}
        />
      )}

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEventUpdated={(updated) => setSelectedEvent(updated)}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
