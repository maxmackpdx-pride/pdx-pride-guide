import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Events
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  venueName: text("venue_name").notNull(),
  address: text("address"),
  neighborhood: text("neighborhood"),
  lat: real("lat"),
  lng: real("lng"),
  dateStart: text("date_start").notNull(),
  dateEnd: text("date_end").notNull(),
  dayOfWeek: text("day_of_week"),
  ageRequirement: text("age_requirement").notNull().default("ALL_AGES"),
  eventTypes: text("event_types").notNull().default("[]"),
  admission: text("admission").notNull().default("FREE"),
  ticketUrl: text("ticket_url"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(false),
  isHouseParty: integer("is_house_party", { mode: "boolean" }).notNull().default(false),
  isSexPositive: integer("is_sex_positive", { mode: "boolean" }).notNull().default(false),
  nudityOk: integer("nudity_ok", { mode: "boolean" }).notNull().default(false),
  posterImageUrl: text("poster_image_url"),
  /** Default HIDDEN so a forgotten status never silently publishes (ingest/admin set LIVE explicitly). */
  status: text("status").notNull().default("HIDDEN"),
  source: text("source").notNull().default("admin_seeded"),
  isClaimable: integer("is_claimable", { mode: "boolean" }).notNull().default(false),
  claimedBy: text("claimed_by"),
  submittedBy: text("submitted_by"),
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(""),
  /** ISO timestamp; set on create (same as createdAt) and bumped on every updateEvent. */
  updatedAt: text("updated_at").notNull().default(""),
  /**
   * JSON array of field names a human edited by hand, e.g. `["title","admission"]`.
   * A trusted-venue resync skips every locked field, so an admin or host fix is
   * never reverted. Claimed events get the same protection from `claimedBy`;
   * this covers the unclaimed case, which has no owner to read.
   */
  lockedFields: text("locked_fields").notNull().default("[]"),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Submissions (user-submitted events awaiting approval)
export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull().default("NEW_EVENT"), // NEW_EVENT | CLAIM | EDIT
  eventId: integer("event_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  venueName: text("venue_name").notNull(),
  address: text("address"),
  neighborhood: text("neighborhood"),
  lat: real("lat"),
  lng: real("lng"),
  dateStart: text("date_start").notNull(),
  dateEnd: text("date_end").notNull(),
  dayOfWeek: text("day_of_week"),
  ageRequirement: text("age_requirement").notNull().default("ALL_AGES"),
  eventTypes: text("event_types").notNull().default("[]"),
  admission: text("admission").notNull().default("FREE"),
  ticketUrl: text("ticket_url"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(false),
  isHouseParty: integer("is_house_party", { mode: "boolean" }).notNull().default(false),
  isSexPositive: integer("is_sex_positive", { mode: "boolean" }).notNull().default(false),
  nudityOk: integer("nudity_ok", { mode: "boolean" }).notNull().default(false),
  posterImageUrl: text("poster_image_url"),
  submitterName: text("submitter_name").notNull(),
  submitterEmail: text("submitter_email").notNull(),
  submitterOrg: text("submitter_org"),
  claimReason: text("claim_reason"),
  status: text("status").notNull().default("PENDING"),
  adminNotes: text("admin_notes"),
  approvals: text("approvals").notNull().default("[]"),
  createdAt: text("created_at").notNull().default(""),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, createdAt: true, approvals: true, status: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

// Gig posts (GIGZ)
export const gigPosts = sqliteTable("gig_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postType: text("post_type").notNull().default("POSTING_GIG"), // LOOKING_FOR_WORK | POSTING_GIG
  title: text("title").notNull(),
  name: text("name").notNull(),
  contactEmail: text("contact_email").notNull(),
  description: text("description").notNull(),
  skills: text("skills"),
  compensation: text("compensation"),
  location: text("location"),
  isRemote: integer("is_remote", { mode: "boolean" }).default(false),
  status: text("status").notNull().default("PENDING"),
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(""),
  userId: integer("user_id"),
  imageUrl: text("image_url"),
  gigDate: text("gig_date"),
  gigTime: text("gig_time"),
  businessId: integer("business_id"),
});

export const insertGigPostSchema = createInsertSchema(gigPosts).omit({ id: true, createdAt: true, status: true });
export type InsertGigPost = z.infer<typeof insertGigPostSchema>;
export type GigPost = typeof gigPosts.$inferSelect;

// LGBTQ+ Business Directory
export const businesses = sqliteTable("businesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull().default("bar"), // bar|restaurant|cafe|venue|service|shop|hotel|nonprofit|healthcare|realestate|group|campground
  description: text("description").notNull(),
  address: text("address"),
  neighborhood: text("neighborhood"),
  website: text("website"),
  instagram: text("instagram"),
  donateUrl: text("donate_url"),
  queerOwned: integer("queer_owned", { mode: "boolean" }).notNull().default(false),
  queerFriendly: integer("queer_friendly", { mode: "boolean" }).notNull().default(true),
  imageUrl: text("image_url"),
  lat: real("lat"),
  lng: real("lng"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  /**
   * Place lifecycle: OPEN (default) | CLOSED.
   * CLOSED places stay in DB for historical event linkage but must set active=false
   * so they drop from discovery, directory auto-ingest, and SEO place pages.
   */
  status: text("status").notNull().default("OPEN"),
  /** YYYY-MM-DD doors-closed day when status is CLOSED. */
  closedAt: text("closed_at"),
  /** Legacy flag; do not use alone for UI. Prefer grandOpeningDate. */
  isNew: integer("is_new", { mode: "boolean" }).notNull().default(false),
  /** Verified doors-open day (YYYY-MM-DD). Required for Grand Opening chrome. */
  grandOpeningDate: text("grand_opening_date"),
  hours: text("hours"),
  phone: text("phone"),
  /**
   * Optional JSON array of storefronts for multi-location brands.
   * Shape: BusinessLocation[] from @shared/businessLocations.
   * When null, resolveBusinessLocations falls back to known chains or primary address.
   */
  locations: text("locations"),
  ownerId: integer("owner_id"),
  createdAt: text("created_at").notNull().default(""),
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({ id: true, createdAt: true });
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

// Promoter accounts (session-based, simple)
export const promoters = sqliteTable("promoters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  org: text("org"),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("active"), // active | suspended
  createdAt: text("created_at").notNull().default(""),
});

export const insertPromoterSchema = createInsertSchema(promoters).omit({ id: true, createdAt: true, status: true });
export type InsertPromoter = z.infer<typeof insertPromoterSchema>;
export type Promoter = typeof promoters.$inferSelect;

// Moderation requests (claim or remove)
export const moderationRequests = sqliteTable("moderation_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // CLAIM | REMOVE
  eventId: integer("event_id").notNull(),
  eventTitle: text("event_title").notNull(),
  requesterName: text("requester_name").notNull(),
  requesterEmail: text("requester_email").notNull(),
  proof: text("proof").notNull(), // free text: their stated proof
  status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(""),
});

export const insertModerationRequestSchema = createInsertSchema(moderationRequests).omit({ id: true, createdAt: true, status: true, adminNotes: true });
export type InsertModerationRequest = z.infer<typeof insertModerationRequestSchema>;
export type ModerationRequest = typeof moderationRequests.$inferSelect;

// Business ownership claims (existing venue) - mirrors the event CLAIM flow in `submissions`
export const businessClaims = sqliteTable("business_claims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").notNull(),
  userId: integer("user_id").notNull(),
  claimReason: text("claim_reason").notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(""),
});
export type BusinessClaim = typeof businessClaims.$inferSelect;

