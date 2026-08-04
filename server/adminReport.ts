// Consolidated "everything that's piling up" backlog report for admins/owner.
// Aggregates every pending admin-queue category plus the Owner Desk into one
// structured payload (JSON) and a clean, printable HTML document.

type Row = {
  head: string;
  meta: string;
  fields: Array<[string, string]>;
  note: string;
};

type Category = {
  key: string;
  label: string;
  accent: string;
  count: number;
  rows: Row[];
};

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(v: unknown): string {
  if (!v) return "";
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function cut(v: unknown, n = 600): string {
  const s = String(v ?? "").trim();
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function fields(...pairs: Array<[string, unknown] | false | null | undefined>): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const p of pairs) {
    if (!p) continue;
    const [label, value] = p;
    const v = String(value ?? "").trim();
    if (v) out.push([label, v]);
  }
  return out;
}

export function buildAdminReport(storage: any, includeOwnerDesk: boolean) {
  const submissions: any[] = storage.getSubmissions("PENDING") || [];
  const promoters: any[] = storage.getPendingPromoterRequests() || [];
  const claims: any[] = storage.getPendingBusinessClaims() || [];
  const venues: any[] = storage.getPendingBusinessSubmissions() || [];
  const logos: any[] = storage.getPendingBusinessLogoRequests() || [];
  const moderation: any[] = (storage.getModerationRequests("PENDING") || []);
  const missed: any[] = (storage.getAdminMissedConnections() || []).filter(
    (m: any) => String(m.status || "").toUpperCase() === "ACTIVE",
  );
  const riverBrats: any[] = (storage.getRiverBratsReports("PENDING") || []).filter(
    (r: any) => String(r.status || "").toUpperCase() === "PENDING",
  );
  const gifting: any[] = (storage.getGiftingReports("PENDING") || []).filter(
    (r: any) => String(r.status || "").toUpperCase() === "PENDING",
  );
  const giftingTerminal = new Set(["REJECTED", "REMOVED", "GIFTED", "FOUND", "EXPIRED"]);
  const giftingFlagged: any[] = (storage.getGiftingPosts({ includeInactive: true }) || []).filter(
    (p: any) => !giftingTerminal.has(String(p.status || "").toUpperCase()) && Number(p.reportCount || 0) > 0,
  );

  const categories: Category[] = [
    {
      key: "submissions",
      label: "Event submissions & claims",
      accent: "#1391c9",
      count: submissions.length,
      rows: submissions.map((s) => ({
        head: s.title || s.name || "Untitled submission",
        meta: `${s.type || "ITEM"} · ${fmt(s.createdAt)}`,
        fields: fields(
          s.venueName && ["Where", s.venueName + (s.address ? ` · ${s.address}` : "")],
          s.dateStart && ["When", fmt(s.dateStart)],
          (s.submitterName || s.submitterEmail) && ["From", `${s.submitterName || ""}${s.submitterEmail ? ` <${s.submitterEmail}>` : ""}`.trim()],
        ),
        note: cut(s.claimReason || s.description),
      })),
    },
    {
      key: "promoters",
      label: "Promoter requests",
      accent: "#8a4dff",
      count: promoters.length,
      rows: promoters.map((p) => ({
        head: p.displayName || p.username || "Promoter applicant",
        meta: `Promoter request · ${fmt(p.requestedAt)}`,
        fields: fields(
          p.username && ["Handle", `@${p.username}`],
          p.email && ["Email", p.email],
          p.submitterOrg && ["Org", p.submitterOrg],
          p.eventTitle && ["Event", p.eventTitle],
        ),
        note: cut(p.claimReason),
      })),
    },
    {
      key: "venueClaims",
      label: "Venue / business claims",
      accent: "#d6820a",
      count: claims.length,
      rows: claims.map((c) => ({
        head: c.businessName || "Venue claim",
        meta: `Claim by ${c.displayName || c.username || "someone"} · ${fmt(c.createdAt)}`,
        fields: fields(c.email && ["Email", c.email]),
        note: cut(c.claimReason),
      })),
    },
    {
      key: "newVenues",
      label: "New venue submissions",
      accent: "#d6820a",
      count: venues.length,
      rows: venues.map((v) => ({
        head: v.name || "New venue",
        meta: `New venue · ${fmt(v.createdAt)}`,
        fields: fields(
          v.type && ["Type", v.type],
          v.address && ["Where", v.address + (v.neighborhood ? ` · ${v.neighborhood}` : "")],
          v.phone && ["Phone", v.phone],
          v.website && ["Web", v.website],
          v.instagram && ["IG", v.instagram],
        ),
        note: cut(v.description),
      })),
    },
    {
      key: "logos",
      label: "Logo requests",
      accent: "#1391c9",
      count: logos.length,
      rows: logos.map((l) => ({
        head: `${l.businessName || "Venue"} - new logo`,
        meta: `Logo request · ${fmt(l.createdAt)}`,
        fields: fields(l.imageUrl && ["Image", l.imageUrl]),
        note: "",
      })),
    },
    {
      key: "moderation",
      label: "Moderation queue",
      accent: "#c9391f",
      count: moderation.length,
      rows: moderation.map((m) => ({
        head: m.eventTitle || String(m.type || "Review").replace(/_/g, " "),
        meta: `${String(m.type || "REVIEW").replace(/_/g, " ")} · ${fmt(m.createdAt)}`,
        fields: fields(m.requesterName && ["From", m.requesterName]),
        note: cut(m.proof),
      })),
    },
    {
      key: "missed",
      label: "Mizzed Connection to review",
      accent: "#ff1fa0",
      count: missed.length,
      rows: missed.map((m) => ({
        head: m.title || `Missed connection #${m.id}`,
        meta: `${m.venueHint || m.dayOfWeek || "Around town"} · ${fmt(m.createdAt)}`,
        fields: fields((m.displayName || m.username) && ["Poster", m.displayName || m.username]),
        note: cut(m.body),
      })),
    },
    {
      key: "riverBrats",
      label: "River Brats reports",
      accent: "#d6820a",
      count: riverBrats.length,
      rows: riverBrats.map((r) => ({
        head: `${r.target_type || "Content"} #${r.target_id ?? "-"}`,
        meta: `${r.reason || "Reported"}${r.reporterUsername ? ` · by ${r.reporterUsername}` : ""} · ${fmt(r.createdAt)}`,
        fields: fields(),
        note: cut(r.details || r.message),
      })),
    },
    {
      key: "gifting",
      label: "GifZ reports",
      accent: "#c9391f",
      count: gifting.length,
      rows: gifting.map((r) => ({
        head: r.postTitle || `GifZ report #${r.id}`,
        meta: `${r.reason || "Flagged post"} · ${fmt(r.createdAt)}`,
        fields: fields(r.postId && ["Post", `#${r.postId}`]),
        note: cut(r.message),
      })),
    },
    {
      key: "giftingFlagged",
      label: "Flagged GifZ posts",
      accent: "#8a4dff",
      count: giftingFlagged.length,
      rows: giftingFlagged.map((p) => ({
        head: p.title || `GifZ post #${p.id}`,
        meta: `${p.postType || "POST"} · ${p.reportCount || 0} report(s)`,
        fields: fields(["Status", String(p.status || "-")]),
        note: cut(p.description),
      })),
    },
  ];

  let ownerDesk: Category | null = null;
  if (includeOwnerDesk) {
    const items: any[] = storage.getOwnerDeskItems("OPEN") || [];
    ownerDesk = {
      key: "ownerDesk",
      label: "Owner Desk",
      accent: "#8a4dff",
      count: items.length,
      rows: items.map((r) => ({
        head: r.title || r.summary || (r.kindLabel || "Message"),
        meta: `${r.kindLabel || r.kind || "message"}${r.severity ? ` · ${r.severity}` : ""} · ${fmt(r.createdAt)}`,
        fields: fields(
          r.contactName && ["From", r.contactName],
          r.contactEmail && ["Email", r.contactEmail],
          r.contactPhone && ["Phone", r.contactPhone],
          r.pageUrl && ["Sent from", r.pageUrl],
        ),
        note: cut(r.body || r.summary),
      })),
    };
  }

  const adminTotal = categories.reduce((n, c) => n + c.count, 0);
  const total = adminTotal + (ownerDesk?.count || 0);

  return {
    generatedAt: new Date().toISOString(),
    total,
    adminTotal,
    categories,
    ownerDesk,
  };
}

