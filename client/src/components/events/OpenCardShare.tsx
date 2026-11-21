import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { ActionSheetCard } from "@/components/cards/ActionSheetCard";
import type { OriginRect } from "@/components/cards/flipCard";

/* ---------- Social image (Tucker, t294u/t298u) ----------
 * One generator for both share images ("Check out this event on Zaylist" and
 * "I can help with this"), in feed 1080x1350 and story 1080x1920.
 * Layout: full-bleed poster (cover); a top scrim carrying the Zaylist hero
 * wordmark, centered, inside the safe zone below story chrome; a bottom
 * scrim carrying the text block on a 72px left datum: accent rule, headline
 * in the poster-matched accent, event title, date · venue, zaylist.com.
 * The bottom block ends above the story reply bar (story) / 88px (feed). */
export type ShareImageSize = "feed" | "story";
const SIZES: Record<ShareImageSize, { w: number; h: number; top: number; bottom: number }> = {
  feed: { w: 1080, h: 1350, top: 72, bottom: 88 },
  story: { w: 1080, h: 1920, top: 250, bottom: 330 },
};
const HERO_LOGO = "/brand/kit/wordmark/zaylist-wordmark-primary.png";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:/i.test(src) && !src.startsWith(window.location.origin)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Trims the wordmark's transparent padding so it sits on the safe-zone line. */
function alphaBox(img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext("2d")!;
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let l = c.width, t = c.height, r = 0, b = 0;
  for (let y = 0; y < c.height; y += 2) for (let i = 0; i < c.width; i += 2) {
    if (d[(y * c.width + i) * 4 + 3] > 24) { if (i < l) l = i; if (i > r) r = i; if (y < t) t = y; if (y > b) b = y; }
  }
  return r > l ? { sx: l, sy: t, sw: r - l, sh: b - t } : { sx: 0, sy: 0, sw: c.width, sh: c.height };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width <= maxW || !line) line = next;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (ctx.measureText(last + "…").width > maxW && last.length > 1) last = last.slice(0, -1);
    kept[maxLines - 1] = last + "…";
    return kept;
  }
  return lines;
}

