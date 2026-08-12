import { describe, expect, it, vi } from "vitest";
import { isModerationActive, untilIsoFromHours } from "../shared/accountModeration";
import { validateGigPostContent } from "../shared/boardModeration";
import { moderateContent } from "../shared/contentModeration";

describe("moderation and safety", () => {
  it("keeps sex-positive community language allowed", () => {
    expect(moderateContent("A sex-positive leather community workshop").verdict).toBe("ALLOW");
  });

  it("blocks threats and weapon sales", () => {
    expect(moderateContent("selling my handgun tonight").verdict).toBe("BLOCK");
    expect(moderateContent("I will shoot you").verdict).toBe("BLOCK");
  });

  it("keeps Gigz work-focused", () => {
    expect(validateGigPostContent({ title: "Seeking a DJ", description: "Paid four-hour set" })).toBeNull();
    expect(validateGigPostContent({ title: "Looking for a hookup" })).toContain("work and gigs only");
  });

  it("expires timed account moderation", () => {
    vi.setSystemTime(new Date("2026-08-12T12:00:00Z"));
    expect(isModerationActive(true, "2026-08-12T11:59:59Z")).toBe(false);
    expect(isModerationActive(true, untilIsoFromHours(1))).toBe(true);
    vi.useRealTimers();
  });
});
