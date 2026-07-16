/**
 * Local demo helpers — chrome visible on localhost / Vite without a session
 * so Hub, profile, and floating inbox can be reviewed as a guest.
 */
import type { AuthUser } from "@/context/AuthContext";

/** Public profile used for local demo navigation. */
export const LOCAL_DEMO_PROFILE_USERNAME = "tucker_pdmax";
export const LOCAL_DEMO_PROFILE_PATH = `/u/${LOCAL_DEMO_PROFILE_USERNAME}`;

export function isLocalDemoHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h.endsWith(".local")
  );
}

/** Vite dev server or explicit local host. */
export function isLocalDemo(): boolean {
  try {
    if (import.meta.env.DEV) return true;
  } catch {
    /* ignore */
  }
  return isLocalDemoHost();
}

/**
 * Guest shell user for Hub chrome only (not a real session).
 * Mutations still require sign-in; this just unlocks the layout.
 */
export function getLocalDemoHubUser(): AuthUser {
  return {
    id: -1,
    username: LOCAL_DEMO_PROFILE_USERNAME,
    email: "local-demo@localhost",
    displayName: "Tucker_PDmAX",
    avatarChoice: 1,
    avatarRing: "none",
    avatarCrop: null,
    bio: "Local demo shell — sign in for your real hub.",
    photoUrl: null,
    coverImageUrl: null,
    coverCrop: null,
    googleLinked: false,
    promoterStatus: "approved",
    isAdmin: true,
    isSuperAdmin: true,
    isPrimaryOwner: true,
    canManageTeam: true,
    canViewUsers: true,
    canPush: false,
    canManageCatalog: true,
    subAdmin: false,
  };
}