function cssColor(value: string): string {
  if (!value.startsWith("var(")) return value;
  const name = value.slice(4, -1).split(",")[0].trim();
  return tokenColor(name) || tokenColor("--neon-magenta");
}
/** A repo color token, resolved for canvas (canvas can't read CSS variables). */
function tokenColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
/** Token at an alpha, for canvas gradients and shadows. */
function tokenAlpha(name: string, a: number): string {
  const v = tokenColor(name);
  const m = /^#([0-9a-f]{6})$/i.exec(v);
  if (!m) return v;
  const n = parseInt(m[1], 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export async function renderShareImage(opts: {
  poster: string | null; headline: string; title: string; meta: string; accent: string; size: ShareImageSize;
}): Promise<Blob> {
  const S = SIZES[opts.size];
  const accent = cssColor(opts.accent);
  await Promise.all([
    document.fonts?.load('900 120px "Barlow Condensed"'),
    document.fonts?.load('600 40px "Barlow"'),
  ].filter(Boolean)).catch(() => undefined);
  const c = document.createElement("canvas");
  c.width = S.w; c.height = S.h;
  const g = c.getContext("2d")!;
  g.fillStyle = tokenColor("--z-black"); g.fillRect(0, 0, S.w, S.h);
  if (opts.poster) {
    try {
      const img = await loadImage(opts.poster);
      const scale = Math.max(S.w / img.naturalWidth, S.h / img.naturalHeight);
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      g.drawImage(img, (S.w - dw) / 2, Math.min(0, (S.h - dh) * 0.25), dw, dh);
    } catch { /* poster unavailable: dark field with accent glow below */ }
  }
  const glow = g.createRadialGradient(S.w / 2, S.h, 0, S.w / 2, S.h, S.h * 0.7);
  glow.addColorStop(0, accent); glow.addColorStop(1, "transparent");
  g.globalAlpha = 0.25; g.fillStyle = glow; g.fillRect(0, 0, S.w, S.h); g.globalAlpha = 1;
  const top = g.createLinearGradient(0, 0, 0, S.top + 300);
  top.addColorStop(0, tokenAlpha("--z-oled", .78)); top.addColorStop(1, tokenAlpha("--z-oled", 0));
  g.fillStyle = top; g.fillRect(0, 0, S.w, S.top + 300);
  const bot = g.createLinearGradient(0, S.h * 0.38, 0, S.h);
  bot.addColorStop(0, tokenAlpha("--z-oled", 0)); bot.addColorStop(0.45, tokenAlpha("--z-oled", .72)); bot.addColorStop(1, tokenAlpha("--z-oled", .94));
  g.fillStyle = bot; g.fillRect(0, S.h * 0.38, S.w, S.h * 0.62);

  // Hero wordmark, centered in the top safe zone.
  try {
    const logo = await loadImage(HERO_LOGO);
    const box = alphaBox(logo);
    const lw = 380, lh = (box.sh / box.sw) * lw;
    g.drawImage(logo, box.sx, box.sy, box.sw, box.sh, (S.w - lw) / 2, S.top, lw, lh);
  } catch { /* wordmark missing: text fallback */
    g.fillStyle = tokenColor("--text-hi"); g.font = '900 64px "Barlow Condensed"'; g.textAlign = "center"; g.fillText("ZAYLIST", S.w / 2, S.top + 60); g.textAlign = "left";
  }

  // Text block, measured bottom-up from the safe line.
  const L = 72, maxW = S.w - L * 2;
  g.font = '900 112px "Barlow Condensed"';
  const head = wrap(g, opts.headline.toUpperCase(), maxW, 2);
  g.font = '900 64px "Barlow Condensed"';
  const title = wrap(g, opts.title.toUpperCase(), maxW, 2);
  g.font = '600 38px "Barlow"';
  const meta = wrap(g, opts.meta, maxW, 2);
  const blockH = 14 + 34 + head.length * 104 + 18 + title.length * 66 + 16 + meta.length * 48 + 22 + 30;
  let y = S.h - S.bottom - blockH;
  g.shadowColor = tokenAlpha("--z-oled", .85); g.shadowBlur = 18; g.shadowOffsetY = 3;
  g.fillStyle = accent; g.fillRect(L, y, 132, 10);
  y += 14 + 34;
  g.font = '900 112px "Barlow Condensed"'; g.fillStyle = accent; g.textBaseline = "alphabetic";
  for (const line of head) { y += 92; g.fillText(line, L, y); y += 12; }
  y += 18;
  g.font = '900 64px "Barlow Condensed"'; g.fillStyle = tokenColor("--text-hi");
  for (const line of title) { y += 58; g.fillText(line, L, y); y += 8; }
  y += 16;
  g.font = '600 38px "Barlow"'; g.fillStyle = tokenAlpha("--text-hi", .92);
  for (const line of meta) { y += 40; g.fillText(line, L, y); y += 8; }
  y += 22;
  g.font = '700 30px "Barlow Condensed"'; g.fillStyle = tokenAlpha("--text-hi", .75);
  g.fillText("ZAYLIST.COM", L, y + 28);
  return new Promise((resolve, reject) => c.toBlob(b => (b ? resolve(b) : reject(new Error("image"))), "image/png"));
}

export function shareUrlFor(path: string, from?: string | null): string {
  const u = new URL(path, window.location.origin);
  u.searchParams.set("ref", "share");
  if (from) u.searchParams.set("from", from);
  return u.toString();
}

/* ---------- Popups ---------- */
/** Generated image preview + share / copy / save. Nothing is sent by itself. */
/** Web Share with the image, then link-only share, then copy. Module level:
 *  the React Compiler does not lower value blocks inside try/catch. */
async function shareOrCopy(file: File | null, title: string, text: string, url: string): Promise<string | null> {
  const canFiles = Boolean(file && navigator.canShare && navigator.canShare({ files: [file] }));
  try {
    if (canFiles && file) { await navigator.share({ files: [file], text, url }); return null; }
    if (navigator.share) { await navigator.share({ title, text, url }); return null; }
  } catch { return null; /* user cancelled */ }
  return (await copyText(url)) ? "Link copied." : url;
}
async function copyText(value: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(value); return true; } catch { return false; }
}

export function ShareImagePanel({ url, text, headline, title, meta, poster, accent, fileStem }: {
  url: string; text: string; headline: string; title: string; meta: string; poster: string | null; accent: string; fileStem: string;
}) {
  const [size, setSize] = useState<ShareImageSize>("feed");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    let live = true;
    setBlob(null);
    renderShareImage({ poster, headline, title, meta, accent, size }).then(b => { if (live) setBlob(b); }).catch(() => setNote("Could not draw the image."));
    return () => { live = false; };
  }, [poster, headline, title, meta, accent, size]);
  const src = useMemo(() => (blob ? URL.createObjectURL(blob) : ""), [blob]);
  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);
  const file = blob ? new File([blob], `${fileStem}-${size}.png`, { type: "image/png" }) : null;
  const share = async () => { const n = await shareOrCopy(file, title, text, url); if (n) setNote(n); };
  const copy = async () => setNote((await copyText(url)) ? "Link copied." : url);
  return (
    <div className="oshareimg">
      <div className="oshareimg-size" role="group" aria-label="Image size">
        <button type="button" aria-pressed={size === "feed"} onClick={() => setSize("feed")}>FEED 4:5</button>
        <button type="button" aria-pressed={size === "story"} onClick={() => setSize("story")}>STORY 9:16</button>
      </div>
      <div className={`oshareimg-frame is-${size}`}>
        {src ? <img src={src} alt={`${headline}: ${title}`} /> : <p role="status">Drawing image…</p>}
      </div>
      <div className="oshareimg-acts">
        <button type="button" className="obtn opop-btn opop-btn--main" onClick={share} disabled={!blob}>SHARE <span>↗</span></button>
        <button type="button" className="obtn opop-btn" onClick={copy}>COPY LINK</button>
        {src ? <a className="obtn opop-btn" href={src} download={`${fileStem}-${size}.png`}>SAVE IMAGE</a> : null}
      </div>
      {note ? <p className="opop-note" role="status">{note}</p> : null}
    </div>
  );
}

