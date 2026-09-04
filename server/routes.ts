import express, { type Express } from "express";
import type { Server } from "http";
import { buildLlmsTxt, buildRobotsTxt, buildSitemapXml, getLiveEventsForSeo } from "./seo";
import { buildAdminReport, renderAdminReportHtml } from "./adminReport";
import { expandMultiDayEvents } from "@shared/multiDayEvents";
import { dedupeEvents, eventDedupeKey } from "@shared/eventDedupe";
import {
  isPostEventWeekListingCapActive,
  prideDayFromDate,
  EVENT_WEEK_END_DATE,
} from "@shared/eventWeek";
import { storage, hashPassword, verifyPassword, isLegacyPasswordHash, sqlite, getTableCounts, normalizeAttendanceVisibility } from "./storage";
import { isTransactionalEmailConfigured, sendOwnerDeskNotification, sendPasswordResetEmail } from "./email";
import {
  adminSearchForViewer,
  attachDirectoryListing,
  checkAdminMessageRateLimit,
  claimAdminQueueItem,
  executeBulkEvents,
  getAdminQueueAggregate,
  listAdminQueueClaims,
  previewBulkEvents,
  publicPreviewLinks,
  releaseAdminQueueClaim,
} from "./adminOps";
import { assertProductionPersistence, assertProductionSecrets, getPersistenceAudit } from "./persistence";
import { initAttendanceWs } from "./attendanceWs";
import { startPromptScheduler } from "./scheduler";
import { BetterSqliteSessionStore } from "./sessionStore";
import {
  insertSubmissionSchema, insertGigPostSchema, insertModerationRequestSchema, insertMissedConnectionSchema,
  insertGiftingPostSchema, insertGiftingInterestSchema, insertGiftingReportSchema, insertFeedbackReportSchema,
  insertSellzPostSchema, insertSellzInterestSchema, insertSellzReportSchema,
  insertBeachCheckinSchema, insertBeachCarpoolPostSchema, insertRiverBratsReportSchema,
} from "@shared/schema";
import { z } from "zod";
import { moderateFields, moderationMessage } from "@shared/contentModeration";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import {
  getArchiveSyntheticCredits,
  getTuckerHostedArchiveRow,
  isTuckerHostedArchiveId,
  tuckerHostedArchiveAsEvent,
} from "@shared/tuckerHostedArchive";
import { buildVenueWebsiteIndex, resolveVenueWebsite } from "@shared/venueLinks";
import {
  enrichEventForMap,
  fillEventMapCoordinates,
  fillFieldsMapCoordinates,
  scheduleMapCoordinateBackfill,
} from "./mapCoordinateSync";
import { attachEventsToBusinesses, attachPromotersToBusinesses, attachSpottedAndGigsToBusinesses } from "./directoryEvents";
import { resolveBusinessLocations } from "@shared/businessLocations";
import { parsePacificDateTime } from "@shared/missedConnections";
import { DIRECTORY_TYPES } from "@shared/directoryTheme";
import { PRODUCT_EVENT_NAMES, recordPageView, recordProductEvent } from "./analytics";
import { registerAdRoutes } from "./adsRoutes";
import { registerHousingRoutes } from "./housing/routes";
import { registerCommunityRoutes, searchCommunities } from "./communities";
import { registerPlatformV1 } from "./platformV1";
import { commitIngest, previewIngest, mergeDraftIntoEvent } from "./ingest";
import { renderGamePosterPng } from "./posters/gamePoster";
import {
  INGEST_SOURCES,
  buildDirectoryIngestSources,
  expandWebsiteScrapeCandidates,
  mergeIngestSources,
} from "@shared/ingestSources";
import { isTrustedLaneSource } from "@shared/trustedVenues";
import { matchClosedVenue } from "@shared/closedVenues";
import {
  attachDirectoryBrandsToCandidates,
  cancelScan,
  dashboardSnapshot,
  getScanJobView,
  startScan,
} from "./qsearch/scanJob";
import {
  addCustomSource,
  clearScanQueue,
  deleteSource,
  enableSource,
  listCandidates,
  markAllNewSeen,
  clearCandidateFlyer,
  markCandidatesCommitted,
  markCandidatesSkipped,
  prunePendingAgainstCatalog,
  restoreCandidate,
  setDragpdxOptIn,
  setInstagramHandle,
  setRecipeUrl,
} from "./qsearch/store";
import { triggerNightlyPriorityScan } from "./qsearch/nightly";
import { getTrustedDashboard } from "./qsearch/trustedHealth";
import { localUploadToDataUrl, visionFlyerToDrafts } from "./qsearch/vision";
import { igFromUrl, igGraphPull, igPasteAssist, parseInstagramHandle } from "./qsearch/instagram";
import { buildScanCandidates } from "./qsearch/analyze";
import { saveCandidates } from "./qsearch/store";
import { randomUUID } from "node:crypto";
import {
  COMMUNITY_STANDARDS_VERSION,
  COMMUNITY_STANDARDS_DECLINE_URL,
  COMMUNITY_STANDARDS_GATE_ENABLED,
} from "@shared/communityStandards";
import {
  accountModReasonLabel,
  untilIsoFromHours,
} from "@shared/accountModeration";
import {
  getGoogleAnalyticsPublicTotals,
  getGoogleAnalyticsTrafficMetrics,
  isGoogleAnalyticsAdminConfigured,
} from "./googleAnalytics";
import { readGaMeasurementId } from "./gaSnippet";
import { forceRefreshNudeBeachesSnapshot, getNudeBeachesSnapshot } from "./nudeBeaches";
import { forceRefreshOutzSnapshot, getOutzSnapshot } from "./outz";
import {
  applyEventResearchEventChange,
  createEventFromResearch,
  eventForResearchAgent,
  getEventResearchSourceMemory,
  listEventResearchChanges,
  recordEventResearchPath,
  rollbackEventResearchChange,
} from "./eventResearchMemory";
import {
  beginResearchRun,
  enqueueResearchReview,
  evaluateDecisionGate,
  finishResearchRun,
  getResearchControlState,
  markRunSource,
  recordConflict,
  recordFieldEvidence,
  recordMediaProvenance,
  recordDecisionOutcome,
  recordMistakeTestResult,
  resolveResearchItem,
  setSourceSchedule,
  upsertEntityIdentity,
  upsertEventSeries,
  upsertMistakeTest,
} from "./eventResearchControl";
import {
  allowAdminOrEventResearchAgent,
  eventResearchActor,
} from "./eventResearchAuth";
import {
  deleteOutzCheckin,
  createOutzWallComment,
  createOutzWallPost,
  getOutzPlaceRating,
  getOutzWallPosts,
  getOutzChatMessages,
  getOutzCheckins,
  postOutzChatMessage,
  upsertOutzPlaceRating,
  upsertOutzCheckin,
} from "./outzSocial";
import { isProfileAccentColor, isProfileBanner, normalizeProfileAccentColor } from "@shared/profileTheme";
import {
  formatCustomSpottedVenue,
  generalSpottedClosesAt,
  isMissedConnectionPostable,
  missedConnectionClosesAt,
  pacificCalendarDate,
  pacificDayOfWeek,
} from "@shared/missedConnections";
import { isEventTalentRole } from "@shared/eventTalent";
import { parseHubFeedTab } from "@shared/hubFeed";
import { BOARD_REJECT_REASONS, PROFILE_PHOTO_REJECT_REASONS, validateGigPostContent } from "@shared/boardModeration";
import { buildTipLinks } from "@shared/tipSupport";

import {
  diffSubmissionMerge,
  findSubmissionMatches,
  submissionHasStrongDuplicate,
} from "@shared/submissionMatch";
import {
  buildDirectoryMergePatch,
  directoryHasStrongDuplicate,
  findDirectoryMatches,
  type DirectoryMergePayload,
} from "@shared/directoryMatch";
import type { Event } from "@shared/schema";
import {
  beachVenueLabel,
  isAllowedBeachCheckinDate,
  isAllowedCarpoolTripDate,
  isValidCarpoolDirection,
  isValidBeachId,
  isValidRiverBratsDepartHour,
  isValidRiverBratsHour,
  pacificTodayDate,
} from "@shared/riverBrats";
import { getVapidPublicKey, isPushConfigured } from "./push/vapid";
import { buildDeclarativePayload, sendPushToSubscription } from "./push/send";
import crypto from "crypto";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";

// ─── File upload setup ────────────────────────────────────────────────────────
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"));
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const rawExt = path.extname(file.originalname).toLowerCase();
      const ext = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(rawExt) ? rawExt : ".jpg";
      cb(null, `poster-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype);
    cb(null, ok);
  },
});

// Contact-form attachments (public, unauthenticated) - images or PDFs, small cap.
const contactUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const rawExt = path.extname(file.originalname).toLowerCase();
      const ext = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"].includes(rawExt) ? rawExt : ".bin";
      cb(null, `contact-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype) || file.mimetype === "application/pdf";
    cb(null, ok);
  },
});

// Extend express-session to include our custom fields
declare module "express-session" {
  interface SessionData {
    userId?: number;
    promoterId?: number;
    isAdmin?: boolean;
    googleOAuthState?: string;
    googleOAuthLinkUserId?: number;
  }
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const ADMIN_USER_EMAILS = (process.env.ADMIN_USER_EMAILS || "hello.tuckercasey@gmail.com")
  .split(",")
  .map(value => value.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || "hello_tuckercasey,tucker_pdmax")
  .split(",")
  .map(value => value.trim().replace(/^@/, "").toLowerCase())
  .filter(Boolean);
const OWNER_DISPLAY_NAME = process.env.OWNER_DISPLAY_NAME || "Tucker_PDmaX";

function publicEvent(
  evt: any,
  pendingClaimIds: Set<number> = new Set(),
  venueWebsites?: Map<string, string> | null,
) {
  const { adminNotes, submittedBy, claimedBy, ...safe } = enrichEventForMap(evt);
  const venueWebsite =
    (evt as any).venueWebsite
    || resolveVenueWebsite(evt.venueName, venueWebsites)
    || null;
  return {
    ...safe,
    posterImageUrl: resolveEventPosterUrl(evt.id, evt.posterImageUrl, evt.dayOfWeek),
    hasPendingClaim: pendingClaimIds.has(evt.id),
    venueWebsite,
  };
}

function venueWebsiteIndex() {
  return buildVenueWebsiteIndex(storage.getBusinesses() as any);
}

function publicUser(user: any) {
  if (!user) return null;
  const { passwordHash, email, status, googleId, ...safe } = user;
  return safe;
}

function adminUserSummary(user: any) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    photoUrl: user.photoUrl || null,
    avatarChoice: user.avatarChoice ?? 1,
    avatarRing: user.avatarRing || "none",
    promoterStatus: user.promoterStatus || "none",
    subAdmin: !!user.subAdmin,
    googleLinked: !!user.googleId,
    status: user.status || "active",
    createdAt: user.createdAt || "",
    isOwner: isMainAdminUser(user),
    communityStandardsVersion: user.communityStandardsVersion || null,
    communityStandardsAgreedAt: user.communityStandardsAgreedAt || null,
    communityStandardsDeclinedAt: user.communityStandardsDeclinedAt || null,
    accountStatus: user.status || "active",
    suspendReasonCode: user.suspendReasonCode || null,
    suspendReasonLabel: user.suspendReasonLabel || null,
    suspendNote: user.suspendNote || null,
    suspendUntil: user.suspendUntil || null,
    suspendedAt: user.suspendedAt || null,
    shadowBanned: !!user.shadowBanned,
    shadowBanReasonCode: user.shadowBanReasonCode || null,
    shadowBanReasonLabel: user.shadowBanReasonLabel || null,
    shadowBanUntil: user.shadowBanUntil || null,
  };
}

function lookupUserProfile(identifier: string | null | undefined) {
  const raw = String(identifier || "").trim().replace(/^@/, "");
  if (!raw) return null;
  const user = storage.getUserByEmail(raw) || storage.getUserByUsername(raw);
  return user ? adminUserSummary(user) : null;
}

function resolveUserByUsername(username: string) {
  const uname = username.trim().replace(/^@/, "");
  if (!uname) return undefined;
  return storage.getUserByUsername(uname)
    || sqlite.prepare(`SELECT * FROM users WHERE LOWER(username) = LOWER(?)`).get(uname) as ReturnType<typeof storage.getUserByUsername>;
}

function submissionMatchPool(): Event[] {
  return storage.getEvents({ status: "LIVE" });
}

function enrichSubmissionMatches(sub: { type: string; eventId?: number | null } & Record<string, unknown>) {
  if (sub.type !== "NEW_EVENT" && sub.type !== "SUGGEST") {
    return [];
  }
  const pool = submissionMatchPool();
  const matches = findSubmissionMatches(sub as any, pool, { excludeEventId: sub.eventId });
  return matches.map(match => ({
    ...match,
    event: pool.find(evt => evt.id === match.eventId) ?? null,
  }));
}

function enrichSubmissionForAdmin(sub: any) {
  const user = storage.getUserByEmail(sub.submitterEmail);
  return {
    ...sub,
    submitterProfile: user ? adminUserSummary(user) : null,
    potentialMatches: enrichSubmissionMatches(sub),
  };
}

function directoryMatchPool() {
  return storage.getBusinesses().filter(b => b.active);
}

function enrichDirectoryMatches(listing: {
  name: string;
  type?: string | null;
  address?: string | null;
  neighborhood?: string | null;
}) {
  const pool = directoryMatchPool();
  const matches = findDirectoryMatches(listing, pool);
  return matches.map(match => ({
    ...match,
    business: pool.find(biz => biz.id === match.businessId) ?? null,
  }));
}

function enrichModerationForAdmin(req: any) {
  const user = storage.getUserByEmail(req.requesterEmail);
  return {
    ...attachDirectoryListing(req),
    requesterProfile: user ? adminUserSummary(user) : null,
  };
}

/**
 * Validate event dates for create/edit.
 * Merges patch with existing so a partial dateStart-only update still hits the Pride cap.
 */
function validateEventDates(
  dateStart?: string | null,
  dateEnd?: string | null,
  existing?: { dateStart?: string | null; dateEnd?: string | null },
): string | null {
  const start = (dateStart ?? existing?.dateStart ?? undefined) || undefined;
  const end = (dateEnd ?? existing?.dateEnd ?? undefined) || undefined;

  // Until Jul 19 6pm Pacific, block starts after Pride Sunday (even if only dateStart is patched).
  if (isPostEventWeekListingCapActive() && start) {
    const startDay = pacificCalendarDate(start);
    if (startDay && startDay > EVENT_WEEK_END_DATE) {
      return "Post–Pride week events open Sunday July 19 at 6pm Pacific. Until then, list nights through July 19 only.";
    }
  }

  if (start && end) {
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs <= startMs) {
      return "End date must be after start date";
    }
  }
  return null;
}

/** Public board: hide events whose start day is after Pride week while the cap is active. */
function isPublicEventVisibleUnderPrideCap(evt: { dateStart?: string | null }): boolean {
  if (!isPostEventWeekListingCapActive()) return true;
  const startDay = pacificCalendarDate(evt.dateStart || "");
  if (startDay && startDay > EVENT_WEEK_END_DATE) return false;
  return true;
}

/**
 * dateStart is authoritative for dayOfWeek - derive it on every write so a
 * stale or mistaken client value can never disagree with the actual date.
 */
function syncDayOfWeek(patch: Record<string, unknown>, existing?: { dateStart?: string | null }) {
  const dateStart = (patch.dateStart as string | undefined) ?? existing?.dateStart ?? undefined;
  if (!dateStart) return;
  const derived = prideDayFromDate(dateStart);
  if (!derived) return;
  if (patch.dayOfWeek !== undefined && patch.dayOfWeek !== derived) {
    console.warn(
      `[events] dayOfWeek "${String(patch.dayOfWeek)}" corrected to "${derived}" from dateStart ${dateStart}`,
    );
  }
  if (patch.dayOfWeek !== undefined || patch.dateStart !== undefined) {
    patch.dayOfWeek = derived;
  }
}

function enrichEventForAdmin(evt: any) {
  return {
    ...evt,
    submittedByProfile: lookupUserProfile(evt.submittedBy),
    claimedByProfile: lookupUserProfile(evt.claimedBy),
  };
}

/** Admin catalog rows: expanded LIVE listings (matches public /api/events) + raw HIDDEN records. */
function getAdminEventCatalog() {
  const all = storage.getEvents({});
  const hidden = all.filter(evt => evt.status === "HIDDEN");
  const live = all.filter(evt => evt.status === "LIVE");
  return [...expandMultiDayEvents(live), ...hidden];
}

function isMainAdminUser(user: any) {
  if (!user) return false;
  const email = String(user.email || "").trim().toLowerCase();
  const username = String(user.username || "").trim().replace(/^@/, "").toLowerCase();
  return ADMIN_USER_EMAILS.includes(email)
    || ADMIN_USERNAMES.includes(username)
    || storage.hasSiteAdminGrant(user.id);
}

/** Live admin check - never trust sticky session.isAdmin alone (revoke must stick). */
function userIsAdminNow(user: any): boolean {
  return !!(user && (
    isMainAdminUser(user)
    || user.subAdmin
    || storage.hasOwnerAdminAccess(user)
  ));
}

function markAdminSessionForUser(req: any, user: any) {
  if (userIsAdminNow(user)) {
    req.session.isAdmin = true;
    return true;
  }
  if (req.session?.isAdmin) {
    delete req.session.isAdmin;
  }
  return false;
}

function syncOwnerDisplayName(user: any) {
  // Only Tucker (primary owner) - not env-listed co-admins or granted admins like @heygirl.
  if (!storage.isPrimarySiteOwner(user) || user.displayName === OWNER_DISPLAY_NAME) return user;
  storage.updateUser(user.id, { displayName: OWNER_DISPLAY_NAME });
  return { ...user, displayName: OWNER_DISPLAY_NAME };
}

