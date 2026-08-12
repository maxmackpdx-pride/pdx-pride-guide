import { describe, expect, it } from "vitest";
import { authenticatedRequestAccess } from "../server/auth/access";

describe("authorization boundaries", () => {
  it("rejects missing, unknown, and deleted sessions", () => {
    expect(authenticatedRequestAccess({}).allowed).toBe(false);
    expect(authenticatedRequestAccess({ sessionUserId: 9, user: null })).toMatchObject({ allowed: false, status: 401 });
    expect(authenticatedRequestAccess({ sessionUserId: 9, user: { status: "deleted" } })).toMatchObject({ allowed: false, status: 401 });
  });

  it("allows an active signed-in member", () => {
    expect(authenticatedRequestAccess({ sessionUserId: 9, user: { status: "active" }, method: "POST", path: "/api/messages" })).toEqual({ allowed: true });
  });

  it("blocks suspended-account writes while preserving status and appeal access", () => {
    const user = { status: "suspended", suspendReasonLabel: "Safety concern", suspendUntil: "2026-09-01T00:00:00Z" };
    expect(authenticatedRequestAccess({ sessionUserId: 9, user, method: "POST", path: "/api/messages" })).toMatchObject({ allowed: false, status: 403, body: { suspended: true } });
    expect(authenticatedRequestAccess({ sessionUserId: 9, user, method: "GET", path: "/api/events" }).allowed).toBe(true);
    expect(authenticatedRequestAccess({ sessionUserId: 9, user, method: "POST", path: "/api/auth/suspension-appeal" }).allowed).toBe(true);
  });
});
