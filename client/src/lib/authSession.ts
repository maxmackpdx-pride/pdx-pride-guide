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
 * Only a 401 proves the visitor is signed out. Any other failure — a 503
 * while the server restarts, a dropped connection — leaves the session
 * "unknown", so a still-valid cookie is never mistaken for a sign-out and
 * settled into a signed-out UI with no way back short of a reload.
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
      const res = await request("/api/auth/me", { credentials: "include" });
      if (res.ok) return { kind: "user", user: (await res.json()) as SessionUser };
      if (res.status === 401) return { kind: "anonymous" };
    } catch {
      // A network failure is transient until the bounded retries run out.
    }
    if (attempt >= delays.length || !shouldContinue()) return { kind: "unknown" };
    await sleep(delays[attempt]);
    if (!shouldContinue()) return { kind: "unknown" };
  }
}
