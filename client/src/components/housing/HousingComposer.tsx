/**
 * HAUSING composer. One question, four answers, then a short field set.
 *
 * Design: docs/design-handoff-hausing/README.md section 6, and the Composer in
 * docs/design-handoff-hausing/haus-app.jsx.
 *
 * Three rules shape this file:
 *  1. Posting takes under a minute. Headline is the only required field.
 *  2. Nothing here captures a protected characteristic. Preferences stay free
 *     text the poster wrote, and the fixed lists are logistics only.
 *  3. Fields start empty. The prototype's demo drafts are not ported.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { trackProductEvent } from "@/lib/analytics";
import {
  AFFORDABILITY_BADGES,
  AFFORDABILITY_BADGE_LABEL,
  FORMING_FLAVORS,
  FORMING_FLAVOR_LABEL,
  HAUS_NAME_MAX_CHARS,
  HAUS_NAME_MAX_WORDS,
  HAUS_SUFFIX,
  HOUSING_ACCENT_VAR,
  HOUSING_BOARD_ACCENT,
  HOUSING_TYPE_BLURB,
  HOUSING_TYPE_LABEL,
  OUTDOOR_OPTIONS,
  OUTDOOR_LABEL,
  PARKING_OPTIONS,
  PARKING_LABEL,
  stripHausSuffix,
  type AffordabilityBadge,
  type FormingFlavor,
  type HousingType,
  type OutdoorOption,
  type ParkingOption,
} from "@shared/housing";
import { HousingIcon } from "@/components/housing/HousingIcon";
import { Btn, Chip, Mono, SectionTitle, accentStyle } from "@/components/housing/HousingPrimitives";
import { HousingTagPicker } from "@/components/housing/HousingTagPicker";

/** What the composer sends up. Kept loose so the caller can log or refetch. */
export type ComposerResult = { type: HousingType; [k: string]: unknown };

const MAX_PHOTOS = 4;

/** Off-platform housemates and pets, held locally until the post exists. */
type PendingMember = {
  key: string;
  kind: "OFFPLATFORM" | "PET";
  name: string;
  photoUrl: string;
  species: string;
};

type Draft = {
  /** OFFERING and FORMING store the front part only. MANAGED stores the real name. */
  name: string;
  headline: string;
  body: string;
  /** Rent for offering and managed, budget for looking and forming. */
  money: string;
  /** Available for offering and managed, move timeline for looking and forming. */
  timing: string;
  areas: string[];
  areaInput: string;
  livingStyle: string[];
  tags: string[];
  livingInput: string;
  openToHaus: boolean;
  beds: string;
  baths: string;
  parking: ParkingOption | "";
  outdoor: OutdoorOption | "";
  badges: AffordabilityBadge[];
  sourceUrl: string;
  flavor: FormingFlavor | "";
  seeking: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  headline: "",
  body: "",
  money: "",
  timing: "",
  areas: [],
  areaInput: "",
  livingStyle: [],
  tags: [],
  livingInput: "",
  openToHaus: false,
  beds: "",
  baths: "",
  parking: "",
  outdoor: "",
  badges: [],
  sourceUrl: "",
  flavor: "",
  seeking: "",
};

/** Keys match the pm-application API body (siteUrl, businessLicense, directoryBusinessId). */
type PmForm = {
  company: string;
  siteUrl: string;
  businessLicense: string;
  directoryBusinessId: string;
};
const EMPTY_PM: PmForm = {
  company: "",
  siteUrl: "",
  businessLicense: "",
  directoryBusinessId: "",
};

/** Board chrome accent for the type picker, which belongs to no single type. */
const BOARD_STYLE = {
  "--c": HOUSING_BOARD_ACCENT,
  "--_c": HOUSING_BOARD_ACCENT,
  "--hz-accent": HOUSING_BOARD_ACCENT,
} as CSSProperties;

function tileStyle(type: HousingType): CSSProperties {
  const c = HOUSING_ACCENT_VAR[type];
  return { "--c": c, "--_c": c, "--hz-accent": c } as CSSProperties;
}

/**
 * The locked suffix rule, applied as the poster types.
 *
 * A pasted name gets the suffix stripped straight away. A typed one only gets it
 * stripped on blur and on submit, so someone writing "House on Failing" is not
 * fighting the field halfway through the first word.
 */
