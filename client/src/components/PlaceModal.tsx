import type React from "react";
import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ds";
import { eventPath } from "@shared/eventSlug";
import {
  TYPE_LABELS,
  TYPE_TO_DS_CATEGORY,
  formatDirectoryEventWhen,
  type Business,
} from "@/pages/Directory";
import {
  directoryFallbackLogo,
  resolveDirectoryLogo,
} from "@/lib/directoryLogos";

type EditableFields = {
  description: string;
  hours: string;
  phone: string;
  website: string;
  instagram: string;
  donateUrl: string;
};

function toEditableFields(place: Business): EditableFields {
  return {
    description: place.description || "",
    hours: place.hours || "",
    phone: place.phone || "",
    website: place.website || "",
    instagram: place.instagram || "",
    donateUrl: place.donateUrl || "",
  };
}

/* Detail modal for a directory business — same fixed-overlay flex-center
   idiom as the Schedule embed popover / AuthModal / MissedConnectionsPanel:
   click the overlay to close, stopPropagation on the panel. Roomier version
   of PlaceCard's content (name, category, address/hours/phone, description,
   links, upcoming Pride events). */

const DAY_COLOR: Record<string, string> = {
  THU: "var(--cyan)",
  FRI: "var(--pink)",
  SAT: "var(--green)",
  SUN: "var(--orange)",
};

function Icon({ d }: { d: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="15"
      height="15"
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}
const PIN = (
  <>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </>
);
const CLOCK = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);
const PHONE = (
  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
);
const GLOBE = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
  </>
);
const IG = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </>
);
const CAL = (
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>
);

const BLANK_FIELDS: EditableFields = {
  description: "", hours: "", phone: "", website: "", instagram: "", donateUrl: "",
};

