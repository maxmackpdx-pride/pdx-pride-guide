import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet } from "jose";
import {
  GOOGLE_OAUTH_STATE_MAX_MS,
  buildAuthorizationUrl,
  createSignedState,
  decideAdminGoogleLogin,
  deriveNonce,
  derivePkce,
  parseSignedState,
  peekStateIntent,
  verifyGoogleIdToken,
} from "./googleAuth";

const SECRET = "test-only-secret-not-used-anywhere";
const CLIENT_ID = "123-test.apps.googleusercontent.com";

// ── state ────────────────────────────────────────────────────────────────────
test("signed state round-trips intent, link user and return path", () => {
  const state = createSignedState(SECRET, { intent: "admin", returnTo: "/admin" });
  const parsed = parseSignedState(SECRET, state);
  assert.equal(parsed?.intent, "admin");
  assert.equal(parsed?.returnTo, "/admin");
  assert.ok(parsed?.nonceId && parsed.nonceId.length >= 32);
  const link = parseSignedState(SECRET, createSignedState(SECRET, { linkUserId: 7 }));
  assert.equal(link?.linkUserId, 7);
  assert.equal(link?.intent, "member");
});

test("state is rejected when tampered, signed with another secret, expired, from the future or malformed", () => {
  const state = createSignedState(SECRET, { intent: "member" });
  const [body, sig] = state.split(".");
  // Flip intent to admin without re-signing
  const forgedBody = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), i: "admin" })).toString("base64url");
  assert.equal(parseSignedState(SECRET, `${forgedBody}.${sig}`), null);
  assert.equal(parseSignedState("another-secret", state), null);
  assert.equal(parseSignedState(SECRET, ""), null);
  assert.equal(parseSignedState(SECRET, "no-dot"), null);
  assert.equal(parseSignedState("", state), null);
  const now = Date.now();
  const old = createSignedState(SECRET, {}, now - GOOGLE_OAUTH_STATE_MAX_MS - 1000);
  assert.equal(parseSignedState(SECRET, old, now), null);
  const future = createSignedState(SECRET, {}, now + 10 * 60_000);
  assert.equal(parseSignedState(SECRET, future, now), null);
  assert.ok(parseSignedState(SECRET, createSignedState(SECRET, {}, now - 60_000), now));
});

test("peekStateIntent only hints; it never throws on garbage", () => {
  assert.equal(peekStateIntent(createSignedState(SECRET, { intent: "admin" })), "admin");
  assert.equal(peekStateIntent(createSignedState(SECRET, {})), "member");
  assert.equal(peekStateIntent("%%%garbage"), "member");
  assert.equal(peekStateIntent(""), "member");
});

// ── PKCE + nonce ─────────────────────────────────────────────────────────────
test("PKCE challenge is S256(verifier), verifier is RFC 7636 compliant and per-attempt", () => {
  const a = derivePkce(SECRET, "attempt-a");
  const b = derivePkce(SECRET, "attempt-b");
  assert.equal(a.method, "S256");
  assert.match(a.verifier, /^[A-Za-z0-9_-]{43,128}$/);
  assert.equal(a.challenge, crypto.createHash("sha256").update(a.verifier).digest("base64url"));
  assert.notEqual(a.verifier, b.verifier);
  assert.equal(derivePkce(SECRET, "attempt-a").verifier, a.verifier, "deterministic so the callback can recompute it");
  assert.notEqual(derivePkce("other", "attempt-a").verifier, a.verifier, "needs the server secret");
  assert.notEqual(a.verifier, deriveNonce(SECRET, "attempt-a"), "verifier and nonce are independent values");
});

test("authorization URL carries code_challenge S256, state, nonce and openid scope", () => {
  const state = createSignedState(SECRET, { intent: "admin" });
  const { nonceId } = parseSignedState(SECRET, state)!;
  const url = new URL(buildAuthorizationUrl({
    clientId: CLIENT_ID,
    redirectUri: "https://www.zaylist.com/api/auth/google/callback",
    state,
    nonce: deriveNonce(SECRET, nonceId),
    codeChallenge: derivePkce(SECRET, nonceId).challenge,
  }));
  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("code_challenge"), derivePkce(SECRET, nonceId).challenge);
  assert.equal(url.searchParams.get("state"), state);
  assert.equal(url.searchParams.get("nonce"), deriveNonce(SECRET, nonceId));
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("scope"), "openid email profile");
  assert.equal(url.searchParams.get("client_id"), CLIENT_ID);
  assert.ok(!url.search.includes(derivePkce(SECRET, nonceId).verifier), "verifier never appears in the URL");
});

// ── ID token verification ────────────────────────────────────────────────────
async function tokenFixture() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256", use: "sig" };
  const jwks = createLocalJWKSet({ keys: [jwk] });
  const sign = (claims: Record<string, unknown>, opts: { iss?: string; aud?: string; exp?: number | string; key?: CryptoKey } = {}) => {
    let jwt = new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuedAt()
      .setIssuer(opts.iss ?? "https://accounts.google.com")
      .setAudience(opts.aud ?? CLIENT_ID);
    jwt = jwt.setExpirationTime(opts.exp ?? "5m");
    return jwt.sign(opts.key ?? privateKey);
  };
  return { jwks, sign };
}
const nonce = deriveNonce(SECRET, "attempt-1");
const good = { sub: "1122334455", email: "Admin@Example.com", email_verified: true, nonce, name: "A Dmin" };