// New-business submissions (address doesn't match any existing directory venue)
export const businessSubmissions = sqliteTable("business_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("bar"),
  description: text("description").notNull(),
  address: text("address"),
  neighborhood: text("neighborhood"),
  hours: text("hours"),
  phone: text("phone"),
  website: text("website"),
  instagram: text("instagram"),
  logoImageUrl: text("logo_image_url"), // candidate upload, held for admin conversion
  status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED
  adminNotes: text("admin_notes"),
  createdBusinessId: integer("created_business_id"), // set once approved
  createdAt: text("created_at").notNull().default(""),
});
export type BusinessSubmission = typeof businessSubmissions.$inferSelect;

// Per-venue promoter blocklist
export const businessBlocks = sqliteTable("business_blocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").notNull(),
  blockedUserId: integer("blocked_user_id").notNull(),
  createdByUserId: integer("created_by_user_id"),
  createdAt: text("created_at").notNull().default(""),
});
export type BusinessBlock = typeof businessBlocks.$inferSelect;

// Owner-submitted logo candidates, held for Tucker's manual conversion before going live
export const businessLogoRequests = sqliteTable("business_logo_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").notNull(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(), // candidate upload
  status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(""),
});
export type BusinessLogoRequest = typeof businessLogoRequests.$inferSelect;

/** Attendance identity privacy: public = anyone RSVPed sees you; friends = mutual follow graph; anonymous = vibe only. */
export type AttendanceVisibility = "public" | "friends" | "anonymous";

// Attendance (Hey I'll Be There)
export const attendances = sqliteTable("attendances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id"),
  handle: text("handle").notNull(), // display name / handle
  message: text("message").notNull(), // chosen speech bubble
  avatarSeed: text("avatar_seed").notNull(), // seed for deterministic avatar color/initials
  photoUrl: text("photo_url"),
  isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
  /** public | friends | anonymous — is_anonymous kept in sync (anonymous → 1). */
  visibility: text("visibility").notNull().default("public"),
  expiresAt: text("expires_at"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(""),
});

export const eventChatMessages = sqliteTable("event_chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  body: text("body").notNull(),
  isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(""),
});
export type EventChatMessage = typeof eventChatMessages.$inferSelect;

