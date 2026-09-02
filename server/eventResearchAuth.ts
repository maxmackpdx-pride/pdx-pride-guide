import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

export const EVENT_RESEARCH_AGENT_NAME = "qsearch-2";
export const EVENT_RESEARCH_TOKEN_ENV = "QSEARCH_AGENT_TOKEN";

function bearerToken(raw: unknown): string {
  const value = String(raw || "").trim();
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function constantTimeTokenMatch(candidate: string, expected: string): boolean {
  const left = createHash("sha256").update(candidate).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

/**
 * Dedicated machine authentication for QSearch 2.0.
 *
 * The credential is accepted only by event-research routes. It never turns a
 * request into a site-admin session and is never accepted from a URL/query.
 */
export function isEventResearchAgentRequest(req: {
  get?: (name: string) => string | undefined;
  headers?: Record<string, unknown>;
}): boolean {
  const expected = String(process.env[EVENT_RESEARCH_TOKEN_ENV] || "").trim();
  if (expected.length < 32) return false;
  const raw = req.get?.("authorization") ?? req.headers?.authorization;
  const candidate = bearerToken(raw);
  if (!candidate) return false;
  return constantTimeTokenMatch(candidate, expected);
}

export function allowAdminOrEventResearchAgent(
  requireAdmin: RequestHandler,
): RequestHandler {
  return (req: any, res, next) => {
    if (isEventResearchAgentRequest(req)) {
      req.eventResearchAgent = EVENT_RESEARCH_AGENT_NAME;
      res.setHeader("Cache-Control", "no-store");
      return next();
    }
    return requireAdmin(req, res, next);
  };
}

export function eventResearchActor(req: any): string | null {
  return req?.eventResearchAgent === EVENT_RESEARCH_AGENT_NAME
    ? EVENT_RESEARCH_AGENT_NAME
    : null;
}