test("valid ID token yields a normalized verified identity", async () => {
  const { jwks, sign } = await tokenFixture();
  const id = await verifyGoogleIdToken(await sign(good), { clientId: CLIENT_ID, nonce, jwks });
  assert.equal(id.sub, "1122334455");
  assert.equal(id.email, "admin@example.com");
  assert.equal(id.emailVerified, true);
});

test("accepts the bare accounts.google.com issuer form", async () => {
  const { jwks, sign } = await tokenFixture();
  await verifyGoogleIdToken(await sign(good, { iss: "accounts.google.com" }), { clientId: CLIENT_ID, nonce, jwks });
});

test("ID token is rejected for wrong audience, issuer, expiry, nonce, signature, algorithm and unverified email", async () => {
  const { jwks, sign } = await tokenFixture();
  const other = await generateKeyPair("RS256");
  const reject = (token: string | Promise<string>, n = nonce) =>
    Promise.resolve(token).then(t => assert.rejects(verifyGoogleIdToken(t, { clientId: CLIENT_ID, nonce: n, jwks }), /Google ID token rejected/));
  await reject(sign(good, { aud: "someone-else.apps.googleusercontent.com" }));
  await reject(sign(good, { iss: "https://evil.example.com" }));
  await reject(sign(good, { exp: Math.floor(Date.now() / 1000) - 600 }));
  await reject(sign({ ...good, nonce: "replayed-nonce" }));
  await reject(sign({ ...good, nonce: undefined }));
  await reject(sign(good), deriveNonce(SECRET, "attempt-2"));
  await reject(sign(good, { key: other.privateKey }));
  await reject(sign({ ...good, email_verified: false }));
  await reject(sign({ ...good, email_verified: undefined }));
  await reject(sign({ ...good, sub: undefined }));
  await reject(sign({ ...good, email: undefined }));
  await reject("");
  await reject("not.a.jwt");
  // alg=none / unsigned token
  const unsigned = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(JSON.stringify({ ...good, iss: "https://accounts.google.com", aud: CLIENT_ID, exp: Math.floor(Date.now() / 1000) + 300 })).toString("base64url")}.`;
  await reject(unsigned);
});

// ── admin-intent authorization ───────────────────────────────────────────────
type U = { id: number; email: string; googleId: string | null; status?: string; admin: boolean; system?: boolean };
function lookups(users: U[]) {
  return {
    getUserByGoogleId: (sub: string) => users.find(u => u.googleId === sub),
    getUserByEmailInsensitive: (email: string) => users.find(u => u.email.toLowerCase() === email),
    isAdminNow: (u: U) => u.admin,
    isSystemAccount: (u: U) => !!u.system,
  };
}
const id = (sub: string, email: string) => ({ sub, email });

test("admin intent: linked Google account of a current admin signs in", () => {
  const l = lookups([{ id: 1, email: "owner@example.com", googleId: "g-owner", admin: true }]);
  assert.deepEqual(decideAdminGoogleLogin(id("g-owner", "whatever@example.com"), l), { action: "login", userId: 1 });
});

test("admin intent: unauthorized Google accounts are denied", () => {
  const l = lookups([
    { id: 1, email: "owner@example.com", googleId: "g-owner", admin: true },
    { id: 2, email: "member@example.com", googleId: "g-member", admin: false },
    { id: 3, email: "member2@example.com", googleId: null, admin: false },
  ]);
  assert.deepEqual(decideAdminGoogleLogin(id("g-member", "member@example.com"), l), { action: "denied" }, "linked non-admin");
  assert.deepEqual(decideAdminGoogleLogin(id("g-new", "member2@example.com"), l), { action: "denied" }, "email matches non-admin");
  assert.deepEqual(decideAdminGoogleLogin(id("g-stranger", "stranger@example.com"), l), { action: "denied" }, "unknown account: never created");
});

test("admin intent: demoted admin with linked Google is denied (live admin check)", () => {
  const users: U[] = [{ id: 1, email: "owner@example.com", googleId: "g-owner", admin: true }];
  assert.equal(decideAdminGoogleLogin(id("g-owner", "owner@example.com"), lookups(users)).action, "login");
  users[0].admin = false;
  assert.equal(decideAdminGoogleLogin(id("g-owner", "owner@example.com"), lookups(users)).action, "denied");
});

test("admin intent: unlinked admin matched only by email must link first, never silently signs in", () => {
  const l = lookups([{ id: 1, email: "Owner@Example.com", googleId: null, admin: true }]);
  assert.deepEqual(decideAdminGoogleLogin(id("g-new", "owner@example.com"), l), { action: "link_required" });
});

test("admin intent: admin already linked to a different Google identity is not relinked or signed in by email", () => {
  const l = lookups([{ id: 1, email: "owner@example.com", googleId: "g-real-owner", admin: true }]);
  assert.deepEqual(decideAdminGoogleLogin(id("g-attacker", "owner@example.com"), l), { action: "denied" });
});

test("admin intent: deleted and system accounts are denied", () => {
  const l = lookups([
    { id: 1, email: "gone@example.com", googleId: "g-gone", admin: true, status: "deleted" },
    { id: 2, email: "guide@example.com", googleId: null, admin: true, system: true },
  ]);
  assert.deepEqual(decideAdminGoogleLogin(id("g-gone", "gone@example.com"), l), { action: "denied" });
  assert.deepEqual(decideAdminGoogleLogin(id("g-x", "guide@example.com"), l), { action: "denied" });
});
