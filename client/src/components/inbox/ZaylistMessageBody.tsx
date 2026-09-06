import { Link } from "wouter";

const INTERNAL = /(?:https?:\/\/(?:www\.)?zaylist\.com)?\/(u|directory|outz|z)\/[^\s]+/gi;
const ATTACHMENT = /(?:https?:\/\/(?:www\.)?zaylist\.com)?(\/uploads\/[^\s]+)/i;

function labelFor(path: string) {
  if (path.startsWith("/u/")) return "ZAYLIST MEMBER";
  if (path.startsWith("/directory")) return "PLACEZ";
  if (path.startsWith("/outz")) return "OUTZ";
  if (path.startsWith("/z/")) return "Z/ COMMUNITY";
  return "ZAYLIST";
}

export default function ZaylistMessageBody({ body }: { body: string }) {
  const match = [...body.matchAll(INTERNAL)][0];
  const attachment = body.match(ATTACHMENT);
  const visibleBody = attachment ? body.replace(attachment[0], "").trim() : body;
  if (!match && !attachment) return <>{body}</>;
  const attachmentPath = attachment?.[1];
  let linkPreview = null;
  if (match) {
  const raw = match[0];
  const parsed = raw.startsWith("http") ? new URL(raw) : null;
  const path = parsed ? `${parsed.pathname}${parsed.search}` : raw;
  const slug = decodeURIComponent(path.split("?")[0].split("/").filter(Boolean).at(-1) || "Open on Zaylist");
    linkPreview = (
      <Link href={path} className="inbox-zay-link pdx-glass-rebind" aria-label={`Open ${labelFor(path)} link`}>
        <span>{labelFor(path)}</span><strong>{slug}</strong><small>Open without leaving Zaylist →</small>
      </Link>
    );
  }
  return <>
    {visibleBody ? <span>{visibleBody}</span> : null}
    {attachmentPath ? <a className="inbox-message-image" href={attachmentPath} target="_blank" rel="noreferrer" aria-label="Open message image"><img src={attachmentPath} alt="Message attachment" loading="lazy" /></a> : null}
    {linkPreview}
  </>;
}
