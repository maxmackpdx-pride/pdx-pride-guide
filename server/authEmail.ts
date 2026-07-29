import crypto from "node:crypto";
import { sqlite } from "./storage";

export type AuthEmailPurpose = "verify_email" | "reset_password";

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS auth_email_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS auth_email_tokens_user_purpose
    ON auth_email_tokens(user_id, purpose);
`);

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createAuthEmailToken(userId: number, purpose: AuthEmailPurpose, ttlMs: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  sqlite.prepare(`DELETE FROM auth_email_tokens WHERE user_id = ? AND purpose = ?`).run(userId, purpose);
  sqlite.prepare(`
    INSERT INTO auth_email_tokens (token_hash, user_id, purpose, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(tokenHash(token), userId, purpose, new Date(now.getTime() + ttlMs).toISOString(), now.toISOString());
  return token;
}

export function consumeAuthEmailToken(token: string, purpose: AuthEmailPurpose): number | null {
  if (!token || token.length > 256) return null;
  const row = sqlite.prepare(`
    SELECT user_id AS userId, expires_at AS expiresAt, used_at AS usedAt
    FROM auth_email_tokens
    WHERE token_hash = ? AND purpose = ?
  `).get(tokenHash(token), purpose) as { userId: number; expiresAt: string; usedAt: string | null } | undefined;
  if (!row || row.usedAt || Date.parse(row.expiresAt) <= Date.now()) return null;
  const usedAt = new Date().toISOString();
  const result = sqlite.prepare(`
    UPDATE auth_email_tokens SET used_at = ?
    WHERE token_hash = ? AND purpose = ? AND used_at IS NULL
  `).run(usedAt, tokenHash(token), purpose);
  return result.changes === 1 ? row.userId : null;
}

export function invalidateAuthEmailTokens(userId: number, purpose: AuthEmailPurpose) {
  sqlite.prepare(`DELETE FROM auth_email_tokens WHERE user_id = ? AND purpose = ?`).run(userId, purpose);
}

export function transactionalEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char] || char));
}

async function sendEmail(input: { to: string; subject: string; preheader: string; heading: string; body: string; cta: string; href: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Transactional email is not configured");
  const from = process.env.EMAIL_FROM || "Zaylist <noreply@zaylist.com>";
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#111">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(input.preheader)}</div>
    <div style="max-width:560px;margin:32px auto;background:#fff;border:3px solid #000;padding:32px;box-shadow:8px 8px 0 #00ffff">
      <div style="font-weight:900;letter-spacing:.12em;font-size:14px">ZAYLIST</div>
      <h1 style="font-size:28px;line-height:1.1;margin:24px 0 12px">${escapeHtml(input.heading)}</h1>
      <p style="font-size:16px;line-height:1.55">${escapeHtml(input.body)}</p>
      <a href="${escapeHtml(input.href)}" style="display:inline-block;margin-top:14px;padding:14px 18px;background:#ccff00;border:2px solid #000;color:#000;font-weight:900;text-decoration:none">${escapeHtml(input.cta)} →</a>
      <p style="margin-top:28px;font-size:12px;color:#555">If you did not request this, you can ignore this email.</p>
    </div></body></html>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html }),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("Transactional email failed", response.status, detail.slice(0, 500));
    throw new Error("Could not send email");
  }
}

export function sendVerificationEmail(to: string, token: string, displayName?: string | null) {
  const base = (process.env.PUBLIC_APP_URL || "https://www.zaylist.com").replace(/\/$/, "");
  return sendEmail({
    to,
    subject: "Confirm your Zaylist email",
    preheader: "Confirm your email to finish joining Zaylist.",
    heading: "Confirm your email",
    body: `Hey ${displayName || "there"}, confirm this address to finish joining Zaylist. This link expires in 24 hours.`,
    cta: "CONFIRM EMAIL",
    href: `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
  });
}

export function sendPasswordResetEmail(to: string, token: string, displayName?: string | null) {
  const base = (process.env.PUBLIC_APP_URL || "https://www.zaylist.com").replace(/\/$/, "");
  return sendEmail({
    to,
    subject: "Reset your Zaylist password",
    preheader: "Use this secure link to reset your Zaylist password.",
    heading: "Reset your password",
    body: `Hey ${displayName || "there"}, use this secure link to choose a new password. It expires in one hour.`,
    cta: "RESET PASSWORD",
    href: `${base}/reset-password?token=${encodeURIComponent(token)}`,
  });
}
