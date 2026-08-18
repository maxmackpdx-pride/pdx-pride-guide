import { useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { C } from "./sheet";
import "../inbox-experiment.css";

type PostAction = { label: string; href?: string };

type PostItem = {
  key: string;
  title: string;
  meta: string;
  actions: PostAction[];
};

function useMine<T>(url: string, map: (rows: T[]) => PostItem[]) {
  const { data = [] } = useQuery<T[]>({
    queryKey: [url],
    queryFn: () => fetch(url, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
  });
  return map(data);
}

function Section({
  title,
  color,
  countLabel,
  items,
  hubHref,
  open,
  onToggle,
  onHub,
  onNavigate,
}: {
  title: string;
  color: string;
  countLabel: string;
  items: PostItem[];
  hubHref?: boolean;
  open: boolean;
  onToggle: () => void;
  onHub?: () => void;
  onNavigate?: (href: string) => void;
}) {
  const accentStyle = { "--inbox-exp-post-accent": color } as CSSProperties;

  return (
    <div className={`inbox-exp-post-section${open ? " is-open" : ""}`} style={accentStyle}>
      <button type="button" className="inbox-exp-post-section__head" onClick={onToggle}>
        <div className="inbox-exp-post-section__title-row">
          <span className="inbox-exp-post-section__title">{title}</span>
          <span className="inbox-exp-post-section__count">{countLabel}</span>
        </div>
        <div className="inbox-exp-post-section__actions">
          {!open && <span className="inbox-exp-post-section__view-all">VIEW ALL →</span>}
          <span className="inbox-exp-post-section__chev">
            <ChevronDown size={12} strokeWidth={2.6} />
          </span>
        </div>
      </button>
      {open && (
        <div className="inbox-exp-post-section__body">
          {items.length === 0 ? (
            <div className="inbox-exp-post-section__empty">
              {hubHref ? "Manage these in the Hub." : "Nothing here yet."}
              {hubHref && onHub && (
                <button type="button" className="inbox-exp-post-section__hub-btn" onClick={onHub}>
                  OPEN HUB →
                </button>
              )}
            </div>
          ) : (
            items.map((it) => (
              <div key={it.key} className="inbox-exp-post-item">
                <span className="inbox-exp-post-item__bar" />
                <div className="inbox-exp-post-item__body">
                  <div className="inbox-exp-post-item__title">{it.title}</div>
                  <div className="inbox-exp-post-item__meta">{it.meta}</div>
                </div>
                <div className="inbox-exp-post-item__actions">
                  {it.actions.map((a) => {
                    const clickable = Boolean(a.href && onNavigate);
                    if (clickable) {
                      return (
                        <button
                          key={a.label}
                          type="button"
                          className="inbox-exp-post-action inbox-exp-post-action--clickable"
                          onClick={() => onNavigate!(a.href!)}
                        >
                          {a.label}
                        </button>
                      );
                    }
                    return (
                      <span key={a.label} className="inbox-exp-post-action">
                        {a.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PostsView({ onNavigate }: { onNavigate?: (href: string) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ events: true });
  const toggle = (id: string) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  const gigs = useMine<any>("/api/gigs/mine", (rows) =>
    rows.map((g) => ({
      key: `gig-${g.id}`,
      title: g.title || "Gig post",
      meta: `GIGZ · ${g.replyCount ?? g.replies ?? 0} replies`,
      actions: [{ label: "EDIT", href: `/dashboard?view=posts&editGig=${g.id}` }],
    })),
  );
  const gifting = useMine<any>("/api/gifting/mine", (rows) =>
    rows.map((g) => ({
      key: `gifting-${g.id}`,
      title: g.title || "GIFTZ post",
      meta: `GIFTZ · ${g.status || "Live"}`,
      actions: [{ label: "EDIT", href: "/gifting" }],
    })),
  );
  const spotted = useMine<any>("/api/missed-connections/mine", (rows) =>
    rows.map((s) => ({
      key: `spotted-${s.id}`,
      title: s.title || s.body?.slice(0, 40) || "Missed connection post",
      meta: s.status === "ACTIVE" ? "MIZZED CONNECTION · Live" : "MIZZED CONNECTION · Pending review",
      actions: [{ label: "EDIT", href: "/spotted" }],
    })),
  );
  const claimed = useMine<any>("/api/events/mine/claimed", (rows) =>
    rows.map((e) => ({
      key: `claimed-${e.id}`,
      title: e.title || "Event",
      meta: `${e.dayOfWeek || ""}${e.venueName ? " · " + e.venueName : ""}`.trim() || "Claimed",
      actions: [
        { label: "CLAIMED" },
        { label: "EDIT", href: `/dashboard?view=posts&editEvent=${e.id}` },
      ],
    })),
  );
  const submitted = useMine<any>("/api/events/mine/submitted", (rows) =>
    rows.map((s) => ({
      key: `submitted-${s.id}`,
      title: s.title || "Event submission",
      meta: s.status ? `Submitted · ${s.status}` : "Submitted",
      actions: [{ label: "EDIT", href: "/dashboard?view=posts&section=events" }],
    })),
  );
  const events = [...claimed, ...submitted];
  const checkins = useMine<any>("/api/events/mine/check-ins", (rows) =>
    rows.map((a) => ({
      key: `checkin-${a.id}`,
      title: a.eventTitle || a.title || "Check-in",
      meta: `${a.status || "Going"}${a.dayOfWeek ? " · " + a.dayOfWeek : ""}`,
      actions: [{ label: "VIEW", href: "/dashboard?view=posts&section=checkins" }],
    })),
  );

  return (
    <>
      <p className="inbox-exp-posts-intro">
        Everything you've submitted, claimed, or posted to the boards.
      </p>
      <div className="inbox-exp-posts-stack">
        <Section
          title="MY EVENTS"
          color={C.cyan}
          countLabel={`${events.length} TOTAL`}
          items={events}
          open={!!open.events}
          onToggle={() => toggle("events")}
          onNavigate={onNavigate}
        />
        <Section
          title="GIG POSTS"
          color={C.orange}
          countLabel={`${gigs.length} POSTS`}
          items={gigs}
          open={!!open.gigs}
          onToggle={() => toggle("gigs")}
          onNavigate={onNavigate}
        />
        <Section
          title="MISSED CONNECTIONS"
          color={C.magenta}
          countLabel={`${spotted.length} POSTS`}
          items={spotted}
          open={!!open.spotted}
          onToggle={() => toggle("spotted")}
          onNavigate={onNavigate}
        />
        <Section
          title="GIFTING"
          color={C.blueCyan}
          countLabel={`${gifting.length} POSTS`}
          items={gifting}
          open={!!open.gifting}
          onToggle={() => toggle("gifting")}
          onNavigate={onNavigate}
        />
        <Section
          title="CHECK-INS"
          color={C.limeSoft}
          countLabel={`${checkins.length} ACTIVE`}
          items={checkins}
          open={!!open.checkins}
          onToggle={() => toggle("checkins")}
          onNavigate={onNavigate}
        />
      </div>
    </>
  );
}