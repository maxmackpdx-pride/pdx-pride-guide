import { createContext, useContext, useState, useEffect, useRef, Fragment, ReactNode } from "react";
import { syncPushSubscriptionWithServer } from "@/lib/pushNotifications";

import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { endSession, replaceAccountCache, resolveSession } from "@/lib/authSession";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  avatarChoice: number;
  avatarRing?: string | null;
  avatarCrop?: string | null;
  bio: string | null;
  photoUrl: string | null;
  coverImageUrl?: string | null;
  coverCrop?: string | null;
  /** Account calm mode; null when the member has never chosen. */
  calmMode?: boolean | null;
  googleLinked: boolean;
  promoterStatus?: "none" | "pending" | "approved" | "rejected";
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isPrimaryOwner?: boolean;
  canManageTeam?: boolean;
  canViewUsers?: boolean;
  canPush?: boolean;
  canManageCatalog?: boolean;
  subAdmin?: boolean;
  usernameChangedAt?: string | null;
  communityStandardsVersion?: string | null;
  communityStandardsAgreedAt?: string | null;
  communityStandardsDeclinedAt?: string | null;
  accountStatus?: string | null;
  suspendReasonCode?: string | null;
  suspendReasonLabel?: string | null;
  suspendNote?: string | null;
  suspendUntil?: string | null;
  suspendedAt?: string | null;
}

export type RegisterOptions = {
  agreedToCommunityStandards?: boolean;
  communityStandardsVersion?: string;
};

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    displayName?: string,
    options?: RegisterOptions,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const identity = useRef<number | null>(null);
  const refreshVersion = useRef(0);

  const applyUser = (next: AuthUser | null) => {
    if (identity.current !== null && identity.current !== (next?.id ?? null)) {
      try { sessionStorage.removeItem(`zay-profile-draft:${identity.current}`); } catch { /* Storage can be disabled. */ }
    }
    replaceAccountCache(queryClient, identity.current, next?.id ?? null);
    identity.current = next?.id ?? null;
    setUser(next);
  };

  const refreshUser = async () => {
    const version = ++refreshVersion.current;
    try {
      // Transient failures (a 503 during a restart, a dropped connection)
      // retry with backoff instead of settling into a signed-out state;
      // only a 401 confirms the session is gone.
      const resolution = await resolveSession<AuthUser>(fetch, {
        shouldContinue: () => version === refreshVersion.current,
      });
      if (version !== refreshVersion.current) return;
      if (resolution.kind === "user") {
        applyUser(resolution.user);
        void syncPushSubscriptionWithServer();
      } else if (resolution.kind === "anonymous") {
        applyUser(null);
      }
      // "unknown": the current identity stands — a transient failure does
      // not mean the session ended.
    } finally {
      if (version === refreshVersion.current) setLoading(false);
    }
  };

  useEffect(() => { void refreshUser().catch(() => {}); }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(data?.error || "Login failed");
    }
    const next: AuthUser = await res.json();
    ++refreshVersion.current;
    applyUser(next);
    setLoading(false);
    void syncPushSubscriptionWithServer();
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    displayName?: string,
    options?: RegisterOptions,
  ) => {
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username,
        email,
        password,
        displayName,
        agreedToCommunityStandards: options?.agreedToCommunityStandards === true,
        communityStandardsVersion: options?.communityStandardsVersion,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(data?.error || "Registration failed");
    }
    const next: AuthUser = await res.json();
    ++refreshVersion.current;
    applyUser(next);
    setLoading(false);
    void syncPushSubscriptionWithServer();
  };

  const logout = async () => {
    try {
      await endSession();
      ++refreshVersion.current;
      applyUser(null);
    } catch (error) {
      toast({ title: "Could not sign out", description: "Sign-out could not be confirmed. Please try again.", variant: "destructive" });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      <Fragment key={user?.id ?? "anonymous"}>{children}</Fragment>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Presentation bridge for canonical object hosts; server authorization remains in domain APIs. */
export function AuthPresentationProvider({value,children}:{value:AuthContextType;children:ReactNode}){return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;}
