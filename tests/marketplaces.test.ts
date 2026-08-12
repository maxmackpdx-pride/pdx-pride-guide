import { describe, expect, it } from "vitest";
import { housingDisplayName, stripHausSuffix, withinHousingBounds } from "../shared/housing";
import { normalizeHousingTags, housingTagsConflict } from "../shared/housingTags";
import { insertGiftingInterestSchema, insertGiftingPostSchema } from "../shared/schema";

describe("gifting and housing workflows", () => {
  it("stores the locked HAÜS suffix exactly once", () => {
    expect(stripHausSuffix("Chosen Family Haus")).toBe("Chosen Family");
    expect(housingDisplayName("FORMING", "Chosen Family HAÜS")).toBe("Chosen Family HAÜS");
    expect(housingDisplayName("MANAGED", "Rose Apartments")).toBe("Rose Apartments");
  });

  it("enforces housing geography and tag compatibility", () => {
    expect(withinHousingBounds(45.52, -122.68)).toBe(true);
    expect(withinHousingBounds(47.61, -122.33)).toBe(false);
    expect(housingTagsConflict("cats-welcome", "no-pets")).toBe(true);
    expect(normalizeHousingTags(["cats-welcome", "no-pets", "unknown"], "OFFERING")).not.toContain("unknown");
  });

  it("validates gifting posts and interest state at the schema boundary", () => {
    expect(insertGiftingPostSchema.safeParse({ userId: 1, postType: "GIFT", title: "Free lamp", description: "Works", category: "HOME", neighborhood: "Buckman", pickupPreference: "PORCH", photoUrls: "[]" }).success).toBe(true);
    expect(insertGiftingInterestSchema.safeParse({ postId: 1, userId: 2, note: "Interested" }).success).toBe(true);
  });
});
