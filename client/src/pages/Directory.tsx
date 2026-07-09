import type React from "react";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import AuthModal from "@/components/AuthModal";
import ScrollReveal from "@/components/ScrollReveal";
import BoardLoadingState from "@/components/BoardLoadingState";
import { MapPin, Plus, X } from "lucide-react";
import { eventPath } from "@shared/eventSlug";
import { FilterChip, PlaceCard, SearchInput } from "@/components/ds";
import { parsePacificDateTime } from "@shared/missedConnections";

import { lazyWithReload } from "@/lib/lazyWithReload";
import { dayAccentToken } from "@/lib/dsColors";
import PlaceModal from "@/components/PlaceModal";

const DirectoryMap = lazyWithReload(() => import("@/components/DirectoryMap"));

export type DirectoryEventSummary = {
  id: number;
  title: string;
  dateStart: string;
  dateEnd: string;
  dayOfWeek: string | null;
  listingInstanceKey?: string;
};

export type Business = {
  id: number;
  name: string;
  type: string;
  description: string;
  address: string | null;
  neighborhood: string | null;
  website: string | null;
  instagram: string | null;
  donateUrl: string | null;
  hours: string | null;
  phone: string | null;
  queerOwned: boolean;
  queerFriendly: boolean;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
  isNew: boolean;
  upcomingEvents?: DirectoryEventSummary[];
  canEditVenue?: boolean;
};

export const TYPE_LABELS: Record<string, string> = {
  bar: "Bars & Clubs",
  restaurant: "Restaurants",
  cafe: "Cafes",
  venue: "Venues",
  service: "Services",
  shop: "Shops",
  hotel: "Hotels",
  nonprofit: "Nonprofits",
};

const TYPE_COLORS: Record<string, string> = {
  bar: "#FF00CC",
  restaurant: "#FF6600",
  cafe: "#39FF14",
  venue: "#19E3FF",
  service: "#A855F7",
  shop: "#FFD700",
  hotel: "#FF1FA0",
  nonprofit: "#FFFFFF",
};

const NEIGHBORHOODS = [
  "ALL", "Downtown", "SE", "NE", "N", "NW", "SW", "Pearl", "Alberta", "Hawthorne",
  "Belmont", "Division", "Mississippi", "Alberta Arts District",
];

const FORM_NEIGHBORHOODS = NEIGHBORHOODS.filter(n => n !== "ALL");

const blankDirectoryForm = () => ({
  name: "",
  type: "bar",
  description: "",
  address: "",
  neighborhood: "SE",
  website: "",
  instagram: "",
  hours: "",
  phone: "",
  queerOwned: false,
  queerFriendly: true,
});

