export type AccessUser = {
  status?: string | null;
  suspendReasonLabel?: string | null;
  suspendUntil?: string | null;
};

export type AuthAccessDecision =
  | { allowed: true }
  | {
      allowed: false;
      status: 401 | 403;
      body: {
        error: string;
        suspended?: true;
        suspendReasonLabel?: string | null;
        suspendUntil?: string | null;
      };
    };

const SUSPENDED_ACCOUNT_ALLOWED_PATHS = [
  "/auth/me",
  "/auth/logout",
  "/auth/suspension-appeal",
  "/auth/community-standards",
];

export function authenticatedRequestAccess(input: {
  sessionUserId?: number | null;
  user?: AccessUser | null;
  method?: string | null;
  path?: string | null;
}): AuthAccessDecision {
  if (!input.sessionUserId || !input.user || input.user.status === "deleted") {
    return { allowed: false, status: 401, body: { error: "Not authenticated" } };
  }

  if (input.user.status !== "suspended") return { allowed: true };

  const path = String(input.path || "");
  const method = String(input.method || "GET").toUpperCase();
  const isAllowedPath = SUSPENDED_ACCOUNT_ALLOWED_PATHS.some((allowed) => path.includes(allowed));
  if (method === "GET" || isAllowedPath) return { allowed: true };

  return {
    allowed: false,
    status: 403,
    body: {
      error: "Account suspended",
      suspended: true,
      suspendReasonLabel: input.user.suspendReasonLabel || null,
      suspendUntil: input.user.suspendUntil || null,
    },
  };
}
