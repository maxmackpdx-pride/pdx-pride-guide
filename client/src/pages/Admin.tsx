import { useEffect, useMemo, useState } from "react";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, parseApiError } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BoardLoadingState from "@/components/BoardLoadingState";
import UsernameAutocomplete from "@/components/UsernameAutocomplete";
import {
  Shield, CheckCircle, XCircle, Eye, EyeOff, Lock,
  ToggleLeft, ToggleRight, Pencil, X, Inbox, Briefcase, Users, UserCircle, Search, RefreshCw,
} from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import AdminMetricsPanel from "@/components/dashboard/AdminMetricsPanel";
import AdminLoadError from "@/components/admin/AdminLoadError";
import AdminInbox from "@/components/admin/AdminInbox";
import AdminUserIdentity, { type AdminUserProfile } from "@/components/admin/AdminUserIdentity";
import { isMissingEventFlyer, eventPosterSrc } from "@/lib/eventPoster";
import "@/components/dashboard/dashboard.css";

interface Submission {
  id: number;
  type: string;
  eventId: number | null;
  title: string;
  description: string;
  venueName: string;
  address: string | null;
  neighborhood: string | null;
  dayOfWeek: string | null;
  dateStart: string;
  dateEnd: string;
  submitterName: string;
  submitterEmail: string;
  submitterOrg: string | null;
  claimReason: string | null;
  status: string;
  approvals: string;
  adminNotes: string | null;
  createdAt: string;
  submitterProfile?: AdminUserProfile | null;
}

interface AdminEvent {
  id: number;
  title: string;
  description: string;
  venueName: string;
  address: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  dayOfWeek: string;
  dateStart: string;
  dateEnd: string;
  ageRequirement: string;
  admission: string;
  ticketUrl: string | null;
  posterImageUrl: string | null;
  isClaimable: boolean;
  isHouseParty: boolean;
  isPrivate: boolean;
  isSexPositive: boolean;
  nudityOk: boolean;
  status: string;
  source: string;
  submittedBy: string | null;
  claimedBy: string | null;
  submittedByProfile?: AdminUserProfile | null;
  claimedByProfile?: AdminUserProfile | null;
}

interface ModerationRequest {
  id: number;
  type: "CLAIM" | "REMOVE";
  eventId: number;
  eventTitle?: string;
  proof: string;
  requesterEmail: string;
  requesterName: string;
  status: string;
  createdAt: string;
  adminNotes?: string;
}

interface PromoterRequest extends AdminUserProfile {
  id: number;
  eventId: number | null;
  eventTitle: string | null;
  claimReason: string | null;
  submitterOrg: string | null;
  requestedAt: string;
  promoterStatus?: string;
}

interface TalentRequest extends AdminUserProfile {
  id: number;
  eventId: number;
  eventTitle: string;
  role: string;
  createdAt: string;
}

interface AdminGig {
  id: number;
  postType: "POSTING_GIG" | "LOOKING_FOR_WORK";
  title: string;
  name: string;
  contactEmail: string;
  description: string;
  skills: string | null;
  compensation: string | null;
  location: string | null;
  isRemote: boolean;
  status: string;
  createdAt: string;
  username?: string;
  displayName?: string | null;
  posterPhotoUrl?: string | null;
  avatarChoice?: number;
  posterAvatarRing?: string | null;
}

interface AdminUser extends AdminUserProfile {
  promoterStatus: string;
  subAdmin: boolean;
  googleLinked: boolean;
  status: string;
  createdAt: string;
  isOwner: boolean;
}

type AdminTab = "inbox" | "events" | "gigs" | "promoters" | "users" | "team";
type EventStatusFilter = "all" | "LIVE" | "HIDDEN" | "missing_flyer" | "user_submitted" | "has_checkins";

interface SiteAdminMember extends AdminUserProfile {
  userId: number;
  source: "env" | "granted";
  protected: boolean;
  grantedAt: string;
  grantedByUsername: string | null;
  note: string | null;
}

const SITE_ADMIN_GIG_TITLE = "Site Admins Needed: PDX Pride Guide";
const SITE_ADMIN_GIG_OWNER = "tucker_pdmax";
const adminFieldClass = "w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400";

