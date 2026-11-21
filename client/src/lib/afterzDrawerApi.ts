import { apiRequest } from "@/lib/queryClient";
import type { AfterzWindowState } from "@shared/afterzWindow";

const gatherings = "/api/afterz/gatherings";

export type HostAfterzInput = {
  title: string;
  confirmed18: boolean;
  requestId: string;
  eventId?: number;
  occurrence?: string;
  capacity?: number;
  vibe?: string;
  poster?: string;
  glow?: boolean;
  sexPositive?: boolean;
  nudityOk?: boolean;
  audience?: "open" | "request" | "friends" | "fof";
  blastRadiusM?: number;
};

/** Agent-callable Afterz drawer actions. These hit the live gathering endpoints. */
export async function fetchAfterzWindow(): Promise<AfterzWindowState> {
  return apiRequest("GET", "/api/afterz/window").then(r => r.json());
}

export async function hostAfterz(input: HostAfterzInput): Promise<{ id: string }> {
  const response = await apiRequest("POST", gatherings, input);
  return response.json();
}

export async function rsvpAfterzYes(id: string, confirmed18 = true): Promise<unknown> {
  return apiRequest("POST", `${gatherings}/${encodeURIComponent(id)}/request`, { confirmed18 }).then(r => r.json());
}

export async function rsvpAfterzNo(id: string): Promise<unknown> {
  return apiRequest("POST", `${gatherings}/${encodeURIComponent(id)}/leave`).then(r => r.json());
}

export async function blastAfterz(id: string, blastRadiusM?: number): Promise<{ ok: true; audience: string; blastRadiusM: number }> {
  return apiRequest("POST", `${gatherings}/${encodeURIComponent(id)}/blast`, blastRadiusM != null ? { blastRadiusM } : {}).then(r => r.json());
}

export function afterzDrawerApi() {
  return { fetchAfterzWindow, hostAfterz, rsvpAfterzYes, rsvpAfterzNo, blastAfterz };
}

export { gatherings as AFTERZ_GATHERINGS_PATH };
