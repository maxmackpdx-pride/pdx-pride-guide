import { useState, useEffect, useCallback } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import BoardLoadingState from "@/components/BoardLoadingState";
import { DEFAULT_PROFILE_ACCENT, DEFAULT_PROFILE_BANNER } from "@shared/profileConstants";
import ProfileTopBar from "@/components/profile/ProfileTopBar";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileStatStrip from "@/components/profile/ProfileStatStrip";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ProfileFooter from "@/components/profile/ProfileFooter";
import MarqueeBand from "@/components/profile/MarqueeBand";
import EventsTab from "@/components/profile/EventsTab";
import MediaTab from "@/components/profile/MediaTab";
import BoardTab from "@/components/profile/BoardTab";
import AboutTab from "@/components/profile/AboutTab";
import { profileCssVars } from "@/components/profile/profileHelpers";
import type { ProfileMarquee, ProfileTabId, PublicProfileData } from "@/components/profile/types";
import "./MemberProfile.css";

export default function MemberProfile() {
  const [, params] = useRoute("/u/:username");
  const username = params?.username ? decodeURIComponent(params.username) : "";
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<ProfileTabId>("events");
  const [shareOpen, setShareOpen] = useState(false);
  const [accentOpen, setAccentOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [msgSending, setMsgSending] = useState(false);

  const { data, isLoading, isError, error } = useQuery<PublicProfileData>({
    queryKey: ["/api/users", username],
    queryFn: () => apiRequest("GET", `/api/users/${encodeURIComponent(username)}`).then(r => r.json()),
    enabled: !!username,
  });

  const accent = data?.accentColor || DEFAULT_PROFILE_ACCENT;
  const banner = data?.profileBanner === undefined ? DEFAULT_PROFILE_BANNER : data.profileBanner;
  const profileUrl = typeof window !== "undefined" ? window.location.href : "";
  const marquee: ProfileMarquee = data?.marquee || { items: [], speed: 26, color: "rainbow" };

  usePageSeo(
    data
      ? `${data.displayName || data.username} (@${data.username}) | PDX Pride Guide`
      : "Member Profile | PDX Pride Guide",
    (data?.bio || "PDX Pride Guide member profile.").replace(/\s+/g, " ").slice(0, 160),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShareOpen(false);
        setAccentOpen(false);
        setMsgOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const followMutation = useMutation({
    mutationFn: (next: boolean) =>
      apiRequest(next ? "POST" : "DELETE", `/api/users/${encodeURIComponent(username)}/follow`).then(r => r.json()),
    onSuccess: (result: { followers: number; isFollowing: boolean }) => {
      queryClient.setQueryData<PublicProfileData | undefined>(["/api/users", username], prev =>
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

  const patchMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      apiRequest("PUT", "/api/users/me", patch).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
    },
    onError: (err: unknown) =>
      toast({ title: parseApiError(err, "Could not save profile"), variant: "destructive" }),
  });

  const savePatch = useCallback(
    (patch: Record<string, unknown>, successTitle: string) => {
      patchMutation.mutate(patch, {
        onSuccess: () => toast({ title: successTitle }),
      });
    },
    [patchMutation, toast],
  );

  const handleFollow = () => {
    if (!authUser) {
      toast({ title: "Sign in to follow members" });
      return;
    }
    followMutation.mutate(!data?.isFollowing);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const openMessage = () => {
    if (!authUser) {
      toast({ title: "Sign in to send messages" });
      return;
    }
    setMsgText("");
    setMsgSent(false);
    setMsgOpen(true);
    setShareOpen(false);
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

  if (isLoading) {
    return (
      <div className="pp-page">
        <ProfileTopBar />
        <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BoardLoadingState label="Loading profile" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const notFound = error instanceof Error && error.message.startsWith("404");
    return (
      <div className="pp-page">
        <ProfileTopBar />
        <div className="pp-notfound">
          <p className="display pp-notfound__title">{notFound ? "MEMBER NOT FOUND" : "COULD NOT LOAD PROFILE"}</p>
          <p className="pp-notfound__copy">
            {notFound
              ? `No active member named @${username} on the Pride Guide.`
              : "The profile API is unavailable right now. Try again in a moment."}
          </p>
          <Link href="/" className="btn-neon solid">BACK HOME</Link>
        </div>
      </div>
    );
  }

  const isOwner = !!data.isOwner;

  return (
    <div className="pp-page" style={profileCssVars(accent)}>
      <ProfileTopBar />

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
        onFollow={handleFollow}
        onShareToggle={() => { setShareOpen(v => !v); setAccentOpen(false); }}
        onCopy={() => void handleCopy()}
        onMessage={openMessage}
        onAccentToggle={() => { setAccentOpen(v => !v); setShareOpen(false); }}
        onAccent={hex => savePatch({ accentColor: hex }, "Accent updated")}
        onBanner={path => savePatch({ profileBanner: path }, "Banner updated")}
      />

      {data.isPromoter && (
        <MarqueeBand
          marquee={marquee}
          isOwner={isOwner}
          isPromoter={!!data.isPromoter}
          onSave={next => savePatch({ marquee: next }, "Ticker updated")}
        />
      )}

      <ProfileStatStrip data={data} />
      <ProfileTabs active={tab} onChange={setTab} />

      <div className="pp-shell pp-panel">
        {tab === "events" && <EventsTab data={data} />}
        {tab === "media" && <MediaTab media={data.media || null} active={tab === "media"} />}
        {tab === "board" && <BoardTab posts={data.boardPosts || []} />}
        {tab === "about" && (
          <AboutTab data={data} isOwner={isOwner} onBook={openMessage} />
        )}
      </div>

      <ProfileFooter />

      {msgOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-msg-title">
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={() => setMsgOpen(false)} aria-label="Close">×</button>
            <h2 id="profile-msg-title" className="display">Send a message</h2>
            {msgSent ? (
              <p>Message sent. They will see it in their inbox.</p>
            ) : (
              <>
                <textarea
                  className="modal-textarea"
                  rows={5}
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder={`Say hi to @${data.username}`}
                />
                <button type="button" className="btn-neon solid" onClick={() => void sendMessage()} disabled={msgSending || !msgText.trim()}>
                  {msgSending ? "Sending…" : "Send"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}