export const insertAttendanceSchema = createInsertSchema(attendances).omit({ id: true, createdAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendances.$inferSelect;

// Users
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  avatarChoice: integer("avatar_choice").default(1), // 1-6
  avatarRing: text("avatar_ring").default("none"),
  avatarCrop: text("avatar_crop"),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  pronouns: text("pronouns"),
  location: text("location"),
  socialLinks: text("social_links"), // JSON object keyed by platform
  profileEmbeds: text("profile_embeds"), // JSON array of {id,src,title}
  profilePhotos: text("profile_photos"), // JSON array of {url,caption}
  talents: text("talents"), // JSON string[] - skills/roles the profile owner offers
  standFor: text("stand_for"), // JSON string[] - promoter-only "what we stand for" checklist
  affiliatedVenueIds: text("affiliated_venue_ids"), // JSON number[] - "Resident at" venues (business ids)
  marquee: text("marquee"), // JSON {items:string[],speed:number,color:string} | null - promoter-only ticker
  top8: text("top8"), // JSON [{k:"u"|"b",id:number}] | null - MySpace-style Top 8 (people + venues)
  accentColor: text("accent_color"), // hex from the fixed neon allowlist, or null for the site default
  banner: text("banner"), // 'accent-gradient' | 'neon-collage' | 'sticker-wall' | 'pride-guide-social'
  coverImageUrl: text("cover_image_url"),
  coverCrop: text("cover_crop"),
  pup: text("pup"), // JSON {name,hood,role,lookingFor} | null - member-only, opt-in pup identity
  googleId: text("google_id").unique(),
  status: text("status").notNull().default("active"),
  promoterStatus: text("promoter_status").notNull().default("none"), // none | pending | approved | rejected
  subAdmin: integer("sub_admin", { mode: "boolean" }).default(false),
  usernameChangedAt: text("username_changed_at"),
  /** COMMUNITY_STANDARDS_VERSION the user last agreed to (null = never). */
  communityStandardsVersion: text("community_standards_version"),
  communityStandardsAgreedAt: text("community_standards_agreed_at"),
  communityStandardsDeclinedAt: text("community_standards_declined_at"),
  // Account moderation (status: active | suspended | deleted)
  suspendReasonCode: text("suspend_reason_code"),
  suspendReasonLabel: text("suspend_reason_label"),
  suspendNote: text("suspend_note"),
  suspendUntil: text("suspend_until"),
  suspendedAt: text("suspended_at"),
  suspendedByUserId: integer("suspended_by_user_id"),
  shadowBanned: integer("shadow_banned", { mode: "boolean" }).default(false),
  shadowBanReasonCode: text("shadow_ban_reason_code"),
  shadowBanReasonLabel: text("shadow_ban_reason_label"),
  shadowBanNote: text("shadow_ban_note"),
  shadowBanUntil: text("shadow_ban_until"),
  shadowBannedAt: text("shadow_banned_at"),
  shadowBannedByUserId: integer("shadow_banned_by_user_id"),
  createdAt: text("created_at").notNull().default(""),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, status: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Follows (member profile follower graph)
export const follows = sqliteTable("follows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  followerUserId: integer("follower_user_id").notNull(),
  followingUserId: integer("following_user_id").notNull(),
  createdAt: text("created_at").notNull().default(""),
});
export type Follow = typeof follows.$inferSelect;

// Explicit safety blocks. Separate from follow_blocks, which records unfollows.
export const memberBlocks = sqliteTable("member_blocks", {
  blockerUserId: integer("blocker_user_id").notNull(),
  blockedUserId: integer("blocked_user_id").notNull(),
  createdAt: text("created_at").notNull().default(""),
});
export type MemberBlock = typeof memberBlocks.$inferSelect;

// Pack links (profile "Pack & pup life" card - packmate/handler relations between real users)
export const packLinks = sqliteTable("pack_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  linkedUserId: integer("linked_user_id").notNull(),
  relation: text("relation").notNull(), // packmate | handler
  createdAt: text("created_at").notNull().default(""),
});
export type PackLink = typeof packLinks.$inferSelect;

// Profile media (promoter podcast / member playlist card)
export const profileMedia = sqliteTable("profile_media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().unique(),
  kind: text("kind").notNull(), // podcast | playlist
  title: text("title").notNull(),
  tag: text("tag"),
  cadence: text("cadence"),
  blurb: text("blurb"),
  coverUrl: text("cover_url"),
  platformLinks: text("platform_links").notNull().default("[]"), // JSON [{label,url}]
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});
export type ProfileMedia = typeof profileMedia.$inferSelect;

export const profileMediaItems = sqliteTable("profile_media_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mediaId: integer("media_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  label: text("label"),
  title: text("title").notNull(),
  meta: text("meta"),
  audioUrl: text("audio_url").notNull(),
  isEmbed: integer("is_embed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(""),
});
export type ProfileMediaItem = typeof profileMediaItems.$inferSelect;

// Messages
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  subject: text("subject").notNull().default(""),
  body: text("body").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  threadId: text("thread_id").notNull(), // group replies
  contextType: text("context_type").notNull().default("THREAD"), // MISSED_CONNECTION | GIG | EVENT_HOST | CHECK_IN | THREAD
  contextId: integer("context_id"),
  contextLabel: text("context_label"),
  deletedByFrom: integer("deleted_by_from", { mode: "boolean" }).notNull().default(false),
  deletedByTo: integer("deleted_by_to", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(""),
});
export type Message = typeof messages.$inferSelect;

// MIZZED CONNECTION
export const missedConnections = sqliteTable("missed_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  eventId: integer("event_id"),
  beachId: text("beach_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  dayOfWeek: text("day_of_week"),
  venueHint: text("venue_hint"),
  closesAt: text("closes_at"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE | REJECTED | ARCHIVED | DELETED
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(""),
});

export const missedConnectionThreads = sqliteTable("missed_connection_threads", {
  threadId: text("thread_id").primaryKey(),
  missedConnectionId: integer("missed_connection_id").notNull(),
  posterUserId: integer("poster_user_id").notNull(),
  replierUserId: integer("replier_user_id").notNull(),
  posterRevealed: integer("poster_revealed", { mode: "boolean" }).notNull().default(false),
  replierRevealed: integer("replier_revealed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(""),
});

export const insertMissedConnectionSchema = createInsertSchema(missedConnections).omit({ id: true, createdAt: true, status: true });
export type InsertMissedConnection = z.infer<typeof insertMissedConnectionSchema>;
export type MissedConnection = typeof missedConnections.$inferSelect;

// Out Of My Closet: Gifting
export const giftingPosts = sqliteTable("gifting_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  postType: text("post_type").notNull().default("GIFT"), // GIFT | ISO
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  neighborhood: text("neighborhood").notNull(),
  pickupPreference: text("pickup_preference").notNull(),
  photoUrls: text("photo_urls").notNull().default("[]"),
  status: text("status").notNull().default("OPEN"),
  selectedInterestId: integer("selected_interest_id"),
  renewCount: integer("renew_count").notNull().default(0),
  expiresAt: text("expires_at").notNull(),
  reportCount: integer("report_count").notNull().default(0),
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(""),
});

export const giftingInterests = sqliteTable("gifting_interests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  note: text("note").notNull(),
  status: text("status").notNull().default("INTERESTED"), // INTERESTED | SELECTED | DECLINED | WITHDRAWN
  createdAt: text("created_at").notNull().default(""),
});

