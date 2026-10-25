import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_GOOGLE_ERROR_MESSAGES,
  ADMIN_GOOGLE_START_URL,
  readGoogleAdminError,
  stashApprovalSignature,
  takeApprovalSignature,
} from "./adminGoogle";

function memoryStore() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

test("approval signature survives the redirect once, then is cleared", () => {
  const store = memoryStore();
  stashApprovalSignature("  Tucker  ", store);
  assert.equal(takeApprovalSignature(store), "Tucker");
  assert.equal(takeApprovalSignature(store), null);
});

test("empty signature is not stashed and blocked storage never throws", () => {
  const store = memoryStore();
  stashApprovalSignature("   ", store);
  assert.equal(takeApprovalSignature(store), null);
  assert.doesNotThrow(() => stashApprovalSignature("x", null));
  assert.equal(takeApprovalSignature(null), null);
  const broken = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); }, removeItem() { throw new Error("denied"); } };
  assert.doesNotThrow(() => stashApprovalSignature("x", broken));
  assert.equal(takeApprovalSignature(broken), null);
});

test("only known google_error codes are shown", () => {
  for (const code of Object.keys(ADMIN_GOOGLE_ERROR_MESSAGES)) assert.equal(readGoogleAdminError(`?tab=team&google_error=${code}`), code);
  assert.equal(readGoogleAdminError("?google_error=<script>"), null);
  assert.equal(readGoogleAdminError("?google_error=toString"), null);
  assert.equal(readGoogleAdminError(""), null);
});

test("admin start URL requests admin intent and returns to /admin", () => {
  const url = new URL(ADMIN_GOOGLE_START_URL, "https://www.zaylist.com");
  assert.equal(url.pathname, "/api/auth/google");
  assert.equal(url.searchParams.get("intent"), "admin");
  assert.equal(url.searchParams.get("returnTo"), "/admin");
});
