import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { apiRequest } from "@/lib/queryClient";
import AfterzInvitations from "./AfterzInvitations";

export type AfterzCard = {
  id: string;
  title: string;
  eventTitle: string;
  venue: string;
  poster: string | null;
  vibe: string;
  glow: boolean;
  sexPositive: boolean;
  role: string;
  lat: number | null;
  lng: number | null;
};
export function useAfterzNights() {
  const { user } = useAuth();
  return useQuery<AfterzCard[]>({
    queryKey: ["/api/afterz/nights", user?.id],
    queryFn: () =>
      apiRequest("GET", "/api/afterz/nights").then((r) => r.json()),
    enabled: !!user,
    retry: false,
    refetchInterval: 60000,
  });
}
export default function NightDrawer() {
  const { user } = useAuth(),
    [auth, setAuth] = useState(false),
    [, navigate] = useLocation(),
    nights = useAfterzNights(),
    [status, setStatus] = useState("");
  return (
    <section className="afterz-drawer" aria-label="Afterz invitations">
      {user && !nights.data?.length && (
        <details>
          <summary>Discover event Afterz</summary>
          <p>Event-linked invitations are for adults.</p>
          <button
            type="button"
            onClick={async () => {
              try {
                await apiRequest("POST", "/api/afterz/discovery", {
                  confirmed18: true,
                });
                await nights.refetch();
                setStatus(
                  "If someone hosts Afterz for an upcoming event, their invitation appears here.",
                );
              } catch {
                setStatus("Could not load invitations. Try again.");
              }
            }}
          >
            I’m 18 or older · show invites
          </button>
          {status && <p role="status">{status}</p>}
        </details>
      )}
      <AfterzInvitations
        signIn={() => setAuth(true)}
        signingIn={auth && !user}
        drawer
      />
      {nights.isError && (
        <button type="button" onClick={() => void nights.refetch()}>
          Reload Afterz
        </button>
      )}
      {!!nights.data?.length && (
        <div className="afterz-rail">
          {nights.data.map((n) => (
            <button
              type="button"
              className="afterz-wide"
              key={n.id}
              data-vibe={n.sexPositive ? "sex-positive" : n.glow ? n.vibe : ""}
              style={
                n.poster
                  ? {
                      backgroundImage:
                        "linear-gradient(0deg,#050506,transparent),url(" +
                        JSON.stringify(n.poster) +
                        ")",
                    }
                  : undefined
              }
              onClick={() =>
                navigate("/events?gathering=" + encodeURIComponent(n.id))
              }
            >
              <small>
                {n.role === "host" ? "Hosting" : "Afterz"} · {n.eventTitle}
              </small>
              <strong>{n.title}</strong>
            </button>
          ))}
        </div>
      )}
      {auth && !user && <AuthModal onClose={() => setAuth(false)} />}
    </section>
  );
}
