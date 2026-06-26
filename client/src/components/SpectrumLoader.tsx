type Variant = "ring" | "dots" | "bar";

export default function SpectrumLoader({
  variant = "ring",
  label = "Loading",
  className = "",
}: {
  variant?: Variant;
  label?: string;
  className?: string;
}) {
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