type Person = { id: number; username: string; displayName?: string | null };

/** Share button popup: invite friends on Zaylist, or share a link + image. */
export function EventSharePopup({ onClose, accent, eventId, path, title, meta, poster, origin }: {
  onClose: () => void; accent: string; eventId: number; path: string; title: string; meta: string; poster: string | null; origin?: OriginRect | null;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"menu" | "friends" | "link">("menu");
  const [sent, setSent] = useState<Record<string, "sending" | "sent" | "error">>({});
  const [auth, setAuth] = useState(false);
  const url = shareUrlFor(path, user?.username);
  const people = useQuery<{ people?: Person[] }>({
    queryKey: ["/api/users/me/people", "following"],
    queryFn: () => apiRequest("GET", "/api/users/me/people/following").then(r => r.json()),
    enabled: Boolean(user) && mode === "friends",
    staleTime: 60_000,
  });
  const invite = async (p: Person) => {
    setSent(s => ({ ...s, [p.username]: "sending" }));
    try {
      await apiRequest("POST", `/api/users/${encodeURIComponent(p.username)}/message`, {
        subject: `Event invite: ${title}`.slice(0, 120),
        body: `Check out ${title} on Zaylist: ${url}`,
      });
      setSent(s => ({ ...s, [p.username]: "sent" }));
    } catch { setSent(s => ({ ...s, [p.username]: "error" })); }
  };
  void eventId;
  return (
    <ActionSheetCard label="Share event" accent={accent} kicker="SHARE" title={title.toUpperCase()} origin={origin} onDismiss={onClose} wide={mode === "link"}>
        <div className="opop-opts">
          <button type="button" className="obtn opop-btn" aria-expanded={mode === "friends"}
            onClick={() => (user ? setMode(m => (m === "friends" ? "menu" : "friends")) : setAuth(true))}>
            INVITE FRIENDS ON ZAYLIST <span>{mode === "friends" ? "▴" : "▾"}</span>
          </button>
          {mode === "friends" ? (
            <ul className="opop-friends">
              {people.isLoading ? <li role="status">Loading friends…</li> : null}
              {people.data && !(people.data.people ?? []).length ? <li className="opop-note">You don't follow anyone yet.</li> : null}
              {(people.data?.people ?? []).map(p => (
                <li key={p.id}>
                  <span>{p.displayName || p.username}<small>@{p.username}</small></span>
                  <button type="button" className="obtn opop-send" disabled={!!sent[p.username] && sent[p.username] !== "error"} onClick={() => invite(p)}>
                    {sent[p.username] === "sent" ? "SENT" : sent[p.username] === "sending" ? "…" : sent[p.username] === "error" ? "RETRY" : "SEND"}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" className="obtn opop-btn" aria-expanded={mode === "link"} onClick={() => setMode(m => (m === "link" ? "menu" : "link"))}>
            SHARE LINK + IMAGE <span>{mode === "link" ? "▴" : "▾"}</span>
          </button>
          {mode === "link" ? (
            <ShareImagePanel url={url} text={`Check out ${title} on Zaylist`} headline="Check out this event on Zaylist"
              title={title} meta={meta} poster={poster} accent={accent} fileStem="zaylist-event" />
          ) : null}
        </div>
      {auth && <AuthModal defaultTab="register" onClose={() => setAuth(false)} />}
    </ActionSheetCard>
  );
}

/** Gig help: invite a host / venue that isn't on Zaylist yet. */
export function GigInvitePopup({ onClose, accent, path, title, meta, poster, gigTitle, origin }: {
  onClose: () => void; accent: string; path: string; title: string; meta: string; poster: string | null; gigTitle: string; origin?: OriginRect | null;
}) {
  const { user } = useAuth();
  return (
    <ActionSheetCard label="Invite them" accent={accent} kicker="INVITE THEM" title={gigTitle.toUpperCase()} origin={origin} onDismiss={onClose} wide>
        <p className="opop-note">They aren't on Zaylist yet. Share this so they can find you.</p>
        <ShareImagePanel url={shareUrlFor(path, user?.username)} text={`I can help with ${gigTitle} at ${title}. Find me on Zaylist`}
          headline="I can help with this" title={title} meta={meta} poster={poster} accent={accent} fileStem="zaylist-gig" />
    </ActionSheetCard>
  );
}

/** Message the host (or venue owner) about a gig; prefilled, the user sends. */
export function GigMessagePopup({ onClose, accent, eventId, gigTitle, eventTitle, onNoContact, origin }: {
  onClose: () => void; accent: string; eventId: number; gigTitle: string; eventTitle: string; onNoContact: () => void; origin?: OriginRect | null;
}) {
  const { user } = useAuth();
  const [body, setBody] = useState(`Hi! I saw "${gigTitle}" for ${eventTitle} on Zaylist. I'm willing to help or perform — let me know if you still need someone.`);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [auth, setAuth] = useState(!user);
  const send = async () => {
    setState("sending");
    const res = await fetch(`/api/events/${eventId}/message-host`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ body }),
    }).catch(() => null);
    if (res?.ok) { setState("sent"); return; }
    const payload = await res?.json().catch(() => ({})) ?? {};
    if ((payload as { error?: string }).error === "NO_CONTACT") { onNoContact(); return; }
    setState("error");
  };
  return (
    <ActionSheetCard label="Message the host" accent={accent} kicker="MESSAGE THE HOST" title={gigTitle.toUpperCase()} origin={origin} onDismiss={onClose}>
        {state === "sent" ? <p className="opop-note" role="status">Sent. They can reply in your inbox.</p> : (
          <>
            <label className="opop-label" htmlFor="gig-msg">Your message (edit before sending)</label>
            <textarea id="gig-msg" className="opop-text" rows={5} value={body} maxLength={1000} onChange={e => setBody(e.target.value)} />
            <button type="button" className="obtn opop-btn opop-btn--main" disabled={!body.trim() || state === "sending"} onClick={() => (user ? void send() : setAuth(true))}>
              {state === "sending" ? "SENDING…" : "SEND MESSAGE"}
            </button>
            {state === "error" ? <p className="opop-note" role="alert">Could not send. Try again.</p> : null}
          </>
        )}
      {auth && !user && <AuthModal onClose={() => setAuth(false)} />}
    </ActionSheetCard>
  );
}

/** Arrived through a shared link and not a member: any tap on the card asks
 *  them to join first. The event URL stays put, so they land back on it. */
export function useShareJoinGate(): { gated: boolean; prompt: boolean; setPrompt: (v: boolean) => void } {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(false);
  const fromShare = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("ref") === "share";
  useEffect(() => {
    if (fromShare && !user) try { sessionStorage.setItem("zaylist:return-to", window.location.pathname + window.location.search); } catch { /* storage off */ }
  }, [fromShare, user]);
  return { gated: fromShare && !user, prompt, setPrompt };
}

export function ShareJoinPrompt({ title, from, onClose, accent }: { title: string; from: string | null; onClose: () => void; accent: string }) {
  const [auth, setAuth] = useState<null | "login" | "register">(null);
  return (
    <ActionSheetCard label="Join Zaylist" accent={accent} kicker="YOU'RE INVITED" title={title.toUpperCase()} onDismiss={onClose}>
      <p className="opop-note">{from ? `@${from} shared this with you. ` : ""}Join Zaylist free to save it, go, chat with the room and get rides.</p>
      <div className="opop-opts">
        <button type="button" className="obtn opop-btn opop-btn--main" onClick={() => setAuth("register")}>JOIN ZAYLIST <span>›</span></button>
        <button type="button" className="obtn opop-btn" onClick={() => setAuth("login")}>I HAVE AN ACCOUNT</button>
      </div>
      {auth && <AuthModal defaultTab={auth} onClose={() => { setAuth(null); onClose(); }} />}
    </ActionSheetCard>
  );
}