export default function PlaceModal({
  place,
  onClose,
}: {
  place: Business | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableFields>(BLANK_FIELDS);
  const [savedOverrides, setSavedOverrides] = useState<Partial<EditableFields> | null>(null);

  const saveMutation = useMutation({
    mutationFn: (fields: EditableFields) => {
      if (!place) throw new Error("No venue selected");
      return apiRequest("PATCH", `/api/directory/${place.id}`, fields).then(r => r.json());
    },
    onSuccess: (updated: Partial<Business>) => {
      setSavedOverrides({
        description: updated.description ?? "",
        hours: updated.hours ?? "",
        phone: updated.phone ?? "",
        website: updated.website ?? "",
        instagram: updated.instagram ?? "",
        donateUrl: updated.donateUrl ?? "",
      });
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/directory"] });
      toast({ title: "Venue updated", description: "Changes are live on the directory." });
    },
    onError: (err: unknown) => {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : "Something went wrong — try again.",
        variant: "destructive",
      });
    },
  });

  if (!place) return null;

  const category = TYPE_TO_DS_CATEGORY[place.type] || "venues";
  const categoryLabel = TYPE_LABELS[place.type] || place.type;
  const address = [place.address, place.neighborhood].filter(Boolean).join(" · ") || undefined;
  const upcomingEvents = place.upcomingEvents ?? [];
  const canEditVenue = Boolean(place.canEditVenue);
  const displayed = { ...toEditableFields(place), ...savedOverrides };
  const isNonprofit = place.type === "nonprofit";
  const accent = isNonprofit
    ? "var(--cyan)"
    : ({
        bars: "var(--pink)",
        food: "var(--orange)",
        cafes: "var(--green)",
        venues: "var(--cyan)",
        services: "var(--purple)",
        shops: "var(--amber)",
        hotels: "var(--blue)",
      } as Record<string, string>)[category] || "var(--pink)";
  const edge = isNonprofit
    ? "linear-gradient(120deg,#FF2400,#FF9500,#FFEE00,#39FF14,#00FFFF,#3A6BFF,#8800FF,#FF00CC)"
    : `linear-gradient(${accent},${accent})`;
  const logoUrl = resolveDirectoryLogo(place.name, place.imageUrl);
  const fallbackLogoUrl = directoryFallbackLogo(place.type);

  const startEditing = () => {
    setForm(displayed);
    setEditing(true);
  };
  const cancelEditing = () => setEditing(false);
  const saveEdits = () => saveMutation.mutate(form);
  const fieldStyle: React.CSSProperties = {
    width: "100%", background: "#141416", color: "#fff", border: "1px solid #333",
    borderRadius: 6, padding: "8px 10px", fontFamily: "var(--font-body)", fontSize: "0.9rem",
    marginTop: 4, marginBottom: 12,
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-display)", fontSize: "0.7rem", letterSpacing: "0.06em",
    textTransform: "uppercase", color: "var(--text-lo)",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,.82)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 560,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 12,
          background: "linear-gradient(#0b0b0e,#0b0b0e) padding-box, " + edge + " border-box",
          border: "2px solid transparent",
          boxShadow: `0 30px 70px -18px rgba(0,0,0,.9), 0 0 42px -6px color-mix(in srgb, ${accent} 55%, transparent)`,
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 4,
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,.55)",
            color: "#fff",
            fontSize: 16,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <div
            style={{
              position: "relative",
              height: 172,
              display: "grid",
              placeItems: "center",
              padding: 22,
              background: `radial-gradient(125% 130% at 50% 0%, color-mix(in srgb, ${accent} 17%, #060608), #060608 72%)`,
              borderBottom: `1px solid color-mix(in srgb, ${accent} 26%, transparent)`,
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: "repeating-linear-gradient(0deg,transparent 0 3px,rgba(0,0,0,.16) 3px 4px)",
                opacity: 0.5,
                pointerEvents: "none",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 3,
                background: "var(--grad-flag, linear-gradient(90deg,#FF2400,#FF9500,#FFEE00,#39FF14,#00FFFF,#3A6BFF,#8800FF,#FF00CC))",
              }}
            />
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${place.name} logo`}
                loading="lazy"
                style={{
                  position: "relative",
                  maxWidth: "78%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  filter: `drop-shadow(0 0 14px color-mix(in srgb, ${accent} 50%, transparent))`,
                }}
              />
            ) : (
              <img
                src={fallbackLogoUrl}
                alt={categoryLabel}
                loading="lazy"
                style={{
                  position: "relative",
                  maxWidth: "40%",
                  maxHeight: "82%",
                  objectFit: "contain",
                  filter: `drop-shadow(0 0 16px color-mix(in srgb, ${accent} 55%, transparent))`,
                }}
              />
            )}
          </div>

          <div style={{ padding: "22px 24px 26px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center", marginBottom: 10 }}>
            {place.isNew && (
              <Badge color="yellow" glow size="sm" admission={undefined} day={undefined} category={undefined}>
                Grand Opening
              </Badge>
            )}
            <Badge
              category={isNonprofit ? undefined : category}
              color={isNonprofit ? "paper" : undefined}
              size="md"
              admission={undefined}
              day={undefined}
            >
              {categoryLabel}
            </Badge>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: "1.9rem",
              lineHeight: 1.02,
              color: "#fff",
              margin: "0 0 14px",
            }}
          >
            {place.name}
          </h2>

          {address && (
            <div style={{ ...rowStyle, marginBottom: 14 }}>
              <Icon d={PIN} />
              {address}
            </div>
          )}

          {editing ? (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                Description
                <textarea
                  style={{ ...fieldStyle, resize: "vertical" }}
                  rows={4}
                  maxLength={2000}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label style={labelStyle}>
                Hours
                <input
                  style={fieldStyle}
                  value={form.hours}
                  placeholder="e.g. Mon–Sat 4pm–2am"
                  onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                />
              </label>
              <label style={labelStyle}>
                Phone
                <input
                  style={fieldStyle}
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </label>
              <label style={labelStyle}>
                Website
                <input
                  style={fieldStyle}
                  type="url"
                  placeholder="https://..."
                  value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                />
              </label>
              <label style={labelStyle}>
                Instagram
                <input
                  style={fieldStyle}
                  placeholder="@handle"
                  value={form.instagram}
                  onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                />
              </label>
              <label style={labelStyle}>
                Donate link
                <input
                  style={{ ...fieldStyle, marginBottom: 4 }}
                  type="url"
                  placeholder="https://..."
                  value={form.donateUrl}
                  onChange={e => setForm(f => ({ ...f, donateUrl: e.target.value }))}
                />
              </label>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-neon solid"
                  disabled={saveMutation.isPending}
                  onClick={saveEdits}
                >
                  {saveMutation.isPending ? "Saving…" : "Save changes"}
                </button>
                <button type="button" className="btn-neon" onClick={cancelEditing}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                {displayed.hours && (
                  <div style={rowStyle}>
                    <Icon d={CLOCK} />
                    {displayed.hours}
                  </div>
                )}
                {displayed.phone && (
                  <div style={rowStyle}>
                    <Icon d={PHONE} />
                    {displayed.phone}
                  </div>
                )}
              </div>

              {displayed.description && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    color: "var(--text-mid)",
                    margin: "0 0 16px",
                  }}
                >
                  {displayed.description}
                </p>
              )}

              {(displayed.website || displayed.instagram || displayed.donateUrl) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 16 }}>
                  {displayed.donateUrl && (
                    <a href={displayed.donateUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                      <Icon d={GLOBE} />
                      Donate
                    </a>
                  )}
                  {displayed.website && (
                    <a href={displayed.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                      <Icon d={GLOBE} />
                      Website
                    </a>
                  )}
                  {displayed.instagram && (
                    <a
                      href={
                        displayed.instagram.startsWith("http")
                          ? displayed.instagram
                          : `https://instagram.com/${displayed.instagram.replace(/^@/, "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                    >
                      <Icon d={IG} />
                      {displayed.instagram}
                    </a>
                  )}
                </div>
              )}

              {canEditVenue && (
                <button type="button" className="btn-neon" style={{ marginBottom: 16 }} onClick={startEditing}>
                  Edit venue info
                </button>
              )}
            </>
          )}

          {upcomingEvents.length > 0 && (
            <div style={{ marginTop: 6, paddingTop: 16, borderTop: "1px solid #292929" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text-mid)",
                }}
              >
                <Icon d={CAL} />
                Upcoming Pride Events
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {upcomingEvents.map((ev) => {
                  const dayAccent = (ev.dayOfWeek && DAY_COLOR[ev.dayOfWeek]) || "var(--cyan)";
                  return (
                    <Link
                      key={ev.listingInstanceKey ?? ev.id}
                      href={eventPath(ev.id, ev.title, ev.dayOfWeek)}
                      onClick={onClose}
                      style={{
                        padding: "8px 0 8px 12px",
                        borderLeft: `3px solid ${dayAccent}`,
                        textDecoration: "none",
                        color: "inherit",
                        display: "block",
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.85rem", color: dayAccent }}>
                        {formatDirectoryEventWhen(ev)}
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#fff" }}>
                        {ev.title}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  fontFamily: "var(--font-body)",
  fontSize: "0.9rem",
  color: "var(--text-lo)",
};
const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "var(--font-body)",
  fontWeight: 700,
  fontSize: "0.9rem",
  color: "var(--_c, var(--pink))",
  textDecoration: "none",
};
