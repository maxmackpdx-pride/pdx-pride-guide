import fs from "fs";
import path from "path";

export interface PersistenceSurface {
  id: string;
  label: string;
  tables: string[];
  uploadRoutes?: string[];
  apiRoutes: string[];
}

/** Every place user content or settings are saved server-side. */
export const PERSISTENCE_SURFACES: PersistenceSurface[] = [
  {
    id: "profile",
    label: "Profile settings & avatars",
    tables: ["users"],
    uploadRoutes: ["/api/upload/avatar"],
    apiRoutes: ["PUT /api/users/me", "POST /api/upload/avatar"],
  },
  {
    id: "inbox",
    label: "Inbox & mail threads",
    tables: ["messages"],
    apiRoutes: [
      "GET /api/inbox",
      "GET /api/inbox/sent",
      "POST /api/inbox/:threadId/reply",
      "DELETE /api/inbox/:threadId",
    ],
  },
  {
    id: "event_submissions",
    label: "Event submit & approval queue",
    tables: ["submissions", "events"],
    uploadRoutes: ["/api/upload/poster"],
    apiRoutes: [
      "POST /api/submit",
      "POST /api/admin/submissions/:id/approve",
      "POST /api/admin/submissions/:id/reject",
    ],
  },
  {
    id: "event_board",
    label: "Claimed event edits & host messages",
    tables: ["events", "host_messages", "event_hosts"],
    uploadRoutes: ["/api/upload/poster"],
    apiRoutes: [
      "PUT /api/events/:id/edit",
      "GET /api/events/:id/host-messages",
      "POST /api/events/:id/host-messages",
      "GET /api/events/:id/hosts",
      "POST /api/events/:id/hosts",
    ],
  },
  {
    id: "gig_board",
    label: "Pride Work gig board",
    tables: ["gig_posts"],
    apiRoutes: [
      "POST /api/gigs",
      "GET /api/gigs/mine",
      "PUT /api/gigs/:id",
      "DELETE /api/gigs/:id",
      "DELETE /api/gifting/:id",
    ],
  },
  {
    id: "gifting",
    label: "Gifting board & interests",
    tables: ["gifting_posts", "gifting_interests", "gifting_reports"],
    uploadRoutes: ["/api/upload/gifting"],
    apiRoutes: [
      "POST /api/gifting",
      "POST /api/gifting/:id/interest",
      "POST /api/gifting/:id/choose/:interestId",
    ],
  },
  {
    id: "check_ins",
    label: "Event check-ins (I'll be there)",
    tables: ["attendances"],
    apiRoutes: ["POST /api/events/:id/attendance", "DELETE /api/events/:id/attendance/:attId"],
  },
  {
    id: "missed_connections",
    label: "Missed connections",
    tables: ["missed_connections"],
    apiRoutes: [
      "POST /api/missed-connections",
      "PUT /api/missed-connections/:id",
      "DELETE /api/missed-connections/:id",
    ],
  },
  {
    id: "promoter",
    label: "Promoter claim & approval",
    tables: ["users", "submissions"],
    apiRoutes: [
      "POST /api/submit (CLAIM)",
      "POST /api/admin/promoter-requests/:userId/approve",
      "POST /api/admin/promoter-requests/:userId/deny",
    ],
  },
  {
    id: "moderation",
    label: "Moderation requests",
    tables: ["moderation_requests"],
    apiRoutes: ["POST /api/moderation-request", "POST /api/admin/moderation/:id/resolve"],
  },
  {
    id: "feedback",
    label: "Site feedback reports",
    tables: ["feedback_reports"],
    apiRoutes: ["POST /api/feedback"],
  },
  {
    id: "sessions",
    label: "Login sessions",
    tables: ["express_sessions"],
    apiRoutes: ["POST /api/auth/login", "GET /api/auth/google/callback"],
  },
];

export interface PersistenceConfig {
  databasePath: string;
  uploadsDir: string;
  sessionStore: "sqlite" | "memory";
  production: boolean;
  databaseOnVolume: boolean;
  uploadsOnVolume: boolean;
  uploadsDirWritable: boolean;
  warnings: string[];
  errors: string[];
}

export function getPersistenceConfig(): PersistenceConfig {
  const databasePath = path.resolve(process.env.DATABASE_PATH || "data.db");
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"));
  const production = process.env.NODE_ENV === "production";
  const warnings: string[] = [];
  const errors: string[] = [];

  const databaseOnVolume = databasePath.startsWith("/data");
  const uploadsOnVolume = uploadsDir.startsWith("/data");

  let uploadsDirWritable = false;
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    uploadsDirWritable = true;
  } catch {
    errors.push(`Uploads directory is not writable: ${uploadsDir}`);
  }

  if (production && !databaseOnVolume) {
    errors.push(
      `DATABASE_PATH must point to /data in production (got ${databasePath}). User data will reset on every deploy.`,
    );
  }
  if (production && !uploadsOnVolume) {
    errors.push(
      `UPLOADS_DIR must point to /data/uploads in production (got ${uploadsDir}). Uploaded photos will reset on every deploy.`,
    );
  }
  if (!production && !databaseOnVolume) {
    warnings.push(`DATABASE_PATH is local dev path: ${databasePath}`);
  }
  if (!production && !uploadsOnVolume) {
    warnings.push(`UPLOADS_DIR is local dev path: ${uploadsDir}`);
  }

  return {
    databasePath,
    uploadsDir,
    sessionStore: "sqlite",
    production,
    databaseOnVolume,
    uploadsOnVolume,
    uploadsDirWritable,
    warnings,
    errors,
  };
}

const INSECURE_DEFAULTS: Record<string, string> = {
  SESSION_SECRET: "pdxpride_secret_2026",
  ADMIN_PASSWORD: "pdx_pride_admin_2026",
};

export function assertProductionSecrets() {
  if (process.env.NODE_ENV !== "production" || process.env.LOCAL_PREVIEW === "1") return;
  const missing: string[] = [];
  const insecure: string[] = [];
  for (const [key, defaultValue] of Object.entries(INSECURE_DEFAULTS)) {
    const value = process.env[key];
    if (!value) missing.push(key);
    else if (value === defaultValue) insecure.push(key);
  }
  if (missing.length || insecure.length) {
    const parts = [
      ...missing.map(k => `${k} is not set`),
      ...insecure.map(k => `${k} is still the repository default`),
    ];
    console.error(`[secrets] FATAL — Production secrets misconfigured: ${parts.join("; ")}`);
    process.exit(1);
  }
}

export function assertProductionPersistence() {
  const config = getPersistenceConfig();
  if (!config.production || process.env.LOCAL_PREVIEW === "1") return config;
  if (config.errors.length) {
    console.error("[persistence] FATAL — user data will not survive deploys:");
    config.errors.forEach((err) => console.error(`  - ${err}`));
    throw new Error("Production persistence misconfigured");
  }
  console.log(
    `[persistence] OK — db=${config.databasePath} uploads=${config.uploadsDir} sessions=sqlite`,
  );
  return config;
}

export function getPersistenceAudit(counts: Record<string, number>) {
  const config = getPersistenceConfig();
  return {
    ok: config.errors.length === 0,
    config,
    surfaces: PERSISTENCE_SURFACES.map((surface) => ({
      ...surface,
      rowCounts: Object.fromEntries(
        surface.tables.map((table) => [table, counts[table] ?? 0]),
      ),
    })),
    clientOnly: [
      {
        id: "soft_launch_popup",
        label: "Soft-launch welcome dismissed",
        storage: "localStorage (browser only — not server data)",
        key: "softLaunchWelcomeDismissed",
      },
    ],
  };
}