import "dotenv/config";
import express, { Response, NextFunction } from 'express';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { Request } from 'express';
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "node:http";
import { platform } from "node:os";

const app = express();
const httpServer = createServer(app);

// Railway terminates TLS at the edge; required for secure session cookies.
app.set("trust proxy", 1);

// Canonical host: everything that is not www.zaylist.com → https://www.zaylist.com
// (apex zaylist, legacy prideguidepdx / pdxpg brands). Preserve path + query.
const CANONICAL_HOST = "www.zaylist.com";
const REDIRECT_HOSTS = new Set([
  "zaylist.com",
  "prideguidepdx.com",
  "www.prideguidepdx.com",
  "pdxpg.com",
  "www.pdxpg.com",
  "pdxprideguide.com",
  "www.pdxprideguide.com",
]);
app.use((req, res, next) => {
  const host = (req.headers.host || "").split(":")[0].toLowerCase();
  if (REDIRECT_HOSTS.has(host)) {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }
  next();
});

// Password-reset URLs contain single-use secrets; never leak them through referrers.
app.use("/reset-password", (_req, res, next) => {
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Short, shareable branded links → full destinations. 302 (temporary) so a
// target can be changed or retired later without browsers caching it forever.
// Add a slug here and it becomes zaylist.com/<slug>.
const SHORT_LINKS: Record<string, string> = {
  stank: "/events/7/stank-x-yes-coach-pride-weekend?day=SAT",
};
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const slug = req.path.toLowerCase().replace(/^\/+|\/+$/g, "");
  const dest = SHORT_LINKS[slug];
  if (dest) return res.redirect(302, dest);
  next();
});

// Retired public paths → canonical boards. 301 so crawlers and old links
// collapse. Do not rewrite static files under /hausing/demo.
const PATH_ALIASES: Record<string, string> = {
  "/gigs": "/pride-work",
  "/missed-connections": "/spotted",
  "/access-safety": "/access",
  "/darkroom": "/next",
  "/hausing": "/the-hauz",
  "/housing": "/the-hauz",
};
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const raw = (req.path || "/").split("?")[0] || "/";
  const path = raw.replace(/\/+$/, "") || "/";
  const lower = path.toLowerCase();
  if (lower.startsWith("/hausing/demo") || lower.startsWith("/housing/demo")) return next();

  const qsIndex = (req.originalUrl || "").indexOf("?");
  const qs = qsIndex >= 0 ? req.originalUrl.slice(qsIndex) : "";

  if (lower === "/nude-beaches") {
    const tab = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : "").get("tab");
    const dest = tab === "sauvie-island" || tab === "sauvie" ? "/z/out/sauvie-island" : "/z/out/rooster-rock";
    return res.redirect(301, dest);
  }

  const exact = PATH_ALIASES[lower];
  if (exact) return res.redirect(301, exact + qs);

  const nested = lower.match(/^\/(hausing|housing)\/(.+)$/);
  if (nested) return res.redirect(301, `/the-hauz/${nested[2]}${qs}`);

  next();
});

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting (skipped for local dev + preview:local smoke so repeated runs do not 429)
const rateLimitSkipDev = () =>
  process.env.NODE_ENV === "development" || process.env.LOCAL_PREVIEW === "1";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: rateLimitSkipDev,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts. Try again in a few minutes." },
  skip: rateLimitSkipDev,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
const passwordResetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reset requests. Please try again later." },
});
app.use("/api/auth/password/forgot", passwordResetRequestLimiter);
app.use("/api/auth/password/reset", authLimiter);
app.use("/api/promoter/login", authLimiter);
app.use("/api/admin/login", authLimiter);
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages sent. Try again in a few minutes." },
  skip: rateLimitSkipDev,
});
app.use("/api/contact/message", contactLimiter);
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many analytics events." },
  skip: rateLimitSkipDev,
});
app.use("/api/analytics/pageview", analyticsLimiter);
app.use("/api/analytics/product-event", analyticsLimiter);
const adsTrackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many ad events." },
  skip: rateLimitSkipDev,
});
app.use("/api/ads", adsTrackLimiter);
// Admin JSON routes rely on requireAdmin session checks; avoid a separate strict
// cap - the dashboard issues 8+ parallel reads on load (inbox, metrics, gigs, etc.).
app.use("/api", limiter);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && process.env.NODE_ENV !== "production") {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Unknown /api/* must return JSON, never the SPA HTML shell.
  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // PORT env wins. In local dev on macOS, 5000 is often taken by AirPlay Receiver.
  const devDefaultPort = platform() === "darwin" ? "5050" : "5000";
  let listenPort = parseInt(process.env.PORT || devDefaultPort, 10);
  const maxPort = listenPort + 8;

  const tryListen = () => {
    const listenOpts: { port: number; host: string; reusePort?: boolean } = {
      port: listenPort,
      host: "0.0.0.0",
    };
    if (platform() === "linux") listenOpts.reusePort = true;

    httpServer.once("error", (err: NodeJS.ErrnoException) => {
      if (
        err.code === "EADDRINUSE"
        && process.env.NODE_ENV === "development"
        && !process.env.PORT
        && listenPort < maxPort
      ) {
        listenPort += 1;
        log(`port ${listenPort - 1} in use, trying ${listenPort}…`);
        tryListen();
        return;
      }
      throw err;
    });

    httpServer.listen(listenOpts, () => {
      log(`serving on port ${listenPort}`);
      // After cross-venue contamination clear (boot migration), re-pull Sanctuary
      // flyers from real event pages so nights are not left on day placeholders.
      void import("./ingest/crossVenueContaminationRepair")
        .then(async ({ reenrichSanctuaryContaminatedFlyers }) => {
          const { storage } = await import("./storage");
          const result = await reenrichSanctuaryContaminatedFlyers(storage, {
            concurrency: 3,
            limit: 80,
          });
          if (result.attempted > 0) {
            log(
              `sanctuary flyer re-enrich: attempted=${result.attempted} fixed=${result.fixed} failed=${result.failed}`,
            );
          }
        })
        .catch(err => {
          log(`sanctuary flyer re-enrich skipped: ${err?.message || err}`);
        });
    });
  };

  tryListen();
})();
