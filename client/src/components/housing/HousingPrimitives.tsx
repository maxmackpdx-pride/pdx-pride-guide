/**
 * Small shared primitives for the HAUSING board.
 * Ported from docs/design-handoff-hausing/haus-ui.jsx.
 */
import type { CSSProperties, ReactNode } from "react";
import { Button } from "@/components/ds";
import { HOUSING_ACCENT_VAR, type HousingTrust, type HousingType } from "@shared/housing";

/** Mono kicker text. The utility layer's third voice. */
export function Mono({
  children,
  accent,
  micro,
  style,
}: {
  children: ReactNode;
  accent?: boolean;
  micro?: boolean;
  style?: CSSProperties;
}) {
  const cls = `hz-mono${accent ? " hz-mono--accent" : ""}${micro ? " hz-mono--micro" : ""}`;
  return (
    <span className={cls} style={style}>
      {children}
    </span>
  );
}

export function LiveDot() {
  return <i className="hz-dot" aria-hidden="true" />;
}

export type ChipTone = "" | "accent" | "solid" | "haus" | "full";

export function Chip({
  children,
  tone = "",
  onClick,
  title,
}: {
  children: ReactNode;
  tone?: ChipTone;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}) {
  const cls = `hz-chip${tone ? ` hz-chip--${tone}` : ""}${onClick ? " hz-chip--btn" : ""}`;
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} title={title}>
        {children}
      </button>
    );
  }
  return (
    <span className={cls} title={title}>
      {children}
    </span>
  );
}

/**
 * The design system Button, pointed at the surface accent instead of root acid.
 * That is this wrapper's only job.
 */
export function Btn({
  children,
  kind = "neon",
  size = "md",
  onClick,
  block,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  kind?: "neon" | "solid" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: (e: React.MouseEvent) => void;
  block?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <Button
      variant={kind}
      size={size}
      block={block}
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={{ "--_c": "var(--hz-accent)" } as CSSProperties}
    >
      {children}
    </Button>
  );
}

/** The mono kicker at the top of every card. */
export function TypeTitle({ label }: { label: string }) {
  return <div className="hz-type">{label}</div>;
}

/**
 * Community context. Participation the community already generated, shown as
 * plain facts. Never a score, never a filter, never an input to ordering.
 */
export function Trust({ data }: { data?: HousingTrust | null }) {
  if (!data) return null;
  const bits: string[] = [];
  if (data.mutualConnections) bits.push(`${data.mutualConnections} mutual connections`);
  if (data.eventsTogether) bits.push(`${data.eventsTogether} events together`);
  if (data.memberSince) bits.push(`Member since ${data.memberSince}`);
  if (data.leaseholderVerified) bits.push("Leaseholder verified");
  if (data.propertyManagerVerified) bits.push("Property manager verified");
  if (!bits.length) return null;
  return (
    <div className="hz-trust hz-mono hz-mono--micro">
      {bits.map((b) => (
        <span key={b}>
          <i />
          {b}
        </span>
      ))}
    </div>
  );
}

/** Label above, display value below. Used in the card's 3 column facts grid. */
export function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="hz-fact">
      <Mono micro>{label}</Mono>
      <b>{value}</b>
    </div>
  );
}

/** Bordered tile in the detail view's auto-fit grid. */
export function Tile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="hz-tile">
      <Mono micro>{label}</Mono>
      <b>{value}</b>
    </div>
  );
}

/** Label left, value right, hairline underneath. */
export function Row({ label, value }: { label: ReactNode; value?: ReactNode }) {
  return (
    <div className="hz-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export function SectionTitle({
  kicker,
  children,
  right,
}: {
  kicker?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="hz-sectionhead">
      <div className="hz-sectionhead__main">
        {kicker ? (
          <div className="hz-sectionhead__kicker">
            <Mono accent>{kicker}</Mono>
          </div>
        ) : null}
        <div className="hz-secttl">{children}</div>
      </div>
      {right ? <div className="hz-sectionhead__right">{right}</div> : null}
    </div>
  );
}

/** The verified pill that stands where a household would be on a managed listing. */
export function PropertyManagerBadge({ children }: { children: ReactNode }) {
  return <span className="hz-pmbadge">{children}</span>;
}

/**
 * Accent binding for a post-type subtree. Sets all three custom properties the
 * board reads. Any element using this MUST also carry `.pdx-glass-rebind` or the
 * accent silently falls back to root cyan.
 */
export function accentStyle(type: HousingType): CSSProperties {
  const c = HOUSING_ACCENT_VAR[type];
  return { "--c": c, "--_c": c, "--hz-accent": c } as CSSProperties;
}

export function CloseSeam({ line, url }: { line: string; url: string }) {
  return (
    <>
      <div className="pdx-seam" aria-hidden="true" />
      <div className="hz-close">
        <Mono>{line}</Mono>
        <Mono micro>{url}</Mono>
      </div>
    </>
  );
}
