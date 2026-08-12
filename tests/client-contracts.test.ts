import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, getQueryFn, parseApiError } from "../client/src/lib/queryClient";

describe("critical client/API contracts", () => {
  afterEach(() => vi.restoreAllMocks());

  it("extracts safe API error messages and uses a fallback for status-only errors", () => {
    expect(parseApiError(new Error('400: {"error":"Username taken"}'), "Try again")).toBe("Username taken");
    expect(parseApiError(new Error("500: Internal Server Error"), "Try again")).toBe("Try again");
  });

  it("always includes credentials on API mutations", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await apiRequest("POST", "/api/events/1/attendance", { visibility: "friends" });
    expect(fetchMock).toHaveBeenCalledWith("/api/events/1/attendance", expect.objectContaining({ credentials: "include" }));
  });

  it("can turn an expected 401 into a signed-out null state", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 401 }));
    const query = getQueryFn<unknown>({ on401: "returnNull" });
    await expect(query({ queryKey: ["/api/auth/me"] } as never)).resolves.toBeNull();
  });
});
