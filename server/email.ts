const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Zaylist <noreply@zaylist.com>";
const DEFAULT_OWNER_EMAIL = "tucker@zaylist.com";

type ResendPayload = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  idempotencyKey?: string;
};

function htmlEscape(value: string) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char] || char);
}

export function isTransactionalEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

async function sendResendEmail(payload: ResendPayload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { sent: false as const, reason: "not_configured" as const };

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(payload.idempotencyKey ? { "Idempotency-Key": payload.idempotencyKey } : {}),
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      ...(payload.html ? { html: payload.html } : {}),
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend request failed (${response.status})${detail ? `: ${detail.slice(0, 240)}` : ""}`);
  }

  const result = await response.json().catch(() => ({})) as { id?: string };
  return { sent: true as const, id: result.id || null };
}

export async function sendPasswordResetEmail(input: { to: string; resetUrl: string }) {
  const safeUrl = htmlEscape(input.resetUrl);
  return sendResendEmail({
    to: [input.to],
    subject: "Reset your Zaylist password",
    text: [
      "Someone requested a password reset for your Zaylist account.",
      "",
      `Reset your password: ${input.resetUrl}`,
      "",
      "This link expires in 60 minutes and can be used once. If you did not request it, you can ignore this email.",
    ].join("\n"),
    html: `<p>Someone requested a password reset for your Zaylist account.</p><p><a href="${safeUrl}" rel="noreferrer">Reset your password</a></p><p>This link expires in 60 minutes and can be used once. If you did not request it, you can ignore this email.</p>`,
  });
}

export async function sendOwnerDeskNotification() {
  return sendResendEmail({
    to: [process.env.OWNER_NOTIFICATION_EMAIL?.trim() || DEFAULT_OWNER_EMAIL],
    subject: "New message in the Zaylist Owner Desk",
    text: "A new contact message is waiting in the Zaylist Owner Desk. Sign in to review it securely.",
  });
}

export async function sendGuestInvitation(kind: "email" | "phone", contact: string, secret: string, entryId: number) {
  const base = (process.env.PUBLIC_BASE_URL?.trim() || "https://www.zaylist.com").replace(/\/$/, "");
  const link = `${base}/hub#invite=${encodeURIComponent(secret)}`;
  const text = `You have a Zay'list guest spot. Open this private invitation to sign in or join and claim it: ${link}`;
  if (kind === "email") {
    const receipt = await sendResendEmail({ to: [contact], subject: "Your Zay'list guest invitation", text,
      idempotencyKey: `zaylist-invite-${entryId}` });
    return receipt.sent;
  }
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token || !from) return false;
  const result = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` },
    body: new URLSearchParams({ From: from, To: contact, Body: text }), signal: AbortSignal.timeout(15000),
  });
  return result.ok;
}
