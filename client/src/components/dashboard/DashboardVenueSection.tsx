import type { CSSProperties } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "@/components/ImageUploader";
import DashboardDrawer, { DashboardItemRow } from "./DashboardDrawer";
import "./DashboardVenueSection.css";

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

  const cardStyle = { "--c": CYAN } as CSSProperties;

  return (
    <div className="dvs-work-card" style={cardStyle}>
      <span className="dvs-work-card__seam pdx-refract-seam" aria-hidden="true" />
      <span className="dvs-work-card__sheen" aria-hidden="true" />

      <div className="dvs-work-card__head">
        <div className="dvs-work-card__copy">
          <div className="dash-item-title">{business.name}</div>
          <div className="dash-item-meta">{business.address || "No address on file"}</div>
        </div>
        <button
          type="button"
          className={`dvs-glass-btn${expanded ? " dvs-glass-btn--outline" : ""}`}
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? "Hide details" : "Manage venue"}
        </button>
      </div>

      {expanded && (
        <div className="dvs-work-card__body">
          <div>
            <p className="dvs-section-label">Upcoming events at this venue</p>
            {upcomingEvents.length === 0 ? (
              <p className="dvs-empty">No upcoming events matched to this venue yet.</p>
            ) : (
              upcomingEvents.map(evt => (
                <div key={evt.id} className="dvs-project-row">
                  <span className="dvs-project-row__seam pdx-refract-seam" aria-hidden="true" />
                  <span className="dvs-project-row__sheen" aria-hidden="true" />
                  <div className="dvs-project-row__inner">
                    <DashboardItemRow color={CYAN} title={evt.title} meta={evt.dayOfWeek || ""} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            <p className="dvs-section-label">Promoters at this venue</p>
            {promotersLoading ? (
              <p className="dvs-empty">Loading…</p>
            ) : promoters.length === 0 ? (
              <p className="dvs-empty">No promoters linked to this venue yet.</p>
            ) : (
              promoters.map(p => (
                <div key={p.id} className="dvs-project-row">
                  <span className="dvs-project-row__seam pdx-refract-seam" aria-hidden="true" />
                  <span className="dvs-project-row__sheen" aria-hidden="true" />
                  <div className="dvs-project-row__inner">
                    <DashboardItemRow
                      color={CYAN}
                      title={p.displayName || p.username}
                      meta={`@${p.username}`}
                      actions={
                        <button
                          type="button"
                          className="dvs-glass-btn dvs-glass-btn--danger"
                          disabled={blockMutation.isPending}
                          onClick={() => {
                            const ok = window.confirm(
                              `Block @${p.username} from posting events at ${business.name}? Their existing events here will be flagged for admin review.`,
                            );
                            if (ok) blockMutation.mutate(p.id);
                          }}
                        >
                          Block
                        </button>
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            <p className="dvs-section-label">Logo</p>
            <p className="dvs-section-note">
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
                className="dvs-glass-btn"
                style={{ marginTop: 8 }}
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
