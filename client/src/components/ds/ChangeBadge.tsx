/** Shared “what changed” chip for saved posts. Mount on HubFeedCard, not housing-only. */
export function ChangeBadge({
  label,
  className,
}: {
  label?: string | null;
  className?: string;
}) {
  const text = String(label || "").trim();
  if (!text) return null;
  return (
    <span
      className={`change-badge pdx-glass-rebind${className ? ` ${className}` : ""}`}
      title="What changed on a post you follow"
    >
      {text}
    </span>
  );
}
