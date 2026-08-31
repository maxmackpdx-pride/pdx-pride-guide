import { z } from "zod";

export const PLATFORM_API_VERSION = "1.0" as const;
export const platformObjectTypes = ["event", "community", "listing", "gig", "place", "guide", "profile", "organization", "media"] as const;
export const platformObjectTypeSchema = z.enum(platformObjectTypes);
export type PlatformObjectType = z.infer<typeof platformObjectTypeSchema>;

export const typedIdPrefixes: Record<PlatformObjectType, string> = {
  event: "evt", community: "com", listing: "lst", gig: "gig", place: "plc",
  guide: "gui", profile: "prf", organization: "org", media: "med",
};

export const typedIdSchema = z.string().regex(/^(evt|com|lst|gig|plc|gui|prf|org|med)_[A-Za-z0-9][A-Za-z0-9._~-]*$/);
export function platformId(type: PlatformObjectType, sourceId: string | number) {
  const raw = String(sourceId);
  if (raw.startsWith(`${typedIdPrefixes[type]}_`)) return raw;
  return `${typedIdPrefixes[type]}_${raw.replace(/[^A-Za-z0-9._~-]/g, "-")}`;
}
export function parsePlatformId(value: string): { type: PlatformObjectType; sourceId: string } | null {
  const match = /^(evt|com|lst|gig|plc|gui|prf|org|med)_(.+)$/.exec(value);
  if (!match) return null;
  const type = (Object.entries(typedIdPrefixes).find(([, prefix]) => prefix === match[1])?.[0] || null) as PlatformObjectType | null;
  return type ? { type, sourceId: match[2] } : null;
}

export const platformRelationshipSchema = z.object({
  type: z.string(), from: typedIdSchema, to: typedIdSchema,
  createdAt: z.string().nullable().optional(),
});

const base = z.object({
  id: typedIdSchema, type: platformObjectTypeSchema, name: z.string(),
  summary: z.string().nullable(), url: z.string(), imageUrl: z.string().nullable(),
  visibility: z.enum(["public", "discoverable", "restricted", "private"]),
  status: z.string(), sourceId: z.union([z.string(), z.number()]),
  createdAt: z.string().nullable(), updatedAt: z.string().nullable(),
  capabilities: z.array(z.string()),
});

export const eventObjectSchema = base.extend({ type: z.literal("event"), startsAt: z.string(), endsAt: z.string(), venueName: z.string(), neighborhood: z.string().nullable() });
export const communityObjectSchema = base.extend({ type: z.literal("community"), slug: z.string(), memberCount: z.number(), membershipPolicy: z.string(), viewerRole: z.string().nullable() });
export const listingObjectSchema = base.extend({ type: z.literal("listing"), priceCents: z.number(), neighborhood: z.string().nullable(), category: z.string() });
export const gigObjectSchema = base.extend({ type: z.literal("gig"), postType: z.string(), location: z.string().nullable(), compensation: z.string().nullable() });
export const placeObjectSchema = base.extend({ type: z.literal("place"), placeType: z.string(), neighborhood: z.string().nullable(), address: z.string().nullable() });
export const guideObjectSchema = base.extend({ type: z.literal("guide"), slug: z.string() });
export const profileObjectSchema = base.extend({ type: z.literal("profile"), username: z.string() });
export const organizationObjectSchema = base.extend({ type: z.literal("organization"), organizationType: z.string(), neighborhood: z.string().nullable() });
export const mediaObjectSchema = base.extend({ type: z.literal("media"), mediaType: z.enum(["image"]), ownerId: typedIdSchema });
export const platformObjectSchema = z.discriminatedUnion("type", [eventObjectSchema, communityObjectSchema, listingObjectSchema, gigObjectSchema, placeObjectSchema, guideObjectSchema, profileObjectSchema, organizationObjectSchema, mediaObjectSchema]);
export type PlatformObject = z.infer<typeof platformObjectSchema>;

export const platformErrorSchema = z.object({ apiVersion: z.literal(PLATFORM_API_VERSION), requestId: z.string(), error: z.object({ code: z.string(), message: z.string(), status: z.number(), details: z.unknown().optional() }) });
export const platformEnvelopeSchema = z.object({ apiVersion: z.literal(PLATFORM_API_VERSION), requestId: z.string(), data: z.unknown(), meta: z.record(z.string(), z.unknown()).optional() });

export const platformSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(200),
  types: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().max(500).optional(),
}).strict();
export const platformListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().max(500).optional(),
}).strict();
