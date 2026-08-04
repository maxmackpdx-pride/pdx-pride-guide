const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Zaylist <noreply@zaylist.com>";
const DEFAULT_OWNER_EMAIL = "tucker@zaylist.com";

type ResendPayload = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
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
      "Content-Type": "application/json",
    },
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