function limitHausName(next: string, previous: string): string {
  const pasted = next.length - previous.length > 1;
  let value = pasted ? stripHausSuffix(next) : next.replace(/\s+/g, " ").replace(/^\s+/, "");
  const words = value.split(" ").filter(Boolean);
  const trailingSpace = /\s$/.test(value);
  if (words.length > HAUS_NAME_MAX_WORDS) value = words.slice(0, HAUS_NAME_MAX_WORDS).join(" ");
  if (value.length > HAUS_NAME_MAX_CHARS) value = value.slice(0, HAUS_NAME_MAX_CHARS);
  if (trailingSpace && words.length < HAUS_NAME_MAX_WORDS && value.length < HAUS_NAME_MAX_CHARS) {
    value = `${value} `;
  }
  return value;
}

function wordCount(value: string): number {
  return value.split(" ").filter(Boolean).length;
}

/** The domain behind a manager's listing link, for the source line on the card. */
function domainOf(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.hostname.replace(/^www\./i, "") || null;
  } catch {
    return null;
  }
}

function numberOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

async function uploadHousingPhotos(files: File[]): Promise<string[]> {
  const body = new FormData();
  files.forEach((file) => body.append("photos", file));
  const res = await fetch("/api/upload/housing", { method: "POST", credentials: "include", body });
  if (!res.ok) throw new Error("That upload did not go through. Try again in a second.");
  const data = (await res.json()) as { urls?: string[] };
  return Array.isArray(data.urls) ? data.urls : [];
}