function renderCategory(c: Category): string {
  const rows = c.rows.length === 0
    ? `<p class="none">Nothing pending 🎉</p>`
    : c.rows
        .map((r) => `
          <div class="item">
            <div class="item-head">${esc(r.head)}</div>
            <div class="item-meta">${esc(r.meta)}</div>
            ${r.fields.length ? `<dl>${r.fields.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : ""}
            ${r.note ? `<div class="item-note">${esc(r.note)}</div>` : ""}
          </div>`)
        .join("");
  return `
    <section>
      <h2 style="border-color:${c.accent}">
        <span class="dot" style="background:${c.accent}"></span>${esc(c.label)}
        <span class="count">${c.count}</span>
      </h2>
      ${rows}
    </section>`;
}

export function renderAdminReportHtml(data: ReturnType<typeof buildAdminReport>): string {
  const cats = [...data.categories, ...(data.ownerDesk ? [data.ownerDesk] : [])];
  const summary = cats
    .map((c) => `<li><span>${esc(c.label)}</span><b>${c.count}</b></li>`)
    .join("");
  const body = cats.map(renderCategory).join("");
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Zaylist - Backlog Report</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4f4f6; color: #16161a; font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 820px; margin: 0 auto; padding: 24px 18px 80px; }
  header { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; border-bottom: 2px solid #16161a; padding-bottom: 12px; }
  h1 { font-size: 22px; margin: 0; letter-spacing: .01em; }
  .gen { color: #6a6a72; font-size: 12.5px; }
  .total { margin: 16px 0 6px; font-size: 15px; }
  .total b { font-size: 30px; }
  ul.summary { list-style: none; margin: 8px 0 26px; padding: 12px 14px; background: #fff; border: 1px solid #e2e2e6; border-radius: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 2px 20px; }
  ul.summary li { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #ececf0; }
  ul.summary b { font-variant-numeric: tabular-nums; }
  section { margin: 24px 0; }
  h2 { font-size: 16px; margin: 0 0 12px; padding: 0 0 6px 0; border-bottom: 2px solid; display: flex; align-items: center; gap: 8px; }
  h2 .dot { width: 9px; height: 9px; border-radius: 999px; display: inline-block; }
  h2 .count { margin-left: auto; background: #16161a; color: #fff; border-radius: 999px; font-size: 12px; padding: 2px 9px; }
  .none { color: #8a8a92; font-style: italic; margin: 0 0 4px 17px; }
  .item { background: #fff; border: 1px solid #e2e2e6; border-radius: 10px; padding: 12px 14px; margin: 0 0 8px; }
  .item-head { font-weight: 650; font-size: 15px; }
  .item-meta { color: #6a6a72; font-size: 12.5px; margin-top: 2px; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 2px 12px; margin: 9px 0 0; font-size: 13px; }
  dt { color: #8a8a92; text-transform: uppercase; font-size: 10.5px; letter-spacing: .06em; padding-top: 2px; }
  dd { margin: 0; word-break: break-word; }
  .item-note { margin-top: 9px; padding: 9px 11px; background: #f7f7f9; border-radius: 8px; font-size: 13px; color: #33333a; white-space: pre-wrap; word-break: break-word; }
  .toolbar { margin: 18px 0 0; }
  .toolbar button { font: inherit; font-size: 13px; padding: 8px 16px; border-radius: 999px; border: 1px solid #16161a; background: #16161a; color: #fff; cursor: pointer; }
  @media print { body { background: #fff; } .toolbar { display: none; } .item, ul.summary { break-inside: avoid; } }
</style>
</head><body>
  <div class="wrap">
    <header>
      <h1>🏳️‍🌈 Backlog Report</h1>
      <span class="gen">Generated ${esc(fmt(data.generatedAt))} PT</span>
    </header>
    <p class="total"><b>${data.total}</b> item${data.total === 1 ? "" : "s"} awaiting you${data.ownerDesk ? "" : " (admin queue)"} · ${data.adminTotal} in the shared queue${data.ownerDesk ? ` · ${data.ownerDesk.count} on the Owner Desk` : ""}</p>
    <div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
    <ul class="summary">${summary}</ul>
    ${body}
  </div>
</body></html>`;
}