export const giftingReports = sqliteTable("gifting_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  reporterUserId: integer("reporter_user_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("PENDING"),
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(""),
});

export const insertGiftingPostSchema = createInsertSchema(giftingPosts).omit({
  id: true,
  createdAt: true,
  status: true,
  selectedInterestId: true,
  renewCount: true,
  expiresAt: true,
  reportCount: true,
});
export const insertGiftingInterestSchema = createInsertSchema(giftingInterests).omit({ id: true, createdAt: true, status: true });
export const insertGiftingReportSchema = createInsertSchema(giftingReports).omit({ id: true, createdAt: true, status: true, adminNotes: true });
export type InsertGiftingPost = z.infer<typeof insertGiftingPostSchema>;
export type GiftingPost = typeof giftingPosts.$inferSelect;
export type InsertGiftingInterest = z.infer<typeof insertGiftingInterestSchema>;
export type GiftingInterest = typeof giftingInterests.$inferSelect;
export type InsertGiftingReport = z.infer<typeof insertGiftingReportSchema>;
export type GiftingReport = typeof giftingReports.$inferSelect;

// SELLZ - member-to-member marketplace. Zaylist coordinates discovery and
// handoff; payment remains between members and is never processed here.
export const sellzPosts = sqliteTable("sellz_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  condition: text("condition").notNull(),
  priceCents: integer("price_cents").notNull(),
  negotiable: integer("negotiable", { mode: "boolean" }).notNull().default(false),
  neighborhood: text("neighborhood").notNull(),
  pickupPreference: text("pickup_preference").notNull(),
  photoUrls: text("photo_urls").notNull().default("[]"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE | RESERVED | SOLD | EXPIRED | REMOVED
  selectedInterestId: integer("selected_interest_id"),
  expiresAt: text("expires_at").notNull(),
  reportCount: integer("report_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
  lastChangeLabel: text("last_change_label"),
  lastChangeAt: text("last_change_at"),
});

export const sellzInterests = sqliteTable("sellz_interests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  note: text("note").notNull(),
  offerCents: integer("offer_cents"),
  status: text("status").notNull().default("INTERESTED"), // INTERESTED | SELECTED | DECLINED | WITHDRAWN
  createdAt: text("created_at").notNull().default(""),
});

export const sellzReports = sqliteTable("sellz_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  reporterUserId: integer("reporter_user_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("PENDING"),
  createdAt: text("created_at").notNull().default(""),
});

export const sellzSaves = sqliteTable("sellz_saves", {
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: text("created_at").notNull().default(""),
  seenUpdatedAt: text("seen_updated_at"),
});

export const insertSellzPostSchema = createInsertSchema(sellzPosts).omit({
  id: true, createdAt: true, status: true, selectedInterestId: true, expiresAt: true, reportCount: true,
});
export const insertSellzInterestSchema = createInsertSchema(sellzInterests).omit({ id: true, createdAt: true, status: true });
export const insertSellzReportSchema = createInsertSchema(sellzReports).omit({ id: true, createdAt: true, status: true });
export type SellzPost = typeof sellzPosts.$inferSelect;
export type InsertSellzPost = z.infer<typeof insertSellzPostSchema>;
export type SellzInterest = typeof sellzInterests.$inferSelect;
export type InsertSellzInterest = z.infer<typeof insertSellzInterestSchema>;
export type InsertSellzReport = z.infer<typeof insertSellzReportSchema>;

// River Brats - Nude Beaches social
export const beachCheckins = sqliteTable("beach_checkins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  beachId: text("beach_id").notNull(),
  arrivalHour: integer("arrival_hour").notNull(),
  /** Planned leave hour (Pacific wall, 8–22). Optional on legacy rows. */
  departHour: integer("depart_hour"),
  note: text("note"),
  calendarDate: text("calendar_date").notNull(),
  isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  reportCount: integer("report_count").notNull().default(0),
  // 'PLANNED' | 'HERE' - GPS-verified presence; raw coordinates never stored.
  presence: text("presence").notNull().default("PLANNED"),
  gpsVerifiedAt: text("gps_verified_at"),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(""),
});

// One-shot timed nudges ("you said 4pm - are you here?"). Fired by the
// server-side prompt scheduler; PENDING → SENT | CANCELLED | SKIPPED.
export const scheduledPrompts = sqliteTable("scheduled_prompts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  kind: text("kind").notNull(),
  fireAt: text("fire_at").notNull(),
  beachId: text("beach_id"),
  calendarDate: text("calendar_date"),
  checkinId: integer("checkin_id"),
  status: text("status").notNull().default("PENDING"),
  createdAt: text("created_at").notNull().default(""),
});

export const beachChatMessages = sqliteTable("beach_chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  beachId: text("beach_id").notNull(),
  calendarDate: text("calendar_date").notNull(),
  userId: integer("user_id").notNull(),
  body: text("body").notNull(),
  isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(""),
});