/** The composer sheet shell. Backdrop closes, the panel does not. */
function Sheet({
  title,
  onClose,
  style,
  children,
}: {
  title: string;
  onClose: () => void;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className="hz-sheetwrap" onClick={onClose}>
      <div
        className="hz-sheet pdx-glass-rebind"
        style={style}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="hz-sheet__head">
          <Mono accent>{title}</Mono>
          <button type="button" className="hz-x" onClick={onClose} aria-label="Close">
            <HousingIcon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Inline toast. Confirmations and failures both land here, never in an alert. */
function Notice({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="hz-flag hz-flag--note" role="status">
      <span>
        <b style={{ color: "var(--text-hi)" }}>{text}</b>
      </span>
    </div>
  );
}

/** Chip list with an add input. Free text, so nobody is picking from our list. */
function ChipInput({
  label,
  placeholder,
  values,
  input,
  onInput,
  onAdd,
  onRemove,
  hint,
}: {
  label: string;
  placeholder: string;
  values: string[];
  input: string;
  onInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="hz-field">
      <label>
        <Mono micro>{label}</Mono>
      </label>
      {values.length ? (
        <div className="hz-chiprow" style={{ marginBottom: 8 }}>
          {values.map((v) => (
            <Chip key={v} tone="accent" onClick={() => onRemove(v)} title="Remove">
              {v}
              <HousingIcon name="close" size={12} />
            </Chip>
          ))}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="hz-input"
          style={{ width: "100%" }}
          value={input}
          placeholder={placeholder}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Btn size="sm" kind="outline" onClick={onAdd}>
          Add
        </Btn>
      </div>
      {hint ? <small className="hz-hint">{hint}</small> : null}
    </div>
  );
}

export function HousingComposer({
  initialType,
  onClose,
  onPosted,
  isPropertyManager,
  managerName,
}: {
  initialType?: HousingType | "PM" | null;
  onClose: () => void;
  onPosted: (postId: number) => void;
  isPropertyManager: boolean;
  managerName?: string | null;
}): JSX.Element {
  const [type, setType] = useState<HousingType | "PM" | null>(initialType ?? null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [photos, setPhotos] = useState<string[]>([]);
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [pm, setPm] = useState<PmForm>(EMPTY_PM);
  const [pmSent, setPmSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [postedId, setPostedId] = useState<number | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const patch = (next: Partial<Draft>) => setDraft((d) => ({ ...d, ...next }));

  // Focus the first field when a form step opens. Page-level sheet, so no Escape trap.
  useEffect(() => {
    if (postedId !== null) return;
    const id = window.requestAnimationFrame(() => {
      firstFieldRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [type, postedId]);

  const pickType = (next: HousingType | "PM") => {
    setType(next);
    setNotice(null);
  };

  const backToPicker = () => {
    setType(null);
    setNotice(null);
  };

  // --- photos ---------------------------------------------------------------

  const takeFiles = async (files: FileList | null, replaceCover: boolean) => {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    setBusy(true);
    setNotice(null);
    try {
      const room = replaceCover ? 1 : MAX_PHOTOS - photos.length;
      const urls = await uploadHousingPhotos(list.slice(0, Math.max(room, 1)));
      if (!urls.length) return;
      setPhotos((p) => {
        if (replaceCover) return [urls[0], ...p.slice(1)].slice(0, MAX_PHOTOS);
        return [...p, ...urls].slice(0, MAX_PHOTOS);
      });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "That upload did not go through.");
    } finally {
      setBusy(false);
    }
  };

  const addMember = async (kind: PendingMember["kind"], files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setNotice(null);
    try {
      const urls = await uploadHousingPhotos([file]);
      if (!urls.length) return;
      setMembers((m) => [
        ...m,
        { key: `${kind}-${Date.now()}-${m.length}`, kind, name: "", photoUrl: urls[0], species: "" },
      ]);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "That upload did not go through.");
    } finally {
      setBusy(false);
    }
  };

  // --- submit ---------------------------------------------------------------

  const submitPost = async (postType: HousingType) => {
    const headline = draft.headline.trim();
    const needsPhoto = postType === "OFFERING" || postType === "LOOKING";
    if (!headline) {
      setNotice(needsPhoto ? "Add a headline and a cover photo." : "Add a headline.");
      return;
    }
    if (needsPhoto && photos.length === 0) {
      setNotice("Add a cover photo. It is required for this post type.");
      return;
    }
    setBusy(true);
    setNotice(null);

    const suffixed = postType === "OFFERING" || postType === "FORMING";
    const body: Record<string, unknown> = {
      type: postType,
      // Front part only. The locked suffix is appended on render, never stored.
      name: suffixed ? stripHausSuffix(draft.name) : draft.name.trim(),
      headline,
      body: draft.body.trim(),
      photos,
      areas: draft.areas,
      // The server re-validates these against the post type, so what lands here
      // is a request, not the final list.
      tags: draft.tags,
    };

    if (postType === "LOOKING") {
      body.budget = draft.money.trim();
      body.moveTimeline = draft.timing.trim();
      body.livingStyle = draft.livingStyle;
      body.openToHaus = draft.openToHaus;
    } else if (postType === "FORMING") {
      body.budget = draft.money.trim();
      body.moveIn = draft.timing.trim();
      body.flavor = draft.flavor || null;
      body.seeking = numberOrNull(draft.seeking) ?? 0;
    } else {
      body.rent = draft.money.trim();
      body.moveIn = draft.timing.trim();
    }

    if (postType === "MANAGED") {
      body.beds = numberOrNull(draft.beds);
      body.baths = numberOrNull(draft.baths);
      body.parking = draft.parking || null;
      body.outdoor = draft.outdoor || null;
      body.badges = draft.badges;
      body.sourceUrl = draft.sourceUrl.trim() || null;
      body.sourceDomain = domainOf(draft.sourceUrl);
    }

    try {
      trackProductEvent("post_attempt", "housing");
      const res = await fetch("/api/housing", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as { id?: number; error?: string } | null;
      if (!res.ok || !data?.id) {
        setNotice(data?.error || "That did not post. Try again in a second.");
        return;
      }
      trackProductEvent("post_completed", "housing");

      // Off-platform housemates and pets attach after the post exists. Best
      // effort: the post is already up, so a hiccup here is not a failure.
      const named = members.filter((m) => m.name.trim());
      for (const m of named) {
        try {
          await fetch(`/api/housing/${data.id}/members`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: m.kind,
              name: m.name.trim(),
              photoUrl: m.photoUrl,
              species: m.kind === "PET" ? m.species.trim() : null,
            }),
          });
        } catch {
          /* the post stands. They can add the rest from the post later. */
        }
      }

      setPostedId(data.id);
    } catch {
      setNotice("That did not post. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitPmApplication = async () => {
    if (!pm.company.trim() || !pm.siteUrl.trim()) {
      setNotice("Company name and company website are both required.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/housing/pm-application", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: pm.company.trim(),
          siteUrl: pm.siteUrl.trim(),
          businessLicense: pm.businessLicense.trim() || undefined,
          directoryBusinessId: (() => {
            const raw = pm.directoryBusinessId.trim();
            if (!raw) return null;
            const n = Number(raw);
            return Number.isFinite(n) && n > 0 ? n : null;
          })(),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        alreadyPending?: boolean;
        error?: string;
      } | null;
      if (!res.ok) {
        setNotice(data?.error || "We could not send that right now. Your details are still here, so try again.");
        return;
      }
      setPmSent(true);
      setNotice(
        data?.alreadyPending
          ? "You already have an application pending. We will email you when it is reviewed."
          : "Application sent. We will review it and email you.",
      );
    } catch {
      setNotice("We could not send that right now. Your details are still here, so try again.");
    } finally {
      setBusy(false);
    }
  };

  const sharePost = (id: number) => {
    const url = `${window.location.origin}/the-hauz/${id}`;
    if (navigator.share) {
      navigator.share({ url }).catch(() => undefined);
      return;
    }
    navigator.clipboard?.writeText(url);
    setNotice("Link copied.");
  };

  // --- posted confirmation --------------------------------------------------

  if (postedId !== null) {
    const accent = type && type !== "PM" ? accentStyle(type) : BOARD_STYLE;
    return (
      <Sheet title="Posted" onClose={onClose} style={accent}>
        <div className="hz-done">
          <Mono accent>It is on the board</Mono>
          <h3>You are on Zaylist</h3>
          <p style={{ color: "var(--board-muted)", margin: "12px auto 0", maxWidth: "46ch" }}>
            Your post is in the feed now. People tap chat when something clicks. You can add photos,
            change the details, or switch what you are looking for at any time.
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              marginTop: 18,
              flexWrap: "wrap",
            }}
          >
            <Btn kind="outline" onClick={() => sharePost(postedId)}>
              <HousingIcon name="share" />
              Share it
            </Btn>
            <Btn kind="solid" onClick={() => onPosted(postedId)}>
              See it in the feed
            </Btn>
          </div>
          <div style={{ marginTop: 14 }}>
            <Notice text={notice} />
          </div>
        </div>
      </Sheet>
    );
  }

  // --- type picker ----------------------------------------------------------

  if (!type) {
    const tiles: HousingType[] = ["OFFERING", "LOOKING", "FORMING"];
    return (
      <Sheet title="New housing post" onClose={onClose} style={BOARD_STYLE}>
        <SectionTitle>What are you looking for?</SectionTitle>
        <div className="hz-ask" style={{ gridTemplateColumns: "1fr", marginTop: 14 }}>
          {tiles.map((t) => (
            <button
              key={t}
              type="button"
              className="pdx-glass-rebind"
              style={tileStyle(t)}
              onClick={() => pickType(t)}
            >
              <b>{HOUSING_TYPE_LABEL[t]}</b>
              <small>{HOUSING_TYPE_BLURB[t]}</small>
            </button>
          ))}
          <button
            type="button"
            className="pdx-glass-rebind"
            style={tileStyle("MANAGED")}
            onClick={() => pickType("PM")}
          >
            <b>{HOUSING_TYPE_LABEL.MANAGED}</b>
            <small>
              {isPropertyManager
                ? "Your listings, and posting a unit by hand."
                : HOUSING_TYPE_BLURB.MANAGED}
            </small>
          </button>
        </div>
        <p style={{ color: "var(--text-lo)", fontSize: "var(--meta)", marginTop: 14 }}>
          Zaylist never handles rent, deposits, or fees. Money is arranged directly between people.
        </p>
      </Sheet>
    );
  }

  // --- property manager entry point ----------------------------------------

  if (type === "PM") {
    return (
      <Sheet
        title={isPropertyManager ? "Property manager" : "Become a property manager"}
        onClose={onClose}
        style={accentStyle("MANAGED")}
      >
        {isPropertyManager ? (
          <>
            <SectionTitle kicker="Verified">{managerName || "Your company"}</SectionTitle>
            <p style={{ color: "var(--text-lo)", fontSize: "var(--meta)", margin: "8px 0 16px" }}>
              You can edit the details on your own listings. Adding and removing listings is on our
              side, so send us a note when a unit needs to come down.
            </p>
            <div className="hz-fields">
              <div className="hz-flag hz-flag--note">
                <span>
                  <b style={{ color: "var(--text-hi)" }}>Verification is free and required</b>
                  <p>
                    Managed listings show a verified badge and no household. They never carry
                    openness or compatibility.
                  </p>
                </span>
              </div>
              <Notice text={notice} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn kind="solid" onClick={() => pickType("MANAGED")}>
                  <HousingIcon name="add" />
                  Post a unit by hand
                </Btn>
                <Btn kind="outline" onClick={backToPicker}>
                  Back
                </Btn>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Company-level application (not a single unit post). Field keys match the API. */}
            <SectionTitle kicker="Apply once">Verify your company</SectionTitle>
            <p style={{ color: "var(--text-lo)", fontSize: "var(--meta)", margin: "8px 0 16px" }}>
              One application for your <b style={{ color: "var(--text-hi)" }}>company</b>, not a single
              listing. We review by hand. After approval you can post and manage units under that
              company. Every manager on this board is verified.
            </p>
            <div className="hz-fields">
              <div className="hz-field">
                <label>
                  <Mono micro>Company name</Mono>
                </label>
                <input
                  ref={firstFieldRef}
                  className="hz-input"
                  style={{ width: "100%" }}
                  value={pm.company}
                  placeholder="e.g. Rose City Rentals"
                  autoComplete="organization"
                  onChange={(e) => setPm((p) => ({ ...p, company: e.target.value }))}
                />
              </div>
              <div className="hz-field">
                <label>
                  <Mono micro>Company website</Mono>
                </label>
                <input
                  className="hz-input"
                  style={{ width: "100%" }}
                  value={pm.siteUrl}
                  placeholder="https://yourcompany.com or your listings page"
                  inputMode="url"
                  autoComplete="url"
                  onChange={(e) => setPm((p) => ({ ...p, siteUrl: e.target.value }))}
                />
                <small className="hz-hint">
                  Required. Public site or listings page for your company. We use the domain to
                  confirm you manage that brand.
                </small>
              </div>
              <div className="hz-field hz-field--split">
                <div>
                  <label>
                    <Mono micro>Business license (optional)</Mono>
                  </label>
                  <input
                    className="hz-input"
                    style={{ width: "100%" }}
                    value={pm.businessLicense}
                    placeholder="License or registration number"
                    onChange={(e) => setPm((p) => ({ ...p, businessLicense: e.target.value }))}
                  />
                  <small className="hz-hint">Helps speed up review if you have one.</small>
                </div>
                <div>
                  <label>
                    <Mono micro>Zaylist directory ID (optional)</Mono>
                  </label>
                  <input
                    className="hz-input"
                    style={{ width: "100%" }}
                    value={pm.directoryBusinessId}
                    placeholder="e.g. 42"
                    inputMode="numeric"
                    onChange={(e) => setPm((p) => ({ ...p, directoryBusinessId: e.target.value }))}
                  />
                  <small className="hz-hint">
                    Numeric ID of your business card on the Directory, if you already have one.
                  </small>
                </div>
              </div>
              <div className="hz-flag hz-flag--note">
                <span>
                  <b style={{ color: "var(--text-hi)" }}>Verification is free and required</b>
                  <p>
                    You cannot buy your way onto the board. Every safety step stays outside of
                    payment.
                  </p>
                </span>
              </div>
              <div className="hz-flag hz-flag--note">
                <span>
                  <b style={{ color: "var(--text-hi)" }}>Affirming Housing Partner · $30/month</b>
                  <p>
                    Listing on the board is a flat $30/month membership, separate from verification.
                    Your first 30 days are free, and the first 3 managers to sign up get their first
                    6 months free.
                  </p>
                </span>
              </div>
              <Notice text={notice} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn kind="outline" onClick={backToPicker}>
                  Back
                </Btn>
                <span style={{ marginLeft: "auto" }} />
                <Btn kind="solid" disabled={busy || pmSent} onClick={submitPmApplication}>
                  <HousingIcon name="verified" />
                  {pmSent ? "Sent" : "Send the application"}
                </Btn>
              </div>
            </div>
          </>
        )}
      </Sheet>
    );
  }

  // --- per type form --------------------------------------------------------

  const isManaged = type === "MANAGED";
  const isForming = type === "FORMING";
  const isOffering = type === "OFFERING";
  const isLooking = type === "LOOKING";
  /** A room and a seeker both have to show something. The server enforces it too. */
  const photoRequired = isOffering || isLooking;
  const suffixed = isOffering || isForming;
  const nameWords = wordCount(draft.name);

  const heading = isManaged
    ? "Tell people about the unit"
    : isForming
      ? "Name it and say who you want"
      : isOffering
        ? "Tell people about the house"
        : "Tell people what you need";

  const moneyLabel = isManaged || isOffering ? "Rent" : isForming ? "Combined budget" : "Budget";
  const timingLabel = isManaged || isOffering ? "Available" : isForming ? "Move in" : "Move timeline";

  return (
    <Sheet title={HOUSING_TYPE_LABEL[type]} onClose={onClose} style={accentStyle(type)}>
      <SectionTitle kicker={HOUSING_TYPE_LABEL[type]}>{heading}</SectionTitle>
      <p style={{ color: "var(--text-lo)", fontSize: "var(--meta)", margin: "8px 0 16px" }}>
        {photoRequired
          ? "Headline and a cover photo are required. Everything else can wait until later."
          : "Only the headline is required. Everything else can wait until later."}
      </p>

      <div className="hz-fields">
        {suffixed ? (
          <div className="hz-field">
            <label>
              <Mono micro>House name</Mono>
            </label>
            <div className="hz-suffix">
              <input
                ref={firstFieldRef}
                className="hz-input"
                value={draft.name}
                placeholder="The Overlook"
                onChange={(e) => patch({ name: limitHausName(e.target.value, draft.name) })}
                onBlur={() => patch({ name: stripHausSuffix(draft.name) })}
              />
              <span>{HAUS_SUFFIX}</span>
            </div>
            <small className="hz-hint">
              Every household name ends in {HAUS_SUFFIX}. You write the front part. Up to{" "}
              {HAUS_NAME_MAX_WORDS} words and {HAUS_NAME_MAX_CHARS} characters, so it still reads
              across the cover photo. You are at {nameWords} of {HAUS_NAME_MAX_WORDS} words and{" "}
              {draft.name.length} of {HAUS_NAME_MAX_CHARS} characters.
            </small>
          </div>
        ) : null}

        {isManaged ? (
          <div className="hz-field">
            <label>
              <Mono micro>Property name</Mono>
            </label>
            <input
              ref={firstFieldRef}
              className="hz-input"
              style={{ width: "100%" }}
              value={draft.name}
              placeholder="Sandy Vista"
              onChange={(e) => patch({ name: e.target.value })}
            />
            <small className="hz-hint">
              A managed building is not a household, so it keeps its real name. No suffix.
            </small>
          </div>
        ) : null}

        <div className="hz-field">
          <label>
            <Mono micro>Headline</Mono>
          </label>
          <input
            ref={!suffixed && !isManaged ? firstFieldRef : undefined}
            className="hz-input"
            style={{ width: "100%" }}
            value={draft.headline}
            placeholder={
              isManaged
                ? "Two bedroom in a small building, Montavilla"
                : isForming
                  ? "Two of us, looking for two more"
                  : isOffering
                    ? "Room in a three bedroom on N Failing"
                    : "Looking for a room in November, inner southeast"
            }
            onChange={(e) => patch({ headline: e.target.value })}
          />
          <small className="hz-hint">The one line people read in the feed. This is the only one we need.</small>
        </div>

        <div className="hz-field">
          <label>
            <Mono micro>In your own words</Mono>
          </label>
          <textarea
            className="hz-input"
            style={{ width: "100%" }}
            value={draft.body}
            placeholder={
              isManaged
                ? "What the unit is like, and what is included."
                : "Who you are, how you live, what you are after."
            }
            onChange={(e) => patch({ body: e.target.value })}
          />
        </div>

        <div className="hz-field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>
              <Mono micro>{moneyLabel}</Mono>
            </label>
            <input
              className="hz-input"
              style={{ width: "100%" }}
              value={draft.money}
              placeholder="$900 a month"
              onChange={(e) => patch({ money: e.target.value })}
            />
          </div>
          <div>
            <label>
              <Mono micro>{timingLabel}</Mono>
            </label>
            <input
              className="hz-input"
              style={{ width: "100%" }}
              value={draft.timing}
              placeholder="Nov 1"
              onChange={(e) => patch({ timing: e.target.value })}
            />
          </div>
        </div>

        <ChipInput
          label="Neighborhoods"
          placeholder="Buckman"
          values={draft.areas}
          input={draft.areaInput}
          onInput={(v) => patch({ areaInput: v })}
          onAdd={() => {
            const v = draft.areaInput.trim();
            if (!v || draft.areas.includes(v)) return patch({ areaInput: "" });
            patch({ areas: [...draft.areas, v], areaInput: "" });
          }}
          onRemove={(v) => patch({ areas: draft.areas.filter((a) => a !== v) })}
          hint="Where the place is, or where you are looking. Add as many as you want."
        />

        {isManaged ? (
          <>
            <div className="hz-field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label>
                  <Mono micro>Bedrooms</Mono>
                </label>
                <input
                  className="hz-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={0}
                  value={draft.beds}
                  onChange={(e) => patch({ beds: e.target.value })}
                />
              </div>
              <div>
                <label>
                  <Mono micro>Bathrooms</Mono>
                </label>
                <input
                  className="hz-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={0}
                  step="0.5"
                  value={draft.baths}
                  onChange={(e) => patch({ baths: e.target.value })}
                />
              </div>
              <div>
                <label>
                  <Mono micro>Parking</Mono>
                </label>
                <select
                  className="hz-input"
                  style={{ width: "100%" }}
                  value={draft.parking}
                  onChange={(e) => patch({ parking: e.target.value as ParkingOption | "" })}
                >
                  <option value="">Not saying</option>
                  {PARKING_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {PARKING_LABEL[o]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>
                  <Mono micro>Outdoor space</Mono>
                </label>
                <select
                  className="hz-input"
                  style={{ width: "100%" }}
                  value={draft.outdoor}
                  onChange={(e) => patch({ outdoor: e.target.value as OutdoorOption | "" })}
                >
                  <option value="">Not saying</option>
                  {OUTDOOR_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {OUTDOOR_LABEL[o]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hz-field">
              <label>
                <Mono micro>Affordability</Mono>
              </label>
              <div className="hz-fields">
                {AFFORDABILITY_BADGES.map((b) => (
                  <label className="hz-flag" key={b}>
                    <input
                      type="checkbox"
                      checked={draft.badges.includes(b)}
                      onChange={(e) =>
                        patch({
                          badges: e.target.checked
                            ? [...draft.badges, b]
                            : draft.badges.filter((x) => x !== b),
                        })
                      }
                    />
                    <span>
                      <b style={{ color: "var(--text-hi)" }}>{AFFORDABILITY_BADGE_LABEL[b]}</b>
                    </span>
                  </label>
                ))}
              </div>
              <small className="hz-hint">
                These say yes to more people. They are never used to filter anyone out.
              </small>
            </div>

            <div className="hz-field">
              <label>
                <Mono micro>Listing link</Mono>
              </label>
              <input
                className="hz-input"
                style={{ width: "100%" }}
                value={draft.sourceUrl}
                placeholder="yourrentals.com/sandy-vista-2"
                onChange={(e) => patch({ sourceUrl: e.target.value })}
              />
              <small className="hz-hint">
                Where people apply. The card shows the domain so nobody is guessing who they are
                dealing with.
              </small>
            </div>

            <div className="hz-flag hz-flag--note">
              <span>
                <b style={{ color: "var(--text-hi)" }}>
                  Posting as {managerName || "your company"}
                </b>
                <p>
                  Verified property manager. Managed listings show a verified badge and no
                  household, and they never carry openness or compatibility.
                </p>
              </span>
            </div>
          </>
        ) : null}

        {isOffering ? (
          <div className="hz-field">
            <label>
              <Mono micro>Who lives here</Mono>
            </label>
            <div className="hz-mates">
              {members.map((m) => (
                <span key={m.key} className={m.kind === "PET" ? "hz-mate hz-mate--pet" : "hz-mate"}>
                  <img src={m.photoUrl} alt="" />
                </span>
              ))}
              <label className="hz-mate hz-mate--add" title="Add a housemate who is not on Zaylist">
                <HousingIcon name="add" size={15} />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    void addMember("OFFPLATFORM", e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              <label className="hz-mate hz-mate--pet" title="Add a pet">
                <HousingIcon name="paw" size={13} />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    void addMember("PET", e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {members.length ? (
              <div className="hz-fields" style={{ marginTop: 12 }}>
                {members.map((m, i) => (
                  <div key={m.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      className="hz-input"
                      value={m.name}
                      placeholder={m.kind === "PET" ? "Pet name" : "First name"}
                      onChange={(e) =>
                        setMembers((list) =>
                          list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                        )
                      }
                    />
                    {m.kind === "PET" ? (
                      <input
                        className="hz-input"
                        value={m.species}
                        placeholder="Cat, dog, snake"
                        onChange={(e) =>
                          setMembers((list) =>
                            list.map((x, j) => (j === i ? { ...x, species: e.target.value } : x)),
                          )
                        }
                      />
                    ) : null}
                    <Btn
                      size="sm"
                      kind="outline"
                      onClick={() => setMembers((list) => list.filter((_, j) => j !== i))}
                    >
                      Remove
                    </Btn>
                  </div>
                ))}
              </div>
            ) : null}

            <small className="hz-hint">
              Housemates who are not on Zaylist can still be in the stack. Upload a photo once the
              roommate is okay with it. Pets get a spot too, one size down.
            </small>
          </div>
        ) : null}

        {isLooking ? (
          <>
            <ChipInput
              label="How you live"
              placeholder="Hybrid work"
              values={draft.livingStyle}
              input={draft.livingInput}
              onInput={(v) => patch({ livingInput: v })}
              onAdd={() => {
                const v = draft.livingInput.trim();
                if (!v || draft.livingStyle.includes(v)) return patch({ livingInput: "" });
                patch({ livingStyle: [...draft.livingStyle, v], livingInput: "" });
              }}
              onRemove={(v) => patch({ livingStyle: draft.livingStyle.filter((x) => x !== v) })}
              hint="Your words, not ours. Bakes, sober friendly, up late, quiet mornings."
            />
            <label className="hz-flag">
              <input
                type="checkbox"
                checked={draft.openToHaus}
                onChange={(e) => patch({ openToHaus: e.target.checked })}
              />
              <span>
                <b style={{ color: "var(--text-hi)" }}>Open to forming or joining a HAÜS</b>
                <p>A chip on your post, not a commitment. You can change it whenever.</p>
              </span>
            </label>
          </>
        ) : null}

        {isForming ? (
          <>
            <div className="hz-field">
              <label>
                <Mono micro>How this HAÜS works</Mono>
              </label>
              <div className="hz-ask" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}>
                {FORMING_FLAVORS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    data-selected={draft.flavor === f}
                    onClick={() => patch({ flavor: f })}
                  >
                    <b>{FORMING_FLAVOR_LABEL[f]}</b>
                    <small>
                      {f === "PLACE_IN_MIND"
                        ? "You have a lease or a prospect. Fill the rooms."
                        : "No place yet. Form the household, then hunt as a group."}
                    </small>
                  </button>
                ))}
              </div>
            </div>
            <div className="hz-field">
              <label>
                <Mono micro>Looking for how many more</Mono>
              </label>
              <input
                className="hz-input"
                style={{ width: "100%" }}
                type="number"
                min={0}
                max={12}
                value={draft.seeking}
                placeholder="2"
                onChange={(e) => patch({ seeking: e.target.value })}
              />
              <small className="hz-hint">
                Shows as open spots on the card. Change it as people join.
              </small>
            </div>
          </>
        ) : null}

        {/*
          Cover photo. Called out on its own, because the name sits over it, and
          required on a room or a seeker post: people are deciding who to live
          with, and a post with no pictures gives them nothing to go on.
        */}
        <div className="hz-field">
          <label>
            <Mono micro>Cover photo{photoRequired ? " · required" : ""}</Mono>
          </label>
          <div className="hz-upload__shots">
            {photos[0] ? (
              <span className="hz-upload__shot">
                <img src={photos[0]} alt="" />
              </span>
            ) : null}
            <label className="hz-upload__drop">
              <b>{photos[0] ? "Swap the cover" : "Add the cover photo"}</b>
              <small>
                {isLooking
                  ? "Show what you are like to live with. Things you do: cooking, your bike, the garden, a show you played. The name sits over this one."
                  : "The first photo is the cover, and the name sits over it. Pick the widest, plainest one you have."}{" "}
                Drop a file here or choose one.
              </small>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  void takeFiles(e.target.files, photos.length > 0);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {/* The rest of the gallery. */}
        <div className="hz-field">
          <label>
            <Mono micro>
              {isManaged
                ? "More of the unit"
                : isOffering
                  ? "More of the place"
                  : isForming
                    ? "What you are picturing"
                    : "Your photos"}
            </Mono>
          </label>
          <div className="hz-upload__shots">
            {photos.slice(1).map((p) => (
              <span className="hz-upload__shot" key={p}>
                <img src={p} alt="" />
              </span>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <label className="hz-upload__drop">
                <b>Add another photo</b>
                <small>
                  {isManaged
                    ? "Rooms, the kitchen, the entry."
                    : isOffering
                      ? "The room, the kitchen, the porch."
                      : isForming
                        ? "The kind of place you are after."
                        : "Things you enjoy. Your profile picture already shows your face."}{" "}
                  Up to {MAX_PHOTOS} in total.
                </small>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    void takeFiles(e.target.files, false);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : null}
          </div>
        </div>

        <HousingTagPicker
          type={type}
          value={draft.tags}
          onChange={(tags) => patch({ tags })}
        />

        {/*
          The one hard rule on photos. Zaylist is sex positive everywhere else,
          but housing is where rent-for-sex arrangements get proposed, and that
          is coercion dressed as a listing. Say it plainly at the moment someone
          is choosing what to upload, not buried in terms nobody reads.
        */}
        {!isManaged ? (
          <div className="hz-flag hz-flag--note">
            <span>
              <b style={{ color: "var(--text-hi)" }}>Keep it to the place and your life</b>
              <p>
                No nudity here, and nothing offering or asking for housing in exchange for sex or
                favors. That is not a listing, and it does not belong on this board. Post the room,
                the house, or the things you actually do.
              </p>
            </span>
          </div>
        ) : null}

        <Notice text={notice} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Btn kind="outline" onClick={backToPicker}>
          Back
        </Btn>
        <span style={{ marginLeft: "auto" }} />
        <Btn
          kind="solid"
          disabled={busy || !draft.headline.trim() || (photoRequired && photos.length === 0)}
          onClick={() => void submitPost(type)}
        >
          {busy ? "Working" : "Post to the board"}
        </Btn>
      </div>
    </Sheet>
  );
}

export default HousingComposer;
