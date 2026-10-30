/**
 * Google sign-in helpers: HMAC-signed state, PKCE (S256), ID-token nonce,
 * server-side ID token verification (JWKS) and the admin-intent decision.
 *
 * Kept free of storage/express imports so it can be unit tested in isolation.
 * Routes live in server/routes.ts (/api/auth/google and /api/auth/google/callback).
 */
import crypto from "node:crypto";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
export const GOOGLE_OAUTH_STATE_MAX_MS = 15 * 60 * 1000;

export type GoogleIntent = "member" | "admin";

export type GoogleStatePayload = {
  /** random per-attempt id; PKCE verifier and ID-token nonce are derived from it */
  nonceId: string;
  linkUserId?: number;
  returnTo?: string;
  intent: GoogleIntent;
};

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function hmac(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function safeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Stateless signed OAuth state (survives browsers that drop the session cookie on the Google hop). */
export function createSignedState(
  secret: string,
  input: { linkUserId?: number; returnTo?: string; intent?: GoogleIntent },
  now = Date.now(),
): string {
  const body = b64url(Buffer.from(JSON.stringify({
    n: crypto.randomBytes(16).toString("hex"),
    t: now,
    ...(input.linkUserId ? { l: input.linkUserId } : {}),
    ...(input.returnTo ? { r: input.returnTo } : {}),
    ...(input.intent === "admin" ? { i: "admin" } : {}),
  })));
  return `${body}.${hmac(secret, body)}`;
}

export function parseSignedState(
  secret: string,
  state: string,
  now = Date.now(),
): GoogleStatePayload | null {
  if (!secret || !state) return null;
  const dot = state.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  if (!sig || !safeEqualStr(sig, hmac(secret, body))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      n?: string; t?: number; l?: number; r?: string; i?: string;
    };
    if (!data.n || typeof data.n !== "string" || typeof data.t !== "number") return null;
    if (now - data.t > GOOGLE_OAUTH_STATE_MAX_MS || data.t > now + 60_000) return null;
    return {
      nonceId: data.n,
      ...(typeof data.l === "number" ? { linkUserId: data.l } : {}),
      ...(typeof data.r === "string" ? { returnTo: data.r } : {}),
      intent: data.i === "admin" ? "admin" : "member",
    };
  } catch {
    return null;
  }
}

/**
 * PKCE verifier + ID-token nonce are derived from the server secret and the per-attempt
 * id inside the signed state. They never appear in any URL, are unguessable without the
 * secret, and need no cookie or server-side storage.
 */
export function derivePkce(secret: string, nonceId: string): { verifier: string; challenge: string; method: "S256" } {
  const verifier = hmac(secret, `pkce-verifier:${nonceId}`); // 43 chars, base64url (RFC 7636 range 43-128)
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge, method: "S256" };
}

export function deriveNonce(secret: string, nonceId: string): string {
  return hmac(secret, `id-token-nonce:${nonceId}`);
}

export function buildAuthorizationUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: opts.state,
    nonce: opts.nonce,
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

export type VerifiedGoogleIdentity = {
  sub: string;
  email: string;
  emailVerified: true;
  name?: string;
  picture?: string;
};

export class GoogleIdTokenError extends Error {
  constructor(public readonly reason: string) {
    super(`Google ID token rejected: ${reason}`);
  }
}

let remoteJwks: JWTVerifyGetKey | null = null;
/** Test hook (ignored in production): swap Google's JWKS for a local key set. */
export function setGoogleJwksForTests(jwks: JWTVerifyGetKey | null): void {
  if (process.env.NODE_ENV === "production") return;
  remoteJwks = jwks;
}
function defaultJwks(): JWTVerifyGetKey {
  if (!remoteJwks) remoteJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL), { timeoutDuration: 5000 });
  return remoteJwks;
}

