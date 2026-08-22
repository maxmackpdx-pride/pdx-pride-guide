/**
 * Post to THE HAÜZ.
 *
 * One question, four answers. Posting has to take under a minute, so only the
 * headline is required and everything else can be filled in later.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { usePageSeo } from "@/hooks/usePageSeo";
import AuthModal from "@/components/AuthModal";
import { HOUSING_TYPES, type HousingType } from "@shared/housing";
import { HousingComposer } from "@/components/housing/HousingComposer";
import "./Housing.css";
import { shareCardUrl } from "@shared/shareCards";

type PmMe = {
  approved: boolean;
  manager?: { id: number; name: string; company?: string | null } | null;
};

export default function HousingNew() {
  usePageSeo("Post to THE HAÜZ", "Offer a room, look for housing, or start a household.", {
    image: shareCardUrl("housing"),
    imageAlt: "THE HAÜZ - housing board on Zaylist",
  });
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(true);

  const search = typeof window !== "undefined" ? window.location.search : "";
  const raw = new URLSearchParams(search).get("type")?.toUpperCase() || "";
  const initialType: HousingType | "PM" | null =
    raw === "PM" ? "PM" : HOUSING_TYPES.includes(raw as HousingType) ? (raw as HousingType) : null;

  // Drives whether the Managed Property tile opens the manager page or the
  // application. Verification is what switches a manager on, and it is free.
  const { data: pm } = useQuery<PmMe>({
    queryKey: ["/api/housing/pm/me"],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch("/api/housing/pm/me", { credentials: "include" });
      if (!res.ok) return { approved: false };
      return res.json();
    },
  });

  if (authLoading) {
    return (
      <div className="hz pdx-glass-rebind">
        <div className="hz-pad">
          <div className="hz-wrap">
            <div className="hz-panel hz-empty">Loading…</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="hz pdx-glass-rebind">
        <div className="hz-pad">
          <div className="hz-wrap">
            <div className="hz-panel hz-empty">Sign in to post to the board.</div>
          </div>
        </div>
        {showAuth ? <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" /> : null}
      </div>
    );
  }

  return (
    // The sheet is this page's only content, so it sizes to the viewport rather
    // than to `.hz`, which has no in-flow children here. See Housing.css.
    <div className="hz hz--sheetpage">
      <span className="hz-wash" aria-hidden="true" />
      <span className="hz-grain" aria-hidden="true" />
      <HousingComposer
        initialType={initialType}
        isPropertyManager={!!pm?.approved}
        managerName={pm?.manager?.company || pm?.manager?.name || null}
        onClose={() => navigate("/the-hauz")}
        onPosted={(postId) => {
          queryClient.invalidateQueries({ queryKey: ["/api/housing"] });
          navigate(`/the-hauz/${postId}`);
        }}
      />
    </div>
  );
}
