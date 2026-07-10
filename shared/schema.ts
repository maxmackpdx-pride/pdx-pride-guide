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
  status: text("status").notNull().default("LIVE"),
  source: text("source").notNull().default("admin_seeded"),
  isClaimable: integer("is_claimable", { mode: "boolean" }).notNull().default(false),
  claimedBy: text("claimed_by"),
  submittedBy: text("submitted_by"),
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(""),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
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

// Gig posts (Pride Work)
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
  type: text("type").notNull().default("bar"), // bar|restaurant|cafe|venue|service|shop|hotel
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
  isNew: integer("is_new", { mode: "boolean" }).notNull().default(false),
  hours: text("hours"),
  phone: text("phone"),
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

// Business ownership claims (existing venue) — mirrors the event CLAIM flow in `submissions`
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
  accentColor: text("accent_color"),
  profileBanner: text("profile_banner"),
  talents: text("talents"), // JSON string[]
  standFor: text("stand_for"), // JSON string[]
  affiliatedVenueIds: text("affiliated_venue_ids"), // JSON number[]
  businessPlaceId: integer("business_place_id"),
  marquee: text("marquee"), // JSON {items,speed,color}
  profileMedia: text("profile_media"), // JSON featured media + track list
  pup: text("pup"), // JSON {enabled,name,hood,role,lookingFor}
  googleId: text("google_id").unique(),
  status: text("status").notNull().default("active"),
  promoterStatus: text("promoter_status").notNull().default("none"), // none | pending | approved | rejected
  subAdmin: integer("sub_admin", { mode: "boolean" }).default(false),
  usernameChangedAt: text("username_changed_at"),
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

// Profile pack / handler relationships (member pup community)
export const profilePackmates = sqliteTable("profile_packmates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  packmateUserId: integer("packmate_user_id").notNull(),
  createdAt: text("created_at").notNull().default(""),
});

export const profileHandlers = sqliteTable("profile_handlers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  handlerUserId: integer("handler_user_id").notNull(),
  createdAt: text("created_at").notNull().default(""),
});

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

// Missed Connections
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

// River Brats — Nude Beaches social
export const beachCheckins = sqliteTable("beach_checkins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  beachId: text("beach_id").notNull(),
  arrivalHour: integer("arrival_hour").notNull(),
  note: text("note"),
  calendarDate: text("calendar_date").notNull(),
  isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  reportCount: integer("report_count").notNull().default(0),
  expiresAt: text("expires_at").notNull(),
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

// Event hosts (up to 3 per event — primary + co-hosts)
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
