import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "@/components/ImageUploader";
import DashboardDrawer, { DashboardItemRow } from "./DashboardDrawer";

const CYAN = "#19E3FF";

type OwnedBusiness = {
  id: number;
  name: string;
  address: string | null;
  imageUrl: string | null;
};

type DirectoryEventSummary = {
  id: number;
  title: string;
  dayOfWeek: string | null;
  dateStart: string;
};

type DirectoryBusiness = OwnedBusiness & { upcomingEvents?: DirectoryEventSummary[] };

type Promoter = { id: number; username: string; displayName: string | null };

function VenueOwnerCard({ business, upcomingEvents }: { business: OwnedBusiness; upcomingEvents: DirectoryEventSummary[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [logoCandidate, setLogoCandidate] = useState("");

  const { data: promoters = [], isLoading: promotersLoading } = useQuery<Promoter[]>({
    queryKey: [`/api/directory/${business.id}/promoters`],
    queryFn: () => apiRequest("GET", `/api/directory/${business.id}/promoters`).then(r => r.json()),
    enabled: expanded,
  });

  const blockMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", `/api/directory/${business.id}/block`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/directory/${business.id}/promoters`] });
      toast({ title: "Promoter blocked", description: "Their existing events here were flagged for admin review." });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const logoRequestMutation = useMutation({
    mutationFn: (imageUrl: string) => apiRequest("POST", `/api/directory/${business.id}/logo-request`, { imageUrl }),
    onSuccess: () => {
      setLogoCandidate("");
      toast({ title: "Logo submitted", description: "Sent to the site admin for conversion. Your current logo stays live until it's approved." });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <div style={{ border: "1px solid var(--dash-border, #262626)", borderRadius: 8, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="dash-item-title">{business.name}</div>
          <div className="dash-item-meta">{business.address || "No address on file"}</div>
        </div>
        <button type="button" className="dash-mini-btn" style={{ color: CYAN }} onClick={() => setExpanded(v => !v)}>
          {expanded ? "Hide details" : "Manage venue"}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <p className="dash-mono" style={{ fontSize: 11, color: "var(--dash-muted)", marginBottom: 8 }}>UPCOMING EVENTS AT THIS VENUE</p>
            {upcomingEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--dash-muted)" }}>No upcoming events matched to this venue yet.</p>
            ) : (
              upcomingEvents.map(evt => (
                <DashboardItemRow key={evt.id} color={CYAN} title={evt.title} meta={evt.dayOfWeek || ""} />
              ))
            )}
          </div>

          <div>
            <p className="dash-mono" style={{ fontSize: 11, color: "var(--dash-muted)", marginBottom: 8 }}>PROMOTERS AT THIS VENUE</p>
            {promotersLoading ? (
              <p style={{ fontSize: 13, color: "var(--dash-muted)" }}>Loading…</p>
            ) : promoters.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--dash-muted)" }}>No promoters linked to this venue yet.</p>
            ) : (
              promoters.map(p => (
                <DashboardItemRow
                  key={p.id}
                  color={CYAN}
                  title={p.displayName || p.username}
                  meta={`@${p.username}`}
                  actions={
                    <button
                      type="button"
                      className="dash-mini-btn"
                      style={{ color: "#FF2400" }}
                      disabled={blockMutation.isPending}
                      onClick={() => {
                        const ok = window.confirm(`Block @${p.username} from posting events at ${business.name}? Their existing events here will be flagged for admin review.`);
                        if (ok) blockMutation.mutate(p.id);
                      }}
                    >
                      Block
                    </button>
                  }
                />
              ))
            )}
          </div>

          <div>
            <p className="dash-mono" style={{ fontSize: 11, color: "var(--dash-muted)", marginBottom: 8 }}>LOGO</p>
            <p style={{ fontSize: 12, color: "var(--dash-muted)", marginBottom: 8 }}>
              Logo changes go to the site admin for conversion before going live. Your current logo stays up until then.
            </p>
            <ImageUploader
              endpoint="/api/upload/business-logo"
              fieldName="logo"
              currentUrl={business.imageUrl || undefined}
              onUploaded={url => setLogoCandidate(url)}
              label="Upload new logo"
            />
            {logoCandidate && (
              <button
                type="button"
                className="dash-mini-btn"
                style={{ color: CYAN, marginTop: 8 }}
                disabled={logoRequestMutation.isPending}
                onClick={() => logoRequestMutation.mutate(logoCandidate)}
              >
                {logoRequestMutation.isPending ? "Sending…" : "Send to admin for conversion"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardVenueSection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { data: owned = [] } = useQuery<OwnedBusiness[]>({
    queryKey: ["/api/directory/mine/owned"],
    queryFn: () => apiRequest("GET", "/api/directory/mine/owned").then(r => r.json()),
  });

  const { data: directory = [] } = useQuery<DirectoryBusiness[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    enabled: owned.length > 0,
    staleTime: 60_000,
  });

  if (owned.length === 0) return null;

  return (
    <DashboardDrawer
      title="My venues"
      id="venues"
      color={CYAN}
      countLabel={`${owned.length} owned`}
      open={open}
      onToggle={onToggle}
    >
      {owned.map(business => (
        <VenueOwnerCard
          key={business.id}
          business={business}
          upcomingEvents={directory.find(b => b.id === business.id)?.upcomingEvents || []}
        />
      ))}
    </DashboardDrawer>
  );
}