export const beachCarpoolPosts = sqliteTable("beach_carpool_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  beachId: text("beach_id").notNull(),
  postType: text("post_type").notNull(),
  /** TO_BEACH (default) or FROM_BEACH for return rides. */
  direction: text("direction").notNull().default("TO_BEACH"),
  departureArea: text("departure_area").notNull(),
  tripDate: text("trip_date").notNull(),
  leaveHour: integer("leave_hour").notNull(),
  seats: integer("seats"),
  note: text("note").notNull(),
  status: text("status").notNull().default("OPEN"),
  reportCount: integer("report_count").notNull().default(0),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(""),
});

export const beachCarpoolRequests = sqliteTable("beach_carpool_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  note: text("note").notNull(),
  status: text("status").notNull().default("INTERESTED"),
  createdAt: text("created_at").notNull().default(""),
});

export const riverBratsReports = sqliteTable("river_brats_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  reporterUserId: integer("reporter_user_id").notNull(),
  reason: text("reason").notNull(),
  note: text("note"),
  status: text("status").notNull().default("PENDING"),
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(""),
});

export const insertBeachCheckinSchema = createInsertSchema(beachCheckins).omit({
  id: true,
  createdAt: true,
  isActive: true,
  reportCount: true,
  expiresAt: true,
});
export const insertBeachCarpoolPostSchema = createInsertSchema(beachCarpoolPosts).omit({
  id: true,
  createdAt: true,
  status: true,
  reportCount: true,
  expiresAt: true,
});
export const insertBeachCarpoolRequestSchema = createInsertSchema(beachCarpoolRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});
export const insertRiverBratsReportSchema = createInsertSchema(riverBratsReports).omit({
  id: true,
  createdAt: true,
  status: true,
  adminNotes: true,
});
export const insertBeachChatMessageSchema = createInsertSchema(beachChatMessages).omit({
  id: true,
  createdAt: true,
});
export type BeachCheckin = typeof beachCheckins.$inferSelect;
export type BeachChatMessage = typeof beachChatMessages.$inferSelect;
export type InsertBeachChatMessage = z.infer<typeof insertBeachChatMessageSchema>;
export type InsertBeachCheckin = z.infer<typeof insertBeachCheckinSchema>;
export type BeachCarpoolPost = typeof beachCarpoolPosts.$inferSelect;
export type InsertBeachCarpoolPost = z.infer<typeof insertBeachCarpoolPostSchema>;
export type BeachCarpoolRequest = typeof beachCarpoolRequests.$inferSelect;
export type InsertBeachCarpoolRequest = z.infer<typeof insertBeachCarpoolRequestSchema>;
export type RiverBratsReport = typeof riverBratsReports.$inferSelect;
export type InsertRiverBratsReport = z.infer<typeof insertRiverBratsReportSchema>;

// Soft launch tester feedback
export const feedbackReports = sqliteTable("feedback_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pageUrl: text("page_url").notNull(),
  category: text("category").notNull().default("BUG"),
  severity: text("severity").notNull().default("MEDIUM"),
  message: text("message").notNull(),
  steps: text("steps"),
  email: text("email"),
  userAgent: text("user_agent"),
  status: text("status").notNull().default("OPEN"),
  createdAt: text("created_at").notNull().default(""),
});

export const insertFeedbackReportSchema = createInsertSchema(feedbackReports).omit({
  id: true,
  createdAt: true,
  status: true,
});
export type InsertFeedbackReport = z.infer<typeof insertFeedbackReportSchema>;
export type FeedbackReport = typeof feedbackReports.$inferSelect;

// Host broadcast messages (pinned on event detail)
export const hostMessages = sqliteTable("host_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(""),
});

export const insertHostMessageSchema = createInsertSchema(hostMessages).omit({ id: true, createdAt: true });
export type InsertHostMessage = z.infer<typeof insertHostMessageSchema>;
export type HostMessage = typeof hostMessages.$inferSelect;

// Promoter/admin scene feed posts (text or photo)
export const hubFeedPosts = sqliteTable("hub_feed_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  postType: text("post_type").notNull(), // text | photo
  body: text("body"),
  photoUrl: text("photo_url"),
  audience: text("audience").notNull().default("ALL"), // ALL | RSVPS
  eventId: integer("event_id"),
  postAs: text("post_as").notNull().default("self"), // self | event | venue
  businessId: integer("business_id"), // set when postAs = venue
  status: text("status").notNull().default("LIVE"), // LIVE | REMOVED
  createdAt: text("created_at").notNull().default(""),
});

export const insertHubFeedPostSchema = createInsertSchema(hubFeedPosts).omit({
  id: true,
  createdAt: true,
  status: true,
});
export type InsertHubFeedPost = z.infer<typeof insertHubFeedPostSchema>;
export type HubFeedPost = typeof hubFeedPosts.$inferSelect;

// Event hosts (up to 3 per event - primary + co-hosts)
export const eventHosts = sqliteTable("event_hosts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull().default("COHOST"), // PRIMARY | COHOST
  addedByUserId: integer("added_by_user_id"),
  createdAt: text("created_at").notNull().default(""),
});

export const insertEventHostSchema = createInsertSchema(eventHosts).omit({ id: true, createdAt: true });
export type InsertEventHost = z.infer<typeof insertEventHostSchema>;
export type EventHost = typeof eventHosts.$inferSelect;

