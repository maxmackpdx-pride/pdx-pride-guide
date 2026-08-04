/**
 * A single THE HAÜZ post.
 *
 * Detail view for all four types, plus the consent-based first contact. Asking
 * to chat and asking to join a HAÜS are the same gesture, and nothing opens
 * until the other side accepts.
 *
 * Spec: docs/HAUS_HOUSING_SPEC_v0.2.md
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useInboxSheet } from "@/context/InboxSheetContext";
import AuthModal from "@/components/AuthModal";
import {
  HOUSING_REPORT_REASONS,
  HOUSING_REPORT_REASON_LABEL,
  type HousingPostView,
  type HousingRequestKind,
} from "@shared/housing";
import { HousingDetail, type HousingDetailHandlers } from "@/components/housing/HousingDetail";
import { HousingWorkspace } from "@/components/housing/HousingWorkspace";
import { Chip, Mono } from "@/components/housing/HousingPrimitives";
import "./Housing.css";
import { shareCardUrl } from "@shared/shareCards";

export default function HousingPost() {
  const [, params] = useRoute("/the-hauz/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { openSheet } = useInboxSheet();
  const [showAuth, setShowAuth] = useState(false);
  const [reporting, setReporting] = useState(false);

  const postId = Number(params?.id);

  const { data: post, isLoading, isError } = useQuery<HousingPostView>({
    queryKey: ["/api/housing", postId],
    enabled: Number.isFinite(postId),
    queryFn: async () => {
      const res = await fetch(`/api/housing/${postId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  usePageSeo(
    post ? `${post.displayName || post.author.displayName} · THE HAÜZ` : "THE HAÜZ",
    post?.headline || "Rooms, roommates, and households in queer Portland.",
    { image: shareCardUrl("housing"), imageAlt: "THE HAÜZ - housing board on Zaylist" },
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/housing", postId] });
    queryClient.invalidateQueries({ queryKey: ["/api/housing"] });
  };

  const requireAuth = (): boolean => {
    if (user) return true;
    setShowAuth(true);
    return false;
  };

  const requestMutation = useMutation({
    mutationFn: async (kind: HousingRequestKind) => {
      const res = await fetch(`/api/housing/${postId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ kind }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Could not send that");
      return res.json();
    },
    onSuccess: (data) => {
      invalidate();
      if (data?.alreadySent) {
        toast({ title: "Already sent", description: "They have this one already." });
        return;
      }
      const kind = data?.request?.kind;
      toast({
        title: kind === "WAITLIST" ? "You are on the waiting list" : "Asked",
        description:
          kind === "WAITLIST"
            ? "The Lead hears about it if a spot opens."
            : "They accept before the chat opens.",
      });
    },
    onError: (e: Error) => toast({ title: "Did not send", description: e.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/housing/${postId}/save`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Could not save");
      return res.json();
    },
    onSuccess: invalidate,
  });

  const convertMutation = useMutation({
    mutationFn: async (to: "LOOKING" | "FORMING") => {
      const res = await fetch(`/api/housing/${postId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Could not convert");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Converted", description: "Same post, same replies. You are the Lead." });
    },
  });

  const buildMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/housing/${postId}/build-haus`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error((await res.json())?.error || "Could not start it");
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.alreadyLeading) {
        toast({ title: "You already lead one here" });
      } else {
        toast({ title: "HAÜS started", description: "Nothing is reserved. The listing stays live." });
      }
      navigate(`/the-hauz/${data.postId}`);
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/housing/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Could not report");
      return res.json();
    },
    onSuccess: () => {
      setReporting(false);
      toast({ title: "Reported", description: "An admin will take a look." });
    },
  });

  // Deep links from the board carry the intent, so the action fires on arrival.
  const search = typeof window !== "undefined" ? window.location.search : "";
  useEffect(() => {
    if (!post || !user) return;
    const q = new URLSearchParams(search);
    if (q.get("chat") === "1") requestMutation.mutate("CHAT");
    else if (q.get("join") === "1") requestMutation.mutate("JOIN");
    else if (q.get("waitlist") === "1") requestMutation.mutate("WAITLIST");
    else if (q.get("build") === "1") buildMutation.mutate();
    if (q.toString()) window.history.replaceState({}, "", `/the-hauz/${postId}`);
    // Intentionally runs once per post load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id, user?.id]);

  // Saved-post "what changed" chip: mark seen ~400ms after open so a quick
  // bounce does not clear it, then drop local chip state without a full refetch.
  useEffect(() => {
    if (!post || !user || !post.saved) return;
    const t = window.setTimeout(() => {
      fetch(`/api/housing/${postId}/seen`, { method: "POST", credentials: "include" })
        .then((res) => {
          if (!res.ok) return;
          queryClient.setQueryData<HousingPostView>(["/api/housing", postId], (old) =>
            old ? { ...old, lastChangeLabel: null } : old,
          );
          queryClient.setQueriesData<{ posts?: HousingPostView[] }>(
            { queryKey: ["/api/housing"] },
            (old) => {
              if (!old || !Array.isArray(old.posts)) return old;
              return {
                ...old,
                posts: old.posts.map((p) =>
                  p.id === postId ? { ...p, lastChangeLabel: null } : p,
                ),
              };
            },
          );
        })
        .catch(() => undefined);
    }, 400);
    return () => window.clearTimeout(t);
  }, [post?.id, post?.saved, user?.id, postId]);

  if (isLoading) {
    return (
      <div className="hz">
        <div className="hz-pad">
          <div className="hz-wrap">
            <div className="hz-panel hz-empty">Loading.</div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="hz">
        <div className="hz-pad">
          <div className="hz-wrap">
            <div className="hz-panel hz-empty">
              That post is not on the board.
              <div style={{ marginTop: 12 }}>
                <Chip onClick={() => navigate("/the-hauz")}>Back to THE HAÜZ</Chip>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = !!user && user.id === post.author.userId;

  const handlers: HousingDetailHandlers = {
    onBack: () => navigate("/the-hauz"),
    onRequest: (kind) => {
      if (!requireAuth()) return;
      if (post.myRequest?.status === "ACCEPTED") {
        openSheet({ view: "inbox" });
        return;
      }
      requestMutation.mutate(kind);
    },
    onSave: () => {
      if (!requireAuth()) return;
      saveMutation.mutate();
    },
    onShare: () => {
      const url = `${window.location.origin}/the-hauz/${post.id}`;
      if (navigator.share) {
        navigator.share({ title: post.displayName || post.headline, url }).catch(() => undefined);
        return;
      }
      navigator.clipboard?.writeText(url);
      toast({ title: "Listing link copied" });
    },
    onReport: () => {
      if (!requireAuth()) return;
      setReporting(true);
    },
    onConvert: () => {
      if (!requireAuth()) return;
      convertMutation.mutate(post.type === "LOOKING" ? "FORMING" : "LOOKING");
    },
    onBuildHaus: () => {
      if (!requireAuth()) return;
      buildMutation.mutate();
    },
    onOpenPost: (id) => navigate(`/the-hauz/${id}`),
  };

  return (
    <div className="hz">
      <span className="hz-wash" aria-hidden="true" />
      <span className="hz-grain" aria-hidden="true" />

      <HousingDetail
        post={post}
        h={handlers}
        isOwner={isOwner}
        workspace={
          post.type === "FORMING" ? (
            <HousingWorkspace post={post} onOpenThread={() => openSheet({ view: "inbox" })} />
          ) : undefined
        }
      />

      {reporting ? (
        <div className="hz-sheetwrap" onClick={() => setReporting(false)}>
          <div className="hz-sheet pdx-glass-rebind" onClick={(e) => e.stopPropagation()}>
            <div className="hz-sheet__head">
              <Mono accent>Report this post</Mono>
              <button className="hz-x" onClick={() => setReporting(false)} aria-label="Close">
                ×
              </button>
            </div>
            <p className="hz-prose">What is wrong with it? An admin sees this, and the poster does not.</p>
            <div className="hz-chiprow" style={{ marginTop: 14 }}>
              {HOUSING_REPORT_REASONS.map((r) => (
                <Chip key={r} onClick={() => reportMutation.mutate(r)}>
                  {HOUSING_REPORT_REASON_LABEL[r]}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showAuth ? <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" /> : null}
    </div>
  );
}
