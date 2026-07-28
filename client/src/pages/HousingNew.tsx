/**
 * Post to HAÜSING.
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

type PmMe = {
  approved: boolean;
  manager?: { id: number; name: string; company?: string | null } | null;
};

export default function HousingNew() {
  usePageSeo("Post to HAÜSING", "Offer a room, look for housing, or start a household.");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(!user);

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

  if (!user) {
    return (
      <div className="hz">
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
    <div className="hz">
      <span className="hz-wash" aria-hidden="true" />
      <span className="hz-grain" aria-hidden="true" />
      <HousingComposer
        initialType={initialType}
        isPropertyManager={!!pm?.approved}
        managerName={pm?.manager?.company || pm?.manager?.name || null}
        onClose={() => navigate("/hausing")}
        onPosted={(postId) => {
          queryClient.invalidateQueries({ queryKey: ["/api/housing"] });
          navigate(`/hausing/${postId}`);
        }}
      />
    </div>
  );
}
