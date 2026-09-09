import {useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {apiRequest,queryClient} from '@/lib/queryClient';
import {useAuth} from '@/context/AuthContext';
import {useToast} from '@/hooks/use-toast';
import AuthModal from './AuthModal';
import {X} from 'lucide-react';
import {DIRECTORY_TYPE_LABELS as TYPE_LABELS} from '@shared/directoryTheme';
import '../pages/Directory.css';
const NEIGHBORHOOD_ORDER = [
  "ALL",
  "Downtown",
  "Old Town",
  "Pearl",
  "NW",
  "N",
  "NE",
  "Alberta",
  "Inner East",
  "Central Eastside",
  "SE",
  "Montavilla",
  "Multiple",
  "SW",
  "Hawthorne",
  "Belmont",
  "Division",
  "Mississippi",
  "Alberta Arts District",
];
const FORM_NEIGHBORHOODS=NEIGHBORHOOD_ORDER.filter(n=>n!=="ALL");
const blankDirectoryForm = (type = "bar") => ({
  name: "",
  type,
  description: "",
  address: "",
  neighborhood: "SE",
  website: "",
  instagram: "",
  hours: "",
  phone: "",
  queerOwned: false,
  queerFriendly: true,
  /**
   * Whether the submitter runs this place or is just adding it to the map.
   * "runs" files an ownership claim alongside the listing; "adding" does not.
   */
  relationship: "adding" as "runs" | "adding",
  /** Only used when relationship is "runs": how they're connected. */
  relationshipNote: "",
});

type DirectoryFormState = ReturnType<typeof blankDirectoryForm>;

type DirectoryMatchPreview = {
  businessId: number;
  name: string;
  type: string;
  address: string | null;
  neighborhood: string | null;
  confidence: string;
  reasons: string[];
};

type DirectorySubmitResult = {
  title: string;
  desc: string;
  heldForReview?: boolean;
  potentialMatches?: DirectoryMatchPreview[];
};

function directoryMergePayload(form: DirectoryFormState) {
  return {
    description: form.description,
    hours: form.hours || null,
    phone: form.phone || null,
    website: form.website || null,
    instagram: form.instagram || null,
    neighborhood: form.neighborhood || null,
    queerOwned: form.queerOwned,
    queerFriendly: form.queerFriendly,
  };
}


export default function DirectoryAddPlaceForm({isSpaces=false,embedded=false,readOnly=false,onClose}:{isSpaces?:boolean;embedded?:boolean;readOnly?:boolean;onClose:()=>void}) {
 const {user}=useAuth();
 const {toast}=useToast();
 const [showAuth,setShowAuth]=useState(false);
 const [form,setForm]=useState(()=>blankDirectoryForm(isSpaces?'group':'bar'));
 const [submitResult,setSubmitResult]=useState<DirectorySubmitResult|null>(null);
 const [claimingBusinessId,setClaimingBusinessId]=useState<number|null>(null);
  const createMutation = useMutation({
    mutationFn: async (opts?: { confirmDistinct?: boolean }) => {
      const r = await apiRequest("POST", "/api/directory", {
        ...form,
        confirmDistinct: opts?.confirmDistinct ?? false,
      });
      const payload = await r.json();
      if (!r.ok) throw new Error(payload.error || "Could not add place");
      return payload;
    },
    onSuccess: (payload) => {
      const heldForReview = !!payload.heldForReview;
      const potentialMatches: DirectoryMatchPreview[] | undefined = Array.isArray(payload.potentialMatches)
        ? payload.potentialMatches.slice(0, 5).map((match: DirectoryMatchPreview) => ({
          businessId: match.businessId,
          name: match.name,
          type: match.type,
          address: match.address,
          neighborhood: match.neighborhood,
          confidence: match.confidence,
          reasons: match.reasons ?? [],
        }))
        : undefined;

      if (heldForReview) {
        const reason = payload.heldReason
          ? `${payload.heldReason}. Request ownership to merge your updates, or confirm this is a different place.`
          : "We found a similar place already in the directory. Request ownership to merge your updates, or confirm this is a different place.";
        setSubmitResult({
          title: "Possible duplicate",
          desc: reason,
          heldForReview: true,
          potentialMatches,
        });
        toast({ title: "Similar place found", description: "Review the matches below before publishing." });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["/api/directory"] });
      const hasMatches = potentialMatches && potentialMatches.length > 0;
      const noun = isSpaces ? "squad" : "place";
      // Ownership was requested, so say what happens next instead of implying it's settled.
      const claimLine = payload.ownershipRequested
        ? " We passed your ownership request to an admin, and you'll hear back once it's reviewed."
        : "";
      setForm(blankDirectoryForm(isSpaces ? "group" : "bar"));
      setSubmitResult({
        title: isSpaces ? "Added to MY SQUADZ" : "Added to directory",
        desc: hasMatches
          ? `Your ${noun} is live in the directory. Map placement requires a confirmed street address.${claimLine} We also spotted similar listings you may want to double-check.`
          : `Your ${noun} is live in the directory. Map placement requires a confirmed street address.${claimLine}`,
        potentialMatches: hasMatches ? potentialMatches : undefined,
      });
      toast({
        title: isSpaces ? "Added to MY SQUADZ" : "Added to directory",
        description: `Your ${isSpaces ? "squad" : "place"} is live in the directory.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Could not add place", description: err.message, variant: "destructive" });
    },
  });

  const claimMatchMutation = useMutation({
    mutationFn: async ({ businessId, claimReason }: { businessId: number; claimReason: string }) => {
      const r = await apiRequest("POST", `/api/directory/${businessId}/claim`, {
        claimReason,
        pendingMerge: true,
        mergePayload: directoryMergePayload(form),
      });
      const payload = await r.json();
      if (!r.ok) throw new Error(payload.error || "Could not submit ownership request");
      return payload;
    },
    onSuccess: () => {
      setClaimingBusinessId(null);
      setForm(blankDirectoryForm(isSpaces ? "group" : "bar"));
      setSubmitResult(null);
      onClose();
      toast({
        title: "Ownership request sent",
        description: "An admin will review your claim and proposed updates before they go live.",
      });
    },
    onError: (err: Error) => {
      setClaimingBusinessId(null);
      toast({ title: "Could not submit request", description: err.message, variant: "destructive" });
    },
  });

  const openAddForm = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setForm(blankDirectoryForm(isSpaces ? "group" : "bar"));
    setSubmitResult(null);
    setClaimingBusinessId(null);

  };

  const resetDirectoryForm = () => {
    setForm(blankDirectoryForm(isSpaces ? "group" : "bar"));
    setSubmitResult(null);
    setClaimingBusinessId(null);
  };

  const requestOwnershipForMatch = (match: DirectoryMatchPreview) => {
    const reason = window.prompt(
      `Tell us how you're connected to ${match.name} (e.g. "I own/manage this venue"):`,
      "",
    );
    if (reason == null) return;
    if (reason.trim().length < 10) {
      toast({ title: "Add a short reason", description: "At least 10 characters so admins can verify your connection.", variant: "destructive" });
      return;
    }
    setClaimingBusinessId(match.businessId);
    claimMatchMutation.mutate({ businessId: match.businessId, claimReason: reason.trim() });
  };

  const submitDirectoryForm = () => {
    if (!user) { setShowAuth(true); return; }
    if (readOnly) { toast({ title: "Preview only", description: "This demo can preview the form. Submit new places from the live directory." }); return; }
    if (!form.name.trim()) {
      toast({ title: "Add a name", variant: "destructive" });
      return;
    }
    if (!form.description.trim()) {
      toast({ title: "Add a description", variant: "destructive" });
      return;
    }
    if (form.relationship === "runs" && form.relationshipNote.trim().length < 10) {
      toast({
        title: "Tell us how you're connected",
        description: "At least 10 characters so an admin can verify it before handing you the listing.",
        variant: "destructive",
      });
      return;
    }
    setSubmitResult(null);
    createMutation.mutate({});
  };

  const publishDespiteMatches = () => {
    createMutation.mutate({ confirmDistinct: true });
  };

  const finishDirectorySubmit = () => {
    resetDirectoryForm();
    onClose();
  };


return <>{showAuth&&<AuthModal onClose={()=>setShowAuth(false)} defaultTab="login"/>}          <section id="directory-form" className={`gifting-form-panel gifting-form-panel--makeover directory-form-panel pdx-glass-rebind${embedded ? " directory-form--embedded" : ""}`}>
            <button type="button" className="gifting-close" onClick={onClose} aria-label="Close form">
              <X size={18} />
            </button>
            <h2 className="display section-heading">{isSpaces ? "Add a squad" : "Add to PLACEZ"}</h2>
            <p className="board-copy-sm">
              {isSpaces
                ? "Logged-in members can add queer clubs, crews, nonprofits, and community groups. New listings go live immediately unless we spot a likely duplicate. Keep it accurate and scene-rooted. Organizers can claim a listing to manage it."
                : "Logged-in members can list spots that are ours or truly for us. New listings go live immediately unless we spot a likely duplicate. Keep it accurate and scene-rooted. Owners can claim a listing to manage it."}
            </p>
            {readOnly && <p className="board-copy-sm" role="note">Preview the form here. New places can be submitted from the <a href="https://www.zaylist.com/directory?add=1">live directory</a>.</p>}
            {submitResult ? (
              <div className="submit-success">
                <div className="submit-success__title">{submitResult.title}</div>
                <p className="submit-success__body" style={{ marginBottom: submitResult.potentialMatches?.length ? 16 : 22 }}>
                  {submitResult.desc}
                </p>
                {submitResult.potentialMatches && submitResult.potentialMatches.length > 0 && (
                  <div style={{ border: "1px solid #444", background: "var(--ink-850)", padding: 14, marginBottom: 22, borderRadius: 3 }}>
                    <p style={{ color: "var(--neon-orange)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                      Similar places on Zaylist
                    </p>
                    <ul style={{ margin: "0 0 14px", paddingLeft: 18, color: "#aaa", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      {submitResult.potentialMatches.map(match => (
                        <li key={match.businessId} style={{ marginBottom: 10 }}>
                          <span>
                            {match.name}
                            {match.neighborhood ? ` · ${match.neighborhood}` : ""}
                            {match.address ? ` · ${match.address}` : ""}
                            {match.confidence === "high" ? " (likely duplicate)" : ""}
                          </span>
                          {submitResult.heldForReview && (
                            <button
                              type="button"
                              className="btn-neon pdx-glass-rebind"
                              style={{ display: "block", marginTop: 6, fontSize: "0.78rem" }}
                              disabled={claimMatchMutation.isPending && claimingBusinessId === match.businessId}
                              onClick={() => requestOwnershipForMatch(match)}
                            >
                              {claimMatchMutation.isPending && claimingBusinessId === match.businessId
                                ? "Submitting…"
                                : "Request ownership & merge updates →"}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    {submitResult.heldForReview && (
                      <button
                        type="button"
                        className="btn-neon solid pdx-glass-rebind"
                        disabled={createMutation.isPending}
                        onClick={publishDespiteMatches}
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        {createMutation.isPending ? "Publishing…" : "This is a different place, publish anyway →"}
                      </button>
                    )}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {!submitResult.heldForReview && (
                    <button type="button" className="btn-neon solid pdx-glass-rebind" onClick={openAddForm} style={{ width: "100%", justifyContent: "center" }}>
                      Add another place →
                    </button>
                  )}
                  <button type="button" onClick={finishDirectorySubmit} className="submit-hub-link">
                    {embedded ? "Back to map" : submitResult.heldForReview ? "Close" : "Back to directory"}
                  </button>
                </div>
              </div>
            ) : (
            <>
            <div className="gifting-form-grid">
              <label className="span">
                Place name *
                <input className="board-text-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={120} />
              </label>
              {!isSpaces && <label>
                Type *
                <select className="board-text-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(TYPE_LABELS).filter(([key]) => key !== "group").map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>}
              <label>
                Neighborhood
                <select className="board-text-field" value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}>
                  {FORM_NEIGHBORHOODS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="span">
                Description *
                <textarea className="board-text-field" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} maxLength={2000} />
              </label>
              <label className="span">
                Address
                <input className="board-text-field" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address helps us pin it on the map" />
              </label>
              <label>
                Hours
                <input className="board-text-field" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="e.g. Mon to Sat, 4pm to 2am" />
              </label>
              <label>
                Phone
                <input className="board-text-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </label>
              <label>
                Website
                <input className="board-text-field" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} type="url" placeholder="https://..." />
              </label>
              <label>
                Instagram
                <input className="board-text-field" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@handle" />
              </label>
              <div className="span directory-form-checks">
                <label className="gifting-rules">
                  <input type="checkbox" checked={form.queerOwned} onChange={e => setForm(f => ({ ...f, queerOwned: e.target.checked }))} />
                  Owned by us
                </label>
                <label className="gifting-rules">
                  <input type="checkbox" checked={form.queerFriendly} onChange={e => setForm(f => ({ ...f, queerFriendly: e.target.checked }))} />
                  For our crowd
                </label>
              </div>
              <div className="span">
                <span className="board-copy-sm" style={{ display: "block", marginBottom: 8 }}>
                  {isSpaces ? "Do you run this squad?" : "Do you run this place?"}
                </span>
                <label className="gifting-rules" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <input
                    type="radio"
                    name="directory-relationship"
                    checked={form.relationship === "adding"}
                    onChange={() => setForm(f => ({ ...f, relationship: "adding" }))}
                  />
                  {isSpaces
                    ? "No, I'm just adding it so people can find it"
                    : "No, I'm just adding it to the directory"}
                </label>
                <label className="gifting-rules" style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 6 }}>
                  <input
                    type="radio"
                    name="directory-relationship"
                    checked={form.relationship === "runs"}
                    onChange={() => setForm(f => ({ ...f, relationship: "runs" }))}
                  />
                  {isSpaces
                    ? "Yes, I run or help run it and want to manage the listing"
                    : "Yes, I own or manage it and want to manage the listing"}
                </label>
                {form.relationship === "runs" && (
                  <label style={{ display: "block", marginTop: 10 }}>
                    How you're connected *
                    <textarea
                      className="board-text-field"
                      value={form.relationshipNote}
                      onChange={e => setForm(f => ({ ...f, relationshipNote: e.target.value }))}
                      rows={2}
                      maxLength={500}
                      placeholder="e.g. I'm the board chair, or I book the events here"
                    />
                    <span className="board-copy-sm" style={{ display: "block", marginTop: 6 }}>
                      Your listing goes live either way. An admin reviews this before handing you the keys.
                    </span>
                  </label>
                )}
              </div>
            </div>
            <button type="button" className="btn-neon solid pdx-glass-rebind" disabled={createMutation.isPending || readOnly} onClick={submitDirectoryForm}>
              {createMutation.isPending ? "Adding…" : "Add to directory →"}
            </button>
            </>
            )}
          </section>
</>;
}