export default function Directory() {
  usePageSeo(
    "Queer Portland Directory — PDX Pride Guide",
    "Queer-owned and queer-friendly bars, restaurants, cafes, venues, and services in Portland.",
  );

  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [formOpen, setFormOpen] = useState(() => new URLSearchParams(window.location.search).get("add") === "1");
  const [form, setForm] = useState(blankDirectoryForm);
  const [activeType, setActiveType] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("type");
    return t && t in TYPE_LABELS ? t : "ALL";
  });
  const [activeNeighborhood, setActiveNeighborhood] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Business | null>(null);

  const { data: businesses = [], isLoading, isError } = useQuery<Business[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return businesses
      .filter(b => {
        if (activeType !== "ALL" && b.type !== activeType) return false;
        if (activeNeighborhood !== "ALL" && b.neighborhood !== activeNeighborhood) return false;
        if (q) {
          const haystack = `${b.name} ${b.description || ""}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }, [businesses, activeType, activeNeighborhood, searchQuery]);

  const neighborhoodsInUse = useMemo(() => {
    const seen = new Set(businesses.map(b => b.neighborhood).filter(Boolean));
    return NEIGHBORHOODS.filter(n => n === "ALL" || seen.has(n));
  }, [businesses]);

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/directory", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/directory"] });
      toast({ title: "Added to directory", description: "Your place is live on the map and listings." });
      setForm(blankDirectoryForm());
      setFormOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Could not add place", description: err.message, variant: "destructive" });
    },
  });

  const openAddForm = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setFormOpen(true);
    window.setTimeout(() => document.getElementById("directory-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  };

  useEffect(() => {
    if (!formOpen) return;
    window.setTimeout(() => document.getElementById("directory-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [formOpen]);

  const submitDirectoryForm = () => {
    if (!form.name.trim()) {
      toast({ title: "Add a name", variant: "destructive" });
      return;
    }
    if (!form.description.trim()) {
      toast({ title: "Add a description", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="zine-page directory-page board-page">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
      <PageHeader
        section="Portland"
        title="Queer Directory"
        titleAccent="magenta"
        kicker="Queer-owned · Queer-friendly · Community-rooted"
        lede="Bars, restaurants, cafes, shops, and services that make up Portland's LGBTQ+ community. Show up, spend money, keep them alive."
        actions={
          <button type="button" className="btn-neon magenta" onClick={openAddForm}>
            <Plus size={16} /> Add a place
          </button>
        }
      />

      {formOpen && (
        <ScrollReveal>
          <section id="directory-form" className="gifting-form-panel directory-form-panel">
            <button type="button" className="gifting-close" onClick={() => setFormOpen(false)} aria-label="Close form">
              <X size={18} />
            </button>
            <h2 className="display section-heading">Add to the directory</h2>
            <p className="board-copy-sm">Logged-in members can list queer-owned and queer-friendly spots. Goes live immediately — keep it accurate and community-rooted.</p>
            <div className="gifting-form-grid">
              <label className="span">
                Place name *
                <input className="board-text-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={120} />
              </label>
              <label>
                Type *
                <select className="board-text-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                Neighborhood
                <select className="board-text-field" value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}>
                  {FORM_NEIGHBORHOODS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="span">
                Description *
                <textarea className="board-text-field" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} maxLength={2000} />
              </label>
              <label className="span">
                Address
                <input className="board-text-field" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address helps us pin it on the map" />
              </label>
              <label>
                Hours
                <input className="board-text-field" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="e.g. Mon–Sat 4pm–2am" />
              </label>
              <label>
                Phone
                <input className="board-text-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </label>
              <label>
                Website
                <input className="board-text-field" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} type="url" placeholder="https://..." />
              </label>
              <label>
                Instagram
                <input className="board-text-field" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@handle" />
              </label>
              <label className="span directory-form-checks">
                <label className="gifting-rules">
                  <input type="checkbox" checked={form.queerOwned} onChange={e => setForm(f => ({ ...f, queerOwned: e.target.checked }))} />
                  Queer-owned
                </label>
                <label className="gifting-rules">
                  <input type="checkbox" checked={form.queerFriendly} onChange={e => setForm(f => ({ ...f, queerFriendly: e.target.checked }))} />
                  Queer-friendly
                </label>
              </label>
            </div>
            <button type="button" className="btn-neon solid" disabled={createMutation.isPending} onClick={submitDirectoryForm}>
              {createMutation.isPending ? "Adding…" : "Add to directory →"}
            </button>
          </section>
        </ScrollReveal>
      )}

      {/* Map */}
      {!isLoading && (
        <Suspense fallback={<div style={{ height: 380, background: "#0a0a0a" }} />}>
          <DirectoryMap businesses={filtered} />
        </Suspense>
      )}

      {/* Filter bar */}
      <div className="zine-filter-bar" style={{
        background: "#000", borderBottom: "1px solid #1a1a1a",
        position: "sticky", top: "var(--site-header-height)", zIndex: 50,
      }}>
        <div className="events-filter-row" style={{ flexWrap: "wrap", rowGap: 8 }}>
          <FilterChip
            selected={activeType === "ALL"}
            fill={activeType === "ALL"}
            accent={dayAccentToken("ALL")}
            onToggle={() => setActiveType("ALL")}
          >
            ALL
          </FilterChip>
          {Object.entries(TYPE_LABELS).map(([key, label]) => {
            const selected = activeType === key;
            return (
              <FilterChip
                key={key}
                selected={selected}
                fill={selected}
                accent={TYPE_COLORS[key]}
                onToggle={() => setActiveType(key)}
              >
                {label}
              </FilterChip>
            );
          })}
          <div style={{ flex: 1, minWidth: 12 }} />
          <div className="events-filter-search">
            <SearchInput
              id="directory-search"
              label={undefined}
              placeholder="Search the directory..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
              data-testid="directory-search"
              size="sm"
            />
          </div>
        </div>

        <div className="events-filter-row" style={{ paddingTop: 6, paddingBottom: 10, overflowX: "auto" }}>
          {neighborhoodsInUse.map(n => {
            const selected = activeNeighborhood === n;
            return (
              <FilterChip
                key={n}
                selected={selected}
                fill={selected}
                accent={n === "ALL" ? dayAccentToken("ALL") : "lime"}
                onToggle={() => setActiveNeighborhood(n)}
                style={{ fontSize: "0.7rem" }}
              >
                {n}
              </FilterChip>
            );
          })}
        </div>
      </div>

      <div className="zine-content" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        <ScrollReveal>
          <div className="events-count-row">
            <div className="events-count-banner">
              <MapPin size={13} />
              <span>
                {isLoading ? "Loading…" : `${filtered.length} place${filtered.length === 1 ? "" : "s"}`}
              </span>
            </div>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <BoardLoadingState label="Loading directory" />
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>Could not load directory.</div>
        ) : filtered.length === 0 ? (
          <div className="board-empty board-empty--prototype">
            <p className="display section-heading">Nothing here yet</p>
            <p className="board-copy-sm">
              {businesses.length === 0
                ? "The directory is being built — add your queer-owned or queer-friendly spot."
                : "No places match your filters."}
            </p>
            <button type="button" className="btn-neon magenta" onClick={openAddForm} style={{ marginTop: 16 }}>
              <Plus size={16} /> Add a business
            </button>
          </div>
        ) : (
          <div className="directory-grid">
            {filtered.map((biz, i) => (
              <ScrollReveal key={biz.id} delay={Math.min(i * 40, 300)}>
                <DirectoryCard biz={biz} onClick={() => setSelectedPlace(biz)} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>

      {selectedPlace && (
        <PlaceModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      )}
    </div>
  );
}

export function formatDirectoryEventWhen(event: DirectoryEventSummary) {
  const startMs = parsePacificDateTime(event.dateStart);
  if (startMs == null) return event.dayOfWeek || "Upcoming";
  const start = new Date(startMs);
  const dateLabel = start.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = start.toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateLabel} · ${timeLabel}`;
}

export const TYPE_TO_DS_CATEGORY: Record<string, string> = {
  bar: "bars",
  restaurant: "food",
  cafe: "cafes",
  venue: "venues",
  service: "services",
  shop: "shops",
  hotel: "hotels",
};

function DirectoryCard({ biz, onClick }: { biz: Business; onClick?: () => void }) {
  const upcomingEvents = biz.upcomingEvents ?? [];
  const address = [biz.address, biz.neighborhood].filter(Boolean).join(" · ") || undefined;
  return (
    <PlaceCard
      name={biz.name}
      onClick={onClick}
      category={TYPE_TO_DS_CATEGORY[biz.type] || "venues"}
      className={`pdxPlace--clickable ${biz.type === "nonprofit" ? "pdxPlace--rainbow" : ""}`}
      donateUrl={biz.donateUrl || undefined}
      categoryLabel={TYPE_LABELS[biz.type] || biz.type}
      address={address}
      hours={biz.hours || undefined}
      phone={biz.phone || undefined}
      description={biz.description || undefined}
      website={biz.website || undefined}
      instagram={biz.instagram || undefined}
      grandOpening={biz.isNew}
      events={upcomingEvents.map(event => ({
        day: event.dayOfWeek || undefined,
        date: formatDirectoryEventWhen(event),
        title: event.title,
        href: eventPath(event.id, event.title, event.dayOfWeek),
      }))}
    />
  );
}