// Event talent / lineup (registered users tagged by role)
export const eventTalent = sqliteTable("event_talent", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("LIVE"), // LIVE | PENDING
  addedByUserId: integer("added_by_user_id"),
  createdAt: text("created_at").notNull().default(""),
});

export const insertEventTalentSchema = createInsertSchema(eventTalent).omit({ id: true, createdAt: true });
export type InsertEventTalent = z.infer<typeof insertEventTalentSchema>;
export type EventTalent = typeof eventTalent.$inferSelect;

// Public profile Updates replies for GIG + HUB (SPOTTED / GIFTING use native private flows).
export const contentReplies = sqliteTable("content_replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentType: text("content_type").notNull(), // GIG | HUB (also accepts GIFTING | SPOTTED if ever used)
  contentId: integer("content_id").notNull(),
  userId: integer("user_id").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(""),
});
export type ContentReply = typeof contentReplies.$inferSelect;

// Web Push subscriptions
export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  platform: text("platform"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(""),
  lastUsedAt: text("last_used_at"),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// ─── Ad Manager (owner-only affiliate / house ads) ───────────────────────────
export const ads = sqliteTable("ads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  format: text("format").notNull(), // feed | poster
  business: text("business").notNull().default(""),
  pillLabel: text("pill_label").notNull().default("Affiliate"),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  ctaTitle: text("cta_title").notNull().default(""),
  ctaCopy: text("cta_copy").notNull().default(""),
  logoText: text("logo_text").notNull().default(""),
  logoImg: text("logo_img"),
  tag1: text("tag1").notNull().default(""),
  tag2: text("tag2").notNull().default(""),
  destUrl: text("dest_url").notNull().default(""),
  primaryColor: text("primary_color").notNull().default("#ff1f1f"),
  secondaryColor: text("secondary_color").notNull().default("#ffffff"),
  mediaMode: text("media_mode").notNull().default("single"), // single | slideshow
  singleSrc: text("single_src"),
  slides: text("slides").notNull().default("[]"), // JSON string[]
  slideAuto: integer("slide_auto", { mode: "boolean" }).notNull().default(true),
  slideMs: integer("slide_ms").notNull().default(2600),
  slideArrows: integer("slide_arrows", { mode: "boolean" }).notNull().default(false),
  placeAll: integer("place_all", { mode: "boolean" }).notNull().default(true),
  placeFollowing: integer("place_following", { mode: "boolean" }).notNull().default(true),
  placeEvents: integer("place_events", { mode: "boolean" }).notNull().default(true),
  placeSpotted: integer("place_spotted", { mode: "boolean" }).notNull().default(false),
  cadence: integer("cadence").notNull().default(0),
  pinTop: integer("pin_top", { mode: "boolean" }).notNull().default(false),
  scrollDepths: text("scroll_depths").notNull().default("[]"), // JSON number[] e.g. [40]
  audience: text("audience").notNull().default("everyone"), // everyone | members | guests
  dismissible: integer("dismissible", { mode: "boolean" }).notNull().default(true),
  maxImpr: integer("max_impr").notNull().default(0),
  maxPerDay: integer("max_per_day").notNull().default(5),
  minEvents: integer("min_events").notNull().default(2),
  scatterPct: integer("scatter_pct").notNull().default(45),
  onePerDay: integer("one_per_day", { mode: "boolean" }).notNull().default(true),
  neverFirst: integer("never_first", { mode: "boolean" }).notNull().default(true),
  noAdjacent: integer("no_adjacent", { mode: "boolean" }).notNull().default(true),
  weight: integer("weight").notNull().default(1),
  freqCap: integer("freq_cap").notNull().default(0),
  startDate: text("start_date"),
  endDate: text("end_date"),
  days: text("days").notNull().default("[]"), // JSON Pride day codes
  status: text("status").notNull().default("scheduled"), // live | scheduled | paused | ended
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  contact: text("contact").notNull().default(""),
  billing: text("billing").notNull().default(""),
  templateKey: text("template_key"), // cockblock | mrs | yes-coach | custom | null
  source: text("source").notNull().default("custom"), // template | custom | manual
  ownerId: integer("owner_id"),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

export type Ad = typeof ads.$inferSelect;
export type InsertAd = typeof ads.$inferInsert;

export const adEvents = sqliteTable("ad_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adId: integer("ad_id").notNull(),
  type: text("type").notNull(), // impression | click
  ts: text("ts").notNull().default(""),
  sessionId: text("session_id"),
  surface: text("surface"),
});
export type AdEvent = typeof adEvents.$inferSelect;

// ---------------------------------------------------------------------------
// HAUSING - THE HAÜZ
// Spec: docs/HAUS_HOUSING_SPEC_v0.2.md - Build brief: docs/HAUS_ENGINEERING_HANDOFF.md
//
// One post object, four types. `type` controls which columns are meaningful and
// which card variant renders. Per-type columns are nullable rather than split
// into four tables, per the handoff (4.1).
//
// Hard constraints that shaped this schema:
//  - The platform never handles money. Every rent/deposit column is display text.
//  - Conduit, not matcher. Nothing here is a protected-class field, and no column
//    exists to rank, filter, or steer posts by one.
// ---------------------------------------------------------------------------

export const housingPosts = sqliteTable("housing_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // LOOKING | OFFERING | FORMING | MANAGED

  // Shared card + detail fields
  name: text("name").notNull().default(""), // front part only; "HAUS" suffix appended on render for OFFERING/FORMING
  headline: text("headline").notNull().default(""), // the one body line on the card
  body: text("body").notNull().default(""), // longer "own words" text on the detail
  photoUrls: text("photo_urls").notNull().default("[]"), // JSON string[]; [0] is the cover the name sits over
  areas: text("areas").notNull().default("[]"), // JSON string[] of neighborhoods
  // JSON string[] of tag ids from shared/housingTags.ts. Filters the board and
  // orders the chips on a card. Never orders the feed.
  tags: text("tags").notNull().default("[]"),

  // LOOKING
  budget: text("budget"), // display text, e.g. "$850/mo"
  moveTimeline: text("move_timeline"), // display text, e.g. "Aug 1, some flex"
  livingStyle: text("living_style").notNull().default("[]"), // JSON string[] of self-described chips
  openToHaus: integer("open_to_haus", { mode: "boolean" }).notNull().default(false),

  // OFFERING + MANAGED (the unit)
  rent: text("rent"), // display text
  rentNote: text("rent_note"),
  deposit: text("deposit"),
  moveIn: text("move_in"),
  roomNote: text("room_note"),
  beds: real("beds"),
  baths: real("baths"), // halves allowed, e.g. 1.5
  parking: text("parking"), // OFF_STREET | DRIVEWAY | GARAGE | STREET_ONLY | NONE
  outdoor: text("outdoor"), // PRIVATE_YARD | SHARED_YARD | PATIO_BALCONY | NONE
  culture: text("culture").notNull().default("[]"), // JSON string[] of house-culture chips
  access: text("access").notNull().default("[]"), // JSON string[] of accessibility facts

  // FORMING
  flavor: text("flavor"), // PLACE_IN_MIND | FIND_TOGETHER
  seeking: integer("seeking").notNull().default(0), // how many more people
  isFull: integer("is_full", { mode: "boolean" }).notNull().default(false),
  goals: text("goals"),
  aroundPostId: integer("around_post_id"), // the MANAGED listing this HAUS formed around (many -> one, never a claim)

  // MANAGED
  propertyManagerId: integer("property_manager_id"),
  sourceUrl: text("source_url"), // deep link to the unit on the manager's own site
  sourceDomain: text("source_domain"),
  badges: text("badges").notNull().default("[]"), // JSON string[]: SECTION_8 | INCOME_RESTRICTED | ACCESSIBLE
  lastSeenAt: text("last_seen_at"), // freshness stamp for ingested listings
  gone: integer("gone", { mode: "boolean" }).notNull().default(false), // off market; triggers HAUS teardown

  // Approximate location only. Exact address stays off the record until the
  // people involved choose to share it.
  lat: real("lat"),
  lng: real("lng"),

  status: text("status").notNull().default("ACTIVE"), // ACTIVE | FILLED | ARCHIVED | REMOVED
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false), // admin soft-hide; owner decides removal
  hiddenByUserId: integer("hidden_by_user_id"),
  reportCount: integer("report_count").notNull().default(0),
  adminNotes: text("admin_notes"),
  archivedWorkspace: text("archived_workspace"), // JSON snapshot kept when FORMING converts back to LOOKING
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
  lastChangeLabel: text("last_change_label"), // e.g. "Rent updated" - drives the saved-post resurface in the feed
  lastChangeAt: text("last_change_at"), // coalesced bump time (~20 min); last label wins
});

