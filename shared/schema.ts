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
  createdAt: text("created_at").notNull().default(""),
  userId: integer("user_id"),
  imageUrl: text("image_url"),
  gigDate: text("gig_date"),
  gigTime: text("gig_time"),
});

export const insertGigPostSchema = createInsertSchema(gigPosts).omit({ id: true, createdAt: true, status: true });
export type InsertGigPost = z.infer<typeof insertGigPostSchema>;
export type GigPost = typeof gigPosts.$inferSelect;

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

// Attendance (Hey I'll Be There)
export const attendances = sqliteTable("attendances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id"),
  handle: text("handle").notNull(), // display name / handle
  message: text("message").notNull(), // chosen speech bubble
  avatarSeed: text("avatar_seed").notNull(), // seed for deterministic avatar color/initials
  photoUrl: text("photo_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(""),
});

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
  googleId: text("google_id").unique(),
  status: text("status").notNull().default("active"),
  promoterStatus: text("promoter_status").notNull().default("none"), // none | pending | approved | rejected
  createdAt: text("created_at").notNull().default(""),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, status: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
  title: text("title").notNull(),
  body: text("body").notNull(),
  dayOfWeek: text("day_of_week"),
  venueHint: text("venue_hint"),
  closesAt: text("closes_at"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE | ARCHIVED | DELETED
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
