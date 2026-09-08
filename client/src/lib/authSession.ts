import type { QueryClient } from "@tanstack/react-query";

/** Clear both settled data and in-flight queries before publishing a new identity. */
export function replaceAccountCache(client: QueryClient, previous: number | null, next: number | null) {
  if (previous !== next) client.clear();
}

export async function endSession(request: typeof fetch = fetch) {
  const response = await request("/api/auth/logout", { method: "POST", credentials: "include" });
  if (!response.ok) throw new Error("Logout failed");
}