// The avatar stack: real members, off-platform housemates, and pets.
export const housingMembers = sqliteTable("housing_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  kind: text("kind").notNull().default("MEMBER"), // MEMBER | OFFPLATFORM | PET
  userId: integer("user_id"), // set only when kind = MEMBER
  name: text("name").notNull().default(""), // first name for OFFPLATFORM, pet name for PET
  photoUrl: text("photo_url"),
  species: text("species"), // PET only, e.g. "dog"
  role: text("role").notNull().default("MEMBER"), // LEAD | COLEAD | MEMBER
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
});

// Saving a post means following it: updates resurface in the saver's feed.
export const housingSaves = sqliteTable("housing_saves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  seenUpdatedAt: text("seen_updated_at"), // last post updatedAt this user has been shown
  createdAt: text("created_at").notNull().default(""),
});

// Consent-based first contact. Asking to chat IS asking to join a HAUS, so one
// table covers both. Nothing opens until the recipient accepts.
export const housingRequests = sqliteTable("housing_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  requesterUserId: integer("requester_user_id").notNull(),
  recipientUserId: integer("recipient_user_id").notNull(),
  kind: text("kind").notNull().default("CHAT"), // CHAT | JOIN | WAITLIST
  status: text("status").notNull().default("PENDING"), // PENDING | ACCEPTED | DECLINED | WITHDRAWN
  threadId: text("thread_id"), // set on accept, points at the existing messages thread
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
  resolvedAt: text("resolved_at"),
  nudgeSentAt: text("nudge_sent_at"),
});

// The shared house-hunt shortlist. These are external links the group bookmarks
// for itself. Zaylist does not host or re-list these properties.
export const housingPlaces = sqliteTable("housing_places", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  addedByUserId: integer("added_by_user_id").notNull(),
  url: text("url").notNull(),
  title: text("title").notNull().default(""),
  rent: text("rent"),
  neighborhood: text("neighborhood"),
  sourceDomain: text("source_domain"),
  thumbUrl: text("thumb_url"),
  status: text("status").notNull().default("INTERESTED"), // INTERESTED | TOURING | APPLIED | PASSED | CHOSEN
  isTarget: integer("is_target", { mode: "boolean" }).notNull().default(false), // the place-in-mind unit
  managedPostId: integer("managed_post_id"), // set when seeded from a MANAGED listing
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
});