/**
 * Verify signature (Google JWKS), iss, aud, exp, nonce, sub and email_verified.
 * `jwks` is injectable for tests.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  opts: { clientId: string; nonce: string; jwks?: JWTVerifyGetKey; now?: Date },
): Promise<VerifiedGoogleIdentity> {
  if (!idToken || typeof idToken !== "string") throw new GoogleIdTokenError("missing id_token");
  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(idToken, opts.jwks ?? defaultJwks(), {
      issuer: GOOGLE_ISSUERS,
      audience: opts.clientId,
      algorithms: ["RS256"],
      clockTolerance: 60,
      ...(opts.now ? { currentDate: opts.now } : {}),
    });
    payload = result.payload as Record<string, unknown>;
  } catch (err) {
    throw new GoogleIdTokenError(err instanceof Error ? err.name : "verification failed");
  }
  if (typeof payload.nonce !== "string" || !safeEqualStr(payload.nonce, opts.nonce)) {
    throw new GoogleIdTokenError("nonce mismatch");
  }
  if (typeof payload.sub !== "string" || !payload.sub) throw new GoogleIdTokenError("missing sub");
  if (typeof payload.email !== "string" || !payload.email) throw new GoogleIdTokenError("missing email");
  // Google sends a boolean; tolerate the string form some libraries emit, but never default to true.
  if (payload.email_verified !== true && payload.email_verified !== "true") {
    throw new GoogleIdTokenError("email not verified");
  }
  return {
    sub: payload.sub,
    email: payload.email.trim().toLowerCase(),
    emailVerified: true,
    ...(typeof payload.name === "string" ? { name: payload.name } : {}),
    ...(typeof payload.picture === "string" ? { picture: payload.picture } : {}),
  };
}

export type AdminGoogleDecision =
  | { action: "login"; userId: number }
  | { action: "link_required" }
  | { action: "denied" };

export type AdminGoogleLookups<U extends { id: number; status?: string | null }> = {
  getUserByGoogleId(sub: string): U | undefined;
  getUserByEmailInsensitive(email: string): U | undefined;
  /** live admin check (userIsAdminNow) */
  isAdminNow(user: U): boolean;
  /** shared system mailboxes can never be signed into as a person */
  isSystemAccount?(user: U): boolean;
};

/**
 * Admin-intent policy. Never creates accounts, never grants admin from Google alone,
 * never silently links an unlinked account by email.
 *  - google_id match + currently admin -> login
 *  - google_id match but not admin -> denied
 *  - no google_id match, verified email matches an existing admin -> link_required
 *  - everything else (non-admin email, unknown email) -> denied (indistinguishable)
 */
export function decideAdminGoogleLogin<U extends { id: number; status?: string | null; googleId?: string | null }>(
  identity: Pick<VerifiedGoogleIdentity, "sub" | "email">,
  lookups: AdminGoogleLookups<U>,
): AdminGoogleDecision {
  const usable = (u: U | undefined): u is U =>
    !!u && u.status !== "deleted" && !(lookups.isSystemAccount?.(u));
  const byGoogle = lookups.getUserByGoogleId(identity.sub);
  if (byGoogle) {
    return usable(byGoogle) && lookups.isAdminNow(byGoogle)
      ? { action: "login", userId: byGoogle.id }
      : { action: "denied" };
  }
  const byEmail = lookups.getUserByEmailInsensitive(identity.email);
  if (usable(byEmail) && lookups.isAdminNow(byEmail)) {
    // An account already linked to a *different* Google identity must not be relinked.
    return byEmail.googleId ? { action: "denied" } : { action: "link_required" };
  }
  return { action: "denied" };
}

/** Unverified peek at the intent claim, used only to choose which friendly page to show on failure. */
export function peekStateIntent(state: string): GoogleIntent {
  try {
    const body = state.slice(0, state.lastIndexOf("."));
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { i?: string };
    return data.i === "admin" ? "admin" : "member";
  } catch {
    return "member";
  }
}

export const ADMIN_GOOGLE_ERRORS = ["cancelled", "expired", "unauthorized", "link_required", "failed", "unavailable"] as const;
export type AdminGoogleError = (typeof ADMIN_GOOGLE_ERRORS)[number];

/** Safe return paths for Google sign-in: /map (existing) and /admin (admin intent / link-back). */
export function adminErrorRedirect(code: AdminGoogleError): string {
  return `/admin?google_error=${code}`;
}