function safeJsonValue(raw: unknown, fallback: unknown) {
  if (typeof raw !== "string" || !raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function authUserResponse(req: any, user: any) {
  const isAdmin = markAdminSessionForUser(req, user);
  return {
    id: user.id, username: user.username, email: user.email,
    displayName: user.displayName, avatarChoice: user.avatarChoice,
    avatarRing: user.avatarRing || "none", avatarCrop: user.avatarCrop || null,
    bio: user.bio, photoUrl: user.photoUrl,
    coverImageUrl: user.coverImageUrl || null, coverCrop: user.coverCrop || null,
    googleLinked: !!user.googleId,
    promoterStatus: user.promoterStatus || "none",
    pronouns: user.pronouns || null,
    location: user.location || null,
    socialLinks: safeJsonValue(user.socialLinks, {}),
    profileEmbeds: safeJsonValue(user.profileEmbeds, []),
    profilePhotos: safeJsonValue(user.profilePhotos, []),
    memberSince: user.createdAt || "",
    createdAt: user.createdAt || "",
    isAdmin,
    isSuperAdmin: isMainAdminUser(user) || storage.hasOwnerAdminAccess(user),
    // Primary owner only - Owner Desk stays private to Tucker.
    isPrimaryOwner: storage.isPrimarySiteOwner(user),
    // Owner + peers (brohoejams): full site admin tools except Owner Desk.
    canManageTeam: storage.hasOwnerAdminAccess(user),
    canViewUsers: storage.hasOwnerAdminAccess(user),
    canPush: storage.hasOwnerAdminAccess(user) || isMainAdminUser(user),
    canManageCatalog: storage.hasOwnerAdminAccess(user) || isMainAdminUser(user),
    subAdmin: !!user.subAdmin,
    usernameChangedAt: user.usernameChangedAt || null,
    communityStandardsVersion: user.communityStandardsVersion || null,
    communityStandardsAgreedAt: user.communityStandardsAgreedAt || null,
    communityStandardsDeclinedAt: user.communityStandardsDeclinedAt || null,
    accountStatus: user.status || "active",
    suspendReasonCode: user.suspendReasonCode || null,
    suspendReasonLabel: user.suspendReasonLabel || null,
    suspendNote: user.suspendNote || null,
    suspendUntil: user.suspendUntil || null,
    suspendedAt: user.suspendedAt || null,
  };
}

// ─── Member profile field validation ─────────────────────────────────────────
const SOCIAL_LINK_KEYS = [
  "instagram", "tiktok", "soundcloud", "spotify", "bluesky", "x",
  "facebook", "website", "linktree", "venmo", "onlyfans", "fetlife", "bookingEmail",
] as const;

function sanitizeSocialLinks(input: unknown): string | null {
  if (input === null) return null;
  if (typeof input !== "object" || Array.isArray(input)) return null;
  const clean: Record<string, string> = {};
  for (const key of SOCIAL_LINK_KEYS) {
    const value = (input as Record<string, unknown>)[key];
    if (typeof value !== "string") continue;
    const trimmed = value.replace(/[<>]/g, "").trim().slice(0, 120);
    if (trimmed) clean[key] = trimmed;
  }
  return JSON.stringify(clean);
}

const SOUNDCLOUD_EMBED_HOSTS = new Set(["w.soundcloud.com", "soundcloud.com", "api.soundcloud.com"]);

function isValidSoundcloudEmbedSrc(src: unknown): src is string {
  if (typeof src !== "string") return false;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && SOUNDCLOUD_EMBED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function sanitizeProfileEmbeds(input: unknown): string | null {
  if (input === null) return null;
  if (!Array.isArray(input)) return null;
  const clean = input
    .filter((entry: any) => entry && typeof entry === "object" && isValidSoundcloudEmbedSrc(entry.src))
    .slice(0, 12)
    .map((entry: any) => ({
      id: String(entry.id || `embed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).slice(0, 40),
      src: String(entry.src),
      title: String(entry.title || "").replace(/[<>]/g, "").trim().slice(0, 80),
    }));
  return JSON.stringify(clean);
}

function sanitizeProfilePhotos(input: unknown): string | null {
  if (input === null) return null;
  if (!Array.isArray(input)) return null;
  const clean = input
    .filter((entry: any) => {
      const url = entry && typeof entry === "object" ? entry.url : null;
      return typeof url === "string" && (url.startsWith("/uploads/") || url.startsWith("https://"));
    })
    .slice(0, 6)
    .map((entry: any) => ({
      url: String(entry.url),
      caption: String(entry.caption || "").replace(/[<>]/g, "").trim().slice(0, 60),
    }));
  return JSON.stringify(clean);
}

function sanitizeCoverImageUrl(input: unknown): string | null | false {
  if (input === null || input === "") return null;
  if (typeof input !== "string") return false;
  const trimmed = input.trim().slice(0, 300);
  if (!trimmed) return null;
  if (!trimmed.startsWith("/uploads/") && !trimmed.startsWith("https://")) return false;
  return trimmed;
}

function sanitizeCoverCrop(input: unknown): string | null {
  if (input === null || input === "") return null;
  if (typeof input !== "string") return null;
  try {
    const parsed = JSON.parse(input);
    const offsetX = Math.max(0, Math.min(1, Number(parsed.offsetX ?? 0.5)));
    const offsetY = Math.max(0, Math.min(1, Number(parsed.offsetY ?? 0.5)));
    const scale = Math.max(1, Math.min(3, Number(parsed.scale ?? 1) || 1));
    return JSON.stringify({ offsetX, offsetY, scale });
  } catch {
    return null;
  }
}

function sanitizeTalents(input: unknown): string | null {
  if (input === null) return null;
  if (!Array.isArray(input)) return null;
  const clean = input
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .slice(0, 12)
    .map(entry => entry.replace(/[<>]/g, "").trim().slice(0, 40));
  return JSON.stringify(clean);
}

function sanitizeAffiliatedVenueIds(input: unknown): string | null {
  if (input === null) return null;
  if (!Array.isArray(input)) return null;
  const clean = input
    .map(entry => Number(entry))
    .filter(id => Number.isInteger(id) && id > 0 && !!storage.getBusiness(id))
    .slice(0, 6);
  return JSON.stringify(clean);
}

function sanitizeMarquee(input: unknown): string | null {
  if (input === null) return null;
  if (typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const items = Array.isArray(raw.items)
    ? raw.items.filter((i): i is string => typeof i === "string" && i.trim().length > 0)
        .slice(0, 12).map(i => i.replace(/[<>]/g, "").trim().slice(0, 60))
    : [];
  const speed = Number(raw.speed);
  const color = typeof raw.color === "string" ? raw.color.replace(/[<>]/g, "").trim().slice(0, 20) : "rainbow";
  return JSON.stringify({
    items,
    speed: Number.isFinite(speed) ? Math.min(60, Math.max(12, speed)) : 30,
    color: color || "rainbow",
  });
}

function sanitizePup(input: unknown): string | null {
  if (input === null) return null;
  if (typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const field = (v: unknown) => (typeof v === "string" ? v.replace(/[<>]/g, "").trim().slice(0, 60) : "");
  const name = field(raw.name);
  if (!name) return null;
  return JSON.stringify({ name, hood: field(raw.hood), role: field(raw.role), lookingFor: field(raw.lookingFor) });
}

// ─── Content moderation gate ──────────────────────────────────────────────────
// Runs user-authored text through @shared/contentModeration.
//   BLOCK  → sends a friendly 400 and returns true (caller must stop).
//   REVIEW → content is accepted, but an alert lands in the site owner's inbox.
// Sexual / kink / sex-work content is allowlisted inside the shared module and
// never trips these gates - this only catches the house-rule exclusions
// (scat, blood/gore, weapons, abuse, illegal content, off-platform links).
function moderationGate(
  res: any,
  boardName: string,
  fields: Record<string, string | null | undefined>,
): boolean {
  const result = moderateFields(fields);
  if (result.verdict === "BLOCK") {
    const category = result.reasons[0]?.category || "ABUSE";
    res.status(400).json({ error: moderationMessage(category), moderation: result.reasons });
    return true;
  }
  if (result.verdict === "REVIEW") {
    const snippet = Object.values(fields)
      .filter((v): v is string => typeof v === "string" && !!v.trim())
      .join(" · ")
      .slice(0, 200);
    const reasonText = result.reasons
      .map(r => `${r.category}${r.field ? ` (${r.field})` : ""}: "${r.match}"`)
      .join("; ");
    try {
      storage.notifyOwnerModeration(
        `Moderation review: ${boardName}`,
        `Board: ${boardName}\nVerdict: REVIEW (content was accepted and is live)\nReasons: ${reasonText}\n\nSnippet:\n${snippet}`,
      );
    } catch (err) {
      console.error("[moderation] failed to send owner review alert:", err);
    }
  }
  return false;
}

function publicGiftingPost(post: any, viewerUserId?: number) {
  const userId = Number(post.userId ?? post.user_id);
  const selectedInterestId = Number(post.selectedInterestId ?? post.selected_interest_id ?? 0) || null;
  const isPoster = !!viewerUserId && userId === viewerUserId;
  const allSafeInterests = Array.isArray(post.interests) ? post.interests.map((interest: any) => ({
    id: interest.id,
    userId: interest.userId ?? interest.user_id,
    note: interest.note,
    status: interest.status,
    username: interest.username,
    displayName: interest.displayName,
    photoUrl: interest.photoUrl,
    avatarChoice: interest.avatarChoice,
    avatarRing: interest.avatarRing || "none",
    isMine: viewerUserId ? Number(interest.userId ?? interest.user_id) === viewerUserId : false,
  })) : [];
  // Response notes and identities are private marketplace handoff data. The
  // poster can review the response list; everyone else can only see their own.
  const safeInterests = isPoster
    ? allSafeInterests
    : allSafeInterests.filter((interest: any) => interest.isMine);
  const viewerInterest = allSafeInterests.find((interest: any) => interest.isMine);
  return {
    id: post.id,
    userId,
    postType: post.postType ?? post.post_type,
    title: post.title,
    description: post.description,
    category: post.category,
    neighborhood: post.neighborhood,
    pickupPreference: post.pickupPreference ?? post.pickup_preference,
    photoUrls: post.photoUrls || [],
    status: post.status,
    selectedInterestId: isPoster ? selectedInterestId : null,
    renewCount: post.renewCount ?? post.renew_count ?? 0,
    expiresAt: post.expiresAt ?? post.expires_at,
    reportCount: post.reportCount ?? post.report_count ?? 0,
    createdAt: post.createdAt ?? post.created_at,
    username: post.username,
    displayName: post.displayName,
    posterPhotoUrl: post.posterPhotoUrl,
    avatarChoice: post.avatarChoice,
    posterAvatarRing: post.posterAvatarRing || post.avatarRing || "none",
    interestCount: Number(post.interestCount || 0),
    interests: safeInterests,
    isMine: viewerUserId ? userId === viewerUserId : false,
    selectedUserId: isPoster
      ? allSafeInterests.find((interest: any) => interest.id === selectedInterestId)?.userId || null
      : null,
    viewerSelected: !!viewerInterest && viewerInterest.id === selectedInterestId,
  };
}

function publicSellzPost(post: any, viewerUserId?: number) {
  const userId = Number(post.userId ?? post.user_id);
  const selectedInterestId = Number(post.selectedInterestId ?? post.selected_interest_id ?? 0) || null;
  const isMine = !!viewerUserId && userId === viewerUserId;
  const interests = (Array.isArray(post.interests) ? post.interests : []).map((interest: any) => ({
    id: interest.id,
    userId: Number(interest.userId ?? interest.user_id),
    note: interest.note,
    offerCents: interest.offerCents ?? interest.offer_cents ?? null,
    status: interest.status,
    username: interest.username,
    displayName: interest.displayName,
    photoUrl: interest.photoUrl,
    avatarChoice: interest.avatarChoice,
    avatarRing: interest.avatarRing || "none",
  }));
  const safeInterests = isMine ? interests : interests.filter((interest: any) => interest.userId === viewerUserId);
  return {
    id: post.id, userId, title: post.title, description: post.description,
    category: post.category, condition: post.condition,
    priceCents: Number(post.priceCents ?? post.price_cents),
    negotiable: Boolean(post.negotiable), neighborhood: post.neighborhood,
    pickupPreference: post.pickupPreference ?? post.pickup_preference,
    photoUrls: post.photoUrls || [], status: post.status,
    selectedInterestId: isMine ? selectedInterestId : null,
    expiresAt: post.expiresAt ?? post.expires_at,
    createdAt: post.createdAt ?? post.created_at,
    interestCount: Number(post.interestCount || 0), interests: safeInterests,
    username: post.username, displayName: post.displayName,
    posterPhotoUrl: post.posterPhotoUrl, avatarChoice: post.avatarChoice,
    posterAvatarRing: post.posterAvatarRing || "none", isMine,
    viewerSelected: safeInterests.some((interest: any) => interest.userId === viewerUserId && interest.id === selectedInterestId),
  };
}

function publicGigPost(gig: any, viewerUserId?: number) {
  // contactEmail and adminNotes are workflow-only fields. Contact happens via
  // contextual inbox messaging; moderation notes never enter a public payload.
  const {
    contactEmail: _contactEmail,
    contact_email: _contactEmailSnake,
    adminNotes: _adminNotes,
    admin_notes: _adminNotesSnake,
    ...safe
  } = gig;
  return {
    ...safe,
    isMine: viewerUserId ? gig.userId === viewerUserId : false,
  };
}

const GIFTING_RUN_END = new Date("2026-07-27T00:00:00-07:00").getTime();
const RESTRICTED_GIFTING_TERMS = [
  "weapon", "gun", "ammo", "drugs", "cocaine", "meth", "fentanyl", "prescription",
  "alcohol", "needle", "needles", "poppers", "lube", "lubricant", "insertable",
  "underwear", "stolen", "counterfeit", "hazardous",
];

function parseBoardRejectBody(body: any) {
  const reasonCode = String(body.reasonCode || "").trim().toUpperCase();
  const note = String(body.note || "").trim();
  if (!BOARD_REJECT_REASONS.some(r => r.code === reasonCode)) {
    throw new Error("Invalid reject reason");
  }
  return { reasonCode, note: note || undefined };
}

function parseProfilePhotoRejectBody(body: any) {
  const reasonCode = String(body.reasonCode || "").trim().toUpperCase();
  const note = String(body.note || "").trim();
  if (!PROFILE_PHOTO_REJECT_REASONS.some(r => r.code === reasonCode)) {
    throw new Error("Invalid reject reason");
  }
  return { reasonCode, note: note || undefined };
}

function assertGigBoardAllowed(body: any, fields: {
  title?: string | null;
  description?: string | null;
  skills?: string | null;
  compensation?: string | null;
}) {
  if (!body.acceptRules) throw new Error("You must agree to the GIGZ board rules.");
  const personalsErr = validateGigPostContent(fields);
  if (personalsErr) throw new Error(personalsErr);
}

function assertGiftingAllowed(body: any) {
  if (!giftingPostingOpen()) {
    throw new Error("Public GIFTZ posts are paused after July 26, 2026.");
  }
  if (!body.acceptRules) throw new Error("You must agree to the community rules.");
  const haystack = `${body.title || ""} ${body.description || ""} ${body.category || ""}`.toLowerCase();
  const found = RESTRICTED_GIFTING_TERMS.find(term => haystack.includes(term));
  if (found) throw new Error("This post appears to include a restricted item. Please revise or contact an admin.");
}

function giftingPostingOpen(): boolean {
  return Date.now() < GIFTING_RUN_END || process.env.GIFTING_KEEP_OPEN === "true";
}

function getBaseUrl(req: any) {
  const proto = req.get("x-forwarded-proto") || req.protocol || "https";
  return `${proto}://${req.get("host")}`;
}

function googleRedirectUri(_req: any) {
  // Always use www so OAuth state cookie + Google redirect URI stay on one host.
  return process.env.GOOGLE_REDIRECT_URI || "https://www.zaylist.com/api/auth/google/callback";
}

const GOOGLE_OAUTH_STATE_MAX_MS = 15 * 60 * 1000;
const GOOGLE_OAUTH_STATE_COOKIE = "pdx_g_oauth";

function sessionSecret(): string {
  return process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? "" : "pdxpride_secret_dev_only");
}

function hmacSign(payload: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Stateless OAuth CSRF token - survives mobile browsers that drop the session cookie mid Google hop. */
function createGoogleOAuthState(linkUserId?: number): string {
  const body = Buffer.from(JSON.stringify({
    n: crypto.randomBytes(16).toString("hex"),
    t: Date.now(),
    ...(linkUserId ? { l: linkUserId } : {}),
  })).toString("base64url");
  return `${body}.${hmacSign(body)}`;
}

function parseGoogleOAuthState(state: string): { linkUserId?: number } | null {
  if (!state || !sessionSecret()) return null;
  const dot = state.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  if (!sig || !safeEqualStr(sig, hmacSign(body))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      n?: string;
      t?: number;
      l?: number;
    };
    if (!data.n || typeof data.t !== "number") return null;
    if (Date.now() - data.t > GOOGLE_OAUTH_STATE_MAX_MS || data.t > Date.now() + 60_000) return null;
    return typeof data.l === "number" ? { linkUserId: data.l } : {};
  } catch {
    return null;
  }
}

function readCookie(req: any, name: string): string | undefined {
  const header = String(req.headers?.cookie || "");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

/** HTTPS in production; plain http://127.0.0.1 preview (LOCAL_PREVIEW=1) must not set Secure cookies. */
function productionSecureCookies(): boolean {
  return process.env.NODE_ENV === "production" && process.env.LOCAL_PREVIEW !== "1";
}

function setGoogleOAuthStateCookie(res: any, state: string) {
  const secure = productionSecureCookies() ? "; Secure" : "";
  // append - never replace the session Set-Cookie express-session already queued
  res.append(
    "Set-Cookie",
    `${GOOGLE_OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(GOOGLE_OAUTH_STATE_MAX_MS / 1000)}${secure}`,
  );
}

function clearGoogleOAuthStateCookie(res: any) {
  const secure = productionSecureCookies() ? "; Secure" : "";
  res.append(
    "Set-Cookie",
    `${GOOGLE_OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  );
}

function googleOAuthErrorPage(message: string): string {
  const safe = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Google sign-in</title>
<style>body{font-family:system-ui,sans-serif;background:#06060a;color:#f4f1ea;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px}
.card{max-width:420px;background:#0c0c0f;border:1.5px solid #1c1c22;border-radius:14px;padding:28px}
h1{font-size:1.25rem;margin:0 0 10px}p{color:#c8c4bb;line-height:1.5;margin:0 0 18px}
a{display:inline-block;background:#c8fa3c;color:#06060a;font-weight:800;text-decoration:none;padding:12px 16px;border-radius:8px;margin-right:10px;margin-top:6px}
a.sec{background:transparent;color:#19e3ff;border:1px solid #19e3ff}</style></head>
<body><div class="card"><h1>Google sign-in didn’t finish</h1><p>${safe}</p>
<a href="/api/auth/google">Try Google again</a>
<a class="sec" href="/">Back home</a></div></body></html>`;
}

function makeUsername(email: string) {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 22) || "google_user";
  let username = base.length >= 3 ? base : `${base}_user`;
  let suffix = 1;
  while (storage.getUserByUsername(username)) {
    username = `${base.slice(0, 18)}_${suffix++}`;
  }
  return username;
}

function maybeSyncSiteOwnerPortfolio(user: { id?: number; email?: string | null; username?: string | null } | null | undefined) {
  if (storage.isSiteOwnerUser(user)) storage.syncSiteOwnerPortfolio();
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  let user = storage.getUserById(req.session.userId);
  if (!user || user.status === "deleted") {
    return res.status(401).json({ error: "Not authenticated" });
  }
  user = storage.clearExpiredAccountModeration(user.id) || user;
  // Suspended accounts may only hit auth/status/appeal endpoints.
  if (user.status === "suspended") {
    const path = String(req.path || req.url || "");
    const allowed =
      path.includes("/auth/me") ||
      path.includes("/auth/logout") ||
      path.includes("/auth/suspension-appeal") ||
      path.includes("/auth/community-standards");
    if (!allowed && req.method !== "GET") {
      return res.status(403).json({
        error: "Account suspended",
        suspended: true,
        suspendReasonLabel: user.suspendReasonLabel || null,
        suspendUntil: user.suspendUntil || null,
      });
    }
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  const user = req.session?.userId ? storage.getUserById(req.session.userId) : null;
  if (markAdminSessionForUser(req, user)) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
}

const requireEventResearchAccess = allowAdminOrEventResearchAgent(requireAdmin);

function getSessionAdminUser(req: any) {
  if (!req.session?.userId) return null;
  const user = storage.getUserById(req.session.userId);
  if (!isMainAdminUser(user)) return null;
  req.session.isAdmin = true;
  return user;
}

function sessionIsAdmin(req: any): boolean {
  const user = req.session?.userId ? storage.getUserById(req.session.userId) : null;
  return markAdminSessionForUser(req, user);
}

function getAdminActorUserId(req: any): number | null {
  const sessionUser = req.session?.userId ? storage.getUserById(req.session.userId) : null;
  if (sessionUser && isMainAdminUser(sessionUser)) return sessionUser.id;
  for (const email of ADMIN_USER_EMAILS) {
    const u = storage.getUserByEmail(email);
    if (u) return u.id;
  }
  for (const uname of ADMIN_USERNAMES) {
    const u = storage.getUserByUsername(uname);
    if (u) return u.id;
  }
  return null;
}

/** Acting admin for audit logs (session user preferred over env fallback). */
function getAdminActor(req: any): { id: number | null; username: string | null } {
  const sessionUser = req.session?.userId ? storage.getUserById(req.session.userId) : null;
  if (sessionUser && storage.userIsSiteAdmin(sessionUser)) {
    return { id: sessionUser.id, username: sessionUser.username || null };
  }
  const main = getSessionAdminUser(req);
  if (main) return { id: main.id, username: main.username || null };
  return { id: getAdminActorUserId(req), username: null };
}

function auditAdmin(
  req: any,
  action: string,
  target?: {
    type?: string | null;
    id?: string | number | null;
    label?: string | null;
    detail?: Record<string, unknown> | null;
  },
) {
  const actor = getAdminActor(req);
  storage.logAdminAction({
    actorUserId: actor.id,
    actorUsername: actor.username,
    action,
    targetType: target?.type ?? null,
    targetId: target?.id ?? null,
    targetLabel: target?.label ?? null,
    detail: target?.detail ?? null,
  });
}

function auditEventResearch(
  req: any,
  action: string,
  target?: {
    type?: string | null;
    id?: string | number | null;
    label?: string | null;
    detail?: Record<string, unknown> | null;
  },
) {
  const actor = eventResearchActor(req);
  if (!actor) return auditAdmin(req, action, target);
  storage.logAdminAction({
    actorUserId: null,
    actorUsername: actor,
    action,
    targetType: target?.type ?? null,
    targetId: target?.id ?? null,
    targetLabel: target?.label ?? null,
    detail: target?.detail ?? null,
  });
}

let attendanceHub: ReturnType<typeof initAttendanceWs> | null = null;

function notifyAttendanceUpdate(eventId: number) {
  attendanceHub?.broadcastAttendance(eventId);
}

export function registerRoutes(httpServer: Server, app: Express) {
  assertProductionPersistence();
  assertProductionSecrets();

  // QSEARCH was archived on 2026-08-30. Keep its code and database records for
  // possible future recovery, but make every legacy action inert in production.
  // Event research now runs as a Codex agent workflow, not this scraper/model.
  app.all(
    ["/api/admin/qsearch", "/api/admin/qsearch/*path"],
    requireAdmin,
    (_req, res) =>
      res.status(410).json({
        error: "QSEARCH is archived",
        archived: true,
        replacement: "QSearch 2.0",
      }),
  );

  // The agent can read every old source pathway without reviving QSEARCH.
  app.get("/api/admin/event-research/source-memory", requireEventResearchAccess, (_req, res) => {
    res.json(getEventResearchSourceMemory());
  });

  app.get("/api/admin/event-research/control", requireEventResearchAccess, (_req, res) => {
    res.json(getResearchControlState());
  });

  const sendResearchControlResult = (res: any, result: any, successStatus = 200) => {
    if (!result.ok) return res.status(result.status || 400).json(result);
    return res.status(successStatus).json(result);
  };

  app.post("/api/admin/event-research/runs", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, beginResearchRun(req.body || {}), 201);
  });

  app.post("/api/admin/event-research/runs/:id/source", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, markRunSource({ runId: req.params.id, ...req.body }));
  });

  app.post("/api/admin/event-research/source-memory/schedule", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, setSourceSchedule(req.body));
  });

  app.post("/api/admin/event-research/runs/:id/finish", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, finishResearchRun({ runId: req.params.id, ...req.body }));
  });

  app.post("/api/admin/event-research/evidence", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, recordFieldEvidence(req.body), 201);
  });

  app.post("/api/admin/event-research/identities", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, upsertEntityIdentity(req.body));
  });

  app.post("/api/admin/event-research/conflicts", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, recordConflict(req.body), 201);
  });

  app.post("/api/admin/event-research/review", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, enqueueResearchReview(req.body), 201);
  });

  app.post("/api/admin/event-research/media", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, recordMediaProvenance(req.body), 201);
  });

  app.post("/api/admin/event-research/mistake-tests", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, upsertMistakeTest(req.body));
  });

  app.post("/api/admin/event-research/mistake-tests/result", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, recordMistakeTestResult(req.body));
  });

  app.post("/api/admin/event-research/decision-gate", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, evaluateDecisionGate(req.body));
  });

  app.post("/api/admin/event-research/series", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, upsertEventSeries(req.body));
  });

  app.post("/api/admin/event-research/outcomes", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, recordDecisionOutcome(req.body), 201);
  });

  app.post("/api/admin/event-research/resolve", requireEventResearchAccess, (req, res) => {
    sendResearchControlResult(res, resolveResearchItem(req.body));
  });

  app.post("/api/admin/event-research/source-memory/path", requireEventResearchAccess, (req, res) => {
    const result = recordEventResearchPath({
      runId: req.body?.runId != null ? String(req.body.runId) : null,
      sourceKey: String(req.body?.sourceKey || ""),
      label: String(req.body?.label || ""),
      url: String(req.body?.url || ""),
      pathType: req.body?.pathType != null ? String(req.body.pathType) : undefined,
      outcome: String(req.body?.outcome || "candidate") as "candidate" | "success" | "failure",
      discoveredFrom:
        req.body?.discoveredFrom != null ? String(req.body.discoveredFrom) : null,
      navigationRecipe:
        req.body?.navigationRecipe != null ? String(req.body.navigationRecipe) : null,
      fieldsFound: Array.isArray(req.body?.fieldsFound) ? req.body.fieldsFound : null,
      requiresLogin:
        typeof req.body?.requiresLogin === "boolean" ? req.body.requiresLogin : null,
      evidenceNote:
        req.body?.evidenceNote != null ? String(req.body.evidenceNote) : null,
      error: req.body?.error != null ? String(req.body.error) : null,
    });
    if (!result.ok) return res.status(400).json(result);
    auditEventResearch(req, "event_research_source_memory", {
      type: "event_research_source",
      id: String((result.path as any)?.id || ""),
      detail: {
        sourceKey: req.body?.sourceKey,
        outcome: req.body?.outcome,
        pathType: req.body?.pathType,
      },
    });
    res.json(result);
  });

  /**
   * Narrow machine catalog for QSearch 2.0. Unlike /api/admin/events, this
   * omits member/admin profiles and accepts only the dedicated agent token or
   * a live admin session.
   */
  app.get("/api/admin/event-research/events", requireEventResearchAccess, (req, res) => {
    const from = String(req.query.from || "").trim();
    const events = storage
      .getEvents({})
      .filter(event => event.status === "LIVE" || event.status === "HIDDEN")
      .filter(event => !from || String(event.dateEnd || event.dateStart || "") >= from)
      .map(event => eventForResearchAgent(event as any));
    res.json({ generatedAt: new Date().toISOString(), events });
  });

  app.get("/api/admin/event-research/changes", requireEventResearchAccess, (req, res) => {
    res.json({
      generatedAt: new Date().toISOString(),
      changes: listEventResearchChanges(Number(req.query.limit) || 100),
    });
  });

  app.post("/api/admin/event-research/events", requireEventResearchAccess, (req, res) => {
    const result = createEventFromResearch({
      event: req.body?.event,
      evidenceReceipts: req.body?.evidenceReceipts,
      reason: req.body?.reason,
      mistakeTestsPassed: req.body?.mistakeTestsPassed === true,
      runId: req.body?.runId,
      idempotencyKey: req.body?.idempotencyKey,
      dryRun: req.body?.dryRun === true,
    });
    if (!result.ok) return res.status(result.status).json(result);
    auditEventResearch(req, "event_research_event_create", {
      type: "event",
      id: result.event.id,
      label: result.event.title,
      detail: {
        evidenceReceiptCount: result.evidenceReceipts.length,
        rollbackAvailable: result.rollback.available,
      },
    });
    res.status(201).json(result);
  });

  app.post("/api/admin/event-research/events/:id/change", requireEventResearchAccess, (req, res) => {
    const result = applyEventResearchEventChange(Number(req.params.id), {
      expectedUpdatedAt: String(req.body?.expectedUpdatedAt || ""),
      patch: req.body?.patch,
      evidenceReceipts: req.body?.evidenceReceipts,
      reason: req.body?.reason,
      mistakeTestsPassed: req.body?.mistakeTestsPassed === true,
      runId: req.body?.runId,
      idempotencyKey: req.body?.idempotencyKey,
      dryRun: req.body?.dryRun === true,
    });
    if (!result.ok) return res.status(result.status).json(result);
    auditEventResearch(req, "event_research_event_change", {
      type: "event",
      id: result.event.id,
      label: result.event.title,
      detail: {
        changedFields: result.changedFields,
        evidenceReceiptCount: result.evidenceReceipts.length,
        rollbackAvailable: result.rollback.available,
      },
    });
    res.json(result);
  });

  app.post(
    "/api/admin/event-research/changes/:rollbackToken/rollback",
    requireEventResearchAccess,
    (req, res) => {
      if (req.body?.confirm !== true) {
        return res.status(400).json({ error: "confirm: true is required" });
      }
      const result = rollbackEventResearchChange(String(req.params.rollbackToken || ""));
      if (!result.ok) return res.status(result.status).json(result);
      auditEventResearch(req, "event_research_event_rollback", {
        type: "event",
        id: result.eventId,
        detail: {
          operation: result.operation,
          alreadyRolledBack: result.alreadyRolledBack === true,
          rolledBackAt: result.rolledBackAt,
        },
      });
      res.json(result);
    },
  );

  // Lightweight probe for Railway healthchecks - must not hit the DB.
  // Public tip links (Venmo + optional Stripe Payment Link for Apple Pay / cards).
  // Set STRIPE_PAYMENT_LINK (or TIP_STRIPE_URL) on Railway after creating a Payment Link.
  app.get("/api/site/tip-links", (_req, res) => {
    const stripe =
      process.env.STRIPE_PAYMENT_LINK?.trim() ||
      process.env.TIP_STRIPE_URL?.trim() ||
      process.env.VITE_STRIPE_PAYMENT_LINK?.trim() ||
      null;
    const venmoHandle =
      process.env.VENMO_HANDLE?.trim() ||
      process.env.TIP_VENMO_HANDLE?.trim() ||
      null;
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(buildTipLinks({ stripePaymentLink: stripe, venmoHandle }));
  });

  app.get("/api/health", (_req, res) => {
    // Health must stay up even if the DB is briefly unavailable.
    let pushSubscriptions = 0;
    if (isPushConfigured()) {
      try {
        pushSubscriptions = storage.countActivePushSubscriptions();
      } catch (err) {
        console.error("[health] countActivePushSubscriptions failed:", err);
      }
    }
    const gitShaRaw =
      process.env.RAILWAY_GIT_COMMIT_SHA ||
      process.env.RAILWAY_GIT_COMMIT_MESSAGE ||
      process.env.GIT_COMMIT ||
      "";
    // Prefer full SHA when present; fall back to first token of commit message.
    const gitSha = gitShaRaw.trim()
      ? (gitShaRaw.match(/^[0-9a-f]{7,40}/i)?.[0] || gitShaRaw.trim().slice(0, 40))
      : undefined;
    const railwayEnvironment =
      process.env.RAILWAY_ENVIRONMENT_NAME ||
      process.env.RAILWAY_ENVIRONMENT ||
      undefined;
    const deploymentId = process.env.RAILWAY_DEPLOYMENT_ID || undefined;
    res.json({
      ok: true,
      ts: new Date().toISOString(),
      pushConfigured: isPushConfigured(),
      emailConfigured: isTransactionalEmailConfigured(),
      pushSubscriptions,
      ...(gitSha ? { gitSha } : {}),
      ...(railwayEnvironment ? { railwayEnvironment } : {}),
      ...(deploymentId ? { deploymentId } : {}),
    });
  });

  // Auto-generated game poster (Swedish-minimal, Sports Bra brand). Stateless
  // image from short text params; small in-memory cache + long browser cache.
  // Used as fallback art for watch-party games that have no flyer.
  const gamePosterCache = new Map<string, Buffer>();
  const clip = (s: unknown, n: number): string => String(s ?? "").slice(0, n);
  app.get("/api/game-poster", async (req, res) => {
    try {
      const q = req.query as Record<string, string>;
      const input = {
        league: clip(q.league, 40) || "Game Day",
        tag: clip(q.tag, 24) || "Watch Party",
        away: clip(q.away, 60) || "Women's Sports",
        home: clip(q.home, 60) || null,
        dateLabel: clip(q.date, 40) || "This Week",
        timeLabel: clip(q.time, 24) || "See Bar",
      };
      const key = JSON.stringify(input);
      let png = gamePosterCache.get(key);
      if (!png) {
        png = await renderGamePosterPng(input);
        if (gamePosterCache.size > 200) gamePosterCache.clear();
        gamePosterCache.set(key, png);
      }
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "public, max-age=86400, immutable");
      return res.send(png);
    } catch (err) {
      return res.status(500).json({ error: "poster render failed" });
    }
  });

  // 1200×630 branded social cards (replace raw flyer/logo in og:image)
  app.get("/api/og/event/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const { renderEventOgCard } = await import("./ogCards");
      const buf = await renderEventOgCard(id);
      if (!buf) return res.status(404).json({ error: "Event not found" });
      res.set({
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      });
      return res.send(buf);
    } catch (err) {
      console.error("GET /api/og/event failed:", err);
      return res.status(500).json({ error: "Could not render card" });
    }
  });

  app.get("/api/og/place/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const { renderPlaceOgCard } = await import("./ogCards");
      const buf = await renderPlaceOgCard(id);
      if (!buf) return res.status(404).json({ error: "Place not found" });
      res.set({
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      });
      return res.send(buf);
    } catch (err) {
      console.error("GET /api/og/place failed:", err);
      return res.status(500).json({ error: "Could not render card" });
    }
  });

  app.get("/api/og/profile/:username", async (req, res) => {
    try {
      const username = String(req.params.username || "").trim().replace(/^@/, "");
      if (!username) return res.status(400).json({ error: "Invalid username" });
      const { renderProfileOgCard } = await import("./ogCards");
      const buf = await renderProfileOgCard(username);
      if (!buf) return res.status(404).json({ error: "Profile not found" });
      res.set({
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=86400",
      });
      return res.send(buf);
    } catch (err) {
      console.error("GET /api/og/profile failed:", err);
      return res.status(500).json({ error: "Could not render card" });
    }
  });

  attendanceHub = initAttendanceWs(httpServer);
  storage.syncSiteOwnerPortfolio();

  // Machine-readable discovery for search engines and AI crawlers.
  app.get("/llms.txt", (_req, res) => {
    res.type("text/plain; charset=utf-8").send(buildLlmsTxt(getLiveEventsForSeo()));
  });

  app.get("/sitemap.xml", (_req, res) => {
    res.type("application/xml; charset=utf-8").send(buildSitemapXml(getLiveEventsForSeo()));
  });

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain; charset=utf-8").send(buildRobotsTxt());
  });

  // Session middleware - persisted on the same SQLite volume as user data
  app.use(session({
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("SESSION_SECRET env var is required in production"); })() : "pdxpride_secret_dev_only"),
    store: new BetterSqliteSessionStore(sqlite),
    proxy: true,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: productionSecureCookies(),
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));
  registerCommunityRoutes(app, requireAuth);
  registerPlatformV1(app);

  // ─── FILE UPLOADS ───────────────────────────────────────────────────────
  // Poster image upload (event submit / claim edit)
  app.post("/api/upload/poster", requireAuth, upload.single("poster"), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file or invalid type (jpg/png/gif/webp, max 8MB)" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Flyer autofill: a submitter uploads a poster; we read it (OCR + vision) and
  // return SUGGESTED form fields for them to review. Suggestions only - nothing
  // is created here; the real submit still goes through /api/submit's moderation.
  // Daily caps + the shared FLYER_LLM_DISABLED kill switch keep vision cost bounded.
  const flyerAutofill = { day: "", perUser: new Map<string, number>(), global: 0 };
  const FLYER_AUTOFILL_USER_DAILY = Math.max(1, Number(process.env.FLYER_AUTOFILL_USER_DAILY) || 10);
  const FLYER_AUTOFILL_GLOBAL_DAILY = Math.max(1, Number(process.env.FLYER_AUTOFILL_GLOBAL_DAILY) || 200);
  app.post("/api/flyer-autofill", requireAuth, async (req: any, res: any) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (flyerAutofill.day !== today) {
        flyerAutofill.day = today;
        flyerAutofill.perUser.clear();
        flyerAutofill.global = 0;
      }
      const uid = String(req.session?.userId ?? req.user?.id ?? "anon");
      const used = flyerAutofill.perUser.get(uid) || 0;
      if (flyerAutofill.global >= FLYER_AUTOFILL_GLOBAL_DAILY || used >= FLYER_AUTOFILL_USER_DAILY) {
        return res
          .status(429)
          .json({ error: "Flyer autofill limit reached for today - you can still fill the form in manually." });
      }

      const uploadUrl = String(req.body?.uploadUrl || "");
      if (!uploadUrl.startsWith("/uploads/")) {
        return res.status(400).json({ error: "Upload the flyer first, then autofill." });
      }
      // Confine to UPLOADS_DIR (no traversal) and cap size.
      const filePath = path.join(UPLOADS_DIR, path.basename(uploadUrl));
      if (!filePath.startsWith(UPLOADS_DIR) || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Flyer not found." });
      }
      if (fs.statSync(filePath).size > 8 * 1024 * 1024) {
        return res.status(413).json({ error: "Flyer too large (max 8MB)." });
      }

      const imageBuffer = fs.readFileSync(filePath);
      const { ocrFlyer } = await import("./flyerReader/ocr");
      const { structureFlyer } = await import("./flyerReader/parse");
      let rawText = "";
      let ocrConfidence: number | undefined;
      try {
        const ocr = await ocrFlyer(imageBuffer);
        rawText = ocr.text;
        ocrConfidence = ocr.confidence;
      } catch {
        /* OCR optional - vision reads the image directly */
      }
      const parse = await structureFlyer({ imageBuffer, rawText, ocrConfidence });

      // Count only a successful read against the cap.
      flyerAutofill.perUser.set(uid, used + 1);
      flyerAutofill.global += 1;

      // Shape to the Submit form (datetime-local "YYYY-MM-DDTHH:mm").
      const dateStart = parse.start_date ? `${parse.start_date}T${parse.time || "21:00"}` : null;
      const dateEnd = parse.end_date ? `${parse.end_date}T02:00` : null;
      return res.json({
        ok: true,
        confidence: parse.confidence,
        model: parse.model,
        fields: {
          title: parse.title,
          description: parse.description,
          venueName: parse.venue,
          address: parse.address,
          dateStart,
          dateEnd,
          ticketUrl: parse.url,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: "Could not read that flyer - please fill the form in manually." });
    }
  });

  app.post("/api/admin/upload/poster", requireAdmin, upload.single("poster"), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file or invalid type (jpg/png/gif/webp, max 8MB)" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Profile photo upload (client sends pre-cropped circle JPEG from AvatarEditor)
  app.post("/api/upload/avatar", requireAuth, upload.single("avatar"), async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file or invalid type" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // Profile cover image upload (full image; client stores crop/position metadata separately)
  app.post("/api/upload/cover", requireAuth, upload.single("cover"), async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file or invalid type" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  app.post("/api/upload/gifting", requireAuth, upload.array("photos", 2), (req: any, res: any) => {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) return res.status(400).json({ error: "Upload 1 or 2 image files (jpg/png/gif/webp, max 8MB each)" });
    res.json({ urls: files.slice(0, 2).map((file: any) => `/uploads/${file.filename}`) });
  });
  app.post("/api/upload/sellz", requireAuth, upload.array("photos", 6), (req: any, res: any) => {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) return res.status(400).json({ error: "Upload 1 to 6 image files (jpg/png/gif/webp, max 8MB each)" });
    res.json({ urls: files.slice(0, 6).map((file: any) => `/uploads/${file.filename}`) });
  });

  // Public "Message me" / sponsorship pitch / custom order form - no login required, lands in Owner Desk only.
  app.post("/api/contact/message", contactUpload.array("attachments", 3), (req: any, res: any) => {
    const honeypot = String(req.body?.company || "").trim();
    if (honeypot) return res.json({ ok: true }); // bot filled the hidden field - silently drop

    const kindRaw = String(req.body?.kind || "message").trim().toLowerCase();
    const kind =
      kindRaw === "sponsor" ? "sponsor" as const
      : kindRaw === "order" ? "order" as const
      : "message" as const;
    const name = String(req.body?.name || "").trim().slice(0, 120);
    const email = String(req.body?.email || "").trim().slice(0, 200);
    const phone = String(req.body?.phone || "").trim().slice(0, 40);
    const message = String(req.body?.message || "").trim().slice(0, 4000);
    const businessName = String(req.body?.businessName || "").trim().slice(0, 160);
    const lengthNeeded = String(req.body?.lengthNeeded || "").trim().slice(0, 120);
    const sponsorshipType = String(req.body?.sponsorshipType || "").trim().slice(0, 80);
    const size = String(req.body?.size || "").trim().slice(0, 80);
    const hangingSpace = String(req.body?.hangingSpace || "").trim().slice(0, 800);
    const ceilingHeight = String(req.body?.ceilingHeight || "").trim().slice(0, 120);

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }
    if (kind === "sponsor" && (!businessName || !lengthNeeded)) {
      return res.status(400).json({ error: "Business name and length of time needed are required." });
    }
    if (kind === "order" && (!size || !hangingSpace || !ceilingHeight)) {
      return res.status(400).json({ error: "Size, hanging space, and ceiling height are required for an order inquiry." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const attachmentUrls = files.map((file: any) => `/uploads/${file.filename}`);

    const pageUrl = String(req.body?.pageUrl || req.get("referer") || "/about").slice(0, 500);
    const delivered = storage.sendPortfolioContactMessage({
      kind,
      name,
      email,
      phone: phone || undefined,
      message,
      businessName: businessName || undefined,
      lengthNeeded: lengthNeeded || undefined,
      sponsorshipType: sponsorshipType || undefined,
      size: size || undefined,
      hangingSpace: hangingSpace || undefined,
      ceilingHeight: ceilingHeight || undefined,
      attachmentUrls,
      pageUrl,
    });
    if (!delivered) return res.status(500).json({ error: "Could not deliver the message right now." });
    void sendOwnerDeskNotification().catch(err => {
      console.error("[email] owner desk notification failed:", err instanceof Error ? err.message : err);
    });
    res.json({ ok: true });
  });

  // Serve uploaded files statically (ESM-safe - do not use require())
  app.use("/uploads", express.static(UPLOADS_DIR));

  // ─── ANALYTICS ──────────────────────────────────────────────────────────
  app.post("/api/analytics/pageview", (req, res) => {
    const schema = z.object({
      path: z.string().trim().min(1).max(240),
      visitorId: z.string().trim().min(8).max(80),
      sessionId: z.string().trim().min(8).max(80),
      referrer: z.string().trim().max(500).optional().nullable(),
      deviceType: z.enum(["mobile", "desktop", "tablet"]).optional().nullable(),
      userId: z.number().int().positive().optional().nullable(),
    });
    try {
      const data = schema.parse(req.body);
      const ok = recordPageView(sqlite, {
        path: data.path,
        visitorId: data.visitorId,
        sessionId: data.sessionId,
        referrer: data.referrer,
        deviceType: data.deviceType,
        userId: data.userId ?? req.session?.userId ?? null,
      });
      if (!ok) return res.status(204).end();
      res.json({ ok: true });
    } catch {
      res.status(400).json({ error: "Invalid analytics payload" });
    }
  });

  app.post("/api/analytics/product-event", (req, res) => {
    const schema = z.object({
      eventName: z.enum(PRODUCT_EVENT_NAMES),
      surface: z.string().trim().min(1).max(60).regex(/^[a-z0-9:_-]+$/),
      value: z.number().nonnegative().max(3_600_000).optional().nullable(),
      visitorId: z.string().trim().min(8).max(80),
      sessionId: z.string().trim().min(8).max(80),
    });
    try {
      const data = schema.parse(req.body);
      const ok = recordProductEvent(sqlite, { ...data, userId: req.session?.userId ?? null });
      if (!ok) return res.status(204).end();
      res.json({ ok: true });
    } catch {
      res.status(400).json({ error: "Invalid analytics payload" });
    }
  });

  // ─── EVENTS ─────────────────────────────────────────────────────────────
  app.get("/api/events", (req, res) => {
    const { day } = req.query;
    // Collapse same-day/same-time duplicates so the public board never shows the
    // same event twice (non-destructive — nothing is deleted from the DB).
    let evts = dedupeEvents(expandMultiDayEvents(storage.getEvents({ status: "LIVE" })));
    if (typeof day === "string" && day.length > 0) {
      evts = evts.filter(evt => evt.dayOfWeek === day);
    }
    const pendingClaimIds = new Set(storage.getPendingClaimEventIds());
    const websites = venueWebsiteIndex();
    res.json(evts.map(evt => publicEvent(evt, pendingClaimIds, websites)));
  });

  /**
   * Lifetime event count for the About page — every distinct event the site has
   * ever published (LIVE now or previously public then REMOVED), de-duped so
   * same-day/same-time doubles count once. HIDDEN drafts were never public.
   */
  app.get("/api/events/total", (_req, res) => {
    const published = storage
      .getEvents({})
      .filter(e => e.status === "LIVE" || e.status === "REMOVED");
    const total = new Set(published.map(e => eventDedupeKey(e))).size;
    res.json({ total });
  });

  app.get("/api/events/unclaimed", (req, res) => {
    const pendingClaimIds = new Set(storage.getPendingClaimEventIds());
    const websites = venueWebsiteIndex();
    const evts = storage.getEvents({ status: "LIVE" }).filter(evt =>
      evt.isClaimable && !evt.claimedBy && !pendingClaimIds.has(evt.id)
      && isPublicEventVisibleUnderPrideCap(evt)
    );
    res.json(evts.map(evt => publicEvent(evt, pendingClaimIds, websites)));
  });

  app.get("/api/events/attendance-summaries", (_req, res) => {
    res.json(storage.getAttendanceSummaries());
  });

  // Homepage counters need three numbers, not the full event, directory, and
  // attendance payloads. In particular, /api/directory enriches every place
  // with events, promoters, boards, followers, and viewer state; using it for
  // a count made the strip wait several seconds on otherwise unnecessary work.
  app.get("/api/home/stats", (_req, res) => {
    const now = Date.now();
    const windowEnd = now + 7 * 24 * 60 * 60 * 1000;
    const liveEvents = dedupeEvents(expandMultiDayEvents(storage.getEvents({ status: "LIVE" })));
    const eventCount = liveEvents.filter(event => {
      const start = parsePacificDateTime(event.dateStart);
      if (start == null) return false;
      const end = parsePacificDateTime(event.dateEnd) ?? start;
      return end >= now && start <= windowEnd;
    }).length;
    const placesCount = storage.getBusinesses().length;
    const goingCount = Object.values(storage.getAttendanceSummaries())
      .reduce((sum, summary) => sum + (summary?.count ?? 0), 0);

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
    res.json({ eventCount, placesCount, goingCount });
  });

  // ── Next-page waypoint likes: anonymous "excited for this" counter ──────────
  const WAYPOINT_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
  const bumpWaypointLike = (id: string, delta: number) => {
    sqlite.prepare(`INSERT OR IGNORE INTO waypoint_likes (waypoint_id, count) VALUES (?, 0)`).run(id);
    sqlite.prepare(`UPDATE waypoint_likes SET count = MAX(0, count + ?) WHERE waypoint_id = ?`).run(delta, id);
    const row = sqlite.prepare(`SELECT count FROM waypoint_likes WHERE waypoint_id = ?`).get(id) as { count: number } | undefined;
    return row?.count ?? 0;
  };

  app.get("/api/next/likes", (_req, res) => {
    const rows = sqlite.prepare(`SELECT waypoint_id AS id, count FROM waypoint_likes`).all() as Array<{ id: string; count: number }>;
    const out: Record<string, number> = {};
    for (const r of rows) out[r.id] = r.count;
    res.json(out);
  });

  app.post("/api/next/likes/:id", (req, res) => {
    const id = String(req.params.id || "").toLowerCase();
    if (!WAYPOINT_ID.test(id)) return res.status(400).json({ error: "bad id" });
    res.json({ id, count: bumpWaypointLike(id, 1) });
  });

  app.delete("/api/next/likes/:id", (req, res) => {
    const id = String(req.params.id || "").toLowerCase();
    if (!WAYPOINT_ID.test(id)) return res.status(400).json({ error: "bad id" });
    res.json({ id, count: bumpWaypointLike(id, -1) });
  });

  app.get("/api/nude-beaches", async (_req, res) => {
    try {
      const result = await getNudeBeachesSnapshot();
      res.json(result);
    } catch (err) {
      console.error("GET /api/nude-beaches failed:", err);
      res.status(502).json({ error: "Could not load beach conditions" });
    }
  });

  app.post("/api/nude-beaches/refresh", async (_req, res) => {
    try {
      const result = await forceRefreshNudeBeachesSnapshot();
      res.json({
        data: result.data,
        stale: false,
        fromCache: false,
        rateLimited: !!result.rateLimited,
      });
    } catch (err) {
      console.error("POST /api/nude-beaches/refresh failed:", err);
      res.status(502).json({ error: "Could not refresh beach conditions" });
    }
  });

  // OUTZ (official outdoor conditions + catalog)
  app.get("/api/outz", async (_req, res) => {
    try {
      res.json(await getOutzSnapshot());
    } catch (err) {
      console.error("GET /api/outz failed:", err);
      res.status(502).json({ error: "Outdoor conditions are temporarily unavailable" });
    }
  });

  app.post("/api/outz/refresh", async (_req, res) => {
    try {
      const result = await forceRefreshOutzSnapshot();
      res.json(result);
    } catch (err) {
      console.error("POST /api/outz/refresh failed:", err);
      res.status(502).json({ error: "Outdoor conditions are temporarily unavailable" });
    }
  });

  const knownOutzPlace = async (value: unknown) => {
    const placeId = String(value || "").trim();
    if (!placeId || placeId.length > 180) return null;
    const snapshot = (await getOutzSnapshot()).data;
    const known = [
      ...snapshot.destinations.map(place => place.id),
      ...snapshot.catalog.map(place => place.id),
      ...snapshot.communityStays.map(place => place.id),
    ];
    return known.includes(placeId) ? placeId : null;
  };

  app.get("/api/outz/checkins", async (req: any, res) => {
    try {
      const placeId = await knownOutzPlace(req.query.place);
      const date = String(req.query.date || pacificTodayDate());
      if (!placeId || !isAllowedBeachCheckinDate(date)) return res.status(400).json({ error: "Invalid OUTZ place or date" });
      res.json(getOutzCheckins(placeId, date, req.session?.userId));
    } catch (error) {
      console.error("GET /api/outz/checkins failed:", error);
      res.status(502).json({ error: "Could not load OUTZ check-ins" });
    }
  });

  app.post("/api/outz/checkins", requireAuth, async (req, res) => {
    try {
      const placeId = await knownOutzPlace(req.body.placeId);
      const requestedDates: unknown[] = Array.isArray(req.body.dates) ? req.body.dates : [req.body.date || pacificTodayDate()];
      const dates: string[] = [...new Set(requestedDates.map((value: unknown) => String(value)))];
      const arrivalHour = Number(req.body.arrivalHour);
      const departHour = Number(req.body.departHour);
      if (!placeId || dates.length === 0 || dates.length > 7 || dates.some(date => !isAllowedBeachCheckinDate(date))) {
        return res.status(400).json({ error: "Choose one or more valid OUTZ check-in days" });
      }
      if (!isValidRiverBratsHour(arrivalHour) || !isValidRiverBratsDepartHour(departHour, arrivalHour)) {
        return res.status(400).json({ error: "Choose an arrival between 7am and 9pm and a later departure by 10pm" });
      }
      const note = String(req.body.note || "").trim().slice(0, 80) || null;
      if (moderationGate(res, "OUTZ check-in", { note: note || "" })) return;
      const checkins = dates.map(date => upsertOutzCheckin({
        userId: req.session.userId!, placeId, arrivalHour, departHour, note, calendarDate: date,
        isAnonymous: Boolean(req.body.isAnonymous),
      }));
      res.json({ checkins });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Could not save OUTZ check-in" });
    }
  });

  app.delete("/api/outz/checkins/:id", requireAuth, (req, res) => {
    if (!deleteOutzCheckin(Number(req.params.id), req.session.userId!)) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  app.get("/api/outz/chat", requireAuth, async (req: any, res) => {
    try {
      const placeId = await knownOutzPlace(req.query.place);
      if (!placeId) return res.status(400).json({ error: "Invalid OUTZ place" });
      res.json(getOutzChatMessages(placeId, req.session.userId!));
    } catch (error) {
      console.error("GET /api/outz/chat failed:", error);
      res.status(502).json({ error: "Could not load OUTZ chat" });
    }
  });

  app.post("/api/outz/chat", requireAuth, async (req, res) => {
    try {
      const placeId = await knownOutzPlace(req.body.placeId);
      const date = String(req.body.date || pacificTodayDate());
      const body = String(req.body.body || "").trim();
      if (!placeId || !isAllowedBeachCheckinDate(date)) return res.status(400).json({ error: "Invalid OUTZ place or date" });
      if (!body || body.length > 500) return res.status(400).json({ error: "Message must be 1 to 500 characters" });
      if (moderationGate(res, "OUTZ group chat", { body })) return;
      res.json(postOutzChatMessage(placeId, date, req.session.userId!, body));
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Could not send message" });
    }
  });

  app.get("/api/outz/rating", async (req: any, res) => {
    try {
      const placeId = await knownOutzPlace(req.query.place);
      if (!placeId) return res.status(400).json({ error: "Invalid OUTZ place" });
      res.json(getOutzPlaceRating(placeId, req.session?.userId));
    } catch (error) {
      console.error("GET /api/outz/rating failed:", error);
      res.status(502).json({ error: "Could not load rating" });
    }
  });

  app.post("/api/outz/rating", requireAuth, async (req, res) => {
    try {
      const placeId = await knownOutzPlace(req.body.placeId);
      const rating = Number(req.body.rating);
      if (!placeId || !Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: "Choose a rating from 1 to 5" });
      res.json(upsertOutzPlaceRating(placeId, req.session.userId!, rating));
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Could not save rating" });
    }
  });

  app.get("/api/outz/wall", async (req: any, res) => {
    try {
      const placeId = await knownOutzPlace(req.query.place);
      if (!placeId) return res.status(400).json({ error: "Invalid OUTZ place" });
      res.json(getOutzWallPosts(placeId, req.session?.userId));
    } catch (error) {
      console.error("GET /api/outz/wall failed:", error);
      res.status(502).json({ error: "Could not load destination wall" });
    }
  });

  app.post("/api/outz/wall", requireAuth, async (req, res) => {
    try {
      const placeId = await knownOutzPlace(req.body.placeId);
      const postKind = String(req.body.postKind || "");
      const body = String(req.body.body || "").trim();
      const tripDate = req.body.tripDate ? String(req.body.tripDate) : null;
      if (!placeId || !["LOOKING_FOR_COMPANY", "CARPOOL", "TRIP_NOTE"].includes(postKind)) return res.status(400).json({ error: "Invalid OUTZ post" });
      if (!body || body.length > 500) return res.status(400).json({ error: "Post must be 1 to 500 characters" });
      if (tripDate && !isAllowedBeachCheckinDate(tripDate)) return res.status(400).json({ error: "Choose a trip day in the next week" });
      if (moderationGate(res, "OUTZ trip board post", { body })) return;
      res.json(createOutzWallPost({ placeId, userId: req.session.userId!, postKind, body, tripDate }));
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Could not post to destination wall" });
    }
  });

  app.post("/api/outz/wall/:id/comments", requireAuth, (req, res) => {
    try {
      const body = String(req.body.body || "").trim();
      if (!body || body.length > 300) return res.status(400).json({ error: "Comment must be 1 to 300 characters" });
      if (moderationGate(res, "OUTZ destination comment", { body })) return;
      res.json(createOutzWallComment({ postId: Number(req.params.id), userId: req.session.userId!, body }));
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Could not post comment" });
    }
  });

  app.get("/api/events/:id", (req, res) => {
    const eventId = Number(req.params.id);
    if (isTuckerHostedArchiveId(eventId)) {
      const row = getTuckerHostedArchiveRow(eventId);
      if (!row) return res.status(404).json({ error: "Not found" });
      const archiveEvt = tuckerHostedArchiveAsEvent(row);
      const listing = expandMultiDayEvents([archiveEvt])[0] || archiveEvt;
      return res.json(publicEvent(listing, new Set(), venueWebsiteIndex()));
    }
    const evt = storage.getEvent(eventId);
    if (!evt) return res.status(404).json({ error: "Not found" });
    // Public detail must match list: only LIVE. Admins may open HIDDEN for moderation.
    if (evt.status !== "LIVE" && !sessionIsAdmin(req)) {
      return res.status(404).json({ error: "Not found" });
    }
    // Public detail must match list: suppress post-Pride starts while the lock is active.
    if (!sessionIsAdmin(req) && !isPublicEventVisibleUnderPrideCap(evt)) {
      return res.status(404).json({ error: "Not found" });
    }
    const pendingClaimIds = new Set(storage.getPendingClaimEventIds());
    const expanded = expandMultiDayEvents([evt]);
    const day = typeof req.query.day === "string" ? req.query.day.toUpperCase() : "";
    // Prefer expanded listing; do not fall back to raw post-Pride rows for public.
    const listing =
      (day ? expanded.find(e => e.dayOfWeek === day) : undefined)
      || expanded[0]
      || (sessionIsAdmin(req) ? evt : null);
    if (!listing) return res.status(404).json({ error: "Not found" });
    res.json(publicEvent(listing, pendingClaimIds, venueWebsiteIndex()));
  });

  // ─── SUBMISSIONS ─────────────────────────────────────────────────────────
  app.post("/api/submit", requireAuth, (req, res) => {
    try {
      const user = storage.getUserById(req.session.userId!);
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      if (moderationGate(res, "Event submission", {
        title: req.body.title,
        description: req.body.description,
        venueName: req.body.venueName,
        claimReason: req.body.claimReason,
      })) return;
      const rawType = req.body.type;
      const type = rawType === "CLAIM" ? "CLAIM"
        : rawType === "SUGGEST" ? "SUGGEST"
        : rawType === "PROMOTER_APPLICATION" ? "PROMOTER_APPLICATION"
        : "NEW_EVENT";
      const promoterStatus = user.promoterStatus || "none";
      const isAdminUser = userIsAdminNow(user);

      // Standalone promoter application - no event fields needed
      if (type === "PROMOTER_APPLICATION") {
        const now = new Date().toISOString();
        const data = insertSubmissionSchema.parse({
          type: "PROMOTER_APPLICATION",
          title: `Promoter Application: ${user.displayName || user.username}`,
          description: String(req.body.claimReason || req.body.description || "").trim() || "No details provided",
          venueName: "N/A",
          dateStart: now,
          dateEnd: now,
          ageRequirement: "ALL_AGES",
          eventTypes: "[]",
          admission: "FREE",
          isPublic: true,
          submitterName: user.displayName || user.username,
          submitterEmail: user.email,
          submitterOrg: req.body.submitterOrg || null,
          claimReason: String(req.body.claimReason || "").trim() || null,
        });
        const sub = storage.createSubmission(data);
        if (promoterStatus === "none") storage.setPromoterStatus(user.id, "pending");
        return res.json({ ...sub, pendingPromoterReview: true });
      }

      const eventId = type === "CLAIM" ? Number(req.body.eventId) : null;
      const claimEventId = eventId ?? 0;
      const claimEvent = type === "CLAIM" && Number.isFinite(claimEventId) ? storage.getEvent(claimEventId) : null;
      if (type === "CLAIM") {
        if (!claimEvent || claimEvent.status !== "LIVE" || !claimEvent.isClaimable || claimEvent.claimedBy) {
          return res.status(400).json({ error: "This event is not available to claim." });
        }
        if (storage.getPendingClaimEventIds().includes(claimEventId)) {
          return res.status(409).json({ error: "This event already has a pending claim." });
        }
      }
      const source = type === "CLAIM" && claimEvent ? claimEvent : req.body;
      if (type === "NEW_EVENT" || type === "CLAIM") {
        const blockedBusiness = storage.getBlockedBusinessMatch(user.id, {
          venueName: source.venueName || "",
          address: source.address ?? null,
          lat: source.lat ?? null,
          lng: source.lng ?? null,
        });
        if (blockedBusiness) {
          return res.status(403).json({ error: `${blockedBusiness.name} has blocked you from posting events at their venue.` });
        }
      }
      const data = insertSubmissionSchema.parse({
        ...source,
        type,
        eventId: type === "CLAIM" ? claimEventId : null,
        submitterName: user.displayName || user.username,
        submitterEmail: user.email,
        submitterOrg: req.body.submitterOrg || null,
        claimReason: type === "CLAIM" ? req.body.claimReason : null,
        eventTypes: type === "CLAIM"
          ? source.eventTypes
          : (typeof req.body.eventTypes === "string"
              ? req.body.eventTypes
              : JSON.stringify(req.body.eventTypes || [])),
      });
      const sub = storage.createSubmission(data);
      const potentialMatches = type === "NEW_EVENT" || type === "SUGGEST"
        ? enrichSubmissionMatches(sub)
        : [];
      const strongDuplicate = type === "NEW_EVENT"
        ? submissionHasStrongDuplicate(potentialMatches)
        : undefined;

      // Approved promoters / admins bypass the review queue unless a likely duplicate exists
      if (type === "NEW_EVENT" && (promoterStatus === "approved" || isAdminUser) && !strongDuplicate) {
        storage.autoApproveSubmission(sub.id, user.username);
        const created = storage.getEvents({ status: "LIVE" })
          .filter(evt => evt.submittedBy === user.email && evt.title === sub.title)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        if (created) {
          void fillEventMapCoordinates(created.id).catch(err =>
            console.error("[fillEventMapCoordinates] submit auto-approve failed:", err),
          );
        }
        return res.json({ ...sub, autoApproved: true, potentialMatches });
      }
      if (type === "NEW_EVENT" && strongDuplicate) {
        return res.json({
          ...sub,
          potentialMatches,
          heldForReview: true,
          heldReason: `Possible duplicate of "${strongDuplicate.title}"`,
        });
      }
      if (type === "CLAIM" && (promoterStatus === "approved" || isAdminUser)) {
        storage.autoApproveClaim(sub.id, user.username);
        return res.json({ ...sub, autoApproved: true });
      }

      // NEW_EVENT from unapproved user → goes to queue + flags them for promoter review
      if (type === "NEW_EVENT" && promoterStatus !== "approved" && !isAdminUser) {
        if (promoterStatus === "none") storage.setPromoterStatus(user.id, "pending");
        return res.json({ ...sub, pendingPromoterReview: true, potentialMatches });
      }

      // CLAIM from unapproved user → flag for promoter review
      if (type === "CLAIM" && promoterStatus !== "approved" && !isAdminUser) {
        if (promoterStatus === "none") storage.setPromoterStatus(user.id, "pending");
      }

      // SUGGEST goes straight to queue, no promoter status change
      res.json({ ...sub, potentialMatches });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── CLAIMED EVENT EDIT (owner only) ──────────────────────────────────────
  // Returns events claimed by the logged-in user
  app.get("/api/events/mine/claimed", requireAuth, (req, res) => {
    const userId = req.session.userId!;
    if (!storage.getUserById(userId)) return res.status(404).json({ error: "User not found" });
    const all = storage.getEvents({});
    const mine = all.filter(e => storage.isUserEventHost(e.id, userId)).map(evt => ({
      ...evt,
      posterImageUrl: resolveEventPosterUrl(evt.id, evt.posterImageUrl, evt.dayOfWeek),
    }));
    res.json(mine);
  });

  app.get("/api/events/mine/submitted", requireAuth, (req, res) => {
    const user = storage.getUserById(req.session.userId!);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (storage.isSiteOwnerUser(user)) return res.json([]);
    const mine = storage.getSubmissions().filter(s => s.submitterEmail === user.email);
    res.json(mine);
  });

  app.get("/api/events/mine/check-ins", requireAuth, (req, res) => {
    res.json(storage.getAttendancesByUser(req.session.userId!));
  });

  app.get("/api/events/mine/talent", requireAuth, (req, res) => {
    res.json(storage.getEventTalentByUser(req.session.userId!));
  });

  // Host (or admin) edits an event from the card / hub editor
  app.put("/api/events/:id/edit", requireAuth, async (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const user = storage.getUserById(req.session.userId!);
    const isAdmin = sessionIsAdmin(req);
    if (!user || (!isAdmin && !storage.isUserEventHost(evt.id, user.id))) {
      return res.status(403).json({ error: "Not your event" });
    }
    if (moderationGate(res, "Event edit", {
      title: req.body.title,
      description: req.body.description,
      venueName: req.body.venueName,
    })) return;
    const allowed = [
      "title", "description", "venueName", "address", "neighborhood",
      "dateStart", "dateEnd", "dayOfWeek", "ageRequirement", "admission",
      "ticketUrl", "posterImageUrl", "eventTypes",
      "isPublic", "isHouseParty", "isSexPositive", "nudityOk",
    ];
    // Admins may also set status (e.g. HIDDEN) via the full admin PUT; hosts cannot.
    const patch: any = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    if (patch.eventTypes && Array.isArray(patch.eventTypes)) {
      patch.eventTypes = JSON.stringify(patch.eventTypes);
    }
    const dateErr = validateEventDates(
      patch.dateStart as string | undefined,
      patch.dateEnd as string | undefined,
      evt,
    );
    if (dateErr) return res.status(400).json({ error: dateErr });
    syncDayOfWeek(patch, evt);
    const updated = storage.updateEvent(Number(req.params.id), patch);
    if (updated && (patch.address !== undefined || patch.venueName !== undefined)) {
      await fillEventMapCoordinates(updated.id);
    }
    const fresh = storage.getEvent(Number(req.params.id));
    res.json(fresh ? enrichEventForMap(fresh) : fresh);
  });

  // ─── MODERATION REQUESTS (remove/flag - claims go through /api/submit) ───
  app.post("/api/moderation-request", requireAuth, (req, res) => {
    try {
      const data = insertModerationRequestSchema.parse(req.body);
      if (data.type === "CLAIM") {
        const user = storage.getUserById(req.session.userId!);
        if (!user) return res.status(401).json({ error: "Not authenticated" });
        const claimEventId = Number(data.eventId);
        const claimEvent = Number.isFinite(claimEventId) ? storage.getEvent(claimEventId) : null;
        if (!claimEvent || claimEvent.status !== "LIVE" || !claimEvent.isClaimable || claimEvent.claimedBy) {
          return res.status(400).json({ error: "This event is not available to claim." });
        }
        if (storage.getPendingClaimEventIds().includes(claimEventId)) {
          return res.status(409).json({ error: "This event already has a pending claim." });
        }
        const sub = storage.createSubmission(insertSubmissionSchema.parse({
          ...claimEvent,
          type: "CLAIM",
          eventId: claimEventId,
          submitterName: user.displayName || user.username,
          submitterEmail: user.email,
          submitterOrg: null,
          claimReason: data.proof,
          eventTypes: claimEvent.eventTypes,
        }));
        const promoterStatus = user.promoterStatus || "none";
        if (promoterStatus !== "approved" && !isMainAdminUser(user)) {
          storage.setPromoterStatus(user.id, "pending");
        }
        return res.json({ redirected: "submission", submission: sub });
      }
      const req2 = storage.createModerationRequest(data);
      res.json(req2);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/feedback", (req, res) => {
    try {
      const payload = {
        ...req.body,
        pageUrl: String(req.body.pageUrl || req.get("referer") || "/").slice(0, 500),
        category: String(req.body.category || "BUG").slice(0, 40),
        severity: String(req.body.severity || "MEDIUM").slice(0, 40),
        message: String(req.body.message || "").trim().slice(0, 2000),
        steps: req.body.steps ? String(req.body.steps).trim().slice(0, 2000) : null,
        email: req.body.email ? String(req.body.email).trim().slice(0, 180) : null,
        userAgent: String(req.body.userAgent || req.get("user-agent") || "").slice(0, 500),
      };
      if (!payload.message) return res.status(400).json({ error: "message required" });
      const feedback = storage.createFeedbackReport(insertFeedbackReportSchema.parse(payload));
      res.json({ ok: true, id: feedback.id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── GLOBAL SEARCH: EVENTZ + Places + Communities ─────────────────────────
  app.get("/api/search", (req, res) => {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) {
      return res.json({ q, events: [], places: [], communities: [] });
    }
    res.json({ ...storage.searchGlobal(q), communities: searchCommunities(q, req.session?.userId) });
  });

  // ─── ATTENDANCE ───────────────────────────────────────────────────────────
  app.get("/api/events/:id/attendance", (req, res) => {
    const list = storage.getAttendances(Number(req.params.id), req.session?.userId);
    res.json(list);
  });

  app.post("/api/events/:id/attendance", requireAuth, (req, res) => {
    try {
      const user = storage.getUserById(req.session.userId!);
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const message = String(req.body.message || "").trim();
      if (!message) return res.status(400).json({ error: "message required" });
      // Prefer body.visibility; map legacy isAnonymous / "visible" → public|anonymous|friends.
      const visibility = normalizeAttendanceVisibility(
        req.body.visibility,
        req.body.isAnonymous === true ? true : req.body.isAnonymous === false ? false : undefined,
      );
      const eventId = Number(req.params.id);
      const att = storage.upsertAttendance(eventId, user, message, visibility);
      notifyAttendanceUpdate(eventId);
      res.json(att);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/events/:id/attendance", requireAuth, (req, res) => {
    const eventId = Number(req.params.id);
    storage.removeAttendance(eventId, req.session.userId!);
    notifyAttendanceUpdate(eventId);
    res.json({ ok: true });
  });

  app.get("/api/events/:id/chat", requireAuth, (req, res) => {
    const eventId = Number(req.params.id);
    const payload = storage.getEventChatMessages(eventId, req.session.userId!);
    res.json(payload);
  });

  app.post("/api/events/:id/chat", requireAuth, (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const body = String(req.body.body || "").trim();
      if (!body) return res.status(400).json({ error: "body required" });
      if (body.length > 500) return res.status(400).json({ error: "Message too long" });
      const msg = storage.postEventChatMessage(eventId, req.session.userId!, body);
      res.json(msg);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/events/:eventId/attendance/:attendanceId/message", requireAuth, (req, res) => {
    const eventId = Number(req.params.eventId);
    const senderList = storage.getAttendances(eventId, req.session.userId);
    const senderRsvped = senderList.some((a: any) => a.user_id === req.session.userId);
    if (!senderRsvped) return res.status(403).json({ error: "RSVP required to message attendees" });
    const att = senderList.find((a: any) => a.id === Number(req.params.attendanceId));
    if (!att?.user_id) return res.status(404).json({ error: "Check-in not found" });
    if (att.user_id === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    const evt = storage.getEvent(Number(req.params.eventId));
    const msg = storage.sendMessage(req.session.userId!, Number(att.user_id), `Check-in: ${evt?.title || "Event"}`, body, {
      contextType: "CHECK_IN",
      contextId: Number(req.params.eventId),
      contextLabel: evt?.title || null,
    });
    res.json(msg);
  });

  // ─── GIGS ─────────────────────────────────────────────────────────────────
  // ── Business Directory ──────────────────────────────────────────────────
  app.get("/api/directory", (req, res) => {
    const { type, neighborhood, queerOwned } = req.query as Record<string, string>;
    const businesses = storage.getBusinesses({
      type: type || undefined,
      neighborhood: neighborhood || undefined,
      queerOwned: queerOwned === "true" ? true : undefined,
    });
    const liveEvents = storage.getEvents({ status: "LIVE" });
    // Upcoming Pride nights + past (LIVE past + Tucker archive for Sanctuary/Eagle)
    const withEvents = attachEventsToBusinesses(businesses, liveEvents);
    const withPromoters = attachPromotersToBusinesses(withEvents, id => storage.getPromotersForBusiness(id));
    const missedConnections = storage.getMissedConnections("ACTIVE");
    const gigs = storage.getGigPosts("LIVE");
    const withTabs = attachSpottedAndGigsToBusinesses(withPromoters, missedConnections, gigs);
    // Flag which listings the logged-in user can self-service edit (hosted/claimed/
    // submitted an event there) - drives the "Edit venue info" button client-side;
    // the PATCH endpoint below re-checks this server-side regardless.
    const linkedIds = req.session?.userId
      ? new Set(storage.getUserLinkedBusinesses(req.session.userId).map(b => b.id))
      : null;
    const userId = req.session?.userId;
    res.json(withTabs.map(biz => {
      const isOwner = userId != null && biz.ownerId === userId;
      return {
        ...biz,
        /** Resolved storefronts (JSON column, known multi-loc chains, or primary address). */
        locations: resolveBusinessLocations(biz),
        isOwner,
        canEditVenue: isOwner || (linkedIds?.has(biz.id) ?? false),
        isFollowing: userId != null ? storage.isFollowingBusiness(userId, biz.id) : false,
        followerCount: storage.getBusinessFollowerCount(biz.id),
      };
    }));
  });

  app.post("/api/directory/:id/follow", requireAuth, (req, res) => {
    const businessId = Number(req.params.id);
    const biz = storage.getBusiness(businessId);
    if (!biz || !biz.active) return res.status(404).json({ error: "Venue not found" });
    storage.followBusiness(req.session.userId!, businessId);
    res.json({
      isFollowing: true,
      followerCount: storage.getBusinessFollowerCount(businessId),
    });
  });

  app.delete("/api/directory/:id/follow", requireAuth, (req, res) => {
    const businessId = Number(req.params.id);
    const biz = storage.getBusiness(businessId);
    if (!biz || !biz.active) return res.status(404).json({ error: "Venue not found" });
    storage.unfollowBusiness(req.session.userId!, businessId);
    res.json({
      isFollowing: false,
      followerCount: storage.getBusinessFollowerCount(businessId),
    });
  });

  const memberBusinessSchema = z.object({
    name: z.string().trim().min(2).max(120),
    type: z.enum(["bar", "restaurant", "cafe", "venue", "service", "shop", "hotel", "nonprofit", "healthcare", "realestate", "group", "campground"]),
    description: z.string().trim().min(10).max(2000),
    address: z.string().trim().max(200).optional().nullable(),
    neighborhood: z.string().trim().max(80).optional().nullable(),
    website: z.string().trim().max(300).optional().nullable(),
    instagram: z.string().trim().max(80).optional().nullable(),
    hours: z.string().trim().max(200).optional().nullable(),
    phone: z.string().trim().max(40).optional().nullable(),
    queerOwned: z.boolean().optional().default(false),
    queerFriendly: z.boolean().optional().default(true),
  });

  const directorySubmitSchema = memberBusinessSchema.extend({
    confirmDistinct: z.boolean().optional().default(false),
    /**
     * Does the submitter run this place, or are they just putting it on the map?
     * Adding a listing never confers ownership on its own - "runs" files a normal
     * business claim an admin still has to approve.
     */
    relationship: z.enum(["runs", "adding"]).optional().default("adding"),
    relationshipNote: z.string().trim().max(500).optional().default(""),
  });

  const directoryMatchPreviewSchema = z.object({
    name: z.string().trim().min(2).max(120),
    type: z.enum(["bar", "restaurant", "cafe", "venue", "service", "shop", "hotel", "nonprofit", "healthcare", "realestate", "group", "campground"]).optional(),
    address: z.string().trim().max(200).optional().nullable(),
    neighborhood: z.string().trim().max(80).optional().nullable(),
  });

  app.post("/api/directory/matches", requireAuth, (req, res) => {
    try {
      const data = directoryMatchPreviewSchema.parse(req.body ?? {});
      res.json({ potentialMatches: enrichDirectoryMatches(data) });
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Invalid match preview" });
    }
  });

  app.post("/api/directory", requireAuth, async (req, res) => {
    try {
      const data = directorySubmitSchema.parse(req.body);
      const potentialMatches = enrichDirectoryMatches(data);
      const strongDuplicate = directoryHasStrongDuplicate(potentialMatches);

      if (strongDuplicate && !data.confirmDistinct) {
        return res.json({
          ok: false,
          heldForReview: true,
          heldReason: `Possible duplicate of "${strongDuplicate.name}"`,
          potentialMatches,
        });
      }

      const withCoords = await fillFieldsMapCoordinates({
        venueName: data.name,
        address: data.address ?? undefined,
      });
      const { confirmDistinct: _confirmDistinct, relationship, relationshipNote, ...bizFields } = data;
      const biz = storage.createBusiness({
        ...bizFields,
        address: data.address ?? null,
        neighborhood: data.neighborhood ?? null,
        website: data.website ?? null,
        instagram: data.instagram ?? null,
        hours: data.hours ?? null,
        phone: data.phone ?? null,
        lat: withCoords.lat ?? null,
        lng: withCoords.lng ?? null,
        active: true,
        queerOwned: !!data.queerOwned,
        queerFriendly: data.queerFriendly !== false,
        isNew: false,
        imageUrl: null,
      });
      // Member directory adds go live immediately; notify all admins so they can
      // review what just published.
      const actor = storage.getUserById(req.session.userId!);
      storage.createModerationRequest({
        type: "NEW_DIRECTORY_LISTING",
        // The listing's own id, so the queue row can act on the real venue
        // (set its category, assign its owner) instead of guessing by name.
        eventId: biz.id,
        eventTitle: `${biz.name} · ${biz.type}`,
        requesterName: actor?.displayName || actor?.username || "member",
        requesterEmail: actor?.email || null,
        proof: [biz.neighborhood, biz.address, biz.description].filter(Boolean).join(" · ").slice(0, 500),
      } as any);

      // Adding a listing is not the same as owning it. When the submitter says
      // they run the place, file a normal business claim so it lands in the
      // Venue claims queue and an admin still has to approve ownership.
      let ownershipRequested = false;
      if (relationship === "runs") {
        const reason = (relationshipNote || "").trim() || "Submitted this listing and says they run it.";
        const claim = storage.createBusinessClaim(biz.id, req.session.userId!, reason);
        ownershipRequested = !("error" in claim);
      }

      res.status(201).json({ ...biz, potentialMatches, ownershipRequested });
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Invalid directory listing" });
    }
  });

  // Promoter self-service venue edit: only description/hours/phone/website/instagram/donateUrl,
  // only if the requester has hosted, claimed, or submitted an event matching this business.
  // Name/address/type/lat/lng are never accepted here (would let a linked promoter hijack or
  // relocate a shared directory listing) - edits go live immediately, no moderation queue.
  const businessEditSchema = z.object({
    description: z.string().trim().min(10).max(2000).optional(),
    hours: z.string().trim().max(200).optional().nullable(),
    phone: z.string().trim().max(40).optional().nullable(),
    website: z.string().trim().max(300).optional().nullable(),
    instagram: z.string().trim().max(80).optional().nullable(),
    donateUrl: z.string().trim().max(300).optional().nullable(),
  });

  // Business owners (real ownerId, see claim flow below) get a wider self-service field set.
  // lat/lng always stay geocoded, and imageUrl is never accepted here - logo changes route
  // through the logo-request queue for Tucker's manual conversion (see /api/upload/business-logo).
  const businessOwnerEditSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    address: z.string().trim().max(200).optional().nullable(),
    type: z.enum(["bar", "restaurant", "cafe", "venue", "service", "shop", "hotel", "nonprofit", "healthcare", "realestate", "group", "campground"]).optional(),
    neighborhood: z.string().trim().max(80).optional().nullable(),
    queerOwned: z.boolean().optional(),
    queerFriendly: z.boolean().optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    hours: z.string().trim().max(200).optional().nullable(),
    phone: z.string().trim().max(40).optional().nullable(),
    website: z.string().trim().max(300).optional().nullable(),
    instagram: z.string().trim().max(80).optional().nullable(),
    donateUrl: z.string().trim().max(300).optional().nullable(),
  });

  app.patch("/api/directory/:id", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const existing = storage.getBusiness(id);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const strip = (v: string | null | undefined) => (v == null ? v ?? null : v.replace(/[<>]/g, ""));

    if (existing.ownerId && req.session.userId === existing.ownerId) {
      let parsed: z.infer<typeof businessOwnerEditSchema>;
      try {
        parsed = businessOwnerEditSchema.parse(req.body ?? {});
      } catch (e: any) {
        return res.status(400).json({ error: e.message || "Invalid venue info" });
      }
      const patch: Record<string, unknown> = {};
      for (const key of ["name", "address", "type", "neighborhood", "description", "hours", "phone", "website", "instagram", "donateUrl"] as const) {
        if (parsed[key] !== undefined) patch[key] = typeof parsed[key] === "string" ? strip(parsed[key] as string) : parsed[key];
      }
      if (parsed.queerOwned !== undefined) patch.queerOwned = parsed.queerOwned;
      if (parsed.queerFriendly !== undefined) patch.queerFriendly = parsed.queerFriendly;
      const updated = storage.updateBusiness(id, patch as any);
      if (!updated) return res.status(404).json({ error: "Not found" });
      return res.json(updated);
    }

    const linkedVenues = storage.getUserLinkedBusinesses(req.session.userId!);
    if (!linkedVenues.some(biz => biz.id === id)) {
      return res.status(403).json({ error: "You can only edit venues you've hosted, claimed, or submitted an event at." });
    }

    let parsed: z.infer<typeof businessEditSchema>;
    try {
      parsed = businessEditSchema.parse(req.body ?? {});
    } catch (e: any) {
      return res.status(400).json({ error: e.message || "Invalid venue info" });
    }

    // Only the six allowed fields are ever applied - anything else in req.body (name, address,
    // type, lat, lng, ...) is silently dropped by the zod parse above (unknown keys stripped).
    const patch: Record<string, string | null> = {};
    if (parsed.description !== undefined) patch.description = parsed.description.replace(/[<>]/g, "");
    if (parsed.hours !== undefined) patch.hours = parsed.hours ? parsed.hours.replace(/[<>]/g, "") : null;
    if (parsed.phone !== undefined) patch.phone = parsed.phone ? parsed.phone.replace(/[<>]/g, "") : null;
    if (parsed.website !== undefined) patch.website = parsed.website ? parsed.website.replace(/[<>]/g, "") : null;
    if (parsed.instagram !== undefined) patch.instagram = parsed.instagram ? parsed.instagram.replace(/[<>]/g, "") : null;
    if (parsed.donateUrl !== undefined) patch.donateUrl = parsed.donateUrl ? parsed.donateUrl.replace(/[<>]/g, "") : null;

    const updated = storage.updateBusiness(id, patch);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ── Business ownership: claim an existing venue ──────────────────────────
  app.post("/api/directory/:id/claim", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const claimReason = String(req.body?.claimReason || "").trim();
    if (!claimReason || claimReason.length < 10) {
      return res.status(400).json({ error: "Tell us how you're connected to this venue (10+ characters)." });
    }
    const pendingMerge = !!req.body?.pendingMerge;
    const rawMerge = req.body?.mergePayload;
    const mergePayload = pendingMerge && rawMerge && typeof rawMerge === "object"
      ? buildDirectoryMergePatch(rawMerge as DirectoryMergePayload)
      : undefined;
    const result = storage.createBusinessClaim(id, req.session.userId!, claimReason, {
      mergePayload: mergePayload && Object.keys(mergePayload).length ? mergePayload : undefined,
    });
    if ("error" in result) return res.status(400).json({ error: result.error });
    const user = storage.getUserById(req.session.userId!);
    const eligible = user?.promoterStatus === "approved" || isMainAdminUser(user);
    if (eligible && result.claim && !pendingMerge) {
      const approval = storage.approveBusinessClaim(result.claim.id, user?.username || "system");
      return res.json({ ok: true, autoApproved: true, ...approval });
    }
    res.json({ ok: true, autoApproved: false, claim: result.claim });
  });

  app.get("/api/directory/mine/owned", requireAuth, (req, res) => {
    res.json(storage.getUserOwnedBusinesses(req.session.userId!));
  });

  // ── New-business submission (gig-flow "this address isn't in the system" branch) ──
  const businessSubmissionSchema = z.object({
    name: z.string().trim().min(2).max(120),
    type: z.enum(["bar", "restaurant", "cafe", "venue", "service", "shop", "hotel", "nonprofit", "healthcare", "realestate", "group", "campground"]).default("bar"),
    description: z.string().trim().min(10).max(2000),
    address: z.string().trim().max(200).optional().nullable(),
    neighborhood: z.string().trim().max(80).optional().nullable(),
    hours: z.string().trim().max(200).optional().nullable(),
    phone: z.string().trim().max(40).optional().nullable(),
    website: z.string().trim().max(300).optional().nullable(),
    instagram: z.string().trim().max(80).optional().nullable(),
    logoImageUrl: z.string().trim().max(300).optional().nullable(),
  });

  app.post("/api/directory/new-submission", requireAuth, (req, res) => {
    try {
      const data = businessSubmissionSchema.parse(req.body ?? {});
      const sub = storage.createBusinessSubmission(req.session.userId!, data);
      res.status(201).json(sub);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Invalid business submission" });
    }
  });

  // ── Venue owner: promoters at this venue + blocklist ─────────────────────
  function requireBusinessOwner(req: any, res: any, id: number) {
    const business = storage.getBusiness(id);
    if (!business) { res.status(404).json({ error: "Not found" }); return null; }
    if (business.ownerId !== req.session.userId) { res.status(403).json({ error: "You don't own this venue." }); return null; }
    return business;
  }

  app.get("/api/directory/:id/promoters", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!requireBusinessOwner(req, res, id)) return;
    res.json(storage.getPromotersForBusiness(id));
  });

  app.post("/api/directory/:id/block", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!requireBusinessOwner(req, res, id)) return;
    const userId = Number(req.body?.userId);
    if (!userId) return res.status(400).json({ error: "userId required" });
    const result = storage.blockPromoterFromBusiness(id, userId, req.session.userId!);
    if ("error" in result) return res.status(400).json({ error: result.error });
    res.json({ ok: true });
  });

  app.delete("/api/directory/:id/block/:userId", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!requireBusinessOwner(req, res, id)) return;
    storage.unblockPromoterFromBusiness(id, Number(req.params.userId));
    res.json({ ok: true });
  });

  // ── Venue owner: logo change request (candidate held for Tucker's manual conversion) ──
  app.post("/api/upload/business-logo", requireAuth, upload.single("logo"), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file or invalid type (jpg/png/gif/webp, max 8MB)" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  app.post("/api/directory/:id/logo-request", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!requireBusinessOwner(req, res, id)) return;
    const imageUrl = String(req.body?.imageUrl || "").trim();
    if (!imageUrl) return res.status(400).json({ error: "imageUrl required" });
    const created = storage.createBusinessLogoRequest(id, req.session.userId!, imageUrl);
    res.status(201).json(created);
  });

  app.post("/api/admin/directory", requireAdmin, async (req, res) => {
    const data = req.body;
    if (!data.name || !data.type || !data.description) {
      return res.status(400).json({ error: "name, type, and description are required" });
    }
    const withCoords = await fillFieldsMapCoordinates({
      venueName: data.name,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
    });
    const biz = storage.createBusiness({
      name: String(data.name).trim(),
      type: String(data.type).trim(),
      description: String(data.description).trim(),
      address: data.address != null && String(data.address).trim() ? String(data.address).trim() : null,
      neighborhood:
        data.neighborhood != null && String(data.neighborhood).trim()
          ? String(data.neighborhood).trim()
          : null,
      website: data.website != null && String(data.website).trim() ? String(data.website).trim() : null,
      instagram:
        data.instagram != null && String(data.instagram).trim() ? String(data.instagram).trim() : null,
      phone: data.phone != null && String(data.phone).trim() ? String(data.phone).trim() : null,
      hours: data.hours != null && String(data.hours).trim() ? String(data.hours).trim() : null,
      imageUrl:
        data.imageUrl != null && String(data.imageUrl).trim() ? String(data.imageUrl).trim() : null,
      donateUrl: data.donateUrl != null && String(data.donateUrl).trim() ? String(data.donateUrl).trim() : null,
      lat: withCoords.lat ?? data.lat ?? null,
      lng: withCoords.lng ?? data.lng ?? null,
      active: data.active !== false,
      queerOwned: !!data.queerOwned,
      queerFriendly: data.queerFriendly !== false,
      isNew: data.isNew === true,
      grandOpeningDate: data.grandOpeningDate || null,
    });
    try {
      auditAdmin(req, "directory_create", {
        type: "business",
        id: String(biz.id),
        label: biz.name,
        detail: { type: biz.type, from: "qsearch_or_admin" },
      });
    } catch {
      /* audit optional */
    }
    res.json(biz);
  });

  app.put("/api/admin/directory/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const existing = storage.getBusiness(id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const withCoords = await fillFieldsMapCoordinates({
      venueName: req.body.name ?? existing.name,
      address: req.body.address ?? existing.address,
      lat: req.body.lat ?? existing.lat,
      lng: req.body.lng ?? existing.lng,
    });
    const updated = storage.updateBusiness(id, {
      ...req.body,
      ...(withCoords.lat != null ? { lat: withCoords.lat } : {}),
      ...(withCoords.lng != null ? { lng: withCoords.lng } : {}),
    });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.patch("/api/admin/directory/:id/active", requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    storage.toggleBusinessActive(id, !!req.body.active);
    res.json({ ok: true });
  });

  // ── Gigs ─────────────────────────────────────────────────────────────────
  app.get("/api/gigs", (req, res) => {
    const viewerId = req.session?.userId;
    const gigs = storage.getGigPosts("LIVE").map(gig => publicGigPost(gig, viewerId));
    res.json(gigs);
  });

  app.post("/api/gigs", requireAuth, (req, res) => {
    try {
      if (moderationGate(res, "Gig board", {
        title: req.body.title,
        name: req.body.name,
        description: req.body.description,
        skills: req.body.skills,
        compensation: req.body.compensation,
        location: req.body.location,
      })) return;
      const data = insertGigPostSchema.parse(req.body);
      assertGigBoardAllowed(req.body, data);
      const userId = req.session.userId!;
      if (data.businessId != null) {
        const user = storage.getUserById(userId);
        const eligible = user?.promoterStatus === "approved" || isMainAdminUser(user) || storage.getUserOwnedBusinesses(userId).length > 0;
        if (!eligible) return res.status(403).json({ error: "Only approved promoters and venue owners can link a gig to a directory venue." });
        const business = storage.getBusiness(data.businessId);
        if (!business || !business.active) return res.status(400).json({ error: "That venue is not available to link." });
      }
      const gig = storage.createGigPost({ ...data, userId } as any);
      res.json(gig);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gigs/:id/message", requireAuth, (req, res) => {
    const gig = storage.getGigPosts().find(g => g.id === Number(req.params.id));
    if (!gig?.userId) return res.status(404).json({ error: "Host not available" });
    if (gig.userId === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    if (moderationGate(res, "Gig board message", { body })) return;
    const msg = storage.sendMessage(req.session.userId!, gig.userId, `GIGZ: ${gig.title}`, body, {
      contextType: "GIG",
      contextId: gig.id,
      contextLabel: gig.title,
    });
    res.json(msg);
  });

  // User's own gig posts
  app.get("/api/gigs/mine", requireAuth, (req, res) => {
    const gigs = storage.getGigPostsByUser(req.session.userId!);
    res.json(gigs);
  });

  app.put("/api/gigs/:id", requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const userId = req.session.userId!;
    try {
      const existing = storage.getGigPosts().find(g => g.id === id && g.userId === userId);
      if (!existing) return res.status(404).json({ error: "Not found" });
      assertGigBoardAllowed(req.body, {
        title: req.body.title ?? existing.title,
        description: req.body.description ?? existing.description,
        skills: req.body.skills ?? existing.skills,
        compensation: req.body.compensation ?? existing.compensation,
      });
      if (moderationGate(res, "Gig board edit", {
        title: req.body.title,
        name: req.body.name,
        description: req.body.description,
        skills: req.body.skills,
        compensation: req.body.compensation,
        location: req.body.location,
      })) return;
      storage.updateGigPost(id, userId, req.body);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/gigs/:id", requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const userId = req.session.userId!;
    storage.deleteGigPost(id, userId);
    res.json({ ok: true });
  });

  // ─── OUT OF MY CLOSET: GIFTING ───────────────────────────────────────────
  app.get("/api/gifting/status", (_req, res) => {
    const postingOpen = giftingPostingOpen();
    res.json({
      postingOpen,
      message: postingOpen
        ? "GIFTZ posting is open."
        : "New GIFTZ posts are paused. Existing listings and handoffs stay available.",
    });
  });

  app.get("/api/gifting", (req: any, res) => {
    const posts = storage.getGiftingPosts({ viewerUserId: req.session?.userId });
    res.json(posts.map(post => publicGiftingPost(post, req.session?.userId)));
  });

  app.get("/api/gifting/mine", requireAuth, (req, res) => {
    const posts = storage.getGiftingPostsByUser(req.session.userId!);
    res.json(posts.map(post => publicGiftingPost(post, req.session.userId!)));
  });

  app.get("/api/gifting/:id", (req: any, res) => {
    const post = storage.getGiftingPost(Number(req.params.id));
    if (!post) return res.status(404).json({ error: "Not found" });
    res.json(publicGiftingPost(post, req.session?.userId));
  });

  app.post("/api/gifting", requireAuth, (req, res) => {
    try {
      assertGiftingAllowed(req.body);
      if (moderationGate(res, "Gifting board", {
        title: req.body.title,
        description: req.body.description,
        pickupPreference: req.body.pickupPreference,
      })) return;
      const photoUrls = Array.isArray(req.body.photoUrls) ? req.body.photoUrls.slice(0, 2) : [];
      const postType = req.body.postType === "ISO" ? "ISO" : "GIFT";
      const data = insertGiftingPostSchema.parse({
        userId: req.session.userId!,
        postType,
        title: String(req.body.title || "").trim(),
        description: String(req.body.description || "").trim(),
        category: String(req.body.category || "").trim(),
        neighborhood: String(req.body.neighborhood || "").trim(),
        pickupPreference: String(req.body.pickupPreference || "").trim(),
        photoUrls: JSON.stringify(photoUrls),
      });
      const post = storage.createGiftingPost(data);
      res.json({ ...post, message: "Your GIFTZ post is live." });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/interest", requireAuth, (req, res) => {
    try {
      const post = storage.getGiftingPost(Number(req.params.id));
      if (!post) return res.status(404).json({ error: "Not found" });
      if ((post.post_type || post.postType) !== "GIFT") return res.status(400).json({ error: "Use the In Search Of offer flow for In Search Of posts." });
      const note = String(req.body.note || "").trim();
      if (!note) return res.status(400).json({ error: "A short note is required." });
      if (moderationGate(res, "Gifting interest note", { note })) return;
      const interest = storage.addGiftingInterest(insertGiftingInterestSchema.parse({
        postId: post.id,
        userId: req.session.userId!,
        note,
      }));
      const interestedUser = storage.getUserById(req.session.userId!);
      storage.sendMessage(req.session.userId!, Number(post.user_id), `Gifting interest: ${post.title}`, `${interestedUser?.displayName || interestedUser?.username || "Someone"} raised their hand: ${note}`, {
        contextType: "GIFTING",
        contextId: post.id,
        contextLabel: post.title,
      });
      res.json(interest);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/offer", requireAuth, (req, res) => {
    try {
      const post = storage.getGiftingPost(Number(req.params.id));
      if (!post) return res.status(404).json({ error: "Not found" });
      if ((post.post_type || post.postType) !== "ISO") return res.status(400).json({ error: "Use the interest flow for Gift posts." });
      const note = String(req.body.note || "").trim();
      if (!note) return res.status(400).json({ error: "A short note is required." });
      if (moderationGate(res, "Gifting offer note", { note })) return;
      const offer = storage.addGiftingInterest(insertGiftingInterestSchema.parse({
        postId: post.id,
        userId: req.session.userId!,
        note,
      }));
      const msg = storage.sendMessage(req.session.userId!, Number(post.user_id), `In Search Of offer: ${post.title}`, note, {
        contextType: "GIFTING",
        contextId: post.id,
        contextLabel: post.title,
      });
      res.json({ offer, message: msg });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/interests/:interestId/choose", requireAuth, (req, res) => {
    try {
      const selected = storage.chooseGiftingInterest(Number(req.params.id), Number(req.params.interestId), req.session.userId!);
      if (!selected) return res.status(404).json({ error: "Interest not found" });
      const post = storage.getGiftingPost(Number(req.params.id));
      const body = String(req.body.body || `You were picked for "${post?.title}". Coordinate pickup here.`).trim();
      storage.sendMessage(req.session.userId!, Number((selected as any).userId), `Gifting pickup: ${post?.title || "Gift"}`, body, {
        contextType: "GIFTING",
        contextId: Number(req.params.id),
        contextLabel: post?.title || null,
      });
      res.json(selected);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/mark-gifted", requireAuth, (req, res) => {
    try {
      storage.markGiftingResolved(Number(req.params.id), req.session.userId!, "GIFTED");
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/mark-found", requireAuth, (req, res) => {
    try {
      storage.markGiftingResolved(Number(req.params.id), req.session.userId!, "FOUND");
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/reopen", requireAuth, (req, res) => {
    try {
      storage.reopenGiftingPost(Number(req.params.id), req.session.userId!);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/renew", requireAuth, (req, res) => {
    try {
      storage.renewGiftingPost(Number(req.params.id), req.session.userId!);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/report", requireAuth, (req, res) => {
    try {
      const reason = String(req.body.reason || "").trim();
      if (!reason) return res.status(400).json({ error: "reason required" });
      storage.reportGiftingPost(insertGiftingReportSchema.parse({
        postId: Number(req.params.id),
        reporterUserId: req.session.userId!,
        reason,
      }));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/gifting/:id", requireAuth, (req, res) => {
    try {
      const user = storage.getUserById(req.session.userId!);
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      storage.deleteGiftingPost(Number(req.params.id), user.id, { isAdmin: isMainAdminUser(user) });
      res.json({ ok: true });
    } catch (e: any) {
      const status = e.message === "Not allowed" ? 403 : e.message === "Post not found" ? 404 : 400;
      res.status(status).json({ error: e.message });
    }
  });

  // ─── SELLZ: MEMBER MARKETPLACE ───────────────────────────────────────────
  app.get("/api/sellz", (req: any, res) => {
    res.json(storage.getSellzPosts().map((post: any) => publicSellzPost(post, req.session?.userId)));
  });

  app.get("/api/sellz/mine", requireAuth, (req, res) => {
    res.json(storage.getSellzPostsByUser(req.session.userId!).map((post: any) => publicSellzPost(post, req.session.userId!)));
  });
  app.get("/api/sellz/saved/ids", requireAuth, (req, res) => {
    res.json(storage.getSellzSavedIds(req.session.userId!));
  });

  app.get("/api/sellz/:id", (req: any, res) => {
    const post = storage.getSellzPost(Number(req.params.id));
    if (!post) return res.status(404).json({ error: "Listing not found" });
    res.json(publicSellzPost(post, req.session?.userId));
  });

  app.post("/api/sellz", requireAuth, (req, res) => {
    try {
      if (!req.body.acceptRules) throw new Error("You must agree to the SELLZ marketplace rules.");
      const priceCents = Math.round(Number(req.body.price) * 100);
      if (!Number.isFinite(priceCents) || priceCents < 100 || priceCents > 100000000) {
        throw new Error("Enter a price between $1 and $1,000,000.");
      }
      const haystack = `${req.body.title || ""} ${req.body.description || ""} ${req.body.category || ""}`.toLowerCase();
      if (RESTRICTED_GIFTING_TERMS.some(term => haystack.includes(term))) {
        throw new Error("This listing appears to include a restricted item.");
      }
      if (moderationGate(res, "SELLZ marketplace", { title: req.body.title, description: req.body.description })) return;
      const photoUrls = Array.isArray(req.body.photoUrls) ? req.body.photoUrls.slice(0, 6) : [];
      const post = storage.createSellzPost(insertSellzPostSchema.parse({
        userId: req.session.userId!,
        title: String(req.body.title || "").trim(),
        description: String(req.body.description || "").trim(),
        category: String(req.body.category || "Other").trim(),
        condition: String(req.body.condition || "Good").trim(),
        priceCents,
        negotiable: Boolean(req.body.negotiable),
        neighborhood: String(req.body.neighborhood || "Portland").trim(),
        pickupPreference: String(req.body.pickupPreference || "Message to coordinate").trim(),
        photoUrls: JSON.stringify(photoUrls),
      }));
      res.json(publicSellzPost(post, req.session.userId!));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/sellz/:id", requireAuth, (req, res) => {
    try {
      const priceCents = Math.round(Number(req.body.price) * 100);
      const post = storage.updateSellzPost(Number(req.params.id), req.session.userId!, {
        title: String(req.body.title || "").trim(), description: String(req.body.description || "").trim(),
        category: String(req.body.category || "Other").trim(), condition: String(req.body.condition || "Good").trim(),
        priceCents, negotiable: Boolean(req.body.negotiable), neighborhood: String(req.body.neighborhood || "Portland").trim(),
        pickupPreference: String(req.body.pickupPreference || "Message to coordinate").trim(),
      });
      res.json(publicSellzPost(post, req.session.userId!));
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.post("/api/sellz/:id/interest", requireAuth, (req, res) => {
    try {
      const post = storage.getSellzPost(Number(req.params.id));
      if (!post) return res.status(404).json({ error: "Listing not found" });
      const note = String(req.body.note || "Is this available?").trim();
      const offerCents = req.body.offer == null || req.body.offer === "" ? null : Math.round(Number(req.body.offer) * 100);
      if (offerCents != null && (!Number.isFinite(offerCents) || offerCents < 100)) throw new Error("Enter a valid offer.");
      if (moderationGate(res, "SELLZ buyer message", { note })) return;
      const interest = storage.addSellzInterest(insertSellzInterestSchema.parse({
        postId: Number(req.params.id), userId: req.session.userId!, note, offerCents,
      }));
      const buyer = storage.getUserById(req.session.userId!);
      storage.sendMessage(req.session.userId!, Number(post.user_id), `SELLZ: ${post.title}`,
        `${buyer?.displayName || buyer?.username || "Someone"}: ${note}${offerCents ? `\nOffer: $${(offerCents / 100).toFixed(2)}` : ""}`,
        { contextType: "SELLZ", contextId: post.id, contextLabel: post.title });
      res.json(interest);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.post("/api/sellz/:id/interests/:interestId/choose", requireAuth, (req, res) => {
    try {
      const selected = storage.chooseSellzInterest(Number(req.params.id), Number(req.params.interestId), req.session.userId!);
      const post = storage.getSellzPost(Number(req.params.id));
      storage.sendMessage(req.session.userId!, Number(selected.user_id), `Reserved for you: ${post?.title || "SELLZ listing"}`,
        String(req.body.note || "You are first in line. Coordinate payment and pickup here."),
        { contextType: "SELLZ", contextId: Number(req.params.id), contextLabel: post?.title || null });
      res.json(selected);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  for (const [path, status] of [["reserve", "RESERVED"], ["sold", "SOLD"], ["reopen", "ACTIVE"]] as const) {
    app.post(`/api/sellz/:id/${path}`, requireAuth, (req, res) => {
      try { storage.setSellzStatus(Number(req.params.id), req.session.userId!, status); res.json({ ok: true }); }
      catch (e: any) { res.status(400).json({ error: e.message }); }
    });
  }

  app.post("/api/sellz/:id/renew", requireAuth, (req, res) => {
    try { storage.renewSellzPost(Number(req.params.id), req.session.userId!); res.json({ ok: true }); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.post("/api/sellz/:id/report", requireAuth, (req, res) => {
    try {
      storage.reportSellzPost(insertSellzReportSchema.parse({ postId: Number(req.params.id), reporterUserId: req.session.userId!, reason: String(req.body.reason || "").trim() }));
      res.json({ ok: true });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.post("/api/sellz/:id/save", requireAuth, (req, res) => {
    res.json({ saved: storage.toggleSellzSave(Number(req.params.id), req.session.userId!) });
  });
  app.post("/api/sellz/:id/seen", requireAuth, (req, res) => {
    res.json({ ok: storage.markSellzSaveSeen(Number(req.params.id), req.session.userId!) });
  });

  app.delete("/api/sellz/:id", requireAuth, (req, res) => {
    try { storage.deleteSellzPost(Number(req.params.id), req.session.userId!); res.json({ ok: true }); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ─── USER AUTH ────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, displayName, agreedToCommunityStandards, communityStandardsVersion } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: "username, email, and password are required" });
      }
      if (username.length < 3) return res.status(400).json({ error: "Username must be at least 3 characters" });
      if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
      if (COMMUNITY_STANDARDS_GATE_ENABLED && !agreedToCommunityStandards) {
        return res.status(400).json({ error: "You must agree to the Community Standards and legal terms to join" });
      }
      // Reserved shared guide-admin identity - not a human signup.
      if (storage.isSystemGuideAccount({ username, email })) {
        return res.status(400).json({ error: "That username or email is reserved" });
      }

      const existingEmail = storage.getUserByEmail(email);
      if (existingEmail) return res.status(409).json({ error: "Email already registered" });

      const existingUsername = storage.getUserByUsername(username);
      if (existingUsername) return res.status(409).json({ error: "Username already taken" });

      const version =
        typeof communityStandardsVersion === "string" && communityStandardsVersion
          ? communityStandardsVersion
          : COMMUNITY_STANDARDS_VERSION;
      const now = new Date().toISOString();
      const user = storage.createUser({
        username,
        email,
        passwordHash: password,
        displayName,
        ...(COMMUNITY_STANDARDS_GATE_ENABLED
          ? {
              communityStandardsVersion: version,
              communityStandardsAgreedAt: now,
            }
          : {}),
      });
      const finishRegister = () => {
        req.session.userId = user.id;
        maybeSyncSiteOwnerPortfolio(user);
        res.json(authUserResponse(req, user));
      };
      // Match login: regenerate session before binding the new userId.
      if (typeof req.session.regenerate === "function") {
        return req.session.regenerate(err => {
          if (err) return res.status(500).json({ error: "Session error" });
          finishRegister();
        });
      }
      finishRegister();
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/community-standards/agree", requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const version =
      typeof req.body?.version === "string" && req.body.version
        ? req.body.version
        : COMMUNITY_STANDARDS_VERSION;
    storage.setCommunityStandardsAgreement(userId, { agreed: true, version });
    const user = storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(authUserResponse(req, user));
  });

  app.post("/api/auth/community-standards/decline", (req, res) => {
    const userId = req.session?.userId;
    const version =
      typeof req.body?.version === "string" && req.body.version
        ? req.body.version
        : COMMUNITY_STANDARDS_VERSION;
    if (userId) {
      storage.setCommunityStandardsAgreement(userId, { agreed: false, version });
    }
    const payload = { ok: true, redirectUrl: COMMUNITY_STANDARDS_DECLINE_URL };
    if (typeof req.session?.destroy === "function") {
      req.session.destroy(() => res.json(payload));
      return;
    }
    res.json(payload);
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "username/email and password required" });
    // Accept username or email
    const user = storage.getUserByEmail(email) || storage.getUserByUsername(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    // System guide-admin mailbox cannot be signed into as a person.
    if (storage.isSystemGuideAccount(user)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: "Invalid credentials" });
    if (isLegacyPasswordHash(user.passwordHash)) {
      storage.updatePasswordHash(user.id, hashPassword(password));
    }
    const finishLogin = () => {
      if (user.status === "deleted") {
        return res.status(403).json({ error: "This account has been removed" });
      }
      // Timed suspend/shadow auto-lift on login
      const refreshed = storage.clearExpiredAccountModeration(user.id) || user;
      if (refreshed.status === "deleted") {
        return res.status(403).json({ error: "This account has been removed" });
      }
      req.session.userId = refreshed.id;
      maybeSyncSiteOwnerPortfolio(refreshed);
      res.json(authUserResponse(req, refreshed));
    };
    if (typeof req.session.regenerate === "function") {
      return req.session.regenerate(err => {
        if (err) return res.status(500).json({ error: "Session error" });
        finishLogin();
      });
    }
    finishLogin();
  });

  app.post("/api/auth/password/forgot", async (req, res) => {
    const response = {
      ok: true,
      message: "If that email is registered, a password reset link is on its way.",
    };
    const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 200);
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const matchedEmail = email
      ? (sqlite.prepare(`SELECT email FROM users WHERE LOWER(email) = ? LIMIT 1`).get(email) as { email: string } | undefined)?.email
      : undefined;
    const user = matchedEmail ? storage.getUserByEmail(matchedEmail) : undefined;

    if (user && user.status !== "deleted" && !storage.isSystemGuideAccount(user)) {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      storage.createPasswordResetToken(user.id, tokenHash, expiresAt);
      const baseUrl = (process.env.PUBLIC_BASE_URL?.trim() || "https://www.zaylist.com").replace(/\/$/, "");
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
      void sendPasswordResetEmail({ to: user.email, resetUrl }).catch(err => {
        console.error("[email] password reset delivery failed:", err instanceof Error ? err.message : err);
      });
    }

    res.status(202).json(response);
  });

  app.post("/api/auth/password/reset", (req, res) => {
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");
    if (!/^[a-f0-9]{64}$/.test(token) || password.length < 6) {
      return res.status(400).json({ error: "This reset link is invalid or expired." });
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const changed = storage.resetPasswordWithToken(tokenHash, password);
    if (!changed) return res.status(400).json({ error: "This reset link is invalid or expired." });
    res.json({ ok: true });
  });

  app.get("/api/auth/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).send(googleOAuthErrorPage("Google sign-in is not configured on the server."));
    if (!sessionSecret()) return res.status(500).send(googleOAuthErrorPage("Server session secret is missing."));

    const linkUserId = req.query.link === "1" && req.session.userId ? req.session.userId : undefined;
    // HMAC-signed state: works even when Android Chrome / in-app browsers drop the session cookie on the Google hop.
    const state = createGoogleOAuthState(linkUserId);
    req.session.googleOAuthState = state;
    req.session.googleOAuthLinkUserId = linkUserId;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: googleRedirectUri(req),
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });

    const finishRedirect = () => {
      setGoogleOAuthStateCookie(res, state);
      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    };

    req.session.save((err) => {
      if (err) {
        console.error("Google OAuth session save failed:", err);
        // Still proceed: signed state + cookie do not require the session to survive.
      }
      finishRedirect();
    });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const code = String(req.query.code || "");
      const state = String(req.query.state || "");
      if (!clientId || !clientSecret) {
        return res.status(500).send(googleOAuthErrorPage("Google sign-in is not configured on the server."));
      }
      if (!code) {
        return res.status(400).send(googleOAuthErrorPage("Google did not return an authorization code. Try again from the browser (not an in-app browser if possible)."));
      }

      const cookieState = readCookie(req, GOOGLE_OAUTH_STATE_COOKIE);
      const sessionState = req.session?.googleOAuthState;
      // Prefer HMAC validation (stateless). Session/cookie equality is a fallback for older in-flight logins.
      const signed = parseGoogleOAuthState(state);
      const stateOk = Boolean(
        signed
        || (sessionState && state === sessionState)
        || (cookieState && state === cookieState),
      );
      if (!stateOk) {
        console.warn("Google OAuth state mismatch", {
          hasSessionState: Boolean(sessionState),
          hasCookieState: Boolean(cookieState),
          hasSignedState: Boolean(signed),
          ua: String(req.headers["user-agent"] || "").slice(0, 120),
        });
        clearGoogleOAuthStateCookie(res);
        return res.status(400).send(googleOAuthErrorPage(
          "That sign-in step expired or this browser dropped the login cookie (common in Instagram/TikTok in-app browsers and some Android WebViews). Open zaylist.com in Chrome or your system browser and try Google again.",
        ));
      }

      req.session.googleOAuthState = undefined;
      clearGoogleOAuthStateCookie(res);

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: googleRedirectUri(req),
        }),
      });
      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        console.error("Google token exchange failed:", text);
        return res.status(401).send(googleOAuthErrorPage("Google token exchange failed. Try again in a minute."));
      }
      const token = await tokenRes.json() as { access_token?: string };
      if (!token.access_token) {
        return res.status(401).send(googleOAuthErrorPage("Google token exchange failed. Try again."));
      }

      const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      if (!profileRes.ok) {
        return res.status(401).send(googleOAuthErrorPage("Could not load your Google profile."));
      }
      const profile = await profileRes.json() as {
        email?: string;
        email_verified?: boolean;
        sub?: string;
        name?: string;
        picture?: string;
      };
      if (!profile.email || profile.email_verified === false) {
        return res.status(401).send(googleOAuthErrorPage("Your Google email must be verified to sign in."));
      }
      if (!profile.sub) {
        return res.status(401).send(googleOAuthErrorPage("Could not load your Google profile."));
      }

      const linkUserId = signed?.linkUserId ?? req.session.googleOAuthLinkUserId;
      req.session.googleOAuthLinkUserId = undefined;

      const establishSession = (userId: number, redirectTo: string) => {
        const finish = () => {
          req.session.userId = userId;
          const user = storage.getUserById(userId);
          if (user) {
            maybeSyncSiteOwnerPortfolio(user);
            markAdminSessionForUser(req, user);
          }
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Google sign-in session save failed:", saveErr);
              return res.status(500).send(googleOAuthErrorPage("Signed in with Google, but saving your session failed. Try again."));
            }
            res.redirect(redirectTo);
          });
        };
        // Fresh session id after OAuth (matches password login) - cleaner cookies on mobile Chrome.
        if (typeof req.session.regenerate === "function") {
          return req.session.regenerate((err) => {
            if (err) {
              console.error("Google OAuth session regenerate failed:", err);
              return finish();
            }
            finish();
          });
        }
        finish();
      };

      if (linkUserId) {
        if (req.session.userId && req.session.userId !== linkUserId) {
          return res.status(401).send(googleOAuthErrorPage("Google link session expired. Log in again, then link Google from settings."));
        }
        const existingGoogleUser = storage.getUserByGoogleId(profile.sub);
        if (existingGoogleUser && existingGoogleUser.id !== linkUserId) {
          return res.status(409).send(googleOAuthErrorPage("That Google account is already linked to another Zaylist profile."));
        }
        const linkedUser = storage.getUserById(linkUserId);
        if (!linkedUser) {
          return res.status(401).send(googleOAuthErrorPage("Google link session expired. Log in again, then retry linking."));
        }
        storage.linkGoogleToUser(linkUserId, profile.sub);
        if (!linkedUser.photoUrl && profile.picture) storage.updateUser(linkUserId, { photoUrl: profile.picture });
        return establishSession(linkUserId, "/dashboard?google=linked");
      }

      let user = storage.getUserByGoogleId(profile.sub) || storage.getUserByEmail(profile.email);
      if (!user) {
        user = storage.createUser({
          username: makeUsername(profile.email),
          email: profile.email,
          passwordHash: crypto.randomBytes(32).toString("hex"),
          displayName: profile.name || profile.email.split("@")[0],
          googleId: profile.sub,
        });
        if (profile.picture) storage.updateUser(user.id, { photoUrl: profile.picture });
      } else {
        if (!user.googleId) storage.linkGoogleToUser(user.id, profile.sub);
        if (!user.photoUrl && profile.picture) {
          storage.updateUser(user.id, { photoUrl: profile.picture });
        }
      }

      establishSession(user.id, "/dashboard");
    } catch (e) {
      console.error("Google sign-in error:", e);
      res.status(500).send(googleOAuthErrorPage("Something went wrong during Google sign-in. Try again."));
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(err => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      // Must match session cookie attributes or Secure cookies will not clear in browsers.
      res.clearCookie("connect.sid", {
        path: "/",
        secure: productionSecureCookies(),
        httpOnly: true,
        sameSite: "lax",
      });
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
    let user = storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (user.status === "deleted") {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Not authenticated" });
    }
    user = storage.clearExpiredAccountModeration(user.id) || user;
    res.json(authUserResponse(req, user));
  });

  // Username autocomplete - requires auth, returns up to 8 matches
  app.get("/api/users/search", requireAuth, (req, res) => {
    const q = String(req.query.q || "").trim().replace(/^@/, "").toLowerCase();
    if (!q || q.length < 2) return res.json([]);
    const rows = sqlite.prepare(`
      SELECT id, username, display_name AS displayName, photo_url AS photoUrl,
             avatar_choice AS avatarChoice, avatar_ring AS avatarRing
      FROM users
      WHERE LOWER(username) LIKE ? OR LOWER(display_name) LIKE ?
      ORDER BY username COLLATE NOCASE
      LIMIT 8
    `).all(`${q}%`, `${q}%`) as { id: number; username: string; displayName: string | null; photoUrl: string | null; avatarChoice: string | null; avatarRing: string | null }[];
    res.json(rows);
  });

  // Update own profile
  app.put("/api/users/me", requireAuth, (req, res) => {
    const {
      username, displayName, avatarChoice, avatarRing, avatarCrop, bio, photoUrl, coverImageUrl, coverCrop,
      pronouns, location,
      socialLinks, profileEmbeds, profilePhotos, talents, standFor, affiliatedVenueIds, marquee, accentColor, banner, pup,
      top8,
    } = req.body;
    const moderated: Record<string, string | null | undefined> = {
      displayName: typeof displayName === "string" ? displayName : undefined,
      bio: typeof bio === "string" ? bio : undefined,
      pronouns: typeof pronouns === "string" ? pronouns : undefined,
      location: typeof location === "string" ? location : undefined,
      username: typeof username === "string" ? username : undefined,
    };
    if (marquee && typeof marquee === "object" && !Array.isArray(marquee)) {
      const mq = marquee as Record<string, unknown>;
      if (Array.isArray(mq.items)) moderated["marquee.items"] = mq.items.map(String).join(", ");
    }
    if (pup && typeof pup === "object" && !Array.isArray(pup)) {
      const p = pup as Record<string, unknown>;
      if (typeof p.name === "string") moderated["pup.name"] = p.name;
      if (typeof p.lookingFor === "string") moderated["pup.lookingFor"] = p.lookingFor;
    }
    if (socialLinks && typeof socialLinks === "object" && !Array.isArray(socialLinks)) {
      for (const [key, value] of Object.entries(socialLinks as Record<string, unknown>)) {
        // "website" is the one place a member's own off-platform site belongs.
        if (key === "website") continue;
        if (typeof value === "string") moderated[`socialLinks.${key}`] = value;
      }
    }
    if (moderationGate(res, "Member profile", moderated)) return;
    if (username !== undefined) {
      const result = storage.changeUsername(req.session.userId!, username);
      if ("error" in result) return res.status(400).json({ error: result.error });
    }
    if (accentColor !== undefined && accentColor !== null && !isProfileAccentColor(accentColor)) {
      return res.status(400).json({ error: "Invalid accent color" });
    }
    if (banner !== undefined && banner !== null && !isProfileBanner(banner)) {
      return res.status(400).json({ error: "Invalid banner option" });
    }
    const user = storage.getUserById(req.session.userId!);
    const patch: Record<string, unknown> = {};
    if (displayName !== undefined) patch.displayName = displayName;
    if (avatarChoice !== undefined) patch.avatarChoice = avatarChoice;
    if (avatarRing !== undefined) patch.avatarRing = avatarRing || "none";
    if (avatarCrop !== undefined) patch.avatarCrop = avatarCrop || null;
    if (bio !== undefined) patch.bio = bio;
    if (photoUrl !== undefined) {
      const cleanPhoto = sanitizeCoverImageUrl(photoUrl);
      if (cleanPhoto === false) {
        return res.status(400).json({ error: "Invalid photo URL" });
      }
      patch.photoUrl = cleanPhoto;
    }
    if (coverImageUrl !== undefined) {
      const cleanCover = sanitizeCoverImageUrl(coverImageUrl);
      if (cleanCover === false) {
        return res.status(400).json({ error: "Invalid cover image URL" });
      }
      patch.coverImageUrl = cleanCover;
    }
    if (coverCrop !== undefined) patch.coverCrop = sanitizeCoverCrop(coverCrop);
    if (pronouns !== undefined) patch.pronouns = pronouns ? String(pronouns).replace(/[<>]/g, "").trim().slice(0, 40) : null;
    if (location !== undefined) patch.location = location ? String(location).replace(/[<>]/g, "").trim().slice(0, 80) : null;
    if (socialLinks !== undefined) patch.socialLinks = sanitizeSocialLinks(socialLinks);
    if (profileEmbeds !== undefined) patch.profileEmbeds = sanitizeProfileEmbeds(profileEmbeds);
    if (profilePhotos !== undefined) patch.profilePhotos = sanitizeProfilePhotos(profilePhotos);
    if (talents !== undefined) patch.talents = sanitizeTalents(talents);
    // "Stand for" is promoter-only, same reasoning as marquee below.
    if (standFor !== undefined && user?.promoterStatus === "approved") patch.standFor = sanitizeTalents(standFor);
    if (affiliatedVenueIds !== undefined) patch.affiliatedVenueIds = sanitizeAffiliatedVenueIds(affiliatedVenueIds);
    // Marquee is promoter-only - silently ignored for everyone else rather than erroring,
    // since the field simply doesn't apply to a member's own profile.
    if (marquee !== undefined && user?.promoterStatus === "approved") patch.marquee = sanitizeMarquee(marquee);
    if (accentColor !== undefined) patch.accentColor = accentColor === null
      ? null
      : normalizeProfileAccentColor(String(accentColor));
    if (banner !== undefined) patch.banner = banner;
    if (pup !== undefined) patch.pup = sanitizePup(pup);
    // Top 8: up to 8 ordered refs to real people (k:"u") or venues (k:"b").
    if (top8 !== undefined) {
      const arr = Array.isArray(top8) ? top8 : [];
      const clean: { k: "u" | "b"; id: number }[] = [];
      const seen = new Set<string>();
      for (const e of arr) {
        const k = e?.k === "b" ? "b" : e?.k === "u" ? "u" : null;
        const id = Number(e?.id);
        if (!k || !Number.isInteger(id) || id <= 0) continue;
        const key = `${k}:${id}`;
        if (seen.has(key)) continue;
        const exists = k === "u" ? !!storage.getUserById(id) : !!storage.getBusiness(id);
        if (!exists) continue;
        seen.add(key);
        clean.push({ k, id });
        if (clean.length >= 8) break;
      }
      patch.top8 = JSON.stringify(clean);
    }
    storage.updateUser(req.session.userId!, patch as any);
    const updated = storage.getUserById(req.session.userId!);
    res.json(authUserResponse(req, updated));
  });

  // Owner-only: full replace of the profile media card (podcast/playlist) + its item list
  app.put("/api/users/me/media", requireAuth, (req, res) => {
    const { kind, title, tag, cadence, blurb, coverUrl, platformLinks, items } = req.body || {};
    if (kind !== "podcast" && kind !== "playlist") return res.status(400).json({ error: "kind must be podcast or playlist" });
    if (typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "title required" });
    const cleanItems = Array.isArray(items)
      ? items
          .filter((it: any) => it && typeof it.title === "string" && typeof it.audioUrl === "string")
          .slice(0, 30)
          .map((it: any) => ({
            label: typeof it.label === "string" ? it.label.replace(/[<>]/g, "").trim().slice(0, 20) : null,
            title: String(it.title).replace(/[<>]/g, "").trim().slice(0, 120),
            meta: typeof it.meta === "string" ? it.meta.replace(/[<>]/g, "").trim().slice(0, 60) : null,
            audioUrl: String(it.audioUrl).trim().slice(0, 500),
            isEmbed: !!it.isEmbed,
          }))
      : [];
    const cleanPlatforms = Array.isArray(platformLinks)
      ? platformLinks
          .filter((p: any) => p && typeof p.label === "string" && typeof p.url === "string")
          .slice(0, 6)
          .map((p: any) => ({ label: String(p.label).slice(0, 30), url: String(p.url).slice(0, 300) }))
      : [];
    const saved = storage.saveProfileMedia(req.session.userId!, {
      kind,
      title: title.replace(/[<>]/g, "").trim().slice(0, 80),
      tag: typeof tag === "string" ? tag.replace(/[<>]/g, "").trim().slice(0, 30) : null,
      cadence: typeof cadence === "string" ? cadence.replace(/[<>]/g, "").trim().slice(0, 40) : null,
      blurb: typeof blurb === "string" ? blurb.replace(/[<>]/g, "").trim().slice(0, 240) : null,
      coverUrl: typeof coverUrl === "string" ? coverUrl.trim().slice(0, 300) : null,
      platformLinks: cleanPlatforms,
      items: cleanItems,
    });
    res.json(saved);
  });

  // Pack & pup: link/unlink a packmate or handler (real user references, not free text)
  app.post("/api/users/me/pack/:relation", requireAuth, (req, res) => {
    const relation = req.params.relation;
    if (relation !== "packmate" && relation !== "handler") return res.status(400).json({ error: "Invalid relation" });
    const username = String(req.body?.username || "").trim();
    if (!username) return res.status(400).json({ error: "username required" });
    const result = storage.addPackLink(req.session.userId!, relation, username);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ ok: true });
  });

  app.delete("/api/users/me/pack/:relation/:userId", requireAuth, (req, res) => {
    const relation = req.params.relation;
    if (relation !== "packmate" && relation !== "handler") return res.status(400).json({ error: "Invalid relation" });
    storage.removePackLink(req.session.userId!, relation, Number(req.params.userId));
    res.json({ ok: true });
  });

  // ─── HUB SCENE FEED ──────────────────────────────────────────────────────
  app.get("/api/hub/feed", requireAuth, (req, res) => {
    const tab = parseHubFeedTab(typeof req.query.tab === "string" ? req.query.tab : null);
    const limit = Number(req.query.limit) || 30;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const feed = storage.getHubFeed({
      tab,
      limit: Number.isFinite(limit) ? limit : 30,
      cursor,
      viewerUserId: req.session.userId,
      viewerIsAdmin: sessionIsAdmin(req),
    });
    res.json(feed);
  });

  app.get("/api/hub/feed/post-options", requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const isAdmin = sessionIsAdmin(req);
    const canPost = storage.canUserPostToHubFeed(userId, isAdmin);
    const hostedIds = storage.getHostedLiveEventIds(userId);
    const hostedEvents = hostedIds.map((id) => {
      const evt = storage.getEvent(id);
      if (!evt) return null;
      return { id: evt.id, title: evt.title, venueName: evt.venueName, dayOfWeek: evt.dayOfWeek };
    }).filter(Boolean);
    const ownedVenues = storage.getUserOwnedBusinesses(userId).map((biz) => ({
      id: biz.id,
      name: biz.name,
      type: biz.type,
      logoUrl: biz.imageUrl ?? null,
    }));
    res.json({ canPost, hostedEvents, ownedVenues });
  });

  app.get("/api/hub/feed/posts/mine", requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const isAdmin = sessionIsAdmin(req);
    if (!storage.canUserPostToHubFeed(userId, isAdmin)) {
      return res.status(403).json({ error: "Not allowed to post to the scene feed" });
    }
    const posts = storage.getHubFeedPostsByUser(userId, 20);
    res.json(posts);
  });

  app.post("/api/hub/feed/posts", requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const user = storage.getUserById(userId);
    const isAdmin = sessionIsAdmin(req);
    if (!user || !storage.canUserPostToHubFeed(userId, isAdmin)) {
      return res.status(403).json({ error: "Sign in with an active account to post to the scene feed" });
    }

    const postType = String(req.body.postType || "").trim().toLowerCase();
    if (postType !== "text" && postType !== "photo") {
      return res.status(400).json({ error: "postType must be text or photo" });
    }

    const audience = String(req.body.audience || "ALL").trim().toUpperCase();
    if (audience !== "ALL" && audience !== "RSVPS") {
      return res.status(400).json({ error: "audience must be ALL or RSVPS" });
    }

    // "Post as" identity: yourself, an upcoming event you host, or a venue you own.
    const postAs = String(req.body.postAs || "self").trim().toLowerCase();
    if (postAs !== "self" && postAs !== "event" && postAs !== "venue") {
      return res.status(400).json({ error: "postAs must be self, event, or venue" });
    }
    let businessId: number | null = null;
    if (postAs === "venue") {
      businessId = Number(req.body.businessId);
      if (!Number.isInteger(businessId) || businessId <= 0) {
        return res.status(400).json({ error: "Posting as a venue needs a valid venue" });
      }
      const owns = storage.getUserOwnedBusinesses(userId).some((b) => b.id === businessId);
      if (!owns && !isAdmin) {
        return res.status(403).json({ error: "You can only post as a venue you own" });
      }
    }

    const body = req.body.body != null ? String(req.body.body).trim().slice(0, 1000) : "";
    const photoUrl = req.body.photoUrl != null ? String(req.body.photoUrl).trim() : "";

    if (postType === "text") {
      if (!body) return res.status(400).json({ error: "Text posts need a message" });
      if (photoUrl) return res.status(400).json({ error: "Text posts cannot include a photo" });
    } else {
      if (!photoUrl || (!photoUrl.startsWith("/uploads/") && !photoUrl.startsWith("https://"))) {
        return res.status(400).json({ error: "Photo posts need a valid uploaded image" });
      }
      if (!body && !photoUrl) return res.status(400).json({ error: "Photo posts need an image" });
    }

    // eventId drives both the "post as event" identity and RSVP targeting; a
    // host may use it for either. Posting as an event requires one.
    let eventId: number | null = null;
    if (req.body.eventId != null && req.body.eventId !== "") {
      eventId = Number(req.body.eventId);
      if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({ error: "Invalid event" });
      }
      if (!storage.isUserEventHost(eventId, userId) && !isAdmin) {
        return res.status(403).json({ error: "You can only post as or target events you host" });
      }
    }
    if (postAs === "event" && eventId == null) {
      return res.status(400).json({ error: "Posting as an event needs a valid event" });
    }

    if (audience === "RSVPS") {
      const hosted = storage.getHostedLiveEventIds(userId);
      if (hosted.length === 0) {
        return res.status(400).json({ error: "RSVP-only posts require at least one live hosted event" });
      }
      if (eventId != null && !hosted.includes(eventId) && !isAdmin) {
        return res.status(400).json({ error: "That event is not in your hosted list" });
      }
    } else if (eventId != null && postAs !== "event") {
      // For a public post, an event is only valid as the "post as" identity.
      return res.status(400).json({ error: "eventId is only valid for RSVP audience or posting as that event" });
    }

    if (moderationGate(res, "Scene feed post", { body: body || null })) return;

    const post = storage.createHubFeedPost({
      userId,
      postType,
      body: body || null,
      photoUrl: photoUrl || null,
      audience,
      eventId,
      postAs,
      businessId,
    });
    res.json(post);
  });

  app.delete("/api/hub/feed/posts/:id", requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const result = storage.removeHubFeedPost(Number(req.params.id), userId, { isAdmin: sessionIsAdmin(req) });
    if ("error" in result) return res.status(400).json({ error: result.error });
    res.json(result);
  });

  app.post("/api/upload/feed-photo", requireAuth, upload.single("photo"), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file or invalid type (jpg/png/gif/webp, max 8MB)" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // ─── MEMBER PROFILES + FOLLOWS ───────────────────────────────────────────
  // Public profile page - no auth required; viewer detected via session.
  app.get("/api/users/:username", (req: any, res) => {
    const username = String(req.params.username || "").trim().replace(/^@/, "");
    const profile = storage.getPublicProfile(username, req.session?.userId ?? null, sessionIsAdmin(req));
    if (!profile) return res.status(404).json({ error: "Not found" });
    res.json(profile);
  });

  app.get("/api/users/me/blocked", requireAuth, (req, res) => {
    res.json(storage.getBlockedMembers(req.session.userId!));
  });

  app.post("/api/users/:username/block", requireAuth, (req, res) => {
    const target = storage.getUserByUsername(String(req.params.username || "").trim().replace(/^@/, ""));
    if (!target || target.status !== "active") return res.status(404).json({ error: "Not found" });
    if (target.id === req.session.userId) return res.status(400).json({ error: "You cannot block yourself" });
    if (storage.isGuideAdminUserId(target.id)) return res.status(400).json({ error: "The Zaylist guide account cannot be blocked" });
    storage.blockMember(req.session.userId!, target.id);
    res.json(storage.getMemberBlockStatus(req.session.userId!, target.id));
  });

  app.delete("/api/users/:username/block", requireAuth, (req, res) => {
    const target = storage.getUserByUsername(String(req.params.username || "").trim().replace(/^@/, ""));
    if (!target) return res.status(404).json({ error: "Not found" });
    storage.unblockMember(req.session.userId!, target.id);
    res.json(storage.getMemberBlockStatus(req.session.userId!, target.id));
  });

  // Toggle a like on board / hub content shown on public profile Updates.
  // Types: GIG | GIFTING | SPOTTED | HUB
  app.post("/api/content/:type/:id/like", requireAuth, (req: any, res) => {
    const type = String(req.params.type || "").trim().toUpperCase();
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
    const result = storage.toggleContentLike(type, id, req.session.userId!);
    if (result.error) {
      const status = result.error === "Not found" ? 404 : 400;
      return res.status(status).json({ error: result.error });
    }
    res.json({ liked: result.liked, likes: result.likes });
  });

  // Signed voting starts with public member-authored Hub posts. Historical
  // likes remain +1 votes, while the existing like route stays compatible.
  app.post("/api/content/HUB/:id/vote", requireAuth, (req: any, res) => {
    const id = Number(req.params.id);
    const value = Number(req.body?.value);
    if (!Number.isInteger(id) || id <= 0 || ![-1, 0, 1].includes(value)) {
      return res.status(400).json({ error: "Vote must be -1, 0, or 1" });
    }
    const result = storage.voteOnHubPost(id, req.session.userId!, value as -1 | 0 | 1);
    if (result.error) {
      return res.status(result.error === "Not found" ? 404 : 400).json({ error: result.error });
    }
    res.json(result);
  });

  // List reply thread for board / hub content on public profile Updates.
  // GIG + HUB: public content_replies bodies.
  // SPOTTED + GIFTING: count-only (private native flows); no reply bodies.
  app.get("/api/content/:type/:id/replies", (req: any, res) => {
    const type = String(req.params.type || "").trim().toUpperCase();
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
    const meta = storage.getContentReplyMeta(type, id);
    if (meta.error) {
      const status = meta.error === "Not found" ? 404 : 400;
      return res.status(status).json({ error: meta.error });
    }
    const replies =
      meta.mode === "thread" ? storage.listContentReplies(type, id, 20) : [];
    res.json({
      replies,
      count: meta.count,
      mode: meta.mode,
      nativeHref: meta.nativeHref,
    });
  });

  // Post a public reply on GIG or HUB content. SPOTTED / GIFTING stay native-only.
  app.post("/api/content/:type/:id/replies", requireAuth, (req: any, res) => {
    const type = String(req.params.type || "").trim().toUpperCase();
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
    const body = String(req.body?.body || "").trim().slice(0, 500);
    if (!body) return res.status(400).json({ error: "body required" });
    if (moderationGate(res, "Content reply", { body })) return;
    const result = storage.createContentReply(type, id, req.session.userId!, body);
    if (result.error) {
      const status = result.error === "Not found" ? 404 : 400;
      return res.status(status).json({ error: result.error });
    }
    res.json({ reply: result.reply, replies: result.replies });
  });

  app.post("/api/users/:username/follow", requireAuth, (req, res) => {
    const target = storage.getUserByUsername(String(req.params.username || "").trim().replace(/^@/, ""));
    if (!target || target.status !== "active") return res.status(404).json({ error: "Not found" });
    if (target.id === req.session.userId) return res.status(400).json({ error: "You can't follow yourself" });
    storage.followUser(req.session.userId!, target.id);
    res.json({ followers: storage.getFollowerCount(target.id), isFollowing: true });
  });

  app.delete("/api/users/:username/follow", requireAuth, (req, res) => {
    const target = storage.getUserByUsername(String(req.params.username || "").trim().replace(/^@/, ""));
    if (!target || target.status !== "active") return res.status(404).json({ error: "Not found" });
    if (target.id === req.session.userId) return res.status(400).json({ error: "You can't follow yourself" });
    storage.unfollowUser(req.session.userId!, target.id);
    res.json({ followers: storage.getFollowerCount(target.id), isFollowing: false });
  });

  app.get("/api/users/me/follow-stats", requireAuth, (req, res) => {
    const userId = req.session.userId!;
    res.json({
      followers: storage.getFollowerCount(userId),
      following: storage.getFollowingCount(userId),
    });
  });

  app.get("/api/users/me/people/:tab", requireAuth, (req, res) => {
    const tab = String(req.params.tab || "").trim();
    const userId = req.session.userId!;
    // Following includes both people (follows) and places (business_follows).
    // Venue "Follow me" used to write only business_follows, so Hub People looked empty.
    if (tab === "following") {
      return res.json({
        people: storage.getFollowingList(userId, userId),
        places: storage.getFollowedBusinessesList(userId),
      });
    }
    if (tab === "followers") return res.json(storage.getFollowersList(userId, userId));
    if (tab === "discover") return res.json(storage.discoverPeople(userId));
    return res.status(400).json({ error: "Invalid tab" });
  });

  app.post("/api/users/:username/message", requireAuth, (req, res) => {
    const target = storage.getUserByUsername(String(req.params.username || "").trim().replace(/^@/, ""));
    if (!target || target.status !== "active") return res.status(404).json({ error: "Not found" });
    if (target.id === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
    const body = String(req.body?.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    const sender = storage.getUserById(req.session.userId!);
    if (!sender) return res.status(401).json({ error: "Not authenticated" });
    const subject = String(req.body?.subject || "").trim().slice(0, 120) || `Message from @${sender.username}`;
    if (moderationGate(res, "Direct message", { subject, body })) return;
    storage.sendMessage(sender.id, target.id, subject, body, { contextType: "THREAD" });
    res.json({ ok: true });
  });

  // ─── MISSED CONNECTIONS ──────────────────────────────────────────────────
  app.get("/api/missed-connections/postable-events", requireAuth, (req, res) => {
    const scope = String(req.query.scope || "today");
    if (scope === "board") {
      return res.json(storage.getLinkableEventsForMissedConnections());
    }
    const requireToday = scope === "today";
    const events = storage.getPostableEventsForMissedConnections(requireToday);
    res.json(events.map(evt => ({
      id: evt.id,
      title: evt.title,
      venueName: evt.venueName,
      dayOfWeek: evt.dayOfWeek,
      dateStart: evt.dateStart,
      dateEnd: evt.dateEnd,
    })));
  });

  app.get("/api/missed-connections", (req: any, res) => {
    const beach = String(req.query.beach || "").trim();
    if (beach && isValidBeachId(beach)) {
      return res.json(storage.getMissedConnectionsByBeach(beach, req.session?.userId));
    }
    res.json(storage.getMissedConnections("ACTIVE", req.session?.userId));
  });

  app.get("/api/events/:id/missed-connections", (req: any, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    res.json(storage.getMissedConnectionsByEvent(evt.id, req.session?.userId));
  });

  app.get("/api/missed-connections/mine", requireAuth, (req, res) => {
    res.json(storage.getMissedConnectionsByUser(req.session.userId!));
  });

  app.post("/api/missed-connections", requireAuth, (req, res) => {
    try {
      const rawEventId = req.body.eventId;
      const rawBeachId = req.body.beachId;
      const hasEvent = rawEventId !== undefined && rawEventId !== null && rawEventId !== "";
      const hasBeach = rawBeachId !== undefined && rawBeachId !== null && rawBeachId !== "";
      const eventId = hasEvent ? Number(rawEventId) : null;
      const beachId = hasBeach ? String(rawBeachId) : null;

      if (hasEvent && hasBeach) {
        return res.status(400).json({ error: "Link to an event or a beach, not both" });
      }
      if (hasEvent && !Number.isFinite(eventId)) {
        return res.status(400).json({ error: "Invalid event" });
      }
      if (hasBeach && !isValidBeachId(beachId)) {
        return res.status(400).json({ error: "Invalid beach" });
      }

      if (moderationGate(res, "MIZZED CONNECTION", {
        title: req.body.title,
        body: req.body.body,
        eventLabel: req.body.eventLabel,
        venueHint: req.body.venueHint,
      })) return;

      let payload: Record<string, unknown>;
      let eventMeta: { title: string; venueName: string; dayOfWeek: string } | null = null;

      const scope = String(req.body.scope || "");
      const boardScope = scope === "board";

      if (beachId) {
        payload = {
          ...req.body,
          userId: req.session.userId!,
          eventId: null,
          beachId,
          dayOfWeek: pacificDayOfWeek(),
          venueHint: beachVenueLabel(beachId as "rooster-rock" | "sauvie-island"),
          closesAt: generalSpottedClosesAt(),
        };
      } else if (eventId != null) {
        const evt = storage.getEvent(eventId);
        if (!evt || evt.status !== "LIVE") return res.status(400).json({ error: "Invalid event" });

        const requireToday = !boardScope && scope === "today";
        const window = isMissedConnectionPostable(evt.dateStart, evt.dateEnd, { requireToday });
        if (!window.ok) return res.status(400).json({ error: window.reason || "Posting not open for this event yet" });

        payload = {
          ...req.body,
          userId: req.session.userId!,
          eventId,
          dayOfWeek: evt.dayOfWeek,
          venueHint: evt.venueName,
          closesAt: window.closesAt || missedConnectionClosesAt(evt.dateStart, evt.dateEnd),
        };
        eventMeta = { title: evt.title, venueName: evt.venueName, dayOfWeek: evt.dayOfWeek || "" };
      } else {
        const customLabel = String(req.body.eventLabel || "").trim();
        const venueHint = formatCustomSpottedVenue(
          customLabel,
          String(req.body.venueHint || "").trim(),
        );
        payload = {
          ...req.body,
          userId: req.session.userId!,
          eventId: null,
          dayOfWeek: pacificDayOfWeek(),
          venueHint,
          closesAt: generalSpottedClosesAt(),
        };
      }

      const data = insertMissedConnectionSchema.parse(payload);
      if (data.body.length > 500) return res.status(400).json({ error: "body max is 500 characters" });
      const created = storage.createMissedConnection(data);
      res.json({
        ...created,
        eventTitle: eventMeta?.title ?? null,
        eventVenue: eventMeta?.venueName ?? null,
        eventDay: eventMeta?.dayOfWeek ?? created.dayOfWeek ?? null,
        isMine: true,
        anonymous: false,
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/missed-connections/:id", requireAuth, (req, res) => {
    const patch: any = {};
    ["title", "body", "status"].forEach(k => {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    });
    if (patch.body && patch.body.length > 500) return res.status(400).json({ error: "body max is 500 characters" });
    if (moderationGate(res, "MIZZED CONNECTION edit", { title: patch.title, body: patch.body })) return;
    const updated = storage.updateMissedConnection(Number(req.params.id), req.session.userId!, patch);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/missed-connections/:id", requireAuth, (req, res) => {
    storage.deleteMissedConnection(Number(req.params.id), req.session.userId!);
    res.json({ ok: true });
  });

  app.post("/api/missed-connections/:id/reply", requireAuth, (req, res) => {
    const post = storage.getMissedConnection(Number(req.params.id));
    if (!post || post.status !== "ACTIVE") return res.status(404).json({ error: "Not found" });
    if (post.userId === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    if (moderationGate(res, "MIZZED CONNECTION reply", { body })) return;
    const msg = storage.sendMessage(req.session.userId!, post.userId, `MIZZED CONNECTION: ${post.title}`, body, {
      contextType: "MISSED_CONNECTION",
      contextId: post.id,
      contextLabel: post.title,
    });
    storage.createMissedConnectionThread(msg.threadId, post.id, post.userId, req.session.userId!);
    res.json(msg);
  });

  app.post("/api/missed-connections/:id/report", requireAuth, (req, res) => {
    const post = storage.getMissedConnection(Number(req.params.id));
    if (!post || post.status !== "ACTIVE") return res.status(404).json({ error: "Not found" });
    const reason = String(req.body.reason || "").trim().slice(0, 500) || "No reason given";
    const actor = storage.getUserById(req.session.userId!);
    storage.createModerationRequest({
      type: "MISSED_CONNECTION_REPORT",
      eventId: 0,
      eventTitle: post.title || `Missed connection #${post.id}`,
      requesterName: actor?.displayName || actor?.username || "member",
      requesterEmail: actor?.email || null,
      proof: `Missed connection #${post.id} reported - ${reason}`,
    } as any);
    res.json({ ok: true });
  });

  // ─── RIVER BRATS (Nude Beaches social) ───────────────────────────────────
  /** Active beach days for the signed-in user (feeds My Schedule flyer blocks). */
  app.get("/api/river-brats/checkins/mine", requireAuth, (req, res) => {
    res.json(storage.getBeachCheckinsByUser(req.session.userId!));
  });

  app.get("/api/river-brats/checkins", (req: any, res) => {
    const beachId = String(req.query.beach || "");
    const date = String(req.query.date || pacificTodayDate());
    if (!isValidBeachId(beachId)) return res.status(400).json({ error: "Invalid beach" });
    try {
      const rows = storage.getBeachCheckins(beachId, date, req.session?.userId);
      // Always JSON-array so clients never .filter an error object
      res.json(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      console.error("[river-brats/checkins]", e?.message || e);
      res.status(500).json({ error: "Could not load check-ins" });
    }
  });

  app.post("/api/river-brats/checkins", requireAuth, (req, res) => {
    try {
      const beachId = String(req.body.beachId || "");
      const arrivalHour = Number(req.body.arrivalHour);
      const departHourRaw = req.body.departHour;
      const departHour = departHourRaw == null || departHourRaw === "" ? null : Number(departHourRaw);
      if (!isValidBeachId(beachId)) return res.status(400).json({ error: "Invalid beach" });
      if (!isValidRiverBratsHour(arrivalHour)) return res.status(400).json({ error: "Pick a time between 7am and 9pm" });
      if (!isValidRiverBratsDepartHour(departHour, arrivalHour)) {
        return res.status(400).json({ error: "Pick how long you'll stay (leave after you arrive, by 10pm)" });
      }
      const note = String(req.body.note || "").trim().slice(0, 80) || null;
      if (moderationGate(res, "River Brats check-in", { note: note || "" })) return;
      const calendarDate = String(req.body.date || pacificTodayDate());
      if (!isAllowedBeachCheckinDate(calendarDate)) {
        return res.status(400).json({ error: "Pick a day from today through the next 7 days" });
      }
      const isAnonymous = Boolean(req.body.isAnonymous);
      const row = storage.upsertBeachCheckin({
        ...insertBeachCheckinSchema.parse({
          userId: req.session.userId!,
          beachId,
          arrivalHour,
          departHour,
          note,
          calendarDate,
        }),
        isAnonymous,
      });
      res.json(row);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/river-brats/checkins/:id", requireAuth, (req, res) => {
    const ok = storage.deleteBeachCheckin(Number(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  // GPS presence confirm ("I am here"). Coordinates are compared to the beach
  // anchor server-side and discarded - never persisted or logged.
  app.post("/api/river-brats/checkins/verify", requireAuth, (req, res) => {
    const beachId = String(req.body.beachId || "");
    const date = String(req.body.date || pacificTodayDate());
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    if (!isValidBeachId(beachId)) return res.status(400).json({ error: "Invalid beach" });
    if (date !== pacificTodayDate()) {
      return res.status(400).json({ error: "You can only confirm presence on the day of your check-in" });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "Location unavailable" });
    }
    const result = storage.verifyBeachPresence(req.session.userId!, beachId, date, lat, lng);
    if (!result.ok && result.error === "NO_CHECKIN") {
      return res.status(403).json({ error: "Check in first" });
    }
    if (!result.ok) {
      return res.status(400).json({ error: "TOO_FAR", distanceM: result.distanceM });
    }
    res.json(result);
  });

  app.get("/api/river-brats/checkins/chat", requireAuth, (req: any, res) => {
    const beachId = String(req.query.beach || "");
    const date = String(req.query.date || pacificTodayDate());
    if (!isValidBeachId(beachId)) return res.status(400).json({ error: "Invalid beach" });
    const payload = storage.getBeachChatMessages(beachId, date, req.session.userId!);
    res.json(payload);
  });

  app.post("/api/river-brats/checkins/chat", requireAuth, (req, res) => {
    try {
      const beachId = String(req.body.beachId || "");
      const date = String(req.body.date || pacificTodayDate());
      const body = String(req.body.body || "").trim();
      if (!isValidBeachId(beachId)) return res.status(400).json({ error: "Invalid beach" });
      if (!body) return res.status(400).json({ error: "body required" });
      if (body.length > 500) return res.status(400).json({ error: "Message too long" });
      if (moderationGate(res, "River Brats beach chat", { body })) return;
      const msg = storage.postBeachChatMessage(beachId, date, req.session.userId!, body);
      res.json(msg);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/river-brats/checkins/:id/message", requireAuth, (req, res) => {
    try {
      const checkinId = Number(req.params.id);
      const beachId = String(req.body.beachId || "");
      const date = String(req.body.date || pacificTodayDate());
      if (!isValidBeachId(beachId)) return res.status(400).json({ error: "Invalid beach" });
      if (!storage.getBeachCheckinByUser(beachId, req.session.userId!, date)) {
        return res.status(403).json({ error: "Check-in required to message others" });
      }
      const rows = storage.getBeachCheckins(beachId, date, req.session.userId!);
      const target = rows.find((r: any) => r.id === checkinId);
      if (!target?.userId || target.masked) return res.status(404).json({ error: "Check-in not found" });
      if (target.userId === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
      const body = String(req.body.body || "").trim();
      if (!body) return res.status(400).json({ error: "body required" });
      if (moderationGate(res, "River Brats DM", { body })) return;
      const msg = storage.sendMessage(
        req.session.userId!,
        Number(target.userId),
        `River Brats: ${beachVenueLabel(beachId)}`,
        body,
        { contextType: "RIVER_BRATS_CHECKIN", contextId: checkinId, contextLabel: beachVenueLabel(beachId) },
      );
      res.json(msg);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/river-brats/carpool", (req: any, res) => {
    const beachId = String(req.query.beach || "");
    const tripDate = String(req.query.date || pacificTodayDate());
    if (!isValidBeachId(beachId)) return res.status(400).json({ error: "Invalid beach" });
    res.json(storage.getBeachCarpoolPosts(beachId, tripDate, req.session?.userId));
  });

  app.post("/api/river-brats/carpool", requireAuth, (req, res) => {
    try {
      const beachId = String(req.body.beachId || "");
      const postType = String(req.body.postType || "");
      const leaveHour = Number(req.body.leaveHour);
      const departureArea = String(req.body.departureArea || "").trim();
      const note = String(req.body.note || "").trim();
      const tripDate = String(req.body.tripDate || pacificTodayDate());
      const directionRaw = String(req.body.direction || "TO_BEACH").toUpperCase();
      const direction = isValidCarpoolDirection(directionRaw) ? directionRaw : "TO_BEACH";
      const seats = req.body.seats != null ? Number(req.body.seats) : null;
      if (!isValidBeachId(beachId)) return res.status(400).json({ error: "Invalid beach" });
      if (postType !== "OFFERING_RIDE" && postType !== "NEED_RIDE") return res.status(400).json({ error: "Invalid post type" });
      if (!isAllowedCarpoolTripDate(tripDate)) {
        return res.status(400).json({ error: "Pick a day from today through the next 7 days" });
      }
      if (!isValidRiverBratsHour(leaveHour)) return res.status(400).json({ error: "Leave time required (7am–9pm)" });
      if (!departureArea) return res.status(400).json({ error: "Departure area required" });
      if (!note || note.length < 8) return res.status(400).json({ error: "Add a short note (min 8 characters)" });
      if (postType === "OFFERING_RIDE" && (!seats || seats < 1 || seats > 4)) {
        return res.status(400).json({ error: "Seats required (1–4) when offering a ride" });
      }
      if (moderationGate(res, "River Brats carpool", { note, departureArea })) return;
      const row = storage.createBeachCarpoolPost(insertBeachCarpoolPostSchema.parse({
        userId: req.session.userId!,
        beachId,
        postType,
        direction,
        departureArea,
        tripDate,
        leaveHour,
        seats: postType === "OFFERING_RIDE" ? seats : null,
        note,
      }));
      res.json({ ...row, isMine: true, requestCount: 0 });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/river-brats/carpool/:id", requireAuth, (req, res) => {
    const ok = storage.deleteBeachCarpoolPost(Number(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  app.post("/api/river-brats/carpool/:id/request", requireAuth, (req, res) => {
    try {
      const note = String(req.body.note || "").trim();
      if (!note) return res.status(400).json({ error: "note required" });
      if (moderationGate(res, "River Brats carpool request", { note })) return;
      const row = storage.requestBeachCarpool(Number(req.params.id), req.session.userId!, note);
      res.json(row);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/river-brats/carpool/:id/requests", requireAuth, (req, res) => {
    try {
      res.json(storage.getBeachCarpoolRequests(Number(req.params.id), req.session.userId!));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/river-brats/carpool/:id/select/:requestId", requireAuth, (req, res) => {
    try {
      const msg = storage.selectBeachCarpoolRequest(
        Number(req.params.id),
        Number(req.params.requestId),
        req.session.userId!,
      );
      res.json(msg);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/river-brats/report", requireAuth, (req, res) => {
    try {
      const reason = String(req.body.reason || "").trim();
      const targetType = String(req.body.targetType || "");
      const targetId = Number(req.body.targetId);
      if (!reason) return res.status(400).json({ error: "reason required" });
      if (!["CHECKIN", "CARPOOL", "CHAT_MESSAGE", "MISSED_CONNECTION"].includes(targetType)) {
        return res.status(400).json({ error: "Invalid target" });
      }
      storage.reportRiverBrats(insertRiverBratsReportSchema.parse({
        targetType,
        targetId,
        reporterUserId: req.session.userId!,
        reason,
        note: req.body.note ? String(req.body.note).trim() : null,
      }));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── PUSH NOTIFICATIONS ─────────────────────────────────────────────────
  app.get("/api/push/vapid-public-key", (_req, res) => {
    if (!isPushConfigured()) return res.json({ configured: false, publicKey: null });
    res.json({ configured: true, publicKey: getVapidPublicKey() });
  });

  app.get("/api/users/me/notification-prefs", requireAuth, (req, res) => {
    const user = storage.getUserById(req.session.userId!);
    const isAdmin = Boolean(user?.subAdmin || isMainAdminUser(user) || storage.hasSiteAdminGrant(req.session.userId!));
    res.json({
      prefs: storage.getNotificationPrefs(req.session.userId!),
      pushConfigured: Boolean(process.env.VAPID_PUBLIC_KEY),
      isAdmin,
    });
  });

  app.put("/api/users/me/notification-prefs", requireAuth, (req, res) => {
    const user = storage.getUserById(req.session.userId!);
    const body = req.body || {};
    const patch: Record<string, boolean> = {};
    for (const key of ["messages", "my_events", "account", "admin"] as const) {
      if (typeof body[key] === "boolean") patch[key] = body[key];
    }
    // Same isAdmin predicate as GET (includes grant-based site admins).
    const isAdmin = Boolean(user?.subAdmin || isMainAdminUser(user) || storage.hasSiteAdminGrant(req.session.userId!));
    const prefs = storage.setNotificationPrefs(
      req.session.userId!,
      patch,
      isAdmin,
    );
    res.json({ prefs });
  });

  app.post("/api/push/subscribe", requireAuth, (req, res) => {
    const endpoint = String(req.body?.endpoint || "").trim();
    const p256dh = String(req.body?.keys?.p256dh || req.body?.p256dh || "").trim();
    const auth = String(req.body?.keys?.auth || req.body?.auth || "").trim();
    if (!endpoint || !p256dh || !auth) return res.status(400).json({ error: "Invalid subscription" });
    const sub = storage.upsertPushSubscription(req.session.userId!, {
      endpoint,
      p256dh,
      auth,
      userAgent: String(req.get("user-agent") || "").slice(0, 500),
      platform: String(req.body?.platform || "").slice(0, 40) || null,
    });
    res.json({ ok: true, id: (sub as any)?.id });
  });

  app.delete("/api/push/subscribe", requireAuth, (req, res) => {
    const endpoint = String(req.body?.endpoint || "").trim();
    if (!endpoint) return res.status(400).json({ error: "endpoint required" });
    storage.deactivatePushSubscriptionByEndpoint(req.session.userId!, endpoint);
    res.json({ ok: true });
  });

  app.get("/api/admin/push-status", requireAdmin, (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!caller || !(storage.hasOwnerAdminAccess(caller) || isMainAdminUser(caller))) {
      return res.status(403).json({ error: "Primary or super admin only" });
    }
    const userId = req.session.userId!;
    res.json({
      configured: isPushConfigured(),
      totalActiveSubscriptions: storage.countActivePushSubscriptions(),
      myDeviceSubscriptions: storage.getActivePushSubscriptions(userId).length,
    });
  });

  app.post("/api/push/test", requireAdmin, async (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!caller || !(storage.hasOwnerAdminAccess(caller) || isMainAdminUser(caller))) {
      return res.status(403).json({ error: "Primary or super admin only" });
    }
    if (!isPushConfigured()) return res.status(503).json({ error: "VAPID keys not configured on server" });
    const userId = req.session.userId!;
    const subs = storage.getActivePushSubscriptions(userId);
    if (subs.length === 0) {
      return res.status(400).json({
        error: "No active push subscription for this admin account",
        hint: "Avatar menu → Notification settings → Enable push on this device. On iPhone, open the Home Screen app first.",
      });
    }
    const payload = buildDeclarativePayload({
      title: "Zaylist test",
      body: "Push notifications are working. If you see this, delivery is fixed.",
      navigate: "/dashboard",
      tag: `pdx-test-${Date.now()}`,
    });
    const results = await Promise.all(subs.map(async (sub) => {
      const result = await sendPushToSubscription(sub, payload);
      if (result.ok) storage.touchPushSubscription(sub.id);
      else if (result.gone) storage.deactivatePushSubscription(sub.id);
      const host = (() => {
        try { return new URL(sub.endpoint).host; } catch { return "unknown"; }
      })();
      return {
        id: sub.id,
        host,
        ok: result.ok,
        statusCode: result.statusCode,
        error: "error" in result ? result.error : undefined,
      };
    }));
    const sent = results.filter((r) => r.ok).length;
    console.log(`[push] admin test user=${userId} sent=${sent}/${subs.length}`, JSON.stringify(results));
    if (sent === 0) return res.status(502).json({ error: "Push send failed for all devices", results });
    res.json({
      ok: true,
      sent,
      total: subs.length,
      results,
      hint: "On Mac: check Notification Center (and System Settings → Notifications → Safari). On iPhone: open the Home Screen Zaylist app; Settings → Notifications → Zaylist must allow alerts.",
    });
  });

  // OWNER-ONLY broadcast: send one push announcement to every subscribed device.
  // Respects each user's "account" notification preference (the category we use
  // for site/guide announcements). Not rate-limited by the per-message limiter -
  // this is a deliberate one-shot the primary owner fires by hand.
  app.post("/api/admin/push/broadcast", requireAdmin, async (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!caller || !storage.isPrimarySiteOwner(caller)) {
      return res.status(403).json({ error: "Owner only" });
    }
    if (!isPushConfigured()) return res.status(503).json({ error: "VAPID keys not configured on server" });

    const title = String(req.body?.title || "").trim();
    const body = String(req.body?.body || "").trim();
    const navigateRaw = String(req.body?.url || req.body?.navigate || "/events").trim();
    // Only allow same-site relative paths for the deep link.
    const navigate = navigateRaw.startsWith("/") ? navigateRaw : "/events";
    if (!title) return res.status(400).json({ error: "Title is required" });
    if (title.length > 80) return res.status(400).json({ error: "Title must be 80 characters or fewer" });
    if (body.length > 180) return res.status(400).json({ error: "Body must be 180 characters or fewer" });

    const allSubs = storage.getAllActivePushSubscriptions();
    // Group devices by user so we can respect each user's announcement pref once.
    const byUser = new Map<number, typeof allSubs>();
    for (const sub of allSubs) {
      const list = byUser.get(sub.userId) || [];
      list.push(sub);
      byUser.set(sub.userId, list);
    }

    const payload = buildDeclarativePayload({
      title,
      body: body || undefined,
      navigate,
      tag: `pdx-broadcast-${Date.now()}`,
    });

    let sent = 0;
    let failed = 0;
    let deviceTotal = 0;
    let usersTargeted = 0;
    let usersOptedOut = 0;

    for (const [userId, subs] of byUser) {
      // "account" is the announcement/guide-update category. Muted → skip.
      const prefs = storage.getNotificationPrefs(userId);
      if (!prefs.account) {
        usersOptedOut += 1;
        continue;
      }
      usersTargeted += 1;
      await Promise.all(subs.map(async (sub) => {
        deviceTotal += 1;
        const result = await sendPushToSubscription(sub, payload);
        if (result.ok) {
          storage.touchPushSubscription(sub.id);
          sent += 1;
        } else {
          failed += 1;
          if (result.gone) storage.deactivatePushSubscription(sub.id);
        }
      }));
    }

    console.log(
      `[push] BROADCAST by owner=${caller.id} title=${JSON.stringify(title)} sent=${sent}/${deviceTotal} ` +
      `usersTargeted=${usersTargeted} optedOut=${usersOptedOut}`,
    );

    res.json({
      ok: true,
      sent,
      failed,
      deviceTotal,
      usersTargeted,
      usersOptedOut,
      title,
      body,
      navigate,
    });
  });

  // ─── MESSAGES ────────────────────────────────────────────────────────────
  app.get("/api/messages/unread-count", requireAuth, (req, res) => {
    res.json({ count: storage.getUnreadCount(req.session.userId!) });
  });

  // Group chats the viewer belongs to (event rooms via check-in/hosting, plus
  // today's beach room) - powers the Inbox sheet GROUP rows.
  app.get("/api/chats/mine", requireAuth, (req, res) => {
    res.json(storage.getMyGroupChats(req.session.userId!));
  });

  app.get("/api/messages/inbox", requireAuth, (req, res) => {
    const inbox = storage.getInbox(req.session.userId!).map(m =>
      storage.maskMessageParty(m, req.session.userId!, "inbox"),
    );
    res.json(inbox);
  });

  app.get("/api/messages/sent", requireAuth, (req, res) => {
    const sent = storage.getSentMessages(req.session.userId!).map(m =>
      storage.maskMessageParty(m, req.session.userId!, "sent"),
    );
    res.json(sent);
  });

  app.post("/api/messages/thread/:threadId/reply", requireAuth, (req, res) => {
    const thread = storage.getThread(req.params.threadId);
    const visible = thread.some((m: any) => m.fromUserId === req.session.userId || m.toUserId === req.session.userId);
    if (!visible || thread.length === 0) return res.status(404).json({ error: "Thread not found" });
    const first = thread[0] as any;
    const last = thread[thread.length - 1] as any;
    const toUserId = last.fromUserId === req.session.userId ? last.toUserId : last.fromUserId;
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    if (moderationGate(res, "Inbox thread reply", { body })) return;
    const msg = storage.sendMessage(req.session.userId!, toUserId, first.subject || "Reply", body, {
      threadId: req.params.threadId,
      contextType: first.contextType || "THREAD",
      contextId: first.contextId || null,
      contextLabel: first.contextLabel || null,
    });
    res.json(msg);
  });

  app.put("/api/messages/:id/read", requireAuth, (req, res) => {
    const ok = storage.markReadForUser(Number(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  // Long-press DM reactions: 👍 👎 😂 😢 ❤️ 💔 GAY!
  app.post("/api/messages/:id/reactions", requireAuth, (req: any, res) => {
    const messageId = Number(req.params.id);
    const emoji = String(req.body?.emoji || req.body?.code || "").trim();
    if (!emoji) return res.status(400).json({ error: "emoji required" });
    const result = storage.toggleMessageReaction(messageId, req.session.userId!, emoji);
    if (result.error) {
      const status = result.error === "Invalid reaction" ? 400 : 404;
      return res.status(status).json({ error: result.error });
    }
    res.json({ reactions: result.reactions });
  });

  app.get("/api/messages/thread/:threadId", requireAuth, (req, res) => {
    const thread = storage.getThreadForViewer(req.params.threadId, req.session.userId!);
    const visible = thread.some((m: any) => m.fromUserId === req.session.userId || m.toUserId === req.session.userId);
    if (!visible) return res.status(404).json({ error: "Thread not found" });
    const mcThread = storage.getMissedConnectionThread(req.params.threadId);
    const bothRevealed = !mcThread || Boolean(mcThread.poster_revealed && mcThread.replier_revealed);
    res.json({
      messages: thread,
      reveal: mcThread ? {
        posterRevealed: Boolean(mcThread.poster_revealed),
        replierRevealed: Boolean(mcThread.replier_revealed),
        bothRevealed,
        iAmPoster: mcThread.poster_user_id === req.session.userId,
        iRevealed: mcThread.poster_user_id === req.session.userId
          ? Boolean(mcThread.poster_revealed)
          : mcThread.replier_user_id === req.session.userId
            ? Boolean(mcThread.replier_revealed)
            : false,
      } : null,
    });
  });

  app.post("/api/messages/thread/:threadId/reveal", requireAuth, (req, res) => {
    const thread = storage.getThread(req.params.threadId);
    const visible = thread.some((m: any) => m.fromUserId === req.session.userId || m.toUserId === req.session.userId);
    if (!visible) return res.status(404).json({ error: "Thread not found" });
    const updated = storage.revealMissedConnectionIdentity(req.params.threadId, req.session.userId!);
    if (!updated) return res.status(400).json({ error: "Cannot reveal in this thread" });
    res.json({
      reveal: {
        posterRevealed: Boolean(updated.poster_revealed),
        replierRevealed: Boolean(updated.replier_revealed),
        bothRevealed: Boolean(updated.poster_revealed && updated.replier_revealed),
      },
    });
  });

  app.delete("/api/messages/thread/:threadId", requireAuth, (req, res) => {
    const threadId = decodeURIComponent(req.params.threadId || "").trim();
    if (!threadId) return res.status(400).json({ error: "Thread id required" });
    const thread = storage.getThread(threadId);
    const userId = req.session.userId!;
    const visible = thread.some((m: any) => m.fromUserId === userId || m.toUserId === userId);
    if (!visible) return res.status(404).json({ error: "Thread not found" });
    const cleared = storage.softDeleteThread(threadId, userId);
    if (cleared === 0) return res.status(404).json({ error: "Nothing to delete" });
    res.json({ ok: true, cleared });
  });

  app.delete("/api/messages/folder/:folder", requireAuth, (req, res) => {
    const folder = String(req.params.folder || "").toLowerCase();
    if (!["inbox", "sent", "all"].includes(folder)) {
      return res.status(400).json({ error: "folder must be inbox, sent, or all" });
    }
    const cleared = storage.clearInboxFolder(req.session.userId!, folder as "inbox" | "sent" | "all");
    res.json({ ok: true, cleared });
  });

  app.get("/api/events/:id/hosts", (req, res) => {
    const eventId = Number(req.params.id);
    if (isTuckerHostedArchiveId(eventId)) {
      const credits = getArchiveSyntheticCredits(eventId).filter(c => c.role === "PRIMARY" || c.role === "COHOST");
      const hosts = credits
        .map((c, i) => {
          const user = storage.getUserByUsername(c.username);
          if (!user) return null;
          return {
            id: -(eventId * 10 + i + 1),
            eventId,
            userId: user.id,
            role: c.role,
            addedByUserId: null,
            createdAt: "",
            username: user.username,
            displayName: user.displayName,
            photoUrl: user.photoUrl,
            avatarChoice: user.avatarChoice ?? 1,
            avatarRing: user.avatarRing || "none",
          };
        })
        .filter(Boolean);
      return res.json(hosts);
    }
    const evt = storage.getEvent(eventId);
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    res.json(storage.getEventHosts(evt.id));
  });

  app.post("/api/events/:id/hosts", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    if (!sessionIsAdmin(req) && !storage.isUserEventHost(evt.id, req.session.userId!)) {
      return res.status(403).json({ error: "Only event hosts can add co-hosts" });
    }
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim();
    const result = storage.addEventCoHost(evt.id, req.session.userId!, username, email);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.host);
  });

  app.get("/api/events/:id/talent", (req, res) => {
    const eventId = Number(req.params.id);
    if (isTuckerHostedArchiveId(eventId)) {
      const credits = getArchiveSyntheticCredits(eventId).filter(c => c.role === "DJ");
      const talent = credits
        .map((c, i) => {
          const user = storage.getUserByUsername(c.username);
          if (!user) return null;
          return {
            id: -(eventId * 10 + i + 50),
            eventId,
            userId: user.id,
            role: "DJ",
            status: "LIVE",
            addedByUserId: null,
            createdAt: "",
            username: user.username,
            displayName: user.displayName,
            photoUrl: user.photoUrl,
            avatarChoice: user.avatarChoice ?? 1,
            avatarRing: user.avatarRing || "none",
          };
        })
        .filter(Boolean);
      return res.json(talent);
    }
    const evt = storage.getEvent(eventId);
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    const userId = req.session?.userId;
    const isAdmin = sessionIsAdmin(req);
    const canManage = isAdmin || (userId && storage.isUserEventHost(evt.id, userId));
    const talent = storage.getEventTalent(evt.id, { includePending: Boolean(canManage) });
    res.json(talent);
  });

  app.post("/api/events/:id/talent", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    if (!sessionIsAdmin(req) && !storage.isUserEventHost(evt.id, req.session.userId!)) {
      return res.status(403).json({ error: "Only event hosts can add talent" });
    }
    const role = String(req.body.role || "").trim().toUpperCase();
    if (!isEventTalentRole(role)) return res.status(400).json({ error: "Invalid role" });
    const username = String(req.body.username || "").trim();
    if (!username) return res.status(400).json({ error: "username required" });
    const result = storage.addEventTalentByHost(evt.id, req.session.userId!, username, role, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.talent);
  });

  app.post("/api/events/:id/talent/self", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    const role = String(req.body.role || "").trim().toUpperCase();
    if (!isEventTalentRole(role)) return res.status(400).json({ error: "Invalid role" });
    const result = storage.requestEventTalentSelf(evt.id, req.session.userId!, role);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  });

  app.post("/api/events/:id/talent/:talentId/approve", requireAuth, (req, res) => {
    const talentId = Number(req.params.talentId);
    const result = storage.approveEventTalent(talentId, req.session.userId!, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.talent);
  });

  app.post("/api/events/:id/talent/:talentId/reject", requireAuth, (req, res) => {
    const talentId = Number(req.params.talentId);
    const result = storage.rejectEventTalent(talentId, req.session.userId!, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  });

  app.get("/api/talent-request/:talentId", requireAuth, (req, res) => {
    const row = storage.getEventTalentById(Number(req.params.talentId));
    if (!row) return res.status(404).json({ error: "Not found" });
    if (!storage.canApproveEventTalent(row.id, req.session.userId!, sessionIsAdmin(req))) {
      return res.status(403).json({ error: "Not authorized" });
    }
    res.json(row);
  });

  app.post("/api/talent-request/:talentId/approve", requireAuth, (req, res) => {
    const talentId = Number(req.params.talentId);
    const userId = req.session.userId!;
    const result = storage.approveEventTalent(talentId, userId, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    storage.softDeleteTalentRequestThreads(talentId, userId);
    res.json(result.talent);
  });

  app.post("/api/talent-request/:talentId/reject", requireAuth, (req, res) => {
    const talentId = Number(req.params.talentId);
    const userId = req.session.userId!;
    const result = storage.rejectEventTalent(talentId, userId, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    storage.softDeleteTalentRequestThreads(talentId, userId);
    res.json(result);
  });

  app.delete("/api/events/:id/talent/:talentId", requireAuth, (req, res) => {
    const talentId = Number(req.params.talentId);
    const result = storage.removeEventTalent(talentId, req.session.userId!, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  });

  app.get("/api/events/:id/host-messages", (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    res.json(storage.getHostMessages(Number(req.params.id), 2));
  });

  app.post("/api/events/:id/host-messages", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const user = storage.getUserById(req.session.userId!);
    if (!user || !storage.isUserEventHost(evt.id, user.id)) {
      return res.status(403).json({ error: "Only the event host can post updates" });
    }
    const body = String(req.body.body || "").trim().slice(0, 1000);
    if (!body) return res.status(400).json({ error: "body required" });
    if (moderationGate(res, "Host update", { body })) return;
    const msg = storage.createHostMessage({ eventId: evt.id, userId: user.id, body });
    const notified = storage.notifyAttendeesOfHostUpdate(evt.id, user.id, evt.title, body);
    res.json({ ...msg, notified });
  });

  // Promoter invite: past attendees of their events + their profile followers → inbox.
  app.get("/api/events/:id/invite-audience", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const userId = req.session.userId!;
    if (!storage.isUserEventHost(evt.id, userId) && !sessionIsAdmin(req)) {
      return res.status(403).json({ error: "Only the event host can invite" });
    }
    res.json(storage.previewEventInviteAudience(evt.id, userId));
  });

  app.post("/api/events/:id/invite-audience", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const user = storage.getUserById(req.session.userId!);
    if (!user || (!storage.isUserEventHost(evt.id, user.id) && !sessionIsAdmin(req))) {
      return res.status(403).json({ error: "Only the event host can invite" });
    }
    if (evt.status !== "LIVE") {
      return res.status(400).json({ error: "Event must be live to send invites" });
    }
    const includePastAttendees = req.body?.includePastAttendees !== false;
    const includeFollowers = req.body?.includeFollowers !== false;
    if (!includePastAttendees && !includeFollowers) {
      return res.status(400).json({ error: "Pick at least one audience: past attendees or followers" });
    }
    const message = req.body?.message != null ? String(req.body.message).trim().slice(0, 800) : "";
    if (message && moderationGate(res, "Event invite", { body: message })) return;
    const result = storage.inviteAudienceToEvent(evt.id, user.id, {
      includePastAttendees,
      includeFollowers,
      message: message || null,
    });
    res.json(result);
  });

  app.post("/api/events/:id/transfer", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const user = storage.getUserById(req.session.userId!);
    if (!user || !storage.isUserEventHost(evt.id, user.id)) {
      return res.status(403).json({ error: "Only the current host can transfer this event" });
    }
    const target = String(req.body.target || "").trim();
    const notes = String(req.body.notes || "").trim();
    if (!target) return res.status(400).json({ error: "target required (username or email)" });
    const req2 = storage.createModerationRequest({
      type: "TRANSFER",
      eventId: evt.id,
      eventTitle: evt.title,
      requesterName: user.displayName || user.username,
      requesterEmail: user.email,
      proof: `${target}${notes ? ` - ${notes}` : ""}`,
    });
    res.json(req2);
  });

  app.post("/api/events/:id/message-host", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const recipient = storage.resolveEventMessageRecipient(evt.id);
    if (!recipient) {
      const venueWebsite = resolveVenueWebsite(evt.venueName, venueWebsiteIndex());
      return res.status(400).json({
        error: "NO_CONTACT",
        ticketUrl: evt.ticketUrl || null,
        venueWebsite,
        venueName: evt.venueName || null,
      });
    }
    const { user: host, recipientType, venueName } = recipient;
    if (host.id === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    if (moderationGate(res, "Message to event host", { body })) return;
    const subject = recipientType === "venue_owner"
      ? `Event at ${venueName || evt.venueName}: ${evt.title}`
      : `Event: ${evt.title}`;
    const msg = storage.sendMessage(req.session.userId!, host.id, subject, body, {
      contextType: "EVENT_HOST",
      contextId: evt.id,
      contextLabel: evt.title,
    });
    if (!msg?.id) {
      console.error("[message-host] sendMessage returned no row", {
        eventId: evt.id,
        recipientId: host.id,
        recipientType,
      });
      return res.status(500).json({ error: "Could not deliver message" });
    }
    res.json({ ...msg, recipientType, venueName: venueName || null });
  });

  // ─── PROMOTER AUTH ────────────────────────────────────────────────────────
  app.post("/api/promoter/register", (req, res) => {
    try {
      const { name, email, org, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
      const existing = storage.getPromoterByEmail(email);
      if (existing) return res.status(409).json({ error: "Email already registered" });
      const promoter = storage.createPromoter({ name, email, org, passwordHash: password });
      res.json({ id: promoter.id, name: promoter.name, email: promoter.email, org: promoter.org });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/promoter/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const promoter = storage.getPromoterByEmail(email);
    if (!promoter) return res.status(401).json({ error: "Invalid credentials" });
    if (!verifyPassword(password, promoter.passwordHash)) return res.status(401).json({ error: "Invalid credentials" });
    req.session.promoterId = promoter.id;
    res.json({ id: promoter.id, name: promoter.name, email: promoter.email, org: promoter.org });
  });

  // ─── ADMIN AUTH ───────────────────────────────────────────────────────────
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (!password) return res.status(400).json({ error: "password required" });

    // Accept regular user account credentials if that user is a site admin
    const userByHandle = storage.getUserByUsername(username) || storage.getUserByEmail(username);
    if (userByHandle && verifyPassword(password, userByHandle.passwordHash) && isMainAdminUser(userByHandle)) {
      req.session.isAdmin = true;
      req.session.userId = userByHandle.id;
      return res.json({
        isAdmin: true,
        username: userByHandle.username,
        isSuperAdmin: isMainAdminUser(userByHandle),
        isPrimaryOwner: storage.isPrimarySiteOwner(userByHandle),
      });
    }

    // Legacy env-var credential fallback (set ADMIN_USERNAME + ADMIN_PASSWORD in Railway if needed)
    if (ADMIN_USERNAME && ADMIN_PASSWORD && username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      const actorId = getAdminActorUserId(req);
      const actor = actorId ? storage.getUserById(actorId) : null;
      if (actorId) req.session.userId = actorId;
      return res.json({
        isAdmin: true,
        username: ADMIN_USERNAME,
        isSuperAdmin: true,
        isPrimaryOwner: actor ? storage.isPrimarySiteOwner(actor) : false,
      });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.isAdmin = undefined;
    res.json({ ok: true });
  });

  app.get("/api/admin/me", requireAdmin, (req, res) => {
    const mainUser = getSessionAdminUser(req);
    const sessionUser = req.session?.userId ? storage.getUserById(req.session.userId) : null;
    const resolved = mainUser ? syncOwnerDisplayName(mainUser) : sessionUser;
    const primaryOwner = resolved ? storage.isPrimarySiteOwner(resolved) : false;
    const ownerAdmin = resolved ? storage.hasOwnerAdminAccess(resolved) : false;
    const superAdmin = !!mainUser || ownerAdmin;
    res.json({
      isAdmin: true,
      username: resolved?.displayName || resolved?.username || ADMIN_USERNAME,
      email: resolved?.email || null,
      isSuperAdmin: superAdmin,
      isPrimaryOwner: primaryOwner,
      canManageTeam: ownerAdmin,
      canViewUsers: ownerAdmin,
      canPush: ownerAdmin || !!mainUser,
      canManageCatalog: ownerAdmin || !!mainUser,
    });
  });

  app.get("/api/admin/team", requireAdmin, (req, res) => {
    const sessionUser = req.session?.userId ? storage.getUserById(req.session.userId) : null;
    if (!sessionUser || !storage.hasOwnerAdminAccess(sessionUser)) {
      return res.status(403).json({ error: "Owner admin only" });
    }
    res.json(storage.listSiteAdmins());
  });

  app.post("/api/admin/team", requireAdmin, (req, res) => {
    const sessionUser = req.session?.userId ? storage.getUserById(req.session.userId) : null;
    if (!sessionUser || !storage.hasOwnerAdminAccess(sessionUser)) {
      return res.status(403).json({ error: "Owner admin only" });
    }
    const { identifier, note } = req.body || {};
    const result = storage.grantSiteAdminByIdentifier(String(identifier || ""), sessionUser.id, note);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.admin);
  });

  app.delete("/api/admin/team/:userId", requireAdmin, (req, res) => {
    const sessionUser = req.session?.userId ? storage.getUserById(req.session.userId) : null;
    if (!sessionUser || !storage.hasOwnerAdminAccess(sessionUser)) {
      return res.status(403).json({ error: "Owner admin only" });
    }
    const result = storage.revokeSiteAdmin(Number(req.params.userId));
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ ok: true });
  });

  // ─── ADMIN ────────────────────────────────────────────────────────────────
  app.get("/api/admin/submissions", requireAdmin, (req, res) => {
    const subs = req.query.all === "true" ? storage.getSubmissions() : storage.getSubmissions("PENDING");
    res.json(subs.map(enrichSubmissionForAdmin));
  });

  app.post("/api/admin/submissions/:id/approve", requireAdmin, (req, res) => {
    const { adminName } = req.body;
    if (!adminName) return res.status(400).json({ error: "adminName required" });
    const pending = storage.getSubmissions().find(s => s.id === Number(req.params.id));
    // Only event submissions carry real dates - promoter applications and
    // claims store a placeholder timestamp where start === end.
    if (pending && (pending.type === "NEW_EVENT" || pending.type === "SUGGEST")) {
      const dateErr = validateEventDates(pending.dateStart, pending.dateEnd);
      if (dateErr) return res.status(400).json({ error: `Cannot approve: ${dateErr}` });
    }
    const sub = storage.approveSubmission(Number(req.params.id), adminName);
    if (!sub) return res.status(404).json({ error: "Not found" });
    if (sub.status === "APPROVED" && (sub.type === "NEW_EVENT" || sub.type === "SUGGEST")) {
      const created = storage.getEvents({ status: "LIVE" })
        .filter(evt => evt.submittedBy === sub.submitterEmail && evt.title === sub.title)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      if (created) {
        void fillEventMapCoordinates(created.id).catch(err =>
          console.error("[fillEventMapCoordinates] admin create failed:", err),
        );
      }
    }
    auditAdmin(req, "approve_submission", {
      type: "submission",
      id: sub.id,
      label: sub.title,
      detail: { status: sub.status, submissionType: sub.type },
    });
    releaseAdminQueueClaim("submission", Number(req.params.id), getAdminActor(req).id || 0, { force: true });
    res.json(sub);
  });

  app.post("/api/admin/submissions/:id/reject", requireAdmin, (req, res) => {
    const { reason } = req.body;
    const id = Number(req.params.id);
    storage.rejectSubmission(id, reason || "");
    auditAdmin(req, "reject_submission", {
      type: "submission",
      id,
      label: `submission #${id}`,
      detail: { reason: reason || null },
    });
    releaseAdminQueueClaim("submission", id, getAdminActor(req).id || 0, { force: true });
    res.json({ ok: true });
  });

  app.get("/api/admin/submissions/:id/merge-preview", requireAdmin, (req, res) => {
    const sub = storage.getSubmission(Number(req.params.id));
    if (!sub) return res.status(404).json({ error: "Submission not found" });
    const eventId = Number(req.query.eventId);
    const existing = Number.isFinite(eventId) ? storage.getEvent(eventId) : undefined;
    if (!existing) return res.status(404).json({ error: "Event not found" });
    res.json({
      submissionId: sub.id,
      eventId: existing.id,
      fields: diffSubmissionMerge(existing, sub),
    });
  });

  app.post("/api/admin/submissions/:id/merge", requireAdmin, async (req, res) => {
    const { adminName, eventId } = req.body;
    if (!adminName) return res.status(400).json({ error: "adminName required" });
    const targetEventId = Number(eventId);
    if (!Number.isFinite(targetEventId)) return res.status(400).json({ error: "eventId required" });

    const sub = storage.getSubmission(Number(req.params.id));
    if (!sub) return res.status(404).json({ error: "Submission not found" });
    const dateErr = validateEventDates(sub.dateStart, sub.dateEnd);
    if (dateErr) return res.status(400).json({ error: `Cannot merge: ${dateErr}` });

    const result = storage.mergeSubmissionIntoEvent(Number(req.params.id), targetEventId, adminName);
    if ("error" in result) return res.status(400).json({ error: result.error });

    await fillEventMapCoordinates(result.event.id);
    res.json(result);
  });

  app.get("/api/admin/talent-requests", requireAdmin, (req, res) => {
    res.json(storage.getPendingTalentForUnclaimedEvents());
  });

  app.post("/api/admin/talent-requests/:talentId/approve", requireAdmin, (req, res) => {
    const approverId = getAdminActorUserId(req);
    if (!approverId) return res.status(401).json({ error: "No admin user account configured" });
    const talentId = Number(req.params.talentId);
    const result = storage.approveEventTalent(talentId, approverId, { isAdmin: true });
    if (result.error) return res.status(400).json({ error: result.error });
    storage.softDeleteTalentRequestThreads(talentId, approverId);
    if (req.session.userId && req.session.userId !== approverId) {
      storage.softDeleteTalentRequestThreads(talentId, req.session.userId);
    }
    res.json(result.talent);
  });

  app.post("/api/admin/talent-requests/:talentId/reject", requireAdmin, (req, res) => {
    const approverId = getAdminActorUserId(req);
    if (!approverId) return res.status(401).json({ error: "No admin user account configured" });
    const talentId = Number(req.params.talentId);
    const result = storage.rejectEventTalent(talentId, approverId, { isAdmin: true });
    if (result.error) return res.status(400).json({ error: result.error });
    storage.softDeleteTalentRequestThreads(talentId, approverId);
    if (req.session.userId && req.session.userId !== approverId) {
      storage.softDeleteTalentRequestThreads(talentId, req.session.userId);
    }
    res.json(result);
  });

  app.get("/api/admin/promoter-requests", requireAdmin, (req, res) => {
    res.json(storage.getPendingPromoterRequests());
  });

  app.post("/api/admin/promoter-requests/:userId/approve", requireAdmin, (req, res) => {
    const userId = Number(req.params.userId);
    const user = storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const adminName = getSessionAdminUser(req)?.displayName
      || getSessionAdminUser(req)?.username
      || storage.getUserById(req.session.userId!)?.displayName
      || storage.getUserById(req.session.userId!)?.username
      || "admin";
    storage.setPromoterStatus(userId, "approved");
    storage.resolvePromoterApplicationSubmissions(userId, "approved", adminName);
    auditAdmin(req, "approve_promoter", {
      type: "promoter",
      id: userId,
      label: `@${user.username}`,
    });
    releaseAdminQueueClaim("promoter", userId, getAdminActor(req).id || 0, { force: true });
    res.json({ ok: true, promoterStatus: "approved" });
  });

  app.post("/api/admin/promoter-requests/:userId/deny", requireAdmin, (req, res) => {
    const userId = Number(req.params.userId);
    const user = storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    storage.setPromoterStatus(userId, "rejected");
    storage.resolvePromoterApplicationSubmissions(userId, "rejected", "admin", "Promoter request denied");
    auditAdmin(req, "deny_promoter", {
      type: "promoter",
      id: userId,
      label: `@${user.username}`,
    });
    releaseAdminQueueClaim("promoter", userId, getAdminActor(req).id || 0, { force: true });
    res.json({ ok: true, promoterStatus: "rejected" });
  });

  // ── Admin: venue claims + new-business submissions + logo requests ──────
  app.get("/api/admin/business-claims", requireAdmin, (req, res) => {
    res.json(req.query.recent === "true"
      ? storage.getRecentResolvedBusinessClaims()
      : storage.getPendingBusinessClaims());
  });

  app.post("/api/admin/business-claims/:id/approve", requireAdmin, (req, res) => {
    const adminName = String(req.body?.adminName || "Admin");
    const id = Number(req.params.id);
    const result = storage.approveBusinessClaim(id, adminName);
    if ("error" in result) return res.status(400).json({ error: result.error });
    auditAdmin(req, "approve_business_claim", { type: "business_claim", id });
    releaseAdminQueueClaim("business_claim", id, getAdminActor(req).id || 0, { force: true });
    res.json(result);
  });

  app.post("/api/admin/business-claims/:id/deny", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    storage.rejectBusinessClaim(id, req.body?.reason);
    auditAdmin(req, "deny_business_claim", { type: "business_claim", id, detail: { reason: req.body?.reason || null } });
    releaseAdminQueueClaim("business_claim", id, getAdminActor(req).id || 0, { force: true });
    res.json({ ok: true });
  });

  app.get("/api/admin/business-submissions", requireAdmin, (req, res) => {
    res.json(req.query.recent === "true"
      ? storage.getRecentResolvedBusinessSubmissions()
      : storage.getPendingBusinessSubmissions());
  });

  app.post("/api/admin/business-submissions/:id/approve", requireAdmin, (req, res) => {
    const adminName = String(req.body?.adminName || "Admin");
    const overrideImageUrl = req.body?.imageUrl ? String(req.body.imageUrl) : undefined;
    const id = Number(req.params.id);
    const result = storage.approveBusinessSubmission(id, adminName, overrideImageUrl);
    if ("error" in result) return res.status(400).json({ error: result.error });
    auditAdmin(req, "approve_business_submission", { type: "business_submission", id });
    releaseAdminQueueClaim("business_submission", id, getAdminActor(req).id || 0, { force: true });
    res.json(result);
  });

  app.post("/api/admin/business-submissions/:id/deny", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    storage.rejectBusinessSubmission(id, req.body?.reason);
    auditAdmin(req, "deny_business_submission", { type: "business_submission", id });
    releaseAdminQueueClaim("business_submission", id, getAdminActor(req).id || 0, { force: true });
    res.json({ ok: true });
  });

  app.get("/api/admin/business-logo-requests", requireAdmin, (req, res) => {
    res.json(req.query.recent === "true"
      ? storage.getRecentResolvedBusinessLogoRequests()
      : storage.getPendingBusinessLogoRequests());
  });

  app.post("/api/admin/business-logo-requests/:id/approve", requireAdmin, (req, res) => {
    const overrideImageUrl = req.body?.imageUrl ? String(req.body.imageUrl) : undefined;
    const id = Number(req.params.id);
    const result = storage.approveBusinessLogoRequest(id, overrideImageUrl);
    if ("error" in result) return res.status(400).json({ error: result.error });
    auditAdmin(req, "approve_logo", { type: "logo_request", id });
    res.json(result);
  });

  app.post("/api/admin/business-logo-requests/:id/deny", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    storage.rejectBusinessLogoRequest(id, req.body?.reason);
    auditAdmin(req, "deny_logo", { type: "logo_request", id });
    res.json({ ok: true });
  });

  // Full directory roster + assign/unassign venue owners (same idea as event host assign)
  app.get("/api/admin/directory", requireAdmin, (req, res) => {
    res.json(storage.getAdminDirectoryBusinesses());
  });

  app.post("/api/admin/directory/:id/owner", requireAdmin, (req, res) => {
    try {
      const businessId = Number(req.params.id);
      const username = String(req.body.username || "").trim().replace(/^@/, "");
      if (!username) return res.status(400).json({ error: "username required" });
      const user = resolveUserByUsername(username);
      if (!user) return res.status(404).json({ error: "No account found with that username" });
      if (user.status !== "active") return res.status(400).json({ error: "User account is not active" });
      const result = storage.assignBusinessOwner(businessId, user.id);
      if (result.error) return res.status(400).json({ error: result.error });
      auditAdmin(req, "assign_business_owner", {
        type: "business",
        id: businessId,
        detail: { userId: user.id, username: user.username },
      });
      try {
        const name = result.business?.name || "your venue";
        storage.sendAsGuideAdmin(
          user.id,
          `You now own: ${name}`,
          `An admin assigned you as the owner of "${name}" in the Queer Directory. Open your Hub to manage the listing.`,
          { contextType: "GUIDE_UPDATE", contextLabel: name },
        );
      } catch (notifyErr) {
        console.error("[admin] assign venue owner notify failed:", notifyErr);
      }
      const enriched = storage.getAdminDirectoryBusinesses().find((b) => b.id === businessId);
      res.json(enriched || result.business);
    } catch (err) {
      console.error("[admin] assign venue owner failed:", err);
      res.status(500).json({ error: "Could not assign venue owner" });
    }
  });

  // Recategorise a listing (e.g. a community org filed under "nonprofit" that
  // really belongs in Clubs & Groups). Narrow on purpose: validates against the
  // canonical category list and audits, unlike the broad PUT above.
  app.patch("/api/admin/directory/:id/type", requireAdmin, (req, res) => {
    const businessId = Number(req.params.id);
    const before = storage.getBusiness(businessId);
    if (!before) return res.status(404).json({ error: "Venue not found" });
    const type = String(req.body?.type || "").trim();
    if (!(DIRECTORY_TYPES as readonly string[]).includes(type)) {
      return res.status(400).json({ error: "Unknown category" });
    }
    const updated = storage.updateBusiness(businessId, { type } as any);
    if (!updated) return res.status(404).json({ error: "Venue not found" });
    auditAdmin(req, "set_business_type", {
      type: "business",
      id: businessId,
      detail: { from: before.type, to: type },
    });
    res.json(updated);
  });

  app.delete("/api/admin/directory/:id/owner", requireAdmin, (req, res) => {
    const businessId = Number(req.params.id);
    const before = storage.getBusiness(businessId);
    if (!before) return res.status(404).json({ error: "Venue not found" });
    const result = storage.clearBusinessOwner(businessId);
    if (result.error) return res.status(400).json({ error: result.error });
    auditAdmin(req, "unassign_business_owner", {
      type: "business",
      id: businessId,
      detail: { previousOwnerId: before.ownerId ?? null },
    });
    const enriched = storage.getAdminDirectoryBusinesses().find((b) => b.id === businessId);
    res.json(enriched || result.business);
  });

  app.get("/api/admin/users", requireAdmin, (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!caller || !storage.hasOwnerAdminAccess(caller)) {
      return res.status(403).json({ error: "Owner admin only" });
    }
    const q = String(req.query.q || "").trim().toLowerCase();
    const all = storage.getAllUsers ? storage.getAllUsers() : [];
    const filtered = q
      ? all.filter((u: any) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q)
      )
      : all;
    const sorted = [...filtered].sort((a: any, b: any) => {
      const aTime = Date.parse(a.createdAt || "") || a.id || 0;
      const bTime = Date.parse(b.createdAt || "") || b.id || 0;
      return bTime - aTime;
    });
    res.json(sorted.map(adminUserSummary));
  });

  app.get("/api/admin/users/search", requireAdmin, (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!caller || !storage.hasOwnerAdminAccess(caller)) {
      return res.status(403).json({ error: "Owner admin only" });
    }
    // Strip leading @ so "@brohoejams" matches username brohoejams
    const q = String(req.query.q || "").trim().toLowerCase().replace(/^@+/, "");
    if (!q) return res.json([]);
    const all = storage.getAllUsers ? storage.getAllUsers() : [];
    const matches = all
      .filter((u: any) => {
        const uname = String(u.username || "").toLowerCase().replace(/^@+/, "");
        const email = String(u.email || "").toLowerCase();
        const display = String(u.displayName || "").toLowerCase();
        return uname.includes(q) || email.includes(q) || display.includes(q) || uname === q;
      })
      .slice(0, 25)
      .map(adminUserSummary);
    res.json(matches);
  });

  app.post("/api/admin/users/:userId/set-sub-admin", requireAdmin, (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!caller || !storage.hasOwnerAdminAccess(caller)) {
      return res.status(403).json({ error: "Owner admin only" });
    }
    const userId = Number(req.params.userId);
    const { grant } = req.body as { grant: boolean };
    const target = storage.getUserById(userId);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (isMainAdminUser(target) && !grant) {
      return res.status(400).json({ error: "Cannot demote env/super admin here" });
    }
    if (storage.isPrimarySiteOwner(target)) {
      return res.status(400).json({ error: "Cannot modify primary owner" });
    }
    storage.updateUser(userId, { subAdmin: grant });
    const now = new Date().toISOString();
    if (grant) {
      storage.ensureSiteAdminGrant(userId, req.session.userId ?? null, "Sub-admin", now);
    } else {
      storage.revokeSiteAdmin(userId);
    }
    res.json({ ok: true, subAdmin: grant });
  });

  app.post("/api/admin/users/:userId/set-username", requireAdmin, (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!caller || !storage.hasOwnerAdminAccess(caller)) {
      return res.status(403).json({ error: "Owner admin only" });
    }
    const userId = Number(req.params.userId);
    const { username } = req.body as { username: string };
    if (!username || username.trim().length < 3) return res.status(400).json({ error: "Username must be at least 3 characters" });
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (clean.length < 3) return res.status(400).json({ error: "Invalid username" });
    const target = storage.getUserById(userId);
    if (!target) return res.status(404).json({ error: "User not found" });
    const existing = storage.getUserByUsername(clean);
    if (existing && existing.id !== userId) return res.status(409).json({ error: "Username already taken" });
    sqlite.prepare("UPDATE users SET username = ? WHERE id = ?").run(clean, userId);
    res.json({ ok: true, username: clean });
  });

  // Manual promoter role grant/revoke is owner-only. Queue approve/deny stays open to all admins.
  app.post("/api/admin/users/:userId/set-promoter-status", requireAdmin, (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!caller || !storage.hasOwnerAdminAccess(caller)) {
      return res.status(403).json({ error: "Owner admin only" });
    }
    const userId = Number(req.params.userId);
    const { status } = req.body as { status: string };
    const allowed = ["none", "pending", "approved", "rejected"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const user = storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    storage.setPromoterStatus(userId, status);
    res.json({ ok: true, promoterStatus: status });
  });

  app.post("/api/admin/users/:username/moderate", requireAdmin, (req, res) => {
    const actorId = req.session.userId;
    if (!actorId) return res.status(401).json({ error: "Not authenticated" });
    const actor = storage.getUserById(actorId);
    if (!actor) return res.status(401).json({ error: "Not authenticated" });

    const username = String(req.params.username || "").trim().replace(/^@/, "");
    const target = storage.getUserByUsername(username);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.id === actorId) return res.status(400).json({ error: "Cannot moderate your own account" });
    if (storage.isPrimarySiteOwner(target) && !storage.isPrimarySiteOwner(actor)) {
      return res.status(403).json({ error: "Cannot moderate the primary owner" });
    }

    const action = String(req.body?.action || "").toLowerCase();
    const allowed = ["suspend", "unsuspend", "shadowban", "unshadowban", "delete"];
    if (!allowed.includes(action)) {
      return res.status(400).json({ error: "action must be suspend, unsuspend, shadowban, unshadowban, or delete" });
    }
    // Full account delete is primary-owner only.
    if (action === "delete" && !storage.isPrimarySiteOwner(actor)) {
      return res.status(403).json({ error: "Only the site owner can fully delete an account" });
    }

    const reasonCode = String(req.body?.reasonCode || "OTHER").trim();
    const reasonLabel =
      typeof req.body?.reasonLabel === "string" && req.body.reasonLabel.trim()
        ? req.body.reasonLabel.trim().slice(0, 160)
        : accountModReasonLabel(reasonCode);
    const note = typeof req.body?.note === "string" ? req.body.note : "";
    let until: string | null = null;
    if (req.body?.until) {
      until = String(req.body.until);
    } else if (req.body?.durationHours != null && req.body.durationHours !== "") {
      until = untilIsoFromHours(Number(req.body.durationHours));
    }

    if ((action === "suspend" || action === "shadowban" || action === "delete") && !reasonCode) {
      return res.status(400).json({ error: "reasonCode required" });
    }

    const updated = storage.applyAccountModeration({
      targetUserId: target.id,
      actorUserId: actorId,
      action: action as any,
      reasonCode,
      reasonLabel,
      note,
      until,
    });
    if (!updated) return res.status(500).json({ error: "Could not update user" });

    // Shared admin queue + owner inbox for restricting actions
    if (action === "suspend" || action === "shadowban" || action === "delete") {
      const type =
        action === "suspend"
          ? "ACCOUNT_SUSPEND"
          : action === "shadowban"
            ? "ACCOUNT_SHADOWBAN"
            : "ACCOUNT_DELETE";
      const untilLine = until ? `Until: ${until}` : "Until: indefinite";
      const proof = [
        `Action: ${action}`,
        `By: @${actor.username} (${actor.displayName || "admin"})`,
        `Reason: ${reasonLabel} (${reasonCode})`,
        untilLine,
        note.trim() ? `Note: ${note.trim()}` : null,
        `Profile: /u/${encodeURIComponent(target.username)}`,
      ]
        .filter(Boolean)
        .join("\n");
      storage.createModerationRequest({
        type,
        eventId: 0,
        eventTitle: `@${target.username}`,
        requesterName: actor.displayName || actor.username,
        requesterEmail: actor.email,
        proof,
      });
      // Duplicate into owner personal inbox + Owner Desk.
      const ownerUser =
        storage.getAllUsers().find((u) => storage.isPrimarySiteOwner(u)) || null;
      if (ownerUser) {
        storage.sendAsGuideAdmin(
          ownerUser.id,
          `${action.toUpperCase()}: @${target.username}`,
          proof,
          {
            contextType: "ADMIN_ALERT",
            contextId: target.id,
            contextLabel: `@${target.username}`,
          },
        );
      }
      storage.createOwnerDeskItem({
        kind: "account_moderation",
        title: `${action}: @${target.username}`,
        summary: reasonLabel,
        body: proof,
        contactName: actor.displayName || actor.username,
        contactEmail: actor.email,
        pageUrl: `/u/${encodeURIComponent(target.username)}`,
        severity: action === "delete" ? "critical" : "high",
        metaJson: {
          action,
          targetUserId: target.id,
          targetUsername: target.username,
          reasonCode,
          until,
          actorUserId: actor.id,
        },
      });
    }

    auditAdmin(req, `account_${action}`, {
      type: "user",
      id: target.id,
      label: `@${target.username}`,
      detail: { reasonCode, until, hasNote: Boolean(note) },
    });

    res.json({ ok: true, user: adminUserSummary(updated) });
  });

  /** Member report of another account → admin moderation queue */
  app.post("/api/users/:username/report", requireAuth, (req, res) => {
    const reporterId = req.session.userId!;
    const reporter = storage.getUserById(reporterId);
    if (!reporter) return res.status(401).json({ error: "Not authenticated" });
    const username = String(req.params.username || "").trim().replace(/^@/, "");
    const target = storage.getUserByUsername(username);
    if (!target || target.status === "deleted") {
      return res.status(404).json({ error: "User not found" });
    }
    if (target.id === reporterId) {
      return res.status(400).json({ error: "Cannot report yourself" });
    }
    const reasonCode = String(req.body?.reasonCode || "OTHER").trim();
    const reasonLabel = accountModReasonLabel(reasonCode);
    const note = String(req.body?.note || "").trim().slice(0, 1000);
    const proof = [
      `Report against @${target.username}`,
      `From: @${reporter.username}`,
      `Reason: ${reasonLabel} (${reasonCode})`,
      note ? `Details: ${note}` : null,
      `Profile: /u/${encodeURIComponent(target.username)}`,
    ]
      .filter(Boolean)
      .join("\n");
    const row = storage.createModerationRequest({
      type: "ACCOUNT_REPORT",
      eventId: 0,
      eventTitle: `@${target.username}`,
      requesterName: reporter.displayName || reporter.username,
      requesterEmail: reporter.email,
      proof,
    });
    res.json({ ok: true, reportId: row.id });
  });

  app.post("/api/auth/suspension-appeal", requireAuth, (req, res) => {
    let user = storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    user = storage.clearExpiredAccountModeration(user.id) || user;
    if (user.status !== "suspended") {
      return res.status(400).json({ error: "Your account is not suspended" });
    }
    const body = String(req.body?.body || "").trim().slice(0, 2000);
    if (body.length < 20) {
      return res.status(400).json({ error: "Appeal must be at least 20 characters" });
    }
    const proof = [
      `Suspension appeal from @${user.username}`,
      `Suspend reason: ${user.suspendReasonLabel || user.suspendReasonCode || "n/a"}`,
      user.suspendUntil ? `Until: ${user.suspendUntil}` : "Until: indefinite",
      user.suspendNote ? `Admin note: ${user.suspendNote}` : null,
      "",
      "Appeal:",
      body,
    ]
      .filter((x) => x !== null)
      .join("\n");
    // Appeals go to shared Admin queue (moderation), not Owner Desk only.
    const row = storage.createModerationRequest({
      type: "SUSPEND_APPEAL",
      eventId: 0,
      eventTitle: `@${user.username}`,
      requesterName: user.displayName || user.username,
      requesterEmail: user.email,
      proof,
    });
    res.json({ ok: true, appealId: row.id });
  });

  app.post("/api/admin/users/:username/reject-photo", requireAdmin, (req, res) => {
    try {
      const username = String(req.params.username || "").trim().replace(/^@/, "");
      const { reasonCode, note } = parseProfilePhotoRejectBody(req.body);
      const result = storage.rejectUserProfilePhoto(username, reasonCode, note);
      if (result.error) return res.status(400).json({ error: result.error });
      auditAdmin(req, "reject_photo", {
        type: "user",
        id: username,
        label: `@${username}`,
        detail: { reasonCode, hasNote: Boolean(note) },
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/admin/events", requireAdmin, (req, res) => {
    res.json(getAdminEventCatalog().map(enrichEventForAdmin));
  });

  app.get("/api/admin/persistence", requireAdmin, (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!caller || !storage.hasOwnerAdminAccess(caller)) {
      return res.status(403).json({ error: "Owner admin only" });
    }
    res.json(getPersistenceAudit(getTableCounts()));
  });

  app.get("/api/admin/pending-count", requireAdmin, (req, res) => {
    const user = req.session.userId ? storage.getUserById(req.session.userId) : null;
    const ownerCount = user && storage.isPrimarySiteOwner(user) ? storage.getOwnerDeskCount() : 0;
    const breakdown = storage.getAdminQueueBreakdown();
    const queueCount = breakdown.total;
    const guideUnread = breakdown.guideUnread;
    res.json({
      count: queueCount,
      queueCount,
      guideUnread,
      /** Badge total for Admin tab / mobile Queue: queue items + guide-inbox unreplies. */
      adminBadge: queueCount + guideUnread,
      ownerCount,
      /** Category counts - one mobile-friendly payload for badges and overview. */
      breakdown,
    });
  });

  /**
   * Mobile-first admin pulse: single round-trip for overview cards + queue chips.
   * Prefer this over hammering many queue endpoints on a phone.
   */
  app.get("/api/admin/pulse", requireAdmin, (req, res) => {
    const user = req.session.userId ? storage.getUserById(req.session.userId) : null;
    const breakdown = storage.getAdminQueueBreakdown();
    const ownerCount = user && storage.isPrimarySiteOwner(user) ? storage.getOwnerDeskCount() : 0;
    const metrics = storage.getAdminMetrics();
    res.json({
      generatedAt: new Date().toISOString(),
      queue: breakdown,
      adminBadge: breakdown.total + breakdown.guideUnread,
      ownerCount,
      liveEvents: metrics.liveEvents,
      pendingSubmissions: metrics.pendingSubmissions,
      newUsersToday: metrics.newUsersToday,
      guideUnread: breakdown.guideUnread,
      guideSentPreview: storage.getGuideAdminSent().slice(0, 5).map((m: any) => ({
        id: m.id,
        threadId: m.threadId,
        subject: m.subject,
        toUsername: m.to_username || null,
        createdAt: m.createdAt,
      })),
    });
  });

  /** Unified search for admin tools → floating inbox Queue or /admin tabs. */
  app.get("/api/admin/search", requireAdmin, (req, res) => {
    const q = String(req.query.q || "").trim();
    const limit = Number(req.query.limit) || 16;
    const viewer = req.session.userId ? storage.getUserById(req.session.userId) : null;
    res.json(adminSearchForViewer(q, viewer ?? null, limit));
  });

  /** Recent admin actions (rejects, DMs, grants) for accountability on mobile/desktop. */
  app.get("/api/admin/activity", requireAdmin, (req, res) => {
    const limit = Number(req.query.limit) || 60;
    res.json(storage.getAdminActionLog(limit));
  });

  /**
   * Single payload for floating inbox Admin · Queue (all buckets + soft claims).
   * Prefer this over 10 parallel list endpoints on mobile admin.
   */
  app.get("/api/admin/queue", requireAdmin, (_req, res) => {
    try {
      res.json(getAdminQueueAggregate());
    } catch (err) {
      console.error("[admin/queue]", err);
      res.status(500).json({ error: "Could not load admin queue" });
    }
  });

  app.get("/api/admin/queue-claims", requireAdmin, (_req, res) => {
    res.json(listAdminQueueClaims());
  });

  app.post("/api/admin/queue-claims", requireAdmin, (req, res) => {
    const actor = getAdminActor(req);
    if (!actor.id) return res.status(401).json({ error: "No admin actor" });
    const kind = String(req.body?.kind || req.body?.queueKind || "").trim();
    const entityId = Number(req.body?.entityId ?? req.body?.id);
    const takeover = Boolean(req.body?.takeover);
    const result = claimAdminQueueItem(kind, entityId, actor.id, { takeover });
    if (result.error) return res.status(400).json({ error: result.error });
    auditAdmin(req, takeover ? "queue_takeover" : "queue_claim", {
      type: kind,
      id: entityId,
      label: `${kind} #${entityId}`,
    });
    res.json(result);
  });

  app.delete("/api/admin/queue-claims/:kind/:entityId", requireAdmin, (req, res) => {
    const actor = getAdminActor(req);
    if (!actor.id) return res.status(401).json({ error: "No admin actor" });
    const result = releaseAdminQueueClaim(
      String(req.params.kind || ""),
      Number(req.params.entityId),
      actor.id,
      { force: Boolean(req.query.force === "1" || req.body?.force) },
    );
    if (result.error) return res.status(400).json({ error: result.error });
    auditAdmin(req, "queue_release", {
      type: String(req.params.kind),
      id: req.params.entityId,
    });
    res.json({ ok: true });
  });

  /** Dry-run bulk event actions (no writes). */
  app.post("/api/admin/events/bulk/preview", requireAdmin, (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number) : [];
    const action = String(req.body?.action || "");
    const result = previewBulkEvents(ids, action);
    if ("error" in result && result.error) return res.status(400).json(result);
    res.json(result);
  });

  /** Execute bulk event actions (guarded: hide / claimable only, max batch). */
  app.post("/api/admin/events/bulk/execute", requireAdmin, (req, res) => {
    if (!req.body?.confirm) {
      return res.status(400).json({ error: "confirm: true required - use preview first" });
    }
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number) : [];
    const action = String(req.body?.action || "");
    const reason = String(req.body?.reason || "").trim().slice(0, 300);
    const actor = getAdminActor(req);
    const result = executeBulkEvents(ids, action, actor, reason);
    if ("error" in result && result.error) return res.status(400).json(result);
    res.json(result);
  });

  /**
   * Live ingest source list: curated registry + every directory website.
   * New Places with a website appear here automatically.
   */
  app.get("/api/admin/events/ingest/sources", requireAdmin, (_req, res) => {
    const businesses = storage.getBusinesses({});
    const directory = buildDirectoryIngestSources(
      businesses.map((b: any) => ({
        id: b.id,
        name: b.name,
        website: b.website,
        type: b.type,
        active: b.active,
        ingestEvents: b.ingestEvents,
      })),
    );
    // Catch-all list only - trusted venues live on the Trusted board
    const sources = mergeIngestSources(INGEST_SOURCES, directory).filter(
      s => !isTrustedLaneSource({ id: s.id, url: s.url }),
    );
    res.json({
      sources,
      curatedCount: sources.filter(s => s.tier !== "directory").length,
      directoryCount: sources.filter(s => s.tier === "directory").length,
      total: sources.length,
    });
  });

  // ─── QSearch dashboard (multi-source scan + health) ─────────────────────
  app.get("/api/admin/qsearch/dashboard", requireAdmin, (_req, res) => {
    const businesses = storage.getBusinesses({}).map((b: any) => ({
      id: b.id,
      name: b.name,
      website: b.website,
      type: b.type,
      active: b.active,
    }));
    res.json(dashboardSnapshot(businesses));
  });

  /**
   * Trusted venues health board.
   * GET  → registry + health
   * POST → manual sync defaults to Review queue (mode=review). Never LIVE from admin button.
   */
  app.get("/api/admin/qsearch/trusted", requireAdmin, (_req, res) => {
    res.json(getTrustedDashboard());
  });

  /**
   * Prefill "Add to directory" from venue name + optional website/address.
   * Geocode (Nominatim) + light website scrape for blurb / IG / phone / og:image.
   */
  // ── Flyer Reader (Phase 1): GitHub-sourced flyer → sharp preprocess →
  // Tesseract OCR → raw text + confidence. Structured parsing lands in
  // Phase 2 (reuses qsearch/vision.ts); validation harness in Phase 4.
  app.post("/api/admin/qsearch/flyer-reader/ocr", requireAdmin, async (req, res) => {
    try {
      const { loadFlyer } = await import("./flyerReader/github");
      const { ocrFlyer } = await import("./flyerReader/ocr");

      const githubPath = req.body?.githubPath != null ? String(req.body.githubPath) : "";
      const imageBase64 = req.body?.imageBase64 != null ? String(req.body.imageBase64) : "";

      let buffer: Buffer;
      let source = "upload";
      let flyerPath: string | null = null;
      if (githubPath) {
        const flyer = await loadFlyer(githubPath);
        buffer = flyer.buffer;
        source = flyer.source;
        flyerPath = flyer.path;
      } else if (imageBase64) {
        buffer = Buffer.from(imageBase64.replace(/^data:[^,]+,/, ""), "base64");
      } else {
        return res.status(400).json({ ok: false, error: "Provide githubPath or imageBase64" });
      }
      if (!buffer?.length) {
        return res.status(400).json({ ok: false, error: "Empty flyer" });
      }

      const result = await ocrFlyer(buffer);
      res.json({ ok: true, source, path: flyerPath, bytes: buffer.length, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, error: message });
    }
  });

  // ── Flyer Reader (Phase 2): OCR → LLM → structured event JSON + draft ──
  app.post("/api/admin/qsearch/flyer-reader/parse", requireAdmin, async (req, res) => {
    try {
      const { loadFlyer } = await import("./flyerReader/github");
      const { ocrFlyer } = await import("./flyerReader/ocr");
      const { structureFlyer, flyerParseToDraft } = await import("./flyerReader/parse");

      const githubPath = req.body?.githubPath != null ? String(req.body.githubPath) : "";
      const imageBase64 = req.body?.imageBase64 != null ? String(req.body.imageBase64) : "";
      const rawTextIn = req.body?.rawText != null ? String(req.body.rawText) : "";

      let flyerPath: string | null = null;
      let source = "upload";
      let ocr: Awaited<ReturnType<typeof ocrFlyer>> | null = null;
      let rawText = rawTextIn;
      let imageBuffer: Buffer | null = null;

      if (!rawText) {
        if (githubPath) {
          const flyer = await loadFlyer(githubPath);
          imageBuffer = flyer.buffer;
          source = flyer.source;
          flyerPath = flyer.path;
        } else if (imageBase64) {
          imageBuffer = Buffer.from(imageBase64.replace(/^data:[^,]+,/, ""), "base64");
        } else {
          return res
            .status(400)
            .json({ ok: false, error: "Provide githubPath, imageBase64, or rawText" });
        }
        if (!imageBuffer?.length) return res.status(400).json({ ok: false, error: "Empty flyer" });
        ocr = await ocrFlyer(imageBuffer);
        rawText = ocr.text;
      }

      const parse = await structureFlyer({ imageBuffer, rawText, ocrConfidence: ocr?.confidence });
      const draft = flyerParseToDraft(parse, { sourcePath: flyerPath });

      // Phase 3: queue=true lands the draft in the QSearch Review queue
      // (same human-approve path as every other source - never auto-LIVE).
      let queuedJobId: string | null = null;
      if (req.body?.queue === true && draft) {
        if (flyerPath) {
          // Show the actual flyer art on the Review card
          draft.posterImageUrl = `https://raw.githubusercontent.com/${
            process.env.GITHUB_FLYERS_REPO?.trim() || "maxmackpdx-pride/pdx-pride-guide"
          }/${process.env.GITHUB_FLYERS_BRANCH?.trim() || "master"}/${flyerPath}`;
        }
        const { jobId } = await queueManualQSearchDrafts({
          drafts: [draft],
          sourceId: "flyer-reader",
          sourceLabel: "Flyer Reader",
          sourceUrl: flyerPath ? `github:${flyerPath}` : "flyer-upload",
          kind: "flyer_reader",
        });
        queuedJobId = jobId;
      }

      res.json({
        ok: true,
        source,
        path: flyerPath,
        ocr: ocr
          ? { confidence: ocr.confidence, preprocessMs: ocr.preprocessMs, ocrMs: ocr.ocrMs }
          : null,
        parse,
        draft,
        queuedJobId,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.post("/api/admin/qsearch/directory-lookup", requireAdmin, async (req, res) => {
    try {
      const { lookupDirectoryPlace } = await import("./qsearch/directoryLookup");
      const result = await lookupDirectoryPlace({
        name: String(req.body?.name || "").trim(),
        address: req.body?.address != null ? String(req.body.address) : null,
        website: req.body?.website != null ? String(req.body.website) : null,
        description: req.body?.description != null ? String(req.body.description) : null,
      });
      if (!result.name || result.name.length < 2) {
        return res.status(400).json({ error: "name required" });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Directory lookup failed" });
    }
  });

  async function runTrustedSyncHandler(
    req: any,
    res: any,
    sourceId: string | undefined,
  ) {
    try {
      const mod = await import("./qsearch/trustedSync");
      // Admin manual sync always goes to Review - ignore body.mode=publish
      const syncOpts = { mode: "review" as const };

      if (sourceId) {
        if (typeof mod.syncTrustedVenue !== "function") {
          return res.status(503).json({ error: "Trusted sync is unavailable" });
        }
        const result = await mod.syncTrustedVenue(sourceId, syncOpts);
        auditAdmin(req, "qsearch_trusted_sync", {
          type: "qsearch_trusted",
          id: sourceId,
          detail: { scope: "one", mode: "review", result },
        });
        const queued = Number((result as any)?.queued || 0);
        const updated = Number((result as any)?.updated?.length || 0);
        return res.json({
          ok: true,
          sourceId,
          mode: "review",
          queued,
          updated,
          result,
          message:
            [
              queued > 0 ? `${queued} new for Review` : null,
              updated > 0 ? `${updated} existing event${updated === 1 ? "" : "s"} refreshed` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Sync finished - nothing new",
        });
      }

      if (typeof mod.syncAllTrustedVenues !== "function") {
        return res.status(503).json({ error: "Trusted sync is unavailable" });
      }
      const results = await mod.syncAllTrustedVenues(syncOpts);
      const queued = results.reduce((n, r) => n + (Number(r.queued) || 0), 0);
      const updated = results.reduce((n, r) => n + (Number((r as any)?.updated?.length) || 0), 0);
      auditAdmin(req, "qsearch_trusted_sync", {
        type: "qsearch_trusted",
        detail: { scope: "all", mode: "review", results },
      });
      return res.json({
        ok: true,
        scope: "all",
        mode: "review",
        queued,
        updated,
        result: results,
        message:
          [
            queued > 0 ? `${queued} new for Review` : null,
            updated > 0 ? `${updated} existing event${updated === 1 ? "" : "s"} refreshed` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Sync finished - nothing new",
      });
    } catch (err: any) {
      const msg = String(err?.message || err || "trusted sync failed");
      if (
        msg.includes("Cannot find module") ||
        msg.includes("Cannot find package") ||
        err?.code === "ERR_MODULE_NOT_FOUND" ||
        err?.code === "MODULE_NOT_FOUND"
      ) {
        return res.status(503).json({ error: "Trusted sync module missing", detail: msg });
      }
      console.error("[qsearch-trusted] sync failed:", err);
      return res.status(500).json({ error: msg });
    }
  }

  app.post("/api/admin/qsearch/trusted/sync", requireAdmin, async (req, res) => {
    const sourceId =
      req.body?.sourceId != null && String(req.body.sourceId).trim()
        ? String(req.body.sourceId).trim()
        : undefined;
    await runTrustedSyncHandler(req, res, sourceId);
  });

  app.post("/api/admin/qsearch/trusted/sync/:sourceId", requireAdmin, async (req, res) => {
    const sourceId = decodeURIComponent(String(req.params.sourceId || "")).trim();
    if (!sourceId) {
      return res.status(400).json({ error: "sourceId required" });
    }
    await runTrustedSyncHandler(req, res, sourceId);
  });

  app.get("/api/admin/qsearch/queue", requireAdmin, (req, res) => {
    const status = req.query.status != null ? String(req.query.status) : "pending";
    const limit = Math.min(500, Number(req.query.limit) || 200);
    const candidates = listCandidates({ status, limit });
    // Always re-match directory brands so logo pack + fuzzy match apply to old rows
    const enriched = attachDirectoryBrandsToCandidates(candidates as any[]);
    res.json({ candidates: enriched });
  });

  /** Clear review queue: last scan only (default) or all pending. */
  app.post("/api/admin/qsearch/queue/clear", requireAdmin, (req, res) => {
    const scope = req.body?.scope === "all" ? "all" : "last";
    const hard = Boolean(req.body?.hard);
    const result = clearScanQueue({ scope, hard });
    auditAdmin(req, "qsearch_queue_clear", {
      type: "qsearch",
      detail: { scope: result.scope, cleared: result.cleared, hard: result.hard, jobId: result.jobId },
    });
    res.json(result);
  });

  /** Dismiss one or more Review queue cards (status → skipped). Does not create events. */
  app.post("/api/admin/qsearch/queue/dismiss", requireAdmin, (req, res) => {
    const raw = req.body?.ids;
    const ids = Array.isArray(raw)
      ? raw.map((id: unknown) => String(id || "").trim()).filter(Boolean)
      : typeof req.body?.id === "string"
        ? [req.body.id.trim()].filter(Boolean)
        : [];
    if (!ids.length) return res.status(400).json({ error: "ids required" });
    const capped = ids.slice(0, 200);
    markCandidatesSkipped(capped);
    auditAdmin(req, "qsearch_queue_dismiss", {
      type: "qsearch",
      detail: { count: capped.length, ids: capped.slice(0, 20) },
    });
    res.json({ ok: true, dismissed: capped.length });
  });

  /** Restore an AI-dropped candidate back into the pending Review queue. */
  app.post("/api/admin/qsearch/queue/restore", requireAdmin, (req, res) => {
    const id = String(req.body?.id || "").trim();
    if (!id) return res.status(400).json({ error: "id required" });
    const restored = restoreCandidate(id);
    if (restored) auditAdmin(req, "qsearch_queue_restore", { type: "qsearch", detail: { id } });
    res.json({ ok: restored, restored });
  });

  /** Drop a candidate's poster (e.g. AI flagged it as a logo / wrong flyer). */
  app.post("/api/admin/qsearch/queue/clear-flyer", requireAdmin, (req, res) => {
    const id = String(req.body?.id || "").trim();
    if (!id) return res.status(400).json({ error: "id required" });
    const cleared = clearCandidateFlyer(id);
    if (cleared) auditAdmin(req, "qsearch_queue_clear_flyer", { type: "qsearch", detail: { id } });
    res.json({ ok: cleared, cleared });
  });

  app.post("/api/admin/qsearch/sources/ack-new", requireAdmin, (_req, res) => {
    markAllNewSeen();
    res.json({ ok: true });
  });

  /** Add a custom scrape source (any http(s) URL). */
  app.post("/api/admin/qsearch/sources", requireAdmin, (req, res) => {
    const result = addCustomSource({
      label: String(req.body?.label || "").trim(),
      url: String(req.body?.url || "").trim(),
      tier: req.body?.tier != null ? String(req.body.tier) : undefined,
      format: req.body?.format != null ? String(req.body.format) : undefined,
      businessId:
        req.body?.businessId != null && req.body.businessId !== ""
          ? Number(req.body.businessId)
          : null,
    });
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    auditAdmin(req, "qsearch_source_add", {
      type: "qsearch_source",
      id: result.source.sourceId,
      detail: { label: result.source.label, url: result.source.url, tier: result.source.tier },
    });
    res.json({ ok: true, source: result.source });
  });

  /** Soft-disable registry/directory sources; hard-delete custom ones. */
  app.delete("/api/admin/qsearch/sources/:sourceId", requireAdmin, (req, res) => {
    const sourceId = decodeURIComponent(String(req.params.sourceId));
    const result = deleteSource(sourceId);
    if (!result.ok) {
      res.status(404).json({ error: result.error });
      return;
    }
    auditAdmin(req, "qsearch_source_delete", {
      type: "qsearch_source",
      id: sourceId,
      detail: { hard: result.hard },
    });
    res.json({ ok: true, sourceId, hard: result.hard });
  });

  /** Re-enable a soft-disabled source. */
  app.post("/api/admin/qsearch/sources/:sourceId/enable", requireAdmin, (req, res) => {
    const sourceId = decodeURIComponent(String(req.params.sourceId));
    const result = enableSource(sourceId);
    if (!result.ok) {
      res.status(404).json({ error: result.error });
      return;
    }
    auditAdmin(req, "qsearch_source_enable", { type: "qsearch_source", id: sourceId });
    res.json({ ok: true, source: result.source });
  });

  app.post("/api/admin/qsearch/sources/:sourceId/recipe", requireAdmin, (req, res) => {
    const sourceId = String(req.params.sourceId);
    const recipeUrl =
      req.body?.recipeUrl === null || req.body?.recipeUrl === ""
        ? null
        : String(req.body?.recipeUrl || "").trim() || null;
    setRecipeUrl(sourceId, recipeUrl);
    auditAdmin(req, "qsearch_recipe", { type: "qsearch_source", id: sourceId, detail: { recipeUrl } });
    res.json({ ok: true, sourceId, recipeUrl });
  });

  app.post("/api/admin/qsearch/sources/:sourceId/instagram", requireAdmin, (req, res) => {
    const sourceId = String(req.params.sourceId);
    const handle = parseInstagramHandle(req.body?.handle ?? req.body?.instagramHandle ?? null);
    setInstagramHandle(sourceId, handle);
    res.json({ ok: true, sourceId, handle });
  });

  app.post("/api/admin/qsearch/dragpdx-opt-in", requireAdmin, (req, res) => {
    const optIn = Boolean(req.body?.optIn);
    setDragpdxOptIn(optIn);
    auditAdmin(req, "qsearch_dragpdx_opt_in", { type: "qsearch", detail: { optIn } });
    res.json({ ok: true, optIn });
  });

  app.post("/api/admin/qsearch/scan", requireAdmin, (req, res) => {
    const businesses = storage.getBusinesses({}).map((b: any) => ({
      id: b.id,
      name: b.name,
      website: b.website,
      type: b.type,
      active: b.active,
    }));
    const result = startScan({
      tiers: Array.isArray(req.body?.tiers) ? req.body.tiers.map(String) : undefined,
      onlyFailing: Boolean(req.body?.onlyFailing),
      onlyDirectory: Boolean(req.body?.onlyDirectory),
      onlyNew: Boolean(req.body?.onlyNew),
      sourceIds: Array.isArray(req.body?.sourceIds) ? req.body.sourceIds.map(String) : undefined,
      kind: req.body?.kind === "nightly" ? "nightly" : "manual",
      // Default on; pass tryVision: false to skip flyer vision sampling
      tryVision: req.body?.tryVision !== false,
      // Default off - only upcoming/current listings unless explicitly included
      includePastEvents: req.body?.includePastEvents === true,
      businesses,
      existingEvents: storage.getEvents({}),
    });
    if ("error" in result) return res.status(400).json(result);
    auditAdmin(req, "qsearch_scan_start", {
      type: "qsearch",
      id: result.jobId,
      label: `Scan ${result.total} sources`,
      detail: { total: result.total },
    });
    res.json(result);
  });

  app.post("/api/admin/qsearch/scan/nightly-now", requireAdmin, (req, res) => {
    const result = triggerNightlyPriorityScan();
    if ("error" in result) return res.status(400).json(result);
    auditAdmin(req, "qsearch_nightly_manual", { type: "qsearch", id: result.jobId });
    res.json(result);
  });

  app.get("/api/admin/qsearch/scan/:jobId", requireAdmin, (req, res) => {
    const job = getScanJobView(String(req.params.jobId));
    if (!job) return res.status(404).json({ error: "Scan job not found" });
    res.json(job);
  });

  app.post("/api/admin/qsearch/scan/:jobId/cancel", requireAdmin, (req, res) => {
    const ok = cancelScan(String(req.params.jobId));
    if (!ok) return res.status(400).json({ error: "Cannot cancel" });
    res.json({ ok: true });
  });

  /**
   * Approve QSearch candidates → HIDDEN by default.
   * Body: { confirm: true, status?: HIDDEN|LIVE, items: [{ id?, draft, skip?, conflictAction?, conflictEventIds? }] }
   */
  app.post("/api/admin/qsearch/approve", requireAdmin, async (req, res) => {
    if (!req.body?.confirm) {
      return res.status(400).json({ error: "confirm: true required" });
    }
    // LIVE only if explicitly requested - still never automatic
    const status = req.body?.status === "LIVE" ? "LIVE" : "HIDDEN";
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!rawItems.length) return res.status(400).json({ error: "No items" });

    const overrides: number[] = [];
    const denySkipIds: string[] = [];
    const mergeOps: Array<{ candidateId?: string; draft: any; eventId: number }> = [];
    const items: Array<{ draft: any; skip: boolean; candidateId?: string; allowDuplicate?: boolean }> = [];
    for (const row of rawItems) {
      const action = String(row?.conflictAction || "keep_both");
      const candidateId = row?.id != null ? String(row.id) : undefined;
      const targetIds = Array.isArray(row?.conflictEventIds)
        ? row.conflictEventIds.map(Number).filter((n: number) => Number.isFinite(n))
        : [];

      if (action === "deny" || row?.skip) {
        if (candidateId) denySkipIds.push(candidateId);
        items.push({ draft: row?.draft, skip: true, candidateId });
        continue;
      }
      // Closed venues: never approve into LIVE/HIDDEN unless explicit allowClosedVenue
      if (!row?.allowClosedVenue && row?.draft) {
        const closedHit = matchClosedVenue({
          venueName: row.draft.venueName,
          address: row.draft.address,
          title: row.draft.title,
        });
        if (closedHit) {
          if (candidateId) denySkipIds.push(candidateId);
          items.push({ draft: row.draft, skip: true, candidateId });
          continue;
        }
      }
      // Merge: update the existing event in place (keep its id → keep RSVPs).
      // Handled below; NOT sent to commitIngest so no duplicate row is created.
      if (action === "merge" && targetIds.length) {
        mergeOps.push({ candidateId, draft: row?.draft, eventId: targetIds[0] });
        continue;
      }
      if (action === "override") {
        for (const id of targetIds) overrides.push(id);
      }
      // The admin explicitly resolved the conflict (keep both / override), so let
      // this draft through the duplicate filter instead of silently skipping it.
      const allowDuplicate = action === "keep_both" || action === "override";
      items.push({ draft: row?.draft, skip: false, candidateId, allowDuplicate });
    }

    for (const id of Array.from(new Set(overrides))) {
      try {
        storage.updateEventStatus(id, "HIDDEN");
      } catch {
        /* ignore */
      }
    }

    // Apply merges: patch each existing row from the newest sync, preserving id/RSVPs.
    const mergedCand: Array<{ candidateId?: string; eventId: number }> = [];
    for (const op of mergeOps) {
      try {
        const existing = storage.getEvent(op.eventId);
        if (!existing || !op.draft?.title || !op.draft?.dateStart) continue;
        storage.updateEvent(op.eventId, mergeDraftIntoEvent(existing, op.draft), { source: "sync" });
        mergedCand.push({ candidateId: op.candidateId, eventId: op.eventId });
      } catch {
        /* ignore a single bad merge */
      }
    }

    const existingEvents = storage.getEvents({});
    // When every picked candidate was a MERGE (or there is simply nothing to
    // create), skip commitIngest - an empty item list is a no-op, not an error.
    const result = items.length
      ? await commitIngest({
          items,
          status,
          // Always on for admin approve - never re-create main-board twins
          skipDuplicates: req.body?.skipDuplicates !== false,
          existingEvents,
          createEvent: (data) => storage.createEvent(data),
        })
      : {
          ok: true as const,
          created: [] as Array<{ id: number; title: string; status: string; candidateId?: string }>,
          skipped: [] as Array<{ index: number; title: string; reason: string; candidateId?: string }>,
          impact: mergedCand.length ? `Merged ${mergedCand.length}` : "Nothing to do",
        };
    if (!result.ok) return res.status(400).json({ error: result.error });

    // Resolve Review cards: created → committed; already-on-board / invalid → skipped (leave queue)
    type CandOutcome = { eventIds: number[]; boardSkip: boolean; deny: boolean };
    const byCand = new Map<string, CandOutcome>();
    const touch = (id: string | undefined): CandOutcome | null => {
      if (!id) return null;
      let o = byCand.get(id);
      if (!o) {
        o = { eventIds: [], boardSkip: false, deny: false };
        byCand.set(id, o);
      }
      return o;
    };
    for (const id of denySkipIds) {
      const o = touch(id);
      if (o) o.deny = true;
    }
    for (const c of result.created) {
      const o = touch(c.candidateId);
      if (o) o.eventIds.push(c.id);
    }
    for (const s of result.skipped) {
      const o = touch(s.candidateId);
      if (!o) continue;
      if (/Already on main board|Strong duplicate|Invalid draft/i.test(s.reason)) {
        o.boardSkip = true;
      }
    }
    const committedIds: string[] = [];
    const committedEventIds: number[] = [];
    const autoSkipIds: string[] = [];
    Array.from(byCand.entries()).forEach(([id, o]) => {
      if (o.eventIds.length) {
        committedIds.push(id);
        committedEventIds.push(o.eventIds[0]);
      } else if (o.boardSkip || o.deny) {
        autoSkipIds.push(id);
      }
    });
    // Merged candidates resolve like committed ones (clear the Review card).
    for (const m of mergedCand) {
      if (!m.candidateId) continue;
      committedIds.push(m.candidateId);
      committedEventIds.push(m.eventId);
    }
    if (committedIds.length) markCandidatesCommitted(committedIds, committedEventIds);
    if (autoSkipIds.length) markCandidatesSkipped(Array.from(new Set(autoSkipIds)));

    auditAdmin(req, "qsearch_approve", {
      type: "qsearch",
      label: result.impact,
      detail: {
        createdIds: result.created.map(c => c.id),
        skipped: result.skipped,
        overridden: overrides,
        merged: mergedCand.map(m => m.eventId),
        status,
      },
    });
    res.json({
      ...result,
      overridden: overrides,
      merged: mergedCand.map(m => m.eventId),
    });
  });

  /** Persist vision/IG drafts into the review queue (HIDDEN path via approve). */
  async function queueManualQSearchDrafts(opts: {
    drafts: import("./ingest/types").IngestEventDraft[];
    sourceId: string;
    sourceLabel: string;
    sourceUrl: string;
    kind: string;
  }) {
    const catalog = storage.getEvents({});
    const businesses = storage.getBusinesses({});
    const candidates = buildScanCandidates(
      opts.drafts.map(draft => ({
        draft,
        sourceId: opts.sourceId,
        sourceLabel: opts.sourceLabel,
        sourceUrl: opts.sourceUrl,
      })),
      catalog,
      businesses,
    );
    for (const c of candidates) {
      if (c.draft.confidence != null && c.draft.confidence < 0.55) c.selected = false;
    }
    const jobId = `${opts.kind}-${randomUUID()}`;
    const { insertScanJob } = await import("./qsearch/store");
    insertScanJob({
      id: jobId,
      status: "done",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      total: 1,
      completed: 1,
      currentSourceId: null,
      currentLabel: opts.sourceLabel,
      etaSeconds: 0,
      error: null,
      avgMs: 0,
      filterJson: JSON.stringify({ kind: opts.kind }),
      perSourceJson: "[]",
      kind: "manual",
    });
    saveCandidates(
      jobId,
      candidates.map(c => ({
        id: c.id,
        sourceId: c.sourceId,
        sourceLabel: c.sourceLabel,
        sourceUrl: c.sourceUrl,
        draft: c.draft,
        selected: c.selected,
        recurring: c.recurring,
        recurringCount: c.recurringCount,
        condensed: c.condensed,
        conflicts: c.conflicts,
        duplicates: c.duplicates,
        strongDuplicate: c.strongDuplicate,
        directoryBrands: c.directoryBrands,
      })),
    );
    return { jobId, candidates };
  }

  /** Vision flyer URL → queue candidates (HIDDEN path via approve). */
  app.post("/api/admin/qsearch/vision", requireAdmin, async (req, res) => {
    try {
      let imageUrl = String(req.body?.imageUrl || "").trim();
      if (!imageUrl) return res.status(400).json({ error: "imageUrl required" });
      const venueHint = req.body?.venueHint != null ? String(req.body.venueHint) : null;
      const sourceUrl = req.body?.sourceUrl != null ? String(req.body.sourceUrl) : imageUrl;
      let posterStoreUrl: string | null = imageUrl.startsWith("data:") ? null : imageUrl;
      // Local upload path → data URL for cloud vision API
      if (imageUrl.startsWith("/uploads/")) {
        const dataUrl = localUploadToDataUrl(imageUrl);
        if (!dataUrl) return res.status(400).json({ error: "Upload file not found" });
        posterStoreUrl = imageUrl;
        imageUrl = dataUrl;
      }
      const vis = await visionFlyerToDrafts({
        imageUrl,
        sourceUrl,
        venueHint,
        posterStoreUrl,
      });
      if (vis.error && !vis.drafts.length) {
        return res.status(400).json({ error: vis.error, model: vis.model });
      }
      const { jobId, candidates } = await queueManualQSearchDrafts({
        drafts: vis.drafts,
        sourceId: "vision-manual",
        sourceLabel: "Vision flyer",
        sourceUrl,
        kind: "vision",
      });
      auditAdmin(req, "qsearch_vision", { type: "qsearch", id: jobId, detail: { count: candidates.length } });
      res.json({ ok: true, jobId, model: vis.model, candidates, error: vis.error || null });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Vision failed" });
    }
  });

  /** Batch flyer upload → vision each file → review queue. */
  app.post(
    "/api/admin/qsearch/vision/upload",
    requireAdmin,
    upload.array("flyers", 12),
    async (req: any, res) => {
      try {
        const files = Array.isArray(req.files) ? req.files : [];
        if (!files.length) {
          return res.status(400).json({ error: "Upload 1–12 flyer images (jpg/png/webp/gif)" });
        }
        const venueHint = req.body?.venueHint != null ? String(req.body.venueHint) : null;
        const allDrafts: import("./ingest/types").IngestEventDraft[] = [];
        const errors: string[] = [];
        let model: string | null = null;
        for (const file of files) {
          const storeUrl = `/uploads/${file.filename}`;
          const dataUrl = localUploadToDataUrl(storeUrl);
          if (!dataUrl) {
            errors.push(`${file.originalname}: could not read upload`);
            continue;
          }
          const vis = await visionFlyerToDrafts({
            imageUrl: dataUrl,
            sourceUrl: storeUrl,
            venueHint,
            posterStoreUrl: storeUrl,
          });
          model = vis.model;
          if (vis.error && !vis.drafts.length) {
            errors.push(`${file.originalname}: ${vis.error}`);
            continue;
          }
          allDrafts.push(...vis.drafts);
        }
        if (!allDrafts.length) {
          return res.status(400).json({
            error: errors[0] || "No events extracted from uploads",
            errors,
            model,
          });
        }
        const { jobId, candidates } = await queueManualQSearchDrafts({
          drafts: allDrafts,
          sourceId: "vision-upload",
          sourceLabel: "Vision upload",
          sourceUrl: "upload",
          kind: "vision-upload",
        });
        auditAdmin(req, "qsearch_vision_upload", {
          type: "qsearch",
          id: jobId,
          detail: { files: files.length, drafts: allDrafts.length, errors },
        });
        res.json({
          ok: true,
          jobId,
          model,
          candidates,
          fileCount: files.length,
          draftCount: allDrafts.length,
          errors: errors.length ? errors : null,
        });
      } catch (err: any) {
        res.status(500).json({ error: err?.message || "Vision upload failed" });
      }
    },
  );

  /** Instagram assist - single URL preferred; Graph Business Discovery if creds exist. */
  app.post("/api/admin/qsearch/instagram", requireAdmin, async (req, res) => {
    try {
      const mode = String(req.body?.mode || "url");
      let result;
      if (mode === "graph") {
        result = await igGraphPull({
          handle: String(req.body?.handle || ""),
          limit: Number(req.body?.limit) || 5,
        });
      } else if (mode === "url" || req.body?.url) {
        result = await igFromUrl({
          url: String(req.body?.url || req.body?.postUrl || req.body?.imageUrl || ""),
          venueHint: req.body?.venueHint != null ? String(req.body.venueHint) : null,
        });
      } else {
        result = await igPasteAssist({
          handle: req.body?.handle,
          caption: req.body?.caption,
          imageUrl: req.body?.imageUrl,
          postUrl: req.body?.postUrl,
          venueHint: req.body?.venueHint,
        });
      }
      if (!result.ok && !result.drafts.length) {
        return res.status(400).json(result);
      }
      const sourceUrl = String(
        req.body?.url || req.body?.postUrl || req.body?.imageUrl || "instagram",
      );
      const { jobId, candidates } = await queueManualQSearchDrafts({
        drafts: result.drafts,
        sourceId: `ig-${result.handle || "url"}`,
        sourceLabel: result.handle ? `IG @${result.handle}` : "Instagram",
        sourceUrl,
        kind: "instagram",
      });
      res.json({
        ok: true,
        jobId,
        mode: result.mode,
        handle: result.handle,
        note: result.note,
        error: result.error || null,
        candidates,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "IG assist failed" });
    }
  });

  /**
   * Phase 4 ingest - preview only (no DB writes).
   * Body: { url?: string, html?: string, ics?: string, expandPaths?: boolean }
   * expandPaths (default true): if homepage is empty, try /events, format=json, Tribe REST, etc.
   */
  app.post("/api/admin/events/ingest/preview", requireAdmin, async (req, res) => {
    try {
      const url = req.body?.url != null ? String(req.body.url) : null;
      const html = req.body?.html != null ? String(req.body.html) : null;
      const ics = req.body?.ics != null ? String(req.body.ics) : null;
      const expandPaths = req.body?.expandPaths !== false;
      const existingEvents = storage.getEvents({});

      let result = await previewIngest({ url, html, ics, existingEvents });
      if (!result.ok) return res.status(400).json({ error: result.error });

      if (expandPaths && url && !html && !ics && result.events.length === 0) {
        const candidates = expandWebsiteScrapeCandidates(url).slice(1);
        const warnings = [
          ...result.warnings,
          `No events on primary URL - tried ${candidates.length} event-path candidates`,
        ];
        for (const candidate of candidates.slice(0, 6)) {
          const next = await previewIngest({ url: candidate, existingEvents });
          if (next.ok && next.events.length > 0) {
            result = {
              ...next,
              warnings: [...warnings, ...next.warnings, `Used expanded path: ${candidate}`],
              impact: `${next.impact} · via expanded path`,
            };
            break;
          }
          if (next.ok) warnings.push(...next.warnings);
        }
        if (result.events.length === 0) {
          result = { ...result, warnings: Array.from(new Set(warnings)) };
        }
      }

      res.json(result);
    } catch (err: any) {
      console.error("ingest preview failed:", err);
      res.status(500).json({ error: err?.message || "Ingest preview failed" });
    }
  });

  /**
   * Phase 4 ingest - commit after preview.
   * Body: {
   *   confirm: true,
   *   status?: "HIDDEN" | "LIVE" (default HIDDEN),
   *   skipDuplicates?: boolean (default true),
   *   events: Array<{ draft, skip?: boolean }>
   * }
   * Safety: defaults to HIDDEN; max batch; strong duplicates skipped by default.
   */
  app.post("/api/admin/events/ingest/commit", requireAdmin, async (req, res) => {
    if (!req.body?.confirm) {
      return res.status(400).json({ error: "confirm: true required - use preview first" });
    }
    const status = req.body?.status === "LIVE" ? "LIVE" : "HIDDEN";
    const skipDuplicates = req.body?.skipDuplicates !== false;
    const rawEvents = Array.isArray(req.body?.events) ? req.body.events : [];
    const items = rawEvents.map((row: any) => ({
      draft: row?.draft ?? row,
      skip: Boolean(row?.skip),
    }));
    const existingEvents = storage.getEvents({});
    const result = await commitIngest({
      items,
      status,
      skipDuplicates,
      existingEvents,
      createEvent: (data) => storage.createEvent(data),
    });
    if (!result.ok) return res.status(400).json({ error: result.error });

    auditAdmin(req, "events_ingest_commit", {
      type: "events",
      label: result.impact,
      detail: {
        status,
        createdIds: result.created.map(c => c.id),
        skipped: result.skipped.length,
      },
    });
    res.json(result);
  });

  /** Public URLs for admin "view as public" (no admin session required on the target). */
  app.get("/api/admin/preview-links", requireAdmin, (req, res) => {
    const eventId = req.query.eventId != null ? Number(req.query.eventId) : null;
    const businessId = req.query.businessId != null ? Number(req.query.businessId) : null;
    const username = req.query.username != null ? String(req.query.username) : null;
    res.json({
      links: publicPreviewLinks({ eventId, businessId, username }),
    });
  });

  app.get("/api/analytics/totals", async (_req, res) => {
    const totals = await getGoogleAnalyticsPublicTotals();
    if (!totals) {
      return res.status(503).json({ error: "Analytics totals are temporarily unavailable" });
    }
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    const members = storage.getAllUsers().filter(user => user.status === "active").length;
    return res.json({ ...totals, members });
  });

  app.get("/api/admin/metrics", requireAdmin, async (_req, res) => {
    try {
      const metrics = storage.getAdminMetrics();
      const gaTrackingEnabled = !!readGaMeasurementId();
      const gaReportingEnabled = isGoogleAnalyticsAdminConfigured();

      if (gaReportingEnabled) {
        const gaTraffic = await getGoogleAnalyticsTrafficMetrics();
        if (gaTraffic) {
          metrics.traffic = gaTraffic;
        } else {
          metrics.traffic = {
            ...metrics.traffic,
            gaTrackingEnabled,
            gaReportingEnabled,
          };
        }
      } else {
        metrics.traffic = {
          ...metrics.traffic,
          gaTrackingEnabled,
          gaReportingEnabled: false,
        };
      }

      res.json(metrics);
    } catch (err) {
      console.error("[admin/metrics]", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load admin metrics" });
    }
  });

  app.get("/api/admin/users/new-today", requireAdmin, (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!caller || !storage.hasOwnerAdminAccess(caller)) {
      return res.status(403).json({ error: "Owner admin only" });
    }
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const rows = sqlite.prepare(`
      SELECT id, username, display_name AS displayName, email, created_at AS createdAt, avatar_choice AS avatarChoice, photo_url AS photoUrl
      FROM users WHERE created_at >= ? ORDER BY created_at DESC
    `).all(todayStart.toISOString());
    res.json(rows);
  });

  app.post("/api/admin/users/purge-qa", requireAdmin, (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!isMainAdminUser(caller)) return res.status(403).json({ error: "Super admin only" });
    const result = storage.purgeQaTestUsers();
    res.json(result);
  });

  app.get("/api/admin/feedback", requireAdmin, (req, res) => {
    const user = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!user || !storage.isPrimarySiteOwner(user)) {
      return res.status(403).json({ error: "Owner only" });
    }
    const status = String(req.query.status || "").toUpperCase();
    if (status === "RESOLVED") {
      const items = storage.getOwnerDeskItems("RESOLVED")
        .filter((item) => item.resolvedAt || item.status === "RESOLVED")
        .sort((a, b) => {
          const aTs = Date.parse(a.resolvedAt || a.createdAt) || 0;
          const bTs = Date.parse(b.resolvedAt || b.createdAt) || 0;
          return bTs - aTs;
        });
      return res.json(items);
    }
    res.json(storage.getOwnerDeskItems(req.query.all === "true" ? undefined : "OPEN"));
  });

  // Consolidated backlog report: every pending admin-queue category + the
  // Owner Desk (owner only) in one printable page. ?format=json for raw data.
  app.get("/api/admin/report", requireAdmin, (req, res) => {
    const user = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!user || !storage.hasOwnerAdminAccess(user)) {
      return res.status(403).json({ error: "Owner admin only" });
    }
    // Owner desk rows only for true primary owner
    const data = buildAdminReport(storage, storage.isPrimarySiteOwner(user));
    if (String(req.query.format) === "json") return res.json(data);
    res.type("html").send(renderAdminReportHtml(data));
  });

  app.post("/api/admin/feedback/:id/resolve", requireAdmin, (req, res) => {
    const user = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!user || !storage.isPrimarySiteOwner(user)) {
      return res.status(403).json({ error: "Owner only" });
    }
    const source = String(req.body?.source || "desk") === "feedback" ? "feedback" as const : "desk" as const;
    storage.resolveOwnerDeskItem(Number(req.params.id), source);
    res.json({ ok: true });
  });

  app.get("/api/admin/owner-desk", requireAdmin, (req, res) => {
    const user = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!user || !storage.isPrimarySiteOwner(user)) {
      return res.status(403).json({ error: "Owner only" });
    }
    res.json(storage.getOwnerDeskItems());
  });

  app.post("/api/admin/owner-desk/:id/resolve", requireAdmin, (req, res) => {
    const user = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!user || !storage.isPrimarySiteOwner(user)) {
      return res.status(403).json({ error: "Owner only" });
    }
    const source = String(req.body?.source || "desk") === "feedback" ? "feedback" as const : "desk" as const;
    storage.resolveOwnerDeskItem(Number(req.params.id), source);
    res.json({ ok: true });
  });

  // PUT full event edit (admin only)
  app.put("/api/admin/events/:id", requireAdmin, async (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const allowed = [
      "title", "description", "venueName", "address", "neighborhood", "lat", "lng",
      "dateStart", "dateEnd", "dayOfWeek", "ageRequirement", "admission",
      "ticketUrl", "posterImageUrl", "eventTypes", "status",
      "isPublic", "isHouseParty", "isSexPositive", "nudityOk", "isClaimable",
      "claimedBy", "source",
    ];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (patch.eventTypes && Array.isArray(patch.eventTypes)) {
      patch.eventTypes = JSON.stringify(patch.eventTypes);
    }
    const dateErr = validateEventDates(
      patch.dateStart as string | undefined,
      patch.dateEnd as string | undefined,
      evt,
    );
    if (dateErr) return res.status(400).json({ error: dateErr });
    syncDayOfWeek(patch, evt);
    const updated = storage.updateEvent(Number(req.params.id), patch);
    if (updated && (patch.address !== undefined || patch.venueName !== undefined || patch.lat !== undefined || patch.lng !== undefined)) {
      await fillEventMapCoordinates(updated.id);
    }
    const fresh = storage.getEvent(Number(req.params.id));
    res.json(fresh ? enrichEventForMap(fresh) : fresh);
  });

  // Soft-delete: hide from public listings. Restorable via Admin → Events (status LIVE).
  app.delete("/api/admin/events/:id", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const evt = storage.getEvent(id);
    if (!evt) return res.status(404).json({ error: "Not found" });
    if (evt.status === "HIDDEN") {
      return res.json({ ok: true, id, status: "HIDDEN", alreadyHidden: true });
    }
    storage.updateEventStatus(id, "HIDDEN");
    res.json({ ok: true, id, status: "HIDDEN" });
  });

  app.patch("/api/admin/events/:id/claimable", requireAdmin, (req, res) => {
    const { isClaimable } = req.body;
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    storage.toggleClaimable(Number(req.params.id), Boolean(isClaimable));
    res.json({ ok: true });
  });

  // Assign a promoter as the event's primary host (same effect as an approved claim)
  app.post("/api/admin/events/:id/host", requireAdmin, (req, res) => {
    try {
      const evt = storage.getEvent(Number(req.params.id));
      if (!evt) return res.status(404).json({ error: "Not found" });
      const username = String(req.body.username || "").trim().replace(/^@/, "");
      if (!username) return res.status(400).json({ error: "username required" });
      const user = resolveUserByUsername(username);
      if (!user) return res.status(404).json({ error: "No account found with that username" });
      const actorId = getAdminActorUserId(req);
      storage.setPrimaryEventHost(evt.id, user.id, actorId);
      if ((user.promoterStatus || "none") !== "approved") {
        storage.setPromoterStatus(user.id, "approved");
      }
      try {
        storage.sendAsGuideAdmin(
          user.id,
          `You now host: ${evt.title}`,
          `An admin assigned you as the promoter for "${evt.title}". Open your dashboard to manage the event and post host updates.`,
          { contextType: "EVENT_CLAIM", contextId: evt.id, contextLabel: evt.title },
        );
      } catch (notifyErr) {
        console.error("[admin] assign host notify failed:", notifyErr);
      }
      const fresh = storage.getEvent(evt.id);
      res.json(fresh ? enrichEventForAdmin(fresh) : { ok: true });
    } catch (err) {
      console.error("[admin] assign host failed:", err);
      res.status(500).json({ error: "Could not assign promoter" });
    }
  });

  // Remove all hosts and return the event to the unclaimed/claimable pool
  app.delete("/api/admin/events/:id/host", requireAdmin, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    storage.unassignEventHosts(evt.id);
    const fresh = storage.getEvent(evt.id);
    res.json(fresh ? enrichEventForAdmin(fresh) : { ok: true });
  });

  // GET admin moderation requests
  app.get("/api/admin/moderation", requireAdmin, (req, res) => {
    const reqs = req.query.all === "true" ? storage.getModerationRequests() : storage.getModerationRequests("PENDING");
    res.json(reqs.map(enrichModerationForAdmin));
  });

  // POST resolve moderation request
  app.post("/api/admin/moderation/:id/resolve", requireAdmin, (req, res) => {
    const { status, adminNotes } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ error: "status must be APPROVED or REJECTED" });
    const id = Number(req.params.id);
    storage.resolveModerationRequest(id, status, adminNotes);
    auditAdmin(req, "resolve_moderation", { type: "moderation", id, detail: { status } });
    releaseAdminQueueClaim("moderation", id, getAdminActor(req).id || 0, { force: true });
    res.json({ ok: true });
  });

  app.post("/api/admin/moderation/dismiss-stale-tests", requireAdmin, (req, res) => {
    const count = storage.dismissStaleTestModerationRequests();
    res.json({ ok: true, dismissed: count });
  });

  app.get("/api/admin/gifting", requireAdmin, (req, res) => {
    res.json({
      posts: storage.getGiftingPosts({ includeInactive: true }).map(post => publicGiftingPost(post)),
      reports: storage.getGiftingReports(),
    });
  });

  app.post("/api/admin/gifting/:id/status", requireAdmin, (req, res) => {
    const status = String(req.body.status || "").trim().toUpperCase();
    if (!status) return res.status(400).json({ error: "status required" });
    storage.updateGiftingPostStatus(Number(req.params.id), status);
    res.json({ ok: true });
  });

  app.post("/api/admin/gifting/:id/reject", requireAdmin, (req, res) => {
    try {
      const { reasonCode, note } = parseBoardRejectBody(req.body);
      const id = Number(req.params.id);
      const result = storage.rejectGiftingPost(id, reasonCode, note);
      if (result.error) return res.status(400).json({ error: result.error });
      auditAdmin(req, "reject_gifting", { type: "gifting", id, detail: { reasonCode } });
      releaseAdminQueueClaim("gifting_flagged", id, getAdminActor(req).id || 0, { force: true });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/admin/gifting/reports/:id/resolve", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    storage.resolveGiftingReport(id, String(req.body.adminNotes || ""));
    auditAdmin(req, "resolve_gifting_report", { type: "gifting_report", id });
    releaseAdminQueueClaim("gifting_report", id, getAdminActor(req).id || 0, { force: true });
    res.json({ ok: true });
  });

  app.get("/api/admin/river-brats/reports", requireAdmin, (_req, res) => {
    res.json(storage.getRiverBratsReports());
  });

  app.post("/api/admin/river-brats/reports/:id/resolve", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    storage.resolveRiverBratsReport(id, String(req.body.adminNotes || ""));
    auditAdmin(req, "resolve_river_brats", { type: "river_brats", id });
    releaseAdminQueueClaim("river_brats", id, getAdminActor(req).id || 0, { force: true });
    res.json({ ok: true });
  });

  // ─── ADMIN: GIGS ────────────────────────────────────────────────────────
  app.get("/api/admin/gigs", requireAdmin, (req, res) => {
    res.json(storage.getGigPosts().map(gig => {
      const user = gig.userId ? storage.getUserById(gig.userId) : null;
      return {
        ...gig,
        username: user?.username,
        displayName: user?.displayName,
        posterPhotoUrl: user?.photoUrl ?? null,
        avatarChoice: user?.avatarChoice ?? 1,
        posterAvatarRing: user?.avatarRing || "none",
      };
    }));
  });

  app.post("/api/admin/gigs/:id/status", requireAdmin, (req, res) => {
    const status = String(req.body.status || "").trim().toUpperCase();
    if (!["LIVE", "PENDING", "REJECTED", "REMOVED"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    const id = Number(req.params.id);
    storage.adminUpdateGigStatus(id, status);
    auditAdmin(req, "gig_status", { type: "gig_pending", id, detail: { status } });
    if (status === "LIVE" || status === "REJECTED" || status === "REMOVED") {
      releaseAdminQueueClaim("gig_pending", id, getAdminActor(req).id || 0, { force: true });
    }
    res.json({ ok: true });
  });

  app.post("/api/admin/gigs/:id/reject", requireAdmin, (req, res) => {
    try {
      const { reasonCode, note } = parseBoardRejectBody(req.body);
      const id = Number(req.params.id);
      const result = storage.rejectGigPost(id, reasonCode, note);
      if (result.error) return res.status(400).json({ error: result.error });
      auditAdmin(req, "reject_gig", { type: "gig_pending", id, detail: { reasonCode } });
      releaseAdminQueueClaim("gig_pending", id, getAdminActor(req).id || 0, { force: true });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/admin/missed-connections", requireAdmin, (req, res) => {
    res.json(req.query.recent === "true"
      ? storage.getRecentlyReviewedMissedConnections()
      : storage.getAdminMissedConnections());
  });

  app.post("/api/admin/missed-connections/:id/approve", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const result = storage.approveMissedConnection(id);
    if (result.error) return res.status(404).json({ error: result.error });
    auditAdmin(req, "clear_missed_connection", { type: "missed_connection", id });
    releaseAdminQueueClaim("missed_connection", id, getAdminActor(req).id || 0, { force: true });
    res.json({ ok: true });
  });

  app.delete("/api/admin/missed-connections/:id", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const result = storage.removeMissedConnectionAdmin(id);
    if (result.error) return res.status(404).json({ error: result.error });
    auditAdmin(req, "remove_missed_connection", { type: "missed_connection", id });
    releaseAdminQueueClaim("missed_connection", id, getAdminActor(req).id || 0, { force: true });
    res.json({ ok: true });
  });

  app.post("/api/admin/missed-connections/:id/reject", requireAdmin, (req, res) => {
    try {
      const { reasonCode, note } = parseBoardRejectBody(req.body);
      const id = Number(req.params.id);
      const result = storage.rejectMissedConnection(id, reasonCode, note);
      if (result.error) return res.status(400).json({ error: result.error });
      auditAdmin(req, "reject_missed_connection", { type: "missed_connection", id, detail: { reasonCode } });
      releaseAdminQueueClaim("missed_connection", id, getAdminActor(req).id || 0, { force: true });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/admin/gigs/:id", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const patch: Record<string, unknown> = {};
    const fields = [
      "postType", "title", "name", "contactEmail", "description", "skills",
      "compensation", "location", "isRemote", "status", "gigDate", "gigTime", "imageUrl",
    ] as const;
    for (const key of fields) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (patch.postType && !["POSTING_GIG", "LOOKING_FOR_WORK"].includes(String(patch.postType))) {
      return res.status(400).json({ error: "Invalid post type" });
    }
    if (patch.status && !["LIVE", "PENDING", "REJECTED", "REMOVED"].includes(String(patch.status).toUpperCase())) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (patch.status) patch.status = String(patch.status).toUpperCase();
    const updated = storage.adminUpdateGigPost(id, patch as any);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // GET admin inbox summary (notification counts)
  app.get("/api/admin/inbox", requireAdmin, (req, res) => {
    const pendingSubs = storage.getSubmissions("PENDING").length;
    const pendingMod = storage.getModerationRequests("PENDING").length;
    const guideUnread = storage.getGuideAdminUnreadCount();
    res.json({
      pendingSubmissions: pendingSubs,
      pendingModeration: pendingMod,
      total: pendingSubs + pendingMod,
      guideUnread,
    });
  });

  // Shared guide-admin mailbox (floating inbox → Admin → Inbox / Sent).
  // Outbound rejects and admin DMs send as @prideguidepdx so replies land here for all keyholders.
  app.get("/api/admin/messages/inbox", requireAdmin, (_req, res) => {
    res.json(storage.getGuideAdminInbox());
  });

  app.get("/api/admin/messages/sent", requireAdmin, (_req, res) => {
    res.json(storage.getGuideAdminSent());
  });

  app.get("/api/admin/messages/unread-count", requireAdmin, (_req, res) => {
    res.json({ count: storage.getGuideAdminUnreadCount() });
  });

  app.get("/api/admin/messages/thread/:threadId", requireAdmin, (req, res) => {
    const guide = storage.resolveGuideAdminUser();
    if (!guide) return res.status(503).json({ error: "Guide admin identity unavailable" });
    const thread = storage.getThreadForViewer(req.params.threadId, guide.id);
    const visible = thread.some((m: any) => m.fromUserId === guide.id || m.toUserId === guide.id);
    if (!visible || thread.length === 0) return res.status(404).json({ error: "Thread not found" });
    res.json({ messages: thread, guideUserId: guide.id });
  });

  /** React on guide-admin DMs as the shared guide identity. */
  app.post("/api/admin/messages/:id/reactions", requireAdmin, (req: any, res) => {
    const guide = storage.resolveGuideAdminUser();
    if (!guide) return res.status(503).json({ error: "Guide admin identity unavailable" });
    const messageId = Number(req.params.id);
    const emoji = String(req.body?.emoji || req.body?.code || "").trim();
    if (!emoji) return res.status(400).json({ error: "emoji required" });
    const result = storage.toggleMessageReaction(messageId, guide.id, emoji);
    if (result.error) {
      const status = result.error === "Invalid reaction" ? 400 : 404;
      return res.status(status).json({ error: result.error });
    }
    res.json({ reactions: result.reactions });
  });

  app.post("/api/admin/messages/thread/:threadId/reply", requireAdmin, (req, res) => {
    const actor = getAdminActor(req);
    if (actor.id) {
      const rate = checkAdminMessageRateLimit(actor.id);
      if (!rate.ok) return res.status(429).json({ error: rate.error });
    }
    const guide = storage.resolveGuideAdminUser();
    if (!guide) return res.status(503).json({ error: "Guide admin identity unavailable" });
    const thread = storage.getThread(req.params.threadId);
    const visible = thread.some((m: any) => m.fromUserId === guide.id || m.toUserId === guide.id);
    if (!visible || thread.length === 0) return res.status(404).json({ error: "Thread not found" });
    const first = thread[0] as any;
    const last = thread[thread.length - 1] as any;
    const toUserId = last.fromUserId === guide.id ? last.toUserId : last.fromUserId;
    const body = String(req.body?.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    if (moderationGate(res, "Admin guide reply", { body })) return;
    const msg = storage.sendAsGuideAdmin(toUserId, first.subject || "Reply", body, {
      threadId: req.params.threadId,
      contextType: first.contextType || "ADMIN_MESSAGE",
      contextId: first.contextId ?? null,
      contextLabel: first.contextLabel || null,
    });
    if (!msg) return res.status(500).json({ error: "Could not send reply" });
    auditAdmin(req, "guide_reply", {
      type: "thread",
      id: req.params.threadId,
      label: first.subject || "Reply",
    });
    res.json(msg);
  });

  app.put("/api/admin/messages/:id/read", requireAdmin, (req, res) => {
    const guide = storage.resolveGuideAdminUser();
    if (!guide) return res.status(503).json({ error: "Guide admin identity unavailable" });
    const ok = storage.markReadForUser(Number(req.params.id), guide.id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  /** Compose a new message as the shared guide-admin profile (Admin MESSAGE buttons). */
  app.post("/api/admin/messages", requireAdmin, (req, res) => {
    const actor = getAdminActor(req);
    if (actor.id) {
      const rate = checkAdminMessageRateLimit(actor.id);
      if (!rate.ok) return res.status(429).json({ error: rate.error });
    }
    const username = String(req.body?.username || "").trim().replace(/^@/, "");
    const body = String(req.body?.body || "").trim();
    const subject = String(req.body?.subject || "").trim().slice(0, 120);
    if (!username) return res.status(400).json({ error: "username required" });
    if (!body) return res.status(400).json({ error: "body required" });
    const target = storage.getUserByUsername(username);
    if (!target || target.status !== "active") return res.status(404).json({ error: "User not found" });
    if (storage.isGuideAdminUserId(target.id)) {
      return res.status(400).json({ error: "Cannot message the Zaylist system identity" });
    }
    if (moderationGate(res, "Admin guide message", { subject: subject || "Admin message", body })) return;
    const msg = storage.sendAsGuideAdmin(
      target.id,
      subject || `Message from Zaylist`,
      body,
      { contextType: "ADMIN_MESSAGE" },
    );
    if (!msg) return res.status(500).json({ error: "Could not send message" });
    auditAdmin(req, "admin_message", {
      type: "user",
      id: target.id,
      label: `@${target.username}`,
      detail: { threadId: msg.threadId, subject: msg.subject },
    });
    res.json({ ok: true, message: msg });
  });

  app.post("/api/admin/messages/mark-all-read", requireAdmin, (_req, res) => {
    const cleared = storage.markGuideAdminInboxRead();
    res.json({ ok: true, cleared });
  });

  app.delete("/api/admin/messages/thread/:threadId", requireAdmin, (req, res) => {
    const threadId = decodeURIComponent(req.params.threadId || "").trim();
    if (!threadId) return res.status(400).json({ error: "Thread id required" });
    const guide = storage.resolveGuideAdminUser();
    if (!guide) return res.status(503).json({ error: "Guide admin identity unavailable" });
    const thread = storage.getThread(threadId);
    const visible = thread.some((m: any) => m.fromUserId === guide.id || m.toUserId === guide.id);
    if (!visible) return res.status(404).json({ error: "Thread not found" });
    const cleared = storage.softDeleteGuideAdminThread(threadId);
    if (cleared === 0) return res.status(404).json({ error: "Nothing to delete" });
    res.json({ ok: true, cleared });
  });

  // Owner-only Ad Manager + public serve/track
  registerAdRoutes(app, {
    db: sqlite,
    requireAdmin,
    isPrimaryOwner: (user) => storage.isPrimarySiteOwner(user),
    getUserById: (id) => storage.getUserById(id),
    uploadSingle: upload.single("asset"),
    auditAdmin,
  });

  // HAUSING - the Housing board. See docs/HAUS_ENGINEERING_HANDOFF.md
  registerHousingRoutes(app, {
    db: sqlite,
    requireAuth,
    requireAdmin,
    isPrimaryOwner: (user) => storage.isPrimarySiteOwner(user),
    getUserById: (id) => storage.getUserById(id),
    uploadPhotos: upload.array("photos", 8),
    createModerationRequest: (data) => storage.createModerationRequest(data),
    sendMessage: (from, to, subject, body, opts) => storage.sendMessage(from, to, subject, body, opts),
  });

  scheduleMapCoordinateBackfill();
  startPromptScheduler();

  // Existing events predate capture-at-ingest. Mirror their remote flyers after
  // startup; archived QSEARCH candidate rows are deliberately left untouched.
  if (process.env.NODE_ENV === "production") {
    setTimeout(() => {
      void (async () => {
        try {
          const { mirrorEventPosters } = await import("./ingest/mirrorEventPosters");
          const summary = await mirrorEventPosters({
            events: storage.getEvents({}),
            pendingCandidates: [],
            updateEventPoster: (id, url) => {
              storage.updateEvent(id, { posterImageUrl: url }, { source: "sync" });
            },
            updateCandidatePoster: () => false,
          });
          console.log(
            `[poster-mirror] checked=${summary.checked} captured=${summary.captured} retained_remote=${summary.retainedRemote}`,
          );
        } catch (error) {
          console.error("[poster-mirror] backfill failed", error);
        }
      })();
    }, 15_000);
  }
}
