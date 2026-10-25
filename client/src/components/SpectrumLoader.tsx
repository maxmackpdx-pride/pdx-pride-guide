import { useEffect, useState } from "react";
import { clearPwaCaches } from "@/lib/pwa";

type Variant = "ring" | "dots" | "bar" | "full";

const STUCK_AFTER_MS = 12_000;

function reloadFresh() {
  // Safari can leave worker cleanup pending; never let it block the reload.
  const timer = window.setTimeout(() => window.location.reload(), 2_500);
  void clearPwaCaches().catch(() => {}).finally(() => {
    window.clearTimeout(timer);
    window.location.reload();
  });
}

export default function SpectrumLoader({
  variant = "ring",
  label = "Loading",
  className = "",
}: {
  variant?: Variant;
  label?: string;
  className?: string;
}) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    if (variant !== "full") return;
    // A route that has been "loading" this long is not loading: offer a way out.
    const timer = window.setTimeout(() => setStuck(true), STUCK_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [variant]);

  if (variant === "full") {
    return (
      <div className={`spectrum-loader spectrum-loader--full ${className}`.trim()} role="status" aria-label={label}>
        <div className="spectrum-loader__ring" aria-hidden="true" />
        <div className="spectrum-loader__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="spectrum-loader__bar" aria-hidden="true">
          <div className="spectrum-loader__bar-fill" />
        </div>
        {stuck ? (
          <div className="spectrum-loader__stuck">
            <p>This is taking longer than usual.</p>
            <button type="button" onClick={reloadFresh}>Reload page</button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`spectrum-loader ${className}`.trim()} role="status" aria-label={label}>
      {variant === "ring" && <div className="spectrum-loader__ring" aria-hidden="true" />}
      {variant === "dots" && (
        <div className="spectrum-loader__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {variant === "bar" && (
        <div className="spectrum-loader__bar" aria-hidden="true">
          <div className="spectrum-loader__bar-fill" />
        </div>
      )}
    </div>
  );
}