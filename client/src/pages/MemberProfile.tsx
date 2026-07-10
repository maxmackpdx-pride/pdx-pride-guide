import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import BoardLoadingState from "@/components/BoardLoadingState";
import {
  accentTextSafeCss,
  DEFAULT_PROFILE_ACCENT,
  normalizeProfileAccent,
} from "@shared/profileAccents";
import ProfileTopBar from "@/components/profile/ProfileTopBar";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileStatStrip from "@/components/profile/ProfileStatStrip";
import ProfileMarquee from "@/components/profile/ProfileMarquee";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ProfileFooter from "@/components/profile/ProfileFooter";
import EventsTab from "@/components/profile/EventsTab";
import MediaTab from "@/components/profile/MediaTab";
import BoardTab from "@/components/profile/BoardTab";
import AboutTab from "@/components/profile/AboutTab";
import type { ProfileMarquee as MarqueeData, ProfileTabId, PublicProfile } from "@/components/profile/types";
import "@/components/profile/profile.css";

export default function MemberProfile() {
  const [, params] = useRoute("/u/:username");
  const username = params?.username ? decodeURIComponent(params.username) : "";
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<ProfileTabId>("events");
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [msgSending, setMsgSending] = useState(false);

  const { data, isLoading, isError, error } = useQuery<PublicProfile>({
    queryKey: ["/api/users", username],
    queryFn: () => apiRequest("GET", `/api/users/${encodeURIComponent(username)}`).then(r => r.json()),
    enabled: !!username,
  });

  const accentHex = useMemo(
    () => normalizeProfileAccent(data?.accentColor || DEFAULT_PROFILE_ACCENT),
    [data?.accentColor],
  );
  const accentText = accentTextSafeCss(accentHex);

  usePageSeo(
    data
      ? `${data.displayName || data.username} (@${data.username}) — PDX Pride Guide`
      : "Member Profile — PDX Pride Guide",
    (data?.bio || "PDX Pride Guide member profile.").replace(/\s+/g, " ").slice(0, 160),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMsgOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Reset tab when navigating between profiles
  useEffect(() => {
    setTab("events");
    setMsgOpen(false);
  }, [username]);

  const followMutation = useMutation({
    mutationFn: (next: boolean) =>
      apiRequest(next ? "POST" : "DELETE", `/api/users/${encodeURIComponent(username)}/follow`).then(r => r.json()),
    onSuccess: (result: { followers: number; isFollowing: boolean }) => {
      queryClient.setQueryData<PublicProfile | undefined>(["/api/users", username], prev =>
        prev
          ? {
              ...prev,
              isFollowing: result.isFollowing,
              stats: prev.stats ? { ...prev.stats, followers: result.followers } : prev.stats,
            }
          : prev,
      );
    },
    onError: (err: unknown) =>
      toast({ title: parseApiError(err, "Could not update follow"), variant: "destructive" }),
  });

  const handleFollowClick = () => {
    if (!authUser) {
      toast({ title: "Sign in to follow members" });
      return;
    }
    followMutation.mutate(!data?.isFollowing);
  };

  const openMessage = () => {
    if (!authUser) {
      toast({ title: "Sign in to send messages" });
      return;
    }
    setMsgText("");
    setMsgSent(false);
    setMsgOpen(true);
  };

  const sendMessage = async () => {
    const body = msgText.trim();
    if (!body || msgSending) return;
    setMsgSending(true);
    try {
      await apiRequest("POST", `/api/users/${encodeURIComponent(username)}/message`, { body });
      setMsgSent(true);
    } catch (err) {
      toast({ title: parseApiError(err, "Could not send message"), variant: "destructive" });
    } finally {
      setMsgSending(false);
    }
  };

  const saveAccent = async (hex: string) => {
    try {
      await apiRequest("PUT", "/api/users/me", { accentColor: hex });
      queryClient.setQueryData<PublicProfile | undefined>(["/api/users", username], prev =>
        prev ? { ...prev, accentColor: hex } : prev,
      );
      toast({ title: "Accent updated" });
    } catch (err) {
      toast({ title: parseApiError(err, "Could not save accent"), variant: "destructive" });
    }
  };

  const saveMarquee = async (next: MarqueeData) => {
    try {
      await apiRequest("PUT", "/api/users/me", { marquee: next });
      queryClient.setQueryData<PublicProfile | undefined>(["/api/users", username], prev =>
        prev ? { ...prev, marquee: next } : prev,
      );
      toast({ title: "Marquee saved" });
    } catch (err) {
      toast({ title: parseApiError(err, "Could not save marquee"), variant: "destructive" });
      throw err;
    }
  };

  const ticketsHref = useMemo(() => {
    const upcoming = data?.activity?.hostingUpcoming || data?.activity?.hostedEvents || [];
    const withTickets = upcoming.find(e => e.ticketUrl);
    return withTickets?.ticketUrl || null;
  }, [data]);

  if (!username) {
    return (
      <div className="profile-page">
        <p className="profile-empty">Profile not found.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="profile-page">
        <ProfileTopBar />
        <BoardLoadingState label="Loading profile" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="profile-page">
        <ProfileTopBar />
        <p className="profile-empty">
          {parseApiError(error, "Could not load this profile.")}
        </p>
      </div>
    );
  }

  return (
    <div
      className="profile-page"
      style={
        {
          ["--profile-accent" as string]: accentHex,
          ["--profile-accent-text" as string]: accentText,
        } as CSSProperties
      }
    >
      <ProfileTopBar />
      <ProfileHero
        profile={data}
        accentHex={accentHex}
        onFollow={handleFollowClick}
        followPending={followMutation.isPending}
        onMessage={openMessage}
        onAccentChange={data.isOwner ? saveAccent : undefined}
        ticketsHref={ticketsHref}
      />
      <ProfileStatStrip profile={data} />
      <ProfileMarquee profile={data} onSave={data.isOwner ? saveMarquee : undefined} />
      <ProfileTabs active={tab} onChange={setTab} />

      <div className="profile-body">
        {tab === "events" && <EventsTab profile={data} />}
        {tab === "media" && <MediaTab profile={data} />}
        {tab === "board" && <BoardTab profile={data} />}
        {tab === "about" && <AboutTab profile={data} onBook={openMessage} />}
      </div>

      <ProfileFooter />

      {msgOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Send message"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setMsgOpen(false)}
        >
          <div
            style={{
              width: "min(440px, 100%)",
              background: "#0c0c0c",
              border: "1px solid #2a2a2a",
              borderRadius: 10,
              padding: 18,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Message @{data.username}
            </div>
            {msgSent ? (
              <p style={{ color: "var(--neon-cyan)" }}>Sent. They will see it in their inbox.</p>
            ) : (
              <>
                <textarea
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  rows={5}
                  placeholder="Say hey..."
                  style={{
                    width: "100%",
                    background: "#111",
                    border: "1px solid #2a2a2a",
                    color: "#fff",
                    borderRadius: 6,
                    padding: 12,
                    resize: "vertical",
                    fontFamily: "var(--font-body)",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="profile-btn profile-btn--primary"
                    onClick={sendMessage}
                    disabled={msgSending || !msgText.trim()}
                  >
                    {msgSending ? "Sending…" : "Send"}
                  </button>
                  <button type="button" className="profile-btn profile-btn--ghost" onClick={() => setMsgOpen(false)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
