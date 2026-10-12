import type { ReactNode } from "react";
import { useId } from "react";
import { SearchX, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ds";
import "./BrowseContinuity.css";

/** Shared anatomy adapted from cnippet-dev's Empty on 21st.dev.
 * https://21st.dev/@cnippet-dev/components/cnippet-empty
 * Keep our existing primitive, token styling, and semantic heading/action slots. */
export default function BrowseStatus({ title, description, error = false, onAction, actionLabel, children }: {
  title: string; description: string; error?: boolean; onAction?: () => void; actionLabel?: string; children?: ReactNode;
}) {
  const id = useId();
  return <section className="browse-status" data-slot="empty" aria-labelledby={id}>
    <div data-slot="empty-header" role={error ? "alert" : "status"}>
      <div className="browse-status__icon" aria-hidden="true">{error ? <TriangleAlert size={26} /> : <SearchX size={26} />}</div>
      <h3 id={id}>{title}</h3><p>{description}</p>
    </div>
    {(onAction || children) && <div className="browse-status__actions" data-slot="empty-content">
      {onAction && <Button variant="neon" accent="cyan" onClick={onAction}>{actionLabel || "Try again"}</Button>}
      {children}
    </div>}
  </section>;
}
