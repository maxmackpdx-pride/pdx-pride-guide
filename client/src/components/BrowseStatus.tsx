import type { ReactNode } from "react";
import { useId } from "react";
import { Button } from "@/components/ds";
import "./BrowseContinuity.css";

/** Shared empty/error anatomy, inspired by uiable's 21st Empty Background. */
export default function BrowseStatus({ title, description, error = false, onAction, actionLabel, children }: {
  title: string; description: string; error?: boolean; onAction?: () => void; actionLabel?: string; children?: ReactNode;
}) {
  const id = useId();
  return <section className="browse-status" aria-labelledby={id}>
    <div role={error ? "alert" : "status"}>
      <h3 id={id}>{title}</h3><p>{description}</p>
    </div>
    {(onAction || children) && <div className="browse-status__actions">
      {onAction && <Button variant="neon" accent="cyan" onClick={onAction}>{actionLabel || "Try again"}</Button>}
      {children}
    </div>}
  </section>;
}
