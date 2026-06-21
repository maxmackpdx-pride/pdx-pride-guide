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
  handle: text("handle").notNull(), // display name / handle
  message: text("message").notNull(), // chosen speech bubble
  avatarSeed: text("avatar_seed").notNull(), // seed for deterministic avatar color/initials
  createdAt: text("created_at").notNull().default(""),
});

export const insertAttendanceSchema = createInsertSchema(attendances).omit({ id: true, createdAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendances.$inferSelect;
