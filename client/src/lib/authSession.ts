import type { QueryClient } from "@tanstack/react-query";

/** Clear both settled data and in-flight queries before publishing a new identity. */
export function replaceAccountCache(client: QueryClient, previous: number | null, next: number | null) {
  if (previous !== next) client.clear();
}

export async function endSession(request: typeof fetch = fetch) {
  const response = await request("/api/auth/logout", { method: "POST", credentials: "include" });
  if (!response.ok) throw new Error("Logout failed");
}

export type SessionResolution<SessionUser> =
  | { kind: "user"; user: SessionUser }
  | { kind: "anonymous" }
  | { kind: "unknown" };

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Resolve the current session, retrying transient failures with backoff.
 * A null session or a 401 confirms a sign-out. Transient failures leave the
 * identity unresolved, so a server restart cannot clear an existing account.
 */
export async function resolveSession<SessionUser>(
  request: typeof fetch = fetch,
  options: {
    delaysMs?: number[];
    sleep?: (ms: number) => Promise<void>;
    shouldContinue?: () => boolean;
  } = {},
): Promise<SessionResolution<SessionUser>> {
  const delays = options.delaysMs ?? [500, 1500, 3500];
  const sleep = options.sleep ?? wait;
  const shouldContinue = options.shouldContinue ?? (() => true);
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await request("/api/auth/session", { credentials: "include", cache: "no-store" });
      if (res.ok) {
        const user = (await res.json()) as SessionUser | null;
        return user === null ? { kind: "anonymous" } : { kind: "user", user };
      }
      if (res.status === 401) return { kind: "anonymous" };
    } catch {
      // A network failure is transient until the bounded retries run out.
    }
    if (attempt >= delays.length || !shouldContinue()) return { kind: "unknown" };
    await sleep(delays[attempt]);
    if (!shouldContinue()) return { kind: "unknown" };
  }
}