export default function Admin() {
  usePageSeo("Admin — PDX Pride Guide", "Site administration panel.");
  const { toast } = useToast();
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminName, setAdminName] = useState("Admin1");
  const [activeTab, setActiveTab] = useState<AdminTab>("inbox");
  const [expandedInboxKey, setExpandedInboxKey] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [modNote, setModNote] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminEvent>>({});
  const [editingGigId, setEditingGigId] = useState<number | null>(null);
  const [gigEditForm, setGigEditForm] = useState<Partial<AdminGig>>({});
  const [eventSearch, setEventSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState<EventStatusFilter>("all");
  const [teamIdentifier, setTeamIdentifier] = useState("");
  const [teamNote, setTeamNote] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userSearchQ, setUserSearchQ] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<Array<AdminUserProfile & { id: number; promoterStatus: string | null; subAdmin: boolean }>>([]);
  const [userSearching, setUserSearching] = useState(false);
  const [allUsersFilter, setAllUsersFilter] = useState("");

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    const bootstrapAdmin = async () => {
      if (user?.isAdmin) {
        if (!cancelled) {
          setAuthenticated(true);
          if (user.displayName || user.username) setAdminName(user.displayName || user.username);
          if (user.isSuperAdmin) setIsSuperAdmin(true);
        }
        if (!cancelled) setSessionReady(true);
        return;
      }

      try {
        const res = await fetch("/api/admin/me", { credentials: "include" });
        const data = res.ok ? await res.json() : null;
        if (!cancelled && data?.isAdmin) {
          setAuthenticated(true);
          if (data.username) setAdminName(data.username);
          if (data.isSuperAdmin) setIsSuperAdmin(true);
        }
      } catch {
        // fall through to legacy login gate
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    };

    bootstrapAdmin();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (!authenticated) return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    const allowed: AdminTab[] = ["inbox", "events", "gigs", "promoters", "users", "team"];
    if (tab && allowed.includes(tab as AdminTab)) {
      setActiveTab(tab as AdminTab);
    }
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/promoter-requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/talent-requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/gifting"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/gigs"] });
  }, [authenticated]);

  const purgeQaMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/users/purge-qa", {}),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
      toast({
        title: "QA accounts purged",
        description: data.deleted
          ? `Removed ${data.deleted}: ${(data.usernames || []).join(", ")}`
          : "No QA test accounts found.",
      });
    },
    onError: (err: unknown) => {
      toast({
        title: "Purge failed",
        description: parseApiError(err, "Could not purge QA accounts."),
        variant: "destructive",
      });
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest("POST", "/api/admin/login", { username, password });
      const data = await res.json();
      setAuthenticated(true);
      if (data?.username) setAdminName(data.username);
      setPasswordError(false);
    } catch {
      setPasswordError(true);
    }
  };

  const invalidateInboxQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/promoter-requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/talent-requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/gifting"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
  };

  const { data: submissions = [], isLoading: subLoading, isError: subError, refetch: refetchSubs } = useQuery<Submission[]>({
    queryKey: ["/api/admin/submissions", "all"],
    queryFn: () => apiRequest("GET", "/api/admin/submissions?all=true").then(r => r.json()),
    enabled: authenticated,
  });

  const { data: events = [], isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } = useQuery<AdminEvent[]>({
    queryKey: ["/api/admin/events"],
    enabled: authenticated && activeTab === "events",
  });

  const { data: attendanceSummaries = {} } = useQuery<Record<string, { count: number }>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    enabled: authenticated && activeTab === "events",
    staleTime: 60_000,
  });

  const { data: modRequests = [], isLoading: modLoading, isError: modError, refetch: refetchMod } = useQuery<ModerationRequest[]>({
    queryKey: ["/api/admin/moderation", "all"],
    queryFn: () => apiRequest("GET", "/api/admin/moderation?all=true").then(r => r.json()),
    enabled: authenticated,
  });

  const { data: gigs = [], isLoading: gigsLoading, isError: gigsError, refetch: refetchGigs } = useQuery<AdminGig[]>({
    queryKey: ["/api/admin/gigs"],
    enabled: authenticated,
  });

  const { data: giftingAdmin = { posts: [], reports: [] }, isLoading: giftingLoading, isError: giftingError, refetch: refetchGifting } = useQuery<any>({
    queryKey: ["/api/admin/gifting"],
    enabled: authenticated,
  });

  const { data: feedback = [], isLoading: feedbackLoading, isError: feedbackError, refetch: refetchFeedback } = useQuery<any[]>({
    queryKey: ["/api/admin/feedback", "all"],
    queryFn: () => apiRequest("GET", "/api/admin/feedback?all=true").then(r => r.json()),
    enabled: authenticated,
  });

  const { data: promoterRequests = [], isLoading: promotersLoading, isError: promotersError, refetch: refetchPromoters } = useQuery<PromoterRequest[]>({
    queryKey: ["/api/admin/promoter-requests"],
    queryFn: () => apiRequest("GET", "/api/admin/promoter-requests").then(r => r.json()),
    enabled: authenticated,
  });

  const { data: talentRequests = [], isLoading: talentLoading, isError: talentError, refetch: refetchTalent } = useQuery<TalentRequest[]>({
    queryKey: ["/api/admin/talent-requests"],
    queryFn: () => apiRequest("GET", "/api/admin/talent-requests").then(r => r.json()),
    enabled: authenticated,
  });

  const { data: teamAdmins = [], isLoading: teamLoading, isError: teamError, refetch: refetchTeam } = useQuery<SiteAdminMember[]>({
    queryKey: ["/api/admin/team"],
    queryFn: () => apiRequest("GET", "/api/admin/team").then(r => r.json()),
    enabled: authenticated,
  });

  const { data: adminMetrics } = useQuery<{ users: number }>({
    queryKey: ["/api/admin/metrics"],
    queryFn: () => apiRequest("GET", "/api/admin/metrics").then(r => r.json()),
    enabled: authenticated,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: newUsersToday = [] } = useQuery<{ id: number; username: string; displayName: string | null; email: string; createdAt: string; photoUrl: string | null }[]>({
    queryKey: ["/api/admin/users/new-today"],
    queryFn: () => apiRequest("GET", "/api/admin/users/new-today").then(r => r.json()),
    enabled: authenticated && activeTab === "users",
    staleTime: 60_000,
  });

  const { data: allUsers = [], isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users").then(r => r.json()),
    enabled: authenticated,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const filteredAllUsers = useMemo(() => {
    const q = allUsersFilter.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(u =>
      u.username.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || (u.displayName || "").toLowerCase().includes(q)
    );
  }, [allUsers, allUsersFilter]);

  const approveMutation = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiRequest("POST", `/api/admin/submissions/${id}/approve`, { adminName }),
    onSuccess: () => {
      invalidateInboxQueries();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/unclaimed"] });
      toast({ title: "Approved", description: "Submission approved successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Could not approve submission.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest("POST", `/api/admin/submissions/${id}/reject`, { adminName, reason }),
    onSuccess: (_, { id }) => {
      invalidateInboxQueries();
      setRejectReasons(prev => ({ ...prev, [id]: "" }));
      toast({ title: "Rejected", description: "Submission rejected." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not reject submission.", variant: "destructive" });
    },
  });

  const claimableMutation = useMutation({
    mutationFn: ({ id, isClaimable }: { id: number; isClaimable: boolean }) =>
      apiRequest("PATCH", `/api/admin/events/${id}/claimable`, { isClaimable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Updated", description: "Claimable status updated." });
    },
  });

  const editEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminEvent> }) =>
      apiRequest("PUT", `/api/admin/events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEditingId(null);
      setEditForm({});
      toast({ title: "Event updated", description: "Changes are live." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
    },
  });

  const resolveModerationMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: "approve" | "reject"; note?: string }) =>
      apiRequest("POST", `/api/admin/moderation/${id}/resolve`, {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        adminNotes: note,
        adminName,
      }),
    onSuccess: (_, { action }) => {
      invalidateInboxQueries();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: action === "approve" ? "Request Approved" : "Request Rejected" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not resolve request.", variant: "destructive" });
    },
  });

  const dismissStaleTestsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/moderation/dismiss-stale-tests", {}),
    onSuccess: async (res) => {
      const data = await res.json();
      invalidateInboxQueries();
      toast({ title: "Stale test requests dismissed", description: `${data.dismissed ?? 0} item(s) cleared.` });
    },
    onError: () => toast({ title: "Could not dismiss test requests", variant: "destructive" }),
  });

  const editGigMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminGig> }) =>
      apiRequest("PUT", `/api/admin/gigs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gigs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      setEditingGigId(null);
      setGigEditForm({});
      toast({ title: "Gig post updated", description: "Changes are live on Pride Werk." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save gig post.", variant: "destructive" });
    },
  });

  const updateGiftingStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("POST", `/api/admin/gifting/${id}/status`, { status }),
    onSuccess: () => {
      invalidateInboxQueries();
      queryClient.invalidateQueries({ queryKey: ["/api/gifting"] });
      toast({ title: "Gifting post updated" });
    },
  });

  const resolveGiftingReportMutation = useMutation({
    mutationFn: ({ id, adminNotes }: { id: number; adminNotes?: string }) =>
      apiRequest("POST", `/api/admin/gifting/reports/${id}/resolve`, { adminNotes }),
    onSuccess: () => {
      invalidateInboxQueries();
      toast({ title: "Report resolved" });
    },
  });

  const resolveFeedbackMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/feedback/${id}/resolve`, {}),
    onSuccess: () => {
      invalidateInboxQueries();
      toast({ title: "Feedback resolved" });
    },
  });

  const approvePromoterMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", `/api/admin/promoter-requests/${userId}/approve`, {}),
    onSuccess: () => {
      invalidateInboxQueries();
      toast({ title: "Promoter approved", description: "User can now submit new events." });
    },
    onError: () => toast({ title: "Error", description: "Could not approve promoter.", variant: "destructive" }),
  });

  const denyPromoterMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", `/api/admin/promoter-requests/${userId}/deny`, {}),
    onSuccess: () => {
      invalidateInboxQueries();
      toast({ title: "Promoter denied" });
    },
    onError: () => toast({ title: "Error", description: "Could not deny promoter.", variant: "destructive" }),
  });

  const approveTalentMutation = useMutation({
    mutationFn: (talentId: number) => apiRequest("POST", `/api/admin/talent-requests/${talentId}/approve`, {}),
    onSuccess: () => {
      invalidateInboxQueries();
      toast({ title: "Talent approved", description: "Lineup tag is now live." });
    },
    onError: () => toast({ title: "Error", description: "Could not approve talent.", variant: "destructive" }),
  });

  const denyTalentMutation = useMutation({
    mutationFn: (talentId: number) => apiRequest("POST", `/api/admin/talent-requests/${talentId}/reject`, {}),
    onSuccess: () => {
      invalidateInboxQueries();
      toast({ title: "Talent request denied" });
    },
    onError: () => toast({ title: "Error", description: "Could not deny talent.", variant: "destructive" }),
  });

  const grantAdminMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/team", { identifier: teamIdentifier.trim(), note: teamNote.trim() || undefined }),
    onSuccess: async () => {
      setTeamIdentifier("");
      setTeamNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      toast({ title: "Site admin added", description: "They can open /admin while logged into their site account." });
    },
    onError: (err: unknown) => {
      toast({
        title: "Error",
        description: parseApiError(err, "Could not add site admin."),
        variant: "destructive",
      });
    },
  });

  const setPromoterStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: string }) =>
      apiRequest("POST", `/api/admin/users/${userId}/set-promoter-status`, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promoter-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUserSearchResults(prev => prev.map(u => u.id === vars.userId ? { ...u, promoterStatus: vars.status } : u));
      toast({ title: `Status set to ${vars.status}` });
    },
    onError: () => toast({ title: "Error", description: "Could not update status.", variant: "destructive" }),
  });

  const [fixUsernameTarget, setFixUsernameTarget] = useState<{ id: number; current: string } | null>(null);
  const [fixUsernameValue, setFixUsernameValue] = useState("");
  const setUsernameMutation = useMutation({
    mutationFn: ({ userId, username }: { userId: number; username: string }) =>
      apiRequest("POST", `/api/admin/users/${userId}/set-username`, { username }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUserSearchResults(prev => prev.map(u => u.id === vars.userId ? { ...u, username: vars.username } : u));
      setFixUsernameTarget(null);
      setFixUsernameValue("");
      toast({ title: "Username updated", description: `Set to @${vars.username}` });
    },
    onError: () => toast({ title: "Error", description: "Could not update username.", variant: "destructive" }),
  });

  const setSubAdminMutation = useMutation({
    mutationFn: ({ userId, grant }: { userId: number; grant: boolean }) =>
      apiRequest("POST", `/api/admin/users/${userId}/set-sub-admin`, { grant }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUserSearchResults(prev => prev.map(u => u.id === vars.userId ? { ...u, subAdmin: vars.grant } : u));
      toast({ title: vars.grant ? "Sub-admin granted" : "Sub-admin revoked" });
    },
    onError: () => toast({ title: "Error", description: "Could not update sub-admin status.", variant: "destructive" }),
  });

  async function handleUserSearch() {
    if (!userSearchQ.trim()) return;
    setUserSearching(true);
    try {
      const r = await apiRequest("GET", `/api/admin/users/search?q=${encodeURIComponent(userSearchQ)}`);
      setUserSearchResults(await r.json());
    } finally {
      setUserSearching(false);
    }
  }

  const revokeAdminMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("DELETE", `/api/admin/team/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      toast({ title: "Site admin removed" });
    },
    onError: (err: unknown) => {
      toast({
        title: "Error",
        description: parseApiError(err, "Could not remove site admin."),
        variant: "destructive",
      });
    },
  });

  const startEdit = (ev: AdminEvent) => {
    setEditingId(ev.id);
    setEditForm({ ...ev });
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    editEventMutation.mutate({ id: editingId, data: editForm });
  };

  const startGigEdit = (gig: AdminGig) => {
    setEditingGigId(gig.id);
    setGigEditForm({ ...gig });
  };

  const handleGigEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGigId) return;
    editGigMutation.mutate({ id: editingGigId, data: gigEditForm });
  };

  if (authLoading || !sessionReady) {
    return (
      <div className="dash-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
        <BoardLoadingState label="Loading admin" />
      </div>
    );
  }

  // Legacy password gate — only when not already signed in as a site admin
  if (!authenticated) {
    if (user) {
      return (
        <div className="dash-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
          <div className="w-full max-w-sm" style={{ background: "#0d0d0d", border: "2px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: 32, textAlign: "center" }}>
            <h1 className="dash-anton dash-admin-title">Admin access needed</h1>
            <p className="dash-mono" style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 12, textTransform: "none", letterSpacing: "0.04em" }}>
              You&apos;re signed in as @{user.username}, but this account doesn&apos;t have admin access.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="dash-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
        <div className="w-full max-w-sm" style={{ background: "#0d0d0d", border: "2px solid #C8FA3C", borderRadius: 16, padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Lock size={28} style={{ color: "#C8FA3C", margin: "0 auto 16px" }} />
            <h1 className="dash-anton dash-admin-title">Admin</h1>
            <p className="dash-mono" style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 6 }}>PDX Pride Guide</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="dash-mono" style={{ fontSize: 10, color: "var(--dash-muted)", display: "block", marginBottom: 8 }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", background: "#000", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 14 }}
                placeholder="Username"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="dash-mono" style={{ fontSize: 10, color: "#C8FA3C", display: "block", marginBottom: 8 }}>Approval signature</label>
              <input
                type="text"
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 14 }}
                placeholder="Tucker"
              />
              <p className="dash-mono" style={{ fontSize: 9, color: "var(--dash-muted)", marginTop: 6 }}>Shown on approvals — not your login username</p>
            </div>
            <div>
              <label className="dash-mono" style={{ fontSize: 10, color: "#C8FA3C", display: "block", marginBottom: 8 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPasswordError(false); }}
                  style={{
                    width: "100%", padding: "10px 36px 10px 12px", background: "rgba(0,0,0,0.4)",
                    border: passwordError ? "1px solid #FF2400" : "1px solid rgba(255,255,255,0.2)",
                    color: "#fff", fontSize: 14,
                  }}
                  placeholder="Password"
                />
                <button
                  type="button"
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {passwordError && <p style={{ color: "#FF2400", fontSize: 12, marginTop: 4 }}>Incorrect password</p>}
            </div>
            <button type="submit" className="dash-btn dash-btn-lime active" style={{ width: "100%", marginTop: 8 }}>
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendingSubs = submissions.filter(s => s.status.toUpperCase() === "PENDING");
  const pendingMod = modRequests.filter(r => r.status.toUpperCase() === "PENDING");
  const pendingGifting = (giftingAdmin.posts || []).filter((p: any) => p.status === "PENDING");
  const pendingGiftingReports = (giftingAdmin.reports || []).filter((r: any) => r.status === "PENDING");
  const openFeedback = feedback.filter((item: any) => item.status === "OPEN");
  const pendingPromoters = promoterRequests;
  const pendingTalent = talentRequests;
  const totalActionItems =
    pendingSubs.length
    + pendingMod.length
    + pendingPromoters.length
    + pendingTalent.length
    + pendingGifting.length
    + pendingGiftingReports.length
    + openFeedback.length;

  const renderPromoterControls = (u: Pick<AdminUser, "id" | "promoterStatus" | "subAdmin" | "isOwner">) => {
    if (u.isOwner) return null;
    if (!u.promoterStatus || u.promoterStatus === "none") return null;
    return (
      <div className="flex gap-2 flex-wrap">
        {u.promoterStatus !== "approved" && (
          <button type="button" onClick={() => setPromoterStatusMutation.mutate({ userId: u.id, status: "approved" })}
            className="display text-xs px-3 py-1 border" style={{ borderColor: "#CCFF00", color: "#CCFF00" }}>APPROVE</button>
        )}
        {u.promoterStatus !== "pending" && (
          <button type="button" onClick={() => setPromoterStatusMutation.mutate({ userId: u.id, status: "pending" })}
            className="display text-xs px-3 py-1 border" style={{ borderColor: "#00FFFF", color: "#00FFFF" }}>SET PENDING</button>
        )}
        {u.promoterStatus !== "none" && (
          <button type="button" onClick={() => setPromoterStatusMutation.mutate({ userId: u.id, status: "none" })}
            className="display text-xs px-3 py-1 border border-white/30 text-white/40">RESET</button>
        )}
        {isSuperAdmin && (
          <button type="button" onClick={() => setSubAdminMutation.mutate({ userId: u.id, grant: !u.subAdmin })}
            className="display text-xs px-3 py-1 border"
            style={{ borderColor: "#FF00CC", color: u.subAdmin ? "#FF00CC" : "#FF00CC88" }}>
            {u.subAdmin ? "REVOKE SUB-ADMIN" : "GRANT SUB-ADMIN"}
          </button>
        )}
      </div>
    );
  };

  const inboxLoading =
    subLoading || modLoading || giftingLoading || feedbackLoading || promotersLoading || talentLoading;
  const inboxError =
    subError || modError || giftingError || feedbackError || promotersError || talentError;
  const refetchInbox = () => {
    refetchSubs();
    refetchMod();
    refetchGifting();
    refetchFeedback();
    refetchPromoters();
    refetchTalent();
  };

  const refreshAdminData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
    refetchInbox();
    refetchUsers();
    refetchEvents();
    refetchGigs();
    refetchTeam();
  };

  const setAdminTab = (tab: AdminTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  const userCount = adminMetrics?.users ?? allUsers.length;
  const eventSearchQuery = eventSearch.trim().toLowerCase();
  const missingFlyerCount = events.filter(ev => isMissingEventFlyer(ev.posterImageUrl)).length;
  const userSubmittedCount = events.filter(ev => ev.source === "user_submitted").length;
  const filteredEvents = events.filter(ev => {
    if (eventStatusFilter === "LIVE" && ev.status !== "LIVE") return false;
    if (eventStatusFilter === "HIDDEN" && ev.status !== "HIDDEN") return false;
    if (eventStatusFilter === "missing_flyer" && !isMissingEventFlyer(ev.posterImageUrl)) return false;
    if (eventStatusFilter === "user_submitted" && ev.source !== "user_submitted") return false;
    if (eventStatusFilter === "has_checkins" && !((attendanceSummaries[ev.id] ?? attendanceSummaries[String(ev.id)])?.count > 0)) return false;
    if (!eventSearchQuery) return true;
    const haystack = `${ev.title} ${ev.venueName} ${ev.dayOfWeek} ${ev.status} ${ev.neighborhood || ""}`.toLowerCase();
    return haystack.includes(eventSearchQuery);
  });
  const inboxActionPending =
    approveMutation.isPending
    || rejectMutation.isPending
    || resolveModerationMutation.isPending
    || dismissStaleTestsMutation.isPending
    || approvePromoterMutation.isPending
    || denyPromoterMutation.isPending
    || approveTalentMutation.isPending
    || denyTalentMutation.isPending
    || updateGiftingStatusMutation.isPending
    || resolveGiftingReportMutation.isPending
    || resolveFeedbackMutation.isPending;

  return (
    <div className="dash-page">
      <div className="dash-inner" style={{ maxWidth: 1100 }}>
        <header className="dash-admin-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Shield size={22} style={{ color: "#C8FA3C" }} />
            <div>
              <h1 className="dash-admin-title dash-anton">Admin dashboard</h1>
              <p className="dash-subtitle">Signed in as {adminName}</p>
            </div>
          </div>
          <div className="dash-actions">
            {totalActionItems > 0 && (
              <span className="dash-chip" style={{ color: "#FF1FA0" }}>{totalActionItems} action items</span>
            )}
            <button
              type="button"
              className="dash-btn dash-btn-ghost"
              onClick={refreshAdminData}
            >
              <RefreshCw size={12} style={{ marginRight: 6 }} />
              Refresh all
            </button>
            <button
              type="button"
              className="dash-btn dash-btn-ghost"
              onClick={async () => { await logout(); navigate("/"); }}
            >
              Log out
            </button>
          </div>
        </header>

        <AdminMetricsPanel
          enabled={authenticated}
          onMetricClick={(tab, metricKey) => {
            setAdminTab(tab as AdminTab);
            if (metricKey === "userSubmittedEvents") setEventStatusFilter("user_submitted");
            if (metricKey === "attendances") setEventStatusFilter("has_checkins");
            if (metricKey === "newUsersToday") setTimeout(() => document.getElementById("new-users-today")?.scrollIntoView({ behavior: "smooth" }), 100);
          }}
        />

        <div className="dash-admin-tabs">
          {([
            { key: "inbox" as AdminTab, label: `Inbox${totalActionItems > 0 ? ` (${totalActionItems})` : ""}`, icon: <Inbox size={12} /> },
            { key: "users" as AdminTab, label: `All users (${userCount})`, icon: <UserCircle size={12} /> },
            { key: "events" as AdminTab, label: "Manage events", icon: <Shield size={12} /> },
            { key: "gigs" as AdminTab, label: `Pride Werk (${gigs.length})`, icon: <Briefcase size={12} /> },
            { key: "promoters" as AdminTab, label: "Promoters", icon: <Users size={12} /> },
            { key: "team" as AdminTab, label: `Team (${teamAdmins.length})`, icon: <Users size={12} /> },
          ]).map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setAdminTab(tab.key)}
              className={`dash-admin-tab ${activeTab === tab.key ? "active" : ""}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── INBOX ── */}
        {activeTab === "inbox" && (
          <AdminInbox
            submissions={submissions}
            promoterRequests={promoterRequests}
            talentRequests={talentRequests}
            modRequests={modRequests}
            giftingPosts={giftingAdmin.posts || []}
            giftingReports={giftingAdmin.reports || []}
            feedback={feedback}
            loading={inboxLoading}
            error={inboxError}
            onRetry={refetchInbox}
            expandedKey={expandedInboxKey}
            onToggleExpand={setExpandedInboxKey}
            rejectReasons={rejectReasons}
            onRejectReasonChange={(id, val) => setRejectReasons(prev => ({ ...prev, [id]: val }))}
            modNotes={modNote}
            onModNoteChange={(id, val) => setModNote(prev => ({ ...prev, [id]: val }))}
            onApproveSubmission={id => approveMutation.mutate({ id })}
            onRejectSubmission={(id, reason) => rejectMutation.mutate({ id, reason })}
            onApprovePromoter={id => approvePromoterMutation.mutate(id)}
            onDenyPromoter={id => denyPromoterMutation.mutate(id)}
            onApproveTalent={id => approveTalentMutation.mutate(id)}
            onDenyTalent={id => denyTalentMutation.mutate(id)}
            onResolveModeration={(id, action, note) => resolveModerationMutation.mutate({ id, action, note })}
            onDismissStaleTests={() => dismissStaleTestsMutation.mutate()}
            onGiftingStatus={(id, status) => updateGiftingStatusMutation.mutate({ id, status })}
            onResolveGiftingReport={id => resolveGiftingReportMutation.mutate({ id })}
            onResolveFeedback={id => resolveFeedbackMutation.mutate(id)}
            actionPending={inboxActionPending}
          />
        )}

        {/* ── MANAGE EVENTS ── */}
        {activeTab === "events" && (
          <div>
            <p className="text-white/40 text-sm mb-4">
              Edit any field on any event. Changes go live immediately.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  type="search"
                  value={eventSearch}
                  onChange={e => setEventSearch(e.target.value)}
                  placeholder="Search title, venue, day, status..."
                  className={adminFieldClass}
                  style={{ paddingLeft: 34 }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {([
                { key: "all" as EventStatusFilter, label: "All" },
                { key: "LIVE" as EventStatusFilter, label: "Live" },
                { key: "HIDDEN" as EventStatusFilter, label: "Hidden" },
                { key: "missing_flyer" as EventStatusFilter, label: `No flyer${missingFlyerCount > 0 ? ` (${missingFlyerCount})` : ""}` },
                { key: "user_submitted" as EventStatusFilter, label: `User submitted${userSubmittedCount > 0 ? ` (${userSubmittedCount})` : ""}` },
                { key: "has_checkins" as EventStatusFilter, label: `Has check-ins` },
              ]).map(filter => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setEventStatusFilter(filter.key)}
                  className={`dash-admin-tab ${eventStatusFilter === filter.key ? "active" : ""}`}
                  style={{
                    borderBottom: eventStatusFilter === filter.key ? "2px solid #C8FA3C" : "2px solid transparent",
                    marginBottom: 0,
                    padding: "8px 12px",
                    fontSize: 10,
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {eventsError ? (
              <AdminLoadError label="events" onRetry={() => refetchEvents()} />
            ) : eventsLoading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse border border-white/10" />)}</div>
            ) : events.length === 0 ? (
              <p className="text-white/30 text-center py-12">No events found.</p>
            ) : filteredEvents.length === 0 ? (
              <p className="text-white/30 text-center py-12">No events match the current search and filters.</p>
            ) : (
              <div className="space-y-2">
                {(eventSearchQuery || eventStatusFilter !== "all") && (
                  <p className="text-white/35 text-xs mb-2">{filteredEvents.length} of {events.length} events</p>
                )}
                {filteredEvents.map(ev => {
                  const posterSrc = eventPosterSrc(ev.posterImageUrl);
                  const checkInCount = (attendanceSummaries[ev.id] ?? attendanceSummaries[String(ev.id)])?.count ?? 0;
                  return (
                  <div key={ev.id} className="border border-white/10" style={{ background: "#111" }}>
                    {/* Row */}
                    <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="flex-shrink-0 border border-white/15 bg-black/50 overflow-hidden"
                          style={{ width: 48, height: 64 }}
                        >
                          {posterSrc ? (
                            <img src={posterSrc} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/25 text-[9px] uppercase tracking-wide px-1 text-center">
                              No flyer
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                        <p className="display text-base text-white truncate">{ev.title}</p>
                        <p className="text-white/40 text-xs mt-0.5">
                          {ev.venueName} · {ev.dayOfWeek} · {new Date(ev.dateStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                        {isMissingEventFlyer(ev.posterImageUrl) && (
                          <p className="text-white/35 text-[10px] mt-1 uppercase tracking-wide">Missing flyer</p>
                        )}
                        {ev.source === "user_submitted" && (
                          <p className="text-[#00FFFF]/80 text-[10px] mt-1 uppercase tracking-wide">Community submitted</p>
                        )}
                        {checkInCount > 0 && (
                          <p className="text-[#C8FA3C]/80 text-[10px] mt-1 uppercase tracking-wide">{checkInCount} check-in{checkInCount === 1 ? "" : "s"}</p>
                        )}
                        {(ev.submittedByProfile || ev.claimedByProfile) && (
                          <div className="mt-2 space-y-1">
                            {ev.submittedByProfile && (
                              <AdminUserIdentity profile={ev.submittedByProfile} size={28} />
                            )}
                            {ev.claimedByProfile && (
                              <div className="flex items-center gap-2">
                                <span className="text-white/30 text-[10px] uppercase tracking-wide">Host</span>
                                <AdminUserIdentity profile={ev.claimedByProfile} size={28} />
                              </div>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="sticker text-xs" style={{ color: ev.status === "LIVE" ? "#CCFF00" : "#666", borderColor: ev.status === "LIVE" ? "#CCFF00" : "#333" }}>
                          {ev.status}
                        </span>
                        {ev.source === "user_submitted" && (
                          <span className="sticker text-xs" style={{ color: "#00FFFF", borderColor: "#00FFFF" }}>
                            COMMUNITY
                          </span>
                        )}
                        <button
                          onClick={() => claimableMutation.mutate({ id: ev.id, isClaimable: !ev.isClaimable })}
                          className="flex items-center gap-1 text-sm transition-all"
                          style={{ color: ev.isClaimable ? "#CCFF00" : "#444" }}
                        >
                          {ev.isClaimable ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          <span className="display text-xs">{ev.isClaimable ? "CLAIMABLE" : "CLAIM OFF"}</span>
                        </button>
                        <button
                          onClick={() => editingId === ev.id ? setEditingId(null) : startEdit(ev)}
                          className="flex items-center gap-1 display text-xs px-3 py-1 border transition-all"
                          style={{
                            borderColor: editingId === ev.id ? "#00FFFF" : "#333",
                            color: editingId === ev.id ? "#00FFFF" : "#666",
                            background: "transparent",
                          }}
                        >
                          {editingId === ev.id ? <><X size={11} /> CANCEL</> : <><Pencil size={11} /> EDIT</>}
                        </button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {editingId === ev.id && (
                      <form onSubmit={handleEditSave} className="border-t border-white/10 p-5 space-y-4" style={{ background: "#0d0d0d" }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">TITLE</label>
                            <input value={editForm.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">VENUE NAME</label>
                            <input value={editForm.venueName || ""} onChange={e => setEditForm(f => ({ ...f, venueName: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="display text-xs text-white/40 block mb-1">ADDRESS</label>
                            <input value={editForm.address || ""} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">NEIGHBORHOOD</label>
                            <input value={editForm.neighborhood || ""} onChange={e => setEditForm(f => ({ ...f, neighborhood: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">DAY</label>
                            <select value={editForm.dayOfWeek || ""} onChange={e => setEditForm(f => ({ ...f, dayOfWeek: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400">
                              {["THU","FRI","SAT","SUN"].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">START TIME</label>
                            <input type="datetime-local" value={editForm.dateStart?.slice(0,16) || ""}
                              onChange={e => setEditForm(f => ({ ...f, dateStart: e.target.value + ":00" }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">END TIME</label>
                            <input type="datetime-local" value={editForm.dateEnd?.slice(0,16) || ""}
                              onChange={e => setEditForm(f => ({ ...f, dateEnd: e.target.value + ":00" }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">ADMISSION</label>
                            <select value={editForm.admission || "FREE"} onChange={e => setEditForm(f => ({ ...f, admission: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400">
                              {["FREE","TICKETED","DONATION","TBD"].map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">AGE REQUIREMENT</label>
                            <select value={editForm.ageRequirement || "ALL_AGES"} onChange={e => setEditForm(f => ({ ...f, ageRequirement: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400">
                              {["ALL_AGES","18_PLUS","21_PLUS"].map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">TICKET URL</label>
                            <input value={editForm.ticketUrl || ""} onChange={e => setEditForm(f => ({ ...f, ticketUrl: e.target.value || null }))}
                              placeholder="https://..." className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="display text-xs text-white/40 block mb-1">EVENT FLYER / POSTER</label>
                            <ImageUploader
                              key={`poster-${editingId}`}
                              endpoint="/api/admin/upload/poster"
                              fieldName="poster"
                              currentUrl={editForm.posterImageUrl || ""}
                              onUploaded={url => setEditForm(f => ({ ...f, posterImageUrl: url || null }))}
                              label="UPLOAD FLYER"
                            />
                            {editForm.posterImageUrl && (
                              <p className="text-white/35 text-xs mt-2 break-all">{editForm.posterImageUrl}</p>
                            )}
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">STATUS</label>
                            <select value={editForm.status || "LIVE"} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400">
                              {["LIVE","HIDDEN","CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">LAT / LNG</label>
                            <div className="flex gap-2">
                              <input type="number" step="any" value={editForm.lat ?? ""} onChange={e => setEditForm(f => ({ ...f, lat: Number(e.target.value) }))}
                                placeholder="45.52..." className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                              <input type="number" step="any" value={editForm.lng ?? ""} onChange={e => setEditForm(f => ({ ...f, lng: Number(e.target.value) }))}
                                placeholder="-122.67..." className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400" />
                            </div>
                          </div>
                          <div className="flex gap-6 items-center">
                            <label className="display text-xs text-white/40 flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={!!editForm.isSexPositive} onChange={e => setEditForm(f => ({ ...f, isSexPositive: e.target.checked }))} />
                              SEX POSITIVE
                            </label>
                            <label className="display text-xs text-white/40 flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={!!editForm.nudityOk} onChange={e => setEditForm(f => ({ ...f, nudityOk: e.target.checked }))} />
                              NUDITY OK
                            </label>
                          </div>
                          <div className="md:col-span-2">
                            <label className="display text-xs text-white/40 block mb-1">DESCRIPTION</label>
                            <textarea rows={3} value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                              className="w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400 resize-y" />
                          </div>
                        </div>
                        <div className="flex gap-3 flex-wrap pt-2">
                          <button type="submit" disabled={editEventMutation.isPending}
                            className="display text-sm px-6 py-2 border-2 disabled:opacity-50"
                            style={{ background: "#CCFF00", borderColor: "#CCFF00", color: "#000" }}>
                            {editEventMutation.isPending ? "SAVING..." : "SAVE CHANGES"}
                          </button>
                          <button type="button" onClick={() => setEditingId(null)}
                            className="display text-sm px-6 py-2 border"
                            style={{ borderColor: "#333", color: "#666", background: "transparent" }}>
                            CANCEL
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );})}
              </div>
            )}
          </div>
        )}

        {/* ── PRIDE WERK / GIGS ── */}
        {activeTab === "gigs" && (
          <div>
            <p className="text-white/40 text-sm mb-6">
              Edit gig board posts — including your site admin volunteer listing. Changes go live immediately and are not overwritten on server restart.
            </p>
            {gigsError ? (
              <AdminLoadError label="gig posts" onRetry={() => refetchGigs()} />
            ) : gigsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse border border-white/10" />)}</div>
            ) : gigs.length === 0 ? (
              <p className="text-white/30 text-center py-12">No gig posts yet.</p>
            ) : (
              <div className="space-y-2">
                {gigs.map(gig => (
                  <div key={gig.id} className="border border-white/10" style={{ background: "#111" }}>
                    <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        {gig.username && (
                          <AdminUserIdentity
                            profile={{
                              username: gig.username,
                              displayName: gig.displayName,
                              photoUrl: gig.posterPhotoUrl,
                              avatarChoice: gig.avatarChoice,
                              avatarRing: gig.posterAvatarRing,
                              email: gig.contactEmail,
                            }}
                            showEmail
                            size={36}
                            className="mb-2"
                          />
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="display text-base text-white truncate">{gig.title}</p>
                          {(gig.title === SITE_ADMIN_GIG_TITLE || gig.username === SITE_ADMIN_GIG_OWNER) && (
                            <span className="sticker text-xs" style={{ color: "#FF1FA0", borderColor: "#FF1FA0" }}>
                              {gig.username === SITE_ADMIN_GIG_OWNER ? `@${SITE_ADMIN_GIG_OWNER}` : "YOUR POST"}
                            </span>
                          )}
                        </div>
                        <p className="text-white/40 text-xs mt-0.5">
                          {gig.postType === "LOOKING_FOR_WORK" ? "Looking for work" : "Posting gig"}
                          {gig.compensation ? ` · ${gig.compensation}` : ""}
                          {gig.location ? ` · ${gig.location}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="sticker text-xs" style={{ color: gig.status === "LIVE" ? "#CCFF00" : "#666", borderColor: gig.status === "LIVE" ? "#CCFF00" : "#333" }}>
                          {gig.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => editingGigId === gig.id ? setEditingGigId(null) : startGigEdit(gig)}
                          className="flex items-center gap-1 display text-xs px-3 py-1 border transition-all"
                          style={{
                            borderColor: editingGigId === gig.id ? "#00FFFF" : "#333",
                            color: editingGigId === gig.id ? "#00FFFF" : "#666",
                            background: "transparent",
                          }}
                        >
                          {editingGigId === gig.id ? <><X size={11} /> CANCEL</> : <><Pencil size={11} /> EDIT</>}
                        </button>
                      </div>
                    </div>

                    {editingGigId === gig.id && (
                      <form onSubmit={handleGigEditSave} className="border-t border-white/10 p-5 space-y-4" style={{ background: "#0d0d0d" }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">POST TYPE</label>
                            <select value={gigEditForm.postType || "POSTING_GIG"} onChange={e => setGigEditForm(f => ({ ...f, postType: e.target.value as AdminGig["postType"] }))}
                              className={adminFieldClass}>
                              <option value="POSTING_GIG">Posting gig</option>
                              <option value="LOOKING_FOR_WORK">Looking for work</option>
                            </select>
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">STATUS</label>
                            <select value={gigEditForm.status || "LIVE"} onChange={e => setGigEditForm(f => ({ ...f, status: e.target.value }))}
                              className={adminFieldClass}>
                              {["LIVE", "PENDING", "REMOVED"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="display text-xs text-white/40 block mb-1">TITLE</label>
                            <input value={gigEditForm.title || ""} onChange={e => setGigEditForm(f => ({ ...f, title: e.target.value }))}
                              className={adminFieldClass} />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">CONTACT NAME</label>
                            <input value={gigEditForm.name || ""} onChange={e => setGigEditForm(f => ({ ...f, name: e.target.value }))}
                              className={adminFieldClass} />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">CONTACT EMAIL</label>
                            <input type="email" value={gigEditForm.contactEmail || ""} onChange={e => setGigEditForm(f => ({ ...f, contactEmail: e.target.value }))}
                              className={adminFieldClass} />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">COMPENSATION</label>
                            <input value={gigEditForm.compensation || ""} onChange={e => setGigEditForm(f => ({ ...f, compensation: e.target.value }))}
                              placeholder="e.g. Volunteer — community help" className={adminFieldClass} />
                          </div>
                          <div>
                            <label className="display text-xs text-white/40 block mb-1">LOCATION</label>
                            <input value={gigEditForm.location || ""} onChange={e => setGigEditForm(f => ({ ...f, location: e.target.value }))}
                              placeholder="Portland / Remote" className={adminFieldClass} />
                          </div>
                          <div className="md:col-span-2">
                            <label className="display text-xs text-white/40 block mb-1">SKILLS</label>
                            <input value={gigEditForm.skills || ""} onChange={e => setGigEditForm(f => ({ ...f, skills: e.target.value }))}
                              className={adminFieldClass} />
                          </div>
                          <div className="flex items-center">
                            <label className="display text-xs text-white/40 flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={!!gigEditForm.isRemote} onChange={e => setGigEditForm(f => ({ ...f, isRemote: e.target.checked }))} />
                              REMOTE OK
                            </label>
                          </div>
                          <div className="md:col-span-2">
                            <label className="display text-xs text-white/40 block mb-1">DESCRIPTION</label>
                            <textarea rows={8} value={gigEditForm.description || ""} onChange={e => setGigEditForm(f => ({ ...f, description: e.target.value }))}
                              className={`${adminFieldClass} resize-y`} />
                          </div>
                        </div>
                        <div className="flex gap-3 flex-wrap pt-2">
                          <button type="submit" disabled={editGigMutation.isPending}
                            className="display text-sm px-6 py-2 border-2 disabled:opacity-50"
                            style={{ background: "#CCFF00", borderColor: "#CCFF00", color: "#000" }}>
                            {editGigMutation.isPending ? "SAVING..." : "SAVE CHANGES"}
                          </button>
                          <button type="button" onClick={() => setEditingGigId(null)}
                            className="display text-sm px-6 py-2 border"
                            style={{ borderColor: "#333", color: "#666", background: "transparent" }}>
                            CANCEL
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TEAM ── */}
        {activeTab === "promoters" && (
          <div>
            <p className="text-white/40 text-sm mb-6">Manage promoter statuses and sub-admin roles.</p>

            {/* Manual user override */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="display text-sm mb-3" style={{ color: "#FF6600" }}>MANUAL PROMOTER OVERRIDE</p>
              <p className="text-white/40 text-xs mb-4">Search any user by username, email, or display name to manually set their promoter status.</p>
              <div className="flex gap-2 mb-4">
                <input
                  className="flex-1 bg-black border border-white/20 px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/50"
                  placeholder="Search by username, email, or name..."
                  value={userSearchQ}
                  onChange={e => setUserSearchQ(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleUserSearch()}
                />
                <button
                  onClick={handleUserSearch}
                  disabled={userSearching}
                  className="display text-xs px-4 py-2 border border-white/30 text-white/60 flex items-center gap-2 hover:border-white/60"
                >
                  <Search size={12} /> {userSearching ? "..." : "SEARCH"}
                </button>
              </div>
              {userSearchResults.length > 0 && (
                <div className="space-y-2">
                  {userSearchResults.map(u => (
                    <div key={u.id} className="p-4 border border-white/10 flex items-center justify-between gap-4 flex-wrap" style={{ background: "#0d0d0d" }}>
                      <div className="min-w-0 flex-1">
                        <AdminUserIdentity profile={u} showEmail size={40} />
                        <p className="text-xs mt-2 ml-[52px]" style={{ color: u.promoterStatus === "approved" ? "#CCFF00" : u.promoterStatus === "pending" ? "#00FFFF" : "#FF2400" }}>
                          promoter: {u.promoterStatus || "none"}
                          {u.subAdmin && <span style={{ color: "#FF00CC" }}> · SUB-ADMIN</span>}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {u.promoterStatus !== "approved" && (
                          <button onClick={() => setPromoterStatusMutation.mutate({ userId: u.id, status: "approved" })}
                            className="display text-xs px-3 py-1 border" style={{ borderColor: "#CCFF00", color: "#CCFF00" }}>APPROVE</button>
                        )}
                        {u.promoterStatus !== "pending" && (
                          <button onClick={() => setPromoterStatusMutation.mutate({ userId: u.id, status: "pending" })}
                            className="display text-xs px-3 py-1 border" style={{ borderColor: "#00FFFF", color: "#00FFFF" }}>SET PENDING</button>
                        )}
                        {u.promoterStatus !== "none" && u.promoterStatus !== null && (
                          <button onClick={() => setPromoterStatusMutation.mutate({ userId: u.id, status: "none" })}
                            className="display text-xs px-3 py-1 border border-white/30 text-white/40">RESET</button>
                        )}
                        {isSuperAdmin && (
                          <button onClick={() => setSubAdminMutation.mutate({ userId: u.id, grant: !u.subAdmin })}
                            className="display text-xs px-3 py-1 border"
                            style={{ borderColor: "#FF00CC", color: u.subAdmin ? "#FF00CC" : "#FF00CC88" }}>
                            {u.subAdmin ? "REVOKE SUB-ADMIN" : "GRANT SUB-ADMIN"}
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button onClick={() => { setFixUsernameTarget({ id: u.id, current: u.username }); setFixUsernameValue(u.username); }}
                            className="display text-xs px-3 py-1 border border-white/20 text-white/40">
                            FIX USERNAME
                          </button>
                        )}
                      </div>
                      {fixUsernameTarget?.id === u.id && (
                        <div className="flex gap-2 mt-2 items-center">
                          <input
                            value={fixUsernameValue}
                            onChange={e => setFixUsernameValue(e.target.value)}
                            placeholder="new username"
                            className="display text-xs px-2 py-1 border border-white/20 bg-black text-white"
                            style={{ width: 160 }}
                          />
                          <button
                            onClick={() => setUsernameMutation.mutate({ userId: u.id, username: fixUsernameValue })}
                            disabled={!fixUsernameValue.trim() || setUsernameMutation.isPending}
                            className="display text-xs px-3 py-1 border"
                            style={{ borderColor: "#CCFF00", color: "#CCFF00" }}
                          >SAVE</button>
                          <button onClick={() => setFixUsernameTarget(null)} className="display text-xs px-2 py-1 text-white/40">CANCEL</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            {newUsersToday.length > 0 && (
              <div id="new-users-today" style={{ marginBottom: 28, padding: 16, border: "1px solid #C8FA3C33", background: "#0a0f00" }}>
                <p className="display text-sm" style={{ color: "#C8FA3C", marginBottom: 12 }}>
                  🌱 NEW TODAY — {newUsersToday.length} {newUsersToday.length === 1 ? "person" : "people"} joined
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {newUsersToday.map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #C8FA3C44", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#C8FA3C", fontFamily: "var(--font-display)", fontSize: 14 }}>
                        {u.photoUrl ? <img src={u.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (u.displayName || u.username).slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{u.displayName || u.username}</div>
                        <div style={{ color: "#666", fontSize: 11 }}>@{u.username} · {u.email} · {new Date(u.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <p className="text-white/40 text-sm" style={{ margin: 0 }}>
                Every registered account on PDX Pride Guide. Search by username, email, or display name.
              </p>
              {isSuperAdmin && (
                <button
                  type="button"
                  className="display text-xs px-4 py-2 border"
                  style={{ borderColor: "#FF2400", color: "#FF2400" }}
                  disabled={purgeQaMutation.isPending}
                  onClick={() => purgeQaMutation.mutate()}
                >
                  {purgeQaMutation.isPending ? "PURGING…" : "PURGE QA TEST ACCOUNTS"}
                </button>
              )}
            </div>
            <div className="flex gap-2 mb-4 max-w-xl">
              <input
                className="flex-1 bg-black border border-white/20 px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/50"
                placeholder="Filter users..."
                value={allUsersFilter}
                onChange={e => setAllUsersFilter(e.target.value)}
              />
              {allUsersFilter && (
                <button
                  type="button"
                  onClick={() => setAllUsersFilter("")}
                  className="display text-xs px-4 py-2 border border-white/30 text-white/60"
                >
                  CLEAR
                </button>
              )}
            </div>

            {usersError ? (
              <AdminLoadError label="users" onRetry={() => refetchUsers()} />
            ) : usersLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse border border-white/10" />)}</div>
            ) : filteredAllUsers.length === 0 ? (
              <p className="text-white/30">{allUsersFilter ? "No users match that filter." : "No registered users yet."}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-white/30 text-xs mb-2">
                  Showing {filteredAllUsers.length}{allUsersFilter ? ` of ${allUsers.length}` : ""} users · newest first
                </p>
                {filteredAllUsers.map(u => (
                  <div key={u.id} className="p-4 border border-white/10 flex flex-col gap-3" style={{ background: "#0d0d0d" }}>
                    <div className="min-w-0">
                      <AdminUserIdentity profile={u} showEmail size={44} />
                      <div className="flex flex-wrap items-center gap-2 mt-2 ml-[56px]">
                        {u.isOwner && (
                          <span className="sticker text-xs" style={{ color: "#C8FA3C", borderColor: "#C8FA3C" }}>SITE ADMIN</span>
                        )}
                        {u.subAdmin && (
                          <span className="sticker text-xs" style={{ color: "#FF00CC", borderColor: "#FF00CC" }}>SUB-ADMIN</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs ml-[56px]">
                        {u.promoterStatus && u.promoterStatus !== "none" && (
                          <span style={{ color: u.promoterStatus === "approved" ? "#CCFF00" : u.promoterStatus === "pending" ? "#00FFFF" : "#FF2400" }}>
                            promoter: {u.promoterStatus}
                          </span>
                        )}
                        <span className="text-white/35">id: {u.id}</span>
                        {u.googleLinked && <span className="text-white/35">Google linked</span>}
                        <span className="text-white/35">status: {u.status}</span>
                        {u.createdAt && (
                          <span className="text-white/35">joined {new Date(u.createdAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    {renderPromoterControls(u)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "team" && (
          <div className="space-y-8">
            <div>
              <p className="text-white/40 text-sm mb-4">
                Site admins can open this dashboard while logged into their PDX Pride Guide account (footer Admin Panel link). Owner accounts in Railway env cannot be removed here.
              </p>
              <form
                className="border border-white/10 p-5 space-y-4 max-w-xl"
                style={{ background: "#111" }}
                onSubmit={e => {
                  e.preventDefault();
                  if (!teamIdentifier.trim()) return;
                  grantAdminMutation.mutate();
                }}
              >
                <h3 className="display text-lg text-white">Add site admin</h3>
                <div>
                  <label className="display text-xs text-white/40 block mb-1">USERNAME OR EMAIL</label>
                  <UsernameAutocomplete
                    value={teamIdentifier}
                    onChange={setTeamIdentifier}
                    placeholder="@username or email@example.com"
                    inputStyle={{ width: "100%" }}
                    className={adminFieldClass}
                  />
                </div>
                <div>
                  <label className="display text-xs text-white/40 block mb-1">NOTE (OPTIONAL)</label>
                  <input
                    value={teamNote}
                    onChange={e => setTeamNote(e.target.value)}
                    placeholder="e.g. Pride weekend moderation"
                    className={adminFieldClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={grantAdminMutation.isPending || !teamIdentifier.trim()}
                  className="display text-sm px-6 py-2 border-2 disabled:opacity-50"
                  style={{ background: "#CCFF00", borderColor: "#CCFF00", color: "#000" }}
                >
                  {grantAdminMutation.isPending ? "ADDING..." : "GRANT ADMIN ACCESS"}
                </button>
              </form>
            </div>

            {teamError ? (
              <AdminLoadError label="site admins" onRetry={() => refetchTeam()} />
            ) : teamLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse border border-white/10" />)}</div>
            ) : teamAdmins.length === 0 ? (
              <p className="text-white/30">No site admins yet. Add someone who already has a registered account.</p>
            ) : (
              <div className="space-y-3">
                {teamAdmins.map(member => (
                  <div key={member.userId} className="p-4 border border-white/10 flex items-start justify-between gap-4 flex-wrap" style={{ background: "#0d0d0d" }}>
                    <div className="min-w-0 flex-1">
                      <AdminUserIdentity profile={{ ...member, id: member.userId }} showEmail size={44} />
                      <div className="flex flex-wrap items-center gap-2 mt-2 ml-[56px]">
                        {member.protected && (
                          <span className="sticker text-xs" style={{ color: "#C8FA3C", borderColor: "#C8FA3C" }}>SITE ADMIN</span>
                        )}
                      </div>
                      {member.note && <p className="text-white/55 text-sm mt-2">{member.note}</p>}
                      <p className="text-white/30 text-xs mt-2">
                        {member.protected ? "Protected via Railway env" : `Granted${member.grantedByUsername ? ` by @${member.grantedByUsername}` : ""}`}
                        {" · "}
                        {new Date(member.grantedAt).toLocaleString()}
                      </p>
                    </div>
                    {!member.protected && (
                      <button
                        type="button"
                        onClick={() => revokeAdminMutation.mutate(member.userId)}
                        disabled={revokeAdminMutation.isPending}
                        className="display text-xs px-4 py-2 border-2"
                        style={{ borderColor: "#FF2400", color: "#FF2400" }}
                      >
                        REMOVE
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
