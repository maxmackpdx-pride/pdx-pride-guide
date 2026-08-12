import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashPassword, isLegacyPasswordHash, verifyPassword } from "../server/auth/passwords";
import { COMMUNITY_STANDARDS_VERSION, userHasCurrentCommunityStandards } from "../shared/communityStandards";
import { normalizeUsername } from "../shared/username";

describe("authentication and sessions", () => {
  it("uses salted scrypt hashes and rejects the wrong password", () => {
    const first = hashPassword("correct horse battery staple");
    const second = hashPassword("correct horse battery staple");
    expect(first).not.toBe(second);
    expect(verifyPassword("correct horse battery staple", first)).toBe(true);
    expect(verifyPassword("wrong", first)).toBe(false);
    expect(isLegacyPasswordHash(first)).toBe(false);
  });

  it("still verifies legacy hashes so login can migrate them", () => {
    const legacy = crypto.createHash("sha256").update("old-passwordpdxpride_salt").digest("hex");
    expect(isLegacyPasswordHash(legacy)).toBe(true);
    expect(verifyPassword("old-password", legacy)).toBe(true);
  });

  it("normalizes valid handles and rejects unsafe usernames", () => {
    expect(normalizeUsername("  @Pride.Member  ")).toBe("pridemember");
    expect(normalizeUsername("ab")).toBeNull();
    expect(normalizeUsername("<script>")).toBe("script");
    expect(normalizeUsername("🔥🔥🔥")).toBeNull();
  });

  it("requires both an agreement timestamp and the current standards version", () => {
    expect(userHasCurrentCommunityStandards({ communityStandardsAgreedAt: new Date().toISOString(), communityStandardsVersion: COMMUNITY_STANDARDS_VERSION })).toBe(true);
    expect(userHasCurrentCommunityStandards({ communityStandardsAgreedAt: new Date().toISOString(), communityStandardsVersion: "old" })).toBe(false);
  });
});
