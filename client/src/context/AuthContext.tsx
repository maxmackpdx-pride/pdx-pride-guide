import { createContext, useContext, useState, useEffect, useRef, Fragment, ReactNode } from "react";
import { syncPushSubscriptionWithServer } from "@/lib/pushNotifications";

import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { endSession, replaceAccountCache } from "@/lib/authSession";

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

interface AuthContextType {
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
    replaceAccountCache(queryClient, identity.current, next?.id ?? null);
    identity.current = next?.id ?? null;
    setUser(next);
  };

  const refreshUser = async () => {
    const version = ++refreshVersion.current;
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const next = await res.json();
        if (version !== refreshVersion.current) return;
        applyUser(next);
        void syncPushSubscriptionWithServer();
      } else if (res.status === 401 && version === refreshVersion.current) {
        applyUser(null);
      }
    } catch {
      // A transient request failure does not mean the session ended.
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