export const housingPlaceReactions = sqliteTable("housing_place_reactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  placeId: integer("place_id").notNull(),
  userId: integer("user_id").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: text("created_at").notNull().default(""),
});

export const housingPlaceComments = sqliteTable("housing_place_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  placeId: integer("place_id").notNull(),
  userId: integer("user_id").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(""),
});

// The dates a real house hunt runs on. Rides the existing reminder system.
export const housingDates = sqliteTable("housing_dates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  createdByUserId: integer("created_by_user_id").notNull(),
  kind: text("kind").notNull().default("OTHER"), // MOVE_IN | TOUR | APPLICATION | LEASE | DEPOSIT | CHECKIN | OTHER
  label: text("label").notNull(),
  dateOn: text("date_on").notNull(),
  note: text("note").notNull().default(""),
  remindAt: text("remind_at"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
});

// A verified property manager. Its own account type, modeled on `promoters`.
// Verification is mandatory and free and is never gated behind payment; the
// membership below gates publishing and distribution only.
export const propertyManagers = sqliteTable("property_managers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"), // linked Zaylist account, so they can see forming groups
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  company: text("company"),
  passwordHash: text("password_hash").notNull().default(""),
  businessId: integer("business_id"), // match to the directory business record
  siteUrl: text("site_url"),
  siteDomain: text("site_domain"),
  status: text("status").notNull().default("active"), // active | suspended
  verifiedAt: text("verified_at"),
  membershipStatus: text("membership_status").notNull().default("trialing"), // trialing | active | lapsed
  firstMonthFree: integer("first_month_free", { mode: "boolean" }).notNull().default(true),
  foundingPartner: integer("founding_partner", { mode: "boolean" }).notNull().default(false),
  membershipStartedAt: text("membership_started_at"),
  membershipRenewsAt: text("membership_renews_at"),
  createdAt: text("created_at").notNull().default(""),
});

// Applications land in the owner's queue. Only the owner approves, and approval
// is what creates the property manager account.
export const propertyManagerApplications = sqliteTable("property_manager_applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  siteUrl: text("site_url").notNull(), // used for the domain-ownership check
  domainProof: text("domain_proof").notNull().default(""),
  businessLicense: text("business_license").notNull().default(""),
  directoryBusinessId: integer("directory_business_id"),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED
  ownerNotes: text("owner_notes"),
  createdPropertyManagerId: integer("created_property_manager_id"),
  createdAt: text("created_at").notNull().default(""),
});

export const housingReports = sqliteTable("housing_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  reporterUserId: integer("reporter_user_id").notNull(),
  reason: text("reason").notNull(), // FAKE_LISTING | SCAM | UNSAFE_HOUSING | DISCRIMINATION | UNAUTHORIZED_SUBLEASE | OTHER
  detail: text("detail").notNull().default(""),
  status: text("status").notNull().default("PENDING"), // PENDING | RESOLVED | DISMISSED
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(""),
});

export const insertHousingPostSchema = createInsertSchema(housingPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  hidden: true,
  hiddenByUserId: true,
  reportCount: true,
  adminNotes: true,
  archivedWorkspace: true,
  lastChangeLabel: true,
  gone: true,
  lastSeenAt: true,
});
export const insertHousingMemberSchema = createInsertSchema(housingMembers).omit({ id: true, createdAt: true });
export const insertHousingRequestSchema = createInsertSchema(housingRequests).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
  status: true,
  threadId: true,
});
export const insertHousingPlaceSchema = createInsertSchema(housingPlaces).omit({ id: true, createdAt: true, status: true });
export const insertHousingDateSchema = createInsertSchema(housingDates).omit({ id: true, createdAt: true });
export const insertHousingReportSchema = createInsertSchema(housingReports).omit({
  id: true,
  createdAt: true,
  status: true,
  adminNotes: true,
});
export const insertPropertyManagerSchema = createInsertSchema(propertyManagers).omit({ id: true, createdAt: true, status: true });
export const insertPropertyManagerApplicationSchema = createInsertSchema(propertyManagerApplications).omit({
  id: true,
  createdAt: true,
  status: true,
  ownerNotes: true,
  createdPropertyManagerId: true,
});

export type InsertHousingPost = z.infer<typeof insertHousingPostSchema>;
export type HousingPost = typeof housingPosts.$inferSelect;
export type InsertHousingMember = z.infer<typeof insertHousingMemberSchema>;
export type HousingMember = typeof housingMembers.$inferSelect;
export type HousingSave = typeof housingSaves.$inferSelect;
export type InsertHousingRequest = z.infer<typeof insertHousingRequestSchema>;
export type HousingRequest = typeof housingRequests.$inferSelect;
export type InsertHousingPlace = z.infer<typeof insertHousingPlaceSchema>;
export type HousingPlace = typeof housingPlaces.$inferSelect;
export type HousingPlaceReaction = typeof housingPlaceReactions.$inferSelect;
export type HousingPlaceComment = typeof housingPlaceComments.$inferSelect;
export type InsertHousingDate = z.infer<typeof insertHousingDateSchema>;
export type HousingDate = typeof housingDates.$inferSelect;
export type InsertHousingReport = z.infer<typeof insertHousingReportSchema>;
export type HousingReport = typeof housingReports.$inferSelect;
export type InsertPropertyManager = z.infer<typeof insertPropertyManagerSchema>;
export type PropertyManager = typeof propertyManagers.$inferSelect;
export type InsertPropertyManagerApplication = z.infer<typeof insertPropertyManagerApplicationSchema>;
export type PropertyManagerApplication = typeof propertyManagerApplications.$inferSelect;
